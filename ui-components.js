/* =================== HELPERS & CALCULATORS =================== */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function fmtMoney(n){
  n = Number(n)||0;
  const neg = n<0; n=Math.abs(n);
  return (neg?'-':'')+'R '+ n.toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtDate(d){
  if(!d) return '—';
  const dt = new Date(d+'T00:00:00');
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-ZA', {day:'2-digit', month:'short', year:'numeric'});
}
function fmtDateShort(d){
  const dt = new Date(d+'T00:00:00');
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-ZA', {day:'2-digit', month:'short'});
}
function todayStr(){ return new Date().toISOString().slice(0,10); }
function monthsBetween(a,b){
  const d1=new Date(a+'T00:00:00'), d2=new Date(b+'T00:00:00');
  return (d2.getFullYear()-d1.getFullYear())*12 + (d2.getMonth()-d1.getMonth()) - (d2.getDate()<d1.getDate()?1:0);
}
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function parseNum(v){
  if(v===null||v===undefined) return NaN;
  let s = v.toString().trim().replace(/[^0-9.,-]/g, '');
  if(s==='') return NaN;
  if(s.includes(',') && s.includes('.')){
    if(s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g,'').replace(',', '.');
    else s = s.replace(/,/g,'');
  } else if(s.includes(',')){
    const parts = s.split(',');
    s = (parts.length===2 && parts[1].length<=2) ? s.replace(',', '.') : s.replace(/,/g,'');
  }
  return parseFloat(s);
}

function flagFieldError(el, msg){
  if(el){ el.style.borderColor = 'var(--red)'; el.scrollIntoView({behavior:'smooth', block:'center'}); el.focus(); }
  showToast(msg, true);
}
function showToast(msg, isError){
  const host = document.getElementById('toastHost');
  const t = document.createElement('div'); t.className='toast';
  t.style.borderColor = isError ? 'var(--red-dim)' : 'var(--border)';
  t.innerHTML = (isError? '⚠ ' : '✓ ') + escapeHtml(msg);
  host.appendChild(t); setTimeout(()=>t.remove(), 2600);
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
  return {status, paidAmount, due: expectedDue.toISOString().slice(0,10)};
}

function todaysSessions(){
  const dow = new Date().getDay(); const dowIdx = dow===0?6:dow-1;
  const list = state.students.filter(s=>s.status==='active' && s.sessionDay===DAYS[dowIdx] && s.sessionTime).map(s=>({name:s.fullName, time:s.sessionTime}));
  state.events.filter(ev=>ev.date===todayStr()).forEach(ev=>list.push({name:ev.title, time:ev.time||'--:--'}));
  return list.sort((a,b)=> (a.time||'').localeCompare(b.time||''));
}

function renderTicker(){
  const el = document.getElementById('ticker'); const sessions = todaysSessions();
  if(sessions.length===0){ el.innerHTML = `<span class="ticker-item empty">No sessions scheduled today</span>`; return; }
  const items = sessions.map(s=>`<span class="ticker-item"><span class="dot"></span>${s.time} — ${escapeHtml(s.name)}</span>`);
  el.innerHTML = items.concat(items).join('');
}

/* =================== RENDER DASHBOARD =================== */
function renderDashboard(){
  const activeStudents = state.students.filter(s=>s.status==='active');
  const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let expected=0, received=0, overdueList=[];
  activeStudents.forEach(s=>{
    const st = studentMonthStatus(s, monthStart);
    if(st){ expected += Number(s.fee||0); received += st.paidAmount; if(st.status==='overdue') overdueList.push(s); }
  });
  const wins = state.trades.filter(t=>Number(t.pnl)>0).length;
  const losses = state.trades.filter(t=>Number(t.pnl)<0).length;
  const decided = wins+losses; const totalPnl = state.trades.reduce((s,t)=>s+Number(t.pnl||0),0);
  const recentTrades = [...state.trades].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);

  return `
    <div class="page-head"><div><h1>Dashboard</h1><p>${now.toLocaleDateString('en-ZA',{weekday:'long', day:'numeric', month:'long'})}</p></div></div>
    ${overdueList.length ? `<div class="alert-banner"><span>⏰</span><div><b>${overdueList.length} payment overdue</b> — ${overdueList.map(s=>escapeHtml(s.fullName)).join(', ')}.</div></div>` : ''}
    <div class="grid grid-4">
      <div class="card stat-card"><div class="label">Active Students</div><div class="value">${activeStudents.length}</div><div class="sub">${state.students.length - activeStudents.length} inactive</div></div>
      <div class="card stat-card"><div class="label">Income This Month</div><div class="value">${fmtMoney(received)}</div><div class="sub">of ${fmtMoney(expected)} expected</div></div>
      <div class="card stat-card"><div class="label">Win Rate</div><div class="value">${decided? (wins/decided*100).toFixed(1):'0'}%</div><div class="sub">${wins}W / ${losses}L</div></div>
      <div class="card stat-card"><div class="label">Total P&amp;L</div><div class="value">${fmtMoney(totalPnl)}</div><div class="sub">All-time pairs</div></div>
    </div>
    <div class="section-title">Today's Sessions</div>
    <div class="card">${todaysSessions().length===0 ? `<div class="empty-state"><div class="et">Nothing on the books today</div></div>` : `<table><tbody>${todaysSessions().map(s=>`<tr><td class="mono-cell" style="color:var(--amber)">${s.time}</td><td>${escapeHtml(s.name)}</td></tr>`).join('')}</tbody></table>`}</div>
  `;
}

