import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import ItemCard from './ItemCard.jsx';
import ItemSheet from './ItemSheet.jsx';
import AssistDrawer from './AssistDrawer.jsx';
import Sensitive from './Sensitive.jsx';
import { Modal } from './ui.jsx';
import { ModuleIcon } from './Icons.jsx';
import { formatMoney, safeUrl, toNum } from '../lib/format.js';
import { useVault } from '../state/VaultContext.jsx';
import { useUI } from '../state/UIContext.jsx';

export default function ModuleView({ module }) {
  const { vault, deleteItem } = useVault();
  const { toast } = useUI();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // {item|null}
  const [confirm, setConfirm] = useState(null);
  const [assist, setAssist] = useState(null);

  const items = vault.items[module.id];
  const total = items.reduce((a, it) => a + toNum(it[module.valueKey]), 0);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => [it[module.titleKey], it[module.subtitleKey], it.institution, it.portalNickname].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [items, query, module]);

  const launch = (item) => {
    const url = safeUrl(item.portalUrl);
    if (!url) return toast('This entry has no valid portal link', 'danger');
    window.open(url, '_blank', 'noopener,noreferrer');
    setAssist(item);
  };

  return (
    <div className="module" style={{ '--hue': module.hue }}>
      <div className="module-head">
        <span className="chip chip-lg"><ModuleIcon name={module.icon} size={26} /></span>
        <div className="module-titles">
          <h1>{module.label}</h1>
          <p>
            {items.length} {items.length === 1 ? 'entry' : 'entries'} ·{' '}
            <b><Sensitive>{formatMoney(total, vault.settings.currency)}</Sensitive></b> {module.isLiability ? 'owed' : 'total value'}
          </p>
        </div>
        <div className="module-tools">
          {items.length > 3 && (
            <div className="search">
              <Search size={15} />
              <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search entries" id="module-search" />
            </div>
          )}
          <motion.button className="btn btn-primary" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }} onClick={() => setEditing({ item: null })} id="add-entry">
            <Plus size={16} /> Add {module.singular}
          </motion.button>
        </div>
      </div>

      {items.length === 0 ? (
        <motion.div className="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <span className="chip chip-xl"><ModuleIcon name={module.icon} size={34} /></span>
          <h3>No {module.short.toLowerCase()} yet</h3>
          <p>{module.guide.intro}</p>
          <button className="btn btn-primary" onClick={() => setEditing({ item: null })}><Plus size={16} /> Add your first {module.singular.toLowerCase()}</button>
        </motion.div>
      ) : (
        <motion.div layout className="deck">
          <AnimatePresence mode="popLayout">
            {filtered.map((it, i) => (
              <ItemCard key={it.id} module={module} item={it} index={i} onEdit={(item) => setEditing({ item })} onDelete={setConfirm} onLaunch={launch} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <p className="muted">No entries match “{query}”.</p>}
        </motion.div>
      )}

      {editing && <ItemSheet key={editing.item?.id || 'new'} module={module} item={editing.item} onClose={() => setEditing(null)} />}
      <AssistDrawer module={module} item={assist} onClose={() => setAssist(null)} />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete this entry?"
        tone="danger"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Keep it</button>
            <button
              className="btn btn-danger"
              id="confirm-delete"
              onClick={() => {
                deleteItem(module.id, confirm.id);
                toast('Entry deleted · restore from Rollback Snapshots if needed');
                setConfirm(null);
              }}
            >
              Delete permanently
            </button>
          </>
        }
      >
        <p>
          <b>{confirm?.[module.titleKey] || 'This entry'}</b> will be removed from your vault. A rolling snapshot of the previous state is kept in Settings → Rollback Snapshots.
        </p>
      </Modal>
    </div>
  );
}
