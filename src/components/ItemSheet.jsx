import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Lightbulb, Wand2 } from 'lucide-react';
import { Sheet } from './ui.jsx';
import { FieldInput } from './fields.jsx';
import { ModuleIcon } from './Icons.jsx';
import { isBadgeType } from '../data/schema.js';
import { matchInstitution } from '../data/institutions.js';
import { fromISO } from '../lib/dates.js';
import { safeUrl, toNum } from '../lib/format.js';
import { isValidTotpSecret } from '../crypto/totp.js';
import { useVault } from '../state/VaultContext.jsx';
import { useUI } from '../state/UIContext.jsx';

function GuideBanner({ module, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`guide ${open ? 'is-open' : ''}`}>
      <button type="button" className="guide-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} id="guide-toggle">
        <Lightbulb size={16} />
        <span>Entry guide · what goes where</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="guide-chev"><ChevronDown size={16} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="guide-body-wrap">
            <div className="guide-body">
              <p>{module.guide.intro}</p>
              <dl>
                {module.guide.terms.map((t) => (
                  <div key={t.t}>
                    <dt>{t.t}</dt>
                    <dd>{t.d}</dd>
                  </div>
                ))}
              </dl>
              <p className="guide-lock">🔒 Everything is encrypted with AES-GCM-256 before it touches storage and never leaves this device.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ItemSheet({ module, item, onClose }) {
  const { vault, upsertItem } = useVault();
  const { toast } = useUI();
  const currency = vault.settings.currency;
  const isNew = !item;
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState(() => item || {});
  const [errors, setErrors] = useState({});
  const [autoNote, setAutoNote] = useState(false);
  // Auto-fill only overwrites link fields the user has not hand-edited.
  const auto = useRef({ url: !item?.portalUrl, nick: !item?.portalNickname });
  const bodyRef = useRef(null);

  const close = () => {
    setOpen(false);
    setTimeout(onClose, 320);
  };

  const sections = useMemo(() => {
    const f = module.fields;
    return [
      { id: 'details', title: 'Details', fields: f.filter((x) => !isBadgeType(x) && x.group !== 'portal') },
      { id: 'creds', title: 'Credentials · tap-to-copy badges once saved', fields: f.filter(isBadgeType) },
      { id: 'portal', title: 'Smart Portal Link', fields: f.filter((x) => x.group === 'portal') },
    ].filter((s) => s.fields.length);
  }, [module]);

  const set = (key, value) =>
    setDraft((d) => {
      let next = { ...d, [key]: value };
      if (module.compute) next = module.compute(next);
      return next;
    });

  const onEdit = (field, value) => {
    if (field.key === 'portalUrl') auto.current.url = false;
    if (field.key === 'portalNickname') auto.current.nick = false;
    set(field.key, value);
    if (errors[field.key]) setErrors((e) => ({ ...e, [field.key]: undefined }));
    if (field.type === 'institution') {
      // typing an exact institution name auto-populates its official portal
      const inst = matchInstitution(value);
      if (inst) fillFrom(inst, false);
    }
  };

  const fillFrom = (inst, setName = true) => {
    if (module.fields.some((f) => f.key === 'portalUrl')) setAutoNote(true);
    setDraft((d) => {
      let next = { ...d };
      if (setName) next.institution = inst.name;
      const hasPortal = module.fields.some((f) => f.key === 'portalUrl');
      if (hasPortal) {
        if (auto.current.url || !d.portalUrl) {
          next.portalUrl = inst.url;
          auto.current.url = true;
        }
        if (auto.current.nick || !d.portalNickname) {
          next.portalNickname = `${inst.name} Portal`;
          auto.current.nick = true;
        }
      }
      return module.compute ? module.compute(next) : next;
    });
  };

  const validate = () => {
    const e = {};
    for (const f of module.fields) {
      const v = draft[f.key];
      if (f.required && !String(v ?? '').trim()) e[f.key] = 'Required';
      if ((f.type === 'date' || f.type === 'month') && v && !fromISO(v)) e[f.key] = 'Invalid date';
      if (f.type === 'url' && v && !safeUrl(v)) e[f.key] = 'Enter a valid http(s) address';
      if (f.type === 'totp' && v && !isValidTotpSecret(v)) e[f.key] = 'Invalid TOTP secret';
    }
    return e;
  };

  const save = (ev) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast('Please fix the highlighted fields', 'danger');
      setTimeout(() => bodyRef.current?.querySelector('.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    const out = {};
    for (const f of module.fields) {
      let v = draft[f.key];
      if (v === undefined || v === '' || v === null) continue;
      if (f.type === 'money' || f.type === 'number' || f.type === 'computed') v = toNum(v);
      else if (f.type === 'url') v = safeUrl(v);
      else if (typeof v === 'string') v = v.trim();
      out[f.key] = v;
    }
    upsertItem(module.id, { ...(item ? { id: item.id, createdAt: item.createdAt } : {}), ...out });
    toast(isNew ? `${module.singular} added` : 'Changes saved');
    close();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={`${isNew ? 'Add' : 'Edit'} ${module.singular}`}
      subtitle={module.label}
      icon={<span className="chip" style={{ '--hue': module.hue }}><ModuleIcon name={module.icon} size={20} /></span>}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={close} id="form-cancel">Cancel</button>
          <button type="submit" form="item-form" className="btn btn-primary" id="form-save">{isNew ? 'Add to vault' : 'Save changes'}</button>
        </>
      }
    >
      <form id="item-form" onSubmit={save} noValidate ref={bodyRef}>
        <GuideBanner module={module} defaultOpen={isNew} />
        {sections.map((s) => (
          <section key={s.id} className="form-section">
            <h4 className="form-section-title">{s.title}</h4>
            <div className="form-grid">
              {s.fields.map((f) => (
                <div key={f.key} className={`field ${f.full || f.type === 'file' || f.type === 'url' ? 'full' : ''} ${errors[f.key] ? 'has-error' : ''}`}>
                  <label htmlFor={`f-${f.key}`}>
                    {f.label}
                    {f.required && <em>*</em>}
                  </label>
                  <FieldInput
                    field={f}
                    id={`f-${f.key}`}
                    value={draft[f.key]}
                    currency={currency}
                    onChange={(v) => onEdit(f, v)}
                    onPickInstitution={(inst) => fillFrom(inst, true)}
                    onError={(m) => toast(m, 'danger')}
                  />
                  {f.suggestions && (
                    <div className="chips">
                      {f.suggestions.map((s2) => (
                        <button type="button" key={s2} className={`chip-btn ${draft[f.key] === s2 ? 'is-on' : ''}`} onClick={() => onEdit(f, s2)}>{s2}</button>
                      ))}
                    </div>
                  )}
                  {errors[f.key] && <span className="field-error">{errors[f.key]}</span>}
                  {f.hint && !errors[f.key] && f.type !== 'url' && <span className="field-hint">{f.hint}</span>}
                  {f.type === 'url' && (
                    <AnimatePresence>
                      {autoNote && auto.current.url && draft.portalUrl ? (
                        <motion.span className="auto-note" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                          <Wand2 size={13} /> Auto-filled from the offline institution dictionary – verify before use
                        </motion.span>
                      ) : (
                        f.hint && <span className="field-hint">{f.hint}</span>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </form>
    </Sheet>
  );
}
