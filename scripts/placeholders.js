// Lista los valores de ejemplo (PLACEHOLDER) que faltan reemplazar antes de publicar.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = ['config/site.js', 'views/pages/privacidad.ejs'];
let total = 0;

for (const rel of files) {
  const lines = fs.readFileSync(path.join(root, rel), 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('PLACEHOLDER') && !line.includes('Todo valor marcado')) {
      total++;
      console.log(`${rel}:${i + 1}  ${line.trim()}`);
    }
  });
}
const imgs = fs.readdirSync(path.join(root, 'public/img')).filter((f) =>
  fs.readFileSync(path.join(root, 'public/img', f), 'utf8').includes('PLACEHOLDER')
);
imgs.forEach((f) => console.log(`public/img/${f}  (imagen de ejemplo)`));
total += imgs.length;

console.log(`\n${total} placeholder(s) pendientes.`);
