import { cache } from 'react';
import { put, get, del, list } from '@vercel/blob';
import { DEFAULT_CONFIG, toPublic } from './shared';
import { sanitizeConfig } from './sanitize';

const P = { config: 'data/config.json', auth: 'data/auth.json', stats: 'data/stats.json' };

async function readJson(pathname) {
  try {
    const r = await get(pathname, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) {
    if (e && (e.name === 'BlobNotFoundError' || /not found/i.test(String(e.message)))) return null;
    throw e;
  }
}

async function writeJson(pathname, data) {
  await put(pathname, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}

export const getPublicConfig = cache(async () => {
  try {
    const raw = await readJson(P.config);
    return toPublic(raw ? sanitizeConfig(raw).config : structuredClone(DEFAULT_CONFIG));
  } catch {
    return toPublic(structuredClone(DEFAULT_CONFIG));
  }
});

export async function getConfig() {
  const raw = await readJson(P.config);
  return raw ? sanitizeConfig(raw).config : structuredClone(DEFAULT_CONFIG);
}
export const putConfig = (c) => writeJson(P.config, c);

export const getAuth = () => readJson(P.auth);
export const putAuth = (a) => writeJson(P.auth, a);

export async function getStats() {
  return (await readJson(P.stats)) || { clicks: {} };
}
export const putStats = (s) => writeJson(P.stats, s);

export async function saveMedia(name, buf, type) {
  await put('media/' + name, buf, { access: 'private', addRandomSuffix: false, contentType: type, cacheControlMaxAge: 31536000 });
}
export const getMedia = (name) => get('media/' + name, { access: 'private' });

export async function cleanupMedia(keep) {
  const out = await list({ prefix: 'media/', limit: 1000 });
  const old = out.blobs
    .filter((b) => !keep.has(b.pathname.slice(6)) && Date.now() - new Date(b.uploadedAt).getTime() > 900000)
    .map((b) => b.url);
  if (old.length) await del(old);
}
