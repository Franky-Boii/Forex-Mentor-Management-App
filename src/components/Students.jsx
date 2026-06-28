import React, { useState } from 'react';
import { fmtZAR } from '../utils/helpers';

export default function Students({ students = [], onSave, onLogPayment }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  // Core Form Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamsLink, setTeamsLink] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [sessionTime, setSessionTime] = useState("12:00");
  const [selectedDays, setSelectedDays] = useState([]);

  // Payment Logging States
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

  // Populate form fields to modify an existing profile record
  const startEdit = (student) => {
    setEditingStudentId(student.id);
    setFullName(student.fullName || "");
    setEmail(student.email || "");
    setIdNumber(student.idNumber || "");
    setPhoneNumber(student.phoneNumber || "");
    setTeamsLink(student.teamsLink || "");
    setMonthlyFee(student.monthlyFee || "");
    setSessionTime(student.sessionTime || "12:00");
    setSelectedDays(student.days || []);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setEditingStudentId(null);
    setFullName("");
    setEmail("");
    setIdNumber("");
    setPhoneNumber("");
    setTeamsLink("");
    setMonthlyFee("");
    setSelectedDays([]);
    setShowAddForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSave) return;

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      idNumber: idNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      teamsLink: teamsLink.trim(),
      monthlyFee: Number(monthlyFee) || 0,
      sessionTime,
      days: selectedDays,
      active: true,
    };

    if (editingStudentId) {
      // Keep existing properties intact on update
      const existing = students.find(s => s.id === editingStudentId);
      onSave({ 
        ...existing,
        ...payload,
        id: editingStudentId 
      });
    } else {
      onSave({
        ...payload,
        enrollmentDate: new Date().toISOString().slice(0, 10),
        payments: []
      });
    }

    handleCancelForm();
  };

  const handleDelete = (studentId, name) => {
    if (window.confirm(`Are you absolutely sure you want to completely delete ${name}? This action cannot be undone.`)) {
      // In our current code convention, we toggle 'active: false' or call a delete mutation handler
      // We'll update the active flag to clear it off the main view row natively
      onSave({ id: studentId, active: false });
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!onLogPayment || !activeStudentId) return;

    onLogPayment(activeStudentId, Number(paymentAmount), paymentDate);
    setPaymentAmount("");
    setActiveStudentId("");
  };

  const getNextPaymentDate = (student) => {
    if (!student.payments || student.payments.length === 0) {
      if (!student.enrollmentDate) return "—";
      const enroll = new Date(student.enrollmentDate);
      enroll.setMonth(enroll.getMonth() + 1);
      return enroll.toISOString().slice(0, 10);
    }
    const sortedPayments = [...student.payments].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = new Date(sortedPayments[0].date);
    latest.setMonth(latest.getMonth() + 1);
    return latest.toISOString().slice(0, 10);
  };

  const activeRoster = students.filter(s => s.active !== false);

  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div>
          <h2>Mentorship Roster Management</h2>
          <p className="fceo-muted">Provision student accounts, map corporate metadata, and audit historical tuition collections.</p>
        </div>
        {!showAddForm && (
          <button type="button" className="fceo-btn primary" onClick={() => setShowAddForm(true)}>
            ＋ Add New Student
          </button>
        )}
      </div>

      {/* Embedded Input Form for Adding or Editing profiles */}
      {showAddForm && (
        <div className="fceo-card" style={{ marginBottom: '24px', animation: 'fadeIn 0.2s ease-in-out', border: editingStudentId ? '1px solid #58a6ff' : '1px solid #30363d' }}>
          <h3>{editingStudentId ? `✏️ Modify Details: ${fullName}` : "👤 Provision Full Student Identity Account"}</h3>
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
                <input type="number" placeholder="2000" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} required />
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="fceo-btn primary" style={{ padding: '12px 24px' }}>
                {editingStudentId ? "Commit Changes" : "Save Secure Account to Cloud"}
              </button>
              <button type="button" className="fceo-btn secondary" onClick={handleCancelForm} style={{ padding: '12px 24px' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Flexible Payment Panel — Works for logging current collections OR backdating past historical payments */}
      {activeStudentId && (
        <div className="fceo-card" style={{ marginBottom: '24px', border: '1px solid #00e5a0' }}>
          <h3> Log Tuition Receipt (Current or Past Backdated History)</h3>
          <p className="fceo-muted" style={{ fontSize: '13px', marginTop: '-8px' }}>
          </p>
          <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
            <label className="fceo-field" style={{ maxWidth: '200px' }}>
              <span>ZAR Amount Collected</span>
              <input type="number" placeholder="e.g. 2000" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
            </label>
            <label className="fceo-field" style={{ maxWidth: '200px' }}>
              <span>Payment Clearing Date</span>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
            </label>
            <button type="submit" className="fceo-btn primary" style={{ height: '44px' }}>Record Entry</button>
            <button type="button" className="fceo-btn secondary" onClick={() => setActiveStudentId("")} style={{ height: '44px' }}>Cancel</button>
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
                  [...(students.find(s => s.id === viewHistoryId)).payments]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(p => (
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

      {/* Active Roster Data Table Grid */}
      {activeRoster.length === 0 ? (
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
              {activeRoster.map(s => (
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
                    <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="fceo-pill on" onClick={() => { setPaymentDate(new Date().toISOString().slice(0, 10)); setActiveStudentId(s.id); }}>
                          ➕ Collect / Log Past
                        </button>
                        <button type="button" className="fceo-pill muted" onClick={() => setViewHistoryId(s.id)}>
                           History ({s.payments?.length || 0})
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="fceo-pill muted" style={{ color: '#58a6ff', borderColor: '#30363d' }} onClick={() => startEdit(s)}>
                          Edit Profile
                        </button>
                        <button type="button" className="fceo-pill muted" style={{ color: '#ff7b72', borderColor: '#30363d' }} onClick={() => handleDelete(s.id, s.fullName)}>
                           Delete
                        </button>
                      </div>
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