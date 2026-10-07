import { requireAdmin } from '@/lib/auth';
import { getConfig, putConfig, getStats, cleanupMedia } from '@/lib/store';
import { sanitizeConfig, mediaNames } from '@/lib/sanitize';
import { json, sameOrigin } from '@/lib/http';

export const dynamic = 'force-dynamic';

const deny = (g) => json({ error: 'Não autorizado.', mustChange: !!g.mustChange }, g.error);

export async function GET() {
  const g = await requireAdmin();
  if (g.error) return deny(g);
  try {
    const [config, stats] = await Promise.all([getConfig(), getStats()]);
    return json({ config, stats });
  } catch {
    return json({ error: 'Falha ao ler os dados.' }, 500);
  }
}

export async function PUT(req) {
  if (!sameOrigin(req)) return json({ error: 'Requisição inválida.' }, 403);
  const g = await requireAdmin();
  if (g.error) return deny(g);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }
  const { config, errors } = sanitizeConfig(body && body.config);
  if (errors.length) return json({ error: errors.slice(0, 4).join(' '), errors }, 400);
  try {
    await putConfig(config);
  } catch {
    return json({ error: 'Falha ao salvar no armazenamento.' }, 500);
  }
  try {
    await cleanupMedia(mediaNames(config));
  } catch {}
  return json({ config });
}
