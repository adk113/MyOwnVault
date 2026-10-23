import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DatabaseBackup, Download, Fingerprint, History, KeyRound, Palette, QrCode, RotateCcw, ShieldAlert, Siren, Smartphone, Timer, Trash2, Upload, Loader2,
} from 'lucide-react';
import { Modal, ThemeSlider } from './ui.jsx';
import PasswordInput from './PasswordInput.jsx';
import MergeDialog from './MergeDialog.jsx';
import { CURRENCIES } from '../lib/format.js';
import { downloadText } from '../lib/backup.js';
import { MIN_PASSWORD, scorePassword } from '../lib/password.js';
import { useVault } from '../state/VaultContext.jsx';
import { useUI } from '../state/UIContext.jsx';

const card = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

function Section({ icon, title, desc, children, tone }) {
  return (
    <motion.section variants={card} className={`card settings-card ${tone ? `tone-${tone}` : ''}`}>
      <header className="panel-head">
        <h2>{icon} {title}</h2>
      </header>
      {desc && <p className="muted pad-b">{desc}</p>}
      {children}
    </motion.section>
  );
}

const Row = ({ title, desc, children }) => (
  <div className="srow">
    <div className="srow-text"><b>{title}</b>{desc && <small>{desc}</small>}</div>
    <div className="srow-ctl">{children}</div>
  </div>
);

/** Generic dialog that collects a few password fields and runs an async action. */
function PasswordDialog({ open, onClose, title, intro, fields, confirmLabel, action, tone, meterOn }) {
  const [vals, setVals] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) (setVals({}), setErr(''), setBusy(false));
  }, [open]);

  const submit = async () => {
    setErr('');
    for (const f of fields) {
      if (!vals[f.key]) return setErr(`${f.label} is required.`);
      if (f.min && vals[f.key].length < f.min) return setErr(`${f.label} must be at least ${f.min} characters.`);
    }
    if (fields.some((f) => f.matches) && fields.filter((f) => f.matches).some((f) => vals[f.key] !== vals[f.matches])) return setErr('Passwords do not match.');
    setBusy(true);
    const res = await action(vals);
    setBusy(false);
    if (res?.ok) onClose();
    else setErr(res?.error || 'Something went wrong.');
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      tone={tone}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={submit} disabled={busy} id="dialog-confirm">
            {busy ? <><Loader2 size={16} className="spin" /> Deriving key…</> : confirmLabel}
          </button>
        </>
      }
    >
      {intro && <p className="muted">{intro}</p>}
      {fields.map((f) => (
        <PasswordInput key={f.key} id={`dlg-${f.key}`} label={f.label} value={vals[f.key] || ''} onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))} meter={meterOn === f.key} autoComplete="new-password" onEnter={submit} />
      ))}
      {err && <p className="form-error" role="alert">{err}</p>}
    </Modal>
  );
}

