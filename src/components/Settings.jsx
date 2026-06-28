import React, { useState } from 'react';
import { Field } from './Modals';

export default function Settings({ settings = {}, onSave, onLogout }) {
  const [form, setForm] = useState({
    defaultTeamsLink: settings?.defaultTeamsLink || ""
  });

  return (
    <div className="fceo-section">
      <h2>Settings</h2>
      <div className="fceo-card" style={{ maxWidth: 480 }}>
        <Field label="Default Teams meeting">
          <input 
            value={form.defaultTeamsLink} 
            onChange={(e) => setForm({ ...form, defaultTeamsLink: e.target.value })} 
            placeholder="https://teams.microsoft.com/..." 
          />
        </Field>
        <button type="button" className="fceo-btn primary" onClick={() => onSave && onSave(form)}>Save settings</button>
      </div>
      
      <div className="fceo-card" style={{ maxWidth: 480, marginTop: '16px' }}>
        <h3>Cloud Integration Session Controls</h3>
        <p className="fceo-muted small" style={{ marginBottom: '16px' }}>
          Click below to securely disconnect.
        </p>
        {onLogout && (
          <button type="button" className="fceo-btn secondary text-danger" onClick={onLogout}>
            Logout Secure Session
          </button>
        )}
      </div>
    </div>
  );
}