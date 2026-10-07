'use client';
import { useEffect, useRef, useState } from 'react';
import { PALETTES } from '@/lib/shared';

const uid = () => 'l' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

const D = {
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z',
  hdr: 'M4 6h16M4 12h10M4 18h6',
};

function Ico({ n, s = 18 }) {
  return (
    <svg width={s} height={s} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d={D[n]} />
    </svg>
  );
}

async function api(path, opts = {}) {
  try {
    const res = await fetch(path, { credentials: 'same-origin', ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    let data = null;
    try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Sem conexão com o servidor.' } };
  }
}

function Field({ label, hint, children }) {
  return (
    <label className='fld'>
      <span>{label}</span>
      {children}
      {hint && <em className='hint'>{hint}</em>}
    </label>
  );
}

function Box({ label, children }) {
  return (
    <div className='fld'>
      <span>{label}</span>
      {children}
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button type='button' role='switch' aria-checked={checked} aria-label={label} className={'sw' + (checked ? ' on' : '')} onClick={() => onChange(!checked)}>
      <i />
    </button>
  );
}

function IconField({ value, onChange, setMsg }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  async function pick(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Falha no envio.');
      onChange(d.url);
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
    setBusy(false);
  }
  return (
    <div className='iconfield'>
      <div className='thumb'>{value ? <img src={value} alt='' /> : <span>—</span>}</div>
      <div className='iconctl'>
        <div className='rowf'>
          <button type='button' className='btn sm' disabled={busy} onClick={() => input.current && input.current.click()}>{busy ? 'Enviando…' : 'Enviar arquivo'}</button>
          {value && <button type='button' className='btn sm ghost' onClick={() => onChange('')}>Remover</button>}
        </div>
        <input className='in' placeholder='ou cole a URL da imagem (https://...)' value={value && !value.startsWith('/api/media/') ? value : ''} onChange={(e) => onChange(e.target.value)} autoCapitalize='none' spellCheck={false} />
        <input ref={input} type='file' hidden accept='.svg,.png,.jpg,.jpeg,.webp,.gif,.avif,.ico,image/*' onChange={pick} />
      </div>
    </div>
  );
}

function Login({ onDone, onCancel }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr('');
    const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ user, pass }) });
    setBusy(false);
    if (!r.ok) {
      setErr((r.data && r.data.error) || 'Falha ao entrar.');
      setPass('');
      return;
    }
    onDone(user.trim(), !!(r.data && r.data.mustChange));
  }
  return (
    <form className='adm-card' onSubmit={submit}>
      <div className='lock'><Ico n='lock' s={20} /></div>
      <h2>Acesso restrito</h2>
      <p className='mute sm'>Entre para gerenciar a página.</p>
      <label className='fld'><span>Usuário</span><input className='in' name='username' autoComplete='username' autoCapitalize='none' autoCorrect='off' spellCheck={false} value={user} onChange={(e) => setUser(e.target.value)} autoFocus required /></label>
      <label className='fld'><span>Senha</span><input className='in' type='password' name='password' autoComplete='current-password' value={pass} onChange={(e) => setPass(e.target.value)} required /></label>
      {err && <p className='err' role='alert'>{err}</p>}
      <div className='actions'>
        <button type='button' className='btn ghost' onClick={onCancel}>Cancelar</button>
        <button className='btn primary' disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </div>
    </form>
  );
}

function ChangeForm({ forced, defaultUser, onDone, onCancel }) {
  const [cur, setCur] = useState('');
  const [user, setUser] = useState(defaultUser || 'admin');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setErr('');
    setOk(false);
    if (pw !== pw2) { setErr('As senhas não coincidem.'); return; }
    setBusy(true);
    const r = await api('/api/auth/password', { method: 'POST', body: JSON.stringify({ current: cur, user, next: pw }) });
    setBusy(false);
    if (!r.ok) { setErr((r.data && r.data.error) || 'Não foi possível alterar.'); return; }
    setCur(''); setPw(''); setPw2(''); setOk(true);
    onDone(user);
  }
  return (
    <form onSubmit={submit}>
      {forced && (
        <>
          <div className='lock'><Ico n='lock' s={20} /></div>
          <h2>Defina suas credenciais</h2>
          <p className='mute sm'>Por segurança, troque o acesso padrão antes de continuar.</p>
        </>
      )}
      <label className='fld'><span>Senha atual</span><input className='in' type='password' autoComplete='current-password' value={cur} onChange={(e) => setCur(e.target.value)} required /></label>
      <label className='fld'><span>Usuário</span><input className='in' autoComplete='username' autoCapitalize='none' spellCheck={false} value={user} onChange={(e) => setUser(e.target.value)} required /></label>
      <label className='fld'><span>Nova senha</span><input className='in' type='password' autoComplete='new-password' value={pw} onChange={(e) => setPw(e.target.value)} required /><em className='hint'>Mínimo de 10 caracteres, com letras e números.</em></label>
      <label className='fld'><span>Confirmar nova senha</span><input className='in' type='password' autoComplete='new-password' value={pw2} onChange={(e) => setPw2(e.target.value)} required /></label>
      {err && <p className='err' role='alert'>{err}</p>}
      {ok && <p className='okmsg'>Credenciais atualizadas.</p>}
      <div className='actions'>
        {onCancel && <button type='button' className='btn ghost' onClick={onCancel}>Cancelar</button>}
        <button className='btn primary' disabled={busy}>{busy ? 'Salvando…' : 'Salvar credenciais'}</button>
      </div>
    </form>
  );
}

