const site = require('../config/site');

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

function pageMeta(key, pagePath) {
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
}

function whatsappLink() {
  const n = String(site.contact.whatsapp || '').replace(/\D/g, '');
  if (!n) return '';
  const text = site.contact.whatsappMessage ? `?text=${encodeURIComponent(site.contact.whatsappMessage)}` : '';
  return `https://wa.me/${n}${text}`;
}

/** Variables disponibles en todas las plantillas EJS. */
function baseLocals() {
  return {
    site,
    cssVars: buildCssVars(),
    formatPrice,
    year: new Date().getFullYear(),
    whatsappLink: whatsappLink(),
  };
}

module.exports = { baseLocals, pageMeta };
