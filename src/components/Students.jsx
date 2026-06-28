import React, { useState } from 'react';
import { fmtZAR } from '../utils/helpers';

export default function Students({ students = [], onSave, onLogPayment }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamsLink, setTeamsLink] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [sessionTime, setSessionTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState([]);

  // Payment Tracking States
  const [activeStudentId, setActiveStudentId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewHistoryId, setViewHistoryId] = useState("");

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSave) return;

    onSave({
      fullName: fullName.trim(),
      email: email.trim(),
      idNumber: idNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      teamsLink: teamsLink.trim(),
      monthlyFee: Number(monthlyFee) || 0,
      sessionTime,
      days: selectedDays,
      active: true,
      enrollmentDate: new Date().toISOString().slice(0, 10),
      payments: []
    });

    // Reset Fields
    setFullName("");
    setEmail("");
    setIdNumber("");
    setPhoneNumber("");
    setTeamsLink("");
    setMonthlyFee("");
    setSelectedDays([]);
    setShowAddForm(false);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!onLogPayment || !activeStudentId) return;

    onLogPayment(activeStudentId, Number(paymentAmount), paymentDate);
    setPaymentAmount("");
    setActiveStudentId("");
  };

  // Helper to calculate next upcoming payment date (1 month after the last payment or enrollment)
  const getNextPaymentDate = (student) => {
    if (!student.payments || student.payments.length === 0) {
      if (!student.enrollmentDate) return "—";
      const enroll = new Date(student.enrollmentDate);
      enroll.setMonth(enroll.getMonth() + 1);
      return enroll.toISOString().slice(0, 10);
    }
    // Sort to find latest payment date
    const sortedPayments = [...student.payments].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = new Date(sortedPayments[0].date);
    latest.setMonth(latest.getMonth() + 1);
    return latest.toISOString().slice(0, 10);
  };

  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div>
          <h2>Mentorship Roster Management</h2>
          <p className="fceo-muted">Provision student accounts, map corporate metadata, and audit historical tuition collections.</p>
        </div>
        <button type="button" className="fceo-btn primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Close Form" : "＋ Add New Student"}
        </button>
      </div>

      {/* Expanded Student Onboarding Form Grid */}
      {showAddForm && (
        <div className="fceo-card" style={{ marginBottom: '24px', animation: 'fadeIn 0.2s ease-in-out' }}>
          <h3>👤 Provision Full Student Identity Account</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <label className="fceo-field">
                <span>Full Name</span>
                <input type="text" placeholder="Frank Mulongoyi" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </label>
              <label className="fceo-field">
                <span>Email Address</span>
                <input type="email" placeholder="student@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </label>
              <label className="fceo-field">
                <span>ID Number / Passport</span>
                <input type="text" placeholder="Identity Registration Number" value={idNumber} onChange={e => setIdNumber(e.target.value)} required />
              </label>
              <label className="fceo-field">
                <span>Phone Number</span>
                <input type="tel" placeholder="+27..." value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
              <label className="fceo-field">
                <span>Dedicated Teams Meeting Link</span>
                <input type="url" placeholder="https://teams.microsoft.com/l/meetup-join/..." value={teamsLink} onChange={e => setTeamsLink(e.target.value)} />
              </label>
              <label className="fceo-field">
                <span>Monthly Fee Tier (ZAR)</span>
                <input type="number" placeholder="3500" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} required />
              </label>
              <label className="fceo-field">
                <span>Fixed Slot Time</span>
                <input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)} required />
              </label>
            </div>

            <div className="fceo-field">
              <span>Weekly Scheduled Mentorship Days</span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`fceo-pill ${selectedDays.includes(day) ? 'on' : 'muted'}`}
                    onClick={() => handleDayToggle(day)}
                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="fceo-btn primary" style={{ alignSelf: 'start', padding: '12px 24px' }}>
              Save Student Profile
            </button>
          </form>
        </div>
      )}

      {/* Record Payment Sub-Panel Form */}
      {activeStudentId && (
        <div className="fceo-card" style={{ marginBottom: '24px', border: '1px solid #00e5a0' }}>
          <h3>💰 Log Tuition Receipt for {(students.find(s => s.id === activeStudentId))?.fullName}</h3>
          <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'end' }}>
            <label className="fceo-field" style={{ maxWidth: '200px' }}>
              <span>ZAR Amount Collected</span>
              <input type="number" placeholder="e.g. 1500" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
            </label>
            <label className="fceo-field" style={{ maxWidth: '200px' }}>
              <span>Collection Date</span>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
            </label>
            <button type="submit" className="fceo-btn primary">Log Payment</button>
            <button type="button" className="fceo-btn secondary" onClick={() => setActiveStudentId("")}>Cancel</button>
          </form>
        </div>
      )}

      {/* Audit Statement Modal/Card */}
      {viewHistoryId && (
        <div className="fceo-card" style={{ marginBottom: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3>Statement Audit Ledger: {(students.find(s => s.id === viewHistoryId))?.fullName}</h3>
            <button type="button" className="fceo-pill muted" onClick={() => setViewHistoryId("")}>Close Statement</button>
          </div>
          <div className="fceo-table-wrap">
            <table className="fceo-table">
              <thead>
                <tr>
                  <th>Transaction ID Reference</th>
                  <th>Payment Clearing Date</th>
                  <th>Amount Received</th>
                </tr>
              </thead>
              <tbody>
                {((students.find(s => s.id === viewHistoryId))?.payments || []).length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--muted)' }}>No historical payment records found for this student.</td></tr>
                ) : (
                  (students.find(s => s.id === viewHistoryId)).payments.map(p => (
                    <tr key={p.id}>
                      <td className="mono" style={{ fontSize: '12px' }}>{p.id}</td>
                      <td className="mono">{p.date}</td>
                      <td className="text-success mono">{fmtZAR(p.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roster Data Table */}
      {(students || []).length === 0 ? (
        <div className="fceo-card">
          <p className="fceo-muted">No students registered yet. Click the "Add New Student" button above to provision your first profile.</p>
        </div>
      ) : (
        <div className="fceo-table-wrap">
          <table className="fceo-table">
            <thead>
              <tr>
                <th>Student Contact Profile</th>
                <th>Identity Data Metrics</th>
                <th>Weekly Target Slots</th>
                <th>Financial Metrics Tracking</th>
                <th>Operations Console</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div><b>{s.fullName}</b></div>
                    <div className="fceo-muted small" style={{ margin: '3px 0' }}>{s.email || '—'}</div>
                    <div className="fceo-muted small">{s.phoneNumber || '—'}</div>
                  </td>
                  <td className="mono" style={{ fontSize: '13px' }}>
                    <div>ID: {s.idNumber || '—'}</div>
                    {s.teamsLink ? (
                      <a href={s.teamsLink} target="_blank" rel="noreferrer" className="text-success" style={{ fontSize: '11px', textDecoration: 'underline', display: 'block', marginTop: '4px' }}>
                        🔗 Teams Meeting Room
                      </a>
                    ) : <span className="fceo-muted small" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>No link configured</span>}
                  </td>
                  <td>
                    <span className="mono">{(s.days || []).join(', ') || 'Unscheduled'}</span>
                    <div className="fceo-muted small" style={{ marginTop: '2px' }}>@ {s.sessionTime || '—'}</div>
                  </td>
                  <td>
                    <div>Tier: <span className="mono">{fmtZAR(s.monthlyFee)}</span></div>
                    <div className="small" style={{ marginTop: '3px', color: '#00e5a0' }}>
                      Next Due: <span className="mono">{getNextPaymentDate(s)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="fceo-pill on" onClick={() => setActiveStudentId(s.id)}>
                        ➕ Collect
                      </button>
                      <button type="button" className="fceo-pill muted" onClick={() => setViewHistoryId(s.id)}>
                        📋 History ({s.payments?.length || 0})
                      </button>
                    </div>
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