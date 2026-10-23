import { ASSET_CLASSES, MODULES } from '../data/schema.js';
import { toNum } from './format.js';
import { daysUntil } from './dates.js';

const sum = (list, key) => list.reduce((a, it) => a + toNum(it[key]), 0);

/** Global Net Worth Engine: (all assets incl. pension/PF) − (all debts). */
export function computeNetWorth(vault) {
  const byClass = Object.fromEntries(ASSET_CLASSES.map((c) => [c, 0]));
  const modules = {};
  let assets = 0;
  let debt = 0;
  for (const m of MODULES) {
    const list = vault.items[m.id] || [];
    const total = sum(list, m.valueKey);
    modules[m.id] = { count: list.length, total };
    if (m.isLiability) debt += total;
    else {
      assets += total;
      byClass[m.assetClass] += total;
    }
  }
  return { assets, debt, net: assets - debt, byClass, modules };
}

export function diversification(vault) {
  const { byClass, assets } = computeNetWorth(vault);
  return ASSET_CLASSES.map((name) => ({
    name,
    value: byClass[name],
    pct: assets > 0 ? (byClass[name] / assets) * 100 : 0,
  }));
}

const WINDOW_DAYS = 7;

/** Client-side Insights & Alerts. Nothing leaves the device. */
export function generateInsights(vault, now = new Date()) {
  const aprLimit = toNum(vault.settings?.aprThreshold ?? 12);
  const out = [];

  const due = (moduleId, key, label, recurring) => {
    for (const it of vault.items[moduleId] || []) {
      const d = daysUntil(it[key], now, recurring);
      if (d != null && d >= 0 && d <= WINDOW_DAYS) {
        out.push({
          kind: 'due',
          severity: d <= 2 ? 'danger' : 'warn',
          moduleId,
          id: it.id,
          days: d,
          title: it[MODULES.find((m) => m.id === moduleId).titleKey] || 'Untitled',
          label,
          amountKey: moduleId === 'credit' ? 'outstanding' : moduleId === 'liabilities' ? 'emi' : moduleId === 'assets' ? 'maturityValue' : 'balance',
          amount: moduleId === 'credit' ? it.outstanding : moduleId === 'liabilities' ? it.emi : moduleId === 'assets' ? it.maturityValue : it.balance,
        });
      }
    }
  };
  due('credit', 'dueDate', 'Card payment due', true);
  due('liabilities', 'paymentDeadline', 'EMI due', true);
  due('assets', 'maturityDate', 'Matures', false);
  due('retirement', 'lockIn', 'Lock-in ends', false);
  due('insurance', 'premiumDue', 'Insurance premium due', true);

  for (const it of vault.items.liabilities || []) {
    const apr = toNum(it.apr);
    if (apr > aprLimit && toNum(it.balance) > 0) {
      out.push({
        kind: 'apr',
        severity: 'danger',
        moduleId: 'liabilities',
        id: it.id,
        title: it.title || 'Untitled',
        apr,
        amount: it.balance,
      });
    }
  }
  out.sort((a, b) => (a.kind === b.kind ? (a.days ?? 0) - (b.days ?? 0) || (b.apr ?? 0) - (a.apr ?? 0) : a.kind === 'due' ? -1 : 1));
  return out;
}
