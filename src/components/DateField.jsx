import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, displayDate, fromISO, parseDateInput, toISO } from '../lib/dates.js';

const WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function Calendar({ anchor, value, onPick, onClose, monthOnly }) {
  const selected = fromISO(value);
  const today = new Date();
  const [view, setView] = useState(() => {
    const d = selected || today;
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const h = ref.current?.offsetHeight || 340;
      const w = 296;
      const below = window.innerHeight - r.bottom;
      const top = below < h + 12 && r.top > h + 12 ? r.top - h - 8 : r.bottom + 8;
      setPos({ top: Math.max(8, top), left: Math.min(Math.max(8, r.left), window.innerWidth - w - 8) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor]);

  useEffect(() => {
    const down = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !anchor.contains(e.target)) onClose();
    };
    const key = (e) => e.key === 'Escape' && (e.stopPropagation(), onClose());
    document.addEventListener('mousedown', down);
    window.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('mousedown', down);
      window.removeEventListener('keydown', key, true);
    };
  }, [anchor, onClose]);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [view]);

  const shift = (n) =>
    setView((v) => {
      const d = new Date(v.y, v.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const years = Array.from({ length: 111 }, (_, i) => today.getFullYear() - 40 + i);
  const isSel = (d) => selected && d && selected.getFullYear() === view.y && selected.getMonth() === view.m && selected.getDate() === d;
  const isToday = (d) => d && today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;

  return createPortal(
    <motion.div ref={ref} className="cal" style={{ top: pos.top, left: pos.left }} initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.16 }} role="dialog" aria-label="Choose a date">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
        <div className="cal-selects">
          <select value={view.m} onChange={(e) => setView((v) => ({ ...v, m: +e.target.value }))} aria-label="Month">
            {MONTH_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
          </select>
          <select value={view.y} onChange={(e) => setView((v) => ({ ...v, y: +e.target.value }))} aria-label="Year">
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={16} /></button>
      </div>
      <div className="cal-grid cal-week">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${view.y}-${view.m}`} className="cal-grid" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.12 }}>
          {cells.map((d, i) =>
            d ? (
              <button type="button" key={i} className={`cal-day ${isSel(d) ? 'is-sel' : ''} ${isToday(d) ? 'is-today' : ''}`} onClick={() => onPick(toISO(new Date(view.y, view.m, d)))}>
                {d}
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </motion.div>
      </AnimatePresence>
      <div className="cal-foot">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPick('')}>Clear</button>
        {monthOnly && <span className="cal-note">Month &amp; year are used</span>}
        <button type="button" className="btn btn-soft btn-sm" onClick={() => onPick(toISO(today))}>Today</button>
      </div>
    </motion.div>,
    document.body,
  );
}

/**
 * Date field: interactive calendar popup AND free manual typing.
 * Accepts DD/MM/YYYY, YYYY-MM-DD, "5 Mar 2027" (and MM/YY for expiry fields).
 * Emits ISO strings; unparseable text is emitted raw so the form can flag it.
 */
export default function DateField({ id, value, onChange, monthOnly = false, placeholder }) {
  const [text, setText] = useState(() => displayDate(value, { monthOnly }));
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrap = useRef(null);
  const invalid = !!value && !fromISO(value);

  useEffect(() => {
    if (!focused) setText(displayDate(value, { monthOnly }));
  }, [value, focused, monthOnly]);

  const type = (t) => {
    setText(t);
    const parsed = parseDateInput(t, { monthOnly });
    onChange(parsed === null ? t : parsed);
  };

  return (
    <div className={`date-field ${invalid ? 'is-invalid' : ''}`} ref={wrap}>
      <input
        id={id}
        className="input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        placeholder={placeholder || (monthOnly ? 'MM/YY' : 'DD/MM/YYYY')}
        onChange={(e) => type(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const p = parseDateInput(text, { monthOnly });
          if (p) setText(displayDate(p, { monthOnly }));
        }}
      />
      <button type="button" className="date-btn" onClick={() => setOpen((o) => !o)} aria-label="Open calendar" id={id ? `${id}-cal` : undefined}>
        <CalendarDays size={16} />
      </button>
      {invalid && <span className="field-error">Use DD/MM/YYYY, YYYY-MM-DD or pick from the calendar</span>}
      <AnimatePresence>
        {open && (
          <Calendar
            anchor={wrap.current}
            value={fromISO(value) ? value : ''}
            monthOnly={monthOnly}
            onClose={() => setOpen(false)}
            onPick={(iso) => {
              onChange(iso);
              setText(displayDate(iso, { monthOnly }));
              setOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