export default function Settings() {
  const v = useVault();
  const { vault, isDecoy, flags } = v;
  const { toast, theme } = useUI();
  const [dlg, setDlg] = useState(null); // 'pw' | 'duress' | 'bio' | 'export' | 'import' | 'erase'
  const [snaps, setSnaps] = useState(null);
  const [importText, setImportText] = useState('');
  const [merge, setMerge] = useState(null);
  const fileRef = useRef(null);

  const loadSnaps = useCallback(async () => setSnaps(await v.listSnapshots()), [v]);
  useEffect(() => {
    if (isDecoy) return undefined;
    const t = setTimeout(loadSnaps, 450); // let the async encrypted write finish first
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDecoy, vault?.updatedAt]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => (setImportText(String(r.result)), setDlg('import'));
    r.readAsText(f);
  };

  return (
    <motion.div className="settings" initial="hidden" animate="show" transition={{ staggerChildren: 0.06 }}>
      <div className="page-title">
        <h1>Settings</h1>
        <p>{isDecoy ? 'Display preferences.' : 'Theme, security, snapshots and backups.'}</p>
      </div>

      <Section icon={<Palette size={18} />} title="Appearance & Alerts">
        <Row title="Theme" desc="Ultra-crisp Light or deep Cyber-Dark – every surface transitions instantly.">
          <ThemeSlider />
          <span className="muted small">{theme === 'dark' ? 'Cyber-Dark' : 'Light'}</span>
        </Row>
        <Row title="Display currency" desc="Used to format every amount in the vault.">
          <select className="input select" value={vault.settings.currency} onChange={(e) => v.updateSettings({ currency: e.target.value })} id="currency-select">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Row>
        <Row title="High-interest APR threshold" desc="Liabilities above this APR are flagged for priority repayment.">
          <div className="input-wrap narrow">
            <input className="input" type="number" min="0" step="0.5" value={vault.settings.aprThreshold} onChange={(e) => v.updateSettings({ aprThreshold: e.target.value === '' ? '' : Number(e.target.value) })} id="apr-threshold" />
            <span className="input-suffix">%</span>
          </div>
        </Row>
      </Section>

      {!isDecoy && (
        <>
          <Section icon={<KeyRound size={18} />} title="Security" desc={`Zero-knowledge AES-GCM-256 · PBKDF2-SHA256 × 600,000 · ${flags.hasBio ? 'Biometric unlock on' : 'Master password required'}`}>
            <Row title="Master password" desc="Re-wraps your encryption key – your data does not need to be re-encrypted.">
              <button className="btn btn-soft" onClick={() => setDlg('pw')} id="change-password">Change password</button>
            </Row>
            <Row title="Recovery phrase" desc="Your 12-word phrase (shown once at setup) resets a forgotten password from the login screen: ‘Forgot password?’. Keep it offline.">
              <span className="pill-static">12 words · offline</span>
            </Row>
            <Row title="Duress password" desc={flags.hasDuress ? 'Active. Entering it at login opens a separate decoy vault with dummy data. Sign in with it to edit the decoy.' : 'An alternate password that opens a believable decoy profile if you are ever forced to unlock the app.'}>
              {flags.hasDuress ? (
                <button className="btn btn-ghost" onClick={async () => (await v.removeDuress(), toast('Duress profile removed'))}><Siren size={16} /> Remove</button>
              ) : (
                <button className="btn btn-soft" onClick={() => setDlg('duress')} id="setup-duress"><Siren size={16} /> Set up</button>
              )}
            </Row>
            <Row title="Biometric unlock" desc={flags.bioSupported ? 'Touch ID / Face ID / Windows Hello as a fast second unlock. Your master password stays the root of trust.' : 'No platform authenticator detected on this device/browser.'}>
              {flags.hasBio ? (
                <button className="btn btn-ghost" onClick={async () => (await v.disableBiometric(), toast('Biometric unlock disabled'))}>Disable</button>
              ) : (
                <button className="btn btn-soft" disabled={!flags.bioSupported} onClick={() => setDlg('bio')} id="enable-bio"><Fingerprint size={16} /> Enable</button>
              )}
            </Row>
            <Row title="Auto-lock & clipboard" desc="After 5 minutes of inactivity keys are flushed and you return to login. Copied secrets are wiped from the clipboard after 30 seconds.">
              <span className="pill-static"><Timer size={13} /> 5 min · 30 s</span>
            </Row>
          </Section>

          <Section icon={<History size={18} />} title="Rollback Snapshots" desc="Up to 3 rolling encrypted copies of previous vault states. Restoring first snapshots your current state.">
            {snaps === null ? (
              <p className="muted">Loading…</p>
            ) : snaps.length === 0 ? (
              <p className="muted">No snapshots yet – one is created automatically when you change something.</p>
            ) : (
              <ul className="snaps">
                {snaps.map((s) => (
                  <li key={s.index}>
                    <History size={16} />
                    <div><b>{new Date(s.ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</b><small>{s.count ?? '?'} entries</small></div>
                    <button className="btn btn-soft btn-sm" onClick={async () => (await v.restoreSnapshot(s.index), toast('Snapshot restored'))}><RotateCcw size={14} /> Restore</button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={<Smartphone size={18} />} title="Mobile & Offline App (iOS & Android)" desc="MyOwnVault installs natively as an offline-first Progressive Web App (PWA) with zero third-party dependencies or tracking.">
            <div className="pwa-install-banner">
              <div className="pwa-qr-preview">
                <img src="./qr-pages.svg" alt="Scan to install MyOwnVault" width="130" height="130" className="pwa-qr-img" />
                <span className="pwa-qr-caption">Scan with phone camera</span>
              </div>
              <div className="pwa-steps">
                <div className="pwa-step-card">
                  <b>🍏 Apple iOS (iPhone & iPad)</b>
                  <p>1. Open <a href="https://adk113.github.io/MyOwnVault/" target="_blank" rel="noreferrer">adk113.github.io/MyOwnVault/</a> in <b>Safari</b>.</p>
                  <p>2. Tap the <b>Share</b> icon (square with arrow) at the bottom.</p>
                  <p>3. Tap <b>"Add to Home Screen"</b> and confirm.</p>
                </div>
                <div className="pwa-step-card">
                  <b>🤖 Android (Chrome / Brave / Edge)</b>
                  <p>1. Scan the QR code or open in <b>Chrome</b>.</p>
                  <p>2. Tap the <b>"Install App"</b> banner or menu (⋮) → <b>"Add to Home screen"</b>.</p>
                  <p>3. The standalone app installs instantly with native offline storage.</p>
                </div>
              </div>
            </div>
            <Row title="Direct Web App URL" desc="https://adk113.github.io/MyOwnVault/">
              <button className="btn btn-soft" onClick={() => { navigator.clipboard?.writeText('https://adk113.github.io/MyOwnVault/'); toast('App link copied to clipboard'); }}>
                Copy Link
              </button>
            </Row>
          </Section>

          <Section icon={<DatabaseBackup size={18} />} title="Encrypted Backup & Smart Merge" desc="Backups use their own passphrase (PBKDF2 × 600,000 + AES-GCM-256). Importing shows row-level conflicts instead of overwriting blindly.">
            <Row title="Export encrypted backup" desc="Downloads a .movault file you can store anywhere.">
              <button className="btn btn-soft" onClick={() => setDlg('export')} id="export-backup"><Download size={16} /> Export</button>
            </Row>
            <Row title="Import & merge backup" desc="Choose a backup, then pick per-item which version to keep.">
              <button className="btn btn-soft" onClick={() => fileRef.current?.click()} id="import-backup"><Upload size={16} /> Import</button>
              <input ref={fileRef} type="file" accept=".movault,.json,application/json" hidden onChange={onPickFile} />
            </Row>
          </Section>

          <Section icon={<ShieldAlert size={18} />} title="Danger zone" tone="danger">
            <Row title="Erase everything on this device" desc="Permanently deletes the vault, snapshots, decoy and biometric slot. Cannot be undone.">
              <button className="btn btn-danger" onClick={() => setDlg('erase')} id="erase-all"><Trash2 size={16} /> Erase vault</button>
            </Row>
          </Section>
        </>
      )}

      <PasswordDialog
        open={dlg === 'pw'}
        onClose={() => setDlg(null)}
        title="Change master password"
        confirmLabel="Change password"
        meterOn="next"
        fields={[
          { key: 'current', label: 'Current password' },
          { key: 'next', label: 'New password', min: MIN_PASSWORD },
          { key: 'again', label: 'Repeat new password', matches: 'next' },
        ]}
        action={async (x) => {
          if (scorePassword(x.next).score < 2) return { ok: false, error: 'Choose a stronger password.' };
          const r = await v.changePassword(x.current, x.next);
          if (r.ok) toast('Master password updated');
          return r;
        }}
      />
      <PasswordDialog
        open={dlg === 'duress'}
        onClose={() => setDlg(null)}
        title="Set up duress password"
        intro="Choose a password that is different from your master password. Entering it at login opens a decoy vault pre-filled with plausible dummy data."
        confirmLabel="Create decoy profile"
        fields={[
          { key: 'master', label: 'Master password (to confirm)' },
          { key: 'duress', label: 'Duress password', min: MIN_PASSWORD },
        ]}
        action={async (x) => {
          const r = await v.setDuress(x.master, x.duress);
          if (r.ok) toast('Duress profile ready – memorise that password');
          return r;
        }}
      />
      <PasswordDialog
        open={dlg === 'bio'}
        onClose={() => setDlg(null)}
        title="Enable biometric unlock"
        intro="Confirm your master password, then approve the biometric prompt."
        confirmLabel="Continue"
        fields={[{ key: 'master', label: 'Master password' }]}
        action={async (x) => {
          const r = await v.enableBiometric(x.master);
          if (r.ok) toast('Biometric unlock enabled');
          return r;
        }}
      />
      <PasswordDialog
        open={dlg === 'export'}
        onClose={() => setDlg(null)}
        title="Export encrypted backup"
        intro="Pick a backup passphrase. You will need it to import this file – it is not recoverable."
        confirmLabel="Encrypt & download"
        meterOn="pass"
        fields={[
          { key: 'pass', label: 'Backup passphrase', min: 8 },
          { key: 'again', label: 'Repeat passphrase', matches: 'pass' },
        ]}
        action={async (x) => {
          const text = await v.exportBackup(x.pass);
          downloadText(`myownvault-${new Date().toISOString().slice(0, 10)}.movault`, text);
          toast('Encrypted backup downloaded');
          return { ok: true };
        }}
      />
      <PasswordDialog
        open={dlg === 'import'}
        onClose={() => setDlg(null)}
        title="Decrypt backup"
        confirmLabel="Preview changes"
        fields={[{ key: 'pass', label: 'Backup passphrase' }]}
        action={async (x) => {
          try {
            const { rows } = await v.previewImport(importText, x.pass);
            setMerge(rows);
            return { ok: true };
          } catch (e) {
            return { ok: false, error: e.message };
          }
        }}
      />
      <PasswordDialog
        open={dlg === 'erase'}
        onClose={() => setDlg(null)}
        tone="danger"
        title="Erase all vault data?"
        intro="This deletes every entry, snapshot and key slot on this device. Type your master password to confirm."
        confirmLabel="Erase everything"
        fields={[{ key: 'master', label: 'Master password' }]}
        action={async (x) => {
          const r = await v.changePassword(x.master, x.master); // verifies the password
          if (!r.ok) return r;
          await v.eraseAll();
          return { ok: true };
        }}
      />
      {merge && (
        <MergeDialog
          key={merge.length + (merge[0]?.key || '')}
          open
          rows={merge}
          currency={vault.settings.currency}
          onClose={() => setMerge(null)}
          onApply={(rows) => {
            v.applyImport(rows);
            setMerge(null);
            toast('Backup merged');
          }}
        />
      )}
    </motion.div>
  );
}
