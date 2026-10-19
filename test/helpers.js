const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

/** Ruta del ejecutable de PHP (PHP_BIN, PATH o instalación de winget), o null. */
function findPhp() {
  const candidates = [process.env.PHP_BIN, 'php'];
  const winget = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(winget)) {
    for (const dir of fs.readdirSync(winget).filter((d) => d.startsWith('PHP.PHP'))) {
      candidates.push(path.join(winget, dir, 'php.exe'));
    }
  }
  for (const bin of candidates.filter(Boolean)) {
    const r = spawnSync(bin, ['-v'], { encoding: 'utf8' });
    if (r.status === 0) return bin;
  }
  return null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function waitForPort(port, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const s = net.connect(port, '127.0.0.1', () => {
        s.end();
        resolve(true);
      });
      s.on('error', () => resolve(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`El puerto ${port} no respondió`);
}

/** Servidor SMTP falso que acepta AUTH LOGIN y guarda los mensajes recibidos. */
async function startFakeSmtp() {
  const messages = [];
  const server = net.createServer((socket) => {
    let buffer = '';
    let inData = false;
    let authStep = 0;
    const current = { from: '', to: [], data: '', auth: [] };
    socket.write('220 fake-smtp\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      for (;;) {
        if (inData) {
          const end = buffer.indexOf('\r\n.\r\n');
          if (end === -1) return;
          current.data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          inData = false;
          messages.push({ ...current });
          socket.write('250 OK\r\n');
          continue;
        }
        const nl = buffer.indexOf('\r\n');
        if (nl === -1) return;
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        if (authStep > 0) {
          current.auth.push(Buffer.from(line, 'base64').toString());
          socket.write(authStep++ === 1 ? '334 UGFzc3dvcmQ6\r\n' : '235 OK\r\n');
          if (authStep > 2) authStep = 0;
        } else if (/^EHLO/i.test(line)) socket.write('250-fake\r\n250 AUTH LOGIN\r\n');
        else if (/^AUTH LOGIN/i.test(line)) {
          authStep = 1;
          socket.write('334 VXNlcm5hbWU6\r\n');
        } else if (/^MAIL FROM:/i.test(line)) {
          current.from = line.slice(10);
          socket.write('250 OK\r\n');
        } else if (/^RCPT TO:/i.test(line)) {
          current.to.push(line.slice(8));
          socket.write('250 OK\r\n');
        } else if (/^DATA/i.test(line)) {
          inData = true;
          socket.write('354 Go\r\n');
        } else if (/^QUIT/i.test(line)) {
          socket.end('221 Bye\r\n');
          return;
        } else socket.write('500 ?\r\n');
      }
    });
    socket.on('error', () => {});
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { port: server.address().port, messages, close: () => new Promise((r) => server.close(r)) };
}

/**
 * Levanta `php -S` sobre un dist/ ya generado, con un morai-config.php propio.
 * config = null -> sin archivo de configuración.
 */
async function startPhpServer(php, distDir, config) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'morai-php-'));
  const env = { ...process.env };
  delete env.MORAI_CONFIG;
  if (config) {
    const file = path.join(tmp, 'morai-config.php');
    fs.writeFileSync(file, `<?php\nreturn json_decode(${JSON.stringify(JSON.stringify(config))}, true);\n`);
    env.MORAI_CONFIG = file;
  }
  const port = await freePort();
  const router = path.join(__dirname, '..', 'scripts', 'router.php');
  const proc = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', distDir, router], { env, stdio: 'ignore' });
  await waitForPort(port);
  return {
    url: `http://127.0.0.1:${port}`,
    tmp,
    stop: () => {
      proc.kill();
      fs.rmSync(tmp, { recursive: true, force: true });
    },
  };
}

module.exports = { findPhp, startFakeSmtp, startPhpServer };
