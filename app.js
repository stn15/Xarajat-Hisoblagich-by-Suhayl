   document.addEventListener('DOMContentLoaded', async () => {
    // --- VALYUTA KURSLARI ---
    let kursUSD = 12000, kursRUB = 140;
    async function fetchRates() {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/UZS');
        const d = await r.json();
        if (d && d.rates) {
          kursUSD = 1 / d.rates.USD;
          kursRUB = 1 / d.rates.RUB;
        }
      } catch (e) {
        // silent
      }
    }
    await fetchRates();
    setInterval(fetchRates, 1000 * 60 * 60 * 3);
  
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
  
    // --- STORAGE KEYS ---
    const STORAGE_KEY = 'expenses_v3'; // bump version to v3 for migration safety
    const CAT_KEY = 'categories_v2';
    const LIMIT_KEY = 'limit_v2';
    const LANG_KEY = 'lang_v2';
    const CUR_KEY = 'currency_v2';
    const THEME_KEY = 'theme_v2';
    const GOALS_KEY = 'goal_list';
    const TRASH_KEY = 'trash_v1'; // optional: separate trash store
    const RECUR_KEY = 'recurring_v1';
    const BUDGETS_KEY = 'budgets_v1';
  
    // --- PIN (same as before, hash) ---
    const PIN_KEY = 'user_pin';
    const PIN_TRIES_KEY = 'pin_tries';
    async function hashPin(pin) {
      const enc = new TextEncoder().encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    async function askPinIfNeeded() {
      const savedHash = localStorage.getItem(PIN_KEY);
      if (!savedHash) return true;
      let tries = Number(localStorage.getItem(PIN_TRIES_KEY) || "0");
      while (true) {
        let userPin = prompt("Ilovaga kirish uchun PIN kodni kiriting:");
        if (userPin === null) return false;
        const userHash = await hashPin(userPin);
        if (userHash === savedHash) {
          localStorage.setItem(PIN_TRIES_KEY, "0");
          return true;
        } else {
          tries++;
          localStorage.setItem(PIN_TRIES_KEY, tries.toString());
          if (tries >= 10) {
            if (confirm("10 marta noto'g'ri urinish! Ma'lumotlarni o'chirishni tasdiqlaysizmi?")) {
              clearAllData();
              alert("Ma'lumotlar o'chirildi.");
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
    function clearAllData() {
      const keys = [STORAGE_KEY, CAT_KEY, GOALS_KEY, PIN_KEY, PIN_TRIES_KEY, LIMIT_KEY, LANG_KEY, CUR_KEY, THEME_KEY, TRASH_KEY, RECUR_KEY, BUDGETS_KEY];
      keys.forEach(k => localStorage.removeItem(k));
    }
  
    // ask pin
    if (!await askPinIfNeeded()) return;
  
    // --- ELEMENTS (existing) ---
    const nameEl = document.getElementById('name');
    const amountEl = document.getElementById('amount');
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
  
    // Tab pages
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
  
    // --- NEW UI injection area (top-controls) ---
    const topControls = document.querySelector('.top-controls') || null;
  
    // --- STATE ---
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
    let recurring = []; // recurring entries
    let trash = []; // soft-deleted items (for undo / restore)
    let budgets = {}; // { monthKey: { total: number, categories: { catName: amount } } } or simple monthly limit
    let editingId = null;
    let limit = Number(localStorage.getItem(LIMIT_KEY) || "0");
    let lang = localStorage.getItem(LANG_KEY) || "uz";
    let currency = localStorage.getItem(CUR_KEY) || "UZS";
    let theme = localStorage.getItem(THEME_KEY);
    let goalList = [];
  
    // load from storage (migration aware)
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
    loadState();
  
    // Migration helper: detect older data (amounts maybe stored without originalCurrency)
    function migrateIfNeeded() {
      // if any expense missing amountUZS but has amount, assume older format and the saved currency is CUR_KEY
      const savedCurrency = localStorage.getItem(CUR_KEY) || "UZS";
      let changed = false;
      for (let e of expenses) {
        if (e.amount && !e.amountUZS && !e.originalCurrency) {
          // assume stored amount is in savedCurrency
          const orig = Number(e.amount);
          const amountUZS = Math.round(convert(orig, savedCurrency, 'UZS'));
          e.originalAmount = orig;
          e.originalCurrency = savedCurrency;
          e.amountUZS = amountUZS;
          // remove old ambiguous field
          delete e.amount;
          changed = true;
        } else if (e.amount && e.amountUZS && !e.originalCurrency) {
          // older duplicate pattern, normalize
          e.originalAmount = e.amount;
          e.originalCurrency = savedCurrency;
          delete e.amount;
          changed = true;
        } else if (e.amountUZS && !e.originalCurrency) {
          // might be already UZS but missing original info
          e.originalAmount = e.amountUZS;
          e.originalCurrency = 'UZS';
          changed = true;
        }
      }
      if (changed) {
        save();
        console.info("Migration applied: normalized amounts to amountUZS + original* fields.");
      }
    }
    migrateIfNeeded();
  
    // --- THEME HANDLING (as before) ---
    function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function applyTheme(newTheme) {
      document.body.classList.remove('light-mode', 'dark-mode');
      document.body.classList.add(newTheme + '-mode');
      themeSwitch.textContent = newTheme === "dark" ? "🌙" : "☀️";
      Chart.defaults.color = newTheme === "dark" ? "#cbd5e1" : "#222";
      Chart.defaults.plugins.legend.labels.color = newTheme === "dark" ? "#cbd5e1" : "#222";
      Chart.defaults.scales = {
        x: { ticks: { color: newTheme === "dark" ? "#cbd5e1" : "#222" }, grid: { color: newTheme === "dark" ? "#22242c" : "#e0e7ef" } },
        y: { ticks: { color: newTheme === "dark" ? "#cbd5e1" : "#222" }, grid: { color: newTheme === "dark" ? "#22242c" : "#e0e7ef" } }
      };
    }
    if (!theme) {
      theme = getSystemTheme();
      localStorage.setItem(THEME_KEY, theme);
    }
    applyTheme(theme);
  
    themeSwitch.addEventListener('click', () => {
      theme = (theme === "dark") ? "light" : "dark";
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
      renderList();
      renderGoalList();
      showStatsToday();
    });
  
    // --- HELPERS ---
    function escapeHtml(str) {
      return String(str || '').replace(/[&<>"']/g, function (s) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]);
      });
    }
    function highlightMatch(text, keyword) {
      if (!keyword) return escapeHtml(text);
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }
    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      localStorage.setItem(CAT_KEY, JSON.stringify(categories));
      localStorage.setItem(GOALS_KEY, JSON.stringify(goalList));
      localStorage.setItem(RECUR_KEY, JSON.stringify(recurring));
      localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    }
    function formatNumberUZS(n) {
      return Number(n).toLocaleString("uz-UZ");
    }
    function formatNumberByCurrency(n) {
      if (currency === "UZS") return formatNumberUZS(n);
      if (currency === "USD") return (Number(n) / kursUSD).toFixed(2);
      if (currency === "RUB") return (Number(n) / kursRUB).toFixed(2);
      return Number(n).toLocaleString();
    }
    function calcTotal(list = expenses) {
      return list.reduce((s, it) => s + Number(it.amountUZS || 0), 0);
    }
    function getMonthExpenses(list = expenses, dateRef = new Date()) {
      const now = dateRef;
      return list.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && !e.deleted;
      });
    }
  
    // set today date
    function setTodayDate() {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dateEl.value = `${yyyy}-${mm}-${dd}`;
    }
    setTodayDate();
  
    // --- RENDER CATEGORIES (safe) ---
    function renderCategories() {
      categoryEl.innerHTML = "";
      filterCatEl.innerHTML = `<option value="">Barchasi</option>`;
      categories.forEach(cat => {
        const option1 = document.createElement('option');
        option1.value = cat.name;
        option1.textContent = `${cat.emoji} ${cat.name}`;
        categoryEl.appendChild(option1);
        const option2 = option1.cloneNode(true);
        filterCatEl.appendChild(option2);
      });
    }
    renderCategories();
  
    // --- RENDER LIST ---
    let expChart = null;
    function renderChart(filtered) {
      if (!chartCanvas) return;
      const cats = categories.map(c => c.name);
      const data = cats.map(cat => filtered.filter(e => e.category === cat && !e.deleted).reduce((sum, e) => sum + Number(e.amountUZS || 0), 0));
      if (expChart) expChart.destroy();
      expChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
          labels: cats,
          datasets: [{
            data: data,
            backgroundColor: [
              "#ff9800", "#2196f3", "#4caf50", "#9c27b0", "#ffeb3b", "#e91e63", "#607d8b"
            ]
          }]
        },
        options: {
          plugins: { legend: { position: 'bottom', labels: { color: theme === "dark" ? "#cbd5e1" : "#222" } } }
        }
      });
    }
  
    function renderList() {
      listEl.innerHTML = '';
      const keyword = (searchEl?.value ?? '').toLowerCase();
      const filterCat = filterCatEl?.value ?? '';
      let filtered = expenses.filter(item => {
        if (item.deleted) return false;
        const matchName = item.name.toLowerCase().includes(keyword);
        const matchCat = !filterCat || item.category === filterCat;
        return matchName && matchCat;
      }).sort((a,b)=> new Date(b.date) - new Date(a.date));
  
      for (const item of filtered) {
        const li = document.createElement('li');
        const left = document.createElement('div');
        const cat = categories.find(c => c.name === item.category) || { emoji: '', name: item.category };
  
        const displayAmount = formatNumberByCurrency(Number(item.amountUZS || 0));
        // show original amount as small hint
        const origHint = item.originalAmount ? ` (${item.originalAmount} ${item.originalCurrency})` : '';
  
        left.innerHTML = `
          <div style="display:flex;flex-direction:column;">
            <div><span style="font-weight:600">${highlightMatch(item.name, keyword)}</span></div>
            <div style="font-size:13px;color:var(--muted)">${cat.emoji} ${escapeHtml(item.category)} · ${item.date}${origHint}</div>
          </div>
        `;
  
        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.alignItems = 'center';
        right.style.gap = '8px';
  
        const amountSpan = document.createElement('span');
        amountSpan.innerHTML = `<b>${displayAmount}</b> ${currency}`;
        amountSpan.style.minWidth = '90px';
  
        const editBtn = document.createElement('button');
        editBtn.className = 'del-btn';
        editBtn.textContent = '✏️';
        editBtn.title = "Tahrirlash";
        editBtn.addEventListener('click', () => editExpense(item.id));
  
        const delBtn = document.createElement('button');
        delBtn.className = 'del-btn';
        delBtn.textContent = '🗑️';
        delBtn.title = "O'chirish (trash)";
        delBtn.addEventListener('click', () => softDeleteExpense(item.id));
  
        right.appendChild(amountSpan);
        right.appendChild(editBtn);
        right.appendChild(delBtn);
  
        li.appendChild(left);
        li.appendChild(right);
        listEl.appendChild(li);
      }
  
      totalEl.textContent = formatNumberByCurrency(filtered.reduce((s, it) => s + Number(it.amountUZS || 0), 0));
      currencyLabel.textContent = currency === "UZS" ? "so'm" : (currency === "USD" ? "$" : "₽");
      renderChart(filtered);
  
      // limit/budget check
      let monthTotal = calcTotal(getMonthExpenses(expenses));
      if (limit > 0 && monthTotal > limit) {
        limitNotice.textContent = `Diqqat! Oylik limitdan oshib ketdingiz. (${formatNumberByCurrency(monthTotal)} ${currency})`;
        showNotification("Oylik limit oshdi", `Sizning oylik xarajatlaringiz ${formatNumberByCurrency(monthTotal)} ${currency} ga yetdi.`);
      } else {
        limitNotice.textContent = "";
      }
  
      // category budgets
      checkBudgets();
    }
  
    // --- ADD / EDIT with per-item currency ---
    function addOrEditExpense() {
      const name = nameEl.value.trim();
      const amountRaw = amountEl.value.trim();
      const category = categoryEl.value;
      const date = dateEl.value;
      if (!name || !amountRaw) {
        alert("Iltimos, nom va summani kiriting!");
        return;
      }
      if (!date) {
        alert("Iltimos, sanani tanlang!");
        return;
      }
      const inputAmount = parseFloat(amountRaw);
      if (isNaN(inputAmount) || !isFinite(inputAmount)) {
        alert("Iltimos, to'g'ri summa kiriting!");
        return;
      }
  
      // User input is in currently selected currency. Convert to UZS for storage, but store original too.
      const amountUZS = Math.round(convert(inputAmount, currency, 'UZS'));
      const nowIso = new Date().toISOString();
  
      if (editingId) {
        const expense = expenses.find(e => e.id === editingId);
        if (expense) {
          expense.name = name;
          expense.amountUZS = amountUZS;
          expense.originalAmount = inputAmount;
          expense.originalCurrency = currency;
          expense.category = category;
          expense.date = date;
          expense.updatedAt = nowIso;
        }
        // dispatch update
        window.dispatchEvent(new CustomEvent('expenseSaved', { detail: expenses.find(e => e.id === editingId) }));
        editingId = null;
        addBtn.textContent = "➕ Qo'shish";
      } else {
        const expense = {
          id: Date.now().toString(),
          name,
          amountUZS,
          originalAmount: inputAmount,
          originalCurrency: currency,
          category,
          date,
          createdAt: nowIso,
          updatedAt: nowIso,
          deleted: false
        };
        expenses.push(expense);
        window.dispatchEvent(new CustomEvent('expenseSaved', { detail: expense }));
      }
      save();
      renderList();
      nameEl.value = '';
      amountEl.value = '';
      setTodayDate();
      nameEl.focus();
    }
  
    function editExpense(id) {
      const expense = expenses.find(e => e.id === id);
      if (!expense) return;
      nameEl.value = expense.name || '';
      // show amount in current selected currency by converting from UZS
      if (currency === expense.originalCurrency) {
        // prefer original if same currency
        amountEl.value = expense.originalAmount != null ? expense.originalAmount : parseFloat(convert(expense.amountUZS, 'UZS', currency)).toFixed(2);
      } else {
        amountEl.value = Number(convert(expense.amountUZS, 'UZS', currency)).toFixed(2);
      }
      categoryEl.value = expense.category;
      dateEl.value = expense.date;
      editingId = id;
      addBtn.textContent = "✏️ Saqlash";
    }
  
    // --- SOFT DELETE (trash) & UNDO ---
    const UNDO_TIMEOUT = 10000; // 10s to undo
    function softDeleteExpense(id) {
      const idx = expenses.findIndex(e => e.id === id);
      if (idx === -1) return;
      const [item] = expenses.splice(idx, 1);
      item.deleted = true;
      item.deletedAt = new Date().toISOString();
      trash.unshift(item);
      save();
      renderList();
      showUndoToast(`"${item.name}" o'chirildi`, () => {
        // undo handler
        restoreFromTrash(item.id);
      }, UNDO_TIMEOUT);
      // schedule permanent deletion after timeout (if not undone)
      setTimeout(() => {
        const tIdx = trash.findIndex(t => t.id === item.id);
        if (tIdx !== -1) {
          // permanently remove after UNDO_TIMEOUT*2 safety (or keep for manual trash)
          // For now, keep in trash until user manually clears or uses longer policy
        }
      }, UNDO_TIMEOUT + 1000);
    }
    function restoreFromTrash(id) {
      const idx = trash.findIndex(t => t.id === id);
      if (idx === -1) return;
      const [item] = trash.splice(idx, 1);
      delete item.deleted;
      delete item.deletedAt;
      expenses.push(item);
      save();
      renderList();
      showNotification("Tiklash", `"${item.name}" tiklandi.`);
    }
  
    // --- TOAST / UNDO UI (injected) ---
    function ensureToastArea() {
      if (!document.getElementById('xh-toast-area')) {
        const div = document.createElement('div');
        div.id = 'xh-toast-area';
        div.style.position = 'fixed';
        div.style.left = '16px';
        div.style.bottom = '80px';
        div.style.zIndex = '12000';
        document.body.appendChild(div);
      }
    }
    function showUndoToast(text, undoCb, timeout = 8000) {
      ensureToastArea();
      const area = document.getElementById('xh-toast-area');
      const card = document.createElement('div');
      card.className = 'xh-toast';
      card.innerHTML = `<span>${escapeHtml(text)}</span> <button class="xh-undo-btn">Bekor qilish</button>`;
      area.appendChild(card);
      const btn = card.querySelector('.xh-undo-btn');
      const timer = setTimeout(() => {
        card.remove();
      }, timeout);
      btn.addEventListener('click', () => {
        clearTimeout(timer);
        try { undoCb(); } catch (e) {}
        card.remove();
      });
    }
  
    // --- NOTIFICATIONS (browser) ---
    function showNotification(title, body) {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification(title, { body });
        return;
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, { body });
          } else {
            // fallback alert
            console.info("Notification blocked:", title, body);
          }
        });
      }
    }
  
    // --- BUDGETS: simple monthly and per-category budgets ---
    function setBudgetForMonth(monthKey, amount, categoryBudgets = {}) {
      budgets[monthKey] = budgets[monthKey] || { total: 0, categories: {} };
      budgets[monthKey].total = amount;
      budgets[monthKey].categories = categoryBudgets;
      save();
    }
    function checkBudgets() {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const monthBudget = budgets[monthKey] || null;
      if (!monthBudget) return;
      const monthTotal = calcTotal(getMonthExpenses(expenses, now));
      if (monthBudget.total > 0 && monthTotal >= monthBudget.total) {
        showNotification("Budjet tugadi", `Sizning oylik byudjetingiz ${formatNumberByCurrency(monthBudget.total)} ${currency} tugadi.`);
      }
      // per-category
      for (let cat of Object.keys(monthBudget.categories || {})) {
        const catLimit = monthBudget.categories[cat];
        const catSum = getMonthExpenses(expenses, now).filter(e => e.category === cat).reduce((s,e)=>s+Number(e.amountUZS||0),0);
        if (catLimit > 0 && catSum >= catLimit) {
          showNotification("Kategoriya byudjeti tugadi", `${cat} uchun belgilangan oylik limit oshdi.`);
        }
      }
    }
  
    // --- RECURRING: check and create expenses if needed ---
    function saveRecurring() {
      localStorage.setItem(RECUR_KEY, JSON.stringify(recurring));
    }
    function addRecurring(rule) {
      // rule: { id, name, amount, currency, category, interval: 'daily'|'weekly'|'monthly', nextDate: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD' }
      rule.id = rule.id || Date.now().toString();
      recurring.push(rule);
      saveRecurring();
    }
    function processRecurring() {
      const today = new Date().toISOString().slice(0,10);
      let created = [];
      for (let r of recurring) {
        // while nextDate <= today create entries and advance
        while (r.nextDate && r.nextDate <= today) {
          // create expense instance if not previously created for that date (prevent duplicates via createdHistory)
          const already = expenses.some(e => e._recurringId === r.id && e.date === r.nextDate);
          if (!already) {
            const amountUZS = Math.round(convert(Number(r.amount), r.currency || 'UZS', 'UZS'));
            const inst = {
              id: Date.now().toString() + Math.floor(Math.random()*1000),
              name: r.name,
              amountUZS,
              originalAmount: Number(r.amount),
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
          // advance nextDate depending on interval
          const nd = new Date(r.nextDate + 'T00:00:00');
          if (r.interval === 'daily') nd.setDate(nd.getDate()+1);
          else if (r.interval === 'weekly') nd.setDate(nd.getDate()+7);
          else nd.setMonth(nd.getMonth()+1);
          r.nextDate = nd.toISOString().slice(0,10);
          // if endDate specified and exceeded, stop recurring
          if (r.endDate && r.nextDate > r.endDate) {
            r.nextDate = null;
            break;
          }
        }
      }
      save();
      saveRecurring();
      if (created.length) {
        showNotification("Takrorlanuvchi xarajatlar qo'shildi", `${created.length} ta avtomatik xarajat qo'shildi.`);
        window.dispatchEvent(new CustomEvent('recurringCreated', { detail: created }));
      }
    }
    // process recurring on load
    processRecurring();
  
    // --- EXPORT / IMPORT (JSON and CSV) ---
    function exportJSON() {
      const dump = {
        meta: { exportedAt: new Date().toISOString(), currencyBase: 'UZS' },
        expenses,
        categories,
        recurring,
        budgets,
        goals: goalList
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `xarajat_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    function exportCSV() {
      // simple CSV: id,name,date,amountUZS,originalAmount,originalCurrency,category,createdAt
      const rows = [['id','name','date','amountUZS','originalAmount','originalCurrency','category','createdAt']];
      for (let e of expenses) {
        rows.push([e.id, e.name, e.date, e.amountUZS || 0, e.originalAmount || '', e.originalCurrency || '', e.category, e.createdAt || '']);
      }
      const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `xarajat_export_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    function importJSONFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.expenses && Array.isArray(data.expenses)) {
            // prompt merge vs replace
            if (confirm("Ma'lumotlarni mavjudlarga qo'shasizmi? (OK = qo'shish, Cancel = yangilash)")) {
              // merge: append only non-duplicate by id
              const existingIds = new Set(expenses.map(x=>x.id));
              let added = 0;
              for (let item of data.expenses) {
                if (!existingIds.has(item.id)) {
                  expenses.push(item);
                  added++;
                }
              }
              save();
              renderList();
              alert(`${added} ta yozuv qo'shildi.`);
            } else {
              // replace
              expenses = data.expenses;
              categories = data.categories || categories;
              recurring = data.recurring || recurring;
              budgets = data.budgets || budgets;
              goalList = data.goals || goalList;
              save();
              renderCategories();
              renderList();
              alert("Ma'lumotlar yangilandi.");
            }
          } else {
            alert("Fayl formati noto'g'ri.");
          }
        } catch (err) {
          alert("JSON o'qishda xatolik: " + err.message);
        }
      };
      reader.readAsText(file);
    }
    function importCSVFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (!lines.length) { alert("CSV bo'sh"); return; }
        const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,''));
        const idx = (name) => headers.indexOf(name);
        const added = [];
        for (let i=1;i<lines.length;i++) {
          const row = lines[i];
          // naive CSV parse for double-quoted values
          const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v=>v.replace(/^"|"$/g,'')) || [];
          if (!values.length) continue;
          const rec = {};
          headers.forEach((h, j)=> rec[h]=values[j] || '');
          // build expense
          const eItem = {
            id: rec.id || Date.now().toString() + i,
            name: rec.name || 'Untitled',
            date: rec.date || new Date().toISOString().slice(0,10),
            amountUZS: Number(rec.amountUZS) || Math.round(convert(Number(rec.originalAmount || 0), rec.originalCurrency || 'UZS', 'UZS')),
            originalAmount: rec.originalAmount || '',
            originalCurrency: rec.originalCurrency || 'UZS',
            category: rec.category || (categories[0] && categories[0].name) || 'Boshqa',
            createdAt: rec.createdAt || new Date().toISOString()
          };
          expenses.push(eItem);
          added.push(eItem);
        }
        save();
        renderList();
        alert(`${added.length} ta yozuv CSV orqali import qilindi.`);
      };
      reader.readAsText(file);
    }
  
    // --- Dynamic injection of controls (Export/Import, Recurring, Budgets, Trash) ---
    function injectControls() {
      // topControls may be missing in older HTML; create if needed
      if (!topControls) {
        // attempt to insert into content as first child
        const content = document.querySelector('.content');
        if (!content) return;
        const t = document.createElement('div');
        t.className = 'top-controls';
        content.insertBefore(t, content.firstChild);
      }
      const container = document.querySelector('.top-controls');
  
      // Export JSON button
      const expBtn = document.createElement('button');
      expBtn.id = 'exportJsonBtn';
      expBtn.className = 'small-ctrl';
      expBtn.textContent = '⬇️ Export JSON';
      expBtn.title = 'Ma\'lumotlarni JSON ga eksport qilish';
      expBtn.addEventListener('click', exportJSON);
  
      // Export CSV
      const expCsvBtn = document.createElement('button');
      expCsvBtn.id = 'exportCsvBtn';
      expCsvBtn.className = 'small-ctrl';
      expCsvBtn.textContent = '⬇️ Export CSV';
      expCsvBtn.title = 'Ma\'lumotlarni CSV ga eksport qilish';
      expCsvBtn.addEventListener('click', exportCSV);
  
      // Import JSON input
      const importInput = document.createElement('input');
      importInput.type = 'file';
      importInput.accept = '.json,.csv,text/csv,application/json';
      importInput.style.display = 'none';
      importInput.id = 'xh-import-input';
      importInput.addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        if (file.name.toLowerCase().endsWith('.json')) importJSONFile(file);
        else importCSVFile(file);
        importInput.value = '';
      });
  
      const impBtn = document.createElement('button');
      impBtn.className = 'small-ctrl';
      impBtn.textContent = '⬆️ Import';
      impBtn.title = 'JSON yoki CSV import';
      impBtn.addEventListener('click', () => importInput.click());
  
      // Recurring manager quick add
      const recBtn = document.createElement('button');
      recBtn.className = 'small-ctrl';
      recBtn.textContent = '🔁 Recurring';
      recBtn.title = 'Takrorlanuvchi qo\'shish';
      recBtn.addEventListener('click', () => {
        const name = prompt("Recurring nomi (masalan: Abonent to'lov):");
        if (!name) return;
        const amount = prompt("Summa:");
        const interval = prompt("Interval (daily, weekly, monthly):", "monthly");
        const cat = prompt("Kategoriya nomi:", categories[0] ? categories[0].name : "Boshqa");
        const next = prompt("Birinchi sana (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
        addRecurring({ name, amount: Number(amount || 0), currency, category: cat, interval, nextDate: next });
        alert("Recurring qo'shildi.");
      });
  
      // Budgets quick set
      const budBtn = document.createElement('button');
      budBtn.className = 'small-ctrl';
      budBtn.textContent = '💰 Budgets';
      budBtn.title = 'Oy va kategoriya budgetlarini sozlash';
      budBtn.addEventListener('click', () => {
        const month = prompt("Budjet oy (YYYY-MM):", new Date().toISOString().slice(0,7));
        const total = prompt("Umumiy byudjet (UZS):", "0");
        if (!month) return;
        setBudgetForMonth(month, Number(total || 0), {});
        alert("Budget saqlandi.");
      });
  
      // Trash view
      const trashBtn = document.createElement('button');
      trashBtn.className = 'small-ctrl';
      trashBtn.textContent = '🗑️ Trash';
      trashBtn.title = 'O\'chirilganlarni ko\'rish';
      trashBtn.addEventListener('click', () => {
        showTrashModal();
      });
  
      // Append if not already appended
      if (!document.getElementById('exportJsonBtn')) container.appendChild(expBtn);
      if (!document.getElementById('exportCsvBtn')) container.appendChild(expCsvBtn);
      if (!document.getElementById('xh-import-input')) container.appendChild(importInput);
      if (![...container.querySelectorAll('button')].some(b=>b.textContent === '⬆️ Import')) container.appendChild(impBtn);
      if (![...container.querySelectorAll('button')].some(b=>b.textContent === '🔁 Recurring')) container.appendChild(recBtn);
      if (![...container.querySelectorAll('button')].some(b=>b.textContent === '💰 Budgets')) container.appendChild(budBtn);
      if (![...container.querySelectorAll('button')].some(b=>b.textContent === '🗑️ Trash')) container.appendChild(trashBtn);
    }
    injectControls();
  
    // --- TRASH MODAL ---
    function showTrashModal() {
      // create basic modal
      let modal = document.getElementById('xh-trash-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'xh-trash-modal';
        modal.className = 'xh-modal';
        modal.innerHTML = `
          <div class="xh-modal-inner">
            <h3>Trash - O'chirilgan yozuvlar</h3>
            <div id="xh-trash-list" style="max-height:300px;overflow:auto"></div>
            <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
              <button id="xh-trash-close">Yopish</button>
              <button id="xh-trash-clear" style="background:#ff6b6b;color:#fff">Tozalash</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('xh-trash-close').addEventListener('click', ()=> modal.remove());
        document.getElementById('xh-trash-clear').addEventListener('click', ()=>{
          if (confirm("Trash tozalansinmi? Bu amal qaytarilmaydi.")) {
            trash = [];
            save();
            modal.remove();
          }
        });
      }
      const list = document.getElementById('xh-trash-list');
      list.innerHTML = '';
      if (!trash.length) list.innerHTML = '<div style="color:var(--muted);padding:12px;text-align:center">Trash bo\'sh</div>';
      for (let t of trash) {
        const el = document.createElement('div');
        el.className = 'xh-trash-item';
        el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
          <div><b>${escapeHtml(t.name)}</b><div style="font-size:13px;color:var(--muted)">${t.date} · ${t.category}</div></div>
          <div style="display:flex;gap:8px">
            <button class="xh-restore">Tiklash</button>
            <button class="xh-delete" style="background:#ff6b6b;color:#fff">O'chirish</button>
          </div>
        </div>`;
        list.appendChild(el);
        el.querySelector('.xh-restore').addEventListener('click', ()=> {
          restoreFromTrash(t.id);
          // refresh modal
          showTrashModal();
        });
        el.querySelector('.xh-delete').addEventListener('click', ()=> {
          if (confirm("Bu yozuvni doimiy o'chirishni tasdiqlaysizmi?")) {
            trash = trash.filter(x=>x.id !== t.id);
            save();
            showTrashModal();
          }
        });
      }
      // show modal (simple)
      modal.style.position = 'fixed';
      modal.style.left = '0'; modal.style.top = '0'; modal.style.right = '0'; modal.style.bottom = '0';
      modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';
      modal.style.background = 'rgba(0,0,0,0.35)';
      modal.querySelector('.xh-modal-inner').style.background = 'var(--goal-bg)';
      modal.querySelector('.xh-modal-inner').style.padding = '18px';
    }
  
    // --- STATS functions (unchanged mostly) ---
    function renderStatsChart(labels, data) {
      if (statsChart && statsChart._chart) statsChart._chart.destroy();
      if (window.statsChartObj) window.statsChartObj.destroy();
      window.statsChartObj = new Chart(statsChart, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Sarflangan summa', data, backgroundColor: theme === "dark" ? "#8b5cf6" : "#4caf50" }]},
        options: { scales: { x: { ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" }, grid: { color: theme === "dark" ? "#22242c" : "#e0e7ef" } }, y: { beginAtZero:true, ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" }, grid: { color: theme === "dark" ? "#22242c" : "#e0e7ef" } } }, plugins: { legend: { display: false } } }
      });
    }
    function showStatsToday() {
      const today = new Date();
      const key = today.toISOString().slice(0,10);
      const todayExp = expenses.filter(e => e.date === key && !e.deleted);
      statDate.textContent = `Bugun: ${key}`;
      let cats = categories.map(c=>c.name);
      let data = cats.map(cat => todayExp.filter(e=>e.category===cat).reduce((sum,e)=>sum+Number(e.amountUZS||0),0));
      renderStatsChart(cats, data);
      statsList.innerHTML = cats.map((cat,i) =>
        `<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></span>`
      ).join("<br>");
    }
    function showStatsYesterday() {
      const yester = new Date(Date.now()-86400000);
      const key = yester.toISOString().slice(0,10);
      const yesterExp = expenses.filter(e => e.date === key && !e.deleted);
      statDate.textContent = `Kecha: ${key}`;
      let cats = categories.map(c=>c.name);
      let data = cats.map(cat => yesterExp.filter(e=>e.category===cat).reduce((sum,e)=>sum+Number(e.amountUZS||0),0));
      renderStatsChart(cats, data);
      statsList.innerHTML = cats.map((cat,i) =>
        `<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></span>`
      ).join("<br>");
    }
    function showStats7Days() {
      let days = [];
      for(let i=6;i>=0;i--){
        let d = new Date(Date.now()-86400000*i);
        days.push(d.toISOString().slice(0,10));
      }
      let data = days.map(day=>{
        return expenses.filter(e=>e.date===day && !e.deleted).reduce((sum,e)=>sum+Number(e.amountUZS||0),0);
      });
      statDate.textContent = `Oxirgi 7 kun: ${days[0]} - ${days[6]}`;
      renderStatsChart(days, data);
      statsList.innerHTML = days.map((day,i)=>
        `<span>${day}: <b>${formatNumberByCurrency(data[i])} ${currency}</b></span>`
      ).join("<br>");
    }
    showTodayBtn.addEventListener('click',()=>{showStatsToday(); showTodayBtn.classList.add('active'); showYesterdayBtn.classList.remove('active'); show7DaysBtn.classList.remove('active');});
    showYesterdayBtn.addEventListener('click',()=>{showStatsYesterday(); showYesterdayBtn.classList.add('active'); showTodayBtn.classList.remove('active'); show7DaysBtn.classList.remove('active');});
    show7DaysBtn.addEventListener('click',()=>{showStats7Days(); show7DaysBtn.classList.add('active'); showTodayBtn.classList.remove('active'); showYesterdayBtn.classList.remove('active');});
  
    statsList.addEventListener('click', function(e) {
      if (e.target.classList.contains('cat-link')) {
        const cat = e.target.getAttribute('data-cat');
        if(cat) openCategoryStats(cat);
      }
    });
  
    // --- GOALS (unchanged mostly) ---
    const goalName = document.getElementById('goalName');
    const goalTarget = document.getElementById('goalTarget');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const goalListDiv = document.getElementById('goalList');
    const goalCurrency = document.getElementById('goalCurrency');
  
    function saveGoalsLocal() { localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); }
    function renderGoalList() {
      goalListDiv.innerHTML = '';
      if (!goalList.length) {
        goalListDiv.innerHTML = `<div style='text-align:center;color:var(--muted);margin-top:18px;'>Maqsadlar hali yo'q</div>`;
        return;
      }
      goalList.forEach((goal, idx) => {
        let current = goal.current || 0;
        let percent = Math.min(100, Math.round(current / goal.target * 100));
        let weekData = goal.progressHistory||[];
        let haftalikQoshimcha = weekData.length > 1 ? weekData[weekData.length-1].amount - weekData[0].amount : current;
        haftalikQoshimcha = haftalikQoshimcha || 0;
        let haftadaKun = weekData.length>1 ? Math.round((new Date(weekData[weekData.length-1].date)-new Date(weekData[0].date))/86400000) : 7;
        haftadaKun = haftadaKun<=0?1:haftadaKun;
        let haftalikOrtacha = haftalikQoshimcha / haftadaKun;
        let taxminQolgan = haftalikOrtacha>0 ? Math.ceil((goal.target-current)/haftalikOrtacha) : "-";
        let taxminQolganText = haftalikOrtacha>0 ? `${taxminQolgan} kun (agar shu sur'atda davom etsa)` : "Hali prognoz yo'q";
        let show = goal.show !== false;
        let showText = show ? Number(current).toLocaleString('uz-UZ') : "****";
        let eyeIcon = show ? "👁️" : "🙈";
        let card = document.createElement('div');
        card.className = "goal-card";
        card.innerHTML = `
          <div class="goal-title">${escapeHtml(goal.name)}</div>
          <div class="goal-meta">
            Maqsad: <b>${Number(goal.target).toLocaleString('uz-UZ')}</b> ${goal.currency}<br>
            Yig'ilgan: <b class="goal-amount">${showText}</b>
            <button class="goal-eye-btn" title="Ko'rsat/yashir" style="background:none;border:none;cursor:pointer;font-size:18px;vertical-align:middle;margin-left:4px;">${eyeIcon}</button> ${goal.currency}
          </div>
          <div class="goal-progress-bar">
            <div class="goal-progress-inner" style="width:${percent}%;"></div>
          </div>
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
        // Eye event
        const eyeBtn = card.querySelector('.goal-eye-btn');
        eyeBtn.addEventListener('click', () => {
          goal.show = !show;
          saveGoalsLocal();
          renderGoalList();
        });
        // Pul qo'shish
        const addInput = card.querySelector('.goal-add-amount');
        const addCur = card.querySelector('.goal-add-currency');
        const addBtn = card.querySelector('.goal-add-btn');
        addBtn.addEventListener('click', () => {
          let val = Number(addInput.value);
          let fromCur = addCur.value;
          if (!val || val<=0) {
            alert("To'g'ri pul miqdorini kiriting!");
            return;
          }
          let addConverted = convert(val, fromCur, goal.currency);
          goal.current = (goal.current||0)+addConverted;
          if (!goal.progressHistory) goal.progressHistory = [];
          goal.progressHistory.push({date: new Date().toISOString().slice(0,10), amount: goal.current});
          saveGoalsLocal();
          renderGoalList();
        });
        const removeBtn = card.querySelector('.goal-remove-btn');
        removeBtn.addEventListener('click', () => {
          if (confirm("Ushbu maqsadni o'chirishni istaysizmi?")) {
            goalList.splice(idx,1);
            saveGoalsLocal();
            renderGoalList();
          }
        });
        goalListDiv.appendChild(card);
      });
    }
    addGoalBtn.addEventListener('click', () => {
      const name = goalName.value.trim();
      const target = Number(goalTarget.value.trim());
      const currencyG = goalCurrency.value;
      if (!name || !target || target<=0) {
        alert("Narsa nomi va narxini to'g'ri kiriting!");
        return;
      }
      goalList.push({
        name,
        target,
        current: 0,
        currency: currencyG,
        progressHistory: []
      });
      saveGoalsLocal();
      goalName.value = '';
      goalTarget.value = '';
      renderGoalList();
    });
    renderGoalList();
  
    // --- EVENT BINDINGS ---
    addBtn.addEventListener('click', addOrEditExpense);
    amountEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') addOrEditExpense(); });
    nameEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') amountEl.focus(); });
    searchEl.addEventListener('input', renderList);
    filterCatEl.addEventListener('change', renderList);
    dateEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') addOrEditExpense(); });
  
    // currency switch
    currencySwitch.addEventListener('change', () => {
      currency = currencySwitch.value;
      localStorage.setItem(CUR_KEY, currency);
      renderList();
      renderGoalList();
    });
  
    // limit
    limitInput.value = limit > 0 ? limit : "";
    limitSaveBtn.addEventListener('click', () => {
      limit = Number(limitInput.value) || 0;
      localStorage.setItem(LIMIT_KEY, limit);
      renderList();
    });
  
    // category modal
    addCatBtn.addEventListener('click', () => {
      catModal.classList.add("active");
      newCatName.value = '';
      newCatEmoji.value = '';
    });
    closeCatModal.addEventListener('click', () => catModal.classList.remove("active"));
    saveCatBtn.addEventListener('click', () => {
      const name = newCatName.value.trim();
      const emoji = newCatEmoji.value.trim() || "📦";
      if (!name) { alert("Kategoriya nomini kiriting!"); return; }
      if (categories.some(c => c.name === name)) { alert("Bu nomda kategoriya bor!"); return; }
      categories.push({name, emoji});
      save();
      renderCategories();
      catModal.classList.remove("active");
    });
  
    // tabs
    tabHome.addEventListener('click', () => {
      tabHome.classList.add("active"); tabChart.classList.remove("active"); tabGoal.classList.remove("active");
      homePage.style.display = ""; chartPage.style.display = "none"; goalPage.style.display = "none";
    });
    tabChart.addEventListener('click', () => {
      tabHome.classList.remove("active"); tabChart.classList.add("active"); tabGoal.classList.remove("active");
      homePage.style.display = "none"; chartPage.style.display = ""; goalPage.style.display = "none";
      showStatsToday();
    });
    tabGoal.addEventListener('click', () => {
      tabHome.classList.remove("active"); tabChart.classList.remove("active"); tabGoal.classList.add("active");
      homePage.style.display = "none"; chartPage.style.display = "none"; goalPage.style.display = "";
      renderGoalList();
    });
  
    // initial render
    renderList();
  
    // expose some helpers for console debugging
    window.__XH = {
      addRecurring, processRecurring, exportJSON, exportCSV, importJSONFile, importCSVFile, setBudgetForMonth, restoreFromTrash, getState: ()=>({expenses,categories,recurring,trash,budgets})
    };
  });