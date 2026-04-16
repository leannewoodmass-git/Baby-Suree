const { kv } = require('@vercel/kv');

const KEY = 'baby-suree-pub-v1';

module.exports = async function handler(req, res) {
  try {
    // GET — return full data
    if (req.method === 'GET') {
      const data = await kv.get(KEY);
      return res.status(200).json(data ?? null);
    }

    // POST — save event/registry/pin/guests, but NEVER touch rsvps
    // This means admin edits can never accidentally wipe guest RSVPs
    if (req.method === 'POST') {
      const incoming = req.body;
      const current = await kv.get(KEY) || {};
      // Always keep the server's authoritative RSVP list
      incoming.rsvps = current.rsvps || [];
      await kv.set(KEY, incoming);
      return res.status(200).json({ ok: true });
    }

    // PUT — atomically append a single new RSVP
    if (req.method === 'PUT') {
      const newRsvp = req.body;
      const current = await kv.get(KEY) || {};
      const rsvps = Array.isArray(current.rsvps) ? current.rsvps : [];
      // Prevent duplicate names
      if (!rsvps.find(r => r.name.toLowerCase() === newRsvp.name.toLowerCase())) {
        rsvps.push(newRsvp);
        await kv.set(KEY, { ...current, rsvps });
      }
      return res.status(200).json({ ok: true });
    }

    // DELETE — atomically remove one RSVP by id
    if (req.method === 'DELETE') {
      const id = req.query.id;
      const current = await kv.get(KEY) || {};
      const rsvps = (Array.isArray(current.rsvps) ? current.rsvps : []).filter(r => r.id !== id);
      await kv.set(KEY, { ...current, rsvps });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
