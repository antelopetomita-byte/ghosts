const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@ghosts.app',
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return; }
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }
    const { subscription, title, body: msg } = body || {};
    if (!subscription) { res.status(400).json({ error: 'no subscription' }); return; }
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: title || 'Ghosts', body: msg || '新しいメッセージ' })
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
