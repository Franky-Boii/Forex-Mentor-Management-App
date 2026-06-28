import React from 'react';
import { STAGES } from '../utils/helpers';
import { Icon } from './Modals';
import { Empty } from './Dashboard';

export default function CRM({ leads, onAdd, onEdit, onMove, onDelete }) {
  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div><h2>Mentorship Sales Pipeline (CRM)</h2><p className="fceo-muted">Track interested prospects, active follow-ups, and hot lead conversions.</p></div>
        <button className="fceo-btn primary" onClick={onAdd}><Icon name="plus" /><Icon name="plus2" /> New Lead</button>
      </div>
      <div className="fceo-pipeline">
        {STAGES.map(([key, label]) => {
          const items = leads.filter((l) => l.stage === key);
          return (
            <div className="fceo-pipe-col" key={key}>
              <div className="fceo-pipe-head">{label} ({items.length})</div>
              {items.length === 0 ? <Empty text={key === "prospect" ? "No prospects logged" : key === "followup" ? "No active follow-ups" : "No hot leads ready"} /> : (
                <div className="fceo-pipe-list">
                  {items.map((l) => (
                    <div className="fceo-pipe-card" key={l.id}>
                      <div className="strong">{l.name}</div>
                      <div className="fceo-muted small">{l.contact}</div>
                      {l.notes && <div className="small">{l.notes}</div>}
                      <div className="fceo-pipe-actions">
                        {key !== "prospect" && <button onClick={() => onMove(l.id, STAGES[STAGES.findIndex((s) => s[0] === key) - 1][0])}><Icon name="chevL" /></button>}
                        {key !== "hot" && <button onClick={() => onMove(l.id, STAGES[STAGES.findIndex((s) => s[0] === key) + 1][0])}><Icon name="chevR" /></button>}
                        <button onClick={() => onEdit(l)}><Icon name="edit" /></button>
                        <button onClick={() => onDelete(l.id)}><Icon name="trash" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}