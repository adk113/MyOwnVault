export const MIN_PASSWORD = 10;

/** Quick offline strength estimate (entropy-ish). Returns score 0–4. */
export function scorePassword(pw = '') {
  if (!pw) return { score: 0, label: 'Too short', pct: 0 };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  const uniq = new Set(pw).size;
  let bits = Math.log2(Math.max(pool, 1)) * Math.min(pw.length, uniq * 2);
  if (/(.)\1{2,}/.test(pw)) bits -= 8;
  if (/(password|qwerty|123456|letmein|admin|welcome)/i.test(pw)) bits -= 25;
  const score = pw.length < MIN_PASSWORD ? 0 : bits < 45 ? 1 : bits < 65 ? 2 : bits < 85 ? 3 : 4;
  return { score, label: ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'][score], pct: Math.max(8, Math.min(100, (bits / 100) * 100)) };
}
