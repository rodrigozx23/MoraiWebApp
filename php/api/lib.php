<?php
/**
 * MORAI · funciones del formulario "Solicitar demo".
 * Configuración, validación, anti-abuso, respaldo de leads y envío por SMTP.
 */

declare(strict_types=1);

date_default_timezone_set('America/Lima');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

/**
 * Busca morai-config.php (con la clave SMTP) fuera de public_html.
 * Orden: variable de entorno MORAI_CONFIG, carpeta superior a public_html,
 * y como último recurso api/config.local.php.
 */
function morai_config(): array
{
    static $config = null;
    if ($config !== null) return $config;

    $docRoot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__)), '/\\');
    $candidates = array_filter([
        getenv('MORAI_CONFIG') ?: null,
        dirname($docRoot) . '/morai-config.php',
        __DIR__ . '/config.local.php',
    ]);

    $loaded = [];
    foreach ($candidates as $file) {
        if (is_file($file)) {
            $value = require $file;
            if (is_array($value)) {
                $loaded = $value;
                break;
            }
        }
    }

    $config = array_merge([
        'smtp_host' => '',
        'smtp_port' => 465,
        'smtp_secure' => 'ssl', // ssl (465) | tls (587, STARTTLS) | none (solo pruebas)
        'smtp_user' => '',
        'smtp_pass' => '',
        'mail_from' => '',
        'mail_from_name' => 'Web',
        'mail_to' => '',
        'mail_bcc' => '',
        'send_confirmation' => true,
        'data_dir' => '',
        'rate_limit_max' => 5,
        'rate_limit_window_min' => 15,
        'min_form_seconds' => 3,
        'trust_forwarded_for' => false,
    ], $loaded);

    if ($config['data_dir'] === '') {
        $config['data_dir'] = dirname($docRoot) . '/morai-data';
    }
    return $config;
}

function morai_site(): array
{
    static $site = null;
    return $site ??= require __DIR__ . '/site-data.php';
}

// ---------------------------------------------------------------------------
// Carpeta de datos (fuera de public_html) y registro de eventos
// ---------------------------------------------------------------------------

function morai_data_dir(): string
{
    static $dir = null;
    if ($dir !== null) return $dir;

    $preferred = rtrim(morai_config()['data_dir'], '/\\');
    if ((is_dir($preferred) || @mkdir($preferred, 0750, true)) && is_writable($preferred)) {
        return $dir = $preferred;
    }

    // Respaldo dentro de public_html, protegido contra acceso web.
    $fallback = __DIR__ . '/_data';
    if (!is_dir($fallback)) @mkdir($fallback, 0750, true);
    if (!is_file($fallback . '/.htaccess')) {
        @file_put_contents($fallback . '/.htaccess', "Require all denied\nDeny from all\n");
    }
    return $dir = $fallback;
}

function morai_log(string $level, string $message): void
{
    $line = sprintf("[%s] %s %s\n", date('c'), strtoupper($level), $message);
    error_log('[morai] ' . trim($line));
    @file_put_contents(morai_data_dir() . '/eventos.log', $line, FILE_APPEND | LOCK_EX);
}

// ---------------------------------------------------------------------------
// Petición y respuesta
// ---------------------------------------------------------------------------

