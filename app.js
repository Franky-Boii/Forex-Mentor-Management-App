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
    console.log("Error loading state:", e);
  }
}

function saveState(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try{
      await storageAdapter.set('app-data', JSON.stringify(state));
    } catch(e){
      showToast('Could not save data locally', true);
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

// start the app
(async function init(){
  await loadState();
  render();
})();