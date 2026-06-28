import React, { useState } from 'react';
import { Field } from './Modals';

export default function Settings({ settings, onSave }) {
  const [form, setForm] = useState(settings);
  return (
    <div className="fceo-section">
      <h2>Settings</h2>
      <div className="fceo-card" style={{ maxWidth: 480 }}>
        <Field label="Default Teams meeting link (used to pre-fill new students)">
          <input value={form.defaultTeamsLink} onChange={(e) => setForm({ ...form, defaultTeamsLink: e.target.value })} placeholder="https://teams.microsoft.com/..." />
        </Field>
        <button className="fceo-btn primary" onClick={() => onSave(form)}>Save settings</button>
      </div>
      <div className="fceo-card" style={{ maxWidth: 480 }}>
        <h3>About this build</h3>
        <p className="fceo-muted small">
          Data here is saved locally. Connecting a production database server infrastructure, real-time sync engines, and customer portal APIs represent the upcoming architectural scaling phase.
        </p>
      </div>
    </div>
  );
}