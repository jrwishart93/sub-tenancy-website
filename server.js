import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAgreementEmail } from './sendEmail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.post('/api/send-agreement', async (req, res) => {
  const { to, subject, html } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required email fields.' });
  }

  try {
    const response = await sendAgreementEmail({ to, subject, html });
    return res.status(200).json({ message: 'Email sent', data: response?.data ?? null });
  } catch (error) {
    console.error('Unable to send agreement email', error);
    return res.status(500).json({ error: 'Unable to send the agreement email.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sub-tenancy site listening on http://localhost:${PORT}`);
});