function morai_client_ip(): string
{
    if (morai_config()['trust_forwarded_for'] && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return trim(explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

function morai_wants_json(): bool
{
    $type = (string) ($_SERVER['CONTENT_TYPE'] ?? '');
    $accept = (string) ($_SERVER['HTTP_ACCEPT'] ?? '');
    return str_contains($type, 'application/json') || str_contains($accept, 'application/json');
}

/** Devuelve el cuerpo como array, o null si es inválido o muy grande. */
function morai_read_body(int $maxBytes = 20480): ?array
{
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $maxBytes) return null;
    if (str_contains((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
        $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
        if ($raw === false || strlen($raw) > $maxBytes) return null;
        $data = json_decode($raw, true);
        return is_array($data) ? $data : null;
    }
    return $_POST;
}

function morai_json(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ---------------------------------------------------------------------------
// Validación (mismas reglas que public/js/main.js)
// ---------------------------------------------------------------------------

function morai_len(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : (int) preg_match_all('/./us', $s);
}

function morai_str($value): string
{
    return is_scalar($value) ? (string) $value : '';
}

/** Quita caracteres de control. En campos de una línea también los saltos de línea. */
function morai_clean(string $s, bool $multiline = false): string
{
    if (!preg_match('//u', $s)) $s = ''; // UTF-8 inválido
    $pattern = $multiline ? '/[\x00-\x08\x0B-\x1F\x7F]+/u' : '/[\x00-\x1F\x7F]+/u';
    return trim((string) preg_replace($pattern, ' ', $s));
}

/** @return array{0: array, 1: array} [datos limpios, errores por campo] */
function morai_validate(array $in): array
{
    $site = morai_site();
    $errors = [];
    $d = [
        'nombre' => morai_clean(morai_str($in['nombre'] ?? '')),
        'email' => morai_clean(morai_str($in['email'] ?? '')),
        'telefono' => morai_clean(morai_str($in['telefono'] ?? '')),
        'empresa' => (string) preg_replace('/\s+/u', ' ', morai_clean(morai_str($in['empresa'] ?? ''))),
        'producto' => morai_clean(morai_str($in['producto'] ?? '')),
        'plan' => morai_clean(morai_str($in['plan'] ?? '')),
        'mensaje' => morai_clean(morai_str($in['mensaje'] ?? ''), true),
    ];
    $consent = $in['consentimiento'] ?? false;
    $d['consentimiento'] = $consent === true || in_array($consent, ['on', 'true', '1', 1], true);

    if (morai_len($d['nombre']) < 2) $errors['nombre'] = 'Ingresa tu nombre.';
    elseif (morai_len($d['nombre']) > 80) $errors['nombre'] = 'Máximo 80 caracteres.';

    if (morai_len($d['email']) > 120 || !filter_var($d['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Ingresa un correo válido.';
    }
    if ($d['telefono'] !== '' && !preg_match('/^\+?[\d\s()-]{6,25}$/', $d['telefono'])) {
        $errors['telefono'] = 'Ingresa un teléfono válido.';
    }
    if (morai_len($d['empresa']) > 120) $errors['empresa'] = 'Máximo 120 caracteres.';
    if (!array_key_exists($d['producto'], $site['products'])) $errors['producto'] = 'Elige un producto.';
    if ($d['plan'] !== '' && !in_array($d['plan'], $site['plans'], true)) $errors['plan'] = 'Plan inválido.';
    if (morai_len($d['mensaje']) > 2000) $errors['mensaje'] = 'Máximo 2000 caracteres.';
    if (!$d['consentimiento']) $errors['consentimiento'] = 'Debes aceptar la política de privacidad.';

    return [$d, $errors];
}

// ---------------------------------------------------------------------------
// Anti-abuso
// ---------------------------------------------------------------------------

/** true si el envío parece de un bot (campo trampa lleno o enviado demasiado rápido). */
function morai_is_bot(array $in): ?string
{
    if (trim(morai_str($in['website'] ?? '')) !== '') return 'honeypot';
    $ts = (float) morai_str($in['ts'] ?? '');
    $minMs = (float) morai_config()['min_form_seconds'] * 1000;
    if ($ts > 0 && (microtime(true) * 1000 - $ts) < $minMs) return 'demasiado rápido';
    return null;
}

/** Registra el intento y devuelve false si la IP superó el límite. */
function morai_rate_limit_ok(string $ip): bool
{
    $config = morai_config();
    $max = (int) $config['rate_limit_max'];
    $window = (int) $config['rate_limit_window_min'] * 60;
    if ($max <= 0) return true;

    $dir = morai_data_dir() . '/ratelimit';
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    $file = $dir . '/' . hash('sha256', $ip) . '.json';

    $fp = @fopen($file, 'c+');
    if (!$fp) return true; // si no se puede registrar, no bloqueamos al usuario
    flock($fp, LOCK_EX);
    $now = time();
    $hits = json_decode((string) stream_get_contents($fp), true);
    $hits = array_values(array_filter(is_array($hits) ? $hits : [], fn($t) => is_int($t) && $t > $now - $window));
    $allowed = count($hits) < $max;
    if ($allowed) $hits[] = $now;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($hits));
    flock($fp, LOCK_UN);
    fclose($fp);

    // Limpieza ocasional de archivos viejos.
    if (random_int(1, 50) === 1) {
        foreach (glob($dir . '/*.json') ?: [] as $f) {
            if (filemtime($f) < $now - $window) @unlink($f);
        }
    }
    return $allowed;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

function morai_save_lead(array $lead): bool
{
    $line = json_encode($lead, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    return @file_put_contents(morai_data_dir() . '/leads.jsonl', $line, FILE_APPEND | LOCK_EX) !== false;
}

// ---------------------------------------------------------------------------
// Correo (cliente SMTP mínimo: SSL 465 o STARTTLS 587, AUTH LOGIN)
// ---------------------------------------------------------------------------

function morai_smtp_configured(): bool
{
    $c = morai_config();
    return $c['smtp_host'] !== '' && $c['mail_to'] !== '';
}

function morai_encode_header(string $s): string
{
    return preg_match('/^[\x20-\x7E]*$/', $s) ? $s : '=?UTF-8?B?' . base64_encode($s) . '?=';
}

function morai_address(string $email, string $name = ''): string
{
    if ($name === '') return '<' . $email . '>';
    $name = str_replace(['"', '\\'], '', $name);
    return (preg_match('/^[\x20-\x7E]*$/', $name) ? '"' . $name . '"' : morai_encode_header($name)) . ' <' . $email . '>';
}

function morai_h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function morai_from_address(): string
{
    $c = morai_config();
    return $c['mail_from'] !== '' ? $c['mail_from'] : $c['smtp_user'];
}

/** Lista de correos válidos a partir de un texto separado por comas. */
function morai_email_list(string $value): array
{
    $list = array_map('trim', explode(',', $value));
    return array_values(array_filter($list, fn($a) => filter_var($a, FILTER_VALIDATE_EMAIL)));
}

/** Destinatarios internos de los leads (mail_to, varios separados por coma). */
function morai_lead_recipients(): array
{
    return morai_email_list((string) morai_config()['mail_to']);
}

/** Copia oculta del aviso de leads (mail_bcc). No aparece en las cabeceras. */
function morai_lead_bcc(): array
{
    return array_values(array_diff(morai_email_list((string) morai_config()['mail_bcc']), morai_lead_recipients()));
}

/** Arma un mensaje MIME (texto + HTML) listo para enviar por SMTP. */
function morai_mime(array $to, array $replyTo, string $subject, string $text, string $html): string
{
    $from = morai_from_address();
    $boundary = 'morai_' . bin2hex(random_bytes(12));
    $domain = substr(strrchr($from, '@') ?: '@localhost', 1);

    $headers = [
        'Date: ' . date('r'),
        'From: ' . morai_address($from, (string) morai_config()['mail_from_name']),
        'To: ' . implode(', ', array_map(fn($a) => '<' . $a . '>', $to)),
        'Reply-To: ' . morai_address($replyTo[0], $replyTo[1] ?? ''),
        'Subject: ' . morai_encode_header($subject),
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $domain . '>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];
    $part = fn(string $type, string $body) => "--$boundary\r\nContent-Type: $type; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . rtrim(chunk_split(base64_encode($body), 76, "\r\n")) . "\r\n";

    return implode("\r\n", $headers) . "\r\n\r\n"
        . $part('text/plain', $text) . $part('text/html', $html) . "--$boundary--\r\n";
}

/**
 * Aviso interno del lead: va a mail_to y "Responder" contesta al cliente.
 * @return array{0: string, 1: string[], 2: string} [remitente, destinatarios, mensaje completo]
 */
function morai_build_email(array $lead): array
{
    $site = morai_site();
    $to = morai_lead_recipients();
    $product = $site['products'][$lead['producto']] ?? $lead['producto'];

    $rows = [
        'Producto' => $product,
        'Plan' => $lead['plan'] ?: '—',
        'Nombre' => $lead['nombre'],
        'Correo' => $lead['email'],
        'Teléfono' => $lead['telefono'] ?: '—',
        'Empresa' => $lead['empresa'] ?: '—',
        'Mensaje' => $lead['mensaje'] ?: '—',
        'Página de origen' => $lead['origen'] ?: '—',
        'Fecha' => $lead['createdAt'],
        'ID' => $lead['id'],
    ];
    $text = '';
    $html = '<h2 style="font-family:sans-serif">Nueva solicitud de demo</h2><table cellpadding="6" style="font-family:sans-serif;border-collapse:collapse">';
    foreach ($rows as $k => $v) {
        $text .= "$k: $v\n";
        $html .= '<tr><th align="left" style="border-bottom:1px solid #eee">' . morai_h($k) . '</th>'
            . '<td style="border-bottom:1px solid #eee;white-space:pre-wrap">' . morai_h((string) $v) . '</td></tr>';
    }
    $html .= '</table>';

    $subject = sprintf('[%s] Nueva solicitud de demo: %s - %s', $site['name'], $product, $lead['nombre']);
    $message = morai_mime($to, [$lead['email'], $lead['nombre']], $subject, $text, $html);
    // La copia oculta solo se agrega como destinatario SMTP (RCPT TO), nunca en To/Cc.
    return [morai_from_address(), array_merge($to, morai_lead_bcc()), $message];
}

/**
 * Confirmación al cliente, desde el buzón no-reply. "Responder" va al equipo
 * (primer correo de mail_to). Para no servir de relé de spam, el texto es fijo:
 * solo incluye el nombre y el producto, nunca el mensaje que escribió.
 * @return array{0: string, 1: string[], 2: string}
 */
function morai_build_confirmation(array $lead): array
{
    $site = morai_site();
    $team = morai_lead_recipients()[0] ?? morai_from_address();
    $product = $site['products'][$lead['producto']] ?? $lead['producto'];
    $name = $lead['nombre'];

    $subject = sprintf('Recibimos tu solicitud - %s', $site['name']);
    $text = "Hola $name:\n\n"
        . "Gracias por escribirnos. Recibimos tu solicitud de demo de $product.\n"
        . "Un especialista de {$site['name']} se pondrá en contacto contigo en menos de 24 horas hábiles.\n\n"
        . "Si necesitas agregar algo, responde a este correo.\n\n"
        . "Equipo {$site['name']}\n";
    $html = '<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px">'
        . '<h2 style="color:#0f172a">¡Gracias, ' . morai_h($name) . '!</h2>'
        . '<p>Recibimos tu solicitud de demo de <strong>' . morai_h((string) $product) . '</strong>.</p>'
        . '<p>Un especialista de ' . morai_h($site['name']) . ' se pondrá en contacto contigo en menos de 24 horas hábiles.</p>'
        . '<p>Si necesitas agregar algo, responde a este correo.</p>'
        . '<p style="color:#64748b">Equipo ' . morai_h($site['name']) . '</p></div>';

    $message = morai_mime([$lead['email']], [$team, $site['name']], $subject, $text, $html);
    return [morai_from_address(), [$lead['email']], $message];
}


/** Envía el mensaje por SMTP. Lanza RuntimeException si algo falla. */
function morai_smtp_send(string $from, array $to, string $message): void
{
    $c = morai_config();
    if (!$to) throw new RuntimeException('MAIL_TO no tiene direcciones válidas.');
    if (!filter_var($from, FILTER_VALIDATE_EMAIL)) throw new RuntimeException('mail_from/smtp_user no es un correo válido.');

    $secure = strtolower((string) $c['smtp_secure']);
    $host = (string) $c['smtp_host'];
    $port = (int) $c['smtp_port'];
    $context = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
    $fp = @stream_socket_client(($secure === 'ssl' ? 'ssl://' : 'tcp://') . "$host:$port", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
    if (!$fp) throw new RuntimeException("No se pudo conectar a $host:$port ($errstr)");
    stream_set_timeout($fp, 15);

    $read = function () use ($fp): string {
        $response = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $response .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        return $response;
    };
    $cmd = function (?string $command, array $expect) use ($fp, $read): string {
        if ($command !== null) fwrite($fp, $command . "\r\n");
        $response = $read();
        if (!in_array((int) substr($response, 0, 3), $expect, true)) {
            $shown = $command !== null && str_starts_with($command, 'AUTH') ? 'AUTH' : ($command ?? 'conexión');
            throw new RuntimeException("SMTP rechazó «{$shown}»: " . trim($response ?: 'sin respuesta'));
        }
        return $response;
    };

    try {
        $cmd(null, [220]);
        $ehlo = preg_replace('/[^A-Za-z0-9.-]/', '', (string) (gethostname() ?: 'localhost')) ?: 'localhost';
        $cmd("EHLO $ehlo", [250]);
        if ($secure === 'tls') {
            $cmd('STARTTLS', [220]);
            $method = STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | (defined('STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT') ? STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT : 0);
            if (!stream_socket_enable_crypto($fp, true, $method)) throw new RuntimeException('No se pudo iniciar TLS.');
            $cmd("EHLO $ehlo", [250]);
        }
        if ($c['smtp_user'] !== '') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode((string) $c['smtp_user']), [334]);
            $cmd(base64_encode((string) $c['smtp_pass']), [235]);
        }
        $cmd("MAIL FROM:<$from>", [250]);
        foreach ($to as $rcpt) $cmd("RCPT TO:<$rcpt>", [250, 251]);
        $cmd('DATA', [354]);
        // Dot-stuffing: las líneas que empiezan con "." se duplican.
        fwrite($fp, preg_replace('/^\./m', '..', $message) . "\r\n.\r\n");
        $cmd(null, [250]);
        try { $cmd('QUIT', [221]); } catch (RuntimeException $e) { /* ya se envió */ }
    } finally {
        fclose($fp);
    }
}

/** Nunca lanza: devuelve true si se envió. Registra avisos y errores. */
function morai_send_lead_email(array $lead): bool
{
    if (!morai_smtp_configured()) {
        morai_log('warn', "SMTP no configurado (morai-config.php). Lead {$lead['id']} guardado sin enviar correo.");
        return false;
    }
    try {
        [$from, $to, $message] = morai_build_email($lead);
        morai_smtp_send($from, $to, $message);
        return true;
    } catch (Throwable $e) {
        morai_log('error', "Error al enviar el lead {$lead['id']}: " . $e->getMessage());
        return false;
    }
}

/** Confirmación al cliente. Nunca lanza; si falla solo se registra. */
function morai_send_confirmation(array $lead): bool
{
    if (!morai_smtp_configured() || !morai_config()['send_confirmation']) return false;
    try {
        [$from, $to, $message] = morai_build_confirmation($lead);
        morai_smtp_send($from, $to, $message);
        return true;
    } catch (Throwable $e) {
        morai_log('error', "Error al enviar la confirmación del lead {$lead['id']}: " . $e->getMessage());
        return false;
    }
}

function morai_uuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}
