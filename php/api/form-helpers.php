<?php
/**
 * Ayudantes para contacto.php: rellenan el formulario con ?producto=&plan=
 * o con los valores y errores de un envío sin JavaScript (ver demo.php).
 */

declare(strict_types=1);

function morai_form_init(): void
{
    global $morai_form;
    if (isset($morai_form)) return; // ya lo definió demo.php
    $morai_form = [
        'values' => [
            'producto' => is_string($_GET['producto'] ?? null) ? $_GET['producto'] : '',
            'plan' => is_string($_GET['plan'] ?? null) ? $_GET['plan'] : '',
        ],
        'errors' => [],
    ];
}

function morai_fv(string $name): string
{
    global $morai_form;
    $v = $morai_form['values'][$name] ?? '';
    return is_scalar($v) ? (string) $v : '';
}

/** Valor escapado para HTML. */
function morai_v(string $name): string
{
    return htmlspecialchars(morai_fv($name), ENT_QUOTES, 'UTF-8');
}

/** Mensaje de error escapado (vacío si no hay). */
function morai_e(string $name): string
{
    global $morai_form;
    return htmlspecialchars((string) ($morai_form['errors'][$name] ?? ''), ENT_QUOTES, 'UTF-8');
}

function morai_invalid(string $name): string
{
    return morai_e($name) !== '' ? ' aria-invalid="true"' : '';
}

function morai_sel(string $name, string $value): string
{
    return morai_fv($name) === $value ? ' selected' : '';
}

function morai_checked(string $name): string
{
    return in_array(morai_fv($name), ['on', 'true', '1'], true) ? ' checked' : '';
}
