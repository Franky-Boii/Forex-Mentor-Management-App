import React, { useState } from 'react';

export default function CRM({ leads = [], onSave, onDelete }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState("prospect");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onSave) return;

    onSave({
      name: name.trim(),
      notes: notes.trim(),
      stage
    });

    // Clean reset parameters
    setName("");
    setNotes("");
    setStage("prospect");
    setShowAddForm(false);
  };

  const handleStageShift = (lead, nextStage) => {
    if (!onSave) return;
    onSave({ ...lead, stage: nextStage });
  };

  const stages = [
    { key: "prospect", label: "Prospects (New Leads)" },
    { key: "followup", label: "Follow-Ups Active" },
    { key: "hot", label: "Hot / Ready to Close" }
  ];

  return (
    <div className="fceo-section">
      <div className="fceo-section-head">
        <div>
          <h2>Mentorship Sales Pipeline (CRM)</h2>
          <p className="fceo-muted">Track interested prospects, active follow-ups, and hot lead conversions.</p>
        </div>
        <button type="button" className="fceo-btn primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Close Form" : "＋ New Lead"}
        </button>
      </div>

      {/* Embedded Lead Form Panel */}
      {showAddForm && (
        <div className="fceo-card" style={{ marginBottom: '24px', animation: 'fadeIn 0.2s ease-in-out' }}>
          <h3>📋 Add Pipeline Prospect Entry</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', alignItems: 'end' }}>
            <label className="fceo-field">
              <span>Prospect Full Name</span>
              <input type="text" placeholder="e.g. Michael Smith" value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className="fceo-field">
              <span>Operational Notes / Context</span>
              <input type="text" placeholder="e.g. Inquired via Instagram about Gold Mentorship" value={notes} onChange={e => setNotes(e.target.value)} />
            </label>
            <label className="fceo-field">
              <span>Initial Pipeline Column Stage</span>
              <select value={stage} onChange={e => setStage(e.target.value)}>
                <option value="prospect">Prospect Column</option>
                <option value="followup">Follow-Up Action Needed</option>
                <option value="hot">Hot Deal Ready</option>
              </select>
            </label>
            <button type="submit" className="fceo-btn primary" style={{ height: '44px' }}>Save Lead</button>
          </form>
        </div>
      )}

      {/* Modern Horizontal CRM Kanban Grid Columns */}
      <div className="fceo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {stages.map(col => {
          const colLeads = (leads || []).filter(l => l.stage === col.key);
          return (
            <div key={col.key} className="fceo-card" style={{ background: '#161b22', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{col.label}</h3>
                <span className="fceo-pill muted" style={{ marginLeft: 'auto' }}>{colLeads.length}</span>
              </div>

              {colLeads.length === 0 ? (
                <p className="fceo-muted" style={{ fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>No prospects logged inside this tracking stage.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colLeads.map(l => (
                    <div key={l.id} style={{ background: '#0d1117', border: '1px solid #30363d', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <b style={{ color: '#fff', fontSize: '15px' }}>{l.name}</b>
                        <button type="button" onClick={() => onDelete && onDelete(l.id)} style={{ background: 'none', border: 'none', color: '#ff7b72', cursor: 'pointer', fontSize: '12px' }}>Wipe</button>
                      </div>
                      <p className="fceo-muted" style={{ fontSize: '13px', margin: '6px 0 12px 0', lineHeight: '1.4' }}>{l.notes || 'No contextual notes logged yet.'}</p>
                      
                      {/* Workflow column navigation controllers */}
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {col.key !== 'prospect' && (
                          <button type="button" className="fceo-pill muted" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => handleStageShift(l, col.key === 'hot' ? 'followup' : 'prospect')}>◀ Move Back</button>
                        )}
                        {col.key !== 'hot' && (
                          <button type="button" className="fceo-pill on" style={{ fontSize: '11px', cursor: 'pointer' }} onClick={() => handleStageShift(l, col.key === 'prospect' ? 'followup' : 'hot')}>Advance ▶</button>
                        )}
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