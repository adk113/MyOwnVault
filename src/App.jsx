import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Lock, LayoutDashboard, Settings as SettingsIcon, ShieldCheck, Timer } from 'lucide-react';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import ModuleView from './components/ModuleView.jsx';
import Settings from './components/Settings.jsx';
import { ModuleIcon, VaultLogo } from './components/Icons.jsx';
import { ClipboardPill, ThemeSlider, Toasts } from './components/ui.jsx';
import { MODULES, MODULE_MAP } from './data/schema.js';
import { useVault } from './state/VaultContext.jsx';
import { useUI } from './state/UIContext.jsx';

const IDLE_MS = 5 * 60 * 1000; // global inactivity timeout
const ACTIVITY = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll', 'pointerdown'];

/** Flushes keys from memory and returns to login after 5 minutes without interaction. */
function AutoLock() {
  const { lock } = useVault();
  const last = useRef(Date.now());
  const [left, setLeft] = useState(IDLE_MS);

  useEffect(() => {
    const bump = () => {
      last.current = Date.now();
    };
    ACTIVITY.forEach((e) => window.addEventListener(e, bump, { passive: true, capture: true }));
    const id = setInterval(() => {
      const rem = IDLE_MS - (Date.now() - last.current);
      setLeft(rem);
      if (rem <= 0) lock();
    }, 1000);
    return () => {
      ACTIVITY.forEach((e) => window.removeEventListener(e, bump, { capture: true }));
      clearInterval(id);
    };
  }, [lock]);

  const s = Math.max(0, Math.ceil(left / 1000));
  return (
    <span className={`autolock ${s <= 30 ? 'is-soon' : ''}`} title="Vault auto-locks after 5 minutes of inactivity" id="autolock-timer">
      <Timer size={14} /> {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
    </span>
  );
}

function Shell() {
  const { vault, lock } = useVault();
  const { masked, toggleMasked, setMasked } = useUI();
  const [view, setView] = useState('dashboard');
  const scroller = useRef(null);

  useEffect(() => () => setMasked(true), [setMasked]); // re-arm the privacy blur on every lock

  const go = (v) => {
    setView(v);
    scroller.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    ...MODULES.map((m) => ({ id: m.id, label: m.short, icon: <ModuleIcon name={m.icon} size={19} />, hue: m.hue, count: vault.items[m.id].length })),
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={19} /> },
  ];

  return (
    <div className="shell">
      <div className="aurora aurora-soft" aria-hidden="true"><span /><span /><span /></div>
      <aside className="sidebar" aria-label="Primary">
        <div className="side-brand">
          <VaultLogo size={32} />
          <b>MyOwnVault</b>
        </div>
        <nav>
          {nav.map((n) => (
            <button key={n.id} id={`nav-${n.id}`} className={`nav-item ${view === n.id ? 'is-active' : ''}`} style={{ '--hue': n.hue }} onClick={() => go(n.id)} aria-current={view === n.id ? 'page' : undefined}>
              {view === n.id && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="nav-ico">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
              {n.count > 0 && <span className="nav-count">{n.count}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="offline-badge"><span className="dot dot-ok" /> Offline · encrypted</span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{view === 'dashboard' ? 'Overview' : view === 'settings' ? 'Settings' : MODULE_MAP[view].label}</div>
          <div className="topbar-tools">
            <AutoLock />
            <motion.button className={`privacy-btn ${masked ? 'is-masked' : ''}`} whileTap={{ scale: 0.92 }} onClick={toggleMasked} aria-pressed={!masked} id="privacy-toggle" title={masked ? 'Reveal balances and credentials' : 'Blur balances and credentials'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={masked ? 'off' : 'on'} initial={{ opacity: 0, rotate: -40, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 40, scale: 0.6 }} transition={{ duration: 0.16 }} style={{ display: 'flex' }}>
                  {masked ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.span>
              </AnimatePresence>
              <span className="privacy-label">{masked ? 'Hidden' : 'Visible'}</span>
            </motion.button>
            <ThemeSlider />
            <button className="btn btn-soft btn-sm lock-btn" onClick={lock} id="lock-now"><Lock size={15} /> Lock</button>
          </div>
        </header>
        <main className="content" ref={scroller}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={view} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {view === 'dashboard' ? <Dashboard onNavigate={go} /> : view === 'settings' ? <Settings /> : <ModuleView module={MODULE_MAP[view]} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { status } = useVault();
  return (
    <>
      {status === 'loading' && <div className="boot"><span className="logo"><ShieldCheck size={34} /></span></div>}
      {(status === 'uninitialized' || status === 'locked') && <AuthScreen mode={status} />}
      {status === 'unlocked' && <Shell />}
      <Toasts />
      <ClipboardPill />
    </>
  );
}
