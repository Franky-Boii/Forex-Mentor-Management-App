import React, { useState } from "react";
import { todayISO, PAIRS, STAGES, fmtZAR } from "../utils/helpers";

// Reusable Icon Engine
export const Icon = ({ name, size = 16 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    plus: <line x1="12" y1="5" x2="12" y2="19" />,
    plus2: <line x1="5" y1="12" x2="19" y2="12" />,
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    teams: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 9.5h8M8 13h5" /></>,
    chevR: <polyline points="9 18 15 12 9 6" />,
    chevL: <polyline points="15 18 9 12 15 6" />,
    cal: <><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

export function Modal({ title, children, onClose }) {
  return (
    <div className="fceo-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fceo-modal">
        <div className="fceo-modal-head"><h3>{title}</h3><button className="fceo-iconbtn" onClick={onClose}><Icon name="close" /></button></div>
        <div className="fceo-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) { 
  return <label className="fceo-field"><span>{label}</span>{children}</label>; 
}

export function StudentModal({ initial, onClose, onSave, defaultTeamsLink }) {
  const DAYS_LIST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [form, setForm] = useState({
    id: initial.id, fullName: initial.fullName || "", idNumber: initial.idNumber || "",
    startDate: initial.startDate || todayISO(), days: initial.days || [], sessionTime: initial.sessionTime || "16:00",
    monthlyFee: initial.monthlyFee ?? "", teamsLink: initial.teamsLink || defaultTeamsLink || "",
    notes: initial.notes || "", active: initial.active !== false,
  });
  
  const toggleDay = (d) => setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));
  const pickFour = (combo) => setForm((f) => ({ ...f, days: combo }));
  
  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { alert("Full name is required."); return; }
    onSave({ ...form, monthlyFee: Number(form.monthlyFee) || 0 });
  };

  return (
    <Modal title={initial.id ? "Edit Student" : "Add Student"} onClose={onClose}>
      <form onSubmit={submit} className="fceo-form" noValidate>
        <Field label="Full name"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoFocus /></Field>
        <Field label="ID number"><input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></Field>
        <div className="fceo-form-row">
          <Field label="Start date"><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Session time"><input type="time" value={form.sessionTime} onChange={(e) => setForm({ ...form, sessionTime: e.target.value })} /></Field>
        </div>
        <Field label="Lesson days (this student's fixed weekly days)">
          <div className="fceo-quickpicks">
            <button type="button" className="fceo-chip-btn" onClick={() => pickFour(["Mon","Tue","Wed","Thu"])}>Mon–Thu</button>
            <button type="button" className="fceo-chip-btn" onClick={() => pickFour(["Tue","Wed","Thu","Fri"])}>Tue–Fri</button>
            <button type="button" className="fceo-chip-btn" onClick={() => pickFour(["Mon","Tue","Thu","Fri"])}>Mon,Tue,Thu,Fri</button>
            <button type="button" className="fceo-chip-btn" onClick={() => pickFour([])}>Clear</button>
          </div>
          <div className="fceo-days">
            {DAYS_LIST.map((d) => (
              <button type="button" key={d} className={"fceo-day" + (form.days.includes(d) ? " active" : "")} onClick={() => toggleDay(d)}>{d}</button>
            ))}
          </div>
        </Field>
        <div className="fceo-form-row">
          <Field label="Monthly fee (ZAR)"><input type="number" min="0" step="0.01" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></Field>
          <Field label="Status">
            <select value={form.active ? "active" : "inactive"} onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <Field label="Teams meeting link"><input value={form.teamsLink} onChange={(e) => setForm({ ...form, teamsLink: e.target.value })} placeholder="https://teams.microsoft.com/..." /></Field>
        <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="fceo-form-actions">
          <button type="button" className="fceo-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="fceo-btn primary">Save student</button>
        </div>
      </form>
    </Modal>
  );
}

