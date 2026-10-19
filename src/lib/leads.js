const fs = require('fs/promises');
const path = require('path');

/** Agrega un lead como una línea JSON al archivo de respaldo (JSON Lines). */
async function saveLead(lead, file) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(lead) + '\n', 'utf8');
}

module.exports = { saveLead };
