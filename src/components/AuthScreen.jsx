import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Fingerprint, HelpCircle, KeyRound, Loader2, LockKeyhole, ShieldCheck, WifiOff } from 'lucide-react';
import PasswordInput from './PasswordInput.jsx';
import { Modal, ThemeSlider } from './ui.jsx';
import { VaultLogo } from './Icons.jsx';
import { MAX_PASSWORD } from '../lib/password.js';
import { useVault } from '../state/VaultContext.jsx';

const slide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.24, ease: 'easeOut' },
};

const DEFAULT_QUESTIONS = [
  'What was the name of your first elementary school?',
  'In what city or town were you born?',
  'What was your childhood nickname?',
  'What was the make of your first vehicle?',
  'What was the name of your first pet?',
  'What street did you grow up on?',
];

function Brand({ sub }) {
  return (
    <div className="brand">
      <motion.div
        className="brand-logo-wrap"
        initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      >
        <VaultLogo size={68} />
      </motion.div>
      <h1>MyOwnVault</h1>
      <p>{sub}</p>
    </div>
  );
}

function Setup() {
  const { setup } = useVault();
  const [step, setStep] = useState('password'); // 'password' | 'questions'
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // 3 Secret Questions & Answers
  const [q1, setQ1] = useState(DEFAULT_QUESTIONS[0]);
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(DEFAULT_QUESTIONS[1]);
  const [a2, setA2] = useState('');
  const [q3, setQ3] = useState(DEFAULT_QUESTIONS[2]);
  const [a3, setA3] = useState('');

  const toQuestions = () => {
    setErr('');
    if (!pw) return setErr('Please enter a master password.');
    if (pw.length > MAX_PASSWORD) return setErr(`Master password cannot exceed ${MAX_PASSWORD} characters.`);
    if (pw !== pw2) return setErr('Passwords do not match.');
    setStep('questions');
  };

  const finish = async () => {
    setErr('');
    if (!a1.trim() || !a2.trim() || !a3.trim()) {
      return setErr('Please provide answers for all 3 Secret Recovery Questions.');
    }
    if (q1 === q2 || q1 === q3 || q2 === q3) {
      return setErr('Please choose 3 distinct recovery questions.');
    }
    setBusy(true);
    try {
      const qaList = [
        { question: q1, answer: a1.trim() },
        { question: q2, answer: a2.trim() },
        { question: q3, answer: a3.trim() },
      ];
      await setup(pw, qaList);
    } catch (e) {
      console.error(e);
      setErr('Setup failed – local browser storage may be restricted.');
      setBusy(false);
    }
  };

  return (
    <>
      <Brand sub={step === 'password' ? 'First-Time Secure Account Setup' : 'Configure 3 Secret Recovery Questions'} />
      <div className="steps" aria-hidden="true">
        {['password', 'questions'].map((s, i) => (
          <span key={s} className={['password', 'questions'].indexOf(step) >= i ? 'on' : ''} />
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {step === 'password' && (
          <motion.div key="p" {...slide} className="auth-step">
            <div className="field-meta-row">
              <span className="pill-static">Max {MAX_PASSWORD} characters strictly capped</span>
              <span className="small muted">{pw.length}/{MAX_PASSWORD}</span>
            </div>
            <PasswordInput
              id="setup-password"
              label="Master password (strictly ≤ 8 characters)"
              value={pw}
              onChange={(v) => setPw(v.slice(0, MAX_PASSWORD))}
              maxLength={MAX_PASSWORD}
              autoFocus
              placeholder="Up to 8 characters"
            />
            <PasswordInput
              id="setup-password2"
              label="Confirm master password"
              value={pw2}
              onChange={(v) => setPw2(v.slice(0, MAX_PASSWORD))}
              maxLength={MAX_PASSWORD}
              placeholder="Repeat your 8-character password"
              onEnter={toQuestions}
            />
            <p className="auth-note">
              Your password never leaves this device. In the next step, configure <b>3 Secret Questions & Answers</b> used for deterministic zero-knowledge recovery.
            </p>
            {err && <p className="form-error" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" onClick={toQuestions} id="setup-continue">
              Configure Recovery Questions <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
        {step === 'questions' && (
          <motion.div key="q" {...slide} className="auth-step">
            <p className="auth-note">
              Answering these 3 questions deterministically re-derives your vault recovery key via PBKDF2 (600,000 rounds).
            </p>

            {/* Question 1 */}
            <div className="field">
              <label htmlFor="q1-select">Question 1</label>
              <select id="q1-select" className="input select" value={q1} onChange={(e) => setQ1(e.target.value)}>
                {DEFAULT_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <input
                id="a1-input"
                className="input"
                placeholder="Secret answer 1"
                autoComplete="off"
                value={a1}
                onChange={(e) => setA1(e.target.value)}
              />
            </div>

            {/* Question 2 */}
            <div className="field">
              <label htmlFor="q2-select">Question 2</label>
              <select id="q2-select" className="input select" value={q2} onChange={(e) => setQ2(e.target.value)}>
                {DEFAULT_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <input
                id="a2-input"
                className="input"
                placeholder="Secret answer 2"
                autoComplete="off"
                value={a2}
                onChange={(e) => setA2(e.target.value)}
              />
            </div>

            {/* Question 3 */}
            <div className="field">
              <label htmlFor="q3-select">Question 3</label>
              <select id="q3-select" className="input select" value={q3} onChange={(e) => setQ3(e.target.value)}>
                {DEFAULT_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <input
                id="a3-input"
                className="input"
                placeholder="Secret answer 3"
                autoComplete="off"
                value={a3}
                onChange={(e) => setA3(e.target.value)}
              />
            </div>

            {err && <p className="form-error" role="alert">{err}</p>}

            <div className="auth-row">
              <button className="btn btn-ghost" onClick={() => setStep('password')} disabled={busy}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={finish} disabled={busy} id="create-vault">
                {busy ? <><Loader2 size={16} className="spin" /> Deriving 600,000-round key…</> : <>Create Zero-Knowledge Vault <CheckCircle2 size={16} /></>}
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
  const [mode, setMode] = useState('login'); // 'login' | 'recover'
  const [pw, setPw] = useState('');
  const [ans1, setAns1] = useState('');
  const [ans2, setAns2] = useState('');
  const [ans3, setAns3] = useState('');
  const [npw, setNpw] = useState('');
  const [npw2, setNpw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseText, setEraseText] = useState('');
  const [shake, setShake] = useState(0);

  const questions = flags.recoveryQuestions || DEFAULT_QUESTIONS.slice(0, 3);

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
    if (!ans1.trim() || !ans2.trim() || !ans3.trim()) {
      return fail('Please answer all 3 secret recovery questions.');
    }
    if (!npw) return fail('Please enter a new master password.');
    if (npw.length > MAX_PASSWORD) return fail(`New master password cannot exceed ${MAX_PASSWORD} characters.`);
    if (npw !== npw2) return fail('Passwords do not match.');
    setBusy(true);
    const r = await recover([ans1.trim(), ans2.trim(), ans3.trim()], npw);
    if (!r.ok) fail(r.error);
  };

  return (
    <>
      <Brand sub={mode === 'login' ? 'Secure Login — Vault Encrypted' : 'Reset Master Password with Secret Questions'} />
      <AnimatePresence mode="wait" initial={false}>
        {mode === 'login' ? (
          <motion.form key="l" {...slide} className="auth-step" onSubmit={(e) => (e.preventDefault(), doUnlock())}>
            <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -8, 8, 0] } : {}} transition={{ duration: 0.4 }}>
              <div className="field-meta-row">
                <span className="small muted">8-Character Master Password</span>
                <span className="small muted">{pw.length}/{MAX_PASSWORD}</span>
              </div>
              <PasswordInput
                id="login-password"
                label="Master password"
                value={pw}
                onChange={(v) => setPw(v.slice(0, MAX_PASSWORD))}
                maxLength={MAX_PASSWORD}
                autoFocus
                placeholder="Enter 8-character master password"
              />
            </motion.div>
            {err && <p className="form-error" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={busy || !pw} id="unlock-btn">
              {busy ? <><Loader2 size={16} className="spin" /> Deriving 600,000-round key…</> : <><LockKeyhole size={16} /> Unlock Vault</>}
            </button>
            {flags.hasBio && (
              <button type="button" className="btn btn-soft btn-block" onClick={doBio} id="bio-unlock">
                <Fingerprint size={18} /> Unlock with Biometrics
              </button>
            )}
            <div className="auth-links">
              <button type="button" className="link" onClick={() => (setMode('recover'), setErr(''))} id="forgot-link">
                Forgot password?
              </button>
              <button type="button" className="link link-danger" onClick={() => setEraseOpen(true)}>
                Erase vault
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="r" {...slide} className="auth-step">
            <p className="auth-note">
              Answer the 3 secret questions you configured during initial vault setup.
            </p>

            <div className="field">
              <label>1. {questions[0] || 'Secret Question 1'}</label>
              <input
                id="ans1"
                className="input"
                placeholder="Your answer"
                autoComplete="off"
                value={ans1}
                onChange={(e) => setAns1(e.target.value)}
              />
            </div>

            <div className="field">
              <label>2. {questions[1] || 'Secret Question 2'}</label>
              <input
                id="ans2"
                className="input"
                placeholder="Your answer"
                autoComplete="off"
                value={ans2}
                onChange={(e) => setAns2(e.target.value)}
              />
            </div>

            <div className="field">
              <label>3. {questions[2] || 'Secret Question 3'}</label>
              <input
                id="ans3"
                className="input"
                placeholder="Your answer"
                autoComplete="off"
                value={ans3}
                onChange={(e) => setAns3(e.target.value)}
              />
            </div>

            <PasswordInput
              id="recover-new"
              label="New master password (max 8 chars)"
              value={npw}
              onChange={(v) => setNpw(v.slice(0, MAX_PASSWORD))}
              maxLength={MAX_PASSWORD}
              placeholder="Up to 8 characters"
            />
            <PasswordInput
              id="recover-new2"
              label="Confirm new password"
              value={npw2}
              onChange={(v) => setNpw2(v.slice(0, MAX_PASSWORD))}
              maxLength={MAX_PASSWORD}
              placeholder="Confirm new 8-char password"
            />

            {err && <p className="form-error" role="alert">{err}</p>}

            <div className="auth-row">
              <button className="btn btn-ghost" onClick={() => (setMode('login'), setErr(''))} disabled={busy}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={doRecover} disabled={busy} id="recover-btn">
                {busy ? <><Loader2 size={16} className="spin" /> Verifying key…</> : 'Verify & Unlock'}
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
        <p className="muted">All encrypted data on this device will be destroyed. Without the password or secret answers it is unreadable anyway, but this removes it for good. Type <b>ERASE</b> to confirm.</p>
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
