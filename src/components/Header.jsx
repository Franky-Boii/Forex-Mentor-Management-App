import React from 'react';
import { fmtZAR } from '../utils/helpers';

export default function Header({ tab, setTab, winRate, income, todaysCount }) {
  const tabs = [
    ["dashboard", "Dashboard"], ["students", "Students"], ["calendar", "Calendar"],
    ["crm", "Pipeline"], ["journal", "Journal"], ["income", "Income"], ["settings", "Settings"],
  ];
  
  const validWinRate = winRate ?? 0;
  const safeIncome = income ?? 0;
  const safeSessionsCount = todaysCount ?? 0;

  return (
    <header className="fceo-header">
      <div className="fceo-brand">
        <span className="fceo-brand-mark">FX</span>
        <div>
          <div className="fceo-brand-name">FOREX CEO</div>
          <div className="fceo-brand-sub">Mentorship &amp; Trading Operations Desk</div>
        </div>
      </div>
      <div className="fceo-ticker">
        <div className="fceo-ticker-track">
          <span>WIN RATE&nbsp;<b className={validWinRate >= 50 ? "up" : "down"}>{winRate === null || winRate === undefined ? "—" : validWinRate.toFixed(1) + "%"}</b></span>
          <span>EXPECTED MONTHLY INCOME&nbsp;<b className="up">{fmtZAR(safeIncome)}</b></span>
          <span>SESSIONS TODAY&nbsp;<b>{safeSessionsCount}</b></span>
          <span>WIN RATE&nbsp;<b className={validWinRate >= 50 ? "up" : "down"}>{winRate === null || winRate === undefined ? "—" : validWinRate.toFixed(1) + "%"}</b></span>
          <span>EXPECTED MONTHLY INCOME&nbsp;<b className="up">{fmtZAR(safeIncome)}</b></span>
          <span>SESSIONS TODAY&nbsp;<b>{safeSessionsCount}</b></span>
        </div>
      </div>
      <nav className="fceo-nav">
        {tabs.map(([k, label]) => (
          <button 
            key={k} 
            type="button" // Force browser to treat as an isolated script trigger
            className={"fceo-navbtn" + (tab === k ? " active" : "")} 
            onClick={(e) => {
              e.preventDefault(); // Stop any native event bubbling or form reloads
              setTab(k);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}