function Panel({ user, onClose, onDraft, onUnauth }) {
  const [cfg, setCfg] = useState(null);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('links');
  const [openId, setOpenId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const saved = useRef(null);

  useEffect(() => {
    (async () => {
      const r = await api('/api/admin/config');
      if (r.status === 401 || r.status === 403) return onUnauth(!!(r.data && r.data.mustChange));
      if (!r.ok) return setMsg({ type: 'err', text: 'Não foi possível carregar os dados.' });
      setCfg(r.data.config);
      saved.current = r.data.config;
      setStats((r.data.stats && r.data.stats.clicks) || {});
    })();
  }, []);

  useEffect(() => { if (cfg) onDraft(cfg); }, [cfg]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4500);
    return () => clearTimeout(t);
  }, [msg]);

  if (!cfg) {
    return (
      <div className='adm-card small'>
        <p className='mute'>{msg ? msg.text : 'Carregando…'}</p>
        {msg && <div className='actions'><button className='btn' onClick={() => onClose(null)}>Fechar</button></div>}
      </div>
    );
  }

  const upd = (fn) => { setCfg((prev) => fn(prev)); setDirty(true); };
  const setLink = (id, patch) => upd((c) => ({ ...c, links: c.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const addLink = (type) => {
    const id = uid();
    const item = type === 'header' ? { id, type: 'header', title: 'Nova seção', description: '', url: '', icon: '', enabled: true } : { id, type: 'link', title: '', description: '', url: '', icon: '', enabled: true };
    upd((c) => ({ ...c, links: [item, ...c.links] }));
    setOpenId(id);
  };
  const delLink = (id) => { if (confirm('Excluir este item?')) upd((c) => ({ ...c, links: c.links.filter((l) => l.id !== id) })); };
  const moveTo = (from, to) => upd((c) => {
    if (to < 0 || to >= c.links.length || from === to) return c;
    const a = [...c.links];
    const [it] = a.splice(from, 1);
    a.splice(to, 0, it);
    return { ...c, links: a };
  });
  const setProfile = (patch) => upd((c) => ({ ...c, profile: { ...c.profile, ...patch } }));
  const setSeo = (patch) => upd((c) => ({ ...c, seo: { ...c.seo, ...patch } }));
  const setTheme = (patch) => upd((c) => ({ ...c, theme: { ...c.theme, ...patch } }));
  const addSocial = () => upd((c) => ({ ...c, socials: [...c.socials, { id: uid(), title: '', url: '', icon: '' }] }));
  const setSocial = (id, patch) => upd((c) => ({ ...c, socials: c.socials.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const delSocial = (id) => upd((c) => ({ ...c, socials: c.socials.filter((s) => s.id !== id) }));

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await api('/api/admin/config', { method: 'PUT', body: JSON.stringify({ config: cfg }) });
    setSaving(false);
    if (r.status === 401 || r.status === 403) return onUnauth(!!(r.data && r.data.mustChange));
    if (!r.ok) return setMsg({ type: 'err', text: (r.data && r.data.error) || 'Erro ao salvar.' });
    setCfg(r.data.config);
    saved.current = r.data.config;
    setDirty(false);
    setMsg({ type: 'ok', text: 'Alterações publicadas.' });
  }

  async function logout() {
    if (dirty && !confirm('Há alterações não salvas. Sair mesmo assim?')) return;
    await api('/api/auth/logout', { method: 'POST' });
    onClose(saved.current);
  }

  const close = () => {
    if (dirty && !confirm('Descartar alterações não salvas?')) return;
    onClose(saved.current);
  };

  const total = cfg.links.reduce((a, l) => a + (stats[l.id] || 0), 0);
  const last = cfg.links.length - 1;

  return (
    <div className='panel' role='dialog' aria-label='Painel de configuração'>
      <div className='p-head'>
        <div className='grow'>
          <h2>Painel</h2>
          <p className='mute sm'>Conectado como {user}</p>
        </div>
        <button type='button' className='ico-btn' onClick={close} aria-label='Fechar'><Ico n='x' /></button>
      </div>

      <div className='p-tabs' role='tablist'>
        {[['links', 'Links'], ['perfil', 'Perfil'], ['visual', 'Aparência'], ['seguranca', 'Segurança']].map(([id, name]) => (
          <button key={id} type='button' role='tab' aria-selected={tab === id} className={'tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{name}</button>
        ))}
      </div>

      <div className='p-body'>
        {tab === 'links' && (
          <div>
            <div className='bar'>
              <button type='button' className='btn sm primary' onClick={() => addLink('link')}><Ico n='plus' s={16} /> Novo link</button>
              <button type='button' className='btn sm' onClick={() => addLink('header')}><Ico n='hdr' s={16} /> Nova seção</button>
              <span className='mute sm grow right'>{cfg.links.length} itens · {total} cliques</span>
            </div>
            {cfg.links.length === 0 && <p className='empty'>Nenhum item ainda. Crie o primeiro link.</p>}
            <ul className='items'>
              {cfg.links.map((l, i) => (
                <li
                  key={l.id}
                  className={'ri' + (l.enabled === false ? ' off' : '') + (drag === i ? ' drag' : '')}
                  draggable={openId !== l.id}
                  onDragStart={() => setDrag(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (drag !== null) moveTo(drag, i); setDrag(null); }}
                  onDragEnd={() => setDrag(null)}
                >
                  <div className='ri-head'>
                    <span className='grip' aria-hidden='true'><Ico n='grip' s={16} /></span>
                    {l.type === 'header' ? (
                      <span className='chip'>Seção</span>
                    ) : (
                      <span className='mini'>{l.icon ? <img src={l.icon} alt='' /> : <i>{(l.title || '?').trim().charAt(0).toUpperCase()}</i>}</span>
                    )}
                    <button type='button' className='ri-t' onClick={() => setOpenId(openId === l.id ? null : l.id)}>
                      <strong>{l.title || (l.type === 'header' ? 'Sem título' : 'Novo link')}</strong>
                      {l.type === 'link' && <small>{l.url || 'Sem URL'}</small>}
                    </button>
                    {l.type === 'link' && <span className='chip' title='Cliques'>{stats[l.id] || 0}</span>}
                    <Switch checked={l.enabled !== false} onChange={(v) => setLink(l.id, { enabled: v })} label='Ativo' />
                    <div className='ri-actions'>
                      <button type='button' className='ico-btn' aria-label='Subir' disabled={i === 0} onClick={() => moveTo(i, i - 1)}><Ico n='up' s={16} /></button>
                      <button type='button' className='ico-btn' aria-label='Descer' disabled={i === last} onClick={() => moveTo(i, i + 1)}><Ico n='down' s={16} /></button>
                      <button type='button' className='ico-btn danger' aria-label='Excluir' onClick={() => delLink(l.id)}><Ico n='trash' s={16} /></button>
                    </div>
                  </div>
                  {openId === l.id && (
                    <div className='ri-body'>
                      <Field label={l.type === 'header' ? 'Título da seção' : 'Título'}>
                        <input className='in' value={l.title} maxLength={80} placeholder={l.type === 'header' ? 'Ex.: Projetos' : 'Ex.: Meu Instagram'} onChange={(e) => setLink(l.id, { title: e.target.value })} />
                      </Field>
                      {l.type === 'link' && (
                        <>
                          <Field label='URL'>
                            <input className='in' value={l.url} inputMode='url' autoCapitalize='none' spellCheck={false} placeholder='https://...' onChange={(e) => setLink(l.id, { url: e.target.value })} />
                          </Field>
                          <Field label='Descrição (opcional)'>
                            <input className='in' value={l.description} maxLength={140} onChange={(e) => setLink(l.id, { description: e.target.value })} />
                          </Field>
                          <Box label='Ícone (SVG, PNG, JPG, WEBP, GIF, AVIF, ICO)'>
                            <IconField value={l.icon} onChange={(v) => setLink(l.id, { icon: v })} setMsg={setMsg} />
                          </Box>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'perfil' && (
          <div className='cols'>
            <Field label='Nome'><input className='in' value={cfg.profile.name} maxLength={60} onChange={(e) => setProfile({ name: e.target.value })} /></Field>
            <Field label='Identificador (opcional)'><input className='in' value={cfg.profile.handle} maxLength={40} placeholder='@usuario' onChange={(e) => setProfile({ handle: e.target.value })} /></Field>
            <Field label='Bio' hint={cfg.profile.bio.length + '/280'}><textarea className='in' value={cfg.profile.bio} maxLength={280} onChange={(e) => setProfile({ bio: e.target.value })} /></Field>
            <Box label='Foto / logo'><IconField value={cfg.profile.avatar} onChange={(v) => setProfile({ avatar: v })} setMsg={setMsg} /></Box>
            <Field label='Título da aba / SEO'><input className='in' value={cfg.seo.title} maxLength={70} onChange={(e) => setSeo({ title: e.target.value })} /></Field>
            <Field label='Descrição para buscadores'><input className='in' value={cfg.seo.description} maxLength={160} onChange={(e) => setSeo({ description: e.target.value })} /></Field>
            <div className='sect'>
              <div className='bar'>
                <strong className='grow'>Redes no topo</strong>
                <button type='button' className='btn sm' onClick={addSocial}><Ico n='plus' s={16} /> Adicionar</button>
              </div>
              {cfg.socials.length === 0 && <p className='mute sm'>Ícones pequenos exibidos abaixo da bio.</p>}
              {cfg.socials.map((s) => (
                <div key={s.id} className='soc-ed'>
                  <div className='cols2'>
                    <input className='in' placeholder='Nome (ex.: GitHub)' value={s.title} maxLength={40} onChange={(e) => setSocial(s.id, { title: e.target.value })} />
                    <input className='in' placeholder='https://...' value={s.url} inputMode='url' autoCapitalize='none' spellCheck={false} onChange={(e) => setSocial(s.id, { url: e.target.value })} />
                  </div>
                  <IconField value={s.icon} onChange={(v) => setSocial(s.id, { icon: v })} setMsg={setMsg} />
                  <button type='button' className='btn sm ghost danger' onClick={() => delSocial(s.id)}><Ico n='trash' s={15} /> Remover</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'visual' && (
          <div>
            <Box label='Paletas'>
              <div className='pals'>
                {PALETTES.map((p) => (
                  <button key={p.id} type='button' className={'pal' + (cfg.theme.palette === p.id ? ' on' : '')} onClick={() => setTheme({ palette: p.id, accent: p.a, accent2: p.b })}>
                    <span style={{ background: 'linear-gradient(135deg,' + p.a + ',' + p.b + ')' }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </Box>
            <div className='cols2'>
              <Box label='Cor principal'><input className='color' type='color' value={cfg.theme.accent.toLowerCase()} onChange={(e) => setTheme({ palette: 'custom', accent: e.target.value.toUpperCase() })} /></Box>
              <Box label='Cor do degradê'><input className='color' type='color' value={cfg.theme.accent2.toLowerCase()} onChange={(e) => setTheme({ palette: 'custom', accent2: e.target.value.toUpperCase() })} /></Box>
            </div>
            <p className='mute sm'>A página atrás deste painel mostra a prévia em tempo real.</p>
          </div>
        )}

        {tab === 'seguranca' && (
          <div className='narrow'>
            <h3>Alterar usuário e senha</h3>
            <ChangeForm defaultUser={user} onDone={() => setMsg({ type: 'ok', text: 'Credenciais atualizadas.' })} />
            <div className='sect'>
              <button type='button' className='btn' onClick={logout}><Ico n='out' s={16} /> Sair do painel</button>
            </div>
          </div>
        )}
      </div>

      {msg && <div className={'toast ' + msg.type} role='status'>{msg.text}</div>}

      <div className='p-foot'>
        <span className={'state' + (dirty ? ' dirty' : '')}>{dirty ? 'Alterações não salvas' : 'Tudo publicado'}</span>
        <div className='rowf'>
          <button type='button' className='btn ghost' onClick={close}>Fechar</button>
          <button type='button' className='btn primary' onClick={save} disabled={saving || !dirty}>{saving ? 'Salvando…' : 'Salvar e publicar'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRoot({ onClose, onDraft }) {
  const [phase, setPhase] = useState('loading');
  const [user, setUser] = useState('admin');

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await api('/api/auth/session');
      if (!alive) return;
      if (r.data && r.data.authenticated) {
        setUser(r.data.user);
        setPhase(r.data.mustChange ? 'change' : 'panel');
      } else setPhase('login');
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && phase !== 'panel') onClose(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  return (
    <div className='adm-back' onMouseDown={(e) => { if (e.target === e.currentTarget && phase !== 'panel') onClose(null); }}>
      {phase === 'loading' && <div className='adm-card small'><p className='mute'>Carregando…</p></div>}
      {phase === 'login' && <Login onCancel={() => onClose(null)} onDone={(u, must) => { setUser(u); setPhase(must ? 'change' : 'panel'); }} />}
      {phase === 'change' && (
        <div className='adm-card'>
          <ChangeForm forced defaultUser={user} onCancel={() => onClose(null)} onDone={(u) => { setUser(u); setPhase('panel'); }} />
        </div>
      )}
      {phase === 'panel' && <Panel user={user} onClose={onClose} onDraft={onDraft} onUnauth={(must) => setPhase(must ? 'change' : 'login')} />}
    </div>
  );
}
