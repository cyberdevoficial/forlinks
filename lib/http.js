export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export function sameOrigin(req) {
  const o = req.headers.get('origin');
  if (!o) return false;
  try {
    return new URL(o).host === req.headers.get('host');
  } catch {
    return false;
  }
}

const buckets = new Map();
export function limited(key, max, ms) {
  const now = Date.now();
  if (buckets.size > 5000) buckets.clear();
  let b = buckets.get(key);
  if (!b || now - b.t > ms) {
    b = { n: 0, t: now };
    buckets.set(key, b);
  }
  b.n += 1;
  return b.n > max;
}

export const ipOf = (req) => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
