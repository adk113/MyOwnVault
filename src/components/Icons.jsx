import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  Gem,
  Hash,
  Hourglass,
  KeyRound,
  Landmark,
  LayoutDashboard,
  PieChart,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  User,
} from 'lucide-react';

export const ICONS = {
  Landmark,
  CreditCard,
  PieChart,
  TrendingUp,
  Hourglass,
  Building2,
  Receipt,
  Gem,
  Shield,
  LayoutDashboard,
  Settings,
  AlertTriangle,
  CalendarClock,
  ShieldCheck,
  Check,
  KeyRound,
  Hash,
  User,
  Smartphone,
};

export const ModuleIcon = ({ name, size = 20, ...rest }) => {
  const I = ICONS[name] || Landmark;
  return <I size={size} {...rest} />;
};

export function VaultLogo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="MyOwnVault Sovereign Logo"
    >
      <defs>
        <linearGradient id="vLogoNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id="vLogoAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#080c18" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="23" fill="url(#vLogoAura)" />
      <circle cx="32" cy="32" r="23" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="32" cy="32" r="18" fill="#0c1222" stroke="url(#vLogoNeon)" strokeWidth="1.5" />
      <line x1="32" y1="8" x2="32" y2="12" stroke="url(#vLogoNeon)" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="32" y1="52" x2="32" y2="56" stroke="url(#vLogoNeon)" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="8" y1="32" x2="12" y2="32" stroke="url(#vLogoNeon)" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="52" y1="32" x2="56" y2="32" stroke="url(#vLogoNeon)" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M19 43 L19 21 L32 33 L45 21 L45 43 L39 43 L39 29 L32 36 L25 29 L25 43 Z"
        fill="url(#vLogoNeon)"
      />
      <polygon points="32,24 35,27 32,30 29,27" fill="#ffffff" />
    </svg>
  );
}
