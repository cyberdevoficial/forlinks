import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/auth';
import { saveMedia } from '@/lib/store';
import { json, sameOrigin } from '@/lib/http';

export const dynamic = 'force-dynamic';

const MAX = 2 * 1024 * 1024;
const eq = (buf, off, str) => buf.subarray(off, off + str.length).toString('latin1') === str;

function detect(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && eq(buf, 1, 'PNG')) return { ext: 'png', type: 'image/png' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (eq(buf, 0, 'GIF8')) return { ext: 'gif', type: 'image/gif' };
  if (eq(buf, 0, 'RIFF') && eq(buf, 8, 'WEBP')) return { ext: 'webp', type: 'image/webp' };
  if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) return { ext: 'ico', type: 'image/x-icon' };
  if (eq(buf, 4, 'ftyp') && (eq(buf, 8, 'avif') || eq(buf, 8, 'avis'))) return { ext: 'avif', type: 'image/avif' };
  if (buf.length <= 500000) {
    const t = buf.toString('utf8').split(String.fromCharCode(65279)).join('').trimStart();
    if (t.startsWith('<') && t.slice(0, 2000).toLowerCase().includes('<svg')) {
      const low = t.toLowerCase();
      const bad = ['<script', '<foreignobject', 'javascript:', '<iframe', '<embed', '<object', 'data:text/html', '<!entity'];
      if (bad.some((x) => low.includes(x))) return null;
      if (/[\s/"']on[a-z]+\s*=/.test(low)) return null;
      return { ext: 'svg', type: 'image/svg+xml' };
    }
  }
  return null;
}

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: 'Requisição inválida.' }, 403);
  const g = await requireAdmin();
  if (g.error) return json({ error: 'Não autorizado.' }, g.error);
  let file;
  try {
    file = (await req.formData()).get('file');
  } catch {
    return json({ error: 'Envio inválido.' }, 400);
  }
  if (!file || typeof file === 'string' || !file.size) return json({ error: 'Selecione um arquivo.' }, 400);
  if (file.size > MAX) return json({ error: 'Arquivo acima de 2 MB.' }, 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = detect(buf);
  if (!kind) return json({ error: 'Formato não suportado. Use SVG, PNG, JPG, WEBP, GIF, AVIF ou ICO.' }, 415);
  const name = Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex') + '.' + kind.ext;
  try {
    await saveMedia(name, buf, kind.type);
  } catch {
    return json({ error: 'Falha ao enviar o arquivo.' }, 500);
  }
  return json({ url: '/api/media/' + name });
}
