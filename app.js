/* =========================================================================
   Xarajat Hisoblagich - app.js (FULL) — patched
   Fixed: syntax error from unescaped apostrophe (e.g. "Trash bo'sh")
   Replace your existing app.js with this file (backup first).
   ========================================================================= */

   document.addEventListener('DOMContentLoaded', async () => {
    // -----------------------------
    // Config / Storage keys
    // -----------------------------
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
  
    // -----------------------------
    // Small helpers
    // -----------------------------
    const $ = id => document.getElementById(id);
    const noop = () => {};
    function escapeHtml(str) {
      return String(str || '').replace(/[&<>"']/g, function (s) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]);
      });
    }
    // ensure element exists (create fallback if missing)
    function ensureElement(id, tag='div', props={}) {
      let el = $(id);
      if (!el) {
        el = document.createElement(tag);
        el.id = id;
        Object.entries(props).forEach(([k,v]) => { if (k === 'text') el.textContent = v; else el.setAttribute(k, v); });
        const parent = document.querySelector('.content') || document.body;
        parent.appendChild(el);
      }
      return el;
    }
  
    // -----------------------------
    // Currency rates (best-effort)
    // -----------------------------
    let kursUSD = 12000, kursRUB = 140;
    async function fetchRates() {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/UZS', { cache: 'no-store' });
        const d = await r.json();
        if (d && d.rates) {
          // keep previous conversion pattern
          kursUSD = 1 / d.rates.USD;
          kursRUB = 1 / d.rates.RUB;
        }
      } catch (e) {
        // ignore - offline or CORS
      }
    }
    fetchRates().catch(noop);
    setInterval(() => fetchRates().catch(noop), 1000 * 60 * 60 * 3);
  
    function convert(amount, from, to) {
      if (from === to) return amount;
      if (from === "UZS" && to === "USD") return amount / kursUSD;
      if (from === "UZS" && to === "RUB") return amount / kursRUB;
      if (from === "USD" && to === "UZS") return amount * kursUSD;
      if (from === "USD" && to === "RUB") return (amount * kursUSD) / kursRUB;
      if (from === "RUB" && to === "UZS") return amount * kursRUB;
      if (from === "RUB" && to === "USD") return (amount * kursRUB) / kursUSD;
      return amount;
    }
  
    // -----------------------------
    // Ensure required DOM elements (create simple fallbacks if missing)
    // -----------------------------
    ensureElement('splash', 'div');
    ensureElement('appContainer', 'div');
    ensureElement('content', 'div');
  
    const nameEl = $('name') || ensureElement('name', 'input');
    const amountEl = $('amount') || ensureElement('amount', 'input');
    if (amountEl) amountEl.type = 'number';
    const dateEl = $('date') || ensureElement('date', 'input');
    if (dateEl) dateEl.type = 'date';
    const categoryEl = $('category') || ensureElement('category', 'select');
    const addBtn = $('addBtn') || (function(){ const b = document.createElement('button'); b.id='addBtn'; b.className='add-btn'; b.textContent="➕ Qo'shish"; document.querySelector('.inputs')?.appendChild(b); return b; })();
    const listEl = $('list') || ensureElement('list', 'ul');
    const totalEl = $('total') || (function(){ const d = ensureElement('total','div'); d.textContent='0'; return d; })();
    const searchEl = $('search') || ensureElement('search','input');
    const filterCatEl = $('filterCategory') || ensureElement('filterCategory','select');
    const chartCanvas = $('expenseChart') || (function(){ const c = document.createElement('canvas'); c.id='expenseChart'; document.querySelector('.content')?.appendChild(c); return c; })();
    const themeSwitch = $('themeSwitch') || ensureElement('themeSwitch','button');
    const langSwitch = $('langSwitch') || ensureElement('langSwitch','select');
    const currencySwitch = $('currencySwitch') || ensureElement('currencySwitch','select');
    const currencyLabel = $('currencyLabel') || (function(){ const s = ensureElement('currencyLabel','span'); s.textContent="so'm"; return s; })();
    const limitInput = $('limitInput') || ensureElement('limitInput','input');
    const limitSaveBtn = $('limitSaveBtn') || ensureElement('limitSaveBtn','button');
    const limitNotice = $('limitNotice') || ensureElement('limitNotice','div');
    const addCatBtn = $('addCategoryBtn') || ensureElement('addCategoryBtn','button');
    const catModal = $('catModal') || ensureElement('catModal','div');
    const newCatName = $('newCatName') || ensureElement('newCatName','input');
    const newCatEmoji = $('newCatEmoji') || ensureElement('newCatEmoji','input');
    const saveCatBtn = $('saveCatBtn') || ensureElement('saveCatBtn','button');
    const closeCatModal = $('closeCatModal') || ensureElement('closeCatModal','button');
  
    // tab pages
    const homePage = $('homePage') || ensureElement('homePage','div');
    const chartPage = $('chartPage') || ensureElement('chartPage','div');
    const goalPage = $('goalPage') || ensureElement('goalPage','div');
    const tabHome = $('tabHome') || ensureElement('tabHome','button');
    const tabChart = $('tabChart') || ensureElement('tabChart','button');
    const tabGoal = $('tabGoal') || ensureElement('tabGoal','button');
  
    // stats
    const statsChart = $('statsChart') || ensureElement('statsChart','canvas');
    const showTodayBtn = $('showTodayBtn') || ensureElement('showTodayBtn','button');
    const showYesterdayBtn = $('showYesterdayBtn') || ensureElement('showYesterdayBtn','button');
    const show7DaysBtn = $('show7DaysBtn') || ensureElement('show7DaysBtn','button');
    const statDate = $('statDate') || ensureElement('statDate','div');
    const statsList = $('statsList') || ensureElement('statsList','div');
  
    // goals
    const goalName = $('goalName') || ensureElement('goalName','input');
    const goalTarget = $('goalTarget') || ensureElement('goalTarget','input');
    const addGoalBtn = $('addGoalBtn') || ensureElement('addGoalBtn','button');
    const goalListDiv = $('goalList') || ensureElement('goalList','div');
    const goalCurrency = $('goalCurrency') || ensureElement('goalCurrency','select');
  
    // control buttons (export/import/recurring/budget/trash)
    const exportJsonBtn = $('exportJsonBtn') || ensureElement('exportJsonBtn','button');
    const exportCsvBtn = $('exportCsvBtn') || ensureElement('exportCsvBtn','button');
    const importBtn = $('importBtn') || ensureElement('importBtn','button');
    const importFile = $('importFile') || (function(){ const i = document.createElement('input'); i.type='file'; i.id='importFile'; i.accept='.json,.csv'; i.style.display='none'; document.body.appendChild(i); return i; })();
    const recurringBtn = $('recurringBtn') || ensureElement('recurringBtn','button');
    const budgetBtn = $('budgetBtn') || ensureElement('budgetBtn','button');
    const trashBtn = $('trashBtn') || ensureElement('trashBtn','button');
  
    // pin modal (ensure)
    const pinModal = $('pinModal') || (function(){
      const d = document.createElement('div'); d.id='pinModal'; d.style.display='none'; d.className='pin-modal';
      d.innerHTML = `<div class="pin-modal-inner">
        <h3>Ilovaga kirish uchun PIN</h3>
        <input id="pinModalInput" type="password" placeholder="PIN kodni kiriting" maxlength="8"/>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button id="pinCancelBtn" class="small-ctrl">Bekor</button>
          <button id="pinSubmitBtn" class="small-ctrl">Tasdiqlash</button>
        </div>
      </div>`;
      document.body.appendChild(d);
      return d;
    })();
    const pinModalInput = $('pinModalInput');
    const pinSubmitBtn = $('pinSubmitBtn');
    const pinCancelBtn = $('pinCancelBtn');
  
    // -----------------------------
    // State
    // -----------------------------
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
  
    // -----------------------------
    // Storage helpers
    // -----------------------------
    function loadState() {
      try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) expenses = JSON.parse(raw); } catch (e) { expenses = []; }
      try { const raw = localStorage.getItem(CAT_KEY); if (raw) categories = JSON.parse(raw); } catch(e) {}
      try { const raw = localStorage.getItem(GOALS_KEY); if (raw) goalList = JSON.parse(raw); } catch(e) {}
      try { const raw = localStorage.getItem(RECUR_KEY); if (raw) recurring = JSON.parse(raw); } catch(e) {}
      try { const raw = localStorage.getItem(TRASH_KEY); if (raw) trash = JSON.parse(raw); } catch(e) {}
      try { const raw = localStorage.getItem(BUDGETS_KEY); if (raw) budgets = JSON.parse(raw); } catch(e) {}
    }
    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); } catch(e) {}
      try { localStorage.setItem(CAT_KEY, JSON.stringify(categories)); } catch(e) {}
      try { localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); } catch(e) {}
      try { localStorage.setItem(RECUR_KEY, JSON.stringify(recurring)); } catch(e) {}
      try { localStorage.setItem(TRASH_KEY, JSON.stringify(trash)); } catch(e) {}
      try { localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)); } catch(e) {}
    }
    loadState();
  
    // -----------------------------
    // Migration helper
    // -----------------------------
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
  
    // -----------------------------
    // Theme
    // -----------------------------
    function applyTheme(t) {
      document.body.classList.remove('light-mode','dark-mode');
      document.body.classList.add(t + '-mode');
      if (themeSwitch) themeSwitch.textContent = t === 'dark' ? '🌙' : '☀️';
    }
    applyTheme(theme);
    themeSwitch && themeSwitch.addEventListener('click', () => {
      theme = (theme === 'dark') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
      renderList();
    });
  
    // -----------------------------
    // PIN: hashing + modal (non-blocking)
    // -----------------------------
    async function hashPin(pin) {
      try {
        const enc = new TextEncoder().encode(pin);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
      } catch (e) {
        // fallback simple hash
        let h = 2166136261 >>> 0;
        for (let i = 0; i < pin.length; i++) h = Math.imul(h ^ pin.charCodeAt(i), 16777619);
        return (h >>> 0).toString(16);
      }
    }
  
    function showPinModal() {
      return new Promise((resolve) => {
        if (!pinModal || !pinModalInput || !pinSubmitBtn || !pinCancelBtn) return resolve({ ok: true });
        pinModal.style.display = 'flex';
        pinModalInput.value = '';
        pinModalInput.focus();
  
        async function onOk() {
          const v = pinModalInput.value.trim();
          if (!v) { alert('PIN kiriting'); pinModalInput.focus(); return; }
          const storedHash = localStorage.getItem(PIN_KEY);
          if (!storedHash) {
            pinModal.style.display = 'none';
            cleanup();
            return resolve({ ok: true, isNew: true, pin: v });
          }
          const h = await hashPin(v);
          if (h === storedHash) {
            localStorage.setItem(PIN_TRIES_KEY, '0');
            pinModal.style.display = 'none';
            cleanup();
            return resolve({ ok: true });
          } else {
            let tries = Number(localStorage.getItem(PIN_TRIES_KEY) || '0') + 1;
            localStorage.setItem(PIN_TRIES_KEY, String(tries));
            if (tries >= 10) {
              if (confirm("10 marta noto'g'ri urinish! Ma'lumotlarni o'chirishni tasdiqlaysizmi?")) {
                // clear app keys
                [STORAGE_KEY,CAT_KEY,GOALS_KEY,PIN_KEY,PIN_TRIES_KEY,LIMIT_KEY,LANG_KEY,CUR_KEY,THEME_KEY,TRASH_KEY,RECUR_KEY,BUDGETS_KEY].forEach(k=>localStorage.removeItem(k));
                alert('Ma\'lumotlar o\'chirildi. Sahifa yangilanadi.');
                location.reload();
              } else {
                pinModal.style.display = 'none';
                cleanup();
                return resolve({ ok: false });
              }
            } else {
              alert(`Noto'g'ri PIN! Qolgan urinishlar: ${10 - tries}`);
              pinModalInput.value = '';
              pinModalInput.focus();
            }
          }
        }
        function onCancel() { pinModal.style.display = 'none'; cleanup(); resolve({ ok: false, cancelled: true }); }
        function onKey(e) { if (e.key === 'Enter') onOk(); if (e.key === 'Escape') onCancel(); }
        pinSubmitBtn.addEventListener('click', onOk);
        pinCancelBtn.addEventListener('click', onCancel);
        pinModalInput.addEventListener('keydown', onKey);
        function cleanup() {
          pinSubmitBtn.removeEventListener('click', onOk);
          pinCancelBtn.removeEventListener('click', onCancel);
          pinModalInput.removeEventListener('keydown', onKey);
        }
      });
    }
  
    // hide splash early to avoid "stuck" feeling
    const splashEl = $('splash');
    splashEl && setTimeout(()=> splashEl.classList.add('hide'), 1100);
  
    // Ask PIN non-blocking
    const pinRes = await showPinModal();
    if (!pinRes.ok) {
      console.warn('PIN check failed/cancelled - app in read-only mode');
      document.querySelectorAll('input,select,textarea,button').forEach(el => { if (!el.classList.contains('small-ctrl')) el.disabled = true; });
    }
  
    // -----------------------------
    // Date helper
    // -----------------------------
    function setTodayDate() {
      const t = new Date(); const yyyy = t.getFullYear(); const mm = String(t.getMonth()+1).padStart(2,'0'); const dd = String(t.getDate()).padStart(2,'0');
      if (dateEl) dateEl.value = `${yyyy}-${mm}-${dd}`;
    }
    setTodayDate();
  
    // -----------------------------
    // Render categories
    // -----------------------------
    function renderCategories() {
      if (!categoryEl || !filterCatEl) return;
      categoryEl.innerHTML = '';
      filterCatEl.innerHTML = `<option value="">Barchasi</option>`;
      categories.forEach(cat => {
        const o = document.createElement('option'); o.value = cat.name; o.textContent = `${cat.emoji} ${cat.name}`; categoryEl.appendChild(o);
        const o2 = o.cloneNode(true); filterCatEl.appendChild(o2);
      });
    }
    renderCategories();
  
    // -----------------------------
    // Render list + chart
    // -----------------------------
    let expChart = null;
    function renderChart(filtered) {
      if (!chartCanvas) return;
      try {
        const cats = categories.map(c=>c.name);
        const data = cats.map(cat => filtered.filter(e => e.category === cat && !e.deleted).reduce((s, it) => s + Number(it.amountUZS || 0), 0));
        if (typeof Chart !== 'undefined') {
          if (expChart) expChart.destroy();
          expChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: { labels: cats, datasets: [{ data, backgroundColor: ["#ff9800","#2196f3","#4caf50","#9c27b0","#ffeb3b","#e91e63","#607d8b"] }] },
            options: { plugins: { legend: { position: 'bottom' } } }
          });
        }
      } catch (e) {}
    }
  
    function calcTotal(list = expenses) { return list.reduce((s, it) => s + Number(it.amountUZS || 0), 0); }
    function getMonthExpenses(list = expenses, dateRef = new Date()) {
      const now = dateRef;
      return list.filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && !e.deleted; });
    }
  
    function formatNumberByCurrency(n) {
      if (currency === "UZS") return Number(n).toLocaleString("uz-UZ");
      if (currency === "USD") return (Number(n) / kursUSD).toFixed(2);
      if (currency === "RUB") return (Number(n) / kursRUB).toFixed(2);
      return Number(n).toLocaleString();
    }
  
    function renderList() {
      if (!listEl) return;
      listEl.innerHTML = '';
      const keyword = (searchEl && searchEl.value) ? searchEl.value.toLowerCase() : '';
      const filterCat = (filterCatEl && filterCatEl.value) ? filterCatEl.value : '';
      const filtered = expenses.filter(item => !item.deleted).filter(item => {
        const matchName = (item.name||'').toLowerCase().includes(keyword);
        const matchCat = !filterCat || item.category === filterCat;
        return matchName && matchCat;
      }).sort((a,b)=> new Date(b.date) - new Date(a.date));
  
      for (const item of filtered) {
        const li = document.createElement('li'); li.className = 'expense-item';
        const left = document.createElement('div'); left.className = 'expense-left';
        const cat = categories.find(c=>c.name===item.category) || { emoji:'', name: item.category };
        const displayAmount = formatNumberByCurrency(Number(item.amountUZS || 0));
        const origHint = item.originalAmount ? ` (${item.originalAmount} ${item.originalCurrency})` : '';
        left.innerHTML = `<div class="expense-name"><strong>${escapeHtml(item.name)}</strong></div><div class="expense-meta">${cat.emoji} ${escapeHtml(item.category)} · ${item.date || ''}${origHint}</div>`;
  
        const right = document.createElement('div'); right.className = 'expense-right';
        const amountSpan = document.createElement('span'); amountSpan.className = 'expense-amount'; amountSpan.innerHTML = `<b>${displayAmount}</b> ${currency}`; amountSpan.style.minWidth = '90px';
        const editBtn = document.createElement('button'); editBtn.className='del-btn'; editBtn.textContent='✏️'; editBtn.title='Tahrirlash'; editBtn.addEventListener('click', ()=> editExpense(item.id));
        const delBtn = document.createElement('button'); delBtn.className='del-btn'; delBtn.textContent='🗑️'; delBtn.title='O\'chirish'; delBtn.addEventListener('click', ()=> softDeleteExpense(item.id));
  
        right.appendChild(amountSpan); right.appendChild(editBtn); right.appendChild(delBtn);
        li.appendChild(left); li.appendChild(right);
        listEl.appendChild(li);
      }
  
      const total = calcTotal(getMonthExpenses(expenses));
      totalEl && (totalEl.textContent = formatNumberByCurrency(total));
      currencyLabel && (currencyLabel.textContent = currency === "UZS" ? "so'm" : (currency === "USD" ? "$" : "₽"));
      renderChart(filtered);
  
      const monthTotal = calcTotal(getMonthExpenses(expenses));
      if (limit > 0 && monthTotal > limit) {
        limitNotice && (limitNotice.textContent = `Diqqat! Oylik limitdan oshib ketdingiz. (${formatNumberByCurrency(monthTotal)} ${currency})`);
        try {
          if ("Notification" in window && Notification.permission === 'granted') new Notification('Oylik limit oshdi', { body: `${formatNumberByCurrency(monthTotal)} ${currency}` });
          else if ("Notification" in window && Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') new Notification('Oylik limit oshdi', { body: `${formatNumberByCurrency(monthTotal)} ${currency}` }); });
        } catch (e) {}
      } else { limitNotice && (limitNotice.textContent = ''); }
  
      checkBudgets();
    }
  
    // -----------------------------
    // Add / Edit expense (per-item currency)
    // -----------------------------
    function addOrEditExpense() {
      const name = (nameEl && nameEl.value) ? nameEl.value.trim() : '';
      const amountRaw = (amountEl && amountEl.value) ? amountEl.value.trim() : '';
      const category = (categoryEl && categoryEl.value) ? categoryEl.value : (categories[0] && categories[0].name);
      const date = (dateEl && dateEl.value) ? dateEl.value : (new Date().toISOString().slice(0,10));
      if (!name || !amountRaw) { alert("Iltimos, nom va summani kiriting!"); return; }
      const inputAmount = parseFloat(amountRaw);
      if (isNaN(inputAmount) || !isFinite(inputAmount)) { alert("Iltimos, to'g'ri summa kiriting!"); return; }
      const inputCurrency = (itemCurrencyEl && itemCurrencyEl.value) ? itemCurrencyEl.value : currency;
      const amountUZS = Math.round(convert(inputAmount, inputCurrency, 'UZS'));
      const nowIso = new Date().toISOString();
  
      if (editingId) {
        const expense = expenses.find(e=>e.id === editingId);
        if (expense) {
          expense.name = name;
          expense.amountUZS = amountUZS;
          expense.originalAmount = inputAmount;
          expense.originalCurrency = inputCurrency;
          expense.category = category;
          expense.date = date;
          expense.updatedAt = nowIso;
        }
        editingId = null;
        addBtn && (addBtn.textContent = "➕ Qo'shish");
      } else {
        const expense = { id: Date.now().toString(), name, amountUZS, originalAmount: inputAmount, originalCurrency: inputCurrency, category, date, createdAt: nowIso, updatedAt: nowIso, deleted: false };
        expenses.push(expense);
        window.dispatchEvent(new CustomEvent('expenseSaved', { detail: expense }));
      }
      saveState();
      renderList();
      nameEl && (nameEl.value = '');
      amountEl && (amountEl.value = '');
      setTodayDate();
      nameEl && nameEl.focus();
    }
  
    function editExpense(id) {
      const exp = expenses.find(e => e.id === id); if (!exp) return;
      nameEl && (nameEl.value = exp.name || '');
      if (itemCurrencyEl) itemCurrencyEl.value = exp.originalCurrency || currency;
      amountEl && (amountEl.value = exp.originalAmount != null ? exp.originalAmount : Number(convert(exp.amountUZS, 'UZS', itemCurrencyEl ? itemCurrencyEl.value : currency)).toFixed(2));
      categoryEl && (categoryEl.value = exp.category);
      dateEl && (dateEl.value = exp.date);
      editingId = id;
      addBtn && (addBtn.textContent = "✏️ Saqlash");
    }
  
    // -----------------------------
    // Trash / Undo helpers
    // -----------------------------
    function ensureToastArea() {
      let area = $('xh-toast-area');
      if (!area) {
        area = document.createElement('div'); area.id='xh-toast-area'; area.style.position='fixed'; area.style.left='16px'; area.style.bottom='80px'; area.style.zIndex='12000'; document.body.appendChild(area);
      }
      return area;
    }
    function showUndoToast(text, undoCb, timeout=8000) {
      const area = ensureToastArea();
      const card = document.createElement('div'); card.className='xh-toast'; card.style.background='linear-gradient(90deg,#8b5cf6,#4f46e5)'; card.style.color='#fff'; card.style.padding='10px'; card.style.borderRadius='8px'; card.style.marginBottom='8px';
      card.innerHTML = `<span>${escapeHtml(text)}</span> <button class="xh-undo-btn" style="margin-left:10px;padding:6px;border-radius:6px;background:rgba(255,255,255,0.12);color:#fff;border:none">Bekor qilish</button>`;
      const btn = card.querySelector('button'); area.appendChild(card);
      const timer = setTimeout(()=> { try{ card.remove(); } catch(e) {} }, timeout);
      btn.addEventListener('click', ()=> { clearTimeout(timer); try { undoCb(); } catch(e){} try{ card.remove(); } catch(e){} });
    }
  
    // -----------------------------
    // Notifications
    // -----------------------------
    function showNotification(title, body) {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") { new Notification(title, { body }); return; }
      if (Notification.permission !== "denied") Notification.requestPermission().then(p=> { if (p === "granted") new Notification(title, { body }); });
    }
  
    // -----------------------------
    // Budgets
    // -----------------------------
    function setBudgetForMonth(monthKey, amount, categoryBudgets = {}) {
      budgets[monthKey] = budgets[monthKey] || { total: 0, categories: {} };
      budgets[monthKey].total = amount;
      budgets[monthKey].categories = categoryBudgets;
      saveState();
    }
    function checkBudgets() {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const monthBudget = budgets[monthKey] || null;
      if (!monthBudget) return;
      const monthTotal = calcTotal(getMonthExpenses(expenses, now));
      if (monthBudget.total > 0 && monthTotal >= monthBudget.total) showNotification("Budjet tugadi", `Sizning oylik byudjetingiz ${formatNumberByCurrency(monthBudget.total)} ${currency} tugadi.`);
      for (let cat of Object.keys(monthBudget.categories || {})) {
        const catLimit = monthBudget.categories[cat];
        const catSum = getMonthExpenses(expenses, now).filter(e => e.category === cat).reduce((s,e)=>s+Number(e.amountUZS||0),0);
        if (catLimit > 0 && catSum >= catLimit) showNotification("Kategoriya byudjeti tugadi", `${cat} uchun belgilangan oylik limit oshdi.`);
      }
    }
  
    // -----------------------------
    // Recurring
    // -----------------------------
    function saveRecurring() { localStorage.setItem(RECUR_KEY, JSON.stringify(recurring)); }
    function addRecurring(rule) { rule.id = rule.id || Date.now().toString(); recurring.push(rule); saveRecurring(); }
    function processRecurring() {
      try {
        const today = new Date().toISOString().slice(0,10);
        const created = [];
        for (let r of recurring) {
          while (r.nextDate && r.nextDate <= today) {
            const already = expenses.some(e => e._recurringId === r.id && e.date === r.nextDate);
            if (!already) {
              const amountUZS = Math.round(convert(Number(r.amount || 0), r.currency || 'UZS', 'UZS'));
              const inst = {
                id: Date.now().toString() + Math.floor(Math.random()*1000),
                name: r.name,
                amountUZS,
                originalAmount: Number(r.amount || 0),
                originalCurrency: r.currency || 'UZS',
                category: r.category || (categories[0] && categories[0].name) || "Boshqa",
                date: r.nextDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _recurringId: r.id
              };
              expenses.push(inst);
              created.push(inst);
            }
            const nd = new Date(r.nextDate + 'T00:00:00');
            if (r.interval === 'daily') nd.setDate(nd.getDate()+1);
            else if (r.interval === 'weekly') nd.setDate(nd.getDate()+7);
            else nd.setMonth(nd.getMonth()+1);
            r.nextDate = nd.toISOString().slice(0,10);
            if (r.endDate && r.nextDate > r.endDate) { r.nextDate = null; break; }
          }
        }
        if (created.length) {
          saveState();
          saveRecurring();
          showNotification("Takrorlanuvchi xarajatlar qo'shildi", `${created.length} ta avtomatik xarajat qo'shildi.`);
          window.dispatchEvent(new CustomEvent('recurringCreated', { detail: created }));
        } else {
          saveRecurring();
        }
      } catch (e) {}
    }
    processRecurring();
  
    // -----------------------------
    // Export / Import
    // -----------------------------
    function exportJSON() {
      const dump = { meta: { exportedAt: new Date().toISOString(), currencyBase: 'UZS' }, expenses, categories, recurring, budgets, goals: goalList };
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
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.expenses && Array.isArray(data.expenses)) {
            if (confirm("Ma'lumotlarni mavjudlarga qo'shasizmi? (OK = qo'shish, Cancel = yangilash)")) {
              const existingIds = new Set(expenses.map(x=>x.id));
              let added = 0;
              for (let item of data.expenses) {
                if (!existingIds.has(item.id)) { expenses.push(item); added++; }
              }
              saveState(); renderList(); alert(`${added} ta yozuv qo'shildi.`);
            } else {
              expenses = data.expenses; categories = data.categories || categories; recurring = data.recurring || recurring; budgets = data.budgets || budgets; goalList = data.goals || goalList;
              saveState(); renderCategories(); renderList(); alert("Ma'lumotlar yangilandi.");
            }
          } else alert("Fayl formati noto'g'ri.");
        } catch (err) { alert("JSON o'qishda xatolik: " + err.message); }
      };
      reader.readAsText(file);
    }
    function importCSVFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (!lines.length) { alert("CSV bo'sh"); return; }
          const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,''));
          const added = [];
          for (let i=1;i<lines.length;i++) {
            const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v=>v.replace(/^"|"$/g,'')) || [];
            if (!values.length) continue;
            const rec = {}; headers.forEach((h,j)=> rec[h] = values[j] || '');
            const eItem = {
              id: rec.id || Date.now().toString() + i,
              name: rec.name || 'Untitled',
              date: rec.date || new Date().toISOString().slice(0,10),
              amountUZS: Number(rec.amountUZS) || Math.round(convert(Number(rec.originalAmount || 0), rec.originalCurrency || 'UZS','UZS')),
              originalAmount: rec.originalAmount || '',
              originalCurrency: rec.originalCurrency || 'UZS',
              category: rec.category || (categories[0] && categories[0].name) || 'Boshqa',
              createdAt: rec.createdAt || new Date().toISOString()
            };
            expenses.push(eItem); added.push(eItem);
          }
          saveState(); renderList(); alert(`${added.length} ta yozuv CSV orqali import qilindi.`);
        } catch (err) { alert('Import CSV failed: ' + err.message); }
      };
      reader.readAsText(file);
    }
  
    // -----------------------------
    // Trash modal (UI)
    // -----------------------------
    function showTrashModal() {
      let modal = $('xh-trash-modal');
      if (!modal) {
        modal = document.createElement('div'); modal.id='xh-trash-modal'; modal.className='xh-modal';
        modal.innerHTML = `<div class="xh-modal-inner"><h3>Trash - O'chirilgan yozuvlar</h3><div id="xh-trash-list" style="max-height:300px;overflow:auto"></div><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;"><button id="xh-trash-close" class="small-ctrl">Yopish</button><button id="xh-trash-clear" class="small-ctrl danger">Tozalash</button></div></div>`;
        document.body.appendChild(modal);
        document.getElementById('xh-trash-close').addEventListener('click', ()=> modal.remove());
        document.getElementById('xh-trash-clear').addEventListener('click', ()=> { if (confirm("Trash tozalansinmi?")) { trash=[]; saveState(); modal.remove(); renderList(); } });
      }
      const list = document.getElementById('xh-trash-list'); list.innerHTML = '';
      if (!trash.length) list.innerHTML = "<div style=\"color:var(--muted);padding:12px;text-align:center\">Trash bo'sh</div>";
      for (let t of trash) {
        const el = document.createElement('div'); el.className='xh-trash-item';
        el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><b>${escapeHtml(t.name)}</b><div style="font-size:13px;color:var(--muted)">${t.date} · ${t.category}</div></div><div style="display:flex;gap:8px"><button class="xh-restore small-ctrl">Tiklash</button><button class="xh-delete small-ctrl danger">O'chirish</button></div></div>`;
        list.appendChild(el);
        el.querySelector('.xh-restore').addEventListener('click', ()=> { restoreFromTrash(t.id); showTrashModal(); });
        el.querySelector('.xh-delete').addEventListener('click', ()=> { if (confirm("Bu yozuvni doimiy o'chirishni tasdiqlaysizmi?")) { trash = trash.filter(x=>x.id !== t.id); saveState(); showTrashModal(); } });
      }
      modal.style.position='fixed'; modal.style.left='0'; modal.style.top='0'; modal.style.right='0'; modal.style.bottom='0'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; modal.style.background='rgba(0,0,0,0.35)';
      modal.querySelector('.xh-modal-inner').style.background='var(--goal-bg)'; modal.querySelector('.xh-modal-inner').style.padding='18px';
    }
  
    // -----------------------------
    // Stats (helpers)
    // -----------------------------
    function renderStatsChart(labels, data) {
      try {
        if (window.statsChartObj) window.statsChartObj.destroy();
        window.statsChartObj = new Chart(statsChart, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Sarflangan summa', data, backgroundColor: theme === "dark" ? "#8b5cf6" : "#4caf50" }] },
          options: { scales: { x: { ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" } }, y: { beginAtZero:true, ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" } } }, plugins: { legend: { display: false } } }
        });
      } catch (e) {}
    }
    function showStatsToday() {
      const today = new Date(); const key = today.toISOString().slice(0,10);
      const todayExp = expenses.filter(e => e.date === key && !e.deleted);
      statDate && (statDate.textContent = `Bugun: ${key}`);
      const cats = categories.map(c=>c.name);
      const data = cats.map(cat => todayExp.filter(e=>e.category===cat).reduce((sum,e)=>sum+Number(e.amountUZS||0),0));
      renderStatsChart(cats, data);
      statsList && (statsList.innerHTML = cats.map((cat,i)=>`<div>${categories[i].emoji} ${cat}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></div>`).join(''));
    }
    function showStatsYesterday() {
      const yester = new Date(Date.now()-86400000); const key = yester.toISOString().slice(0,10);
      const yesterExp = expenses.filter(e=>e.date===key && !e.deleted);
      statDate && (statDate.textContent = `Kecha: ${key}`);
      const cats = categories.map(c=>c.name);
      const data = cats.map(cat => yesterExp.filter(e=>e.category===cat).reduce((sum,e)=>sum+Number(e.amountUZS||0),0));
      renderStatsChart(cats, data);
      statsList && (statsList.innerHTML = cats.map((cat,i)=>`<div>${categories[i].emoji} ${cat}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></div>`).join(''));
    }
    function showStats7Days() {
      const days = []; for (let i=6;i>=0;i--) { const d=new Date(Date.now()-86400000*i); days.push(d.toISOString().slice(0,10)); }
      const data = days.map(day => expenses.filter(e=>e.date===day && !e.deleted).reduce((sum,e)=>sum+Number(e.amountUZS||0),0));
      statDate && (statDate.textContent = `Oxirgi 7 kun: ${days[0]} - ${days[6]}`);
      renderStatsChart(days, data);
      statsList && (statsList.innerHTML = days.map((day,i)=>`<div>${day}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></div>`).join(''));
    }
  
    // -----------------------------
    // Goals
    // -----------------------------
    function saveGoalsLocal() { try { localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); } catch(e) {} }
    function renderGoalList() {
      if (!goalListDiv) return;
      goalListDiv.innerHTML = '';
      if (!goalList.length) { goalListDiv.innerHTML = `<div style='text-align:center;color:var(--muted);margin-top:18px;'>Maqsadlar hali yo'q</div>`; return; }
      goalList.forEach((goal, idx) => {
        const card = document.createElement('div'); card.className = 'goal-card';
        const current = goal.current || 0; const percent = Math.min(100, Math.round(current / goal.target * 100));
        card.innerHTML = `<div class="goal-title">${escapeHtml(goal.name)}</div><div class="goal-meta">Maqsad: <b>${Number(goal.target).toLocaleString('uz-UZ')}</b> ${goal.currency}<br>Yig'ilgan: <b class="goal-amount">${Number(current).toLocaleString('uz-UZ')}</b></div><div class="goal-progress-bar"><div class="goal-progress-inner" style="width:${percent}%"></div></div><div class="goal-pct">${percent}%</div>`;
        goalListDiv.appendChild(card);
      });
    }
  
    // -----------------------------
    // Wire up events
    // -----------------------------
    addBtn && addBtn.addEventListener('click', addOrEditExpense);
    amountEl && amountEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') addOrEditExpense(); });
    nameEl && nameEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') amountEl && amountEl.focus(); });
    searchEl && searchEl.addEventListener('input', renderList);
    filterCatEl && filterCatEl.addEventListener('change', renderList);
    dateEl && dateEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') addOrEditExpense(); });
    currencySwitch && currencySwitch.addEventListener('change', ()=> { currency = currencySwitch.value; localStorage.setItem(CUR_KEY, currency); renderList(); renderGoalList(); });
  
    limitInput && (limitInput.value = limit > 0 ? limit : '');
    limitSaveBtn && limitSaveBtn.addEventListener('click', ()=> { limit = Number(limitInput.value) || 0; localStorage.setItem(LIMIT_KEY, limit); renderList(); });
  
    addCatBtn && addCatBtn.addEventListener('click', ()=> { catModal && (catModal.style.display = 'block'); newCatName && (newCatName.value = ''); newCatEmoji && (newCatEmoji.value = ''); });
    closeCatModal && closeCatModal.addEventListener('click', ()=> catModal && (catModal.style.display = 'none'));
    saveCatBtn && saveCatBtn.addEventListener('click', ()=> {
      const name = newCatName.value.trim(); const emoji = newCatEmoji.value.trim() || '📦';
      if (!name) { alert('Kategoriya nomini kiriting!'); return; }
      if (categories.some(c=>c.name===name)) { alert('Bu nomda kategoriya bor!'); return; }
      categories.push({ name, emoji }); saveState(); renderCategories(); catModal && (catModal.style.display = 'none');
    });
  
    exportJsonBtn && exportJsonBtn.addEventListener('click', exportJSON);
    exportCsvBtn && exportCsvBtn.addEventListener('click', exportCSV);
    importBtn && importBtn.addEventListener('click', ()=> importFile && importFile.click());
    importFile && importFile.addEventListener('change', (ev)=> { const f = ev.target.files[0]; if (!f) return; if (f.name.toLowerCase().endsWith('.json')) importJSONFile(f); else importCSVFile(f); importFile.value = ''; });
  
    recurringBtn && recurringBtn.addEventListener('click', ()=> {
      const name = prompt("Recurring nomi (masalan: Abonent to'lov):"); if (!name) return;
      const amount = prompt("Summa:"); const interval = prompt("Interval (daily, weekly, monthly):", "monthly"); const cat = prompt("Kategoriya nomi:", categories[0] ? categories[0].name : "Boshqa"); const next = prompt("Birinchi sana (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
      addRecurring({ name, amount: Number(amount || 0), currency, category: cat, interval, nextDate: next });
      alert("Recurring qo'shildi.");
    });
  
    budgetBtn && budgetBtn.addEventListener('click', ()=> {
      const month = prompt("Budjet oy (YYYY-MM):", new Date().toISOString().slice(0,7)); const total = prompt("Umumiy byudjet (UZS):", "0");
      if (!month) return; setBudgetForMonth(month, Number(total || 0), {}); alert("Budget saqlandi.");
    });
  
    trashBtn && trashBtn.addEventListener('click', showTrashModal);
  
    tabHome && tabHome.addEventListener('click', ()=> { tabHome.classList.add('active'); tabChart.classList.remove('active'); tabGoal.classList.remove('active'); homePage.style.display=''; chartPage.style.display='none'; goalPage.style.display='none'; });
    tabChart && tabChart.addEventListener('click', ()=> { tabHome.classList.remove('active'); tabChart.classList.add('active'); tabGoal.classList.remove('active'); homePage.style.display='none'; chartPage.style.display=''; goalPage.style.display='none'; showStatsToday(); });
    tabGoal && tabGoal.addEventListener('click', ()=> { tabHome.classList.remove('active'); tabChart.classList.remove('active'); tabGoal.classList.add('active'); homePage.style.display='none'; chartPage.style.display='none'; goalPage.style.display=''; renderGoalList(); });
  
    showTodayBtn && showTodayBtn.addEventListener('click', ()=> { showStatsToday(); });
    showYesterdayBtn && showYesterdayBtn.addEventListener('click', ()=> { showStatsYesterday(); });
    show7DaysBtn && show7DaysBtn.addEventListener('click', ()=> { showStats7Days(); });
  
    addGoalBtn && addGoalBtn.addEventListener('click', ()=> {
      const name = (goalName && goalName.value) ? goalName.value.trim() : ''; const target = (goalTarget && Number(goalTarget.value)) ? Number(goalTarget.value) : 0; const currencyG = (goalCurrency && goalCurrency.value) ? goalCurrency.value : 'UZS';
      if (!name || !target || target<=0) { alert("Narsa nomi va narxini to'g'ri kiriting!"); return; }
      goalList.push({ name, target, current:0, currency:currencyG, progressHistory:[] }); saveGoalsLocal(); goalName.value=''; goalTarget.value=''; renderGoalList();
    });
  
    // -----------------------------
    // Initial render & recurring
    // -----------------------------
    renderList();
    renderGoalList();
    processRecurring();
  
    // hide splash as final safety
    setTimeout(()=> { const s = $('splash'); if (s && !s.classList.contains('hide')) s.classList.add('hide'); }, 2000);
  
    // expose debug helpers
    window.__XH = {
      addRecurring, processRecurring, exportJSON, exportCSV, importJSONFile, importCSVFile,
      setBudgetForMonth, restoreFromTrash, getState: ()=>({ expenses, categories, recurring, trash, budgets, goalList })
    };
  });