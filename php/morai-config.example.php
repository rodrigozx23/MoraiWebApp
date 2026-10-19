<?php
/**
 * Configuración privada del formulario (contiene la contraseña SMTP).
 *
 * En Hostinger: copia este archivo como  morai-config.php  en la carpeta que
 * CONTIENE a public_html (por ejemplo /home/uXXXX/domains/tudominio.pe/),
 * nunca dentro de public_html ni en el repositorio.
 */
return [
    // Servidor SMTP del buzón creado en hPanel → Correos.
    'smtp_host' => 'smtp.hostinger.com',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',          // 'ssl' para 465, 'tls' para 587
    'smtp_user' => 'contacto@tudominio.pe',
    'smtp_pass' => 'CONTRASEÑA_DEL_BUZON',

    // Remitente (el mismo buzón) y destino de los leads (varios separados por coma).
    'mail_from' => 'contacto@tudominio.pe',
    'mail_from_name' => 'MORAI Web',
    'mail_to' => 'rodrigozx23@gmail.com',

    // Carpeta para leads.jsonl, eventos.log y el rate limit.
    // Vacío = carpeta "morai-data" junto a public_html (fuera del acceso web).
    'data_dir' => '',

    // Anti-abuso
    'rate_limit_max' => 5,           // envíos por IP...
    'rate_limit_window_min' => 15,   // ...cada 15 minutos
    'min_form_seconds' => 3,         // tiempo mínimo para llenar el formulario
    'trust_forwarded_for' => false,  // true solo si hay un proxy/CDN delante (p. ej. Cloudflare)
];
