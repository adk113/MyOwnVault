export const MAX_PASSWORD = 8;
export const MIN_PASSWORD = 4;

/** Quick offline strength estimate (entropy-ish). Returns score 0–4 for passwords up to 8 characters. */
export function scorePassword(pw = '') {
  if (!pw) return { score: 0, label: 'Empty', pct: 0 };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  const uniq = new Set(pw).size;
  let bits = Math.log2(Math.max(pool, 1)) * Math.min(pw.length, uniq * 2);
  if (/(.)\1{2,}/.test(pw)) bits -= 8;
  if (/(password|qwerty|123456|letmein|admin|welcome)/i.test(pw)) bits -= 25;
  const score = pw.length < 4 ? 1 : bits < 25 ? 2 : bits < 40 ? 3 : 4;
  return { score, label: ['Invalid', 'Weak', 'Fair', 'Strong', 'Excellent'][score], pct: Math.max(15, Math.min(100, (pw.length / 8) * 100)) };
}
