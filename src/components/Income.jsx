import React from 'react';
import { fmtZAR, monthKey } from '../utils/helpers';
import { Field } from './Modals';

export default function Income({ students, incomeMonth, setIncomeMonth, expectedMonthlyIncome, collectedThisMonth, onLogPayment }) {
  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div><h2>Income</h2><p className="fceo-muted">Calculated from logged student payments.</p></div>
        <Field label="Month"><input type="month" value={incomeMonth} onChange={(e) => setIncomeMonth(e.target.value)} /></Field>
      </div>
      <div className="fceo-grid">
        <div className="fceo-card"><h3>Expected monthly income</h3><div className="fceo-big up">{fmtZAR(expectedMonthlyIncome)}</div><div className="fceo-muted small">Sum of active students' monthly fees</div></div>
        <div className="fceo-card"><h3>Collected — {incomeMonth}</h3><div className="fceo-big">{fmtZAR(collectedThisMonth)}</div><div className="fceo-muted small">Sum of payments logged in this month</div></div>
        <div className="fceo-card"><h3>Outstanding</h3><div className="fceo-big down">{fmtZAR(Math.max(expectedMonthlyIncome - collectedThisMonth, 0))}</div></div>
      </div>
      <div className="fceo-table-wrap">
        <table className="fceo-table">
          <thead><tr><th>Student</th><th>Monthly fee</th><th>Paid this month</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {students.map((s) => {
              const paid = (s.payments || []).filter((p) => monthKey(p.date) === incomeMonth).reduce((a, p) => a + Number(p.amount), 0);
              const settled = paid >= (Number(s.monthlyFee) || 0) && s.monthlyFee > 0;
              return (
                <tr key={s.id}>
                  <td className="strong">{s.fullName}</td>
                  <td className="mono">{fmtZAR(s.monthlyFee)}</td>
                  <td className="mono">{fmtZAR(paid)}</td>
                  <td><span className={"fceo-tag " + (settled ? "on" : "off")}>{settled ? "Settled" : "Due"}</span></td>
                  <td><button className="fceo-btn small" onClick={() => onLogPayment(s.id)}>Log payment</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}