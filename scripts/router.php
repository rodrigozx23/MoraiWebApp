<?php
/**
 * Router para la vista previa local con el servidor integrado de PHP
 * (imita las reglas de deploy/htaccess, que php -S no lee):
 *
 *   php -S 127.0.0.1:8090 -t dist scripts/router.php
 */
$root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$path = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if (preg_match('#^/api/demo/?$#', $path)) {
    require $root . '/api/demo.php';
    return true;
}
if (preg_match('#^/contacto/?$#', $path)) {
    require $root . '/contacto.php';
    return true;
}

$notFound = function () use ($root) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    readfile($root . '/404.html');
    return true;
};

// Igual que en Hostinger: nada de api/ (salvo demo), .git ni archivos ocultos.
if (str_starts_with($path, '/api/') || preg_match('#/\.#', $path) || str_ends_with($path, '.php')) {
    return $notFound();
}
if ($path === '/') {
    readfile($root . '/index.html');
    return true;
}
if (is_file($root . $path)) {
    return false; // archivo estático
}
$html = $root . rtrim($path, '/') . '.html';
if (is_file($html)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($html);
    return true;
}
return $notFound();
