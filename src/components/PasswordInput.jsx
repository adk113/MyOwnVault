import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { scorePassword } from '../lib/password.js';

export default function PasswordInput({ id, label, value, onChange, meter = false, autoFocus, placeholder, autoComplete = 'current-password', onEnter, maxLength }) {
  const [show, setShow] = useState(false);
  const s = scorePassword(value);
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-wrap">
        <Lock size={16} className="input-icon" />
        <input
          id={id}
          className="input has-icon has-actions"
          type={show ? 'text' : 'password'}
          value={value}
          maxLength={maxLength}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        />
        <span className="input-actions">
          <button type="button" className="mini-btn" onClick={() => setShow((x) => !x)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </span>
      </div>
      {meter && value && (
        <div className="meter" aria-live="polite">
          <div className="meter-bar"><motion.span animate={{ width: `${s.pct}%` }} className={`m-${s.score}`} /></div>
          <small className={`m-text-${s.score}`}>{s.label}</small>
        </div>
      )}
    </div>
  );
}
