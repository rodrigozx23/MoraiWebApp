/**
 * Empaqueta el CONTENIDO de dist/ en morai-sitio.zip (los archivos quedan en la
 * raíz del zip, listo para "Subir" en Hostinger o extraer en public_html).
 *
 *   npm run zip
 *
 * Usa el tar.exe de Windows 10+ (bsdtar), que crea zip con la opción -a.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'morai-sitio.zip');

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('[zip] No existe dist/. Ejecuta primero: npm run build');
  process.exit(1);
}

fs.rmSync(OUT, { force: true });
// Lista explícita para incluir archivos ocultos como .htaccess.
const entries = fs.readdirSync(DIST);
const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'bsdtar';
execFileSync(tar, ['-a', '-c', '-f', OUT, '-C', DIST, ...entries], { stdio: 'inherit' });
console.log(`[zip] Generado ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
