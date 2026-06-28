import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { fmtZAR, todayISO } from '../utils/helpers';
import { Icon } from './Modals';
import { Empty } from './Dashboard';

export default function Journal({ 
  trades = [], 
  stats = {}, 
  onSave, 
  onDelete, 
  tradeFrom = "", 
  tradeTo = "", 
  setTradeFrom, 
  setTradeTo 
}) {
  // Local state handling modern form view toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState("Long");
  const [result, setResult] = useState("Win");
  const [rMultiple, setRMultiple] = useState("");
  const [pnl, setPnl] = useState("");
  const [date, setDate] = useState(todayISO());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSave) return;
    
    onSave({
      date,
      pair: pair.toUpperCase().trim(),
      direction,
      result,
      rMultiple: Number(rMultiple) || 0,
      pnl: Number(pnl) || 0
    });

    // Reset fields cleanly
    setPair("");
    setRMultiple("");
    setPnl("");
    setShowAddForm(false);
  };

  const winRate = stats?.winRate ?? null;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalPnl = stats?.totalPnl ?? 0;
  const totalCount = stats?.total ?? 0;
  const avgR = stats?.avgR ?? 0;
  const maxR = stats?.maxR ?? 0;
  const minR = stats?.minR ?? 0;
  const equityData = stats?.equity || [];
  const byPairData = stats?.byPair || [];

  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div>
          <h2>Personal Trading Journal</h2>
          <p className="fceo-muted">Track executions, risk targets, R-multiples and pair performance.</p>
        </div>
        <div className="fceo-filters">
          <span>From:</span><input type="date" value={tradeFrom} onChange={(e) => setTradeFrom(e.target.value)} />
          <span>To:</span><input type="date" value={tradeTo} onChange={(e) => setTradeTo(e.target.value)} />
          <button type="button" className="fceo-btn" onClick={() => { setTradeFrom(""); setTradeTo(""); }}>Clear</button>
          <button type="button" className="fceo-btn primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Icon name="plus" /> {showAddForm ? "Close Form" : "Add Trade"}
          </button>
        </div>
      </div>

      {/* Modern, clean embedded data entry table panel */}
      {showAddForm && (
        <div className="fceo-card" style={{ marginBottom: '24px', animation: 'fadeIn 0.2s ease-in-out' }}>
          <h3> Log New Execution Target parameters</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '16px', alignItems: 'end' }}>
            <label className="fceo-field">
              <span>Execution Date</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </label>
            <label className="fceo-field">
              <span>Currency / Asset Pair</span>
              <input type="text" placeholder="e.g. XAUUSD" value={pair} onChange={e => setPair(e.target.value)} required />
            </label>
            <label className="fceo-field">
              <span>Trade Order Direction</span>
              <select value={direction} onChange={e => setDirection(e.target.value)}>
                <option value="Long">Buy / Long</option>
                <option value="Short">Sell / Short</option>
              </select>
            </label>
            <label className="fceo-field">
              <span>Outcome Result</span>
              <select value={result} onChange={e => setResult(e.target.value)}>
                <option value="Win">Win Target Achieved</option>
                <option value="Loss">Loss Stop Triggered</option>
                <option value="BreakEven">Break-Even Point</option>
              </select>
            </label>
            <label className="fceo-field">
              <span>Risk R-Multiple (e.g. 2.5)</span>
              <input type="number" step="0.1" placeholder="2.5" value={rMultiple} onChange={e => setRMultiple(e.target.value)} required />
            </label>
            <label className="fceo-field">
              <span>Net Net P&L (ZAR Value)</span>
              <input type="number" placeholder="e.g. 5000" value={pnl} onChange={e => setPnl(e.target.value)} required />
            </label>
            <button type="submit" className="fceo-btn primary" style={{ height: '44px', width: '100%' }}>Add Trade</button>
          </form>
        </div>
      )}

      <div className="fceo-grid">
        <div className="fceo-card"><h3>Win Rate</h3><div className="fceo-big">{winRate === null ? "—%" : winRate.toFixed(1) + "%"}</div><div className="fceo-muted small">{wins}W / {losses}L</div></div>
        <div className="fceo-card"><h3>Total P&amp;L</h3><div className={"fceo-big " + (totalPnl >= 0 ? "up" : "down")}>{fmtZAR(totalPnl)}</div><div className="fceo-muted small">{totalCount} total trades logged</div></div>
        <div className="fceo-card"><h3>Avg R:R Outcome</h3><div className="fceo-big">{(avgR >= 0 ? "+" : "") + avgR.toFixed(2)}R</div><div className="fceo-muted small">Net cumulative performance</div></div>
        <div className="fceo-card"><h3>Extremes</h3><div className="fceo-big small">Max: <span className="up">{maxR.toFixed(2)}R</span> &nbsp; Min: <span className="down">{minR.toFixed(2)}R</span></div></div>
      </div>

      <div className="fceo-card">
        <h2>Performance Equity Curve</h2>
        {equityData.length === 0 ? <Empty text="Log executions to graph performance curves." /> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={equityData}>
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
        {byPairData.length === 0 ? <Empty text="No pairs traded yet." /> : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPairData}>
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
                  {byPairData.map((p) => (
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
                    <button type="button" onClick={() => onDelete(t.id)}><Icon name="trash" /></button>
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