/* =================== APP CONTROLLER & STATE =================== */
// Upgraded state initialization schema to securely handle Phase 2 tracking data arrays
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

/* =================== UPGRADED NETWORK CORE FOR AUTOMATED AI SYNC =================== */
async function loadState() {
  try {
    // 1. Attempt to pull centralized database state directly from your local Python server gateway
    const response = await fetch('http://127.0.0.1:8000/api/state');
    if (response.ok) {
      state = await response.json();
      console.log("Central AI operational core synchronized successfully.");
    } else {
      throw new Error("Server communication mismatch.");
    }
  } catch (e) {
    console.log("Backend server offline. Safely falling back to local device storage device cache.");
    // 2. Local sandbox fallback hook if backend server is not running
    const res = await storageAdapter.get('app-data');
    if (res && res.value) {
      const parsed = JSON.parse(res.value);
      state = Object.assign({ students: [], trades: [], events: [], leads: [], settings: { currency: 'ZAR' } }, parsed);
    }
  }
}

function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      // Step A: Immediately preserve a snapshot to your device local browser sandbox parameters
      await storageAdapter.set('app-data', JSON.stringify(state));

      // Step B: Synchronize the live state array up to your Python backend for Jarvis context ingestion
      await fetch('http://127.0.0.1:8000/api/state/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (e) {
      console.log("State saved locally. Central server synchronization offline.");
    }
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

// start the app automatically upon framework bundle mounting
if (document.getElementById('nav')) {
  (async function init(){
    await loadState();
    render();
  })();
}