import React from 'react';
import { DAYS, HOURS, fmtDay, toISO, parseISO, addDays } from '../utils/helpers';
import { Icon, Field } from './Modals';

export default function CalendarView({ 
  sessionAt, 
  slotOverrides = {}, 
  toggleSlot, 
  slotKey, 
  weekDates = [], 
  calendarDate = "", 
  setCalendarDate 
}) {
  const todayISOstr = toISO(new Date());
  const goToday = () => setCalendarDate(todayISOstr);
  const handleShiftWeek = (n) => {
    if (!calendarDate) return;
    setCalendarDate(toISO(addDays(parseISO(calendarDate), n * 7)));
  };
  
  // Guard against empty array on boot window
  const rangeLabel = weekDates && weekDates.length >= 7
    ? `${fmtDay(weekDates[0])} – ${fmtDay(weekDates[6])}, ${weekDates[0].getFullYear()}`
    : "Loading operational calendar track...";

  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div>
          <h2>Weekly Calendar</h2>
          <p className="fceo-muted">Auto-filled from each student's fixed days/time. Click any open cell to mark it Available or Blocked.</p>
        </div>
        <div className="fceo-legend">
          <span><i className="dot session" /> Student session</span>
          <span><i className="dot available" /> Available</span>
          <span><i className="dot blocked" /> Blocked</span>
        </div>
      </div>

      <div className="fceo-cal-nav">
        <button type="button" className="fceo-btn" onClick={() => handleShiftWeek(-1)}><Icon name="chevL" /> Prev week</button>
        <button type="button" className="fceo-btn" onClick={goToday}>Today</button>
        <button type="button" className="fceo-btn" onClick={() => handleShiftWeek(1)}>Next week <Icon name="chevR" /></button>
        <span className="fceo-cal-range mono">{rangeLabel}</span>
        <Field label="Jump to date">
          <input type="date" value={calendarDate} onChange={(e) => setCalendarDate(e.target.value)} />
        </Field>
      </div>

      <div className="fceo-cal-wrap">
        <table className="fceo-cal">
          <thead>
            <tr>
              <th></th>
              {(weekDates || []).map((d) => {
                const iso = toISO(d);
                return (
                  <th key={iso} className={iso === todayISOstr ? "fceo-cal-today" : ""}>
                    {DAYS[(d.getDay() + 6) % 7]}<br /><span className="mono fceo-cal-date">{fmtDay(d)}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h}>
                <td className="fceo-cal-hour mono">{String(h).padStart(2, "0")}:00</td>
                {(weekDates || []).map((d) => {
                  const dayAbbr = DAYS[(d.getDay() + 6) % 7];
                  const sess = sessionAt ? sessionAt(d, h) : null;
                  const override = slotOverrides[slotKey ? slotKey(dayAbbr, h) : ''] || "open";
                  
                  if (sess) {
                    return (
                      <td key={toISO(d)} className="fceo-cal-cell session" title={sess.fullName}>
                        {sess.fullName ? sess.fullName.split(" ")[0] : "Session"}
                      </td>
                    );
                  }
                  return (
                    <td 
                      key={toISO(d)} 
                      className={"fceo-cal-cell " + override} 
                      onClick={() => toggleSlot && toggleSlot(dayAbbr, h)} 
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}