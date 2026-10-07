import { DEFAULT_CONFIG } from './shared';

export const ID_RE = /^[a-z0-9_-]{1,40}$/i;
const HEX = /^#[0-9a-f]{6}$/i;
const NAME_RE = /^[a-z0-9][a-z0-9._-]{0,120}$/i;
const MEDIA_PREFIX = '/api/media/';

export const isMediaName = (n) => typeof n === 'string' && NAME_RE.test(n);

function clean(v, max, keepNl) {
  if (typeof v !== 'string') return '';
  let out = '';
  for (const ch of v) {
    const c = ch.codePointAt(0);
    if (c === 10) out += keepNl ? ch : ' ';
    else if (c === 13) continue;
    else if (c < 32 || c === 127) out += ' ';
    else out += ch;
  }
  return out.trim().slice(0, max);
}
const line = (v, max) => clean(v, max, false);

export function safeUrl(v) {
  const u = line(v, 500);
  if (!u) return '';
  const low = u.toLowerCase();
  if (low.startsWith('mailto:') || low.startsWith('tel:')) return u.includes(' ') || u.length < 7 ? '' : u;
  const full = /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u;
  try {
    const x = new URL(full);
    if (x.protocol !== 'https:' && x.protocol !== 'http:') return '';
    if (!x.hostname.includes('.')) return '';
    return x.toString();
  } catch {
    return '';
  }
}

export function safeMedia(v) {
  const u = line(v, 500);
  if (!u) return '';
  if (u.startsWith(MEDIA_PREFIX)) return isMediaName(u.slice(MEDIA_PREFIX.length)) ? u : '';
  try {
    const x = new URL(u);
    return x.protocol === 'https:' ? x.toString() : '';
  } catch {
    return '';
  }
}

export function mediaNames(cfg) {
  const s = new Set();
  const add = (u) => { if (u && u.startsWith(MEDIA_PREFIX)) s.add(u.slice(MEDIA_PREFIX.length)); };
  add(cfg.profile.avatar);
  cfg.socials.forEach((o) => add(o.icon));
  cfg.links.forEach((o) => add(o.icon));
  return s;
}

const hex = (v, d) => (typeof v === 'string' && HEX.test(v) ? v.toUpperCase() : d);
const obj = (v) => (v && typeof v === 'object' ? v : {});

export function sanitizeConfig(input) {
  const errors = [];
  const i = obj(input);
  const p = obj(i.profile);
  const t = obj(i.theme);
  const s = obj(i.seo);
  const D = DEFAULT_CONFIG;
  const used = new Set();
  const mkId = (raw, n) => {
    let id = typeof raw === 'string' && ID_RE.test(raw) ? raw : '';
    if (!id || used.has(id)) id = 'x' + Date.now().toString(36) + n;
    while (used.has(id)) id += 'z';
    used.add(id);
    return id;
  };

  const links = (Array.isArray(i.links) ? i.links : []).slice(0, 500).map((raw, n) => {
    const o = obj(raw);
    const type = o.type === 'header' ? 'header' : 'link';
    const title = line(o.title, 80);
    const out = { id: mkId(o.id, n), type, title, description: '', url: '', icon: '', enabled: o.enabled !== false };
    if (type === 'link') {
      out.description = line(o.description, 140);
      out.url = safeUrl(o.url);
      out.icon = safeMedia(o.icon);
      if (!title) errors.push('Link ' + (n + 1) + ': informe um título.');
      if (!out.url) errors.push('Link "' + (title || n + 1) + '": URL inválida.');
    } else if (!title) {
      errors.push('Seção ' + (n + 1) + ': informe um título.');
    }
    return out;
  });

  const socials = (Array.isArray(i.socials) ? i.socials : []).slice(0, 30).map((raw, n) => {
    const o = obj(raw);
    const out = { id: mkId(o.id, 's' + n), title: line(o.title, 40), url: safeUrl(o.url), icon: safeMedia(o.icon) };
    if (!out.title) errors.push('Rede ' + (n + 1) + ': informe um nome.');
    if (!out.url) errors.push('Rede "' + (out.title || n + 1) + '": URL inválida.');
    return out;
  });

  const config = {
    profile: {
      name: line(p.name, 60) || D.profile.name,
      handle: line(p.handle, 40),
      bio: clean(p.bio, 280, true),
      avatar: safeMedia(p.avatar),
    },
    theme: {
      palette: line(t.palette, 20) || 'custom',
      accent: hex(t.accent, D.theme.accent),
      accent2: hex(t.accent2, D.theme.accent2),
    },
    seo: {
      title: line(s.title, 70) || D.seo.title,
      description: line(s.description, 160) || D.seo.description,
    },
    socials,
    links,
  };
  return { config, errors };
}
