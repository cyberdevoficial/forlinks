import { clearSession } from '@/lib/auth';
import { json, sameOrigin } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: 'Requisição inválida.' }, 403);
  await clearSession();
  return json({ ok: true });
}
