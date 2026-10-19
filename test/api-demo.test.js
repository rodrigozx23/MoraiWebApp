const { test, describe, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

// Las pruebas nunca envían correos reales.
for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO', 'MAIL_FROM']) delete process.env[k];

const { createApp } = require('../src/app');
const { buildMessage } = require('../src/lib/mailer');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'morai-web-test-'));
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

const silentLogger = { info() {}, warn() {}, error() {} };
let counter = 0;

function setup(overrides = {}) {
  const leadsFile = path.join(tmpDir, `leads-${++counter}.jsonl`);
  const logs = { warn: [], error: [] };
  const logger = { info() {}, warn: (m) => logs.warn.push(m), error: (m) => logs.error.push(m) };
  const app = createApp({ leadsFile, rateLimitMax: 100, minFormMs: 3000, logger, ...overrides });
  const readLeads = () =>
    fs.existsSync(leadsFile)
      ? fs.readFileSync(leadsFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
      : [];
  return { app, leadsFile, readLeads, logs };
}

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

describe('POST /api/demo', () => {
  let ctx;
  beforeEach(() => {
    ctx = setup();
  });

  test('acepta un lead válido, lo guarda en JSONL y avisa que no hay SMTP', async () => {
    const res = await request(ctx.app).post('/api/demo').set('Accept', 'application/json').send(validLead());
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true, redirect: '/gracias' });

    const leads = ctx.readLeads();
    assert.equal(leads.length, 1);
    assert.equal(leads[0].email, 'ana@example.com');
    assert.equal(leads[0].producto, 'pos');
    assert.equal(leads[0].consentimiento, true);
    assert.ok(leads[0].id && leads[0].createdAt);
    assert.equal(leads[0].website, undefined, 'no guarda el honeypot');
    assert.ok(ctx.logs.warn.some((m) => m.includes('SMTP no configurado')));
  });

  test('rechaza datos inválidos con 400 y errores por campo', async () => {
    const res = await request(ctx.app)
      .post('/api/demo')
      .set('Accept', 'application/json')
      .send(validLead({ nombre: 'A', email: 'no-es-correo', producto: 'xyz', consentimiento: false }));
    assert.equal(res.status, 400);
    assert.equal(res.body.ok, false);
    assert.ok(res.body.errors.nombre);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.producto);
    assert.ok(res.body.errors.consentimiento);
    assert.equal(ctx.readLeads().length, 0);
  });

  test('rechaza campos obligatorios ausentes', async () => {
    const res = await request(ctx.app).post('/api/demo').set('Accept', 'application/json').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.nombre && res.body.errors.email && res.body.errors.producto);
  });

  test('rechaza plan desconocido y teléfono inválido', async () => {
    const res = await request(ctx.app)
      .post('/api/demo')
      .set('Accept', 'application/json')
      .send(validLead({ plan: 'gold', telefono: 'llámame' }));
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.plan);
    assert.ok(res.body.errors.telefono);
  });

  test('honeypot lleno: responde ok pero no guarda nada', async () => {
    const res = await request(ctx.app)
      .post('/api/demo')
      .set('Accept', 'application/json')
      .send(validLead({ website: 'http://spam.example' }));
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(ctx.readLeads().length, 0);
  });

  test('envío demasiado rápido (bot): responde ok pero no guarda nada', async () => {
    const res = await request(ctx.app)
      .post('/api/demo')
      .set('Accept', 'application/json')
      .send(validLead({ ts: Date.now() }));
    assert.equal(res.status, 200);
    assert.equal(ctx.readLeads().length, 0);
  });

  test('limpia saltos de línea en campos de una línea', async () => {
    const res = await request(ctx.app)
      .post('/api/demo')
      .set('Accept', 'application/json')
      .send(validLead({ nombre: 'Ana\r\nBcc: victima@example.com' }));
    assert.equal(res.status, 200);
    assert.ok(!/[\r\n]/.test(ctx.readLeads()[0].nombre));
  });

  test('formulario clásico (sin JS): redirige a /gracias con 303', async () => {
    const lead = validLead();
    const res = await request(ctx.app)
      .post('/api/demo')
      .type('form')
      .set('Accept', 'text/html')
      .send({ ...lead, consentimiento: 'on' });
    assert.equal(res.status, 303);
    assert.equal(res.headers.location, '/gracias');
    assert.equal(ctx.readLeads().length, 1);
  });

  test('formulario clásico inválido: vuelve a mostrar /contacto con errores', async () => {
    const res = await request(ctx.app)
      .post('/api/demo')
      .type('form')
      .set('Accept', 'text/html')
      .send({ nombre: 'Ana', email: 'mal', producto: 'pos', ts: String(Date.now() - 10_000) });
    assert.equal(res.status, 400);
    assert.match(res.text, /Ingresa un correo válido/);
    assert.match(res.text, /value="Ana"/);
  });

  test('rechaza cuerpos demasiado grandes', async () => {
    const res = await request(ctx.app)
      .post('/api/demo')
      .set('Accept', 'application/json')
      .send(validLead({ mensaje: 'x'.repeat(30_000) }));
    assert.equal(res.status, 400);
    assert.equal(ctx.readLeads().length, 0);
  });

  test('si no se puede guardar ni enviar correo, responde 500', async () => {
    // Un directorio en lugar de archivo hace fallar appendFile.
    const { app } = setup({ leadsFile: tmpDir, logger: silentLogger });
    const res = await request(app).post('/api/demo').set('Accept', 'application/json').send(validLead());
    assert.equal(res.status, 500);
    assert.equal(res.body.ok, false);
  });
});

