import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getAuth } from './store';

export const DEFAULT_USER = 'admin';
export const DEFAULT_PASS = 'admin123';
const COOKIE = 'fl_session';
const TTL = 8 * 3600;

const secret = () => {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) throw new Error('APP_SECRET ausente');
  return s;
};
const sign = (d) => crypto.createHmac('sha256', secret()).update(d).digest('base64url');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const kdf = (pw, salt) =>
  new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await kdf(pw, salt);
  return 's1$' + salt.toString('base64') + '$' + key.toString('base64');
}

async function verifyHash(pw, stored) {
  const [v, s, k] = String(stored).split('$');
  if (v !== 's1' || !s || !k) return false;
  const key = await kdf(pw, Buffer.from(s, 'base64'));
  const exp = Buffer.from(k, 'base64');
  return exp.length === key.length && crypto.timingSafeEqual(exp, key);
}

export async function loadAuth() {
  return (await getAuth()) || { user: DEFAULT_USER, hash: null, mustChange: true, av: 1 };
}

export async function checkCredentials(user, pass) {
  const a = await loadAuth();
  const userOk = same(user, a.user);
  const passOk = a.hash ? await verifyHash(pass, a.hash) : same(pass, DEFAULT_PASS);
  return userOk && passOk ? a : null;
}

const cookieOpts = (maxAge) => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge });

export async function setSession(a) {
  const p = Buffer.from(JSON.stringify({ u: a.user, av: a.av, exp: Date.now() + TTL * 1000 })).toString('base64url');
  (await cookies()).set(COOKIE, p + '.' + sign(p), cookieOpts(TTL));
}

export async function clearSession() {
  (await cookies()).set(COOKIE, '', cookieOpts(0));
}

export async function getSession() {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const [p, sig] = t.split('.');
  if (!p || !sig) return null;
  const x = Buffer.from(sig);
  const y = Buffer.from(sign(p));
  if (x.length !== y.length || !crypto.timingSafeEqual(x, y)) return null;
  let d;
  try {
    d = JSON.parse(Buffer.from(p, 'base64url').toString());
  } catch {
    return null;
  }
  if (!d || !d.exp || d.exp < Date.now()) return null;
  const auth = await loadAuth();
  if (d.av !== auth.av || d.u !== auth.user) return null;
  return { user: auth.user, mustChange: !!auth.mustChange };
}

export async function requireAdmin(allowMustChange = false) {
  const s = await getSession();
  if (!s) return { error: 401 };
  if (s.mustChange && !allowMustChange) return { error: 403, mustChange: true };
  return { session: s };
}
