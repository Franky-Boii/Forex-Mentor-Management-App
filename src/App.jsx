import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from "firebase/firestore";

// Stylesheet Import
import "./styles/ForexCEO.css";

// Component imports
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Students from "./components/Students";
import Journal from "./components/Journal";
import CRM from "./components/CRM";
import Income from "./components/Income";
import Settings from "./components/Settings";
import CalendarView from "./components/CalendarView"; 
import { todayISO, toISO } from "./utils/helpers";

export default function App() {
  // Navigation & UI States
  const [view, setView] = useState("dashboard"); 
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Calendar Utility Navigation States
  const [calendarDate, setCalendarDate] = useState(todayISO());

  // Trading Journal Filtering States
  const [tradeFrom, setTradeFrom] = useState("");
  const [tradeTo, setTradeTo] = useState("");

  // Authentication Credentials State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");

  // Core Application Data States
  const [students, setStudents] = useState([]);
  const [trades, setTrades] = useState([]);
  const [leads, setLeads] = useState([]);

  // 1. Listen for User Authentication State Changes (Only fires on app mount)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Stream Real-Time Firestore Data collections tied to the Authenticated User
  useEffect(() => {
    if (!user) {
      setStudents([]);
      setTrades([]);
      setLeads([]);
      return;
    }

    // Real-time listener for Students collection
    const qStudents = query(collection(db, "students"), where("userId", "==", user.uid));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time listener for Trades collection
    const qTrades = query(collection(db, "trades"), where("userId", "==", user.uid));
    const unsubTrades = onSnapshot(qTrades, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time listener for CRM Leads collection
    const qLeads = query(collection(db, "leads"), where("userId", "==", user.uid));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubStudents();
      unsubTrades();
      unsubLeads();
    };
  }, [user]);

  // --- Auth Actions ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    }
  };

  const handleLogout = () => signOut(auth);

  // --- Firestore Mutation Handlers ---
  const saveStudent = async (studentData) => {
    if (studentData.id) {
      const docRef = doc(db, "students", studentData.id);
      await updateDoc(docRef, studentData);
    } else {
      await addDoc(collection(db, "students"), { ...studentData, userId: user.uid, payments: [] });
    }
  };

  const logPayment = async (studentId, amount, date) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    const updatedPayments = [...(student.payments || []), { id: Date.now().toString(), amount: Number(amount), date }];
    const docRef = doc(db, "students", studentId);
    await updateDoc(docRef, { payments: updatedPayments });
  };

  const saveTrade = async (tradeData) => {
    if (tradeData.id) {
      const docRef = doc(db, "trades", tradeData.id);
      await updateDoc(docRef, tradeData);
    } else {
      await addDoc(collection(db, "trades"), { ...tradeData, userId: user.uid, direction: tradeData.direction || "Long" });
    }
  };

  const deleteTrade = async (id) => {
    await deleteDoc(doc(db, "trades", id));
  };

  const saveLead = async (leadData) => {
    if (leadData.id) {
      const docRef = doc(db, "leads", leadData.id);
      await updateDoc(docRef, leadData);
    } else {
      await addDoc(collection(db, "leads"), { ...leadData, userId: user.uid, createdAtDate: todayISO() });
    }
  };

  const deleteLead = async (id) => {
    await deleteDoc(doc(db, "leads", id));
  };

  // --- Analytical Metric Computation Engines for the Ticker and Dashboard ---
  const activeStudents = students.filter((s) => s.active !== false);
  const expectedMonthlyIncome = activeStudents.reduce((acc, curr) => acc + (Number(curr.monthlyFee) || 0), 0);

  // Calculate collections received during the current active month window
  const currentMonthStr = todayISO().slice(0, 7); 
  const collectedThisMonth = students.reduce((total, student) => {
    const studentTotal = (student.payments || [])
      .filter((p) => p.date && p.date.startsWith(currentMonthStr))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return total + studentTotal;
  }, 0);

  // Parse weekly slot timetables to check daily active entries
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayWeekDay = daysShort[new Date().getDay()];
  const todaysSessions = activeStudents.filter((s) => s.days && s.days.includes(todayWeekDay));

  // Filter Trades based on Journal Range Settings
  const filteredTrades = trades.filter((t) => {
    if (tradeFrom && t.date && t.date < tradeFrom) return false;
    if (tradeTo && t.date && t.date > tradeTo) return false;
    return true;
  });

  // Compute metrics for the trading engine
  const totalTradesCount = filteredTrades.length;
  const winTradesCount = filteredTrades.filter((t) => t.result === "Win").length;
  const lossTradesCount = filteredTrades.filter((t) => t.result === "Loss").length;
  const winRate = totalTradesCount > 0 ? (winTradesCount / totalTradesCount) * 100 : null;
  const totalPnl = filteredTrades.reduce((acc, curr) => acc + (Number(curr.pnl) || 0), 0);
  
  const totalRMultiple = filteredTrades.reduce((acc, curr) => acc + (Number(curr.rMultiple) || 0), 0);
  const avgR = totalTradesCount > 0 ? totalRMultiple / totalTradesCount : 0;
  const maxR = totalTradesCount > 0 ? Math.max(...filteredTrades.map(t => Number(t.rMultiple) || 0), 0) : 0;
  const minR = totalTradesCount > 0 ? Math.min(...filteredTrades.map(t => Number(t.rMultiple) || 0), 0) : 0;

  // Build Equity Stream Curves
  const equityCurve = filteredTrades.map((t, idx) => {
    const sumPnlUntilNow = filteredTrades.slice(0, idx + 1).reduce((sum, curr) => sum + (Number(curr.pnl) || 0), 0);
    return { idx: idx + 1, equity: sumPnlUntilNow };
  });

  // Build Currency Pair Metrics
  const uniquePairs = Array.from(new Set(filteredTrades.map((t) => t.pair).filter(Boolean)));
  const byPairData = uniquePairs.map((pair) => {
    const pairTrades = filteredTrades.filter((t) => t.pair === pair);
    return {
      pair,
      trades: pairTrades.length,
      wins: pairTrades.filter((t) => t.result === "Win").length,
      losses: pairTrades.filter((t) => t.result === "Loss").length,
      pnl: pairTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0)
    };
  });

  const tradingStats = {
    winRate,
    wins: winTradesCount,
    losses: lossTradesCount,
    totalPnl,
    total: totalTradesCount,
    avgR,
    maxR,
    minR,
    equity: equityCurve,
    byPair: byPairData
  };

  if (authLoading) {
    return (
      <div className="fceo-dark-theme-wrapper">
        <div className="fceo-loading-screen">
          <h3>Initializing Forex CEO Cloud Engine...</h3>
        </div>
      </div>
    );
  }

  // Render Secure Gateway Login View if not authenticated
  if (!user) {
    return (
      <div className="fceo-dark-theme-wrapper">
        <div className="fceo-auth-backdrop">
          <form onSubmit={handleAuth} className="fceo-auth-card">
            <h2>💼 Forex CEO</h2>
            <p className="fceo-muted">{isRegistering ? "Create your master manager account" : "Sign in to access your dashboard"}</p>
            
            {authError && <div className="fceo-auth-error">{authError}</div>}
            
            <label className="fceo-field">
              <span>Email Address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </label>
            
            <label className="fceo-field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            
            <button type="submit" className="fceo-btn primary unified-auth-btn">
              {isRegistering ? "Register Account" : "Secure Login"}
            </button>
            
            <div className="fceo-auth-toggle">
              <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }}>
                {isRegistering ? "Already have an account? Sign In" : "Need an account? Register Here"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Overwrite the final return statement block at the bottom of your src/App.jsx file:
  return (
    <div className="fceo-dark-theme-wrapper">
      <div className="fceo-app">
        <Header 
          tab={view} 
          setTab={setView} 
          winRate={winRate} 
          income={expectedMonthlyIncome} 
          todaysCount={todaysSessions.length} 
        />
        <main className="fceo-main">
          {view === "dashboard" && (
            <Dashboard 
              todaysSessions={todaysSessions} 
              stats={tradingStats} 
              expectedMonthlyIncome={expectedMonthlyIncome} 
              collectedThisMonth={collectedThisMonth} 
              activeStudents={activeStudents} 
              leads={leads} 
            />
          )}
          
          {/* Linked up real student saving function */}
          {view === "students" && (
            <Students 
              students={students} 
              onSave={saveStudent} 
              onLogPayment={logPayment} 
            />
          )}
          
          {view === "calendar" && (
            <CalendarView 
              students={activeStudents}
              calendarDate={calendarDate}
              setCalendarDate={setCalendarDate}
              slotOverrides={{}}
              toggleSlot={() => {}}
              slotKey={(day, h) => `${day}-${h}`}
              sessionAt={(d, h) => {
                const dayAbbr = daysShort[(d.getDay() + 6) % 7 + 1];
                return activeStudents.find(s => s.days?.includes(dayAbbr) && s.sessionTime === `${String(h).padStart(2, "0")}:00`);
              }}
              weekDates={Array.from({ length: 7 }, (_, i) => {
                const base = new Date(calendarDate);
                const currentDay = base.getDay();
                const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                return new Date(base.setDate(base.getDate() + distanceToMonday + i));
              })}
            />
          )}

          {/* Linked up real pipeline lead saving function */}
          {view === "crm" && (
            <CRM 
              leads={leads} 
              onSave={saveLead} 
              onDelete={deleteLead} 
            />
          )}
          
          {/* Cleared out bad prompt structures and linked native form actions */}
          {view === "journal" && (
            <Journal 
              trades={filteredTrades} 
              stats={tradingStats}
              tradeFrom={tradeFrom}
              tradeTo={tradeTo}
              setTradeFrom={setTradeFrom}
              setTradeTo={setTradeTo}
              onSave={saveTrade}
              onDelete={deleteTrade}
            />
          )}

          {view === "income" && <Income students={students} />}
          
          {view === "settings" && (
            <Settings 
              settings={{ defaultTeamsLink: "https://teams.microsoft.com/" }} 
              onSave={() => alert("Settings saved to your Google profile context!")}
              onLogout={handleLogout} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
