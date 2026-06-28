// Constants
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i); // 06:00 - 21:00
export const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "GBPJPY", "AUDUSD", "USDCAD", "NZDUSD", "EURJPY", "USDCHF"];
export const STAGES = [["prospect", "Prospects"], ["followup", "Follow-Ups"], ["hot", "Hot / Ready"]];

// Currency Formatter (ZAR)
export const fmtZAR = (n) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(Number(n) || 0);

// ID & Date Generators
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthKey = (d) => (d || "").slice(0, 7);
export const thisMonthKey = () => todayISO().slice(0, 7);
export const weekdayAbbr = (dateObj) => DAYS[(dateObj.getDay() + 6) % 7];

// Date Arithmetic
export const parseISO = (iso) => { 
  const [y, m, d] = iso.split("-").map(Number); 
  return new Date(y, m - 1, d); 
};
export const toISO = (dateObj) => { 
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0"); 
  const d = String(dateObj.getDate()).padStart(2, "0"); 
  return `${y}-${m}-${d}`; 
};
export const addDays = (dateObj, n) => { 
  const d = new Date(dateObj); 
  d.setDate(d.getDate() + n); 
  return d; 
};
export const mondayOf = (dateObj) => addDays(dateObj, -((dateObj.getDay() + 6) % 7));
export const fmtDay = (dateObj) => dateObj.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });

// Local Browser Storage Wrappers
export async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    if (!res || res.value === undefined) return fallback;
    return JSON.parse(res.value);
  } catch (e) {
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}