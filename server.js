require('dotenv').config({ quiet: true });

const { createApp } = require('./src/app');
const { smtpConfigured } = require('./src/lib/mailer');

const port = Number(process.env.PORT) || 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`[morai-web] Sitio disponible en http://localhost:${port}`);
  if (!smtpConfigured()) {
    console.warn('[morai-web] Aviso: SMTP no configurado. Los leads se guardarán solo en data/leads.jsonl.');
  }
});
