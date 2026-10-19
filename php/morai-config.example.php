<?php
/**
 * Configuración privada del formulario (contiene la contraseña SMTP).
 *
 * En Hostinger: copia este archivo como  morai-config.php  en la carpeta que
 * CONTIENE a public_html (por ejemplo /home/uXXXX/domains/moraitechnologies.com/),
 * nunca dentro de public_html ni en el repositorio.
 */
return [
    // Hostinger SMTP: 465 + SSL (alternativa: puerto 587 con 'tls' = STARTTLS).
    'smtp_host' => 'smtp.hostinger.com',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => 'no-reply@moraitechnologies.com',
    'smtp_pass' => 'CONTRASEÑA_DEL_BUZON',

    // El remitente debe ser el mismo buzón autenticado. El correo del visitante
    // nunca va como remitente: se usa como Reply-To.
    'mail_from' => 'no-reply@moraitechnologies.com',
    'mail_from_name' => 'MORAI Web',
    // Destino de los leads (varios separados por coma).
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
