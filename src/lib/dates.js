const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}

const build = (y, mo, d) => {
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? toISO(dt) : null;
};

const lastDay = (y, mo) => new Date(y, mo, 0).getDate();

/** Manual-entry parser. Returns ISO yyyy-mm-dd or null. monthOnly allows MM/YY and MM/YYYY. */
export function parseDateInput(text, { monthOnly = false } = {}) {
  const s = (text || '').trim();
  if (!s) return '';
  let m;
  if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s))) return build(+m[1], +m[2], +m[3]);
  if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) return build(+m[3], +m[2], +m[1]);
  if ((m = /^(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/.exec(s))) {
    const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    return mo ? build(+m[3], mo, +m[1]) : null;
  }
  if (monthOnly && (m = /^(\d{1,2})\s*[/-]\s*(\d{2}|\d{4})$/.exec(s))) {
    const mo = +m[1];
    const y = m[2].length === 2 ? 2000 + +m[2] : +m[2];
    return mo >= 1 && mo <= 12 ? build(y, mo, lastDay(y, mo)) : null;
  }
  return null;
}

export function displayDate(iso, { monthOnly = false } = {}) {
  const d = fromISO(iso);
  if (!d) return iso || '';
  return monthOnly
    ? `${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`
    : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export const prettyDate = (iso) => {
  const d = fromISO(iso);
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : iso || '—';
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);

/**
 * Days until a due date. With `recurring`, a past date rolls forward month by month
 * (bill dates repeat) so a "due on the 5th" entry keeps producing alerts.
 */
export function daysUntil(iso, now = new Date(), recurring = false) {
  let d = fromISO(iso);
  if (!d) return null;
  if (recurring) {
    const day = d.getDate();
    let y = now.getFullYear();
    let mo = now.getMonth();
    d = new Date(y, mo, Math.min(day, lastDay(y, mo + 1)));
    if (daysBetween(now, d) < 0) {
      mo += 1;
      if (mo > 11) {
        mo = 0;
        y += 1;
      }
      d = new Date(y, mo, Math.min(day, lastDay(y, mo + 1)));
    }
  }
  return daysBetween(now, d);
}