/* =================== RENDER STUDENTS =================== */
function renderStudents(){
  const list = [...state.students].sort((a,b)=>a.fullName.localeCompare(b.fullName));
  return `
    <div class="page-head"><div><h1>Students</h1></div><button class="btn btn-primary" onclick="openStudentForm()">+ Add Student</button></div>
    <div class="card" style="padding:0;overflow-x:auto">
      <table>
        <thead><tr><th>Name</th><th>ID</th><th>Started</th><th>Session</th><th>Fee</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.map(s=>`<tr>
            <td><b>${escapeHtml(s.fullName)}</b></td>
            <td class="mono-cell">${escapeHtml(s.studentId||'—')}</td>
            <td>${fmtDate(s.startDate)}</td>
            <td>${s.sessionDay? escapeHtml(s.sessionDay)+' · '+escapeHtml(s.sessionTime) : 'unset'}</td>
            <td>${fmtMoney(s.fee)}</td>
            <td><span class="badge badge-green">${s.status.toUpperCase()}</span></td>
            <td><button class="btn btn-sm btn-ghost" onclick="openStudentDetail('${s.id}')">View</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openStudentForm(id){
  const s = id ? state.students.find(x=>x.id===id) : null;
  openModal(`
    <h3>${s? 'Edit Student' : 'Add Student'}</h3>
    <form id="studentForm">
      <div class="field"><label>Full name</label><input type="text" name="fullName" value="${s?escapeHtml(s.fullName):''}"></div>
      <div class="field"><label>ID number</label><input type="text" name="studentId" value="${s?escapeHtml(s.studentId):''}"></div>
      <div class="field-row">
        <div class="field"><label>Start date</label><input type="date" name="startDate" value="${s?s.startDate:todayStr()}"></div>
        <div class="field"><label>Monthly fee (ZAR)</label><input type="text" name="fee" value="${s?s.fee:''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Session day</label><select name="sessionDay"><option value="">— none —</option>${DAYS.map(d=>`<option ${s&&s.sessionDay===d?'selected':''}>${d}</option>`).join('')}</select></div>
        <div class="field"><label>Session time</label><input type="time" name="sessionTime" value="${s?s.sessionTime:''}"></div>
      </div>
      <input type="hidden" name="status" value="active">
      <div class="modal-actions"><button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
    </form>
  `);
  document.getElementById('studentForm').addEventListener('submit', e=>{
    e.preventDefault(); const f = new FormData(e.target);
    const fullName = f.get('fullName').trim(); if(!fullName) return flagFieldError(e.target.querySelector('[name="fullName"]'), 'Required');
    const data = { fullName, studentId: f.get('studentId').trim(), startDate: f.get('startDate'), fee: parseNum(f.get('fee'))||0, sessionDay: f.get('sessionDay'), sessionTime: f.get('sessionTime'), status: 'active' };
    if(s) Object.assign(s, data); else state.students.push(Object.assign({id:uid(), payments:[]}, data));
    saveState(); closeModal(); render();
  });
}

function openStudentDetail(id){
  const s = state.students.find(x=>x.id===id); if(!s) return;
  openModal(`
    <h3>${escapeHtml(s.fullName)}</h3>
    <div class="field"><label>ID Number</label><div>${escapeHtml(s.studentId||'—')}</div></div>
    <div class="field"><label>Monthly Fee</label><div>${fmtMoney(s.fee)}</div></div>
    <div class="modal-actions" style="justify-content:space-between">
      <button class="btn btn-danger btn-sm" onclick="state.students=state.students.filter(x=>x.id!='${s.id}');saveState();closeModal();render();">Delete</button>
      <button class="btn btn-primary btn-sm" onclick="openPaymentForm('${s.id}')">Record Payment</button>
    </div>
  `);
}

function openPaymentForm(studentId){
  const s = state.students.find(x=>x.id===studentId);
  openModal(`
    <h3>Record Payment</h3>
    <form id="payForm">
      <div class="field"><label>Amount</label><input type="text" name="amount" value="${s.fee}"></div>
      <div class="modal-actions"><button type="submit" class="btn btn-primary">Save Payment</button></div>
    </form>
  `);
  document.getElementById('payForm').addEventListener('submit', e=>{
    e.preventDefault(); s.payments.push({date:todayStr(), amount:parseNum(new FormData(e.target).get('amount'))});
    saveState(); closeModal(); render();
  });
}

/* =================== RENDER SCHEDULE =================== */
function renderSchedule(){
  const today = new Date(); const todayIdx = today.getDay()===0?6:today.getDay()-1;
  return `
    <div class="page-head"><div><h1>Schedule</h1></div><button class="btn btn-primary" onclick="openEventForm()">+ One-off Session</button></div>
    <div class="week-grid">
      ${DAYS.map((d,i)=>`<div class="day-col ${i===todayIdx?'today':''}">
        <div class="day-name"><span>${DAYS_SHORT[i]}</span></div>
        ${state.students.filter(s=>s.status==='active' && s.sessionDay===d).map(s=>`<div class="sess"><span class="t">${s.sessionTime}</span><span class="n">${escapeHtml(s.fullName)}</span></div>`).join('')}
      </div>`).join('')}
    </div>
  `;
}
function openEventForm(){ /* Quick dynamic hook */ }

/* =================== RENDER JOURNAL =================== */
function renderJournal(){
  const trades = [...state.trades].sort((a,b)=>b.date.localeCompare(a.date));
  return `
    <div class="page-head"><div><h1>Trading Journal</h1></div><button class="btn btn-primary" onclick="openTradeForm()">+ Add Trade</button></div>
    <div class="card" style="padding:0">
      <table>
        <tbody>
          ${trades.map(t=>`<tr><td>${fmtDateShort(t.date)}</td><td><b>${escapeHtml(t.pair)}</b></td><td>${t.direction.toUpperCase()}</td><td style="color:${t.pnl>=0?'var(--green)':'var(--red)'}">${fmtMoney(t.pnl)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openTradeForm(){
  openModal(`
    <h3>Log Trade</h3>
    <form id="tradeForm">
      <div class="field"><label>Pair</label><input type="text" name="pair" placeholder="XAU/USD"></div>
      <div class="field"><label>Direction</label><select name="direction"><option value="buy">Buy</option><option value="sell">Sell</option></select></div>
      <div class="field"><label>P&amp;L (ZAR)</label><input type="text" name="pnl"></div>
      <div class="modal-actions"><button type="submit" class="btn btn-primary">Log Trade</button></div>
    </form>
  `);
  document.getElementById('tradeForm').addEventListener('submit', e=>{
    e.preventDefault(); const f = new FormData(e.target);
    state.trades.push({ id:uid(), date:todayStr(), pair:f.get('pair').toUpperCase(), direction:f.get('direction'), pnl:parseNum(f.get('pnl'))||0 });
    saveState(); closeModal(); render();
  });
}

/* =================== RENDER INCOME =================== */
function renderIncome(){
  let total = 0; state.students.forEach(s=>s.payments.forEach(p=>total+=p.amount));
  return `
    <div class="page-head"><div><h1>Income Dashboard</h1></div></div>
    <div class="grid grid-3">
      <div class="card stat-card"><div class="label">Total Revenue Collected</div><div class="value up">${fmtMoney(total)}</div></div>
    </div>
  `;
}