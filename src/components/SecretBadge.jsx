import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hash, KeyRound, ShieldCheck, Smartphone, User, Copy } from 'lucide-react';
import Sensitive from './Sensitive.jsx';
import { copySecret } from '../lib/clipboard.js';
import { generateTotp, isValidTotpSecret, secondsRemaining } from '../crypto/totp.js';
import { groupDigits } from '../lib/format.js';
import { useUI } from '../state/UIContext.jsx';

const KIND_ICON = { userid: User, secret: KeyRound, pin: Hash, totp: Smartphone, cardnumber: ShieldCheck, idnum: ShieldCheck, text: Copy };

export function useTotp(secret) {
  const [state, setState] = useState({ code: null, left: 30 });
  useEffect(() => {
    if (!secret || !isValidTotpSecret(secret)) {
      setState({ code: null, left: 30 });
      return undefined;
    }
    let alive = true;
    let lastCounter = -1;
    const tick = async () => {
      const now = Date.now();
      const counter = Math.floor(now / 30000);
      const left = secondsRemaining(now);
      if (counter !== lastCounter) {
        lastCounter = counter;
        const code = await generateTotp(secret, now);
        if (alive) setState({ code, left });
      } else if (alive) setState((s) => ({ ...s, left }));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [secret]);
  return state;
}

/** Animated check mark drawn stroke-by-stroke. */
export const CheckDraw = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
  </svg>
);

/**
 * Tap-to-copy secure pill. Value is masked by the global privacy toggle,
 * copying is always possible, and the system clipboard is wiped 30 s later.
 */
export default function SecretBadge({ label, value, kind = 'secret', size = 'md', block = false }) {
  const { toast } = useUI();
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  const isTotp = kind === 'totp';
  const totp = useTotp(isTotp ? value : null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const display = isTotp ? (totp.code ? `${totp.code.slice(0, 3)} ${totp.code.slice(3)}` : 'invalid key') : kind === 'cardnumber' ? groupDigits(value) : value;
  const toCopy = isTotp ? totp.code : kind === 'cardnumber' ? String(value).replace(/\s+/g, '') : value;
  const disabled = !toCopy;

  const onCopy = useCallback(async () => {
    if (disabled) return;
    const ok = await copySecret(toCopy);
    if (!ok) return toast('Copy was blocked by the browser', 'danger');
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1700);
  }, [disabled, toCopy, toast]);

  const Icon = KIND_ICON[kind] || Copy;
  const circ = 2 * Math.PI * 9;

  return (
    <motion.button
      type="button"
      className={`pill pill-${kind} pill-${size} ${copied ? 'is-copied' : ''} ${block ? 'pill-block' : ''}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.93 }}
      onClick={onCopy}
      disabled={disabled}
      aria-label={`Copy ${label}`}
      title={`Tap to copy ${label}`}
    >
      <span className="pill-icon">
        <AnimatePresence mode="popLayout" initial={false}>
          {copied ? (
            <motion.span key="ok" className="pill-ok" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
              <CheckDraw />
            </motion.span>
          ) : isTotp && totp.code ? (
            <motion.span key="ring" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <svg width="22" height="22" viewBox="0 0 22 22" className={`ring ${totp.left <= 5 ? 'ring-warn' : ''}`}>
                <circle cx="11" cy="11" r="9" className="ring-bg" />
                <circle cx="11" cy="11" r="9" className="ring-fg" strokeDasharray={circ} strokeDashoffset={circ * (1 - totp.left / 30)} transform="rotate(-90 11 11)" />
                <text x="11" y="14.2" textAnchor="middle" className="ring-n">{totp.left}</text>
              </svg>
            </motion.span>
          ) : (
            <motion.span key="ic" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
              <Icon size={15} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="pill-body">
        <span className="pill-label">{copied ? 'Copied!' : label}</span>
        <Sensitive className="pill-value" mask={isTotp ? '••• •••' : '••••••••'}>{display}</Sensitive>
      </span>
    </motion.button>
  );
}
