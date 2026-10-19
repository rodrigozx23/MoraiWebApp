// Prueba el endpoint real (php/api/demo.php) con `php -S` y un servidor SMTP falso.
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../src/build');
const { findPhp, startFakeSmtp, startPhpServer } = require('./helpers');

const php = findPhp();
const skip = php ? false : 'PHP no está instalado (define PHP_BIN o instala PHP 8.1+)';

const validLead = (extra = {}) => ({
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  telefono: '+51 987 654 321',
  empresa: 'Cevichería Ana',
  producto: 'pos',
  plan: 'normal',
  mensaje: 'Tengo dos locales.',
  consentimiento: true,
  ts: Date.now() - 10_000,
  website: '',
  ...extra,
});

const postJson = (url, body) =>
  fetch(url + '/api/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

const postForm = (url, body) =>
  fetch(url + '/api/demo', {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },
    body: new URLSearchParams(body).toString(),
  });

describe('POST /api/demo (PHP)', { skip }, () => {
  let dist, smtp, server, dataDir;
  const leads = () => {
    const f = path.join(dataDir, 'leads.jsonl');
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse) : [];
  };
  const config = (extra = {}) => ({
    smtp_host: '127.0.0.1',
    smtp_port: smtp.port,
    smtp_secure: 'none',
    smtp_user: 'web@example.com',
    smtp_pass: 'secreto',
    mail_from: 'web@example.com',
    mail_from_name: 'MORAI Web',
    mail_to: 'leads@example.com',
    data_dir: dataDir,
    rate_limit_max: 100,
    ...extra,
  });

  before(async () => {
    dist = await build(fs.mkdtempSync(path.join(os.tmpdir(), 'morai-dist-')));
    smtp = await startFakeSmtp();
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'morai-data-'));
    server = await startPhpServer(php, dist, config());
  });
  after(async () => {
    server?.stop();
    await smtp?.close();
    fs.rmSync(dist, { recursive: true, force: true });
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  test('lead válido: 200, se guarda en leads.jsonl y se envía por SMTP con reply-to del cliente', async () => {
    const res = await postJson(server.url, validLead());
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, redirect: '/gracias' });

    const saved = leads().at(-1);
    assert.equal(saved.email, 'ana@example.com');
    assert.equal(saved.producto, 'pos');
    assert.equal(saved.consentimiento, true);
    assert.equal(saved.website, undefined);

    const msg = smtp.messages.at(-1);
    assert.deepEqual(msg.auth, ['web@example.com', 'secreto']);
    assert.equal(msg.from, '<web@example.com>');
    assert.deepEqual(msg.to, ['<leads@example.com>']);
    assert.match(msg.data, /^Reply-To: =\?UTF-8\?B\?[^?]+\?= <ana@example\.com>$/m);
    assert.match(msg.data, /^Subject: =\?UTF-8\?B\?/m);
    const text = Buffer.from(msg.data.split('base64\r\n\r\n')[1].split('\r\n--')[0].replace(/\r\n/g, ''), 'base64').toString();
    assert.match(text, /Producto: MORAI POS/);
    assert.match(text, /Teléfono: \+51 987 654 321/);
  });

  test('datos inválidos: 400 con errores por campo y nada guardado', async () => {
    const before = leads().length;
    const res = await postJson(server.url, validLead({ nombre: 'A', email: 'no-es-correo', producto: 'xyz', plan: 'gold', telefono: 'llámame', consentimiento: false }));
    assert.equal(res.status, 400);
    const body = await res.json();
    for (const f of ['nombre', 'email', 'producto', 'plan', 'telefono', 'consentimiento']) assert.ok(body.errors[f], `falta error de ${f}`);
    assert.equal(leads().length, before);
  });

  test('honeypot lleno: responde ok pero no guarda ni envía', async () => {
    const before = [leads().length, smtp.messages.length];
    const res = await postJson(server.url, validLead({ website: 'http://spam.example' }));
    assert.equal(res.status, 200);
    assert.deepEqual([leads().length, smtp.messages.length], before);
  });

  test('envío demasiado rápido: responde ok pero no guarda', async () => {
    const before = leads().length;
    const res = await postJson(server.url, validLead({ ts: Date.now() }));
    assert.equal(res.status, 200);
    assert.equal(leads().length, before);
  });

  test('quita saltos de línea (evita inyección de cabeceras)', async () => {
    const res = await postJson(server.url, validLead({ nombre: 'Ana\r\nBcc: victima@example.com' }));
    assert.equal(res.status, 200);
    assert.doesNotMatch(leads().at(-1).nombre, /[\r\n]/);
    assert.doesNotMatch(smtp.messages.at(-1).data, /^Bcc:/m);
  });

  test('formulario clásico (sin JS): redirige 303 a /gracias', async () => {
    const res = await postForm(server.url, { ...validLead(), consentimiento: 'on' });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), '/gracias');
  });

  test('formulario clásico inválido: muestra /contacto con errores y valores', async () => {
    const res = await postForm(server.url, { nombre: 'Ana <b>', email: 'mal', producto: 'dxlex' });
    assert.equal(res.status, 400);
    const html = await res.text();
    assert.match(html, /Ingresa un correo válido/);
    assert.match(html, /value="Ana &lt;b&gt;"/);
    assert.match(html, /<option value="dxlex" selected>/);
  });

  test('cuerpo demasiado grande: 400', async () => {
    const res = await postJson(server.url, validLead({ mensaje: 'x'.repeat(30_000) }));
    assert.equal(res.status, 400);
  });

  test('GET no permitido: 405', async () => {
    assert.equal((await fetch(server.url + '/api/demo')).status, 405);
  });

  test('las librerías PHP y la configuración no son accesibles', async () => {
    assert.equal((await fetch(server.url + '/api/lib.php')).status, 404);
    assert.equal((await fetch(server.url + '/api/site-data.php')).status, 404);
  });

  test('páginas: rutas limpias, ?producto= preseleccionado y 404', async () => {
    for (const p of ['/', '/pos', '/dxlex', '/paginas-web', '/nosotros', '/privacidad', '/gracias']) {
      assert.equal((await fetch(server.url + p)).status, 200, p);
    }
    const contacto = await (await fetch(server.url + '/contacto?producto=pos&plan=normal')).text();
    assert.match(contacto, /<option value="pos" selected>/);
    assert.match(contacto, /<option value="normal" selected>/);
    assert.doesNotMatch(contacto, /<\?/);
    const missing = await fetch(server.url + '/no-existe');
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /No encontramos esta página/);
  });

  describe('casos de configuración', () => {
    test('rate limit: 429 al superar el límite por IP', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'morai-rl-'));
      const s = await startPhpServer(php, dist, config({ data_dir: dir, rate_limit_max: 2 }));
      try {
        assert.equal((await postJson(s.url, validLead())).status, 200);
        assert.equal((await postJson(s.url, validLead())).status, 200);
        const blocked = await postJson(s.url, validLead());
        assert.equal(blocked.status, 429);
        assert.equal((await blocked.json()).ok, false);
      } finally {
        s.stop();
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('SMTP caído: el lead se guarda, se registra el error y el usuario recibe ok', async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'morai-down-'));
      const s = await startPhpServer(php, dist, config({ data_dir: dir, smtp_port: 1 }));
      try {
        assert.equal((await postJson(s.url, validLead())).status, 200);
        assert.equal(fs.readFileSync(path.join(dir, 'leads.jsonl'), 'utf8').trim().split('\n').length, 1);
        assert.match(fs.readFileSync(path.join(dir, 'eventos.log'), 'utf8'), /ERROR Error al enviar/);
      } finally {
        s.stop();
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    test('sin morai-config.php: guarda el lead en morai-data junto a public_html y avisa', async () => {
      const s = await startPhpServer(php, dist, null);
      const dir = path.join(path.dirname(dist), 'morai-data');
      try {
        assert.equal((await postJson(s.url, validLead())).status, 200);
        assert.ok(fs.existsSync(path.join(dir, 'leads.jsonl')));
        assert.match(fs.readFileSync(path.join(dir, 'eventos.log'), 'utf8'), /WARN SMTP no configurado/);
      } finally {
        s.stop();
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
