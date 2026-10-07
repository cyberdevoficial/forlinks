'use client';
import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { hexToRgb, toPublic } from '@/lib/shared';

const Admin = dynamic(() => import('./Admin'), { ssr: false });

const isWeb = (u) => u.startsWith('http');

function track(id) {
  try {
    const body = JSON.stringify({ id });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/click', new Blob([body], { type: 'application/json' }));
    else fetch('/api/click', { method: 'POST', body, keepalive: true });
  } catch {}
}

function Arrow() {
  return (
    <svg className='arrow' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M7 17 17 7' />
      <path d='M8 7h9v9' />
    </svg>
  );
}

export default function LinkPage({ config: initial }) {
  const [config, setConfig] = useState(initial);
  const [adminOpen, setAdminOpen] = useState(false);
  const taps = useRef({ n: 0, t: 0 });
  const { profile, theme, socials, links } = config;

  const secret = useCallback(() => {
    const now = Date.now();
    const k = taps.current;
    if (now - k.t > 2500) k.n = 0;
    k.t = now;
    k.n += 1;
    if (k.n >= 5) {
      k.n = 0;
      setAdminOpen(true);
    }
  }, []);

  const vars = {
    '--accent': theme.accent,
    '--accent2': theme.accent2,
    '--accent-rgb': hexToRgb(theme.accent),
    '--accent2-rgb': hexToRgb(theme.accent2),
  };

  return (
    <div className='shell' style={vars}>
      <div className='bg' aria-hidden='true' />
      <main className='layout'>
        <header className='profile'>
          <div className='avatar'>
            {profile.avatar ? <img src={profile.avatar} alt={profile.name} /> : <span>{(profile.name || 'C').trim().slice(0, 2).toUpperCase()}</span>}
          </div>
          <h1>{profile.name}</h1>
          {profile.handle && <p className='handle'>{profile.handle}</p>}
          {profile.bio && <p className='bio'>{profile.bio}</p>}
          {socials.length > 0 && (
            <ul className='socials'>
              {socials.map((s) => (
                <li key={s.id}>
                  <a className='soc' href={s.url} target='_blank' rel='noopener noreferrer nofollow' aria-label={s.title} title={s.title}>
                    {s.icon ? <img src={s.icon} alt='' /> : <b>{(s.title || '?').charAt(0).toUpperCase()}</b>}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </header>

        <section className='links' aria-label='Links'>
          {links.length === 0 ? (
            <p className='none'>Nenhum link por aqui ainda.</p>
          ) : (
            <ul>
              {links.map((l, i) =>
                l.type === 'header' ? (
                  <li key={l.id} className='group' style={{ '--i': i }}>{l.title}</li>
                ) : (
                  <li key={l.id} style={{ '--i': i }}>
                    <a className='card' href={l.url} {...(isWeb(l.url) ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})} onClick={() => track(l.id)}>
                      <span className='tile'>
                        {l.icon ? <img src={l.icon} alt='' loading='lazy' decoding='async' /> : <b>{l.title.trim().charAt(0).toUpperCase()}</b>}
                      </span>
                      <span className='txt'>
                        <strong>{l.title}</strong>
                        {l.description && <small>{l.description}</small>}
                      </span>
                      <Arrow />
                    </a>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      </main>

      <footer className='foot'>
        <span>
          <span className='sec' onClick={secret}>©</span> {new Date().getFullYear()} Cyberdev. Todos os direitos reservados.
        </span>
        <a href='mailto:cyberdevsoficial@gmail.com'>Suporte: cyberdevsoficial@gmail.com</a>
      </footer>

      {adminOpen && (
        <Admin
          onDraft={(c) => setConfig(toPublic(c))}
          onClose={(last) => {
            setAdminOpen(false);
            if (last) setConfig(toPublic(last));
          }}
        />
      )}
    </div>
  );
}
