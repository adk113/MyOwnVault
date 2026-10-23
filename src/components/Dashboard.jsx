import { motion } from 'framer-motion';
import { AlertTriangle, CalendarClock, CheckCircle2, Flame, TrendingDown, TrendingUp } from 'lucide-react';
import Sensitive from './Sensitive.jsx';
import { CountUp, DonutChart } from './ui.jsx';
import { ModuleIcon } from './Icons.jsx';
import { MODULES, MODULE_MAP } from '../data/schema.js';
import { computeNetWorth, diversification, generateInsights } from '../lib/analytics.js';
import { formatMoney, formatPct } from '../lib/format.js';
import { useVault } from '../state/VaultContext.jsx';

export const CLASS_COLORS = [
  'hsl(188 90% 52%)',
  'hsl(32 95% 58%)',
  'hsl(152 70% 48%)',
  'hsl(222 90% 66%)',
  'hsl(48 95% 56%)',
  'hsl(12 85% 62%)',
  'hsl(165 85% 50%)',
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const rise = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } } };

function NetWorthCard({ nw, currency }) {
  const total = nw.assets + nw.debt;
  const assetPct = total > 0 ? (nw.assets / total) * 100 : 50;
  const positive = nw.net >= 0;
  return (
    <motion.section variants={rise} className="card hero-card" id="net-worth-card" aria-label="Net worth">
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-top">
        <span className="eyebrow">Global Net Worth</span>
        <span className={`trend ${positive ? 'up' : 'down'}`}>{positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {positive ? 'Positive equity' : 'Debt exceeds assets'}</span>
      </div>
      <div className="hero-number">
        <Sensitive mask="••••••••••" className="hero-sens">
          <CountUp value={nw.net} format={(n) => formatMoney(n, currency)} />
        </Sensitive>
      </div>
      <p className="hero-sub">Total Asset Base (incl. Pension/PF) − Total Debt Liabilities</p>
      <div className="split" role="img" aria-label="Assets versus debts">
        <motion.span className="split-assets" initial={{ width: 0 }} animate={{ width: `${assetPct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
        <motion.span className="split-debt" initial={{ width: 0 }} animate={{ width: `${100 - assetPct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </div>
      <div className="hero-stats">
        <div>
          <span className="dot dot-ok" /> Assets
          <b><Sensitive>{formatMoney(nw.assets, currency)}</Sensitive></b>
        </div>
        <div>
          <span className="dot dot-bad" /> Liabilities
          <b><Sensitive>{formatMoney(nw.debt, currency)}</Sensitive></b>
        </div>
      </div>
    </motion.section>
  );
}

function InsightsCard({ insights, currency, onOpen }) {
  return (
    <motion.section variants={rise} className="card panel" id="insights-card" aria-label="Insights and alerts">
      <header className="panel-head">
        <h2><Flame size={18} /> Insights &amp; Alerts</h2>
        <span className="count-badge">{insights.length}</span>
      </header>
      {insights.length === 0 ? (
        <div className="all-clear">
          <CheckCircle2 size={28} />
          <p><b>All clear.</b> No payments due in the next 7 days and no high-interest debt flagged.</p>
        </div>
      ) : (
        <ul className="insight-list">
          {insights.map((a, i) => (
            <motion.li key={`${a.kind}-${a.id}-${i}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
              <button className={`insight insight-${a.severity}`} onClick={() => onOpen(a.moduleId)}>
                <span className="insight-ico">{a.kind === 'due' ? <CalendarClock size={18} /> : <AlertTriangle size={18} />}</span>
                <span className="insight-text">
                  {a.kind === 'due' ? (
                    <>
                      <b>{a.title}</b>
                      <small>{a.label} · {a.days === 0 ? 'today' : a.days === 1 ? 'tomorrow' : `in ${a.days} days`}</small>
                    </>
                  ) : (
                    <>
                      <b>{a.title}</b>
                      <small>High interest · {a.apr}% APR – prioritise repayment</small>
                    </>
                  )}
                </span>
                {a.amount ? <span className="insight-amt"><Sensitive>{formatMoney(a.amount, currency)}</Sensitive></span> : null}
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}

function DiversificationCard({ data, currency }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const top = [...data].sort((a, b) => b.pct - a.pct)[0];
  return (
    <motion.section variants={rise} className="card panel" id="diversification-card" aria-label="Portfolio diversification">
      <header className="panel-head"><h2>Portfolio Diversification</h2></header>
      {total <= 0 ? (
        <p className="muted pad">Add assets to see how your wealth is distributed.</p>
      ) : (
        <div className="divers">
          <div className="donut-wrap">
            <DonutChart data={data} colors={CLASS_COLORS} />
            <div className="donut-center">
              <span>Largest</span>
              <b>{top.name}</b>
              <small>{formatPct(top.pct)}</small>
            </div>
          </div>
          <ul className="legend">
            {data.map((d, i) => (
              <li key={d.name}>
                <span className="swatch" style={{ background: CLASS_COLORS[i] }} />
                <span className="legend-name">{d.name}</span>
                <span className="legend-pct">{formatPct(d.pct)}</span>
                <small><Sensitive>{formatMoney(d.value, currency)}</Sensitive></small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}

export default function Dashboard({ onNavigate }) {
  const { vault } = useVault();
  const currency = vault.settings.currency;
  const nw = computeNetWorth(vault);
  const insights = generateInsights(vault);
  const div = diversification(vault);

  return (
    <motion.div className="dashboard" variants={container} initial="hidden" animate="show">
      <div className="page-title">
        <h1>Dashboard</h1>
        <p>Your complete wealth picture – computed locally, never uploaded.</p>
      </div>
      <div className="dash-grid">
        <NetWorthCard nw={nw} currency={currency} />
        <InsightsCard insights={insights} currency={currency} onOpen={onNavigate} />
        <DiversificationCard data={div} currency={currency} />
      </div>
      <motion.h2 variants={rise} className="section-h">Vault Modules</motion.h2>
      <div className="tiles">
        {MODULES.map((m) => {
          const s = nw.modules[m.id];
          return (
            <motion.button key={m.id} variants={rise} whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.97 }} className="tile card" style={{ '--hue': m.hue }} onClick={() => onNavigate(m.id)} id={`tile-${m.id}`}>
              <span className="chip"><ModuleIcon name={m.icon} size={20} /></span>
              <span className="tile-name">{m.short}</span>
              <span className="tile-count">{s.count} {s.count === 1 ? 'entry' : 'entries'}</span>
              <b className={`tile-total ${MODULE_MAP[m.id].isLiability ? 'is-debt' : ''}`}><Sensitive>{formatMoney(s.total, currency)}</Sensitive></b>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
