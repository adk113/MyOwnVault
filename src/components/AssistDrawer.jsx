import { useRef } from 'react';
import { ExternalLink, ShieldAlert, Timer } from 'lucide-react';
import { Sheet } from './ui.jsx';
import SecretBadge from './SecretBadge.jsx';
import { ModuleIcon } from './Icons.jsx';
import { hostOf, safeUrl } from '../lib/format.js';

/**
 * Vault-Assist drawer: opens beside the launched portal tab so User ID, password,
 * PIN and live TOTP are one tap away – no digging through vault menus.
 */
export default function AssistDrawer({ module, item: liveItem, onClose }) {
  const open = !!liveItem;
  const last = useRef(liveItem);
  if (liveItem) last.current = liveItem;
  const item = liveItem || last.current; // keep content on screen during the exit animation
  const url = item ? safeUrl(item.portalUrl) : null;
  const fields = item ? module.assist.map((k) => module.fields.find((f) => f.key === k)).filter((f) => f && item[f.key]) : [];
  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={420}
      title={item?.portalNickname || item?.[module.titleKey] || 'Quick-copy'}
      subtitle={url ? hostOf(url) : ''}
      icon={<span className="chip" style={{ '--hue': module.hue }}><ModuleIcon name={module.icon} size={20} /></span>}
    >
      {item && (
        <div className="assist">
          {url && (
            <a className="btn btn-primary assist-open" href={url} target="_blank" rel="noopener noreferrer" id="assist-open">
              <ExternalLink size={16} /> Open official portal again
            </a>
          )}
          <div className="assist-note"><ShieldAlert size={15} /> Confirm the address bar shows <b>{url && hostOf(url)}</b> before typing anything.</div>
          <div className="assist-list">
            {fields.length === 0 && <p className="muted">No credentials saved for this entry yet – edit it to add a User ID or password.</p>}
            {fields.map((f) => (
              <SecretBadge key={f.key} label={f.label.replace(/ \(.*\)/, '')} value={String(item[f.key])} kind={f.type === 'totp' ? 'totp' : f.type === 'userid' ? 'userid' : f.type === 'pin' ? 'pin' : f.type === 'secret' ? 'secret' : f.type === 'cardnumber' ? 'cardnumber' : 'text'} block />
            ))}
          </div>
          <div className="assist-note subtle"><Timer size={15} /> Each copied value is wiped from your clipboard after 30&nbsp;seconds.</div>
        </div>
      )}
    </Sheet>
  );
}
