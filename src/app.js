const path = require('path');
const express = require('express');
const helmet = require('helmet');
const site = require('../config/site');
const { createPagesRouter } = require('./routes/pages');
const { createApiRouter } = require('./routes/api');

const ROOT = path.join(__dirname, '..');

const toKebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

// Variables CSS generadas desde config/site.js (colores y tipografías).
function buildCssVars() {
  const vars = Object.entries(site.colors).map(([k, v]) => `--color-${toKebab(k)}:${v}`);
  vars.push(`--font-heading:${site.fonts.heading}`, `--font-body:${site.fonts.body}`);
  return `:root{${vars.join(';')}}`;
}

function formatPrice(plan) {
  if (plan.price === null || plan.price === undefined) return 'Cotizar';
  if (plan.price === 0) return 'Gratis';
  return `${site.pricing.currency} ${plan.price.toLocaleString('es-PE')}`;
}

/**
 * Crea la app Express. Las opciones permiten aislar las pruebas; por defecto
 * se leen de las variables de entorno.
 */
function createApp(options = {}) {
  const env = process.env;
  const isProd = env.NODE_ENV === 'production';
  const opts = {
    leadsFile: options.leadsFile || env.LEADS_FILE || path.join(ROOT, 'data', 'leads.jsonl'),
    rateLimitMax: options.rateLimitMax ?? (Number(env.RATE_LIMIT_MAX) || 5),
    rateLimitWindowMs: options.rateLimitWindowMs ?? (Number(env.RATE_LIMIT_WINDOW_MIN) || 15) * 60_000,
    minFormMs: options.minFormMs ?? (env.MIN_FORM_SECONDS ? Number(env.MIN_FORM_SECONDS) : 3) * 1000,
    logger: options.logger || console,
  };

  const app = express();
  app.disable('x-powered-by');
  // Detrás del proxy de Hostinger, para que req.ip (y el rate limit) usen la IP real.
  const trustProxy = env.TRUST_PROXY || (isProd ? '1' : '');
  if (trustProxy) app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

  app.set('view engine', 'ejs');
  app.set('views', path.join(ROOT, 'views'));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:'],
          'form-action': ["'self'"],
          // En local (http) no forzamos https en subrecursos.
          'upgrade-insecure-requests': isProd ? [] : null,
        },
      },
      strictTransportSecurity: isProd,
    })
  );

  app.use(express.static(path.join(ROOT, 'public'), { maxAge: isProd ? '7d' : 0 }));
  app.use(express.json({ limit: '20kb' }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));

  const cssVars = buildCssVars();
  app.use((req, res, next) => {
    res.locals.site = site;
    res.locals.cssVars = cssVars;
    res.locals.formatPrice = formatPrice;
    res.locals.formTs = Date.now();
    res.locals.year = new Date().getFullYear();
    res.locals.pageMeta = (key, pagePath) => {
      const seo = site.seo[key] || {};
      return {
        key,
        path: pagePath,
        title: seo.title || site.name,
        description: seo.description || site.tagline,
        noindex: Boolean(seo.noindex),
        canonical: site.url + (pagePath === '/' ? '/' : pagePath),
        image: site.url + (seo.image || site.images.ogDefault),
      };
    };
    next();
  });

  app.use(createPagesRouter());
  app.use(createApiRouter(opts));

  app.use((req, res) => {
    res.status(404).render('pages/404', { page: res.locals.pageMeta('notFound', req.path) });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large' || err.type === 'entity.parse.failed') {
      return res.status(400).json({ ok: false, message: 'Solicitud inválida.' });
    }
    opts.logger.error('[app] Error no controlado:', err);
    res.status(500).render('pages/error', { page: res.locals.pageMeta('notFound', req.path) });
  });

  return app;
}

module.exports = { createApp };