describe('SMTP configurado pero caído', () => {
  test('el lead se guarda, se registra el error y el usuario recibe ok', async () => {
    Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: '1', MAIL_TO: 'leads@example.com' });
    try {
      const ctx = setup();
      const res = await request(ctx.app).post('/api/demo').set('Accept', 'application/json').send(validLead());
      assert.equal(res.status, 200);
      assert.equal(ctx.readLeads().length, 1);
      assert.ok(ctx.logs.error.some((m) => m.includes('Error al enviar')));
    } finally {
      for (const k of ['SMTP_HOST', 'SMTP_PORT', 'MAIL_TO']) delete process.env[k];
    }
  });
});

describe('rate limit', () => {
  test('bloquea con 429 al superar el límite por IP', async () => {
    const { app } = setup({ rateLimitMax: 2, logger: silentLogger });
    const send = () => request(app).post('/api/demo').set('Accept', 'application/json').send(validLead());
    assert.equal((await send()).status, 200);
    assert.equal((await send()).status, 200);
    const blocked = await send();
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.ok, false);
  });
});

describe('correo del lead', () => {
  test('usa MAIL_TO como destino y el cliente como reply-to', () => {
    const msg = buildMessage(
      { id: '1', createdAt: 'hoy', nombre: 'Ana', email: 'ana@example.com', producto: 'dxlex', mensaje: '<b>hola</b>' },
      { MAIL_TO: 'leads@example.com', MAIL_FROM: 'web@example.com' }
    );
    assert.equal(msg.to, 'leads@example.com');
    assert.equal(msg.from, 'web@example.com');
    assert.deepEqual(msg.replyTo, { name: 'Ana', address: 'ana@example.com' });
    assert.match(msg.subject, /DxLex/);
    assert.ok(msg.html.includes('&lt;b&gt;hola&lt;/b&gt;'), 'escapa HTML');
  });
});

describe('páginas', () => {
  const { app } = setup({ logger: silentLogger });
  for (const p of ['/', '/pos', '/dxlex', '/paginas-web', '/nosotros', '/contacto', '/gracias', '/privacidad']) {
    test(`GET ${p} responde 200`, async () => {
      const res = await request(app).get(p);
      assert.equal(res.status, 200);
      assert.match(res.text, /<title>/);
    });
  }

  test('GET /contacto?producto=pos preselecciona el producto', async () => {
    const res = await request(app).get('/contacto?producto=pos');
    assert.match(res.text, /<option value="pos" selected>/);
  });

  test('ruta inexistente responde 404', async () => {
    const res = await request(app).get('/no-existe');
    assert.equal(res.status, 404);
    assert.match(res.text, /No encontramos esta página/);
  });

  test('robots.txt y sitemap.xml', async () => {
    assert.match((await request(app).get('/robots.txt')).text, /Sitemap:/);
    const sm = await request(app).get('/sitemap.xml');
    assert.equal(sm.status, 200);
    assert.match(sm.text, /<urlset/);
    assert.doesNotMatch(sm.text, /gracias/);
  });

  test('envía cabeceras de seguridad (helmet)', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['content-security-policy']);
    assert.equal(res.headers['x-powered-by'], undefined);
  });
});
