const { z } = require('zod');
const site = require('../../config/site');

const PRODUCT_KEYS = Object.keys(site.products);
const PLAN_KEYS = Object.values(site.pricing)
  .filter(Array.isArray)
  .flat()
  .map((plan) => plan.key);

// Quita saltos de línea y caracteres de control (evita inyección en cabeceras del correo).
const singleLine = (max) =>
  z
    .string({ required_error: 'Este campo es obligatorio.', invalid_type_error: 'Valor inválido.' })
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim())
    .pipe(z.string().max(max, `Máximo ${max} caracteres.`));

const optionalText = (max) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? '' : v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]+/g, ' ').trim()))
    .pipe(z.string().max(max, `Máximo ${max} caracteres.`));

const demoSchema = z.object({
  nombre: singleLine(80).pipe(z.string().min(2, 'Ingresa tu nombre.')),
  email: singleLine(120).pipe(z.string().email('Ingresa un correo válido.')),
  telefono: optionalText(25).refine(
    (v) => v === '' || /^\+?[\d\s()-]{6,25}$/.test(v),
    'Ingresa un teléfono válido.'
  ),
  empresa: optionalText(120).transform((v) => v.replace(/\s+/g, ' ')),
  producto: z.enum(PRODUCT_KEYS, {
    errorMap: () => ({ message: 'Elige un producto.' }),
  }),
  plan: optionalText(40).refine((v) => v === '' || PLAN_KEYS.includes(v), 'Plan inválido.'),
  mensaje: optionalText(2000),
  consentimiento: z
    .preprocess((v) => v === true || v === 'on' || v === 'true' || v === '1', z.boolean())
    .refine((v) => v === true, 'Debes aceptar la política de privacidad.'),
});

/** Devuelve { ok: true, data } o { ok: false, errors: { campo: mensaje } }. */
function validateDemo(input) {
  const result = demoSchema.safeParse(input || {});
  if (result.success) return { ok: true, data: result.data };
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] || '_';
    if (!errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

module.exports = { validateDemo, PRODUCT_KEYS, PLAN_KEYS };
