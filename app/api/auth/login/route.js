import { checkCredentials, setSession } from '@/lib/auth';
import { json, sameOrigin, limited, ipOf, sleep } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: 'Requisição inválida.' }, 403);
  if (limited('login:' + ipOf(req), 10, 600000)) return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429);
  let b;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }
  const user = String((b && b.user) || '').trim().slice(0, 100);
  const pass = String((b && b.pass) || '').slice(0, 200);
  let a;
  try {
    a = await checkCredentials(user, pass);
  } catch {
    return json({ error: 'Serviço indisponível. Tente novamente.' }, 503);
  }
  if (!a) {
    await sleep(700);
    return json({ error: 'Usuário ou senha inválidos.' }, 401);
  }
  await setSession(a);
  return json({ ok: true, mustChange: !!a.mustChange });
}
