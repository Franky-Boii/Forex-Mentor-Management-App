/* =================== CLOUD DATABASE CONNECTION METRICS =================== */
const SUPABASE_URL = "https://wdqtgwdnbbeazlzayxwa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcXRnd2RuYmJlYXpsemF5xHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzA3NjgsImV4cCI6MjA5NzgwNjc2OH0.ohUB3LXQ-wrDXnBbshYMFLycv3m3UY47RlQsWPLLsN4";

// Initialize the remote Supabase client configuration
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const RECORD_ID = "forex_ceo_main";

/* =================== APP CONTROLLER & STATE =================== */
let state = { students: [], trades: [], events: [], leads: [], settings: { currency: 'ZAR' } };
let activeTab = 'dashboard';
let saveTimer = null;
let incomeMonthOffset = 0;

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/* =================== CLOUD DATABASE DATA PERSISTENCE =================== */
async function loadState(){
  try {
    const { data, error } = await supabase
      .from('application_core')
      .select('state_data')
      .eq('id', RECORD_ID)
      .single();

    if (error) throw error;

    if (data && data.state_data) {
      state = Object.assign({students:[],trades:[],events:[],leads:[],settings:{currency:'ZAR'}}, data.state_data);
    }
  } catch (e) {
    console.error("Cloud fetch sync failure:", e);
    showToast("Reading device cache backup", false);

    // Safety Backup: Retrieve local cache data if network connection dips
    const localBackup = localStorage.getItem('app-data-backup');
    if (localBackup) state = JSON.parse(localBackup);
  }
}

function saveState(){
  clearTimeout(saveTimer);
  // Debounce uploads by 400ms to throttle unnecessary network round-trips
  saveTimer = setTimeout(async () => {
    try {
      // Refresh local safety backup instantly on the device
      localStorage.setItem('app-data-backup', JSON.stringify(state));

      // Stream full unified data metrics payload out to the cloud table
      const { error } = await supabase
        .from('application_core')
        .upsert({
          id: RECORD_ID,
          state_data: state,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch(e) {
      console.error("Cloud push sync failure:", e);
      showToast('Sync error. Local backup updated.', true);
    }
  }, 400);
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
  if(!c) return;

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

// Fire up core operational data streams
if (document.getElementById('nav')) {
  (async function init(){
    await loadState();
    render();
  })();
}