import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Moon, Sun, X } from 'lucide-react';
import { useUI } from '../state/UIContext.jsx';
import { getClipboardDeadline, subscribeClipboard } from '../lib/clipboard.js';

const useEscape = (onClose, active = true) => {
  useEffect(() => {
    if (!active) return undefined;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, active]);
};

/** Slide-over sheet (edit forms, assist drawer). */
export function Sheet({ open, onClose, title, subtitle, children, width = 560, footer, icon }) {
  useEscape(onClose, open);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.aside
            className="sheet"
            style={{ width: `min(${width}px, 100vw)` }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="sheet-head">
              {icon}
              <div className="sheet-titles">
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close panel" id="sheet-close"><X size={18} /></button>
            </header>
            <div className="sheet-body">{children}</div>
            {footer && <footer className="sheet-foot">{footer}</footer>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Centered modal dialog. */
export function Modal({ open, onClose, title, children, footer, width = 520, tone }) {
  useEscape(onClose, open);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay overlay-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            className={`modal ${tone ? `modal-${tone}` : ''}`}
            style={{ width: `min(${width}px, 94vw)` }}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="modal-head">
              <h3>{title}</h3>
              <button className="icon-btn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
            </header>
            <div className="modal-body">{children}</div>
            {footer && <footer className="modal-foot">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Theme slider: a sliding switch between ultra-crisp Light and Cyber-Dark. */
export function ThemeSlider() {
  const { theme, toggleTheme } = useUI();
  const dark = theme === 'dark';
  return (
    <button id="theme-slider" className={`theme-slider ${dark ? 'is-dark' : ''}`} onClick={toggleTheme} role="switch" aria-checked={dark} aria-label="Toggle light and dark theme" title={dark ? 'Switch to Light mode' : 'Switch to Cyber-Dark mode'}>
      <Sun size={14} className="ts-sun" />
      <Moon size={14} className="ts-moon" />
      <motion.span className="ts-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={theme} initial={{ rotate: -90, opacity: 0, scale: 0.4 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.4 }} transition={{ duration: 0.18 }} className="ts-icon">
            {dark ? <Moon size={13} /> : <Sun size={13} />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}

export function Toasts() {
  const { toasts } = useUI();
  return createPortal(
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout className={`toast toast-${t.tone}`} initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}>
            {t.tone === 'danger' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/** Floating countdown shown while a copied secret is waiting to be wiped from the clipboard. */
export function ClipboardPill() {
  const deadline = useSyncExternalStore(subscribeClipboard, getClipboardDeadline);
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) return undefined;
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);
  return createPortal(
    <AnimatePresence>
      {deadline && (
        <motion.div className="clip-pill" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
          <ClipboardCheck size={15} />
          Copied · clipboard auto-wipes in <b>{left}s</b>
          <span className="clip-bar"><motion.span key={deadline} initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 30, ease: 'linear' }} /></span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function CountUp({ value, format }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return undefined;
    let raf;
    const start = performance.now();
    const dur = 700;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - (1 - p) ** 3;
      setShown(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(shown)}</>;
}

export function DonutChart({ data, size = 190, thickness = 26, colors }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut" role="img" aria-label="Portfolio diversification chart">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="donut-track" strokeWidth={thickness} />
      {total > 0 &&
        data.map((d, i) => {
          const len = (d.value / total) * c;
          const seg = (
            <motion.circle
              key={d.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(len - 3, 0)} ${c}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            />
          );
          offset += len;
          return seg;
        })}
    </svg>
  );
}
