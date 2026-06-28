import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./styles/ForexCEO.css";

// Utilities & Components
import { 
  loadKey, saveKey, uid, todayISO, thisMonthKey, monthKey, weekdayAbbr, 
  parseISO, toISO, addDays, mondayOf 
} from "./utils/helpers";

import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Students from "./components/Students";
import CalendarView from "./components/CalendarView";
import CRM from "./components/CRM";
import Journal from "./components/Journal";
import Income from "./components/Income";
import Settings from "./components/Settings";

import { StudentModal, TradeModal, LeadModal, PaymentModal } from "./components/Modals";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [trades, setTrades] = useState([]);
  const [leads, setLeads] = useState([]);
  const [slotOverrides, setSlotOverrides] = useState({});
  const [settings, setSettings] = useState({ defaultTeamsLink: "" });

  const [studentModal, setStudentModal] = useState(null);
  const [tradeModal, setTradeModal] = useState(null);
  const [leadModal, setLeadModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [tradeFrom, setTradeFrom] = useState("");
  const [tradeTo, setTradeTo] = useState("");
  const [incomeMonth, setIncomeMonth] = useState(thisMonthKey());
  const [calendarDate, setCalendarDate] = useState(todayISO());

  useEffect(() => {
    (async () => {
      const [s, t, l, so, set] = await Promise.all([
        loadKey("fceo_students", []),
        loadKey("fceo_trades", []),
        loadKey("fceo_leads", []),
        loadKey("fceo_slot_overrides", {}),
        loadKey("fceo_settings", { defaultTeamsLink: "" }),
      ]);
      setStudents(s); setTrades(t); setLeads(l); setSlotOverrides(so); setSettings(set);
      setLoading(false);
    })();
  }, []);

  const persistStudents = useCallback((next) => { setStudents(next); saveKey("fceo_students", next); }, []);
  const persistTrades = useCallback((next) => { setTrades(next); saveKey("fceo_trades", next); }, []);
  const persistLeads = useCallback((next) => { setLeads(next); saveKey("fceo_leads", next); }, []);
  const persistSlots = useCallback((next) => { setSlotOverrides(next); saveKey("fceo_slot_overrides", next); }, []);
  const persistSettings = useCallback((next) => { setSettings(next); saveKey("fceo_settings", next); }, []);

  // Derived Telemetry Analytics Engine
  const activeStudents = useMemo(() => students.filter((s) => s.active !== false), [students]);

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (tradeFrom && t.date < tradeFrom) return false;
      if (tradeTo && t.date > tradeTo) return false;
      return true;
    }).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [trades, tradeFrom, tradeTo]);

  const stats = useMemo(() => {
    const wins = filteredTrades.filter((t) => t.result === "Win").length;
    const losses = filteredTrades.filter((t) => t.result === "Loss").length;
    const total = filteredTrades.length;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;
    const totalPnl = filteredTrades.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
    const rVals = filteredTrades.map((t) => Number(t.rMultiple)).filter((v) => !isNaN(v));
    const avgR = rVals.length ? rVals.reduce((a, b) => a + b, 0) / rVals.length : 0;
    const maxR = rVals.length ? Math.max(...rVals) : 0;
    const minR = rVals.length ? Math.min(...rVals) : 0;
    
    let cum = 0;
    const equity = filteredTrades.map((t, i) => { cum += Number(t.pnl) || 0; return { idx: i + 1, date: t.date, equity: cum }; });
    const byPair = {};
    filteredTrades.forEach((t) => {
      const p = t.pair || "—";
      if (!byPair[p]) byPair[p] = { pair: p, trades: 0, wins: 0, losses: 0, pnl: 0 };
      byPair[p].trades += 1;
      if (t.result === "Win") byPair[p].wins += 1;
      if (t.result === "Loss") byPair[p].losses += 1;
      byPair[p].pnl += Number(t.pnl) || 0;
    });
    return { wins, losses, total, winRate, totalPnl, avgR, maxR, minR, equity, byPair: Object.values(byPair) };
  }, [filteredTrades]);

  const expectedMonthlyIncome = useMemo(
    () => activeStudents.reduce((a, s) => a + (Number(s.monthlyFee) || 0), 0),
    [activeStudents]
  );

  const collectedThisMonth = useMemo(() => {
    let total = 0;
    students.forEach((s) => (s.payments || []).forEach((p) => { if (monthKey(p.date) === incomeMonth) total += Number(p.amount) || 0; }));
    return total;
  }, [students, incomeMonth]);

  const todaysSessions = useMemo(() => {
    const today = new Date();
    const abbr = weekdayAbbr(today);
    const todayISOstr = toISO(today);
    return activeStudents
      .filter((s) => (s.days || []).includes(abbr) && (!s.startDate || s.startDate <= todayISOstr))
      .sort((a, b) => (a.sessionTime || "").localeCompare(b.sessionTime || ""));
  }, [activeStudents]);

  // Student Actions
  const saveStudent = (data) => {
    if (data.id) {
      persistStudents(students.map((s) => (s.id === data.id ? { ...s, ...data } : s)));
    } else {
      persistStudents([...students, { ...data, id: uid(), payments: [], active: true }]);
    }
    setStudentModal(null);
  };
  const deleteStudent = (id) => { if (confirm("Remove this student? This cannot be undone.")) persistStudents(students.filter((s) => s.id !== id)); };
  const logPayment = (studentId, amount, date) => {
    persistStudents(students.map((s) => s.id === studentId ? { ...s, payments: [...(s.payments || []), { id: uid(), amount: Number(amount), date }] } : s));
    setPaymentModal(null);
  };

  // Trade Actions
  const saveTrade = (data) => {
    if (data.id) persistTrades(trades.map((t) => (t.id === data.id ? { ...t, ...data } : t)));
    else persistTrades([...trades, { ...data, id: uid() }]);
    setTradeModal(null);
  };
  const deleteTrade = (id) => { if (confirm("Delete this trade entry?")) persistTrades(trades.filter((t) => t.id !== id)); };

  // CRM Pipeline Actions
  const saveLead = (data) => {
    if (data.id) persistLeads(leads.map((l) => (l.id === data.id ? { ...l, ...data } : l)));
    else persistLeads([...leads, { ...data, id: uid(), createdAt: todayISO() }]);
    setLeadModal(null);
  };
  const moveLead = (id, stage) => persistLeads(leads.map((l) => (l.id === id ? { ...l, stage } : l)));
  const deleteLead = (id) => persistLeads(leads.filter((l) => l.id !== id));

  // Calendar Helpers
  const weekDates = useMemo(() => {
    const monday = mondayOf(parseISO(calendarDate));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [calendarDate]);

  const sessionAt = (colDate, hour) => {
    const abbr = weekdayAbbr(colDate);
    const colISO = toISO(colDate);
    return activeStudents.find(
      (s) =>
        (s.days || []).includes(abbr) &&
        parseInt((s.sessionTime || "0:0").split(":")[0], 10) === hour &&
        (!s.startDate || s.startDate <= colISO)
    );
  };
  const slotKey = (day, hour) => `${day}-${hour}`;
  const toggleSlot = (day, hour) => {
    const k = slotKey(day, hour);
    const cur = slotOverrides[k] || "open";
    const next = cur === "open" ? "available" : cur === "available" ? "blocked" : "open";
    persistSlots({ ...slotOverrides, [k]: next });
  };

  if (loading) return <div className="fceo-loading">Loading Forex CEO Operating Parameters...</div>;

  return (
    <div className="fceo-app">
      <Header tab={tab} setTab={setTab} winRate={stats.winRate} income={expectedMonthlyIncome} todaysCount={todaysSessions.length} />

      <main className="fceo-main">
        {tab === "dashboard" && (
          <Dashboard
            todaysSessions={todaysSessions}
            stats={stats}
            expectedMonthlyIncome={expectedMonthlyIncome}
            collectedThisMonth={collectedThisMonth}
            activeStudents={activeStudents}
            leads={leads}
          />
        )}

        {tab === "students" && (
          <Students
            students={students}
            onAdd={() => setStudentModal({})}
            onEdit={(s) => setStudentModal(s)}
            onDelete={deleteStudent}
            onLogPayment={(id) => setPaymentModal(id)}
          />
        )}

        {tab === "calendar" && (
          <CalendarView
            sessionAt={sessionAt}
            slotOverrides={slotOverrides}
            toggleSlot={toggleSlot}
            slotKey={slotKey}
            weekDates={weekDates}
            calendarDate={calendarDate}
            setCalendarDate={setCalendarDate}
          />
        )}

        {tab === "crm" && (
          <CRM leads={leads} onAdd={() => setLeadModal({})} onEdit={(l) => setLeadModal(l)} onMove={moveLead} onDelete={deleteLead} />
        )}

        {tab === "journal" && (
          <Journal
            trades={filteredTrades}
            stats={stats}
            onAdd={() => setTradeModal({})}
            onEdit={(t) => setTradeModal(t)}
            onDelete={deleteTrade}
            tradeFrom={tradeFrom} tradeTo={tradeTo} setTradeFrom={setTradeFrom} setTradeTo={setTradeTo}
          />
        )}

        {tab === "income" && (
          <Income
            students={students}
            incomeMonth={incomeMonth}
            setIncomeMonth={setIncomeMonth}
            expectedMonthlyIncome={expectedMonthlyIncome}
            collectedThisMonth={collectedThisMonth}
            onLogPayment={(id) => setPaymentModal(id)}
          />
        )}

        {tab === "settings" && <Settings settings={settings} onSave={persistSettings} />}
      </main>

      {studentModal && (
        <StudentModal initial={studentModal} onClose={() => setStudentModal(null)} onSave={saveStudent} defaultTeamsLink={settings.defaultTeamsLink} />
      )}
      {tradeModal && <TradeModal initial={tradeModal} onClose={() => setTradeModal(null)} onSave={saveTrade} />}
      {leadModal && <LeadModal initial={leadModal} onClose={() => setLeadModal(null)} onSave={saveLead} />}
      {paymentModal && (
        <PaymentModal
          student={students.find((s) => s.id === paymentModal)}
          onClose={() => setPaymentModal(null)}
          onSave={(amount, date) => logPayment(paymentModal, amount, date)}
        />
      )}
    </div>
  );
}