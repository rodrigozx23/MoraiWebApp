<?php
/**
 * POST /api/demo · recibe el formulario "Solicitar demo".
 * Acepta JSON (modal con JavaScript) o formulario clásico (sin JavaScript).
 */

declare(strict_types=1);
require_once __DIR__ . '/lib.php';

header('X-Robots-Tag: noindex');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    morai_json(405, ['ok' => false, 'message' => 'Método no permitido.']);
}

$json = morai_wants_json();

/** Respuesta para el formulario clásico: vuelve a mostrar /contacto con errores y valores. */
function morai_render_contact(int $status, array $values, array $errors): never
{
    global $morai_form;
    $morai_form = ['values' => $values, 'errors' => $errors];
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    require dirname(__DIR__) . '/contacto.php';
    exit;
}

function morai_ok(bool $json): never
{
    if ($json) morai_json(200, ['ok' => true, 'redirect' => '/gracias']);
    header('Location: /gracias', true, 303);
    exit;
}

$body = morai_read_body();
if ($body === null) {
    $message = 'Solicitud inválida.';
    if ($json) morai_json(400, ['ok' => false, 'message' => $message]);
    morai_render_contact(400, [], ['_' => $message]);
}

$ip = morai_client_ip();

if (!morai_rate_limit_ok($ip)) {
    $message = 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.';
    if ($json) morai_json(429, ['ok' => false, 'message' => $message]);
    morai_render_contact(429, $body, ['_' => $message]);
}

// Anti-bot: respondemos "ok" para no dar pistas, pero no guardamos ni enviamos nada.
$bot = morai_is_bot($body);
if ($bot !== null) {
    morai_log('warn', "Envío descartado como bot ($bot) ip=$ip");
    morai_ok($json);
}

[$data, $errors] = morai_validate($body);
if ($errors) {
    $message = 'Revisa los campos marcados.';
    if ($json) morai_json(400, ['ok' => false, 'message' => $message, 'errors' => $errors]);
    morai_render_contact(400, $body, ['_' => $message] + $errors);
}

$lead = ['id' => morai_uuid(), 'createdAt' => date('c')] + $data + [
    'origen' => substr(morai_clean(morai_str($body['origen'] ?? ($_SERVER['HTTP_REFERER'] ?? ''))), 0, 200),
    'ip' => $ip,
    'userAgent' => substr(morai_clean((string) ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 300),
];

$saved = morai_save_lead($lead);
if (!$saved) morai_log('error', "No se pudo guardar el lead {$lead['id']} en " . morai_data_dir());

$sent = morai_send_lead_email($lead);

if (!$saved && !$sent) {
    $message = 'No pudimos registrar tu solicitud. Escríbenos directamente o inténtalo más tarde.';
    if ($json) morai_json(500, ['ok' => false, 'message' => $message]);
    morai_render_contact(500, $body, ['_' => $message]);
}

// Confirmación al cliente (solo si el lead quedó registrado).
$confirmed = morai_send_confirmation($lead);

morai_log('info', sprintf('Lead %s (%s) guardado=%s correo=%s confirmacion=%s', $lead['id'], $lead['producto'],
    $saved ? 'si' : 'no', $sent ? 'si' : 'no', $confirmed ? 'si' : 'no'));
morai_ok($json);
