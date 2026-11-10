// Global leaderboard for the landing page games. Wins only.
// Storage: Upstash Redis over REST (Vercel Marketplace sets KV_REST_API_* or UPSTASH_REDIS_REST_*).
// A win needs a signed ticket issued when the game started, old enough to be a real game, used once.
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.LB_SECRET || (TOKEN ? crypto.createHash('sha256').update('lb:' + TOKEN).digest('hex') : '');
const MIN_SECONDS = { chess: 45, checkers: 40, poker: 30 };

async function redis(cmds) {
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).map((x) => x.result);
}
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex').slice(0, 32);
const clean = (n) => String(n || '').normalize('NFKC').replace(/[^\p{L}\p{N} ._'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'offline' });
  try {
    if (req.method === 'GET') {
      const g = String((req.query && req.query.game) || '');
      if (!MIN_SECONDS[g]) return res.status(400).json({ error: 'game' });
      const [z] = await redis([['ZREVRANGE', 'lb:' + g, 0, 19, 'WITHSCORES']]);
      const top = [];
      for (let i = 0; i < (z || []).length; i += 2) top.push({ name: z[i], wins: +z[i + 1] });
      return res.status(200).json({ game: g, top });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const g = String(b.game || '');
    if (!MIN_SECONDS[g]) return res.status(400).json({ error: 'game' });

    if (b.op === 'start') {
      const raw = `${g}.${crypto.randomBytes(9).toString('hex')}.${Date.now()}`;
      return res.status(200).json({ ticket: raw + '.' + sign(raw) });
    }
    if (b.op === 'win') {
      const name = clean(b.name);
      if (name.length < 2) return res.status(400).json({ error: 'name' });
      const parts = String(b.ticket || '').split('.');
      if (parts.length !== 4) return res.status(400).json({ error: 'ticket' });
      const [tg, id, t, sig] = parts;
      const raw = `${tg}.${id}.${t}`;
      if (tg !== g || sign(raw) !== sig) return res.status(400).json({ error: 'ticket' });
      const age = (Date.now() - +t) / 1000;
      if (age < MIN_SECONDS[g] || age > 6 * 3600) return res.status(400).json({ error: 'too fast' });
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      const [fresh, count] = await redis([['SET', 'lbt:' + id, '1', 'NX', 'EX', 86400], ['INCR', 'lbip:' + ip], ['EXPIRE', 'lbip:' + ip, 3600]]);
      if (fresh !== 'OK') return res.status(409).json({ error: 'used' });
      if (+count > 20) return res.status(429).json({ error: 'slow down' });
      const [score, rank] = await redis([['ZINCRBY', 'lb:' + g, 1, name], ['ZREVRANK', 'lb:' + g, name]]);
      return res.status(200).json({ name, wins: +score, rank: +rank + 1 });
    }
    return res.status(400).json({ error: 'op' });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
