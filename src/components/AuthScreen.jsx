import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Fingerprint, Loader2, LockKeyhole, ShieldCheck, WifiOff } from 'lucide-react';
import PasswordInput from './PasswordInput.jsx';
import { Modal, ThemeSlider } from './ui.jsx';
import { MIN_PASSWORD, scorePassword } from '../lib/password.js';
import { normalizeMnemonic, useVault } from '../state/VaultContext.jsx';

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.28, ease: 'easeOut' },
};

function Brand({ sub }) {
  return (
    <div className="brand">
      <motion.div className="logo" initial={{ scale: 0.6, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
        <ShieldCheck size={34} />
      </motion.div>
      <h1>MyOwnVault</h1>
      <p>{sub}</p>
    </div>
  );
}

function Setup() {
  const { setup } = useVault();
  const [step, setStep] = useState('password');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const mnemonic = useMemo(() => generateMnemonic(wordlist, 128), []);
  const words = mnemonic.split(' ');
  const quiz = useMemo(() => {
    const a = Math.floor(Math.random() * 6);
    return [a, 6 + Math.floor(Math.random() * 6)];
  }, []);
  const [answers, setAnswers] = useState(['', '']);

  const toPhrase = () => {
    setErr('');
    if (pw.length < MIN_PASSWORD) return setErr(`Use at least ${MIN_PASSWORD} characters.`);
    if (scorePassword(pw).score < 2) return setErr('That password is too easy to guess – add length or variety.');
    if (pw !== pw2) return setErr('Passwords do not match.');
    setStep('phrase');
  };

  const finish = async () => {
    setErr('');
    if (quiz.some((q, i) => answers[i].trim().toLowerCase() !== words[q])) return setErr('Those words don’t match – check your written copy.');
    setBusy(true);
    try {
      await setup(pw, mnemonic);
    } catch (e) {
      console.error(e);
      setErr('Setup failed – this browser may not support secure storage.');
      setBusy(false);
    }
  };

  return (
    <>
      <Brand sub="Create your zero-knowledge vault" />
      <div className="steps" aria-hidden="true">
        {['password', 'phrase', 'verify'].map((s, i) => (
          <span key={s} className={['password', 'phrase', 'verify'].indexOf(step) >= i ? 'on' : ''} />
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {step === 'password' && (
          <motion.div key="p" {...slide} className="auth-step">
            <PasswordInput id="setup-password" label="Master password" value={pw} onChange={setPw} meter autoFocus autoComplete="new-password" placeholder="Min. 10 characters" />
            <PasswordInput id="setup-password2" label="Confirm master password" value={pw2} onChange={setPw2} autoComplete="new-password" onEnter={toPhrase} />
            <p className="auth-note">Your password never leaves this device and is <b>not recoverable</b> – except with the recovery phrase you’ll receive next.</p>
            {err && <p className="form-error" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" onClick={toPhrase} id="setup-continue">Continue <ArrowRight size={16} /></button>
          </motion.div>
        )}
        {step === 'phrase' && (
          <motion.div key="r" {...slide} className="auth-step">
            <h2 className="auth-h">Your 12-word recovery phrase</h2>
            <p className="auth-note">Write these words down in order and keep them offline. They are the <b>only</b> way back in if you forget your password.</p>
            <div className={`seed ${reveal ? '' : 'seed-hidden'}`} id="seed-grid">
              {words.map((w, i) => (
                <span key={i}><em>{i + 1}</em>{reveal ? w : '••••••'}</span>
              ))}
            </div>
            <button className="btn btn-soft btn-block" onClick={() => setReveal((r) => !r)} id="seed-reveal">
              {reveal ? <><EyeOff size={16} /> Hide words</> : <><Eye size={16} /> Reveal words</>}
            </button>
            <label className="check check-block">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} id="seed-saved" />
              <span>I wrote the phrase down and stored it safely</span>
            </label>
            <div className="auth-row">
              <button className="btn btn-ghost" onClick={() => setStep('password')}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" disabled={!saved || !reveal} onClick={() => (setReveal(false), setStep('verify'))} id="seed-next">Verify <ArrowRight size={16} /></button>
            </div>
          </motion.div>
        )}
        {step === 'verify' && (
          <motion.div key="v" {...slide} className="auth-step">
            <h2 className="auth-h">Quick check</h2>
            <p className="auth-note">Enter the requested words from your written copy.</p>
            {quiz.map((q, i) => (
              <div className="field" key={q}>
                <label htmlFor={`quiz-${i}`}>Word #{q + 1}</label>
                <input id={`quiz-${i}`} className="input" autoComplete="off" autoCapitalize="none" spellCheck={false} value={answers[i]} onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
              </div>
            ))}
            {err && <p className="form-error" role="alert">{err}</p>}
            <div className="auth-row">
              <button className="btn btn-ghost" onClick={() => setStep('phrase')} disabled={busy}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={finish} disabled={busy} id="create-vault">
                {busy ? <><Loader2 size={16} className="spin" /> Deriving 600,000-round key…</> : <>Create vault <CheckCircle2 size={16} /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Login() {
  const { unlock, unlockBiometric, recover, flags, eraseAll } = useVault();
  const [mode, setMode] = useState('login');
  const [pw, setPw] = useState('');
  const [phrase, setPhrase] = useState('');
  const [npw, setNpw] = useState('');
  const [npw2, setNpw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseText, setEraseText] = useState('');
  const [shake, setShake] = useState(0);

  const fail = (m) => (setErr(m), setShake((s) => s + 1), setBusy(false));

  const doUnlock = async () => {
    if (!pw || busy) return;
    setBusy(true);
    setErr('');
    const r = await unlock(pw);
    if (!r.ok) return fail(r.error);
    setPw('');
  };
  const doBio = async () => {
    setErr('');
    const r = await unlockBiometric();
    if (!r.ok) fail(r.error);
  };
  const doRecover = async () => {
    setErr('');
    const norm = normalizeMnemonic(phrase);
    if (!validateMnemonic(norm, wordlist)) return fail('That is not a valid 12-word recovery phrase.');
    if (npw.length < MIN_PASSWORD) return fail(`New password needs at least ${MIN_PASSWORD} characters.`);
    if (scorePassword(npw).score < 2) return fail('Choose a stronger password.');
    if (npw !== npw2) return fail('Passwords do not match.');
    setBusy(true);
    const r = await recover(norm, npw);
    if (!r.ok) fail(r.error);
  };

  return (
    <>
      <Brand sub={mode === 'login' ? 'Welcome back – your vault is locked' : 'Reset your password with your recovery phrase'} />
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'login' ? (
          <motion.form key="l" {...slide} className="auth-step" onSubmit={(e) => (e.preventDefault(), doUnlock())}>
            <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -8, 8, 0] } : {}} transition={{ duration: 0.4 }}>
              <PasswordInput id="login-password" label="Master password" value={pw} onChange={setPw} autoFocus placeholder="Enter your master password" />
            </motion.div>
            {err && <p className="form-error" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={busy || !pw} id="unlock-btn">
              {busy ? <><Loader2 size={16} className="spin" /> Deriving key…</> : <><LockKeyhole size={16} /> Unlock vault</>}
            </button>
            {flags.hasBio && (
              <button type="button" className="btn btn-soft btn-block" onClick={doBio} id="bio-unlock"><Fingerprint size={18} /> Unlock with biometrics</button>
            )}
            <div className="auth-links">
              <button type="button" className="link" onClick={() => (setMode('recover'), setErr(''))} id="forgot-link">Forgot password?</button>
              <button type="button" className="link link-danger" onClick={() => setEraseOpen(true)}>Erase vault</button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="r" {...slide} className="auth-step">
            <div className="field">
              <label htmlFor="recover-phrase">12-word recovery phrase</label>
              <textarea id="recover-phrase" className="input mono" rows={3} autoCapitalize="none" spellCheck={false} value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="word1 word2 word3 …" />
            </div>
            <PasswordInput id="recover-new" label="New master password" value={npw} onChange={setNpw} meter autoComplete="new-password" />
            <PasswordInput id="recover-new2" label="Confirm new password" value={npw2} onChange={setNpw2} autoComplete="new-password" />
            {err && <p className="form-error" role="alert">{err}</p>}
            <div className="auth-row">
              <button className="btn btn-ghost" onClick={() => (setMode('login'), setErr(''))} disabled={busy}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={doRecover} disabled={busy} id="recover-btn">
                {busy ? <><Loader2 size={16} className="spin" /> Rebuilding key…</> : 'Recover & unlock'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={eraseOpen}
        onClose={() => setEraseOpen(false)}
        tone="danger"
        title="Erase this vault?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEraseOpen(false)}>Cancel</button>
            <button className="btn btn-danger" disabled={eraseText !== 'ERASE'} onClick={async () => (await eraseAll(), setEraseOpen(false), setEraseText(''))} id="erase-confirm">Erase permanently</button>
          </>
        }
      >
        <p className="muted">All encrypted data on this device will be destroyed. Without the password or recovery phrase it is unreadable anyway, but this removes it for good. Type <b>ERASE</b> to confirm.</p>
        <input className="input" value={eraseText} onChange={(e) => setEraseText(e.target.value)} aria-label="Type ERASE to confirm" />
      </Modal>
    </>
  );
}

export default function AuthScreen({ mode }) {
  return (
    <div className="auth">
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-theme"><ThemeSlider /></div>
      <motion.main className="auth-card" initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }}>
        {mode === 'uninitialized' ? <Setup /> : <Login />}
        <footer className="auth-foot"><WifiOff size={13} /> 100% offline · AES-GCM-256 · PBKDF2 × 600,000</footer>
      </motion.main>
    </div>
  );
}
