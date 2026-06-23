/* =================== HELPERS & CALCULATORS =================== */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function fmtMoney(n){
  n = Number(n)||0;
  const neg = n<0; n=Math.abs(n);
  const s = n.toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2});
  return (neg?'-':'')+'R '+s;
}

function fmtDate(d){
  if(!d) return '—';
  const dt = new Date(d+'T00:00:00');
  if(isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-ZA', {day:'2-digit', month:'short', year:'numeric'});
}

function fmtDateShort(d){
  const dt = new Date(d+'T00:00:00');
  if(isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-ZA', {day:'2-digit', month:'short'});
}

function todayStr(){ return new Date().toISOString().slice(0,10); }

function monthsBetween(a,b){
  const d1=new Date(a+'T00:00:00'), d2=new Date(b+'T00:00:00');
  return (d2.getFullYear()-d1.getFullYear())*12 + (d2.getMonth()-d1.getMonth()) - (d2.getDate()<d1.getDate()?1:0);
}

function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function parseNum(v){
  if(v===null||v===undefined) return NaN;
  let s = v.toString().trim();
  if(s==='') return NaN;
  s = s.replace(/[^0-9.,-]/g, '');
  if(s==='') return NaN;
  const hasComma = s.includes(','), hasDot = s.includes('.');
  if(hasComma && hasDot){
    if(s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g,'').replace(',', '.');
    else s = s.replace(/,/g,'');
  } else if(hasComma){
    const parts = s.split(',');
    s = (parts.length===2 && parts[1].length<=2) ? s.replace(',', '.') : s.replace(/,/g,'');
  }
  return parseFloat(s);
}

function flagFieldError(el, msg){
  if(el){
    el.style.borderColor = 'var(--red)';
    el.scrollIntoView({behavior:'smooth', block:'center'});
    el.focus();
    const reset = ()=>{ el.style.borderColor=''; el.removeEventListener('input', reset); };
    el.addEventListener('input', reset);
  }
  showToast(msg, true);
}

function showToast(msg, isError){
  const host = document.getElementById('toastHost');
  if(!host) return;
  const t = document.createElement('div');
  t.className='toast';
  t.style.borderColor = isError ? 'var(--red-dim)' : 'var(--border)';
  t.innerHTML = (isError? '⚠ ' : '✓ ') + escapeHtml(msg);
  host.appendChild(t);
  setTimeout(()=>t.remove(), 2600);
}

function closeModal(){ document.getElementById('overlay').classList.remove('open'); document.getElementById('modalBody').innerHTML=''; }
function openModal(html){ document.getElementById('modalBody').innerHTML = html; document.getElementById('overlay').classList.add('open'); }

function studentMonthStatus(student, monthDate){
  const start = new Date(student.startDate+'T00:00:00');
  if(monthDate < new Date(start.getFullYear(), start.getMonth(), 1)) return null;
  const expectedDue = new Date(monthDate.getFullYear(), monthDate.getMonth(), start.getDate());
  const paidThisMonth = (student.payments||[]).filter(p=>{
    const pd = new Date(p.date+'T00:00:00');
    return pd.getFullYear()===monthDate.getFullYear() && pd.getMonth()===monthDate.getMonth();
  });
  const paidAmount = paidThisMonth.reduce((s,p)=>s+Number(p.amount||0),0);
  const today = new Date();
  let status = 'upcoming';
  if(paidAmount >= Number(student.fee||0) && Number(student.fee||0)>0) status = 'paid';
  else if(expectedDue < new Date(today.getFullYear(), today.getMonth(), today.getDate())) status = 'overdue';
  else status = 'upcoming';
  return {status, paidAmount, due: expectedDue.toISOString().slice(0,10)};
}

function todaysSessions(){
  const dow = new Date().getDay();
  const dowIdx = dow===0?6:dow-1;
  const list = state.students.filter(s=>s.status==='active' && s.sessionDay===DAYS[dowIdx] && s.sessionTime)
    .map(s=>({name:s.fullName, time:s.sessionTime}));
  const t = todayStr();
  state.events.filter(ev=>ev.date===t).forEach(ev=>list.push({name:ev.title, time:ev.time||'--:--'}));
  return list.sort((a,b)=> (a.time||'').localeCompare(b.time||''));
}

function renderTicker(){
  const el = document.getElementById('ticker');
  if(!el) return;
  const sessions = todaysSessions();
  if(sessions.length===0){
    el.innerHTML = `<span class="ticker-item empty">No sessions scheduled today</span>`;
    return;
  }
  const items = sessions.map(s=>`<span class="ticker-item"><span class="dot"></span>${s.time} — ${escapeHtml(s.name)}</span>`);
  el.innerHTML = items.concat(items).concat(items).join('');
}

/* MODULE COMPLETION COMPONENT LOGIC */
function toggleModule(studentId, moduleKey) {
  const s = state.students.find(x => x.id === studentId);
  if(!s) return;
  s[moduleKey] = !s[moduleKey];

  let score = 0;
  if (s.mod1) score += 20;
  if (s.mod2) score += 20;
  if (s.mod3) score += 20;
  if (s.mod4) score += 20;
  if (s.mod5) score += 20;

  s.progress = score;
  saveState();
  openStudentDetail(s.id);
}

/* =================== 1. DASHBOARD COMPONENT =================== */
function renderDashboard(){
  const activeStudents = state.students.filter(s=>s.status==='active');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let expected = 0, received = 0, overdueCount = 0, overdueNames = [];
  activeStudents.forEach(s => {
    const st = studentMonthStatus(s, monthStart);
    if(st){
      expected += Number(s.fee||0);
      received += st.paidAmount;
      if(st.status==='overdue') {
        overdueCount++;
        overdueNames.push(s.fullName);
      }
    }
  });

  const trades = state.trades;
  const totalPnl = trades.reduce((s,t)=>s+Number(t.pnl||0),0);
  const wins = trades.filter(t=>t.outcome === 'win' || (!t.outcome && Number(t.pnl)>0)).length;
  const losses = trades.filter(t=>t.outcome === 'loss' || (!t.outcome && Number(t.pnl)<0)).length;
  const decided = wins+losses;
  const winRate = decided ? (wins/decided*100) : 0;

  const sessions = todaysSessions();
  const recentTrades = [...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  return `
    <div class="page-head">
      <div><h1>Dashboard</h1><p>${now.toLocaleDateString('en-ZA',{weekday:'long', day:'numeric', month:'long'})}</p></div>
    </div>

    ${overdueCount ? `
    <div class="alert-banner">
      <span>⏰</span>
      <div><b>${overdueCount} student${overdueCount>1?'s':''} overdue</b> this month — ${overdueNames.map(escapeHtml).join(', ')}.</div>
    </div>` : ''}

    <div class="grid grid-4">
      <div class="card stat-card">
        <div class="label">Active Students</div>
        <div class="value">${activeStudents.length}</div>
        <div class="sub">${state.students.filter(s=>s.status!=='active').length} inactive/paused</div>
      </div>
      <div class="card stat-card">
        <div class="label">Income This Month</div>
        <div class="value">${fmtMoney(received)}</div>
        <div class="sub ${received>=expected?'up':'neutral'}">of ${fmtMoney(expected)} expected</div>
      </div>
      <div class="card stat-card">
        <div class="label">Overdue Students</div>
        <div class="value ${overdueCount>0?'down':''}">${overdueCount}</div>
        <div class="sub">Outstanding: ${fmtMoney(Math.max(0, expected - received))}</div>
      </div>
      <div class="card stat-card">
        <div class="label">Total P&amp;L (Journal)</div>
        <div class="value ${totalPnl>=0?'up':'down'}">${fmtMoney(totalPnl)}</div>
        <div class="sub">${decided? winRate.toFixed(1):'—'}% Win Rate (${trades.length}T)</div>
      </div>
    </div>

    <div class="section-title">Today's Sessions</div>
    <div class="card">
      ${sessions.length===0 ? `<div class="empty-state"><div class="et">Nothing on the books today</div><div class="ed">Add a student session, or a one-off in Schedule.</div></div>` :
        `<table><tbody>
          ${sessions.map(s=>`<tr><td class="mono-cell" style="width:90px;color:var(--amber)">${s.time}</td><td>${escapeHtml(s.name)}</td></tr>`).join('')}
        </tbody></table>`}
    </div>

    <div class="grid grid-2" style="margin-top:30px">
      <div>
        <div class="section-title">Recent Trades</div>
        <div class="card">
          ${recentTrades.length===0? `<div class="empty-state"><div class="et">No trades logged yet</div><div class="ed">Head to Journal to add your first one.</div></div>` :
          `<table><tbody>
            ${recentTrades.map(t=> {
              const displayColor = t.outcome === 'win' || (!t.outcome && Number(t.pnl) >= 0) ? 'var(--green)' : t.outcome === 'breakeven' ? 'var(--amber)' : 'var(--red)';
              return `<tr>
                <td class="mono-cell" style="color:var(--text-faint);width:70px">${fmtDateShort(t.date)}</td>
                <td class="pair-tag">${escapeHtml(t.pair)}</td>
                <td><span class="badge ${t.direction=='buy'?'badge-green':'badge-red'}">${t.direction.toUpperCase()}</span></td>
                <td class="mono-cell" style="text-align:right;color:${displayColor}">${fmtMoney(t.pnl)}</td>
              </tr>`
            }).join('')}
          </tbody></table>`}
        </div>
      </div>
      <div>
        <div class="section-title">Students Needing Attention</div>
        <div class="card">
          ${overdueCount===0 ? `<div class="empty-state"><div class="et">All caught up</div><div class="ed">No overdue payments this month.</div></div>` :
          `<table><tbody>
            ${state.students.filter(s => {
              const st = studentMonthStatus(s, monthStart);
              return s.status==='active' && st && st.status==='overdue';
            }).map(s=>`<tr><td>${escapeHtml(s.fullName)}</td><td style="text-align:right"><span class="badge badge-red">OVERDUE</span></td></tr>`).join('')}
          </tbody></table>`}
        </div>
      </div>
    </div>
  `;
}

/* =================== 2. STUDENTS COMPONENT =================== */
function renderStudents(){
  const list = [...state.students].sort((a,b)=>a.fullName.localeCompare(b.fullName));
  return `
    <div class="page-head">
      <div><h1>Students</h1><p>Manage your mentees, courses, progress scores and billing setups.</p></div>
      <button class="btn btn-primary" onclick="openStudentForm()">+ Add Student</button>
    </div>
    ${list.length===0 ? `<div class="card"><div class="empty-state">
        <div class="et">No students yet</div><div class="ed">Add your first mentee to start tracking sessions and payments.</div>
      </div></div>` :
    `<div class="card" style="padding:0;overflow-x:auto">
      <table>
        <thead><tr><th>Name</th><th>Package</th><th>Progress</th><th>Session Block</th><th>Fee / mo</th><th>This Month</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.map(s=>{
            const now=new Date(); const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
            const st = studentMonthStatus(s, monthStart);
            const statusBadge = !st ? '<span class="badge badge-gray">NOT STARTED</span>' :
              st.status==='paid' ? '<span class="badge badge-green">PAID</span>' :
              st.status==='overdue' ? '<span class="badge badge-red">OVERDUE</span>' : '<span class="badge badge-amber">PENDING</span>';
            return `<tr>
              <td><b>${escapeHtml(s.fullName)}</b></td>
              <td><span class="badge badge-gray" style="font-weight:600">${escapeHtml(s.packageType || 'Custom')}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="flex:1;background:var(--surface-3);height:6px;border-radius:3px;min-width:60px;overflow:hidden;">
                    <div style="background:var(--blue);height:100%;width:${Number(s.progress || 0)}%"></div>
                  </div>
                  <span class="mono-cell" style="font-size:11px">${Number(s.progress || 0)}%</span>
                </div>
              </td>
              <td>${s.sessionDay? escapeHtml(s.sessionDay)+' · '+escapeHtml(s.sessionTime||'') : '<span style="color:var(--text-faint)">unset</span>'}</td>
              <td class="mono-cell">${fmtMoney(s.fee)}</td>
              <td>${statusBadge}</td>
              <td><span class="badge ${s.status==='active'?'badge-green':s.status==='paused'?'badge-amber':'badge-gray'}">${s.status.toUpperCase()}</span></td>
              <td><div class="row-actions">
                <button class="btn btn-sm btn-ghost" onclick="openStudentDetail('${s.id}')">View</button>
              </div></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  `;
}

function openStudentForm(id){
  const s = id ? state.students.find(x=>x.id===id) : null;
  openModal(`
    <h3>${s? 'Edit Student Details' : 'Register New Student'}</h3>
    <form id="studentForm">
      <div class="field"><label>Full Name</label><input type="text" name="fullName" value="${s?escapeHtml(s.fullName):''}"></div>
      <div class="field-row">
        <div class="field"><label>ID Number</label><input type="text" name="studentId" value="${s?escapeHtml(s.studentId||''):''}"></div>
        <div class="field"><label>Package Type</label>
          <select name="packageType">
            <option value="Beginner" ${s&&s.packageType==='Beginner'?'selected':''}>Beginner Mentorship — R1000/mo</option>
            <option value="Advanced" ${s&&s.packageType==='Advanced'?'selected':''}>Advanced Mentorship — R2000/mo</option>
            <option value="VIP" ${s&&s.packageType==='VIP'?'selected':''}>VIP Mentorship — R5000/mo</option>
            <option value="Custom" ${s&&s.packageType==='Custom'?'selected':''}>Custom Arrangement</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Phone Number</label><input type="text" name="phone" placeholder="e.g. 082 123 4567" value="${s?escapeHtml(s.phone||''):''}"></div>
        <div class="field"><label>Email Address</label><input type="email" name="email" placeholder="name@domain.com" value="${s?escapeHtml(s.email||''):''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Start Date</label><input type="date" name="startDate" value="${s?s.startDate:todayStr()}"></div>
        <div class="field"><label>Monthly Fee (ZAR)</label><input type="text" inputmode="decimal" name="fee" placeholder="e.g. 1500.00" value="${s?s.fee:''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Session Day</label>
          <select name="sessionDay"><option value="">— none —</option>${DAYS.map(d=>`<option ${s&&s.sessionDay===d?'selected':''}>${d}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Session Fixed Time</label><input type="time" name="sessionTime" value="${s?s.sessionTime||'':''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Progress Completion Score (%)</label><input type="number" name="progress" min="0" max="100" value="${s?s.progress||0:0}"></div>
        <div class="field"><label>Status</label>
          <select name="status">
            ${['active','paused','completed'].map(v=>`<option value="${v}" ${s&&s.status===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field"><label>Operational Notes</label><textarea name="notes">${s?escapeHtml(s.notes||''):''}</textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${s?'Save Profile Changes':'Complete Registration'}</button>
      </div>
    </form>
  `);
  document.getElementById('studentForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const fullName = (f.get('fullName')||'').trim();
    if(!fullName) return flagFieldError(e.target.querySelector('[name="fullName"]'), 'Full name is required');
    const startDate = f.get('startDate');
    if(!startDate) return flagFieldError(e.target.querySelector('[name="startDate"]'), 'Start date is required');
    const fee = parseNum(f.get('fee'));
    if(isNaN(fee) || fee<0) return flagFieldError(e.target.querySelector('[name="fee"]'), 'Enter a valid monthly fee asset parameter.');

    const data = {
      fullName,
      studentId: (f.get('studentId')||'').trim(),
      packageType: f.get('packageType'),
      phone: (f.get('phone')||'').trim(),
      email: (f.get('email')||'').trim(),
      startDate,
      fee,
      sessionDay: f.get('sessionDay'),
      sessionTime: f.get('sessionTime'),
      progress: parseInt(f.get('progress')) || 0,
      status: f.get('status'),
      notes: (f.get('notes')||'').trim()
    };
    if(s){ Object.assign(s, data); showToast('Student updated'); }
    else { state.students.push(Object.assign({id:uid(), payments:[]}, data)); showToast('Student added'); }
    saveState(); closeModal(); render();
  });
}

function openStudentDetail(id){
  const s = state.students.find(x=>x.id===id);
  if(!s) return;
  const totalPaid = (s.payments||[]).reduce((a,p)=>a+Number(p.amount||0),0);
  const monthsActive = Math.max(1, monthsBetween(s.startDate, todayStr())+1);
  const payments = [...(s.payments||[])].sort((a,b)=>b.date.localeCompare(a.date));
  openModal(`
    <h3>Mentee Profile — ${escapeHtml(s.fullName)}</h3>
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="card stat-card" style="padding:12px"><div class="label">Total Generated</div><div class="value" style="font-size:17px">${fmtMoney(totalPaid)}</div></div>
      <div class="card stat-card" style="padding:12px"><div class="label">Course Status</div><div class="value" style="font-size:17px">${s.progress || 0}% Done</div></div>
      <div class="card stat-card" style="padding:12px"><div class="label">Fee Matrix</div><div class="value" style="font-size:17px">${fmtMoney(s.fee)}</div></div>
    </div>
    <div class="field-row">
      <div class="field"><label>ID Number</label><div class="mono-cell">${escapeHtml(s.studentId||'—')}</div></div>
      <div class="field"><label>Package Selection</label><div>${escapeHtml(s.packageType || 'Custom')} Package</div></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Phone Number</label><div>${escapeHtml(s.phone||'—')}</div></div>
      <div class="field"><label>Email Address</label><div>${escapeHtml(s.email||'—')}</div></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Commenced Date</label><div class="mono-cell">${fmtDate(s.startDate)}</div></div>
      <div class="field"><label>Assigned Slot</label><div>${s.sessionDay ? s.sessionDay + ' at ' + s.sessionTime : 'None Assigned'}</div></div>
    </div>
    ${s.notes? `<div class="field"><label>Operational Progress Notes</label><div style="font-size:13px;color:var(--text-dim);background:var(--surface-2);padding:10px;border-radius:6px;">${escapeHtml(s.notes)}</div></div>` : ''}

    <div class="section-title" style="margin-top:20px">Curriculum Syllabus Modules</div>
    <div class="card" style="background: var(--surface-2); padding: 12px; font-size:12.5px; margin-bottom: 20px;">
      <div style="display:grid; grid-template-columns: 1fr; gap:10px;">
        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" ${s.mod1?'checked':''} onchange="toggleModule('${s.id}', 'mod1')"> Module 1: Market Structure (BOS/CHoCH)</label>
        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" ${s.mod2?'checked':''} onchange="toggleModule('${s.id}', 'mod2')"> Module 2: Liquidity Engineering</label>
        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" ${s.mod3?'checked':''} onchange="toggleModule('${s.id}', 'mod3')"> Module 3: Advanced Wyckoff Principles</label>
        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" ${s.mod4?'checked':''} onchange="toggleModule('${s.id}', 'mod4')"> Assessment 1: Live Demo Simulation</label>
        <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" ${s.mod5?'checked':''} onchange="toggleModule('${s.id}', 'mod5')"> Assessment 2: Funded Challenge Prep</label>
      </div>
    </div>

    <div class="section-title" style="margin-top:20px">Historical Receipts Ledger</div>
    <div style="max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;">
      ${payments.length===0? `<div style="padding:14px;color:var(--text-faint);font-size:13px">No historical transactions verified.</div>` :
      `<table><tbody>${payments.map(p=>`<tr><td class="mono-cell">${fmtDate(p.date)}</td><td class="mono-cell" style="text-align:right;color:var(--green)">${fmtMoney(p.amount)}</td></tr>`).join('')}</tbody></table>`}
    </div>

    <div class="modal-actions" style="justify-content:space-between;margin-top:18px">
      <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">Delete Record</button>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="openStudentForm('${s.id}')">Modify</button>
        <button class="btn btn-primary btn-sm" onclick="openPaymentForm('${s.id}')">Receipt Payment</button>
      </div>
    </div>
  `);
}

function openPaymentForm(studentId){
  const s = state.students.find(x=>x.id===studentId);
  openModal(`
    <h3>Record Incoming Payment — ${escapeHtml(s.fullName)}</h3>
    <form id="paymentForm">
      <div class="field-row">
        <div class="field"><label>Payment Date</label><input type="date" name="date" value="${todayStr()}"></div>
        <div class="field"><label>Amount (ZAR)</label><input type="text" inputmode="decimal" name="amount" value="${s.fee}"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="openStudentDetail('${s.id}')">Back</button>
        <button type="submit" class="btn btn-primary">Process Receipt</button>
      </div>
    </form>
  `);
  document.getElementById('paymentForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const date = f.get('date');
    if(!date) return flagFieldError(e.target.querySelector('[name="date"]'), 'Date required');
    const amount = parseNum(f.get('amount'));
    if(isNaN(amount) || amount<=0) return flagFieldError(e.target.querySelector('[name="amount"]'), 'Enter valid value');
    s.payments = s.payments||[];
    s.payments.push({date, amount});
    saveState(); showToast('Payment successfully recorded'); render(); openStudentDetail(s.id);
  });
}

function deleteStudent(id){
  if(!confirm('Purge this record completely? All payment logs will be removed.')) return;
  state.students = state.students.filter(s=>s.id!==id);
  saveState(); closeModal(); showToast('Student removed from engine'); render();
}

/* =================== 3. SCHEDULE COMPONENT =================== */
function renderSchedule(){
  const today = new Date();
  const dow = today.getDay(); const todayIdx = dow===0?6:dow-1;
  const upcomingEvents = [...state.events].filter(e=>e.date>=todayStr()).sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));

  // Simulating in-app reminders based on time blocks
  setTimeout(() => {
    const currentHrMin = new Date().toTimeString().slice(0,5);
    const matchSess = state.students.find(s=>s.status==='active' && s.sessionTime && s.sessionDay === DAYS[todayIdx]);
    if (matchSess && matchSess.sessionTime.substring(0,2) === currentHrMin.substring(0,2)) {
      showToast(`${matchSess.fullName}'s mentorship starts imminently.`, false);
    }
  }, 1000);

  return `
    <div class="page-head">
      <div><h1>Schedule &amp; Calendar</h1><p>Weekly fixed cohort time allocations and single custom events.</p></div>
      <button class="btn btn-primary" onclick="openEventForm()">+ One-off Session</button>
    </div>

    <div class="week-grid">
      ${DAYS.map((d,i)=>{
        const sessions = state.students.filter(s=>s.status==='active' && s.sessionDay===d).sort((a,b)=>(a.sessionTime||'').localeCompare(b.sessionTime||''));
        return `<div class="day-col ${i===todayIdx?'today':''}">
          <div class="day-name"><span>${DAYS_SHORT[i]}</span></div>
          ${sessions.length===0? `<div style="color:var(--text-faint);font-size:11.5px">No sessions</div>` :
            sessions.map(s=>`<div class="sess"><span class="t">${s.sessionTime||'--:--'}</span><span class="n">${escapeHtml(s.fullName)}</span></div>`).join('')}
        </div>`;
      }).join('')}
    </div>

    <div class="section-title">Upcoming Appointments &amp; Make-Ups</div>
    <div class="card" style="${upcomingEvents.length? 'padding:0':''}">
      ${upcomingEvents.length===0? `<div class="empty-state"><div class="et">No auxiliary bookings found</div><div class="ed">Log standalone appointments or lead strategy calls.</div></div>` :
      `<table><tbody>
        ${upcomingEvents.map(ev=>`<tr>
          <td class="mono-cell" style="width:90px;color:var(--text-faint)">${fmtDateShort(ev.date)}</td>
          <td class="mono-cell" style="width:70px;color:var(--amber)">${ev.time||'--:--'}</td>
          <td>${escapeHtml(ev.title)}</td>
          <td style="text-align:right"><button class="btn btn-sm btn-danger" onclick="deleteEvent('${ev.id}')">Remove</button></td>
        </tr>`).join('')}
      </tbody></table>`}
    </div>
  `;
}

function openEventForm(){
  openModal(`
    <h3>Schedule One-off Session</h3>
    <form id="eventForm">
      <div class="field"><label>Session Title / Focus</label><input type="text" name="title" placeholder="e.g. Lead Follow-Up — Sarah"></div>
      <div class="field-row">
        <div class="field"><label>Date Target</label><input type="date" name="date" value="${todayStr()}"></div>
        <div class="field"><label>Start Time</label><input type="time" name="time"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Lock Appointment</button>
      </div>
    </form>
  `);
  document.getElementById('eventForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const title = (f.get('title')||'').trim();
    if(!title) return flagFieldError(e.target.querySelector('[name="title"]'), 'Context description title required');
    const date = f.get('date');
    if(!date) return flagFieldError(e.target.querySelector('[name="date"]'), 'Date required');
    const time = f.get('time');
    if(!time) return flagFieldError(e.target.querySelector('[name="time"]'), 'Time required');
    state.events.push({id:uid(), title, date, time});
    saveState(); closeModal(); showToast('One-off appointment logged'); render();
  });
}

function deleteEvent(id){
  state.events = state.events.filter(e=>e.id!==id);
  saveState(); render();
}

/* =================== 4. JOURNAL COMPONENT =================== */
function renderJournal(){
  window.filterStart = window.filterStart || '';
  window.filterEnd = window.filterEnd || '';

  let trades = [...state.trades];
  if (window.filterStart) {
    trades = trades.filter(t => t.date >= window.filterStart);
  }
  if (window.filterEnd) {
    trades = trades.filter(t => t.date <= window.filterEnd);
  }

  trades.sort((a,b)=>b.date.localeCompare(a.date));

  const wins = trades.filter(t=>t.outcome === 'win' || (!t.outcome && Number(t.pnl)>0)).length;
  const losses = trades.filter(t=>t.outcome === 'loss' || (!t.outcome && Number(t.pnl)<0)).length;
  const decided = wins+losses;
  const winRate = decided? wins/decided*100 : 0;
  const totalPnl = trades.reduce((s,t)=>s+Number(t.pnl||0),0);

  let bestTrade = 0, worstTrade = 0, totalR = 0;
  trades.forEach(t => {
    const val = Number(t.pnl || 0);
    if(val > bestTrade) bestTrade = val;
    if(val < worstTrade) worstTrade = val;
    totalR += Number(t.rMultiplier || 0);
  });
  const avgRR = decided ? (totalR / decided) : 0;

  const byPair = {};
  trades.forEach(t=>{
    byPair[t.pair] = byPair[t.pair] || {count:0, pnl:0};
    byPair[t.pair].count++; byPair[t.pair].pnl += Number(t.pnl||0);
  });
  const pairRows = Object.entries(byPair).sort((a,b)=>b[1].pnl-a[1].pnl);

  const sorted = [...trades].sort((a,b)=>a.date.localeCompare(b.date));
  let cum=0; const points = sorted.map(t=>{ cum+=Number(t.pnl||0); return cum; });
  const curveSvg = buildSparkline(points);

  return `
    <div class="page-head">
      <div><h1>Personal Trading Journal</h1><p>Track high-performance executions, risk targets, strategy layout URLs and R-multiples.</p></div>
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim)">
          <label>From:</label>
          <input type="date" id="journalStartFilter" value="${window.filterStart}" style="padding:6px; font-size:12px; width:130px; background:var(--surface-2); border:1px solid var(--border); color:var(--text); border-radius:5px;" onchange="window.filterStart=this.value;render();">
          <label>To:</label>
          <input type="date" id="journalEndFilter" value="${window.filterEnd}" style="padding:6px; font-size:12px; width:130px; background:var(--surface-2); border:1px solid var(--border); color:var(--text); border-radius:5px;" onchange="window.filterEnd=this.value;render();">
          <button class="btn btn-sm btn-ghost" onclick="window.filterStart='';window.filterEnd='';render();" style="padding:4px 8px; font-size:11px;">Clear</button>
        </div>
        <button class="btn btn-primary" onclick="openTradeForm()">+ Add Trade</button>
      </div>
    </div>

    <div class="grid grid-4">
      <div class="card stat-card"><div class="label">Win Rate</div><div class="value ${winRate>=50?'up':'down'}">${decided?winRate.toFixed(1):'—'}%</div><div class="sub">${wins}W / ${losses}L</div></div>
      <div class="card stat-card"><div class="label">Total P&amp;L Matrix</div><div class="value ${totalPnl>=0?'up':'down'}">${fmtMoney(totalPnl)}</div><div class="sub">${trades.length} total trades logged</div></div>
      <div class="card stat-card"><div class="label">Average R:R Outcome</div><div class="value neutral">${avgRR >= 0 ? '+' : ''}${avgRR.toFixed(2)}R</div><div class="sub">Net cumulative performance</div></div>
      <div class="card stat-card"><div class="label">Extremes (Best/Worst)</div><div class="value" style="font-size:14px;line-height:24px;"><span class="up">Max: ${fmtMoney(bestTrade)}</span><br><span class="down">Min: ${fmtMoney(worstTrade)}</span></div></div>
    </div>

    <div class="section-title">Performance Equity Curve</div>
    <div class="card">${points.length<2? `<div class="empty-state"><div class="ed">Log executions to graph performance curves.</div></div>` : curveSvg}</div>

    <div class="grid grid-2" style="margin-top:30px;align-items:start">
      <div>
        <div class="section-title">By Currency Pair Performance</div>
        <div class="card" style="${pairRows.length?'padding:0':''}">
          ${pairRows.length===0? `<div class="empty-state"><div class="ed">No pairs traded yet.</div></div>` :
          `<table><tbody>${pairRows.map(([pair,d])=>`<tr><td class="pair-tag">${escapeHtml(pair)}</td><td class="mono-cell" style="color:var(--text-faint)">${d.count} executions</td><td class="mono-cell" style="text-align:right;color:${d.pnl>=0?'var(--green)':'var(--red)'}">${fmtMoney(d.pnl)}</td></tr>`).join('')}</tbody></table>`}
        </div>
      </div>
      <div>
        <div class="section-title">All Logged Executions</div>
        <div class="card" style="${trades.length?'padding:0':''};max-height:340px;overflow-y:auto">
          ${trades.length===0? `<div class="empty-state"><div class="et">No trades yet</div><div class="ed">Log your first trade execution to begin engine calculation.</div></div>` :
          `<table><tbody>
            ${trades.map(t=>{
              const displayColor = t.outcome === 'win' || (!t.outcome && Number(t.pnl) >= 0) ? 'var(--green)' : t.outcome === 'breakeven' ? 'var(--amber)' : 'var(--red)';
              return `<tr style="cursor:pointer" onclick="openTradeForm('${t.id}')">
                <td class="mono-cell" style="color:var(--text-faint);width:64px">${fmtDateShort(t.date)}</td>
                <td class="pair-tag">${escapeHtml(t.pair)} <span style="font-size:10px;color:var(--text-faint);font-weight:400;">(${t.rMultiplier >= 0 ? '+' : ''}${t.rMultiplier}R)</span></td>
                <td><span class="badge ${t.direction==='buy'?'badge-green':'badge-red'}">${t.direction.toUpperCase()}</span></td>
                <td class="mono-cell" style="text-align:right;color:${displayColor}">${fmtMoney(t.pnl)}</td>
              </tr>`
            }).join('')}
          </tbody></table>`}
        </div>
      </div>
    </div>
  `;
}

function buildSparkline(points){
  const w=900,h=140,pad=10;
  const min=Math.min(0,...points), max=Math.max(0,...points);
  const range = (max-min)||1;
  const stepX = (w-pad*2)/((points.length-1)||1);
  const coords = points.map((p,i)=>{
    const x = pad+i*stepX;
    const y = h-pad-((p-min)/range)*(h-pad*2);
    return [x,y];
  });
  const path = coords.map((c,i)=>(i===0?'M':'L')+c[0].toFixed(1)+','+c[1].toFixed(1)).join(' ');
  const zeroY = h-pad-((0-min)/range)*(h-pad*2);
  const last = points[points.length-1];
  const color = last>=0 ? 'var(--green)' : 'var(--red)';
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:140px;display:block">
    <line x1="${pad}" y1="${zeroY}" x2="${w-pad}" y2="${zeroY}" stroke="var(--border)" stroke-dasharray="4 4"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2"/>
  </svg>`;
}

function openTradeForm(id){
  const t = id ? state.trades.find(x=>x.id===id) : null;
  openModal(`
    <h3>${t?'Modify Execution Log':'Log Active Market Execution'}</h3>
    <form id="tradeForm">
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" name="date" value="${t?t.date:todayStr()}"></div>
        <div class="field"><label>Currency Pair</label><input type="text" name="pair" placeholder="e.g. XAU/USD" value="${t?escapeHtml(t.pair):''}" style="text-transform:uppercase"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Order Direction</label>
          <select name="direction"><option value="buy" ${t&&t.direction==='buy'?'selected':''}>Buy / Long</option><option value="sell" ${t&&t.direction==='sell'?'selected':''}>Sell / Short</option></select>
        </div>
        <div class="field"><label>Trade Outcome</label>
          <select name="outcome">
            <option value="win" ${t&&t.outcome==='win'?'selected':''}>Win / Take Profit (TP)</option>
            <option value="loss" ${t&&t.outcome==='loss'?'selected':''}>Loss / Stop Loss (SL)</option>
            <option value="breakeven" ${t&&t.outcome==='breakeven'?'selected':''}>Scratch / Break-Even</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Allocated Lot Size</label><input type="text" inputmode="decimal" name="lotSize" value="${t?t.lotSize||'':''}"></div>
        <div class="field"><label>Entry Price</label><input type="text" inputmode="decimal" name="entry" value="${t?t.entry||'':''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Exit Price Trigger</label><input type="text" inputmode="decimal" name="exit" value="${t?t.exit||'':''}"></div>
        <div class="field"><label>Stop Loss (SL)</label><input type="text" inputmode="decimal" name="sl" value="${t?t.sl||'':''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Take Profit (TP)</label><input type="text" inputmode="decimal" name="tp" value="${t?t.tp||'':''}"></div>
        <div class="field"><label>Risk Exposure Target (%)</label><input type="text" inputmode="decimal" name="riskPercent" placeholder="e.g. 1" value="${t?t.riskPercent||'':''}"></div>
      </div>
      <div class="field"><label>Result Outcome R-Multiple</label><input type="text" inputmode="numeric" name="rMultiplier" placeholder="e.g. +2 or -1" value="${t?t.rMultiplier||'':''}"></div>
      <div class="field"><label>Net Realized P&amp;L (ZAR — use negative sign for losses)</label><input type="text" inputmode="decimal" name="pnl" placeholder="e.g. 4500 or -1200" value="${t?t.pnl:''}"></div>
      <div class="field"><label>Chart Setup Screenshot URL</label><input type="text" name="screenshotUrl" placeholder="https://tradingview.com/x/..." value="${t?escapeHtml(t.screenshotUrl||''):''}"></div>
      ${t && t.screenshotUrl ? `<div style="margin-bottom:12px;"><a href="${escapeHtml(t.screenshotUrl)}" target="_blank" class="badge badge-green" style="text-decoration:none">View Attached Chart Layout ↗</a></div>` : ''}
      <div class="field"><label>Confluence Notes</label><textarea name="notes" placeholder="Market structure details, session type, break of character confirmations...">${t?escapeHtml(t.notes||''):''}</textarea></div>
      <div class="modal-actions" style="justify-content:${t?'space-between':'flex-end'}">
        ${t?`<button type="button" class="btn btn-danger btn-sm" onclick="deleteTrade('${t.id}')">Delete Log</button>`:''}
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${t?'Save Modifications':'Commit To Journal'}</button>
        </div>
      </div>
    </form>
  `);
  document.getElementById('tradeForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const date = f.get('date');
    if(!date) return flagFieldError(e.target.querySelector('[name="date"]'), 'Date required');
    const pair = (f.get('pair')||'').trim().toUpperCase();
    if(!pair) return flagFieldError(e.target.querySelector('[name="pair"]'), 'Pair asset descriptor required');
    const pnl = parseNum(f.get('pnl'));
    if(isNaN(pnl)) return flagFieldError(e.target.querySelector('[name="pnl"]'), 'Valid P&L balance confirmation parameter required.');

    const lotSize = parseNum(f.get('lotSize')); const entry = parseNum(f.get('entry')); const exit = parseNum(f.get('exit'));
    const sl = parseNum(f.get('sl')); const tp = parseNum(f.get('tp'));

    const data = {
      date, pair,
      direction: f.get('direction'),
      outcome: f.get('outcome'),
      lotSize: isNaN(lotSize)?0:lotSize, entry: isNaN(entry)?0:entry, exit: isNaN(exit)?0:exit,
      sl: isNaN(sl)?0:sl, tp: isNaN(tp)?0:tp,
      riskPercent: parseNum(f.get('riskPercent'))||0,
      rMultiplier: parseNum(f.get('rMultiplier'))||0,
      pnl, screenshotUrl: (f.get('screenshotUrl')||'').trim(), notes: (f.get('notes')||'').trim()
    };
    if(t){ Object.assign(t,data); showToast('Trade metrics updated'); }
    else { state.trades.push(Object.assign({id:uid()}, data)); showToast('Execution captured safely'); }
    saveState(); closeModal(); render();
  });
}

function deleteTrade(id){
  if(!confirm('Delete execution log permanently?')) return;
  state.trades = state.trades.filter(t=>t.id!==id);
  saveState(); closeModal(); showToast('Trade deleted'); render();
}

/* =================== 5. INCOME & CRM PIPELINE COMPONENT =================== */
function renderIncome(){
  const base = new Date();
  base.setMonth(base.getMonth()+incomeMonthOffset);
  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const monthLabel = monthStart.toLocaleDateString('en-ZA', {month:'long', year:'numeric'});

  let expected = 0, received = 0;
  const rows = state.students.map(s=>{
    const st = studentMonthStatus(s, monthStart);
    if(st && s.status === 'active'){ expected += Number(s.fee||0); received += st.paidAmount; }
    return {s, st};
  }).filter(r=>r.st);

  let grandTotalRevenue = 0;
  state.students.forEach(s => {
    if(s.payments) {
      s.payments.forEach(p => grandTotalRevenue += Number(p.amount || 0));
    }
  });

  const months = [];
  for(let i=5;i>=0;i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const ms = new Date(d.getFullYear(), d.getMonth(), 1);
    let rec=0;
    state.students.forEach(s=>{
      const st = studentMonthStatus(s, ms);
      if(st) rec += st.paidAmount;
    });
    months.push({label: ms.toLocaleDateString('en-ZA',{month:'short'}), value: rec});
  }
  const maxVal = Math.max(1, ...months.map(m=>m.value));

  // CRM Pipeline State Binding Hook
  state.leads = state.leads || [];
  const prospects = state.leads.filter(l => l.stage === 'prospect');
  const followupList = state.leads.filter(l => l.stage === 'followup');
  const hotLeads = state.leads.filter(l => l.stage === 'hot');

  return `
    <div class="page-head">
      <div><h1>Revenue &amp; Income Analytics</h1><p>Track cash flows, client balances, outstanding collection requirements, and billing health.</p></div>
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-ghost btn-icon" onclick="incomeMonthOffset--;render()">←</button>
        <div class="mono-cell" style="min-width:150px;text-align:center;font-weight:700">${monthLabel}</div>
        <button class="btn btn-ghost btn-icon" onclick="incomeMonthOffset++;render()">→</button>
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card stat-card"><div class="label">Expected This Month</div><div class="value">${fmtMoney(expected)}</div></div>
      <div class="card stat-card"><div class="label">Total Collected (Current Month)</div><div class="value up">${fmtMoney(received)}</div></div>
      <div class="card stat-card"><div class="label">Total Revenue Generated (All-Time)</div><div class="value up" style="color:var(--blue);">${fmtMoney(grandTotalRevenue)}</div></div>
    </div>

    <div class="page-head" style="margin-top:40px; margin-bottom:10px;">
      <div><h2>Mentorship Sales Pipeline (CRM)</h2><p>Track interested prospects, active follow-ups, and hot lead conversions.</p></div>
      <button class="btn btn-primary btn-sm" onclick="openLeadForm()">+ New Lead</button>
    </div>

    <div class="grid grid-3" style="align-items:start;">
      <div class="card" style="background:rgba(255,255,255,0.01); border-style:dashed;">
        <div class="section-title" style="margin-top:0; color:var(--text-dim);">Prospects (${prospects.length})</div>
        ${prospects.length===0 ? '<div style="padding:10px; color:var(--text-faint); font-size:12px;">No prospects logged</div>' : prospects.map(l => renderLeadCard(l)).join('')}
      </div>
      <div class="card" style="background:rgba(255,255,255,0.01); border-style:dashed;">
        <div class="section-title" style="margin-top:0; color:var(--amber);">Follow-Ups (${followupList.length})</div>
        ${followupList.length===0 ? '<div style="padding:10px; color:var(--text-faint); font-size:12px;">No active follow-ups</div>' : followupList.map(l => renderLeadCard(l)).join('')}
      </div>
      <div class="card" style="background:rgba(255,255,255,0.01); border-style:dashed;">
        <div class="section-title" style="margin-top:0; color:var(--green);">Hot / Ready (${hotLeads.length})</div>
        ${hotLeads.length===0 ? '<div style="padding:10px; color:var(--text-faint); font-size:12px;">No hot leads ready</div>' : hotLeads.map(l => renderLeadCard(l)).join('')}
      </div>
    </div>

    <div class="section-title" style="margin-top:40px;">Breakdown by Individual Student Account</div>
    <div class="card" style="${rows.length?'padding:0':''}">
      ${rows.length===0? `<div class="empty-state"><div class="ed">No active accounts detected for this period.</div></div>` :
      `<table><tbody>
        ${rows.map(({s,st})=>`<tr>
          <td><b>${escapeHtml(s.fullName)}</b></td>
          <td class="mono-cell" style="color:var(--text-faint)">Anniversary Date: ${fmtDateShort(s.startDate)}</td>
          <td class="mono-cell" style="text-align:right">${fmtMoney(st.paidAmount)} / ${fmtMoney(s.fee)}</td>
          <td style="text-align:right">${st.status==='paid'?'<span class="badge badge-green">PAID</span>':st.status==='overdue'?'<span class="badge badge-red">OVERDUE</span>':'<span class="badge badge-amber">PENDING</span>'}</td>
        </tr>`).join('')}
      </tbody></table>`}
    </div>
  `;
}

function renderLeadCard(lead) {
  return `
    <div class="card" style="background: var(--surface-2); margin-bottom:10px; padding:12px; border-left:3px solid var(--blue);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <b style="font-size:13px; color:var(--text);">${escapeHtml(lead.name)}</b>
        <button class="btn btn-ghost" style="padding:2px 6px; font-size:10px;" onclick="openLeadForm('${lead.id}')">Manage</button>
      </div>
      <div style="font-size:11px; color:var(--text-dim); margin-top:4px;">${escapeHtml(lead.phone || lead.email || 'No contact details')}</div>
      ${lead.lastNote ? `<div style="font-size:11px; color:var(--text-faint); background:var(--surface-3); padding:6px; border-radius:4px; margin-top:8px;">"${escapeHtml(lead.lastNote)}"</div>` : ''}
    </div>
  `;
}

function openLeadForm(id) {
  state.leads = state.leads || [];
  const l = id ? state.leads.find(x => x.id === id) : null;
  openModal(`
    <h3>${l ? 'Manage Pipeline Lead' : 'Log New Mentorship Lead'}</h3>
    <form id="leadForm">
      <div class="field"><label>Lead Full Name</label><input type="text" name="name" value="${l ? escapeHtml(l.name) : ''}"></div>
      <div class="field-row">
        <div class="field"><label>Phone Number</label><input type="text" name="phone" value="${l ? escapeHtml(l.phone || '') : ''}"></div>
        <div class="field"><label>Email Address</label><input type="email" name="email" value="${l ? escapeHtml(l.email || '') : ''}"></div>
      </div>
      <div class="field"><label>Pipeline Funnel Stage</label>
        <select name="stage">
          <option value="prospect" ${l && l.stage === 'prospect' ? 'selected' : ''}>Prospect (Interested Lead)</option>
          <option value="followup" ${l && l.stage === 'followup' ? 'selected' : ''}>Follow-Up Required</option>
          <option value="hot" ${l && l.stage === 'hot' ? 'selected' : ''}>Hot / Ready to Convert</option>
        </select>
      </div>
      <div class="field"><label>Latest Follow-up Interaction Note</label><textarea name="lastNote" placeholder="e.g. Sent course outline via WhatsApp...">${l ? escapeHtml(l.lastNote || '') : ''}</textarea></div>
      <div class="modal-actions" style="justify-content: ${l ? 'space-between' : 'flex-end'}">
        ${l ? `<button type="button" class="btn btn-danger btn-sm" onclick="state.leads=state.leads.filter(x=>x.id!=='${l.id}');saveState();closeModal();render();showToast('Lead removed');">Delete</button>` : ''}
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Lead</button>
        </div>
      </div>
    </form>
  `);

  document.getElementById('leadForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = f.get('name').trim();
    if(!name) return flagFieldError(e.target.querySelector('[name="name"]'), 'Name required');
    const data = {
      name,
      phone: f.get('phone').trim(),
      email: f.get('email').trim(),
      stage: f.get('stage'),
      lastNote: f.get('lastNote').trim()
    };
    if(l) Object.assign(l, data);
    else state.leads.push(Object.assign({id: uid()}, data));
    saveState(); closeModal(); render(); showToast('Pipeline synced');
  });
}

/* =================== APP CONTROLLER & STATE =================== */
let state = { students: [], trades: [], events: [], leads: [], settings: { currency: 'ZAR' } };
let activeTab = 'dashboard';
let saveTimer = null;
let incomeMonthOffset = 0;

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/* =================== STORAGE FALLBACK =================== */
const storageAdapter = {
  get: async (key) => {
    if (window.storage && typeof window.storage.get === 'function') {
      return await window.storage.get(key, false);
    }
    return { value: localStorage.getItem(key) };
  },
  set: async (key, value) => {
    if (window.storage && typeof window.storage.set === 'function') {
      return await window.storage.set(key, value, false);
    }
    return localStorage.setItem(key, value);
  }
};

/* =================== STORAGE CORE FOR APP DATA =================== */
async function loadState(){
  try{
    const res = await storageAdapter.get('app-data');
    if(res && res.value){
      const parsed = JSON.parse(res.value);
      state = Object.assign({students:[],trades:[],events:[],leads:[],settings:{currency:'ZAR'}}, parsed);
    }
  }catch(e){
  }
}

function saveState(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try{ await storageAdapter.set('app-data', JSON.stringify(state)); }
    catch(e){ showToast('Could not save — try again', true); }
  }, 250);
}

/* =================== NAVIGATION PANEL =================== */
document.getElementById('nav').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-tab]');
  if(!btn) return;
  activeTab = btn.dataset.tab;
  render();
});

function render(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active', b.dataset.tab===activeTab));
  const c = document.getElementById('content');
  if(activeTab==='dashboard') c.innerHTML = renderDashboard();
  else if(activeTab==='students') c.innerHTML = renderStudents();
  else if(activeTab==='schedule') c.innerHTML = renderSchedule();
  else if(activeTab==='journal') c.innerHTML = renderJournal();
  else if(activeTab==='income') c.innerHTML = renderIncome();
  renderTicker();
}

/* =================== WINDOW LISTENERS =================== */
document.getElementById('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay') closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

// start the app
if (document.getElementById('nav')) {
  (async function init(){
    await loadState();
    render();
  })();
}