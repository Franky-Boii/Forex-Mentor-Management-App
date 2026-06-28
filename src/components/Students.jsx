import React from 'react';
import { fmtZAR } from '../utils/helpers';
import { Icon } from './Modals';
import { Empty } from './Dashboard';

export default function Students({ students, onAdd, onEdit, onDelete, onLogPayment }) {
  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div>
          <h2>Students</h2>
          <p className="fceo-muted">Full roster, schedules, fees and payment history.</p>
        </div>
        <button className="fceo-btn primary" onClick={onAdd}><Icon name="plus" /><Icon name="plus2" /> Add Student</button>
      </div>

      {students.length === 0 ? (
        <Empty text="No students added yet. Click “Add Student” to build your roster." />
      ) : (
        <div className="fceo-table-wrap">
          <table className="fceo-table">
            <thead>
              <tr>
                <th>Name</th><th>ID Number</th><th>Start Date</th><th>Days</th><th>Time</th><th>Monthly Fee</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className={s.active === false ? "inactive" : ""}>
                  <td className="strong">{s.fullName}</td>
                  <td className="mono">{s.idNumber || "—"}</td>
                  <td className="mono">{s.startDate || "—"}</td>
                  <td>{(s.days || []).join(", ") || "—"}</td>
                  <td className="mono">{s.sessionTime || "—"}</td>
                  <td className="mono">{fmtZAR(s.monthlyFee)}</td>
                  <td><span className={"fceo-tag " + (s.active === false ? "off" : "on")}>{s.active === false ? "Inactive" : "Active"}</span></td>
                  <td className="fceo-actions">
                    {s.teamsLink && <a href={s.teamsLink} target="_blank" rel="noreferrer" title="Open Teams link"><Icon name="teams" /></a>}
                    <button title="Log payment" onClick={() => onLogPayment(s.id)}>R+</button>
                    <button title="Edit" onClick={() => onEdit(s)}><Icon name="edit" /></button>
                    <button title="Delete" onClick={() => onDelete(s.id)}><Icon name="trash" /></button>
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