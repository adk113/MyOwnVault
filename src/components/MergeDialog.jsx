import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, GitMerge, Plus } from 'lucide-react';
import { Modal } from './ui.jsx';
import Sensitive from './Sensitive.jsx';
import { ModuleIcon } from './Icons.jsx';
import { MODULE_MAP, isBadgeType } from '../data/schema.js';
import { formatMoney } from '../lib/format.js';

const when = (ts) => (ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'unknown');

function Val({ field, value, currency }) {
  if (value === undefined || value === '' || value === null) return <i className="muted">empty</i>;
  const text = field.type === 'money' || field.type === 'computed' ? formatMoney(value, currency) : field.type === 'file' ? value.name : String(value);
  return isBadgeType(field) || field.sensitive || field.type === 'money' ? <Sensitive>{text}</Sensitive> : <>{text}</>;
}

function Row({ row, onChange, currency }) {
  const [open, setOpen] = useState(false);
  const mod = MODULE_MAP[row.moduleId];
  const item = row.incoming;
  const title = item[mod.titleKey] || 'Untitled';
  return (
    <li className={`merge-row merge-${row.status}`} style={{ '--hue': mod.hue }}>
      <div className="merge-main">
        <span className="chip chip-sm"><ModuleIcon name={mod.icon} size={16} /></span>
        <div className="merge-title">
          <b>{title}</b>
          <small>{mod.short} · {row.status === 'new' ? 'Only in backup' : 'Differs from your vault'}</small>
        </div>
        {row.status === 'new' ? (
          <label className="check">
            <input type="checkbox" checked={row.choice === 'incoming'} onChange={(e) => onChange(row.key, e.target.checked ? 'incoming' : 'local')} />
            <span><Plus size={13} /> Import</span>
          </label>
        ) : (
          <div className="seg" role="radiogroup" aria-label={`Resolve ${title}`}>
            <button type="button" className={row.choice === 'local' ? 'is-on' : ''} onClick={() => onChange(row.key, 'local')}>
              Keep mine {!row.incomingNewer && <em>newer</em>}
            </button>
            <button type="button" className={row.choice === 'incoming' ? 'is-on' : ''} onClick={() => onChange(row.key, 'incoming')}>
              Use backup {row.incomingNewer && <em>newer</em>}
            </button>
          </div>
        )}
        {row.status === 'conflict' && (
          <button type="button" className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Show changes">
            <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ display: 'flex' }}><ChevronDown size={16} /></motion.span>
          </button>
        )}
      </div>
      {row.status === 'conflict' && (
        <div className="merge-times">
          <span className={!row.incomingNewer ? 'is-newer' : ''}>Mine · {when(row.local.updatedAt)}</span>
          <ArrowRight size={12} />
          <span className={row.incomingNewer ? 'is-newer' : ''}>Backup · {when(row.incoming.updatedAt)}</span>
        </div>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul className="merge-diffs" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {row.diffs.map((d) => (
              <li key={d.field.key}>
                <span className="diff-field">{d.field.label}</span>
                <span className="diff-old"><Val field={d.field} value={d.local} currency={currency} /></span>
                <ArrowRight size={12} />
                <span className="diff-new"><Val field={d.field} value={d.incoming} currency={currency} /></span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function MergeDialog({ open, rows: initial, onClose, onApply, currency }) {
  const [rows, setRows] = useState(initial);
  const actionable = useMemo(() => rows.filter((r) => r.status !== 'same'), [rows]);
  const same = rows.length - actionable.length;
  const pending = actionable.filter((r) => (r.status === 'new' ? r.choice === 'incoming' : r.choice === 'incoming')).length;
  const set = (key, choice) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, choice } : r)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={720}
      title="Smart Delta Merge"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-soft" onClick={() => setRows((rs) => rs.map((r) => (r.status === 'conflict' ? { ...r, choice: r.incomingNewer ? 'incoming' : 'local' } : r)))}>Newest wins</button>
          <button className="btn btn-primary" id="apply-merge" disabled={pending === 0} onClick={() => onApply(rows)}>
            <GitMerge size={16} /> Apply {pending} change{pending === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <p className="muted">Rows are matched by ID and compared using their local timestamps. Nothing is overwritten unless you pick it. A rollback snapshot is taken before applying.</p>
      {actionable.length === 0 ? (
        <div className="all-clear"><GitMerge size={28} /><p><b>Already in sync.</b> {same} entr{same === 1 ? 'y is' : 'ies are'} identical to your vault.</p></div>
      ) : (
        <ul className="merge-list">
          {actionable.map((r) => <Row key={r.key} row={r} onChange={set} currency={currency} />)}
        </ul>
      )}
      {same > 0 && actionable.length > 0 && <p className="muted small">{same} identical entr{same === 1 ? 'y' : 'ies'} skipped.</p>}
    </Modal>
  );
}
