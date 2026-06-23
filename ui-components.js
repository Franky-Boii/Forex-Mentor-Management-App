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
  const sessions = todaysSessions();
  if(sessions.length===0){
    el.innerHTML = `<span class="ticker-item empty">No sessions scheduled today</span>`.repeat(1) +
      Array(3).fill(`<span class="ticker-item empty">·</span>`).join('');
    return;
  }
  const items = sessions.map(s=>`<span class="ticker-item"><span class="dot"></span>${s.time} — ${escapeHtml(s.name)}</span>`);
  el.innerHTML = items.concat(items).concat(items).join('');
}

/* =================== 1. DASHBOARD COMPONENT =================== */
function renderDashboard(){
  const activeStudents = state.students.filter(s=>s.status==='active');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let expected=0, received=0, overdueList=[];
  activeStudents.forEach(s=>{
    const st = studentMonthStatus(s, monthStart);
    if(st){
      expected += Number(s.fee||0);
      received += st.paidAmount;
      if(st.status==='overdue') overdueList.push(s);
    }
  });
  const trades = state.trades;
  const wins = trades.filter(t=>Number(t.pnl)>0).length;
  const losses = trades.filter(t=>Number(t.pnl)<0).length;
  const decided = wins+losses;
  const winRate = decided? (wins/decided*100) : 0;
  const totalPnl = trades.reduce((s,t)=>s+Number(t.pnl||0),0);

  const sessions = todaysSessions();
  const recentTrades = [...trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  return `
    <div class="page-head">
      <div><h1>Dashboard</h1><p>${now.toLocaleDateString('en-ZA',{weekday:'long', day:'numeric', month:'long'})}</p></div>
    </div>

    ${overdueList.length ? `
    <div class="alert-banner">
      <span>⏰</span>
      <div><b>${overdueList.length} payment${overdueList.length>1?'s':''} overdue</b> this month — ${overdueList.map(s=>escapeHtml(s.fullName)).join(', ')}.</div>
    </div>` : ''}

    <div class="grid grid-4">
      <div class="card stat-card">
        <div class="label">Active Students</div>
        <div class="value">${activeStudents.length}</div>
        <div class="sub">${state.students.length - activeStudents.length} inactive/paused</div>
      </div>
      <div class="card stat-card">
        <div class="label">Income This Month</div>
        <div class="value">${fmtMoney(received)}</div>
        <div class="sub ${received>=expected?'up':'neutral'}">of ${fmtMoney(expected)} expected</div>
      </div>
      <div class="card stat-card">
        <div class="label">Trading Win Rate</div>
        <div class="value ${winRate>=50?'up':'down'}">${decided? winRate.toFixed(1):'—'}%</div>
        <div class="sub">${wins}W / ${losses}L · ${trades.length} total trades</div>
      </div>
      <div class="card stat-card">
        <div class="label">Total P&amp;L (Journal)</div>
        <div class="value ${totalPnl>=0?'up':'down'}">${fmtMoney(totalPnl)}</div>
        <div class="sub">All-time, all pairs</div>
      </div>
    </div>

    <div class="section-title">Today's Sessions</div>
    <div class="card">
      ${sessions.length===0 ? `<div class="empty-state"><div class="et">Nothing on the books today</div><div class="ed">Add a student with a weekly session, or a one-off in Schedule.</div></div>` :
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
            ${recentTrades.map(t=>`<tr>
              <td class="mono-cell" style="color:var(--text-faint);width:70px">${fmtDateShort(t.date)}</td>
              <td class="pair-tag">${escapeHtml(t.pair)}</td>
              <td><span class="badge ${t.direction==='buy'?'badge-green':'badge-red'}">${t.direction.toUpperCase()}</span></td>
              <td class="mono-cell" style="text-align:right;color:${Number(t.pnl)>=0?'var(--green)':'var(--red)'}">${fmtMoney(t.pnl)}</td>
            </tr>`).join('')}
          </tbody></table>`}
        </div>
      </div>
      <div>
        <div class="section-title">Students Needing Attention</div>
        <div class="card">
          ${overdueList.length===0 ? `<div class="empty-state"><div class="et">All caught up</div><div class="ed">No overdue payments this month.</div></div>` :
          `<table><tbody>
            ${overdueList.map(s=>`<tr><td>${escapeHtml(s.fullName)}</td><td style="text-align:right"><span class="badge badge-red">OVERDUE</span></td></tr>`).join('')}
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
      <div><h1>Students</h1><p>Manage your mentees, sessions and payment history.</p></div>
      <button class="btn btn-primary" onclick="openStudentForm()">+ Add Student</button>
    </div>
    ${list.length===0 ? `<div class="card"><div class="empty-state">
        <div class="et">No students yet</div><div class="ed">Add your first mentee to start tracking sessions and payments.</div>
      </div></div>` :
    `<div class="card" style="padding:0;overflow-x:auto">
      <table>
        <thead><tr><th>Name</th><th>ID</th><th>Started</th><th>Session</th><th>Fee / mo</th><th>This month</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.map(s=>{
            const now=new Date(); const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
            const st = studentMonthStatus(s, monthStart);
            const statusBadge = !st ? '<span class="badge badge-gray">NOT STARTED</span>' :
              st.status==='paid' ? '<span class="badge badge-green">PAID</span>' :
              st.status==='overdue' ? '<span class="badge badge-red">OVERDUE</span>' : '<span class="badge badge-amber">UPCOMING</span>';
            return `<tr>
              <td><b>${escapeHtml(s.fullName)}</b></td>
              <td class="mono-cell" style="color:var(--text-faint)">${escapeHtml(s.studentId||'—')}</td>
              <td class="mono-cell">${fmtDate(s.startDate)}</td>
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
    <h3>${s? 'Edit Student' : 'Add Student'}</h3>
    <form id="studentForm">
      <div class="field"><label>Full name</label><input type="text" name="fullName" value="${s?escapeHtml(s.fullName):''}"></div>
      <div class="field"><label>ID number</label><input type="text" name="studentId" value="${s?escapeHtml(s.studentId||''):''}"></div>
      <div class="field-row">
        <div class="field"><label>Start date</label><input type="date" name="startDate" value="${s?s.startDate:todayStr()}"></div>
        <div class="field"><label>Monthly fee (ZAR)</label><input type="text" inputmode="decimal" name="fee" placeholder="e.g. 1500.00" value="${s?s.fee:''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Session day</label>
          <select name="sessionDay"><option value="">— none —</option>${DAYS.map(d=>`<option ${s&&s.sessionDay===d?'selected':''}>${d}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Session time</label><input type="time" name="sessionTime" value="${s?s.sessionTime||'':''}"></div>
      </div>
      <div class="field"><label>Status</label>
        <select name="status">
          ${['active','paused','completed'].map(v=>`<option value="${v}" ${s&&s.status===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Notes</label><textarea name="notes">${s?escapeHtml(s.notes||''):''}</textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${s?'Save Changes':'Add Student'}</button>
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
    if(isNaN(fee) || fee<0) return flagFieldError(e.target.querySelector('[name="fee"]'), 'Enter a valid monthly fee, e.g. 1500 or 1500.00');
    const data = {
      fullName,
      studentId: (f.get('studentId')||'').trim(),
      startDate,
      fee,
      sessionDay: f.get('sessionDay'),
      sessionTime: f.get('sessionTime'),
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
    <h3>${escapeHtml(s.fullName)}</h3>
    <div class="grid grid-3" style="margin-bottom:16px">
      <div class="card stat-card" style="padding:12px"><div class="label">Total Paid</div><div class="value" style="font-size:17px">${fmtMoney(totalPaid)}</div></div>
      <div class="card stat-card" style="padding:12px"><div class="label">Months Active</div><div class="value" style="font-size:17px">${monthsActive}</div></div>
      <div class="card stat-card" style="padding:12px"><div class="label">Fee / mo</div><div class="value" style="font-size:17px">${fmtMoney(s.fee)}</div></div>
    </div>
    <div class="field"><label>ID Number</label><div class="mono-cell">${escapeHtml(s.studentId||'—')}</div></div>
    <div class="field"><label>Started</label><div class="mono-cell">${fmtDate(s.startDate)}</div></div>
    ${s.notes? `<div class="field"><label>Notes</label><div style="font-size:13px;color:var(--text-dim)">${escapeHtml(s.notes)}</div></div>` : ''}

    <div class="section-title" style="margin-top:20px">Payment History</div>
    <div style="max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;">
      ${payments.length===0? `<div style="padding:14px;color:var(--text-faint);font-size:13px">No payments recorded yet.</div>` :
      `<table><tbody>${payments.map(p=>`<tr><td class="mono-cell">${fmtDate(p.date)}</td><td class="mono-cell" style="text-align:right;color:var(--green)">${fmtMoney(p.amount)}</td></tr>`).join('')}</tbody></table>`}
    </div>

    <div class="modal-actions" style="justify-content:space-between;margin-top:18px">
      <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">Delete Student</button>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="openStudentForm('${s.id}')">Edit</button>
        <button class="btn btn-primary btn-sm" onclick="openPaymentForm('${s.id}')">Record Payment</button>
      </div>
    </div>
  `);
}

function openPaymentForm(studentId){
  const s = state.students.find(x=>x.id===studentId);
  openModal(`
    <h3>Record Payment — ${escapeHtml(s.fullName)}</h3>
    <form id="paymentForm">
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" name="date" value="${todayStr()}"></div>
        <div class="field"><label>Amount (ZAR)</label><input type="text" inputmode="decimal" name="amount" value="${s.fee}"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="openStudentDetail('${s.id}')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Payment</button>
      </div>
    </form>
  `);
  document.getElementById('paymentForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const date = f.get('date');
    if(!date) return flagFieldError(e.target.querySelector('[name="date"]'), 'Date is required');
    const amount = parseNum(f.get('amount'));
    if(isNaN(amount) || amount<=0) return flagFieldError(e.target.querySelector('[name="amount"]'), 'Enter a valid amount, e.g. 1500 or 1500.00');
    s.payments = s.payments||[];
    s.payments.push({date, amount});
    saveState(); showToast('Payment recorded'); render(); openStudentDetail(s.id);
  });
}

function deleteStudent(id){
  if(!confirm('Delete this student? This removes their payment history too.')) return;
  state.students = state.students.filter(s=>s.id!==id);
  saveState(); closeModal(); showToast('Student removed'); render();
}

/* =================== 3. SCHEDULE COMPONENT =================== */
function renderSchedule(){
  const today = new Date();
  const dow = today.getDay(); const todayIdx = dow===0?6:dow-1;
  const upcomingEvents = [...state.events].filter(e=>e.date>=todayStr()).sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));

  return `
    <div class="page-head">
      <div><h1>Schedule</h1><p>Recurring weekly sessions plus one-off bookings. Reminders show while this app is open.</p></div>
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

    <div class="section-title">Upcoming One-off Sessions</div>
    <div class="card" style="${upcomingEvents.length? 'padding:0':''}">
      ${upcomingEvents.length===0? `<div class="empty-state"><div class="et">Nothing extra booked</div><div class="ed">Add a one-off session for a make-up class or a new lead call.</div></div>` :
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
    <h3>Add One-off Session</h3>
    <form id="eventForm">
      <div class="field"><label>Title</label><input type="text" name="title" placeholder="e.g. Make-up class — Thabo"></div>
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" name="date" value="${todayStr()}"></div>
        <div class="field"><label>Time</label><input type="time" name="time"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Session</button>
      </div>
    </form>
  `);
  document.getElementById('eventForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const title = (f.get('title')||'').trim();
    if(!title) return flagFieldError(e.target.querySelector('[name="title"]'), 'Title is required');
    const date = f.get('date');
    if(!date) return flagFieldError(e.target.querySelector('[name="date"]'), 'Date is required');
    const time = f.get('time');
    if(!time) return flagFieldError(e.target.querySelector('[name="time"]'), 'Time is required');
    state.events.push({id:uid(), title, date, time});
    saveState(); closeModal(); showToast('Session added'); render();
  });
}

