/**
 * Genera el sitio estático en dist/ (HTML + PHP del formulario), listo para
 * copiar a public_html de Hostinger.
 *
 *   npm run build            -> dist/
 *   node src/build.js <dir>  -> otra carpeta
 */
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const site = require('../config/site');
const { PAGES } = require('./pages');
const { baseLocals, pageMeta } = require('./render-context');

const ROOT = path.join(__dirname, '..');

// Datos que necesita el PHP (validación y asunto del correo), generados desde config/site.js.
function siteDataPhp() {
  const data = {
    name: site.name,
    products: Object.fromEntries(Object.entries(site.products).map(([k, p]) => [k, p.name])),
    plans: Object.values(site.pricing)
      .filter(Array.isArray)
      .flat()
      .map((p) => p.key),
  };
  const json = JSON.stringify(data).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<?php\n// Generado por src/build.js desde config/site.js. No editar a mano.\nreturn json_decode('${json}', true);\n`;
}

function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.filter((p) => p.sitemap !== false)
    .map((p) => `  <url><loc>${site.url}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robotsTxt() {
  return ['User-agent: *', 'Disallow: /api/', 'Disallow: /gracias', '', `Sitemap: ${site.url}/sitemap.xml`, ''].join('\n');
}

async function build(outDir = path.join(ROOT, 'dist')) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Archivos estáticos, reglas de Apache/LiteSpeed y PHP del formulario.
  fs.cpSync(path.join(ROOT, 'public'), outDir, { recursive: true });
  fs.cpSync(path.join(ROOT, 'deploy', 'htaccess'), path.join(outDir, '.htaccess'));
  fs.cpSync(path.join(ROOT, 'php', 'api'), path.join(outDir, 'api'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'api', 'site-data.php'), siteDataPhp());

  const locals = baseLocals();
  for (const p of PAGES) {
    const file = path.join(ROOT, 'views', 'pages', `${p.view}.ejs`);
    let html = await ejs.renderFile(file, { ...locals, page: pageMeta(p.key, p.path) });
    if (p.php) html = `<?php require_once __DIR__ . '/api/form-helpers.php'; morai_form_init(); ?>\n` + html;
    fs.writeFileSync(path.join(outDir, p.out), html);
  }

  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml());
  fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt());
  return outDir;
}

module.exports = { build };

if (require.main === module) {
  const out = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  build(out)
    .then((dir) => console.log(`[build] Sitio generado en ${path.relative(process.cwd(), dir) || dir}`))
    .catch((err) => {
      console.error('[build] Error:', err);
      process.exit(1);
    });
}
