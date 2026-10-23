import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Globe, Paperclip, Sparkles, Trash2, Wand2, Check, Building } from 'lucide-react';
import DateField from './DateField.jsx';
import { matchInstitution, searchInstitutions } from '../data/institutions.js';
import { currencyInfo, formatBytes, groupDigits } from '../lib/format.js';
import { isValidTotpSecret } from '../crypto/totp.js';

export function generatePassword(len = 20) {
  const sets = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '!@#$%^&*-_=+?'];
  const all = sets.join('');
  const rnd = (n) => {
    // rejection sampling → no modulo bias
    const max = Math.floor(0x100000000 / n) * n;
    let x;
    do x = crypto.getRandomValues(new Uint32Array(1))[0];
    while (x >= max);
    return x % n;
  };
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < len) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export function InstitutionField({ id, value, kind, onChange, onPick }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const list = open ? searchInstitutions(value, kind) : [];
  const exact = matchInstitution(value);

  useEffect(() => {
    const h = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (inst) => {
    onPick(inst);
    setOpen(false);
  };

  return (
    <div className="combo" ref={wrap}>
      <div className="input-wrap">
        <Building size={16} className="input-icon" />
        <input
          id={id}
          className="input has-icon"
          value={value || ''}
          autoComplete="off"
          placeholder="Start typing – e.g. HDFC, Chase, Zerodha…"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!list.length) return;
            if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => (a + 1) % list.length));
            if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => (a - 1 + list.length) % list.length));
            if (e.key === 'Enter') (e.preventDefault(), pick(list[active]));
          }}
        />
        {exact && <Check size={16} className="input-ok" />}
      </div>
      <AnimatePresence>
        {list.length > 0 && !(list.length === 1 && exact && exact.name === value) && (
          <motion.ul className="combo-list" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}>
            {list.map((i, idx) => (
              <li key={i.name}>
                <button type="button" className={idx === active ? 'is-active' : ''} onMouseEnter={() => setActive(idx)} onClick={() => pick(i)}>
                  <span>{i.name}</span>
                  <small>{new URL(i.url).host.replace(/^www\./, '')}</small>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SecretInput({ id, value, onChange, type, placeholder }) {
  const [show, setShow] = useState(false);
  const isSecret = type === 'secret';
  const numeric = type === 'pin';
  const bad = type === 'totp' && value && !isValidTotpSecret(value);
  return (
    <div className="input-wrap">
      <input
        id={id}
        className={`input has-actions ${bad ? 'is-invalid' : ''}`}
        type={show ? 'text' : 'password'}
        inputMode={numeric ? 'numeric' : undefined}
        autoComplete="new-password"
        spellCheck={false}
        value={value || ''}
        placeholder={placeholder || (type === 'totp' ? 'JBSWY3DPEHPK3PXP or otpauth://…' : '')}
        onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
      />
      <span className="input-actions">
        {isSecret && (
          <button type="button" className="mini-btn" title="Generate a strong password" aria-label="Generate password" onClick={() => (onChange(generatePassword()), setShow(true))}>
            <Wand2 size={15} />
          </button>
        )}
        <button type="button" className="mini-btn" aria-label={show ? 'Hide value' : 'Show value'} onClick={() => setShow((s) => !s)}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </span>
      {bad && <span className="field-error">Not a valid base32 secret or otpauth:// link</span>}
    </div>
  );
}

const MAX_FILE = 3 * 1024 * 1024;

export function FileInput({ id, value, onChange, onError }) {
  const pick = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE) return onError('Attachment must be 3 MB or smaller.');
    const r = new FileReader();
    r.onload = () => onChange({ name: file.name, type: file.type, size: file.size, data: r.result });
    r.readAsDataURL(file);
  };
  return value ? (
    <div className="file-chip">
      <Paperclip size={16} />
      <span className="file-name">{value.name}</span>
      <small>{formatBytes(value.size)} · encrypted</small>
      <button type="button" className="mini-btn" aria-label="Remove attachment" onClick={() => onChange(null)}><Trash2 size={15} /></button>
    </div>
  ) : (
    <label className="file-drop" htmlFor={id}>
      <Paperclip size={18} />
      <span>Click to attach a statement (PDF / image, ≤ 3 MB)</span>
      <input id={id} type="file" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </label>
  );
}

export function FieldInput({ field, value, onChange, id, currency, onPickInstitution, onError }) {
  const { type } = field;
  switch (type) {
    case 'institution':
      return <InstitutionField id={id} value={value} kind={field.kind} onChange={onChange} onPick={onPickInstitution} />;
    case 'date':
      return <DateField id={id} value={value} onChange={onChange} />;
    case 'month':
      return <DateField id={id} value={value} onChange={onChange} monthOnly />;
    case 'secret':
    case 'pin':
    case 'totp':
      return <SecretInput id={id} type={type} value={value} onChange={onChange} />;
    case 'select':
      return (
        <select id={id} className="input select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case 'textarea':
      return <textarea id={id} className="input" rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    case 'file':
      return <FileInput id={id} value={value} onChange={onChange} onError={onError} />;
    case 'money':
      return (
        <div className="input-wrap">
          <span className="input-prefix">{currencyInfo(currency).symbol}</span>
          <input id={id} className="input has-prefix" inputMode="decimal" autoComplete="off" value={value ?? ''} placeholder="0.00" onChange={(e) => onChange(e.target.value.replace(/[^0-9.-]/g, ''))} />
        </div>
      );
    case 'number':
      return (
        <div className="input-wrap">
          <input id={id} className="input" type="number" step={field.step || 'any'} inputMode="decimal" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          {field.suffix && <span className="input-suffix">{field.suffix}</span>}
        </div>
      );
    case 'computed':
      return (
        <div className="input-wrap">
          <span className="input-prefix"><Sparkles size={14} /></span>
          <input id={id} className="input has-prefix" readOnly value={value ?? ''} />
        </div>
      );
    case 'url':
      return (
        <div className="input-wrap">
          <Globe size={16} className="input-icon" />
          <input id={id} className="input has-icon" type="url" inputMode="url" autoComplete="off" spellCheck={false} value={value || ''} placeholder="https://" onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case 'cardnumber':
      return <input id={id} className="input mono" inputMode="numeric" autoComplete="off" value={groupDigits(value || '')} placeholder="0000 0000 0000 0000" onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 19))} />;
    case 'tel':
      return <input id={id} className="input" type="tel" autoComplete="off" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input id={id} className="input" type="text" autoComplete="off" spellCheck={false} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  }
}
