/**
 * Publica dist/ en la rama "hostinger" del repositorio (solo el sitio generado).
 * Hostinger despliega esa rama en public_html.
 *
 *   npm run build && npm run publish:branch
 *
 * Lo ejecuta el workflow .github/workflows/deploy.yml en cada push a main; también
 * se puede correr a mano. Mantiene el historial (sin --force) para que el
 * "git pull" de Hostinger siempre avance.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BRANCH = process.env.DEPLOY_BRANCH || 'hostinger';
const REMOTE = process.env.DEPLOY_REMOTE || 'origin';

const git = (args, cwd = ROOT) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('[publish] No existe dist/. Ejecuta primero: npm run build');
  process.exit(1);
}

const source = git(['rev-parse', '--short', 'HEAD']);
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'morai-deploy-'));

let remoteExists = true;
try {
  git(['fetch', REMOTE, BRANCH]);
} catch {
  remoteExists = false;
}

try {
  if (remoteExists) {
    git(['worktree', 'add', '-B', BRANCH, work, `${REMOTE}/${BRANCH}`]);
  } else {
    git(['worktree', 'add', '--detach', work]);
    git(['checkout', '--orphan', BRANCH], work);
    git(['rm', '-rf', '--quiet', '.'], work);
  }

  // Reemplaza todo el contenido por dist/ (conserva solo el archivo .git del worktree).
  for (const entry of fs.readdirSync(work)) {
    if (entry !== '.git') fs.rmSync(path.join(work, entry), { recursive: true, force: true });
  }
  fs.cpSync(DIST, work, { recursive: true });

  git(['add', '-A'], work);
  if (!git(['status', '--porcelain'], work)) {
    console.log('[publish] Sin cambios en el sitio; nada que publicar.');
  } else {
    git(['commit', '-m', `Despliegue desde main ${source}`], work);
    git(['push', REMOTE, `${BRANCH}:${BRANCH}`], work);
    console.log(`[publish] Publicado en la rama ${BRANCH} (${REMOTE}).`);
  }
} finally {
  try {
    git(['worktree', 'remove', '--force', work]);
  } catch {
    fs.rmSync(work, { recursive: true, force: true });
    git(['worktree', 'prune']);
  }
}
