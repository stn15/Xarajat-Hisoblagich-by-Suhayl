/* Full app.js - complete implementation
   Features:
   - Splash non-blocking hide
   - PIN modal (non-blocking) with SHA-256 hashing
   - Per-item currency support (originalAmount/originalCurrency)
   - LocalStorage persistence (expenses_v3 etc.)
   - Export/Import JSON & CSV
   - Recurring expenses engine
   - Trash (soft delete) + Undo toast
   - Budgets (monthly + per-category) and notifications
   - Charts (Chart.js) and stats (today/yesterday/7 days)
   - Goals management
   - Simple migration helper
   - Debug helper (window.__XH)
*/
document.addEventListener('DOMContentLoaded', async () => {
  // --- Currency rates
  let kursUSD = 12000, kursRUB = 140;
  async function fetchRates() {
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/UZS');
      const d = await r.json();
      if (d && d.rates) {
        kursUSD = 1 / d.rates.USD;
        kursRUB = 1 / d.rates.RUB;
      }
    } catch (e) { /* ignore */ }
  }
  await fetchRates();
  setInterval(fetchRates, 1000*60*60*3);

  function convert(amount, from, to) {
    if (from === to) return amount;
    if (from==="UZS" && to==="USD") return amount / kursUSD;
    if (from==="UZS" && to==="RUB") return amount / kursRUB;
    if (from==="USD" && to==="UZS") return amount * kursUSD;
    if (from==="USD" && to==="RUB") return (amount * kursUSD) / kursRUB;
    if (from==="RUB" && to==="UZS") return amount * kursRUB;
    if (from==="RUB" && to==="USD") return (amount * kursRUB) / kursUSD;
    return amount;
  }

  // --- Keys
  const STORAGE_KEY = 'expenses_v3';
  const CAT_KEY = 'categories_v2';
  const LIMIT_KEY = 'limit_v2';
  const LANG_KEY = 'lang_v2';
  const CUR_KEY = 'currency_v2';
  const THEME_KEY = 'theme_v2';
  const GOALS_KEY = 'goal_list';
  const TRASH_KEY = 'trash_v1';
  const RECUR_KEY = 'recurring_v1';
  const BUDGETS_KEY = 'budgets_v1';
  const PIN_KEY = 'user_pin';
  const PIN_TRIES_KEY = 'pin_tries';

  // --- Elements
  const splash = document.getElementById('splash');
  const appContainer = document.getElementById('appContainer');

  const pinModal = document.getElementById('pinModal');
  const pinModalInput = document.getElementById('pinModalInput');
  const pinSubmitBtn = document.getElementById('pinSubmitBtn');
  const pinCancelBtn = document.getElementById('pinCancelBtn');

  const nameEl = document.getElementById('name');
  const amountEl = document.getElementById('amount');
  const itemCurrencyEl = document.getElementById('itemCurrency');
  const dateEl = document.getElementById('date');
  const categoryEl = document.getElementById('category');
  const addBtn = document.getElementById('addBtn');
  const listEl = document.getElementById('list');
  const totalEl = document.getElementById('total');
  const searchEl = document.getElementById('search');
  const filterCatEl = document.getElementById('filterCategory');
  const chartCanvas = document.getElementById('expenseChart');
  const themeSwitch = document.getElementById('themeSwitch');
  const langSwitch = document.getElementById('langSwitch');
  const currencySwitch = document.getElementById('currencySwitch');
  const currencyLabel = document.getElementById('currencyLabel');
  const limitInput = document.getElementById('limitInput');
  const limitSaveBtn = document.getElementById('limitSaveBtn');
  const limitNotice = document.getElementById('limitNotice');
  const addCatBtn = document.getElementById('addCategoryBtn');
  const catModal = document.getElementById('catModal');
  const newCatName = document.getElementById('newCatName');
  const newCatEmoji = document.getElementById('newCatEmoji');
  const saveCatBtn = document.getElementById('saveCatBtn');
  const closeCatModal = document.getElementById('closeCatModal');

  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const recurringBtn = document.getElementById('recurringBtn');
  const budgetBtn = document.getElementById('budgetBtn');
  const trashBtn = document.getElementById('trashBtn');

  const homePage = document.getElementById('homePage');
  const chartPage = document.getElementById('chartPage');
  const goalPage = document.getElementById('goalPage');
  const tabHome = document.getElementById('tabHome');
  const tabChart = document.getElementById('tabChart');
  const tabGoal = document.getElementById('tabGoal');

  const statsChart = document.getElementById('statsChart');
  const showTodayBtn = document.getElementById('showTodayBtn');
  const showYesterdayBtn = document.getElementById('showYesterdayBtn');
  const show7DaysBtn = document.getElementById('show7DaysBtn');
  const statDate = document.getElementById('statDate');
  const statsList = document.getElementById('statsList');

  const goalName = document.getElementById('goalName');
  const goalTarget = document.getElementById('goalTarget');
  const addGoalBtn = document.getElementById('addGoalBtn');
  const goalListDiv = document.getElementById('goalList');
  const goalCurrency = document.getElementById('goalCurrency');

  // --- State
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
  let editingId = null;
  let limit = Number(localStorage.getItem(LIMIT_KEY) || "0");
  let lang = localStorage.getItem(LANG_KEY) || "uz";
  let currency = localStorage.getItem(CUR_KEY) || "UZS";
  let theme = localStorage.getItem(THEME_KEY);
  let goalList = [];

  // --- Helpers
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]);
    });
  }
  function formatNumberByCurrency(n) {
    if (currency === "UZS") return Number(n).toLocaleString("uz-UZ");
    if (currency === "USD") return (Number(n) / kursUSD).toFixed(2);
    if (currency === "RUB") return (Number(n) / kursRUB).toFixed(2);
    return Number(n).toLocaleString();
  }

  // --- Storage
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) expenses = JSON.parse(raw);
      const catRaw = localStorage.getItem(CAT_KEY);
      if (catRaw) categories = JSON.parse(catRaw);
      const goalsRaw = localStorage.getItem(GOALS_KEY);
      if (goalsRaw) goalList = JSON.parse(goalsRaw);
      const recurRaw = localStorage.getItem(RECUR_KEY);
      if (recurRaw) recurring = JSON.parse(recurRaw);
      const trashRaw = localStorage.getItem(TRASH_KEY);
      if (trashRaw) trash = JSON.parse(trashRaw);
      const budgetsRaw = localStorage.getItem(BUDGETS_KEY);
      if (budgetsRaw) budgets = JSON.parse(budgetsRaw);
    } catch (e) {
      console.warn("Storage load error:", e);
      expenses = [];
    }
  }
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    localStorage.setItem(CAT_KEY, JSON.stringify(categories));
    localStorage.setItem(GOALS_KEY, JSON.stringify(goalList));
    localStorage.setItem(RECUR_KEY, JSON.stringify(recurring));
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  }
  loadState();

  // --- Migration
  function migrateIfNeeded() {
    const savedCurrency = localStorage.getItem(CUR_KEY) || "UZS";
    let changed = false;
    for (let e of expenses) {
      if (e.amount && !e.amountUZS && !e.originalCurrency) {
        const orig = Number(e.amount);
        const amountUZS = Math.round(convert(orig, savedCurrency, 'UZS'));
        e.originalAmount = orig;
        e.originalCurrency = savedCurrency;
        e.amountUZS = amountUZS;
        delete e.amount;
        changed = true;
      } else if (e.amountUZS && !e.originalCurrency) {
        e.originalAmount = e.amountUZS;
        e.originalCurrency = 'UZS';
        changed = true;
      }
    }
    if (changed) saveState();
  }
  migrateIfNeeded();

  // --- Theme
  function getSystemTheme() { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function applyTheme(newTheme) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(newTheme + '-mode');
    themeSwitch.textContent = newTheme === "dark" ? "🌙" : "☀️";
    Chart.defaults.color = newTheme === "dark" ? "#cbd5e1" : "#222";
    Chart.defaults.plugins.legend.labels.color = newTheme === "dark" ? "#cbd5e1" : "#222";
  }
  if (!theme) { theme = getSystemTheme(); localStorage.setItem(THEME_KEY, theme); }
  applyTheme(theme);
  themeSwitch.addEventListener('click', () => {
    theme = (theme === "dark") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    renderList();
  });

  // --- PIN (modal non-blocking)
  async function hashPin(pin) {
    const enc = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  function showPinModalForCheck() {
    return new Promise((resolve) => {
      pinModal.style.display = 'flex';
      pinModal.setAttribute('aria-hidden','false');
      pinModalInput.value = '';
      pinModalInput.focus();
      const onSubmit = async () => {
        const val = pinModalInput.value.trim();
        if (!val) { alert("PIN kiriting!"); return; }
        const storedHash = localStorage.getItem(PIN_KEY);
        if (!storedHash) {
          pinModal.style.display='none';
          pinModal.setAttribute('aria-hidden','true');
          resolve({ ok: true, isNew: true });
          cleanup(); return;
        }
        const inputHash = await hashPin(val);
        if (inputHash === storedHash) {
          localStorage.setItem(PIN_TRIES_KEY, "0");
          pinModal.style.display='none';
          pinModal.setAttribute('aria-hidden','true');
          resolve({ ok: true });
          cleanup();
        } else {
          let tries = Number(localStorage.getItem(PIN_TRIES_KEY) || "0") + 1;
          localStorage.setItem(PIN_TRIES_KEY, String(tries));
          if (tries >= 10) {
            if (confirm("10 marta noto'g'ri urinish! Ma'lumotlarni o'chirib tashlab yangidan boshlamoqchimisiz?")) {
              clearAllData(); alert("Ma'lumotlar o'chirildi."); location.reload();
            } else {
              alert("Ilovaga kira olmaysiz.");
              pinModal.style.display='none';
              pinModal.setAttribute('aria-hidden','true');
              resolve({ ok: false }); cleanup();
            }
          } else {
            alert(`Noto'g'ri PIN! Qolgan urinishlar: ${10 - tries}`);
            pinModalInput.value = ''; pinModalInput.focus();
          }
        }
      };
      const onCancel = () => { pinModal.style.display='none'; pinModal.setAttribute('aria-hidden','true'); resolve({ ok: false, cancelled: true }); cleanup(); };
      function cleanup() { pinSubmitBtn.removeEventListener('click', onSubmit); pinCancelBtn.removeEventListener('click', onCancel); pinModalInput.removeEventListener('keydown', onKeydown); }
      function onKeydown(e) { if (e.key === 'Enter') onSubmit(); if (e.key === 'Escape') onCancel(); }
      pinSubmitBtn.addEventListener('click', onSubmit);
      pinCancelBtn.addEventListener('click', onCancel);
      pinModalInput.addEventListener('keydown', onKeydown);
    });
  }
  function clearAllData() {
    const keys = [STORAGE_KEY, CAT_KEY, GOALS_KEY, PIN_KEY, PIN_TRIES_KEY, LIMIT_KEY, LANG_KEY, CUR_KEY, THEME_KEY, TRASH_KEY, RECUR_KEY, BUDGETS_KEY];
    keys.forEach(k => localStorage.removeItem(k));
  }

  // Hide splash early to avoid "frozen" effect
  setTimeout(() => {
    if (splash) splash.classList.add('hide');
    if (appContainer) appContainer.setAttribute('aria-busy','false');
  }, 1200);

  // Show PIN modal (non-blocking)
  const pinResult = await showPinModalForCheck();
  if (!pinResult.ok) {
    console.warn("PIN check failed or cancelled; app loaded in read-only mode.");
    document.querySelectorAll('input, button, select, textarea').forEach(el => { if (!el.classList.contains('small-ctrl')) el.disabled = true; });
  }

  // Set today's date
  (function setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  })();

  // Categories render
  function renderCategories() {
    categoryEl.innerHTML = "";
    filterCatEl.innerHTML = `<option value="">Barchasi</option>`;
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name; option.textContent = `${cat.emoji} ${cat.name}`;
      categoryEl.appendChild(option);
      filterCatEl.appendChild(option.cloneNode(true));
    });
  }
  renderCategories();

  // Chart and render list
  let expChart = null;
  function renderChart(filtered) {
    if (!chartCanvas) return;
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => filtered.filter(e => e.category === cat && !e.deleted).reduce((sum, e) => sum + Number(e.amountUZS || 0), 0));
    if (expChart) expChart.destroy();
    expChart = new Chart(chartCanvas, {
      type: 'doughnut',
      data: { labels: cats, datasets: [{ data, backgroundColor: ["#ff9800","#2196f3","#4caf50","#9c27b0","#ffeb3b","#e91e63","#607d8b"] }]},
      options: { plugins: { legend: { position: 'bottom', labels: { color: theme === "dark" ? "#cbd5e1" : "#222" } } } }
    });
  }

  function renderList() {
    listEl.innerHTML = '';
    const keyword = (searchEl?.value ?? '').toLowerCase();
    const filterCat = filterCatEl?.value ?? '';
    let filtered = expenses.filter(item => !item.deleted).filter(item => {
      const matchName = item.name.toLowerCase().includes(keyword);
      const matchCat = !filterCat || item.category === filterCat;
      return matchName && matchCat;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(item => {
      const li = document.createElement('li');
      const left = document.createElement('div');
      const cat = categories.find(c=>c.name===item.category) || { emoji:'', name:item.category };
      const displayAmount = formatNumberByCurrency(Number(item.amountUZS || 0));
      const origHint = item.originalAmount ? ` (${item.originalAmount} ${item.originalCurrency})` : '';
      left.innerHTML = `<div style="display:flex;flex-direction:column;"><div><span style="font-weight:600">${escapeHtml(item.name)}</span></div><div style="font-size:13px;color:var(--muted)">${cat.emoji} ${escapeHtml(item.category)} · ${item.date}${origHint}</div></div>`;
      const right = document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'; right.style.gap='8px';
      const amountSpan = document.createElement('span'); amountSpan.innerHTML = `<b>${displayAmount}</b> ${currency}`; amountSpan.style.minWidth='90px';
      const editBtn = document.createElement('button'); editBtn.className='del-btn'; editBtn.textContent='✏️'; editBtn.title='Tahrirlash'; editBtn.addEventListener('click', ()=> editExpense(item.id));
      const delBtn = document.createElement('button'); delBtn.className='del-btn'; delBtn.textContent='🗑️'; delBtn.title='O\'chirish (trash)'; delBtn.addEventListener('click', ()=> softDeleteExpense(item.id));
      right.appendChild(amountSpan); right.appendChild(editBtn); right.appendChild(delBtn);
      li.appendChild(left); li.appendChild(right); listEl.appendChild(li);
    });

    totalEl.textContent = formatNumberByCurrency(filtered.reduce((s, it) => s + Number(it.amountUZS || 0), 0));
    currencyLabel.textContent = currency === "UZS" ? "so'm" : (currency === "USD" ? "$" : "₽");
    renderChart(filtered);

    // limit check
    const monthTotal = filtered.reduce((s, it)=> s + Number(it.amountUZS || 0), 0);
    if (limit > 0 && monthTotal > limit) {
      limitNotice.textContent = `Diqqat! Oylik limitdan oshib ketdingiz. (${formatNumberByCurrency(monthTotal)} ${currency})`;
      try { if (Notification.permission === "granted") new Notification("Oylik limit oshdi", { body: `${formatNumberByCurrency(monthTotal)} ${currency}` }); }
      catch (e) {}
    } else {
      limitNotice.textContent = '';
    }
  }

  // Add / Edit expense
  function addOrEditExpense() {
    const name = nameEl.value.trim();
    const amountRaw = amountEl.value.trim();
    const itemCur = itemCurrencyEl.value;
    const category = categoryEl.value;
    const date = dateEl.value;
    if (!name || !amountRaw) { alert("Iltimos, nom va summani kiriting!"); return; }
    if (!date) { alert("Iltimos, sanani tanlang!"); return; }
    const inputAmount = parseFloat(amountRaw);
    if (isNaN(inputAmount) || !isFinite(inputAmount)) { alert("Iltimos, to'g'ri summa kiriting!"); return; }
    const amountUZS = Math.round(convert(inputAmount, itemCur, 'UZS'));
    const nowIso = new Date().toISOString();
    if (editingId) {
      const expense = expenses.find(e=> e.id===editingId);
      if (expense) {
        expense.name = name; expense.amountUZS = amountUZS; expense.originalAmount = inputAmount; expense.originalCurrency = itemCur; expense.category = category; expense.date = date; expense.updatedAt = nowIso;
      }
      window.dispatchEvent(new CustomEvent('expenseSaved', { detail: expenses.find(e=>e.id===editingId) }));
      editingId = null; addBtn.textContent = "➕ Qo'shish";
    } else {
      const expense = { id: Date.now().toString(), name, amountUZS, originalAmount: inputAmount, originalCurrency: itemCur, category, date, createdAt: nowIso, updatedAt: nowIso, deleted: false };
      expenses.push(expense);
      window.dispatchEvent(new CustomEvent('expenseSaved', { detail: expense }));
    }
    saveState(); renderList(); nameEl.value=''; amountEl.value=''; setTodayDate(); nameEl.focus();
  }
  function editExpense(id) {
    const expense = expenses.find(e => e.id === id); if (!expense) return;
    nameEl.value = expense.name || ''; itemCurrencyEl.value = expense.originalCurrency || currency;
    amountEl.value = expense.originalAmount != null ? expense.originalAmount : Number(convert(expense.amountUZS, 'UZS', itemCurrencyEl.value)).toFixed(2);
    categoryEl.value = expense.category; dateEl.value = expense.date; editingId = id; addBtn.textContent = "✏️ Saqlash";
  }

  // Soft delete & undo
  const UNDO_TIMEOUT = 10000;
  function softDeleteExpense(id) {
    const idx = expenses.findIndex(e=>e.id===id); if (idx === -1) return;
    const [item] = expenses.splice(idx,1); item.deleted = true; item.deletedAt = new Date().toISOString(); trash.unshift(item); saveState(); renderList();
    showUndoToast(`"${item.name}" o'chirildi`, ()=> { restoreFromTrash(item.id); }, UNDO_TIMEOUT);
  }
  function restoreFromTrash(id) {
    const idx = trash.findIndex(t=>t.id===id); if (idx === -1) return;
    const [item] = trash.splice(idx,1); delete item.deleted; delete item.deletedAt; expenses.push(item); saveState(); renderList(); showNotification("Tiklash", `"${item.name}" tiklandi.`);
  }

  // Toast area
  function ensureToastArea() { if (!document.getElementById('xh-toast-area')) { const div = document.createElement('div'); div.id = 'xh-toast-area'; div.style.position = 'fixed'; div.style.left = '16px'; div.style.bottom = '80px'; div.style.zIndex = '12000'; document.body.appendChild(div); } }
  function showUndoToast(text, undoCb, timeout = 8000) {
    ensureToastArea(); const area = document.getElementById('xh-toast-area'); const card = document.createElement('div'); card.className='xh-toast'; card.innerHTML = `<span>${escapeHtml(text)}</span> <button class="xh-undo-btn">Bekor qilish</button>`; area.appendChild(card); const btn = card.querySelector('.xh-undo-btn'); const timer = setTimeout(()=>{ card.remove(); }, timeout); btn.addEventListener('click', ()=>{ clearTimeout(timer); try { undoCb(); } catch(e){} card.remove(); });
  }
  function showNotification(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") { new Notification(title, { body }); return; }
    if (Notification.permission !== "denied") { Notification.requestPermission().then(permission => { if (permission === "granted") new Notification(title, { body }); }); }
  }

  // Recurring
  function addRecurring(rule) { rule.id = rule.id || Date.now().toString(); recurring.push(rule); localStorage.setItem(RECUR_KEY, JSON.stringify(recurring)); }
  function processRecurring() {
    const today = new Date().toISOString().slice(0,10); let created=[];
    for (let r of recurring) {
      while (r.nextDate && r.nextDate <= today) {
        const already = expenses.some(e=> e._recurringId===r.id && e.date===r.nextDate);
        if (!already) {
          const amountUZS = Math.round(convert(Number(r.amount), r.currency || 'UZS', 'UZS'));
          const inst = { id: Date.now().toString()+Math.floor(Math.random()*1000), name:r.name, amountUZS, originalAmount:Number(r.amount), originalCurrency:r.currency||'UZS', category:r.category||(categories[0]&&categories[0].name)||"Boshqa", date:r.nextDate, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), _recurringId:r.id };
          expenses.push(inst); created.push(inst);
        }
        const nd = new Date(r.nextDate+'T00:00:00'); if (r.interval==='daily') nd.setDate(nd.getDate()+1); else if (r.interval==='weekly') nd.setDate(nd.getDate()+7); else nd.setMonth(nd.getMonth()+1);
        r.nextDate = nd.toISOString().slice(0,10); if (r.endDate && r.nextDate > r.endDate) { r.nextDate = null; break; }
      }
    }
    saveState(); if (created.length) { showNotification("Takrorlanuvchi xarajatlar qo'shildi", `${created.length} ta avtomatik xarajat qo'shildi.`); window.dispatchEvent(new CustomEvent('recurringCreated', { detail: created })); }
  }
  processRecurring();

  // Export / Import
  function exportJSON() {
    const dump = { meta:{ exportedAt:new Date().toISOString() }, expenses, categories, recurring, budgets, goals:goalList };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `xarajat_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
  }
  function exportCSV() {
    const rows=[['id','name','date','amountUZS','originalAmount','originalCurrency','category','createdAt']];
    for (let e of expenses) rows.push([e.id,e.name,e.date,e.amountUZS||0,e.originalAmount||'',e.originalCurrency||'',e.category,e.createdAt||'']);
    const csv = rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type:'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `xarajat_export_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  function importJSONFile(file) {
    const reader = new FileReader(); reader.onload = (e)=> {
      try {
        const data = JSON.parse(e.target.result);
        if (data.expenses && Array.isArray(data.expenses)) {
          if (confirm("Ma'lumotlarni mavjudlarga qo'shasizmi? (OK = qo'shish, Cancel = yangilash)")) {
            const existing = new Set(expenses.map(x=>x.id)); let added=0;
            for (let item of data.expenses) if (!existing.has(item.id)) { expenses.push(item); added++; }
            saveState(); renderList(); alert(`${added} ta yozuv qo'shildi.`);
          } else {
            expenses = data.expenses; categories = data.categories || categories; recurring = data.recurring || recurring; budgets = data.budgets || budgets; goalList = data.goals || goalList; saveState(); renderCategories(); renderList(); alert("Ma'lumotlar yangilandi.");
          }
        } else alert("Fayl formati noto'g'ri.");
      } catch(err) { alert("JSON o'qishda xatolik: " + err.message); }
    }; reader.readAsText(file);
  }
  function importCSVFile(file) {
    const reader = new FileReader(); reader.onload = (e) => {
      const text = e.target.result; const lines = text.split(/\r?\n/).filter(Boolean); if (!lines.length) { alert("CSV bo'sh"); return; }
      const headers = lines[0].split(',').map(h=>h.replace(/^"|"$/g,'')); const added=[];
      for (let i=1;i<lines.length;i++) {
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v=>v.replace(/^"|"$/g,'')) || []; if (!values.length) continue;
        const rec = {}; headers.forEach((h,j)=> rec[h]=values[j]||'');
        const eItem = { id: rec.id || Date.now().toString()+i, name: rec.name || 'Untitled', date: rec.date || new Date().toISOString().slice(0,10), amountUZS: Number(rec.amountUZS) || Math.round(convert(Number(rec.originalAmount||0), rec.originalCurrency||'UZS', 'UZS')), originalAmount: rec.originalAmount||'', originalCurrency: rec.originalCurrency||'UZS', category: rec.category || (categories[0] && categories[0].name) || 'Boshqa', createdAt: rec.createdAt || new Date().toISOString() };
        expenses.push(eItem); added.push(eItem);
      }
      saveState(); renderList(); alert(`${added.length} ta yozuv CSV orqali import qilindi.`);
    }; reader.readAsText(file);
  }

  // Trash modal
  function showTrashModal() {
    let modal = document.getElementById('xh-trash-modal');
    if (!modal) {
      modal = document.createElement('div'); modal.id='xh-trash-modal'; modal.className='xh-modal';
      modal.innerHTML = `<div class="xh-modal-inner"><h3>Trash - O'chirilgan yozuvlar</h3><div id="xh-trash-list" style="max-height:300px;overflow:auto"></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;"><button id="xh-trash-close">Yopish</button><button id="xh-trash-clear" style="background:#ff6b6b;color:#fff">Tozalash</button></div></div>`;
      document.body.appendChild(modal); document.getElementById('xh-trash-close').addEventListener('click', ()=> modal.remove()); document.getElementById('xh-trash-clear').addEventListener('click', ()=> { if (confirm("Trash tozalansinmi?")) { trash=[]; saveState(); modal.remove(); }});
    }
    const list = document.getElementById('xh-trash-list'); list.innerHTML='';
    if (!trash.length) list.innerHTML = '<div style="color:var(--muted);padding:12px;text-align:center">Trash bo\'sh</div>';
    for (let t of trash) {
      const el = document.createElement('div'); el.className='xh-trash-item';
      el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><b>${escapeHtml(t.name)}</b><div style="font-size:13px;color:var(--muted)">${t.date} · ${t.category}</div></div><div style="display:flex;gap:8px"><button class="xh-restore">Tiklash</button><button class="xh-delete" style="background:#ff6b6b;color:#fff">O'chirish</button></div></div>`;
      list.appendChild(el);
      el.querySelector('.xh-restore').addEventListener('click', ()=> { restoreFromTrash(t.id); showTrashModal(); });
      el.querySelector('.xh-delete').addEventListener('click', ()=> { if (confirm("Bu yozuvni doimiy o'chirishni tasdiqlaysizmi?")) { trash = trash.filter(x=>x.id!==t.id); saveState(); showTrashModal(); }});
    }
    modal.style.position='fixed'; modal.style.left='0'; modal.style.top='0'; modal.style.right='0'; modal.style.bottom='0'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; modal.style.background='rgba(0,0,0,0.35)';
    modal.querySelector('.xh-modal-inner').style.background='var(--goal-bg)'; modal.querySelector('.xh-modal-inner').style.padding='18px';
  }

  // Budgets
  function setBudgetForMonth(monthKey, amount, categoryBudgets={}) { budgets[monthKey] = budgets[monthKey] || { total: 0, categories: {} }; budgets[monthKey].total = amount; budgets[monthKey].categories = categoryBudgets; saveState(); }

  // Stats helpers
  function renderStatsChart(labels, data) {
    if (window.statsChartObj) window.statsChartObj.destroy();
    window.statsChartObj = new Chart(statsChart, { type:'bar', data:{ labels, datasets:[{ label:'Sarflangan summa', data, backgroundColor: theme === "dark" ? "#8b5cf6" : "#4caf50" }]}, options:{ scales:{ x:{ ticks:{ color: theme === "dark" ? "#cbd5e1" : "#222" }, grid:{ color: theme === "dark" ? "#22242c" : "#e0e7ef" } }, y:{ beginAtZero:true, ticks:{ color: theme === "dark" ? "#cbd5e1" : "#222" }, grid:{ color: theme === "dark" ? "#22242c" : "#e0e7ef" } } }, plugins:{ legend:{ display:false } } } });
  }
  function showStatsToday(){ const today=new Date(); const key=today.toISOString().slice(0,10); const todayExp=expenses.filter(e=>e.date===key && !e.deleted); statDate.textContent=`Bugun: ${key}`; let cats=categories.map(c=>c.name); let data=cats.map(cat=>todayExp.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amountUZS||0),0)); renderStatsChart(cats,data); statsList.innerHTML=cats.map((cat,i)=>`<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></span>`).join("<br>"); }
  function showStatsYesterday(){ const yester=new Date(Date.now()-86400000); const key=yester.toISOString().slice(0,10); const yesterExp=expenses.filter(e=>e.date===key && !e.deleted); statDate.textContent=`Kecha: ${key}`; let cats=categories.map(c=>c.name); let data=cats.map(cat=>yesterExp.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amountUZS||0),0)); renderStatsChart(cats,data); statsList.innerHTML=cats.map((cat,i)=>`<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></span>`).join("<br>"); }
  function showStats7Days(){ let days=[]; for(let i=6;i>=0;i--){ let d=new Date(Date.now()-86400000*i); days.push(d.toISOString().slice(0,10)); } let data=days.map(day=>expenses.filter(e=>e.date===day && !e.deleted).reduce((s,e)=>s+Number(e.amountUZS||0),0)); statDate.textContent=`Oxirgi 7 kun: ${days[0]} - ${days[6]}`; renderStatsChart(days,data); statsList.innerHTML=days.map((day,i)=>`<span>${day}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></span>`).join("<br>"); }

  // Goals
  function saveGoalsLocal(){ localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); }
  function renderGoalList(){ goalListDiv.innerHTML=''; if (!goalList.length) { goalListDiv.innerHTML=`<div style='text-align:center;color:var(--muted);margin-top:18px;'>Maqsadlar hali yo'q</div>`; return; } goalList.forEach((goal, idx)=>{ let current=goal.current||0; let percent=Math.min(100,Math.round(current/goal.target*100)); let weekData=goal.progressHistory||[]; let haftalikQoshimcha=weekData.length>1?weekData[weekData.length-1].amount-weekData[0].amount:current; haftalikQoshimcha=haftalikQoshimcha||0; let haftadaKun=weekData.length>1?Math.round((new Date(weekData[weekData.length-1].date)-new Date(weekData[0].date))/86400000):7; haftadaKun=haftadaKun<=0?1:haftadaKun; let haftalikOrtacha=haftalikQoshimcha/haftadaKun; let taxminQolgan=haftalikOrtacha>0?Math.ceil((goal.target-current)/haftalikOrtacha):"-"; let taxminQolganText=haftalikOrtacha>0?`${taxminQolgan} kun (agar shu sur'atda davom etsa)`:"Hali prognoz yo'q"; let show=goal.show!==false; let showText=show?Number(current).toLocaleString('uz-UZ'):"****"; let eyeIcon=show?"👁️":"🙈"; let card=document.createElement('div'); card.className='goal-card'; card.innerHTML=`<div class="goal-title">${escapeHtml(goal.name)}</div><div class="goal-meta">Maqsad: <b>${Number(goal.target).toLocaleString('uz-UZ')}</b> ${goal.currency}<br>Yig'ilgan: <b class="goal-amount">${showText}</b> <button class="goal-eye-btn" title="Ko'rsat/yashir" style="background:none;border:none;cursor:pointer;font-size:18px;vertical-align:middle;margin-left:4px;">${eyeIcon}</button> ${goal.currency}</div><div class="goal-progress-bar"><div class="goal-progress-inner" style="width:${percent}%;"></div></div><div class="goal-pct">${percent}%</div><div style="font-size:13px;margin-bottom:5px;">${taxminQolganText}</div><div class="goal-actions"><input class="goal-add-amount" type="number" min="1" placeholder="Pul qo'shish"><select class="goal-add-currency goal-currency-select"><option value="UZS">so'm</option><option value="USD">$</option><option value="RUB">₽</option></select><button class="goal-add-btn">Pul qo'shish</button><button class="goal-remove-btn">O'chirish</button></div>`; const eyeBtn=card.querySelector('.goal-eye-btn'); eyeBtn.addEventListener('click', ()=>{ goal.show=!show; saveGoalsLocal(); renderGoalList(); }); const addInput=card.querySelector('.goal-add-amount'); const addCur=card.querySelector('.goal-add-currency'); const addBtnG=card.querySelector('.goal-add-btn'); addBtnG.addEventListener('click', ()=>{ let val=Number(addInput.value); let fromCur=addCur.value; if (!val||val<=0){ alert("To'g'ri pul miqdorini kiriting!"); return; } let addConverted=convert(val, fromCur, goal.currency); goal.current=(goal.current||0)+addConverted; if (!goal.progressHistory) goal.progressHistory=[]; goal.progressHistory.push({date:new Date().toISOString().slice(0,10), amount:goal.current}); saveGoalsLocal(); renderGoalList(); }); const removeBtn=card.querySelector('.goal-remove-btn'); removeBtn.addEventListener('click', ()=>{ if (confirm("Ushbu maqsadni o'chirishni istaysizmi?")){ goalList.splice(idx,1); saveGoalsLocal(); renderGoalList(); } }); goalListDiv.appendChild(card); }); }
  addGoalBtn.addEventListener('click', ()=>{ const name=goalName.value.trim(); const target=Number(goalTarget.value.trim()); const currencyG=goalCurrency.value; if (!name || !target || target<=0){ alert("Narsa nomi va narxini to'g'ri kiriting!"); return; } goalList.push({ name, target, current:0, currency:currencyG, progressHistory:[] }); saveGoalsLocal(); goalName.value=''; goalTarget.value=''; renderGoalList(); });

  // Bindings
  addBtn.addEventListener('click', addOrEditExpense);
  amountEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') addOrEditExpense(); });
  nameEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') amountEl.focus(); });
  searchEl.addEventListener('input', renderList);
  filterCatEl.addEventListener('change', renderList);
  dateEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') addOrEditExpense(); });

  currencySwitch.addEventListener('change', () => { currency = currencySwitch.value; localStorage.setItem(CUR_KEY, currency); renderList(); renderGoalList(); });

  limitInput.value = limit > 0 ? limit : "";
  limitSaveBtn.addEventListener('click', ()=> { limit = Number(limitInput.value) || 0; localStorage.setItem(LIMIT_KEY, limit); renderList(); });

  addCatBtn.addEventListener('click', ()=> { catModal.classList.add("active"); newCatName.value=''; newCatEmoji.value=''; });
  closeCatModal.addEventListener('click', ()=> catModal.classList.remove("active"));
  saveCatBtn.addEventListener('click', ()=> { const name=newCatName.value.trim(); const emoji=newCatEmoji.value.trim() || "📦"; if (!name){ alert("Kategoriya nomini kiriting!"); return; } if (categories.some(c=>c.name===name)){ alert("Bu nomda kategoriya bor!"); return; } categories.push({name, emoji}); saveState(); renderCategories(); catModal.classList.remove("active"); });

  exportJsonBtn.addEventListener('click', exportJSON);
  exportCsvBtn.addEventListener('click', exportCSV);
  importBtn.addEventListener('click', ()=> importFile.click());
  importFile.addEventListener('change', (ev)=> { const f = ev.target.files[0]; if (!f) return; if (f.name.toLowerCase().endsWith('.json')) importJSONFile(f); else importCSVFile(f); importFile.value=''; });
  recurringBtn.addEventListener('click', ()=> { const name = prompt("Recurring nomi (masalan: Abonent to'lov):"); if (!name) return; const amount = prompt("Summa:"); const interval = prompt("Interval (daily, weekly, monthly):", "monthly"); const cat = prompt("Kategoriya nomi:", categories[0] ? categories[0].name : "Boshqa"); const next = prompt("Birinchi sana (YYYY-MM-DD):", new Date().toISOString().slice(0,10)); addRecurring({ name, amount: Number(amount || 0), currency, category: cat, interval, nextDate: next }); alert("Recurring qo'shildi."); });
  budgetBtn.addEventListener('click', ()=> { const month = prompt("Budjet oy (YYYY-MM):", new Date().toISOString().slice(0,7)); const total = prompt("Umumiy byudjet (UZS):", "0"); if (!month) return; setBudgetForMonth(month, Number(total||0), {}); alert("Budget saqlandi."); });
  trashBtn.addEventListener('click', showTrashModal);

  tabHome.addEventListener('click', ()=> { tabHome.classList.add("active"); tabChart.classList.remove("active"); tabGoal.classList.remove("active"); homePage.style.display=""; chartPage.style.display="none"; goalPage.style.display="none"; });
  tabChart.addEventListener('click', ()=> { tabHome.classList.remove("active"); tabChart.classList.add("active"); tabGoal.classList.remove("active"); homePage.style.display="none"; chartPage.style.display=""; goalPage.style.display="none"; showStatsToday(); });
  tabGoal.addEventListener('click', ()=> { tabHome.classList.remove("active"); tabChart.classList.remove("active"); tabGoal.classList.add("active"); homePage.style.display="none"; chartPage.style.display="none"; goalPage.style.display=""; renderGoalList(); });

  renderList(); renderGoalList();

  window.__XH = { addRecurring, processRecurring, exportJSON, exportCSV, importJSONFile, importCSVFile, setBudgetForMonth, restoreFromTrash, getState: ()=>({ expenses, categories, recurring, trash, budgets }) };

  setTimeout(()=> { if (splash && !splash.classList.contains('hide')) splash.classList.add('hide'); }, 2000);
  document.addEventListener('visibilitychange', ()=> { if (document.visibilityState === 'visible') processRecurring(); });

  function setTodayDate() {
    const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth()+1).padStart(2,'0'); const dd = String(today.getDate()).padStart(2,'0'); dateEl.value = `${yyyy}-${mm}-${dd}`;
  }
});
