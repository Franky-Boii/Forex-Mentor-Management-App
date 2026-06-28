import React from 'react';
import { fmtZAR } from '../utils/helpers';
import { Icon } from './Modals';

function Stat({ label, value, accent }) {
  return (
    <div className="fceo-stat">
      <span className="fceo-stat-label">{label}</span>
      <span className={"fceo-stat-value" + (accent ? " " + accent : "")}>{value}</span>
    </div>
  );
}

export function Empty({ text }) { return <div className="fceo-empty">{text}</div>; }

export default function Dashboard({ 
  todaysSessions = [], 
  stats = {}, 
  expectedMonthlyIncome = 0, 
  collectedThisMonth = 0, 
  activeStudents = [], 
  leads = [] 
}) {
  // Safe filtering logic checking collection instances safely
  const hotLeads = (leads || []).filter((l) => l.stage === "hot").length;
  
  // Normalize internal performance statistics dictionaries safely
  const winRate = stats?.winRate ?? null;
  const totalPnl = stats?.totalPnl ?? 0;
  const avgR = stats?.avgR ?? 0;
  const totalTrades = stats?.total ?? 0;

  return (
    <div className="fceo-grid">
      <section className="fceo-card span2">
        <h2>Today's Sessions</h2>
        {(todaysSessions || []).length === 0 ? (
          <Empty text="No sessions scheduled today. Enjoy the quiet desk." />
        ) : (
          <ul className="fceo-list">
            {todaysSessions.map((s) => (
              <li key={s.id} className="fceo-row">
                <div>
                  <div className="fceo-row-title">{s.fullName}</div>
                  <div className="fceo-row-sub">{s.sessionTime || "—"}</div>
                </div>
                {s.teamsLink ? (
                  <a className="fceo-pill teams" href={s.teamsLink} target="_blank" rel="noreferrer"><Icon name="teams" /> Join Teams</a>
                ) : <span className="fceo-pill muted">No link set</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="fceo-card">
        <h2>Snapshot</h2>
        <Stat label="Active students" value={(activeStudents || []).length} />
        <Stat label="Expected monthly income" value={fmtZAR(expectedMonthlyIncome)} accent="up" />
        <Stat label="Collected this month" value={fmtZAR(collectedThisMonth)} />
        <Stat label="Hot leads ready" value={hotLeads} />
      </section>

      <section className="fceo-card">
        <h2>Trading Performance</h2>
        <Stat label="Win rate" value={winRate === null ? "—" : winRate.toFixed(1) + "%"} accent={winRate >= 50 ? "up" : "down"} />
        <Stat label="Total P&L" value={fmtZAR(totalPnl)} accent={totalPnl >= 0 ? "up" : "down"} />
        <Stat label="Avg R:R outcome" value={(avgR >= 0 ? "+" : "") + avgR.toFixed(2) + "R"} />
        <Stat label="Trades logged" value={totalTrades} />
      </section>
    </div>
  );
}