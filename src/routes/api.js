const crypto = require('crypto');
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { validateDemo } = require('../lib/validation');
const { saveLead } = require('../lib/leads');
const { sendLeadEmail } = require('../lib/mailer');

const HONEYPOT_FIELD = 'website';

function wantsJson(req) {
  return req.is('application/json') || req.accepts(['html', 'json']) === 'json';
}

/**
 * @param {object} opts
 * @param {string} opts.leadsFile   Ruta del respaldo JSON Lines.
 * @param {number} opts.rateLimitMax  Solicitudes permitidas por IP en la ventana.
 * @param {number} opts.rateLimitWindowMs
 * @param {number} opts.minFormMs   Tiempo mínimo entre que se carga el formulario y se envía.
 * @param {object} opts.logger
 */
function createApiRouter(opts) {
  const { leadsFile, rateLimitMax, rateLimitWindowMs, minFormMs, logger = console } = opts;
  const router = express.Router();

  const limiter = rateLimit({
    windowMs: rateLimitWindowMs,
    limit: rateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      const message = 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.';
      if (wantsJson(req)) return res.status(429).json({ ok: false, message });
      return res.status(429).render('pages/contacto', {
        page: res.locals.pageMeta('contacto', '/contacto'),
        form: { values: req.body || {}, errors: { _: message } },
      });
    },
  });

  router.post('/api/demo', limiter, async (req, res) => {
    const body = req.body || {};
    const json = wantsJson(req);
    const ok = () =>
      json ? res.status(200).json({ ok: true, redirect: '/gracias' }) : res.redirect(303, '/gracias');

    // Anti-bot: campo trampa oculto y envío demasiado rápido. Respondemos "ok"
    // para no dar pistas al bot, pero no guardamos ni enviamos nada.
    const honeypot = typeof body[HONEYPOT_FIELD] === 'string' && body[HONEYPOT_FIELD].trim() !== '';
    const ts = Number(body.ts);
    const tooFast = Number.isFinite(ts) && ts > 0 && Date.now() - ts < minFormMs;
    if (honeypot || tooFast) {
      logger.warn(`[demo] Envío descartado como bot (${honeypot ? 'honeypot' : 'demasiado rápido'}) ip=${req.ip}`);
      return ok();
    }

    const result = validateDemo(body);
    if (!result.ok) {
      const message = 'Revisa los campos marcados.';
      if (json) return res.status(400).json({ ok: false, message, errors: result.errors });
      return res.status(400).render('pages/contacto', {
        page: res.locals.pageMeta('contacto', '/contacto'),
        form: { values: body, errors: { _: message, ...result.errors } },
      });
    }

    const lead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...result.data,
      origen: typeof body.origen === 'string' ? body.origen.slice(0, 200) : req.get('referer') || '',
      ip: req.ip,
      userAgent: (req.get('user-agent') || '').slice(0, 300),
    };

    let saved = false;
    try {
      await saveLead(lead, leadsFile);
      saved = true;
    } catch (err) {
      logger.error(`[demo] No se pudo guardar el lead ${lead.id}: ${err.message}`);
    }

    const mail = await sendLeadEmail(lead, { logger });

    if (!saved && !mail.sent) {
      const message = 'No pudimos registrar tu solicitud. Escríbenos directamente o inténtalo más tarde.';
      if (json) return res.status(500).json({ ok: false, message });
      return res.status(500).render('pages/contacto', {
        page: res.locals.pageMeta('contacto', '/contacto'),
        form: { values: body, errors: { _: message } },
      });
    }

    logger.info(`[demo] Lead ${lead.id} (${lead.producto}) guardado=${saved} correo=${mail.sent}`);
    return ok();
  });

  return router;
}

module.exports = { createApiRouter, HONEYPOT_FIELD };
