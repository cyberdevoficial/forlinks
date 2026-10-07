export const PALETTES = [
  { id: 'lime', name: 'Lima', a: '#B6FF3B', b: '#3BFFB0' },
  { id: 'volt', name: 'Volt', a: '#E4FF3B', b: '#7CFF3B' },
  { id: 'arctic', name: 'Ártico', a: '#3BF2FF', b: '#B6FF3B' },
  { id: 'electric', name: 'Elétrico', a: '#3B8BFF', b: '#3BFFE0' },
  { id: 'amber', name: 'Âmbar', a: '#FFC53B', b: '#FF7A3B' },
];

export const DEFAULT_CONFIG = {
  profile: {
    name: 'Cyberdev',
    handle: '@cyberdev',
    bio: 'Desenvolvedor focado em sistemas, ferramentas e web. Meus links, projetos e contatos em um só lugar.',
    avatar: '',
  },
  theme: { palette: 'lime', accent: '#B6FF3B', accent2: '#3BFFB0' },
  seo: { title: 'Cyberdev — Links', description: 'Links, projetos e contatos de Cyberdev.' },
  socials: [],
  links: [
    { id: 'contato', type: 'link', title: 'Fale comigo', description: 'Suporte e contato direto por e-mail', url: 'mailto:cyberdevsoficial@gmail.com', icon: '', enabled: true },
  ],
};

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '182,255,59';
  const n = parseInt(m[1], 16);
  return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}

export function toPublic(cfg) {
  const links = (cfg.links || []).filter((l) => l.enabled !== false && l.title && (l.type === 'header' || l.url));
  return { ...cfg, links };
}
