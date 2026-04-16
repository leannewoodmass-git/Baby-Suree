import { kv } from '@vercel/kv';

const KEY = 'baby-suree-pub-v1';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await kv.get(KEY);
    return res.status(200).json(data ?? null);
  }

  if (req.method === 'POST') {
    await kv.set(KEY, req.body);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
