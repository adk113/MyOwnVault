import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarClock, ChevronDown, Download, ExternalLink, Pencil, Rocket, Trash2 } from 'lucide-react';
import Sensitive from './Sensitive.jsx';
import SecretBadge from './SecretBadge.jsx';
import { ModuleIcon } from './Icons.jsx';
import { isBadgeType } from '../data/schema.js';
import { formatMoney, hostOf, safeUrl, toNum } from '../lib/format.js';
import { daysUntil, prettyDate, displayDate } from '../lib/dates.js';
import { useVault } from '../state/VaultContext.jsx';

const kindOf = (f) => (isBadgeType(f) ? f.type : 'text');

export function dueChip(module, item) {
  const keyMap = { credit: ['dueDate', true], liabilities: ['paymentDeadline', true], assets: ['maturityDate', false], retirement: ['lockIn', false], insurance: ['premiumDue', true] };
  const spec = keyMap[module.id];
  if (!spec) return null;
  const d = daysUntil(item[spec[0]], new Date(), spec[1]);
  if (d == null || d < 0 || d > 7) return null;
  return d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `Due in ${d} days`;
}

function DetailRow({ field, value, currency }) {
  if (field.type === 'file') {
    return (
      <a className="btn btn-soft btn-sm" href={value.data} download={value.name}>
        <Download size={14} /> {value.name}
      </a>
    );
  }
  if (isBadgeType(field) || field.copy) {
    return <SecretBadge label={field.label} value={String(value)} kind={kindOf(field)} size="sm" block />;
  }
  let content;
  if (field.type === 'money' || field.type === 'computed') content = <Sensitive>{formatMoney(value, currency, { decimals: Number(value) % 1 ? 2 : 0 })}</Sensitive>;
  else if (field.type === 'date') content = prettyDate(value);
  else if (field.type === 'month') content = displayDate(value, { monthOnly: true });
  else if (field.type === 'url') content = safeUrl(value) ? <a href={safeUrl(value)} target="_blank" rel="noopener noreferrer">{hostOf(value)}</a> : value;
  else if (field.sensitive) content = <Sensitive>{String(value)}</Sensitive>;
  else content = field.suffix ? `${value}${field.suffix}` : String(value);
  return (
    <div className="detail">
      <span className="detail-label">{field.label}</span>
      <span className="detail-value">{content}</span>
    </div>
  );
}

export default function ItemCard({ module, item, index, onEdit, onDelete, onLaunch }) {
  const { vault } = useVault();
  const currency = vault.settings.currency;
  const [open, setOpen] = useState(false);
  const title = item[module.titleKey] || 'Untitled';
  const subtitle = item[module.subtitleKey];
  const headVal = item[module.headline.key];
  const chip = dueChip(module, item);
  const url = safeUrl(item.portalUrl);
  const badgeFields = module.badges.map((k) => module.fields.find((f) => f.key === k)).filter((f) => f && item[f.key]);
  const apr = toNum(item.apr);
  const highApr = module.id === 'liabilities' && apr > toNum(vault.settings.aprThreshold) && toNum(item.balance) > 0;
  const util = module.id === 'credit' && toNum(item.creditLimit) > 0 ? Math.min(100, (toNum(item.outstanding) / toNum(item.creditLimit)) * 100) : null;
  const detailFields = module.fields.filter((f) => ![module.titleKey, 'institution', 'portalNickname'].includes(f.key) && item[f.key] !== undefined && item[f.key] !== '' && item[f.key] !== null);

  return (
    <motion.article
      layout
      className={`card ${open ? 'is-open' : ''}`}
      style={{ '--hue': module.hue }}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: Math.min(index, 8) * 0.04 }}
      whileHover={{ y: -4 }}
    >
      <div className="card-glow" aria-hidden="true" />
      <header className="card-head">
        <span className="chip"><ModuleIcon name={module.icon} size={20} /></span>
        <div className="card-titles">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="card-flags">
          {chip && <span className="flag flag-warn"><CalendarClock size={12} /> {chip}</span>}
          {highApr && <span className="flag flag-danger"><AlertTriangle size={12} /> {apr}% APR</span>}
        </div>
      </header>

      <div className="card-metric">
        <span className="metric-label">{module.headline.label}</span>
        <span className={`metric-value ${module.headline.debt ? 'is-debt' : ''}`}>
          <Sensitive mask="••••••">{formatMoney(headVal ?? 0, currency, { decimals: Number(headVal) % 1 ? 2 : 0 })}</Sensitive>
        </span>
      </div>

      {util !== null && (
        <div className="util" title={`${util.toFixed(0)}% of limit used`}>
          <motion.span initial={{ width: 0 }} animate={{ width: `${util}%` }} className={util > 70 ? 'util-hot' : ''} />
        </div>
      )}

      {badgeFields.length > 0 && (
        <div className="pill-row">
          {badgeFields.map((f) => <SecretBadge key={f.key} label={f.label.replace(/ \(.*\)/, '')} value={String(item[f.key])} kind={kindOf(f)} />)}
        </div>
      )}

      <footer className="card-actions">
        {url && (
          <button className="btn btn-primary btn-sm" onClick={() => onLaunch(item)} title={`Open ${hostOf(url)} with the copy drawer`} id={`launch-${item.id}`}>
            <Rocket size={14} /> {item.portalNickname || 'Launch portal'} <ExternalLink size={12} />
          </button>
        )}
        <span className="spacer" />
        <button className="icon-btn" onClick={() => onEdit(item)} aria-label={`Edit ${title}`} id={`edit-${item.id}`}><Pencil size={16} /></button>
        <button className="icon-btn icon-danger" onClick={() => onDelete(item)} aria-label={`Delete ${title}`} id={`delete-${item.id}`}><Trash2 size={16} /></button>
        <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Collapse details' : 'Expand details'} id={`expand-${item.id}`}>
          <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ display: 'flex' }}><ChevronDown size={18} /></motion.span>
        </button>
      </footer>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="card-details" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: 'easeInOut' }}>
            <div className="details-grid">
              {detailFields.length === 0 && <p className="muted">No additional details saved.</p>}
              {detailFields.map((f) => <DetailRow key={f.key} field={f} value={item[f.key]} currency={currency} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
