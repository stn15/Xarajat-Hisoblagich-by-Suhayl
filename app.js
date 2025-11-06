/**
 * app.js — Final integrated file (v1 behaviors + new features)
 * - Preserves original UI and behavior (dark/light, categories, add/edit/delete, charts, goals)
 * - Adds: PIN prompt, currency rates, per-item currency (originalAmount/originalCurrency + amountUZS),
 *         migration for old data, recurring engine, soft-trash + undo toast + trash modal,
 *         export/import JSON & CSV, budgets + notifications, defensive DOM fallbacks.
 *
 * Replace your existing app.js with this file (backup first).
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ---------------------------
  // Small helpers
  // ---------------------------
  const $ = id => document.getElementById(id);
  function noop() {}
  function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function highlightMatch(text, keyword) {
    if (!keyword) return escapeHtml(text);
    const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return escapeHtml(text).replace(re, '<mark>$1</mark>');
  }

  // ---------------------------
  // Currency rates (best-effort)
  // ---------------------------
  let kursUSD = 12000, kursRUB = 140;
  async function fetchRates() {
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/UZS', { cache: 'no-store' });
      const d = await r.json();
      if (d && d.rates && d.rates.USD && d.rates.RUB) {
        kursUSD = 1 / d.rates.USD;
        kursRUB = 1 / d.rates.RUB;
      }
    } catch (e) { /* ignore network errors */ }
  }
  fetchRates().catch(noop);
  setInterval(()=>fetchRates().catch(noop), 1000*60*60*3);

  function convert(amount, from, to) {
    amount = Number(amount) || 0;
    if (from === to) return amount;
    if (from === "UZS" && to === "USD") return amount / kursUSD;
    if (from === "UZS" && to === "RUB") return amount / kursRUB;
    if (from === "USD" && to === "UZS") return amount * kursUSD;
    if (from === "USD" && to === "RUB") return (amount * kursUSD) / kursRUB;
    if (from === "RUB" && to === "UZS") return amount * kursRUB;
    if (from === "RUB" && to === "USD") return (amount * kursRUB) / kursUSD;
    return amount;
  }

  // ---------------------------
  // PIN prompt (simple, kept original)
  // ---------------------------
  const PIN_KEY = 'user_pin';
  const PIN_TRIES_KEY = 'pin_tries';
  function askPinIfNeeded() {
    const savedPin = localStorage.getItem(PIN_KEY);
    if (!savedPin) return true;
    let tries = Number(localStorage.getItem(PIN_TRIES_KEY) || "0");
    while (true) {
      const userPin = prompt("Ilovaga kirish uchun PIN kodni kiriting:");
      if (userPin === null) return false;
      if (userPin === savedPin) {
        localStorage.setItem(PIN_TRIES_KEY, "0");
        return true;
      } else {
        tries++;
        localStorage.setItem(PIN_TRIES_KEY, String(tries));
        if (tries >= 10) {
          if (confirm("10 marta noto'g'ri urinish! Eski ma'lumotlarni o'chirib tashlab, yangidan boshlaysizmi?")) {
            localStorage.clear();
            alert("Ma'lumotlar o'chirildi. Ilova yangidan boshlanadi.");
            location.reload();
            return false;
          } else {
            alert("Ilovaga kira olmaysiz.");
            return false;
          }
        } else {
          alert(`Noto'g'ri PIN! Qolgan urinishlar: ${10 - tries}`);
        }
      }
    }
  }
  if (!askPinIfNeeded()) return;

  // ---------------------------
  // Hide splash
  // ---------------------------
  setTimeout(()=>{ const s = $('splash'); if (s) s.classList.add('hide'); }, 1700);

  // ---------------------------
  // DOM elements (v1 expected IDs; defensive checks used)
  // ---------------------------
  const nameEl = $('name');
  const amountEl = $('amount');
  const dateEl = $('date');
  const categoryEl = $('category');
  const addBtn = $('addBtn');
  const listEl = $('list');
  const totalEl = $('total');
  const searchEl = $('search');
  const filterCatEl = $('filterCategory');
  const chartCanvas = $('expenseChart');
  const themeSwitch = $('themeSwitch');
  const langSwitch = $('langSwitch');
  const currencySwitch = $('currencySwitch');
  const currencyLabel = $('currencyLabel');
  const limitInput = $('limitInput');
  const limitSaveBtn = $('limitSaveBtn');
  const limitNotice = $('limitNotice');
  const addCatBtn = $('addCategoryBtn');
  const catModal = $('catModal');
  const newCatName = $('newCatName');
  const newCatEmoji = $('newCatEmoji');
  const saveCatBtn = $('saveCatBtn');
  const closeCatModal = $('closeCatModal');

  const homePage = $('homePage');
  const chartPage = $('chartPage');
  const goalPage = $('goalPage');
  const tabHome = $('tabHome');
  const tabChart = $('tabChart');
  const tabGoal = $('tabGoal');

  const statsChart = $('statsChart');
  const showTodayBtn = $('showTodayBtn');
  const showYesterdayBtn = $('showYesterdayBtn');
  const show7DaysBtn = $('show7DaysBtn');
  const statDate = $('statDate');
  const statsList = $('statsList');

  const tabSettings = $('tabSettings');
  const settingsPage = $('settingsPage');
  const pinInput = $('pinInput');
  const savePinBtn = $('savePinBtn');
  const removePinBtn = $('removePinBtn');
  const closeSettingsBtn = $('closeSettingsBtn');

  const catStatsModal = $('catStatsModal');
  const catStatsTitle = $('catStatsTitle');
  const catStatsInfo = $('catStatsInfo');
  const catStatsChart = $('catStatsChart');
  const closeCatStatsModal = $('closeCatStatsModal');

  const goalNameEl = $('goalName');
  const goalTargetEl = $('goalTarget');
  const addGoalBtn = $('addGoalBtn');
  const goalListDiv = $('goalList');
  const goalCurrency = $('goalCurrency');

  const exportJsonBtn = $('exportJsonBtn');
  const exportCsvBtn = $('exportCsvBtn');
  const importBtn = $('importBtn');
  let importFile = $('importFile');
  if (!importFile) {
    importFile = document.createElement('input'); importFile.type='file'; importFile.id='importFile'; importFile.accept='.json,.csv'; importFile.style.display='none'; document.body.appendChild(importFile);
  }

  const trashBtn = $('trashBtn');
  const recurringBtn = $('recurringBtn');

  // ---------------------------
  // Storage keys and initial state
  // ---------------------------
  const STORAGE_KEY = 'expenses_v3';
  const CAT_KEY = 'categories_v2';
  const LIMIT_KEY = 'limit_v2';
  const LANG_KEY = 'lang_v2';
  const CUR_KEY = 'currency_v2';
  const THEME_KEY = 'theme_v2';
  const GOALS_KEY = 'goal_list';
  const RECUR_KEY = 'recurring_v1';
  const TRASH_KEY = 'trash_v1';
  const BUDGETS_KEY = 'budgets_v1';

  let expenses = [];
  let categories = [
    { name: "Ovqat", emoji: "🍔" },
    { name: "Kiyim", emoji: "👕" },
    { name: "Dorilar", emoji: "💊" },
    { name: "Mashina", emoji: "🚗" },
    { name: "Uy", emoji: "🏠" },
    { name: "Bolalar", emoji: "🧸" },
    { name: "Boshqa", emoji: "📦" }
  ];
  let recurring = [];
  let trash = [];
  let budgets = {};
  let goalList = [];
  let editingId = null;
  let limit = Number(localStorage.getItem(LIMIT_KEY) || "0");
  let lang = localStorage.getItem(LANG_KEY) || "uz";
  let currency = localStorage.getItem(CUR_KEY) || "UZS";
  let theme = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  try {
    const raw = localStorage.getItem(STORAGE_KEY); if (raw) expenses = JSON.parse(raw);
    const cr = localStorage.getItem(CAT_KEY); if (cr) categories = JSON.parse(cr);
    const gr = localStorage.getItem(GOALS_KEY); if (gr) goalList = JSON.parse(gr);
    const rr = localStorage.getItem(RECUR_KEY); if (rr) recurring = JSON.parse(rr);
    const tr = localStorage.getItem(TRASH_KEY); if (tr) trash = JSON.parse(tr);
    const br = localStorage.getItem(BUDGETS_KEY); if (br) budgets = JSON.parse(br);
  } catch (e) { /* ignore parse errors */ }

  // ---------------------------
  // Storage helpers & formatters
  // ---------------------------
  function save() { try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }catch(e){} }
  function saveCategories() { try{ localStorage.setItem(CAT_KEY, JSON.stringify(categories)); }catch(e){} }
  function saveGoals() { try{ localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); }catch(e){} }
  function saveRecurring() { try{ localStorage.setItem(RECUR_KEY, JSON.stringify(recurring)); }catch(e){} }
  function saveTrash() { try{ localStorage.setItem(TRASH_KEY, JSON.stringify(trash)); }catch(e){} }
  function saveBudgets() { try{ localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)); }catch(e){} }

  function formatNumberByCurrencyUZS(uzsAmount) {
    uzsAmount = Number(uzsAmount) || 0;
    if (currency === "UZS") return uzsAmount.toLocaleString("uz-UZ");
    if (currency === "USD") return (uzsAmount / kursUSD).toFixed(2);
    if (currency === "RUB") return (uzsAmount / kursRUB).toFixed(2);
    return uzsAmount.toLocaleString();
  }

  // ---------------------------
  // Migration: old amount -> amountUZS
  // ---------------------------
  (function migrateIfNeeded(){
    const savedCurrency = localStorage.getItem(CUR_KEY) || 'UZS';
    let changed = false;
    for (let e of expenses) {
      if (e.amount != null && !e.amountUZS && !e.originalCurrency) {
        const orig = Number(e.amount);
        const amountUZS = Math.round(convert(orig, savedCurrency, 'UZS'));
        e.originalAmount = orig;
        e.originalCurrency = savedCurrency;
        e.amountUZS = amountUZS;
        changed = true;
      } else if (e.amountUZS && !e.originalCurrency) {
        e.originalAmount = e.amountUZS;
        e.originalCurrency = 'UZS';
        changed = true;
      }
    }
    if (changed) save();
  })();

  // ---------------------------
  // Theme handling (v1 preserved)
  // ---------------------------
  function applyTheme(newTheme) {
    document.body.classList.remove('light-mode','dark-mode');
    document.body.classList.add(newTheme+'-mode');
    if (themeSwitch) themeSwitch.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    if (window.Chart) {
      Chart.defaults.color = newTheme === "dark" ? "#cbd5e1" : "#222";
      Chart.defaults.plugins = Chart.defaults.plugins || {};
      Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || {};
      Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
      Chart.defaults.plugins.legend.labels.color = newTheme === "dark" ? "#cbd5e1" : "#222";
    }
    document.querySelectorAll(".cat, #statsList, .goal-title, .goal-meta").forEach(e => { e.style.color = newTheme === "dark" ? "#cbd5e1" : "#222"; });
  }
  function getSystemTheme() { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  if (!theme) { theme = getSystemTheme(); localStorage.setItem(THEME_KEY, theme); }
  applyTheme(theme);
  if (themeSwitch) themeSwitch.addEventListener('click', ()=> { theme = (theme === 'dark') ? 'light' : 'dark'; localStorage.setItem(THEME_KEY, theme); applyTheme(theme); renderList(); renderGoalList(); showStatsToday(); });
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { if (!localStorage.getItem(THEME_KEY)) { theme = e.matches ? 'dark' : 'light'; applyTheme(theme); } }); } catch(e){}

  // ---------------------------
  // Date helper
  // ---------------------------
  function setTodayDate() {
    if (!dateEl) return;
    const t = new Date(); const yyyy = t.getFullYear(); const mm = String(t.getMonth()+1).padStart(2,'0'); const dd = String(t.getDate()).padStart(2,'0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }
  setTodayDate();

  // ---------------------------
  // Render categories (v1)
  // ---------------------------
  function renderCategories() {
    if (!categoryEl || !filterCatEl) return;
    categoryEl.innerHTML = "";
    filterCatEl.innerHTML = `<option value="">Barchasi</option>`;
    categories.forEach(cat => {
      const html = `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.emoji)} ${escapeHtml(cat.name)}</option>`;
      categoryEl.insertAdjacentHTML('beforeend', html);
      filterCatEl.insertAdjacentHTML('beforeend', html);
    });
  }
  renderCategories();

  // ---------------------------
  // Chart & List rendering
  // ---------------------------
  let expChart = null;
  function renderChart(filtered) {
    if (!chartCanvas) return;
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => filtered.filter(e => e.category === cat && !e.deleted).reduce((sum,e)=>sum + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    if (expChart) try{ expChart.destroy(); }catch(e){}
    if (window.Chart) {
      expChart = new Chart(chartCanvas, { type:'doughnut', data:{ labels:cats, datasets:[{ data, backgroundColor:["#ff9800","#2196f3","#4caf50","#9c27b0","#ffeb3b","#e91e63","#607d8b"] }] }, options:{ plugins:{ legend:{ position:'bottom', labels:{ color: theme === "dark" ? "#cbd5e1" : "#222" } } } } });
    }
  }

  function calcTotal(list = expenses) {
    return list.reduce((s,it) => s + Number(it.amountUZS != null ? it.amountUZS : it.amount || 0), 0);
  }
  function getMonthExpenses(list = expenses) {
    const now = new Date();
    return list.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && !e.deleted;
    });
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';
    const keyword = (searchEl?.value ?? '').toLowerCase();
    const filterCat = (filterCatEl?.value ?? '');
    const filtered = expenses.filter(item => !item.deleted).filter(item => {
      const matchName = (item.name || '').toLowerCase().includes(keyword);
      const matchCat = !filterCat || item.category === filterCat;
      return matchName && matchCat;
    }).sort((a,b)=> new Date(b.date) - new Date(a.date));
    for (const item of filtered) {
      const li = document.createElement('li');
      const cat = categories.find(c=>c.name===item.category) || { emoji:'', name:item.category };
      const baseUZS = Number(item.amountUZS != null ? item.amountUZS : item.amount || 0);
      const displayAmount = formatNumberByCurrencyUZS(baseUZS);
      const left = document.createElement('div');
      left.innerHTML = `
        <span>${highlightMatch(item.name, keyword)}</span>
        <span class="cat">${escapeHtml(cat.emoji)} ${escapeHtml(item.category)}</span>
        <span>${displayAmount} ${currency}</span>
        <span style="margin-left:8px; color:#bbb;">${item.date ? item.date : ''}</span>
      `;
      const editBtn = document.createElement('button'); editBtn.className='del-btn'; editBtn.textContent='✏️'; editBtn.title='Tahrirlash';
      editBtn.addEventListener('click', ()=> editExpense(item.id));
      const delBtn = document.createElement('button'); delBtn.className='del-btn'; delBtn.textContent='❌'; delBtn.title="O'chirish";
      delBtn.addEventListener('click', ()=> softDeleteExpense(item.id));
      li.appendChild(left); li.appendChild(editBtn); li.appendChild(delBtn);
      listEl.appendChild(li);
    }
    const totalUZS = calcTotal(getMonthExpenses(expenses));
    totalEl && (totalEl.textContent = formatNumberByCurrencyUZS(totalUZS));
    currencyLabel && (currencyLabel.textContent = currency === "UZS" ? "so'm" : (currency === "USD" ? "$" : "₽"));
    renderChart(filtered);
    const monthTotalUZS = calcTotal(getMonthExpenses(expenses));
    if (limit > 0 && monthTotalUZS > limit) limitNotice && (limitNotice.textContent = `Diqqat! Oylik limitdan oshib ketdingiz. (${formatNumberByCurrencyUZS(monthTotalUZS)} ${currency})`);
    else limitNotice && (limitNotice.textContent = '');
    checkBudgets();
  }

  // ---------------------------
  // Ensure itemCurrency select exists near amount input
  // ---------------------------
  let itemCurrencyEl = $('itemCurrency');
  if (!itemCurrencyEl && amountEl) {
    const s = document.createElement('select'); s.id='itemCurrency';
    [['UZS','UZS'],['USD','USD'],['RUB','RUB']].forEach(([v,l])=> { const o=document.createElement('option'); o.value=v; o.textContent=l; s.appendChild(o); });
    amountEl.insertAdjacentElement('afterend', s);
    itemCurrencyEl = s;
  }

  // ---------------------------
  // Add / Edit expense (per-item currency)
  // ---------------------------
  function addOrEditExpense() {
    const name = nameEl?.value.trim() || '';
    const amountRaw = amountEl?.value.trim() || '';
    const category = categoryEl?.value || (categories[0] && categories[0].name);
    const date = dateEl?.value || (new Date().toISOString().slice(0,10));
    if (!name || !amountRaw) { alert("Iltimos, nom va summani kiriting!"); return; }
    const inputAmount = parseFloat(amountRaw);
    if (isNaN(inputAmount) || !isFinite(inputAmount)) { alert("Iltimos, to'g'ri summa kiriting!"); return; }
    const inputCurrency = itemCurrencyEl?.value || currency;
    const amountUZS = Math.round(convert(inputAmount, inputCurrency, 'UZS'));
    const nowIso = new Date().toISOString();
    if (editingId) {
      const exp = expenses.find(e=>e.id === editingId);
      if (exp) {
        exp.name = name;
        exp.amountUZS = amountUZS;
        exp.originalAmount = inputAmount;
        exp.originalCurrency = inputCurrency;
        exp.category = category;
        exp.date = date;
        exp.updatedAt = nowIso;
      }
      editingId = null;
      addBtn && (addBtn.textContent = "➕ Qo'shish");
    } else {
      const expense = { id: Date.now().toString()+Math.floor(Math.random()*1000), name, amountUZS, originalAmount: inputAmount, originalCurrency: inputCurrency, category, date, createdAt: nowIso, updatedAt: nowIso, deleted:false };
      expenses.push(expense);
    }
    save(); renderList(); if (nameEl) nameEl.value=''; if (amountEl) amountEl.value=''; setTodayDate(); nameEl && nameEl.focus();
  }

  function editExpense(id) {
    const exp = expenses.find(e=>e.id === id); if (!exp) return;
    nameEl && (nameEl.value = exp.name || '');
    if (itemCurrencyEl) itemCurrencyEl.value = exp.originalCurrency || currency;
    if (amountEl) amountEl.value = exp.originalAmount != null ? exp.originalAmount : Number(convert(exp.amountUZS || 0, 'UZS', itemCurrencyEl ? itemCurrencyEl.value : currency)).toFixed(2);
    if (categoryEl) categoryEl.value = exp.category;
    if (dateEl) dateEl.value = exp.date;
    editingId = id;
    addBtn && (addBtn.textContent = "✏️ Saqlash");
  }

  // ---------------------------
  // Soft delete / Undo / Restore
  // ---------------------------
  function ensureToastArea() {
    let area = $('xh-toast-area');
    if (!area) {
      area = document.createElement('div'); area.id='xh-toast-area';
      area.style.position='fixed'; area.style.left='16px'; area.style.bottom='80px'; area.style.zIndex='12000';
      document.body.appendChild(area);
    }
    return area;
  }
  function showUndoToast(text, undoCb, timeout=8000) {
    const area = ensureToastArea();
    const card = document.createElement('div'); card.className='xh-toast';
    card.style.background='linear-gradient(90deg,#8b5cf6,#4f46e5)'; card.style.color='#fff'; card.style.padding='10px'; card.style.borderRadius='8px'; card.style.marginBottom='8px';
    card.innerHTML = `<span>${escapeHtml(text)}</span> <button class="xh-undo-btn" style="margin-left:10px;padding:6px;border-radius:6px;background:rgba(255,255,255,0.12);color:#fff;border:none">Bekor qilish</button>`;
    const btn = card.querySelector('button'); area.appendChild(card);
    const timer = setTimeout(()=>{ try{ card.remove(); }catch(e){} }, timeout);
    btn.addEventListener('click', ()=>{ clearTimeout(timer); try{ undoCb(); }catch(e){} try{ card.remove(); }catch(e){} });
  }

  function softDeleteExpense(id) {
    const idx = expenses.findIndex(e=>e.id === id);
    if (idx === -1) return;
    const [it] = expenses.splice(idx,1);
    it.deleted = true; it.deletedAt = new Date().toISOString();
    trash.unshift(it); save(); saveTrash(); renderList();
    showUndoToast(`"${it.name}" o'chirildi`, ()=> restoreFromTrash(it.id), 10000);
  }

  function restoreFromTrash(id) {
    const idx = trash.findIndex(t=>t.id===id);
    if (idx === -1) return;
    const [it] = trash.splice(idx,1);
    delete it.deleted; delete it.deletedAt;
    expenses.push(it); save(); saveTrash(); renderList(); showNotification('Tiklash', `"${it.name}" tiklandi.`);
  }

  // ---------------------------
  // Trash modal
  // ---------------------------
  function showTrashModal() {
    let modal = $('xh-trash-modal');
    if (!modal) {
      modal = document.createElement('div'); modal.id='xh-trash-modal'; modal.className='xh-modal';
      modal.innerHTML = `<div class="xh-modal-inner"><h3>Trash - O'chirilgan yozuvlar</h3><div id="xh-trash-list" style="max-height:300px;overflow:auto"></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;"><button id="xh-trash-close" class="small-ctrl">Yopish</button><button id="xh-trash-clear" class="small-ctrl danger">Tozalash</button></div></div>`;
      document.body.appendChild(modal);
      document.getElementById('xh-trash-close').addEventListener('click', ()=> modal.remove());
      document.getElementById('xh-trash-clear').addEventListener('click', ()=> { if (confirm("Trash tozalansinmi?")) { trash=[]; saveTrash(); modal.remove(); renderList(); } });
    }
    const list = document.getElementById('xh-trash-list'); list.innerHTML = '';
    if (!trash.length) list.innerHTML = `<div style="color:var(--muted);padding:12px;text-align:center">Trash bo'sh</div>`;
    for (let t of trash) {
      const item = document.createElement('div'); item.className='xh-trash-item';
      item.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><b>${escapeHtml(t.name)}</b><div style="font-size:13px;color:var(--muted)">${t.date} · ${t.category}</div></div><div style="display:flex;gap:8px"><button class="xh-restore small-ctrl">Tiklash</button><button class="xh-delete small-ctrl danger">O'chirish</button></div></div>`;
      list.appendChild(item);
      item.querySelector('.xh-restore').addEventListener('click', ()=> { restoreFromTrash(t.id); showTrashModal(); });
      item.querySelector('.xh-delete').addEventListener('click', ()=> { if (confirm("Bu yozuvni doimiy o'chirishni tasdiqlaysizmi?")) { trash = trash.filter(x=>x.id!==t.id); saveTrash(); showTrashModal(); } });
    }
    modal.style.position='fixed'; modal.style.left='0'; modal.style.top='0'; modal.style.right='0'; modal.style.bottom='0'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; modal.style.background='rgba(0,0,0,0.35)';
    modal.querySelector('.xh-modal-inner').style.background='var(--goal-bg)'; modal.querySelector('.xh-modal-inner').style.padding='18px';
  }

  // ---------------------------
  // Notifications helper
  // ---------------------------
  function showNotification(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification(title, { body });
    else if (Notification.permission !== "denied") Notification.requestPermission().then(p=> { if (p === "granted") new Notification(title, { body }); });
  }

  // ---------------------------
  // Budgets
  // ---------------------------
  function setBudgetForMonth(monthKey, amount, categoryBudgets = {}) {
    budgets[monthKey] = budgets[monthKey] || { total:0, categories: {} };
    budgets[monthKey].total = amount; budgets[monthKey].categories = categoryBudgets; saveBudgets();
  }
  function checkBudgets() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthBudget = budgets[monthKey] || null;
    if (!monthBudget) return;
    const monthTotalUZS = calcTotal(getMonthExpenses(expenses));
    if (monthBudget.total > 0 && monthTotalUZS >= monthBudget.total) showNotification("Budjet tugadi", `Sizning oylik byudjetingiz ${formatNumberByCurrencyUZS(monthBudget.total)} ${currency} tugadi.`);
    for (let cat of Object.keys(monthBudget.categories || {})) {
      const catLimit = monthBudget.categories[cat];
      const catSum = getMonthExpenses(expenses).filter(e=>e.category===cat).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0);
      if (catLimit > 0 && catSum >= catLimit) showNotification("Kategoriya byudjeti tugadi", `${cat} uchun belgilangan oylik limit oshdi.`);
    }
  }

  // ---------------------------
  // Recurring engine
  // ---------------------------
  function addRecurring(rule) { rule.id = rule.id || Date.now().toString(); recurring.push(rule); saveRecurring(); }
  function processRecurring() {
    try {
      const today = new Date().toISOString().slice(0,10);
      const created = [];
      for (let r of recurring) {
        while (r.nextDate && r.nextDate <= today) {
          const already = expenses.some(e=>e._recurringId===r.id && e.date === r.nextDate);
          if (!already) {
            const amountUZS = Math.round(convert(Number(r.amount || 0), r.currency || 'UZS', 'UZS'));
            const inst = { id: Date.now().toString()+Math.floor(Math.random()*1000), name: r.name, amountUZS, originalAmount: Number(r.amount || 0), originalCurrency: r.currency || 'UZS', category: r.category || (categories[0] && categories[0].name) || 'Boshqa', date: r.nextDate, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _recurringId: r.id };
            expenses.push(inst); created.push(inst);
          }
          const nd = new Date(r.nextDate + 'T00:00:00');
          if (r.interval === 'daily') nd.setDate(nd.getDate()+1);
          else if (r.interval === 'weekly') nd.setDate(nd.getDate()+7);
          else nd.setMonth(nd.getMonth()+1);
          r.nextDate = nd.toISOString().slice(0,10);
          if (r.endDate && r.nextDate > r.endDate) { r.nextDate = null; break; }
        }
      }
      if (created.length) { save(); saveRecurring(); showNotification("Takrorlanuvchi xarajatlar qo'shildi", `${created.length} ta avtomatik xarajat qo'shildi.`); }
      else saveRecurring();
    } catch (e) {}
  }
  processRecurring();
  document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState === 'visible') processRecurring(); });

  // ---------------------------
  // Export / Import
  // ---------------------------
  function exportJSON() {
    const dump = { meta:{ exportedAt: new Date().toISOString(), currencyBase:'UZS'}, expenses, categories, recurring, budgets, goals: goalList };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `xarajat_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
  }
  function exportCSV() {
    const rows = [['id','name','date','amountUZS','originalAmount','originalCurrency','category','createdAt']];
    for (let e of expenses) rows.push([e.id, e.name, e.date, e.amountUZS || 0, e.originalAmount || '', e.originalCurrency || '', e.category, e.createdAt || '']);
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `xarajat_export_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  function importJSONFile(file) {
    const reader = new FileReader();
    reader.onload = (e)=> {
      try {
        const data = JSON.parse(e.target.result);
        if (data.expenses && Array.isArray(data.expenses)) {
          if (confirm("Ma'lumotlarni mavjudlarga qo'shasizmi? (OK = qo'shish, Cancel = yangilash)")) {
            const existing = new Set(expenses.map(x=>x.id)); let added=0;
            for (let it of data.expenses) if (!existing.has(it.id)) { expenses.push(it); added++; }
            save(); renderList(); alert(`${added} ta yozuv qo'shildi.`);
          } else {
            expenses = data.expenses; categories = data.categories || categories; recurring = data.recurring || recurring; budgets = data.budgets || budgets; goalList = data.goals || goalList;
            save(); saveCategories(); renderCategories(); renderList(); alert("Ma'lumotlar yangilandi.");
          }
        } else alert("Fayl formati noto'g'ri.");
      } catch (err) { alert("JSON o'qishda xatolik: " + err.message); }
    };
    reader.readAsText(file);
  }
  function importCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e)=> {
      try {
        const text = e.target.result; const lines = text.split(/\r?\n/).filter(Boolean);
        if (!lines.length) { alert("CSV bo'sh"); return; }
        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,''));
        const added = [];
        for (let i=1;i<lines.length;i++) {
          const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v=>v.replace(/^"|"$/g,'')) || [];
          if (!values.length) continue;
          const rec = {}; headers.forEach((h,j)=> rec[h] = values[j] || '');
          const eItem = { id: rec.id || Date.now().toString()+i, name: rec.name || 'Untitled', date: rec.date || new Date().toISOString().slice(0,10), amountUZS: Number(rec.amountUZS) || Math.round(convert(Number(rec.originalAmount || 0), rec.originalCurrency || 'UZS', 'UZS')), originalAmount: rec.originalAmount || '', originalCurrency: rec.originalCurrency || 'UZS', category: rec.category || (categories[0] && categories[0].name) || 'Boshqa', createdAt: rec.createdAt || new Date().toISOString() };
          expenses.push(eItem); added.push(eItem);
        }
        save(); renderList(); alert(`${added.length} ta yozuv CSV orqali import qilindi.`);
      } catch (err) { alert('Import CSV failed: ' + err.message); }
    };
    reader.readAsText(file);
  }

  // ---------------------------
  // Category stats modal wiring
  // ---------------------------
  let catStatsChartObj = null;
  if (closeCatStatsModal) closeCatStatsModal.addEventListener('click', ()=> { catStatsModal && catStatsModal.classList.remove('active'); if (catStatsChartObj) try{ catStatsChartObj.destroy(); }catch(e){} });

  function openCategoryStats(categoryName) {
    const catExps = expenses.filter(e=>e.category===categoryName && !e.deleted);
    if (!catExps.length) return;
    const total = catExps.reduce((s,it)=>s + Number(it.amountUZS != null ? it.amountUZS : it.amount || 0), 0);
    let byDay = {};
    for (let e of catExps) byDay[e.date] = (byDay[e.date]||0) + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0);
    let maxDay = Object.keys(byDay).length ? Object.keys(byDay).reduce((a,b)=> byDay[a]>byDay[b] ? a : b) : "-";
    let maxSum = byDay[maxDay] || 0;
    let days = [], data=[];
    for (let i=6;i>=0;i--) { let d=new Date(Date.now()-86400000*i); let ds=d.toISOString().slice(0,10); days.push(ds); data.push(catExps.filter(e=>e.date===ds).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0)); }
    catStatsTitle && (catStatsTitle.textContent = `Statistika: ${categoryName}`);
    catStatsInfo && (catStatsInfo.innerHTML = `<b>Umumiy:</b> ${formatNumberByCurrencyUZS(total)} ${currency}<br><b>Ko'p sarflangan kun:</b> ${maxDay} (${formatNumberByCurrencyUZS(maxSum)} ${currency})`);
    if (catStatsChartObj) try{ catStatsChartObj.destroy(); }catch(e){}
    if (window.Chart && catStatsChart) {
      catStatsChartObj = new Chart(catStatsChart, { type:'bar', data:{ labels: days, datasets:[{ label:"7 kunlik trend", data, backgroundColor: theme==='dark' ? "#8b5cf6" : "#4caf50" }] }, options:{ scales:{ x:{ ticks:{ color: theme==='dark' ? "#cbd5e1" : "#222" }, grid:{ color: theme==='dark' ? "#22242c" : "#e0e7ef" } }, y:{ beginAtZero:true, ticks:{ color: theme==='dark' ? "#cbd5e1" : "#222" }, grid:{ color: theme==='dark' ? "#22242c" : "#e0e7ef" } } }, plugins:{ legend:{display:false} } } });
    }
    catStatsModal && catStatsModal.classList.add('active');
  }

  // ---------------------------
  // Stats chart helpers (v1)
  // ---------------------------
  let statsChartObj = null;
  function renderStatsChart(labels, data) {
    if (statsChartObj) try{ statsChartObj.destroy(); }catch(e){}
    if (window.Chart && statsChart) {
      statsChartObj = new Chart(statsChart, { type:'bar', data:{ labels, datasets:[{ label:'Sarflangan summa', data, backgroundColor: theme==='dark' ? "#8b5cf6" : "#4caf50" }] }, options:{ scales:{ x:{ ticks:{ color: theme==='dark' ? "#cbd5e1" : "#222" }, grid:{ color: theme==='dark' ? "#22242c" : "#e0e7ef" } }, y:{ beginAtZero:true, ticks:{ color: theme==='dark' ? "#cbd5e1" : "#222" }, grid:{ color: theme==='dark' ? "#22242c" : "#e0e7ef" } } }, plugins:{ legend:{display:false} } } });
    }
  }
  function showStatsToday() {
    const today = new Date(); const key = today.toISOString().slice(0,10);
    const todayExp = expenses.filter(e=>e.date===key && !e.deleted);
    statDate && (statDate.textContent = `Bugun: ${key}`);
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => todayExp.filter(e=>e.category===cat).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    renderStatsChart(cats, data);
    statsList && (statsList.innerHTML = cats.map((cat,i)=>`<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${formatNumberByCurrencyUZS(data[i])}</b></span>`).join("<br>"));
  }
  function showStatsYesterday() {
    const y = new Date(Date.now()-86400000); const key = y.toISOString().slice(0,10);
    const yExp = expenses.filter(e=>e.date===key && !e.deleted);
    statDate && (statDate.textContent = `Kecha: ${key}`);
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => yExp.filter(e=>e.category===cat).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    renderStatsChart(cats, data);
    statsList && (statsList.innerHTML = cats.map((cat,i)=>`<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${formatNumberByCurrencyUZS(data[i])}</b></span>`).join("<br>"));
  }
  function showStats7Days() {
    let days=[]; for (let i=6;i>=0;i--) { let d=new Date(Date.now()-86400000*i); days.push(d.toISOString().slice(0,10)); }
    const data = days.map(day => expenses.filter(e=>e.date===day && !e.deleted).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    statDate && (statDate.textContent = `Oxirgi 7 kun: ${days[0]} - ${days[6]}`);
    statsList && (statsList.innerHTML = days.map((day,i)=>`<span class="cat-link" data-cat="${categories[i] ? categories[i].name : ''}">${day}: <b>${formatNumberByCurrencyUZS(data[i])}</b></span>`).join("<br>"));
    renderStatsChart(days, data);
  }

  // ---------------------------
  // GOALS (define before initial calls)
  // ---------------------------
  function saveGoalsLocal(){ try{ localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); }catch(e){} }
  function renderGoalList(){
    if (!goalListDiv) return;
    goalListDiv.innerHTML = '';
    if (!goalList.length) { goalListDiv.innerHTML = `<div style='text-align:center;color:var(--muted);margin-top:18px;'>Maqsadlar hali yo'q</div>`; return; }
    goalList.forEach((goal, idx) => {
      let current = goal.current || 0;
      let percent = Math.min(100, Math.round(current / goal.target * 100));
      let weekData = goal.progressHistory || [];
      let haftalikQoshimcha = weekData.length>1 ? weekData[weekData.length-1].amount - weekData[0].amount : current;
      haftalikQoshimcha = haftalikQoshimcha || 0;
      let haftadaKun = weekData.length>1 ? Math.round((new Date(weekData[weekData.length-1].date)-new Date(weekData[0].date))/86400000) : 7;
      haftadaKun = haftadaKun<=0?1:haftadaKun;
      let haftalikOrtacha = haftalikQoshimcha / haftadaKun;
      let taxminQolgan = haftalikOrtacha>0 ? Math.ceil((goal.target-current)/haftalikOrtacha) : "-";
      let taxminQolganText = haftalikOrtacha>0 ? `${taxminQolgan} kun (agar shu sur'atda davom etsa)` : "Hali prognoz yo'q";
      let show = goal.show !== false;
      let showText = show ? Number(current).toLocaleString('uz-UZ') : "****";
      let eyeIcon = show ? "👁️" : "🙈";
      const card = document.createElement('div'); card.className='goal-card';
      card.innerHTML = `
        <div class="goal-title">${escapeHtml(goal.name)}</div>
        <div class="goal-meta">
          Maqsad: <b>${Number(goal.target).toLocaleString('uz-UZ')}</b> ${escapeHtml(goal.currency)}<br>
          Yig'ilgan: <b class="goal-amount">${showText}</b>
          <button class="goal-eye-btn" title="Ko'rsat/yashir" style="background:none;border:none;cursor:pointer;font-size:18px;vertical-align:middle;margin-left:4px;">${eyeIcon}</button> ${escapeHtml(goal.currency)}
        </div>
        <div class="goal-progress-bar"><div class="goal-progress-inner" style="width:${percent}%"></div></div>
        <div class="goal-pct">${percent}%</div>
        <div style="font-size:13px;margin-bottom:5px;">${taxminQolganText}</div>
        <div class="goal-actions">
          <input class="goal-add-amount" type="number" min="1" placeholder="Pul qo'shish">
          <select class="goal-add-currency goal-currency-select">
            <option value="UZS">so'm</option>
            <option value="USD">$</option>
            <option value="RUB">₽</option>
          </select>
          <button class="goal-add-btn">Pul qo'shish</button>
          <button class="goal-remove-btn">O'chirish</button>
        </div>
      `;
      card.querySelector('.goal-eye-btn').addEventListener('click', ()=>{ goal.show = !goal.show; saveGoalsLocal(); renderGoalList(); });
      const addInput = card.querySelector('.goal-add-amount'); const addCur = card.querySelector('.goal-add-currency');
      card.querySelector('.goal-add-btn').addEventListener('click', ()=> {
        const val = Number(addInput.value); const fromCur = addCur.value;
        if (!val || val<=0) { alert("To'g'ri pul miqdorini kiriting!"); return; }
        const addConverted = convert(val, fromCur, goal.currency);
        goal.current = (goal.current||0) + addConverted;
        if (!goal.progressHistory) goal.progressHistory = [];
        goal.progressHistory.push({ date: new Date().toISOString().slice(0,10), amount: goal.current });
        saveGoalsLocal(); renderGoalList();
      });
      card.querySelector('.goal-remove-btn').addEventListener('click', ()=> { if (confirm("Ushbu maqsadni o'chirishni istaysizmi?")) { goalList.splice(idx,1); saveGoalsLocal(); renderGoalList(); } });
      goalListDiv.appendChild(card);
    });
  }

  // ---------------------------
  // Wire up events (v1 preserved + new)
  // ---------------------------
  if (addBtn) addBtn.addEventListener('click', addOrEditExpense);
  amountEl && amountEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') addOrEditExpense(); });
  nameEl && nameEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') amountEl && amountEl.focus(); });
  searchEl && searchEl.addEventListener('input', renderList);
  filterCatEl && filterCatEl.addEventListener('change', renderList);
  dateEl && dateEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') addOrEditExpense(); });

  if (currencySwitch) currencySwitch.addEventListener('change', ()=> { currency = currencySwitch.value; localStorage.setItem(CUR_KEY, currency); renderList(); renderGoalList(); });
  if (limitInput) limitInput.value = limit > 0 ? limit : '';
  if (limitSaveBtn) limitSaveBtn.addEventListener('click', ()=> { limit = Number(limitInput.value) || 0; localStorage.setItem(LIMIT_KEY, limit); renderList(); });

  if (addCatBtn) addCatBtn.addEventListener('click', ()=> { if (catModal) { catModal.classList.add('active'); newCatName && (newCatName.value=''); newCatEmoji && (newCatEmoji.value=''); } });
  if (closeCatModal) closeCatModal.addEventListener('click', ()=> catModal && catModal.classList.remove('active'));
  if (saveCatBtn) saveCatBtn.addEventListener('click', ()=> {
    const n = newCatName?.value.trim() || ''; const em = newCatEmoji?.value.trim() || '📦';
    if (!n) { alert("Kategoriya nomini kiriting!"); return; }
    if (categories.some(c=>c.name===n)) { alert("Bu nomda kategoriya bor!"); return; }
    categories.push({ name: n, emoji: em }); saveCategories(); renderCategories(); catModal && catModal.classList.remove('active');
  });

  if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
  if (importBtn) importBtn.addEventListener('click', ()=> importFile && importFile.click());
  importFile && importFile.addEventListener('change', (ev)=> { const f = ev.target.files[0]; if (!f) return; if (f.name.toLowerCase().endsWith('.json')) importJSONFile(f); else importCSVFile(f); importFile.value = ''; });

  if (trashBtn) trashBtn.addEventListener('click', showTrashModal);
  if (recurringBtn) recurringBtn.addEventListener('click', ()=> {
    const name = prompt("Recurring nomi (masalan: Abonent to'lov):"); if (!name) return;
    const amount = prompt("Summa:"); const interval = prompt("Interval (daily, weekly, monthly):", "monthly");
    const cat = prompt("Kategoriya nomi:", categories[0] ? categories[0].name : "Boshqa");
    const next = prompt("Birinchi sana (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
    addRecurring({ name, amount: Number(amount||0), currency, category: cat, interval, nextDate: next });
    alert("Recurring qo'shildi.");
  });

  if (showTodayBtn) showTodayBtn.addEventListener('click', ()=>{ showStatsToday(); showTodayBtn.classList.add('active'); showYesterdayBtn && showYesterdayBtn.classList.remove('active'); show7DaysBtn && show7DaysBtn.classList.remove('active'); });
  if (showYesterdayBtn) showYesterdayBtn.addEventListener('click', ()=>{ showStatsYesterday(); showYesterdayBtn.classList.add('active'); showTodayBtn && showTodayBtn.classList.remove('active'); show7DaysBtn && show7DaysBtn.classList.remove('active'); });
  if (show7DaysBtn) show7DaysBtn.addEventListener('click', ()=>{ showStats7Days(); show7DaysBtn.classList.add('active'); showTodayBtn && showTodayBtn.classList.remove('active'); showYesterdayBtn && showYesterdayBtn.classList.remove('active'); });

  if (statsList) statsList.addEventListener('click', function(e){ if (e.target.classList.contains('cat-link')) { const cat = e.target.getAttribute('data-cat'); if (cat) openCategoryStats(cat); } });

  if (tabHome) tabHome.addEventListener('click', ()=> { tabHome.classList.add('active'); tabChart && tabChart.classList.remove('active'); tabGoal && tabGoal.classList.remove('active'); homePage && (homePage.style.display=''); chartPage && (chartPage.style.display='none'); goalPage && (goalPage.style.display='none'); });
  if (tabChart) tabChart.addEventListener('click', ()=> { tabHome && tabHome.classList.remove('active'); tabChart.classList.add('active'); tabGoal && tabGoal.classList.remove('active'); homePage && (homePage.style.display='none'); chartPage && (chartPage.style.display=''); goalPage && (goalPage.style.display='none'); showStatsToday(); });
  if (tabGoal) tabGoal.addEventListener('click', ()=> { tabHome && tabHome.classList.remove('active'); tabChart && tabChart.classList.remove('active'); tabGoal.classList.add('active'); homePage && (homePage.style.display='none'); chartPage && (chartPage.style.display='none'); goalPage && (goalPage.style.display=''); renderGoalList(); });

  if (tabSettings) tabSettings.addEventListener('click', ()=> { homePage && (homePage.style.display='none'); chartPage && (chartPage.style.display='none'); goalPage && (goalPage.style.display='none'); settingsPage && (settingsPage.style.display=''); pinInput && (pinInput.value=''); removePinBtn && (removePinBtn.style.display = localStorage.getItem(PIN_KEY) ? '' : 'none'); });
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', ()=> { settingsPage && (settingsPage.style.display='none'); homePage && (homePage.style.display=''); });
  if (savePinBtn) savePinBtn.addEventListener('click', ()=> { const pin = pinInput?.value.trim() || ''; if (pin.length < 4 || !/^\d{4,}$/.test(pin)) { alert("PIN kamida 4ta raqamdan iborat bo'lishi kerak!"); return; } localStorage.setItem(PIN_KEY, pin); localStorage.setItem(PIN_TRIES_KEY, "0"); alert("PIN saqlandi!"); settingsPage && (settingsPage.style.display='none'); homePage && (homePage.style.display=''); });
  if (removePinBtn) removePinBtn.addEventListener('click', ()=> { if (confirm("PINni o'chirib tashlashni istaysizmi?")) { localStorage.removeItem(PIN_KEY); localStorage.removeItem(PIN_TRIES_KEY); alert("PIN o'chirildi! Endi ilova himoyasiz ochiladi."); settingsPage && (settingsPage.style.display='none'); homePage && (homePage.style.display=''); } });

  // Goals UI wiring (v1)
  if (addGoalBtn) addGoalBtn.addEventListener('click', ()=> {
    const name = goalNameEl?.value.trim() || ''; const target = Number(goalTargetEl?.value.trim() || 0); const cur = goalCurrency?.value || 'UZS';
    if (!name || !target || target<=0) { alert("Narsa nomi va narxini to'g'ri kiriting!"); return; }
    goalList.push({ name, target, current:0, currency: cur, progressHistory: [] }); saveGoalsLocal(); goalNameEl.value=''; goalTargetEl.value=''; renderGoalList();
  });

  // ---------------------------
  // Initial render & recurring processing
  // ---------------------------
  renderList();
  renderGoalList();
  processRecurring();

  setTimeout(()=>{ const s=$('splash'); if (s && !s.classList.contains('hide')) s.classList.add('hide'); }, 2000);

  // ---------------------------
  // Debug helpers
  // ---------------------------
  window.__XH = { getState: ()=>({ expenses, categories, recurring, trash, budgets, goalList }), addRecurring, processRecurring, exportJSON, exportCSV, importJSONFile, importCSVFile, restoreFromTrash, save, saveCategories, saveGoals };

}); 