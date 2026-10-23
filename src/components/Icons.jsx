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
