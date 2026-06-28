import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { fmtZAR } from '../utils/helpers';
import { Icon } from './Modals';
import { Empty } from './Dashboard';

export default function Journal({ trades, stats, onAdd, onEdit, onDelete, tradeFrom, tradeTo, setTradeFrom, setTradeTo }) {
  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div><h2>Personal Trading Journal</h2><p className="fceo-muted">Track executions, risk targets, R-multiples and pair performance.</p></div>
        <div className="fceo-filters">
          <span>From:</span><input type="date" value={tradeFrom} onChange={(e) => setTradeFrom(e.target.value)} />
          <span>To:</span><input type="date" value={tradeTo} onChange={(e) => setTradeTo(e.target.value)} />
          <button className="fceo-btn" onClick={() => { setTradeFrom(""); setTradeTo(""); }}>Clear</button>
          <button className="fceo-btn primary" onClick={onAdd}><Icon name="plus" /><Icon name="plus2" /> Add Trade</button>
        </div>
      </div>

      <div className="fceo-grid">
        <div className="fceo-card"><h3>Win Rate</h3><div className="fceo-big">{stats.winRate === null ? "—%" : stats.winRate.toFixed(1) + "%"}</div><div className="fceo-muted small">{stats.wins}W / {stats.losses}L</div></div>
        <div className="fceo-card"><h3>Total P&amp;L</h3><div className={"fceo-big " + (stats.totalPnl >= 0 ? "up" : "down")}>{fmtZAR(stats.totalPnl)}</div><div className="fceo-muted small">{stats.total} total trades logged</div></div>
        <div className="fceo-card"><h3>Avg R:R Outcome</h3><div className="fceo-big">{(stats.avgR >= 0 ? "+" : "") + stats.avgR.toFixed(2)}R</div><div className="fceo-muted small">Net cumulative performance</div></div>
        <div className="fceo-card"><h3>Extremes</h3><div className="fceo-big small">Max: <span className="up">{stats.maxR.toFixed(2)}R</span> &nbsp; Min: <span className="down">{stats.minR.toFixed(2)}R</span></div></div>
      </div>

      <div className="fceo-card">
        <h2>Performance Equity Curve</h2>
        {stats.equity.length === 0 ? <Empty text="Log executions to graph performance curves." /> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.equity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222a35" />
              <XAxis dataKey="idx" stroke="#8b949e" fontSize={12} />
              <YAxis stroke="#8b949e" fontSize={12} tickFormatter={(v) => "R" + v} />
              <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #2a3441", color: "#e6edf3" }} formatter={(v) => fmtZAR(v)} labelFormatter={(l) => "Trade #" + l} />
              <ReferenceLine y={0} stroke="#3a4452" />
              <Line type="monotone" dataKey="equity" stroke="#00e5a0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="fceo-card">
        <h2>By Currency Pair Performance</h2>
        {stats.byPair.length === 0 ? <Empty text="No pairs traded yet." /> : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.byPair}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222a35" />
                <XAxis dataKey="pair" stroke="#8b949e" fontSize={12} />
                <YAxis stroke="#8b949e" fontSize={12} />
                <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #2a3441", color: "#e6edf3" }} formatter={(v) => fmtZAR(v)} />
                <Bar dataKey="pnl" fill="#00e5a0" />
              </BarChart>
            </ResponsiveContainer>
            <div className="fceo-table-wrap">
              <table className="fceo-table">
                <thead><tr><th>Pair</th><th>Trades</th><th>Win rate</th><th>P&amp;L</th></tr></thead>
                <tbody>
                  {stats.byPair.map((p) => (
                    <tr key={p.pair}>
                      <td className="strong">{p.pair}</td><td>{p.trades}</td>
                      <td>{p.wins + p.losses > 0 ? ((p.wins / (p.wins + p.losses)) * 100).toFixed(1) + "%" : "—"}</td>
                      <td className={p.pnl >= 0 ? "up mono" : "down mono"}>{fmtZAR(p.pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="fceo-section-head"><h2>All Logged Executions</h2></div>
      {trades.length === 0 ? <Empty text="Log your first trade execution to begin engine calculation." /> : (
        <div className="fceo-table-wrap">
          <table className="fceo-table">
            <thead><tr><th>Date</th><th>Pair</th><th>Dir</th><th>Result</th><th>R</th><th>P&amp;L</th><th></th></tr></thead>
            <tbody>
              {[...trades].reverse().map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.date}</td><td className="strong">{t.pair}</td><td>{t.direction}</td>
                  <td><span className={"fceo-tag " + (t.result === "Win" ? "on" : t.result === "Loss" ? "off" : "")}>{t.result}</span></td>
                  <td className="mono">{t.rMultiple ? (t.rMultiple >= 0 ? "+" : "") + t.rMultiple + "R" : "—"}</td>
                  <td className={(t.pnl >= 0 ? "up" : "down") + " mono"}>{fmtZAR(t.pnl)}</td>
                  <td className="fceo-actions">
                    {t.screenshotUrl && <a href={t.screenshotUrl} target="_blank" rel="noreferrer" title="Strategy/chart layout">🔗</a>}
                    <button onClick={() => onEdit(t)}><Icon name="edit" /></button>
                    <button onClick={() => onDelete(t.id)}><Icon name="trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}