const express = require('express');
const site = require('../../config/site');

// key = clave en site.seo y en site.nav; view = plantilla en views/pages.
const PAGES = [
  { path: '/', key: 'inicio', view: 'inicio', priority: '1.0' },
  { path: '/pos', key: 'pos', view: 'pos', priority: '0.9' },
  { path: '/dxlex', key: 'dxlex', view: 'dxlex', priority: '0.9' },
  { path: '/paginas-web', key: 'web', view: 'paginas-web', priority: '0.8' },
  { path: '/nosotros', key: 'nosotros', view: 'nosotros', priority: '0.6' },
  { path: '/contacto', key: 'contacto', view: 'contacto', priority: '0.7' },
  { path: '/privacidad', key: 'privacidad', view: 'privacidad', priority: '0.3' },
  { path: '/gracias', key: 'gracias', view: 'gracias', sitemap: false },
];

function createPagesRouter() {
  const router = express.Router();

  for (const p of PAGES) {
    router.get(p.path, (req, res) => {
      const locals = { page: res.locals.pageMeta(p.key, p.path) };
      if (p.key === 'contacto') {
        const producto = typeof req.query.producto === 'string' ? req.query.producto : '';
        const plan = typeof req.query.plan === 'string' ? req.query.plan : '';
        locals.form = { values: { producto: site.products[producto] ? producto : '', plan }, errors: {} };
      }
      res.render(`pages/${p.view}`, locals);
    });
  }

  router.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(
      ['User-agent: *', 'Disallow: /api/', 'Disallow: /gracias', '', `Sitemap: ${site.url}/sitemap.xml`, ''].join('\n')
    );
  });

  router.get('/sitemap.xml', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const urls = PAGES.filter((p) => p.sitemap !== false)
      .map(
        (p) =>
          `  <url><loc>${site.url}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`
      )
      .join('\n');
    res
      .type('application/xml')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  });

  return router;
}

module.exports = { createPagesRouter, PAGES };