export function TradeModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    id: initial.id, date: initial.date || todayISO(), pair: initial.pair || PAIRS[0], direction: initial.direction || "Buy",
    entry: initial.entry || "", exit: initial.exit || "", rMultiple: initial.rMultiple ?? "", pnl: initial.pnl ?? "",
    result: initial.result || "Win", screenshotUrl: initial.screenshotUrl || "", notes: initial.notes || "",
  });

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, pnl: Number(form.pnl) || 0, rMultiple: form.rMultiple === "" ? "" : Number(form.rMultiple) });
  };

  return (
    <Modal title={initial.id ? "Edit Trade" : "Add Trade"} onClose={onClose}>
      <form className="fceo-form" onSubmit={submit} noValidate>
        <div className="fceo-form-row">
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Pair">
            <input list="fceo-pairs" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value.toUpperCase() })} />
            <datalist id="fceo-pairs">{PAIRS.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
        </div>
        <div className="fceo-form-row">
          <Field label="Direction">
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option>Buy</option><option>Sell</option></select>
          </Field>
          <Field label="Result">
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}><option>Win</option><option>Loss</option><option>Breakeven</option></select>
          </Field>
        </div>
        <div className="fceo-form-row">
          <Field label="Entry price"><input type="number" step="any" value={form.entry} onChange={(e) => setForm({ ...form, entry: e.target.value })} /></Field>
          <Field label="Exit price"><input type="number" step="any" value={form.exit} onChange={(e) => setForm({ ...form, exit: e.target.value })} /></Field>
        </div>
        <div className="fceo-form-row">
          <Field label="R-multiple"><input type="number" step="0.01" value={form.rMultiple} onChange={(e) => setForm({ ...form, rMultiple: e.target.value })} placeholder="e.g. 2.5" /></Field>
          <Field label="P&L (ZAR)"><input type="number" step="0.01" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} /></Field>
        </div>
        <Field label="Strategy / chart layout URL"><input value={form.screenshotUrl} onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })} placeholder="https://tradingview.com/..." /></Field>
        <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="fceo-form-actions">
          <button type="button" className="fceo-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="fceo-btn primary">Save trade</button>
        </div>
      </form>
    </Modal>
  );
}

export function LeadModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ id: initial.id, name: initial.name || "", contact: initial.contact || "", stage: initial.stage || "prospect", notes: initial.notes || "" });
  const submit = (e) => { e.preventDefault(); if (!form.name.trim()) return; onSave(form); };
  return (
    <Modal title={initial.id ? "Edit Lead" : "New Lead"} onClose={onClose}>
      <form className="fceo-form" onSubmit={submit} noValidate>
        <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
        <Field label="Contact (email / phone / IG)"><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
        <Field label="Stage">
          <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            {STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Notes"><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="fceo-form-actions">
          <button type="button" className="fceo-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="fceo-btn primary">Save lead</button>
        </div>
      </form>
    </Modal>
  );
}

export function PaymentModal({ student, onClose, onSave }) {
  const [amount, setAmount] = useState(student?.monthlyFee || "");
  const [date, setDate] = useState(todayISO());
  if (!student) return null;
  const submit = (e) => { e.preventDefault(); if (!amount) return; onSave(amount, date); };
  return (
    <Modal title={`Log payment — ${student.fullName}`} onClose={onClose}>
      <form className="fceo-form" onSubmit={submit} noValidate>
        <Field label="Amount (ZAR)"><input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
        <Field label="Date paid"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <div className="fceo-form-actions">
          <button type="button" className="fceo-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="fceo-btn primary">Log payment</button>
        </div>
      </form>
      {student.payments?.length > 0 && (
        <div className="fceo-paylog">
          <div className="fceo-muted" style={{ marginBottom: 6 }}>Payment history</div>
          {[...student.payments].reverse().map((p) => (
            <div key={p.id} className="fceo-row small"><span>{p.date}</span><span className="mono">{fmtZAR(p.amount)}</span></div>
          ))}
        </div>
      )}
    </Modal>
  );
}