function deleteEvent(id){
  state.events = state.events.filter(e=>e.id!==id);
  saveState(); render();
}

/* =================== 4. JOURNAL COMPONENT =================== */
function renderJournal(){
  const trades = [...state.trades].sort((a,b)=>b.date.localeCompare(a.date));
  const wins = state.trades.filter(t=>Number(t.pnl)>0);
  const losses = state.trades.filter(t=>Number(t.pnl)<0);
  const decided = wins.length+losses.length;
  const winRate = decided? wins.length/decided*100 : 0;
  const totalPnl = state.trades.reduce((s,t)=>s+Number(t.pnl||0),0);
  const avgWin = wins.length? wins.reduce((s,t)=>s+Number(t.pnl),0)/wins.length : 0;
  const avgLoss = losses.length? losses.reduce((s,t)=>s+Number(t.pnl),0)/losses.length : 0;
  const grossWin = wins.reduce((s,t)=>s+Number(t.pnl),0);
  const grossLoss = Math.abs(losses.reduce((s,t)=>s+Number(t.pnl),0));
  const profitFactor = grossLoss>0 ? (grossWin/grossLoss) : (grossWin>0? Infinity : 0);

  const byPair = {};
  state.trades.forEach(t=>{
    byPair[t.pair] = byPair[t.pair] || {count:0, pnl:0};
    byPair[t.pair].count++; byPair[t.pair].pnl += Number(t.pnl||0);
  });
  const pairRows = Object.entries(byPair).sort((a,b)=>b[1].pnl-a[1].pnl);

  const sorted = [...state.trades].sort((a,b)=>a.date.localeCompare(b.date));
  let cum=0; const points = sorted.map(t=>{ cum+=Number(t.pnl||0); return cum; });
  const curveSvg = buildSparkline(points);

  return `
    <div class="page-head">
      <div><h1>Trading Journal</h1><p>Every trade, every pair, every result.</p></div>
      <button class="btn btn-primary" onclick="openTradeForm()">+ Add Trade</button>
    </div>

    <div class="grid grid-4">
      <div class="card stat-card"><div class="label">Win Rate</div><div class="value ${winRate>=50?'up':'down'}">${decided?winRate.toFixed(1):'—'}%</div><div class="sub">${wins.length}W / ${losses.length}L</div></div>
      <div class="card stat-card"><div class="label">Total P&amp;L</div><div class="value ${totalPnl>=0?'up':'down'}">${fmtMoney(totalPnl)}</div><div class="sub">${state.trades.length} trades logged</div></div>
      <div class="card stat-card"><div class="label">Avg Win / Avg Loss</div><div class="value" style="font-size:17px"><span class="up">${fmtMoney(avgWin)}</span> <span style="color:var(--text-faint)">/</span> <span class="down">${fmtMoney(avgLoss)}</span></div></div>
      <div class="card stat-card"><div class="label">Profit Factor</div><div class="value ${profitFactor>=1?'up':'down'}">${isFinite(profitFactor)?profitFactor.toFixed(2):'∞'}</div><div class="sub">Gross win ÷ gross loss</div></div>
    </div>

    <div class="section-title">Equity Curve</div>
    <div class="card">${points.length<2? `<div class="empty-state"><div class="ed">Log a few trades to see your equity curve.</div></div>` : curveSvg}</div>

    <div class="grid grid-2" style="margin-top:30px;align-items:start">
      <div>
        <div class="section-title">By Currency Pair</div>
        <div class="card" style="${pairRows.length?'padding:0':''}">
          ${pairRows.length===0? `<div class="empty-state"><div class="ed">No pairs traded yet.</div></div>` :
          `<table><tbody>${pairRows.map(([pair,d])=>`<tr><td class="pair-tag">${escapeHtml(pair)}</td><td class="mono-cell" style="color:var(--text-faint)">${d.count} trades</td><td class="mono-cell" style="text-align:right;color:${d.pnl>=0?'var(--green)':'var(--red)'}">${fmtMoney(d.pnl)}</td></tr>`).join('')}</tbody></table>`}
        </div>
      </div>
      <div>
        <div class="section-title">All Trades</div>
        <div class="card" style="${trades.length?'padding:0':''};max-height:340px;overflow-y:auto">
          ${trades.length===0? `<div class="empty-state"><div class="et">No trades yet</div><div class="ed">Log your first trade to start building stats.</div></div>` :
          `<table><tbody>
            ${trades.map(t=>`<tr style="cursor:pointer" onclick="openTradeForm('${t.id}')">
              <td class="mono-cell" style="color:var(--text-faint);width:64px">${fmtDateShort(t.date)}</td>
              <td class="pair-tag">${escapeHtml(t.pair)}</td>
              <td><span class="badge ${t.direction==='buy'?'badge-green':'badge-red'}">${t.direction.toUpperCase()}</span></td>
              <td class="mono-cell" style="text-align:right;color:${Number(t.pnl)>=0?'var(--green)':'var(--red)'}">${fmtMoney(t.pnl)}</td>
            </tr>`).join('')}
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
    <h3>${t?'Edit Trade':'Add Trade'}</h3>
    <form id="tradeForm">
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" name="date" value="${t?t.date:todayStr()}"></div>
        <div class="field"><label>Pair</label><input type="text" name="pair" placeholder="EUR/USD" value="${t?escapeHtml(t.pair):''}" style="text-transform:uppercase"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Direction</label>
          <select name="direction"><option value="buy" ${t&&t.direction==='buy'?'selected':''}>Buy / Long</option><option value="sell" ${t&&t.direction==='sell'?'selected':''}>Sell / Short</option></select>
        </div>
        <div class="field"><label>Lot size</label><input type="text" inputmode="decimal" name="lotSize" value="${t?t.lotSize||'':''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Entry price</label><input type="text" inputmode="decimal" name="entry" value="${t?t.entry||'':''}"></div>
        <div class="field"><label>Exit price</label><input type="text" inputmode="decimal" name="exit" value="${t?t.exit||'':''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Stop loss</label><input type="text" inputmode="decimal" name="sl" value="${t?t.sl||'':''}"></div>
        <div class="field"><label>Take profit</label><input type="text" inputmode="decimal" name="tp" value="${t?t.tp||'':''}"></div>
      </div>
      <div class="field"><label>P&amp;L (ZAR — negative for a loss)</label><input type="text" inputmode="decimal" name="pnl" value="${t?t.pnl:''}"></div>
      <div class="field"><label>Notes</label><textarea name="notes" placeholder="Setup, reasoning, what you'd do differently...">${t?escapeHtml(t.notes||''):''}</textarea></div>
      <div class="modal-actions" style="justify-content:${t?'space-between':'flex-end'}">
        ${t?`<button type="button" class="btn btn-danger btn-sm" onclick="deleteTrade('${t.id}')">Delete</button>`:''}
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">${t?'Save Changes':'Add Trade'}</button>
        </div>
      </div>
    </form>
  `);
  document.getElementById('tradeForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = new FormData(e.target);
    const date = f.get('date');
    if(!date) return flagFieldError(e.target.querySelector('[name="date"]'), 'Date is required');
    const pair = (f.get('pair')||'').trim().toUpperCase();
    if(!pair) return flagFieldError(e.target.querySelector('[name="pair"]'), 'Pair is required, e.g. EUR/USD');
    const pnl = parseNum(f.get('pnl'));
    if(isNaN(pnl)) return flagFieldError(e.target.querySelector('[name="pnl"]'), 'Enter a valid P&L amount, e.g. 450 or -120.50');
    const lotSize = parseNum(f.get('lotSize')); const entry = parseNum(f.get('entry')); const exit = parseNum(f.get('exit'));
    const sl = parseNum(f.get('sl')); const tp = parseNum(f.get('tp'));
    const data = {
      date, pair, direction:f.get('direction'),
      lotSize:isNaN(lotSize)?0:lotSize, entry:isNaN(entry)?0:entry, exit:isNaN(exit)?0:exit,
      sl:isNaN(sl)?0:sl, tp:isNaN(tp)?0:tp, pnl, notes:(f.get('notes')||'').trim()
    };
    if(t){ Object.assign(t,data); showToast('Trade updated'); }
    else { state.trades.push(Object.assign({id:uid()}, data)); showToast('Trade logged'); }
    saveState(); closeModal(); render();
  });
}

function deleteTrade(id){
  if(!confirm('Delete this trade?')) return;
  state.trades = state.trades.filter(t=>t.id!==id);
  saveState(); closeModal(); showToast('Trade deleted'); render();
}

/* =================== 5. INCOME COMPONENT =================== */
function renderIncome(){
  const base = new Date();
  base.setMonth(base.getMonth()+incomeMonthOffset);
  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const monthLabel = monthStart.toLocaleDateString('en-ZA', {month:'long', year:'numeric'});

  let expected=0, received=0;
  const rows = state.students.filter(s=>s.status!=='completed' || true).map(s=>{
    const st = studentMonthStatus(s, monthStart);
    if(st){ expected += Number(s.fee||0); received += st.paidAmount; }
    return {s, st};
  }).filter(r=>r.st);

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

  return `
    <div class="page-head">
      <div><h1>Income</h1><p>Monthly income calculated from recorded student payments.</p></div>
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-ghost btn-icon" onclick="incomeMonthOffset--;render()">←</button>
        <div class="mono-cell" style="min-width:150px;text-align:center;font-weight:700">${monthLabel}</div>
        <button class="btn btn-ghost btn-icon" onclick="incomeMonthOffset++;render()">→</button>
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card stat-card"><div class="label">Expected</div><div class="value">${fmtMoney(expected)}</div></div>
      <div class="card stat-card"><div class="label">Received</div><div class="value up">${fmtMoney(received)}</div></div>
      <div class="card stat-card"><div class="label">Outstanding</div><div class="value ${expected-received>0?'down':'up'}">${fmtMoney(Math.max(0,expected-received))}</div></div>
    </div>

    <div class="section-title">Last 6 Months</div>
    <div class="card">
      <div style="display:flex;align-items:flex-end;gap:14px;height:140px">
        ${months.map(m=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
          <div class="mono-cell" style="font-size:10.5px;color:var(--text-faint)">${m.value? fmtMoney(m.value).replace('R ','').split(',')[0] : ''}</div>
          <div style="width:60%;background:var(--blue);border-radius:4px 4px 0 0;height:${Math.max(3,(m.value/maxVal)*100)}px"></div>
          <div style="font-size:11px;color:var(--text-dim)">${m.label}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="section-title">Breakdown by Student</div>
    <div class="card" style="${rows.length?'padding:0':''}">
      ${rows.length===0? `<div class="empty-state"><div class="ed">No active students for this month.</div></div>` :
      `<table><tbody>
        ${rows.map(({s,st})=>`<tr>
          <td>${escapeHtml(s.fullName)}</td>
          <td class="mono-cell" style="color:var(--text-faint)">due ${fmtDate(st.due)}</td>
          <td class="mono-cell" style="text-align:right">${fmtMoney(st.paidAmount)} / ${fmtMoney(s.fee)}</td>
          <td style="text-align:right">${st.status==='paid'?'<span class="badge badge-green">PAID</span>':st.status==='overdue'?'<span class="badge badge-red">OVERDUE</span>':'<span class="badge badge-amber">UPCOMING</span>'}</td>
        </tr>`).join('')}
      </tbody></table>`}
    </div>
  `;
}