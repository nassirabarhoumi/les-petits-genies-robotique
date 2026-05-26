// Vercel Serverless Function — SMS notifications via Twilio
// Triggered when the inscription form is submitted on the GitHub Pages site.
// Sends one SMS to the parent (confirmation) + one to the academy (notification).

const twilio = require('twilio');

const ALLOWED_ORIGINS = [
  'https://nassirabarhoumi.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://nassirabarhoumi.github.io');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).replace(/[\s\-().]/g, '');
  if (p.startsWith('+')) return p;
  if (p.startsWith('00')) return '+' + p.slice(2);
  if (p.startsWith('0')) return '+352' + p.slice(1);
  return '+' + p;
}

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const {
      Nom_Parent = '',
      Nom_Enfant = '',
      Age_Enfant = '',
      Telephone_Parent = '',
      Formule = '',
      Creneaux = '',
      Tranche_Age = '',
      email = ''
    } = body;

    if (!Nom_Parent || !Telephone_Parent || !Nom_Enfant) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (Nom_Parent, Telephone_Parent, Nom_Enfant)' });
    }

    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_TOKEN;
    const from = process.env.TWILIO_FROM || 'PetitsGen';
    const academyPhone = process.env.ACADEMY_PHONE;

    if (!sid || !token || !academyPhone) {
      return res.status(500).json({ error: 'Configuration serveur manquante (env vars Twilio)' });
    }

    const client = twilio(sid, token);
    const parentPhone = normalizePhone(Telephone_Parent);
    const creneauxText = Array.isArray(Creneaux) ? Creneaux.join(', ') : Creneaux;

    const parentMsg =
      `Bonjour ${Nom_Parent}, ` +
      `l'inscription de ${Nom_Enfant} (${Age_Enfant} ans) est bien recue. ` +
      `Formule: ${Formule}. ` +
      `Notre equipe vous contactera sous 24h pour confirmer le creneau. ` +
      `Merci ! - Les Petits Genies de la Robotique`;

    const academyMsg =
      `NOUVELLE INSCRIPTION: ${Nom_Enfant} (${Age_Enfant} ans, ${Tranche_Age}). ` +
      `Parent: ${Nom_Parent} | Tel: ${Telephone_Parent} | Email: ${email}. ` +
      `Formule: ${Formule}. ` +
      `Creneaux souhaites: ${creneauxText || 'non specifies'}.`;

    const results = await Promise.allSettled([
      client.messages.create({ body: parentMsg, from, to: parentPhone }),
      client.messages.create({ body: academyMsg, from, to: academyPhone })
    ]);

    const parentStatus = results[0].status === 'fulfilled'
      ? { sent: true, sid: results[0].value.sid }
      : { sent: false, error: results[0].reason?.message };
    const academyStatus = results[1].status === 'fulfilled'
      ? { sent: true, sid: results[1].value.sid }
      : { sent: false, error: results[1].reason?.message };

    if (!parentStatus.sent && !academyStatus.sent) {
      return res.status(502).json({ error: 'Echec des deux SMS', parent: parentStatus, academy: academyStatus });
    }

    return res.json({ ok: true, parent: parentStatus, academy: academyStatus });
  } catch (err) {
    console.error('SMS handler error:', err);
    return res.status(500).json({ error: err.message || 'Erreur inconnue' });
  }
};
