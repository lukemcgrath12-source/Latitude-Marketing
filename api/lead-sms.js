// Instant text confirmation for contact page leads, sent through Mobile Message.
// Called by the site's lead forms (contact, homepage, tradie websites, Black Friday) only after Formspree confirms the enquiry was received.
// Needs these Vercel environment variables (Production):
//   MOBILE_MESSAGE_USERNAME, MOBILE_MESSAGE_PASSWORD  (Mobile Message > Settings > API)
//   MOBILE_MESSAGE_SENDER  (a Sender ID registered on the account)
//   LEAD_NOTIFY_TO         (optional, Luke's mobile for a new lead alert)
// With no credentials set it does nothing and returns 204, so the form keeps working.

const crypto = require('crypto');

const ALLOWED_HOSTS = ['latitudemarketing.au', 'www.latitudemarketing.au'];
const CONFIRM = {
  concept: (n, b) => `Hi ${n}, Luke from Latitude Marketing here. Got your request for a free homepage concept for ${b}. I'll be in touch within one business day. Any questions, just reply to this text. Luke`,
  build: (n, b) => `Hi ${n}, Luke from Latitude Marketing here. Got your free homepage build request for ${b}. I'll be in touch within one business day to get it started. Any questions, just reply to this text. Luke`,
  bf: (n, b) => `Hi ${n}, Luke from Latitude Marketing here. Your Black Friday spot for ${b} is locked in: half price first month on SEO and Google Ads. I'll be in touch within one business day to get started. Any questions, just reply to this text. Luke`,
};
const LABEL = { concept: 'Free concept request', build: 'Free homepage build request', bf: 'Black Friday spot claimed' };
const recent = new Map(); // phone -> last sent time (per instance, best effort)
const WINDOW_MS = 24 * 60 * 60 * 1000;

function clean(v, max) {
  return String(v || '').replace(/[\r\n\t]+/g, ' ').replace(/[<>]/g, '').trim().slice(0, max);
}

function mobile(v) {
  const d = String(v || '').replace(/[^\d+]/g, '').replace(/^\+?61/, '0');
  return /^04\d{8}$/.test(d) ? d : null;
}

async function send(auth, messages, key) {
  const r = await fetch('https://api.mobilemessage.com.au/v1/messages', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ messages }),
  });
  return r.ok;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const origin = req.headers.origin || req.headers.referer || '';
  let host = '';
  try { host = new URL(origin).hostname; } catch (e) {}
  if (!ALLOWED_HOSTS.includes(host)) return res.status(403).end();

  const { MOBILE_MESSAGE_USERNAME: u, MOBILE_MESSAGE_PASSWORD: p, MOBILE_MESSAGE_SENDER: sender, LEAD_NOTIFY_TO: notify } = process.env;
  if (!u || !p || !sender) return res.status(204).end();

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const type = CONFIRM[body.type] ? body.type : 'concept';
  const name = clean(body.name, 30).split(' ')[0];
  const business = clean(body.business, 60);
  const site = clean(body.current_site, 80);
  const to = mobile(body.phone);

  const now = Date.now();
  const messages = [];
  const auth = Buffer.from(u + ':' + p).toString('base64');

  if (to && name && !(recent.get(to) > now - WINDOW_MS)) {
    recent.set(to, now);
    messages.push({
      to,
      sender,
      custom_ref: type + '-confirm',
      message: CONFIRM[type](name, business || 'your business'),
    });
  }

  const alertTo = mobile(notify);
  if (alertTo && (name || business)) {
    messages.push({
      to: alertTo,
      sender,
      custom_ref: 'contact-alert',
      message: `New lead: ${name || '?'} from ${business || '?'}. ${body.phone ? clean(body.phone, 20) : ''}${site ? ' | ' + site : ''}. ${LABEL[type]}.`,
    });
  }

  if (!messages.length) return res.status(204).end();

  const key = crypto.createHash('sha256').update((to || '') + '|' + business + '|' + new Date().toISOString().slice(0, 13)).digest('hex');
  const uuid = [key.slice(0, 8), key.slice(8, 12), '4' + key.slice(13, 16), '8' + key.slice(17, 20), key.slice(20, 32)].join('-');
  try {
    const ok = await send(auth, messages, uuid);
    return res.status(ok ? 200 : 502).json({ ok });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
};
