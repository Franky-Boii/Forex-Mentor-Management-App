import React from 'react';
import { fmtZAR } from '../utils/helpers';

export default function Header({ tab, setTab, winRate, income, todaysCount }) {
  const tabs = [
    ["dashboard", "Dashboard"], ["students", "Students"], ["calendar", "Calendar"],
    ["crm", "Pipeline"], ["journal", "Journal"], ["income", "Income"], ["settings", "Settings"],
  ];
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
          <span>WIN RATE&nbsp;<b className={winRate >= 50 ? "up" : "down"}>{winRate === null ? "—" : winRate.toFixed(1) + "%"}</b></span>
          <span>EXPECTED MONTHLY INCOME&nbsp;<b className="up">{fmtZAR(income)}</b></span>
          <span>SESSIONS TODAY&nbsp;<b>{todaysCount}</b></span>
          <span>WIN RATE&nbsp;<b className={winRate >= 50 ? "up" : "down"}>{winRate === null ? "—" : winRate.toFixed(1) + "%"}</b></span>
          <span>EXPECTED MONTHLY INCOME&nbsp;<b className="up">{fmtZAR(income)}</b></span>
          <span>SESSIONS TODAY&nbsp;<b>{todaysCount}</b></span>
        </div>
      </div>
      <nav className="fceo-nav">
        {tabs.map(([k, label]) => (
          <button key={k} className={"fceo-navbtn" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{label}</button>
        ))}
      </nav>
    </header>
  );
}