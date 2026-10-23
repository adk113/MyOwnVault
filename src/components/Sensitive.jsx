import { useUI } from '../state/UIContext.jsx';

/**
 * Global privacy mask. While masked, the real value is NOT rendered into the DOM –
 * a fixed-width placeholder sits under a `backdrop-filter: blur()` veil that animates
 * in/out simultaneously on every screen.
 */
export default function Sensitive({ children, mask = '••••••••', className = '', as: Tag = 'span' }) {
  const { masked } = useUI();
  return (
    <Tag className={`sens ${masked ? 'is-masked' : ''} ${className}`}>
      <span className="sens-text">{masked ? mask : children}</span>
      <span className="sens-veil" aria-hidden="true" />
    </Tag>
  );
}
