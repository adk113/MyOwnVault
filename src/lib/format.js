export const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'British Pound (£)' },
  { code: 'AED', symbol: 'د.إ', locale: 'en-AE', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', label: 'Singapore Dollar' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', label: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', label: 'Japanese Yen' },
];

export const currencyInfo = (code) => CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];

export const toNum = (v) => {
  if (v === '' || v == null) return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export function formatMoney(value, code = 'INR', { decimals = 0 } = {}) {
  const { locale } = currencyInfo(code);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals || (Math.abs(toNum(value)) < 1000 && toNum(value) % 1 !== 0 ? 2 : 0),
  }).format(toNum(value));
}

export const formatPct = (n, digits = 1) => `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;

export const groupDigits = (s = '') =>
  String(s)
    .replace(/\s+/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();

export function safeUrl(input) {
  if (!input) return null;
  let u = String(input).trim();
  if (!u) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = `https://${u}`;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export const hostOf = (u) => {
  try {
    return new URL(u).host.replace(/^www\./, '');
  } catch {
    return u;
  }
};

export function formatBytes(n = 0) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
