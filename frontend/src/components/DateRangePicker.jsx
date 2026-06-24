import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './DateRangePicker.css';

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function toYMD(date) {
  return date.toISOString().split('T')[0];
}

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Returns true if `date` falls within any booked range (inclusive of check-in, exclusive of check-out) */
function isDateBooked(date, bookedRanges) {
  const d = startOfDay(date).getTime();
  return bookedRanges.some(({ checkIn, checkOut }) => {
    const s = parseYMD(checkIn)?.getTime();
    const e = parseYMD(checkOut)?.getTime();
    if (!s || !e) return false;
    return d >= s && d < e;
  });
}

/** Returns true if the range [start, end] overlaps with any booked range */
function rangeOverlapsBooked(start, end, bookedRanges) {
  return bookedRanges.some(({ checkIn, checkOut }) => {
    const s = parseYMD(checkIn)?.getTime();
    const e = parseYMD(checkOut)?.getTime();
    if (!s || !e) return false;
    return start.getTime() < e && s < end.getTime();
  });
}

/** Build the grid of days for a given year/month */
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

function CalendarMonth({ year, month, checkIn, checkOut, hoveredDate, bookedRanges, onDayClick, onDayHover, today }) {
  const cells = buildCalendarDays(year, month);

  return (
    <div className="drp-month">
      <div className="drp-month__name">{MONTHS[month]} {year}</div>
      <div className="drp-month__grid">
        {DAYS.map(d => <div key={d} className="drp-cell drp-cell--header">{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="drp-cell drp-cell--empty" />;

          const ymd        = toYMD(date);
          const isPast     = startOfDay(date) < startOfDay(today);
          const isBooked   = isDateBooked(date, bookedRanges);
          const disabled   = isPast || isBooked;

          const isStart    = checkIn  && ymd === checkIn;
          const isEnd      = checkOut && ymd === checkOut;
          const isToday    = ymd === toYMD(today);

          // Highlight range between selected start and hovered/selected end
          const rangeEnd   = checkOut ? parseYMD(checkOut) : hoveredDate;
          const inRange    = checkIn && rangeEnd && !isBooked
            && startOfDay(date) > parseYMD(checkIn)
            && startOfDay(date) < startOfDay(rangeEnd);

          const classes = [
            'drp-cell',
            disabled  ? 'drp-cell--disabled' : 'drp-cell--available',
            isBooked  ? 'drp-cell--booked'   : '',
            isStart   ? 'drp-cell--start'    : '',
            isEnd     ? 'drp-cell--end'      : '',
            inRange   ? 'drp-cell--in-range' : '',
            isToday   ? 'drp-cell--today'    : '',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={ymd}
              className={classes}
              onClick={() => !disabled && onDayClick(date)}
              onMouseEnter={() => !disabled && onDayHover(date)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({ checkIn, checkOut, onChange }) {
  const { t } = useTranslation();
  const today = startOfDay(new Date());
  const [open, setOpen] = useState(false);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(false);
  const wrapRef = useRef(null);

  // Fetch booked ranges when picker opens
  useEffect(() => {
    if (!open || bookedRanges.length > 0) return;
    setLoadingRanges(true);
    fetch('/api/booked-dates')
      .then(r => r.json())
      .then(d => setBookedRanges(d.bookedRanges || []))
      .catch(() => {})
      .finally(() => setLoadingRanges(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDayClick = (date) => {
    const ymd = toYMD(date);

    if (!checkIn || (checkIn && checkOut)) {
      // Start a new selection
      onChange({ checkIn: ymd, checkOut: '' });
    } else {
      // We have checkIn but no checkOut
      if (date <= parseYMD(checkIn)) {
        // Clicked before or on start — restart
        onChange({ checkIn: ymd, checkOut: '' });
        return;
      }
      // Check if range crosses any booked dates
      if (rangeOverlapsBooked(parseYMD(checkIn), date, bookedRanges)) {
        onChange({ checkIn: ymd, checkOut: '' });
        return;
      }
      onChange({ checkIn, checkOut: ymd });
      setOpen(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Second month shown beside the first
  const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const year2  = viewMonth === 11 ? viewYear + 1 : viewYear;

  const formatDisplay = (ymd) => {
    if (!ymd) return '';
    const d = parseYMD(ymd);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="drp-wrap" ref={wrapRef}>
      {/* Trigger button */}
      <div className="drp-trigger" onClick={() => setOpen(o => !o)}>
        <div className="drp-trigger__field">
          <span className="drp-trigger__label">{t('common.checkIn')}</span>
          <span className={`drp-trigger__value ${!checkIn ? 'drp-trigger__value--placeholder' : ''}`}>
            {checkIn ? formatDisplay(checkIn) : t('common.selectDate')}
          </span>
        </div>
        <div className="drp-trigger__divider" />
        <div className="drp-trigger__field">
          <span className="drp-trigger__label">{t('common.checkOut')}</span>
          <span className={`drp-trigger__value ${!checkOut ? 'drp-trigger__value--placeholder' : ''}`}>
            {checkOut ? formatDisplay(checkOut) : t('common.selectDate')}
          </span>
        </div>
        <svg className="drp-trigger__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div className="drp-dropdown" onMouseLeave={() => setHoveredDate(null)}>
          {/* Nav header */}
          <div className="drp-nav">
            <button className="drp-nav__btn" onClick={prevMonth} aria-label="Previous month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="drp-nav__months">
              <span>{MONTHS[viewMonth]} {viewYear}</span>
              <span>{MONTHS[month2]} {year2}</span>
            </div>
            <button className="drp-nav__btn" onClick={nextMonth} aria-label="Next month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {loadingRanges ? (
            <div className="drp-loading">{t('booking.checkingAvail')}</div>
          ) : (
            <div className="drp-months">
              <CalendarMonth
                year={viewYear} month={viewMonth}
                checkIn={checkIn} checkOut={checkOut}
                hoveredDate={hoveredDate}
                bookedRanges={bookedRanges}
                onDayClick={handleDayClick}
                onDayHover={setHoveredDate}
                today={today}
              />
              <CalendarMonth
                year={year2} month={month2}
                checkIn={checkIn} checkOut={checkOut}
                hoveredDate={hoveredDate}
                bookedRanges={bookedRanges}
                onDayClick={handleDayClick}
                onDayHover={setHoveredDate}
                today={today}
              />
            </div>
          )}

          {/* Legend */}
          <div className="drp-legend">
            <span className="drp-legend__item drp-legend__item--booked">{t('booking.booked')}</span>
            <span className="drp-legend__item drp-legend__item--available">{t('booking.available')}</span>
            {checkIn && !checkOut && <span className="drp-legend__hint">{t('booking.selectCheckout')}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
