import { getStats, putStats } from '@/lib/store';
import { ID_RE } from '@/lib/sanitize';
import { json, limited, ipOf } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (limited('click:' + ipOf(req), 60, 60000)) return json({ ok: false }, 429);
  let id = '';
  try {
    id = String(((await req.json()) || {}).id || '');
  } catch {
    return json({ ok: false }, 400);
  }
  if (!ID_RE.test(id)) return json({ ok: false }, 400);
  try {
    const s = await getStats();
    const clicks = s.clicks || {};
    if (id in clicks || Object.keys(clicks).length < 800) {
      clicks[id] = (clicks[id] || 0) + 1;
      await putStats({ clicks });
    }
  } catch {}
  return json({ ok: true });
}
