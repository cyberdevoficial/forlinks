import { requireAdmin, checkCredentials, hashPassword, setSession, DEFAULT_PASS } from '@/lib/auth';
import { putAuth } from '@/lib/store';
import { json, sameOrigin, limited, ipOf, sleep } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: 'Requisição inválida.' }, 403);
  const g = await requireAdmin(true);
  if (g.error) return json({ error: 'Não autorizado.' }, g.error);
  if (limited('pw:' + ipOf(req), 10, 600000)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429);
  let b;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }
  const current = String((b && b.current) || '');
  const next = String((b && b.next) || '');
  const user = String((b && b.user) || g.session.user).trim();
  const a = await checkCredentials(g.session.user, current);
  if (!a) {
    await sleep(600);
    return json({ error: 'Senha atual incorreta.' }, 401);
  }
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(user)) return json({ error: 'Usuário: 3 a 32 caracteres (letras, números, ponto, hífen ou sublinhado).' }, 400);
  if (next.length < 10 || next.length > 128) return json({ error: 'A nova senha precisa ter de 10 a 128 caracteres.' }, 400);
  if (!/[a-zA-Z]/.test(next) || !/[0-9]/.test(next)) return json({ error: 'Use letras e números na nova senha.' }, 400);
  if (next === DEFAULT_PASS || next.toLowerCase() === user.toLowerCase()) return json({ error: 'Escolha uma senha diferente da padrão.' }, 400);
  const updated = { user, hash: await hashPassword(next), mustChange: false, av: (a.av || 1) + 1 };
  try {
    await putAuth(updated);
  } catch {
    return json({ error: 'Falha ao salvar. Tente novamente.' }, 500);
  }
  await setSession(updated);
  return json({ ok: true });
}
