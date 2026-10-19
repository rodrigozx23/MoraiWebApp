const nodemailer = require('nodemailer');
const site = require('../../config/site');

let transporter = null;

function smtpConfigured(env = process.env) {
  return Boolean(env.SMTP_HOST && env.MAIL_TO);
}

function getTransporter(env = process.env) {
  if (transporter) return transporter;
  const port = Number(env.SMTP_PORT) || 465;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    // true para 465 (SSL); false para 587 (STARTTLS).
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function buildMessage(lead, env = process.env) {
  const product = site.products[lead.producto]?.name || lead.producto;
  const rows = [
    ['Producto', product],
    ['Plan', lead.plan || '—'],
    ['Nombre', lead.nombre],
    ['Correo', lead.email],
    ['Teléfono', lead.telefono || '—'],
    ['Empresa', lead.empresa || '—'],
    ['Mensaje', lead.mensaje || '—'],
    ['Página de origen', lead.origen || '—'],
    ['Fecha', lead.createdAt],
    ['ID', lead.id],
  ];
  return {
    from: env.MAIL_FROM || env.SMTP_USER,
    to: env.MAIL_TO,
    replyTo: { name: lead.nombre, address: lead.email },
    subject: `[${site.name}] Nueva solicitud de demo: ${product} - ${lead.nombre}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html:
      `<h2 style="font-family:sans-serif">Nueva solicitud de demo</h2>` +
      `<table cellpadding="6" style="font-family:sans-serif;border-collapse:collapse">` +
      rows
        .map(
          ([k, v]) =>
            `<tr><th align="left" style="border-bottom:1px solid #eee">${escapeHtml(k)}</th>` +
            `<td style="border-bottom:1px solid #eee;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
        )
        .join('') +
      `</table>`,
  };
}

/**
 * Envía el lead por correo. Nunca lanza: devuelve { sent, reason }.
 * Si SMTP no está configurado, solo registra un aviso.
 */
async function sendLeadEmail(lead, { env = process.env, logger = console } = {}) {
  if (!smtpConfigured(env)) {
    logger.warn(
      `[mail] SMTP no configurado (SMTP_HOST/MAIL_TO). Lead ${lead.id} guardado sin enviar correo.`
    );
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await getTransporter(env).sendMail(buildMessage(lead, env));
    return { sent: true };
  } catch (err) {
    logger.error(`[mail] Error al enviar el lead ${lead.id}: ${err.message}`);
    return { sent: false, reason: 'error' };
  }
}

module.exports = { sendLeadEmail, buildMessage, smtpConfigured };
