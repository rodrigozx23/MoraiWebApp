const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../src/build');

let dist;
before(async () => {
  dist = await build(fs.mkdtempSync(path.join(os.tmpdir(), 'morai-build-')));
});
after(() => fs.rmSync(dist, { recursive: true, force: true }));

const read = (f) => fs.readFileSync(path.join(dist, f), 'utf8');

test('genera todas las páginas', () => {
  for (const f of ['index.html', 'pos.html', 'dxlex.html', 'paginas-web.html', 'nosotros.html', 'contacto.php',
    'privacidad.html', 'gracias.html', '404.html']) {
    assert.ok(fs.existsSync(path.join(dist, f)), `falta ${f}`);
    assert.match(read(f), /<title>[^<]+<\/title>/);
  }
});

test('copia estáticos, .htaccess y el PHP del formulario (sin la config privada)', () => {
  for (const f of ['.htaccess', 'css/styles.css', 'js/main.js', 'img/logo.svg', 'api/demo.php', 'api/lib.php',
    'api/form-helpers.php', 'api/site-data.php', 'api/.htaccess']) {
    assert.ok(fs.existsSync(path.join(dist, f)), `falta ${f}`);
  }
  assert.ok(!fs.existsSync(path.join(dist, 'api', 'morai-config.example.php')));
});

test('contacto.php rellena el formulario desde PHP; el modal no', () => {
  const html = read('contacto.php');
  assert.ok(html.startsWith('<?php require_once'));
  assert.match(html, /<\?= morai_sel\("producto", "pos"\) \?>/);
  assert.match(html, /name="ts" value="<\?= \(int\)/);
  // El modal de las demás páginas es HTML puro.
  assert.doesNotMatch(read('pos.html'), /<\?/);
});

test('site-data.php refleja productos y planes de config/site.js', () => {
  const src = read('api/site-data.php');
  assert.match(src, /"pos":"MORAI POS"/);
  assert.match(src, /"normal"/);
});

test('SEO: canonical, Open Graph, sitemap y robots', () => {
  const pos = read('pos.html');
  assert.match(pos, /<link rel="canonical" href="https?:\/\/[^"]+\/pos">/);
  assert.match(pos, /property="og:title"/);
  assert.match(read('gracias.html'), /noindex/);
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<loc>[^<]+\/pos<\/loc>/);
  assert.doesNotMatch(sitemap, /gracias|404/);
  assert.match(read('robots.txt'), /Sitemap: /);
});

test('botón de WhatsApp y CTAs con fallback a /contacto', () => {
  const html = read('index.html');
  assert.match(html, /class="wa-float" href="https:\/\/wa\.me\/\d+/);
  assert.match(html, /href="\/contacto\?producto=pos" data-demo="pos"/);
});
