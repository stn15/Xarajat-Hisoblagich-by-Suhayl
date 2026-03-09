/**
 * app.js — Complete integrated application
 * - Menu & Language system
 * - Monthly limit (integrated)
 * - Category cards with functionality
 * - All features working
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ---------------------------
  // HELPERS
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
  // LANGUAGE SYSTEM
  // ---------------------------
  const translations = {
    uz: {
      title: 'Xarajat Hisoblagich',
      monthly_limit: 'Oylik Limit',
      categories: 'Oxirgi xarajatlar bo\'yicha kategoriyalar',
      add: '➕ Qo\'shish',
      search: 'Qidiruv...',
      all: 'Barchasi',
      total: 'Umumiy',
      save: 'Saqlash',
      add_category: '+ Kategoriya qo\'shish',
      export_json: '⬇️ JSON',
      export_csv: '⬇️ CSV',
      import: '⬆️ Import',
      trash: '🗑️ Trash',
      recurring: '🔁 Recurring',
      statistics: 'Statistikalar',
      today: 'Bugun',
      yesterday: 'Kecha',
      week: '7 kunlik',
      goals: 'Maqsadlar',
      profile: '👤 Profil (Kelajakda)',
      about: 'ℹ️ Biz haqida',
      settings: '🔐 Sozlamalar',
      close: 'Yopish',
      back: '⬅️ Ortga',
      save_pin: 'PIN saqlash',
      remove_pin: 'PINni o\'chirish',
    },
    ru: {
      title: 'Расчет расходов',
      monthly_limit: 'Месячный лимит',
      categories: 'Категории по последним расходам',
      add: '➕ Добавить',
      search: 'Поиск...',
      all: 'Все',
      total: 'Итого',
      save: 'Сохранить',
      add_category: '+ Добавить категорию',
      export_json: '⬇️ JSON',
      export_csv: '⬇️ CSV',
      import: '⬆️ Импорт',
      trash: '🗑️ Корзина',
      recurring: '🔁 Повторяющееся',
      statistics: 'Статистика',
      today: 'Сегодня',
      yesterday: 'Вчера',
      week: '7 дней',
      goals: 'Цели',
      profile: '👤 Профиль (Скоро)',
      about: 'ℹ️ О нас',
      settings: '🔐 Настройки',
      close: 'Закрыть',
      back: '⬅️ Назад',
      save_pin: 'Сохранить PIN',
      remove_pin: 'Удалить PIN',
    },
    en: {
      title: 'Expense Tracker',
      monthly_limit: 'Monthly Limit',
      categories: 'Categories by recent expenses',
      add: '➕ Add',
      search: 'Search...',
      all: 'All',
      total: 'Total',
      save: 'Save',
      add_category: '+ Add Category',
      export_json: '⬇️ JSON',
      export_csv: '⬇️ CSV',
      import: '⬆️ Import',
      trash: '🗑️ Trash',
      recurring: '🔁 Recurring',
      statistics: 'Statistics',
      today: 'Today',
      yesterday: 'Yesterday',
      week: '7 days',
      goals: 'Goals',
      profile: '👤 Profile (Coming Soon)',
      about: 'ℹ️ About Us',
      settings: '🔐 Settings',
      close: 'Close',
      back: '⬅️ Back',
      save_pin: 'Save PIN',
      remove_pin: 'Remove PIN',
    }
  };

  let currentLang = localStorage.getItem('userLang') || 'uz';

  function t(key) {
    return translations[currentLang]?.[key] || translations.uz[key] || key;
  }

  function updateLanguage() {
    // Update dynamic text elements
    const homePage = $('homePage');
    if (homePage) {
      // Title is in top-header
      const categoryLabel = homePage.querySelector('.category-label');
      if (categoryLabel) categoryLabel.textContent = t('categories');
      
      const inputs = homePage.querySelector('.inputs');
      if (inputs) {
        const nameInput = inputs.querySelector('#name');
        const amountInput = inputs.querySelector('#amount');
        const dateInput = inputs.querySelector('#date');
        const categorySelect = inputs.querySelector('#category');
        const addBtn = inputs.querySelector('.add-btn');
        
        if (nameInput) nameInput.placeholder = 'Nima oldingiz?';
        if (amountInput) amountInput.placeholder = 'Summasi';
        if (addBtn) addBtn.textContent = t('add');
      }

      const filters = homePage.querySelector('.filters');
      if (filters) {
        const searchInput = filters.querySelector('#search');
        const filterCat = filters.querySelector('#filterCategory');
        if (searchInput) searchInput.placeholder = t('search');
        if (filterCat) filterCat.options[0].textContent = t('all');
      }
    }

    // Update buttons
    const addCatBtn = $('addCategoryBtn');
    if (addCatBtn) addCatBtn.textContent = t('add_category');

    const exportJsonBtn = $('exportJsonBtn');
    if (exportJsonBtn) exportJsonBtn.textContent = t('export_json');

    const exportCsvBtn = $('exportCsvBtn');
    if (exportCsvBtn) exportCsvBtn.textContent = t('export_csv');

    const importBtn = $('importBtn');
    if (importBtn) importBtn.textContent = t('import');

    const trashBtn = $('trashBtn');
    if (trashBtn) trashBtn.textContent = t('trash');

    const recurringBtn = $('recurringBtn');
    if (recurringBtn) recurringBtn.textContent = t('recurring');

    // Update stats buttons
    const showTodayBtn = $('showTodayBtn');
    if (showTodayBtn) showTodayBtn.textContent = t('today');

    const showYesterdayBtn = $('showYesterdayBtn');
    if (showYesterdayBtn) showYesterdayBtn.textContent = t('yesterday');

    const show7DaysBtn = $('show7DaysBtn');
    if (show7DaysBtn) show7DaysBtn.textContent = t('week');

    // Update limit label
    const limitLabel = document.querySelector('.limit-label');
    if (limitLabel) limitLabel.textContent = t('monthly_limit');

    const limitSaveBtn = $('limitSaveBtn');
    if (limitSaveBtn) limitSaveBtn.textContent = t('save');

    // Update chart page title
    const chartPage = $('chartPage');
    if (chartPage) {
      const h2 = chartPage.querySelector('h2');
      if (h2) h2.textContent = '📊 ' + t('statistics');
    }

    // Update goal page title
    const goalPage = $('goalPage');
    if (goalPage) {
      const h2 = goalPage.querySelector('h2');
      if (h2) h2.textContent = '🎯 ' + t('goals');
    }
  }

  // ---------------------------
  // MENU FUNCTIONALITY
  // ---------------------------
  const menuBtn = $('menuBtn');
  const dropdownMenu = $('dropdownMenu');
  const profileBtn = $('profileBtn');
  const aboutBtn = $('aboutBtn');
  const aboutModal = $('aboutModal');
  const closeAboutBtn = $('closeAboutBtn');
  const langOptions = document.querySelectorAll('.lang-option');

  if (menuBtn && dropdownMenu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('active');
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-container')) {
      dropdownMenu && dropdownMenu.classList.remove('active');
    }
  });

  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      alert('Profile - Kelajakda!');
      dropdownMenu && dropdownMenu.classList.remove('active');
    });
  }

  if (aboutBtn && aboutModal) {
    aboutBtn.addEventListener('click', () => {
      aboutModal.classList.add('active');
      dropdownMenu && dropdownMenu.classList.remove('active');
    });
  }

  if (closeAboutBtn && aboutModal) {
    closeAboutBtn.addEventListener('click', () => {
      aboutModal.classList.remove('active');
    });
  }

  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) {
        aboutModal.classList.remove('active');
      }
    });
  }

  langOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.getAttribute('data-lang');
      localStorage.setItem('userLang', currentLang);
      updateLanguage();
      dropdownMenu && dropdownMenu.classList.remove('active');
    });
  });

  // ---------------------------
  // CURRENCY & RATES
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
    } catch (e) { /* ignore */ }
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
  // PIN AUTHENTICATION
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

  // Hide splash
  setTimeout(()=>{ const s = $('splash'); if (s) s.classList.add('hide'); }, 1700);

  // ---------------------------
  // DOM ELEMENTS
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
  const currencySwitch = $('currencySwitch');
  const currencyLabel = $('currencyLabel');
  const limitInput = $('limitInput');
  const limitSaveBtn = $('limitSaveBtn');
  const limitNotice = $('limitNotice');
  const limitToggle = $('limitToggle');
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
  const importFile = $('importFile');
  const trashBtn = $('trashBtn');
  const recurringBtn = $('recurringBtn');

  // ---------------------------
  // STATE & STORAGE
  // ---------------------------
  const STORAGE_KEY = 'expenses_v3';
  const CAT_KEY = 'categories_v2';
  const LIMIT_KEY = 'limit_v2';
  const GOALS_KEY = 'goal_list';
  const RECUR_KEY = 'recurring_v1';
  const TRASH_KEY = 'trash_v1';
  const BUDGETS_KEY = 'budgets_v1';

  let expenses = [];
  let categories = [
    { name: "Ovqat", emoji: "🍔" },
    { name: "Transport", emoji: "🚗" },
    { name: "Kommunal", emoji: "⚡" },
    { name: "Bozorlik", emoji: "🛍️" },
  ];
  let recurring = [];
  let trash = [];
  let budgets = {};
  let goalList = [];
  let editingId = null;
  let limit = 0;
  let limitEnabled = false;
  let currency = localStorage.getItem('currency') || 'UZS';
  let theme = localStorage.getItem('theme') || 'light';

  try {
    const raw = localStorage.getItem(STORAGE_KEY); if (raw) expenses = JSON.parse(raw);
    const cr = localStorage.getItem(CAT_KEY); if (cr) categories = JSON.parse(cr);
    const gr = localStorage.getItem(GOALS_KEY); if (gr) goalList = JSON.parse(gr);
    const rr = localStorage.getItem(RECUR_KEY); if (rr) recurring = JSON.parse(rr);
    const tr = localStorage.getItem(TRASH_KEY); if (tr) trash = JSON.parse(tr);
    const br = localStorage.getItem(BUDGETS_KEY); if (br) budgets = JSON.parse(br);
    const limVal = localStorage.getItem(LIMIT_KEY); if (limVal) limit = Number(limVal);
    const limEn = localStorage.getItem('limit_enabled'); if (limEn) limitEnabled = limEn === 'true';
  } catch (e) { /* ignore */ }

  // ---------------------------
  // STORAGE HELPERS
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
  // THEME
  // ---------------------------
  function applyTheme(newTheme) {
    document.body.classList.remove('light-mode','dark-mode');
    document.body.classList.add(newTheme+'-mode');
    if (themeSwitch) themeSwitch.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
  }
  
  applyTheme(theme);
  if (themeSwitch) {
    themeSwitch.addEventListener('click', ()=> {
      theme = (theme === 'dark') ? 'light' : 'dark';
      applyTheme(theme);
      renderList();
    });
  }

  // ---------------------------
  // DATE HELPER
  // ---------------------------
  function setTodayDate() {
    if (!dateEl) return;
    const t = new Date(); const yyyy = t.getFullYear(); const mm = String(t.getMonth()+1).padStart(2,'0'); const dd = String(t.getDate()).padStart(2,'0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }
  setTodayDate();

  // ---------------------------
  // RENDER CATEGORIES
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
  // CHART
  // ---------------------------
  let expChart = null;
  function renderChart(filtered) {
    if (!chartCanvas) return;
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => filtered.filter(e => e.category === cat && !e.deleted).reduce((sum,e)=>sum + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    if (expChart) try{ expChart.destroy(); }catch(e){}
    if (window.Chart) {
      expChart = new Chart(chartCanvas, { 
        type:'doughnut', 
        data:{ 
          labels:cats, 
          datasets:[{ 
            data, 
            backgroundColor:["#c084fc","#6ee7b7","#fcd34d","#f472b6"] 
          }] 
        }, 
        options:{ responsive: true, plugins: { legend: { labels: { color: theme === 'dark' ? '#cbd5e1' : '#1f2937' } } } }
      });
    }
  }

  // ---------------------------
  // CALCULATIONS
  // ---------------------------
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

  // ---------------------------
  // RENDER LIST
  // ---------------------------
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
        <div>
          <span>${highlightMatch(item.name, keyword)}</span>
          <span style="font-size:11px;color:#9ca3af;">${item.date}</span>
        </div>
      `;
      
      const catBadge = document.createElement('div');
      catBadge.style.cssText = 'display:flex;align-items:center;gap:8px;';
      catBadge.innerHTML = `
        <div class="cat" style="background:linear-gradient(135deg,#ddd6fe,#f3e8ff);color:#8b5cf6;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;">${escapeHtml(cat.emoji)}</div>
        <div>
          <div style="font-size:12px;color:#9ca3af;">${escapeHtml(cat.name)}</div>
          <div style="font-weight:700;">${displayAmount} ${currency}</div>
        </div>
      `;
      
      const editBtn = document.createElement('button'); 
      editBtn.className='del-btn'; 
      editBtn.textContent='✏️'; 
      editBtn.addEventListener('click', ()=> editExpense(item.id));
      
      const delBtn = document.createElement('button'); 
      delBtn.className='del-btn'; 
      delBtn.textContent='❌'; 
      delBtn.addEventListener('click', ()=> softDeleteExpense(item.id));
      
      li.appendChild(left);
      li.appendChild(catBadge);
      li.appendChild(editBtn);
      li.appendChild(delBtn);
      listEl.appendChild(li);
    }

    const totalUZS = calcTotal(getMonthExpenses(expenses));
    if (totalEl) totalEl.textContent = formatNumberByCurrencyUZS(totalUZS);
    if (currencyLabel) currencyLabel.textContent = currency === "UZS" ? "so'm" : (currency === "USD" ? "$" : "₽");
    
    renderChart(filtered);
    checkBudgets();
  }

  // ---------------------------
  // ADD/EDIT EXPENSE
  // ---------------------------
  let itemCurrencyEl = $('itemCurrency');
  if (!itemCurrencyEl && amountEl) {
    const s = document.createElement('select'); 
    s.id='itemCurrency';
    [['UZS','UZS'],['USD','USD'],['RUB','RUB']].forEach(([v,l])=> { 
      const o=document.createElement('option'); 
      o.value=v; 
      o.textContent=l; 
      s.appendChild(o); 
    });
    amountEl.insertAdjacentElement('afterend', s);
    itemCurrencyEl = s;
  }

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
      if (addBtn) addBtn.textContent = t('add');
    } else {
      const expense = { 
        id: Date.now().toString()+Math.floor(Math.random()*1000), 
        name, amountUZS, originalAmount: inputAmount, originalCurrency: inputCurrency, 
        category, date, createdAt: nowIso, updatedAt: nowIso
      };
      expenses.push(expense);
    }
    
    save(); 
    renderList(); 
    if (nameEl) nameEl.value=''; 
    if (amountEl) amountEl.value=''; 
    setTodayDate(); 
    nameEl && nameEl.focus();
  }

  function editExpense(id) {
    const exp = expenses.find(e=>e.id === id); 
    if (!exp) return;
    
    nameEl && (nameEl.value = exp.name || '');
    if (itemCurrencyEl) itemCurrencyEl.value = exp.originalCurrency || currency;
    if (amountEl) amountEl.value = exp.originalAmount != null ? exp.originalAmount : Number(convert(exp.amountUZS || 0, 'UZS', itemCurrencyEl ? itemCurrencyEl.value : currency)).toFixed(2);
    if (categoryEl) categoryEl.value = exp.category;
    if (dateEl) dateEl.value = exp.date;
    
    editingId = id;
    if (addBtn) addBtn.textContent = "✏️ Saqlash";
  }

  // ---------------------------
  // SOFT DELETE & TRASH
  // ---------------------------
  function ensureToastArea() {
    let area = $('xh-toast-area');
    if (!area) {
      area = document.createElement('div'); 
      area.id='xh-toast-area';
      area.style.position='fixed'; 
      area.style.left='16px'; 
      area.style.bottom='80px'; 
      area.style.zIndex='12000';
      document.body.appendChild(area);
    }
    return area;
  }

  function showUndoToast(text, undoCb, timeout=8000) {
    const area = ensureToastArea();
    const card = document.createElement('div'); 
    card.className='xh-toast';
    card.innerHTML = `<span>${escapeHtml(text)}</span> <button class="xh-undo-btn">Bekor qilish</button>`;
    const btn = card.querySelector('button'); 
    area.appendChild(card);
    
    const timer = setTimeout(()=>{ try{ card.remove(); }catch(e){} }, timeout);
    btn.addEventListener('click', ()=>{ clearTimeout(timer); try{ undoCb(); }catch(e){} try{ card.remove(); }catch(e){} });
  }

  function softDeleteExpense(id) {
    const idx = expenses.findIndex(e=>e.id === id);
    if (idx === -1) return;
    const [it] = expenses.splice(idx,1);
    it.deleted = true; 
    it.deletedAt = new Date().toISOString();
    trash.unshift(it); 
    save(); 
    saveTrash(); 
    renderList();
    showUndoToast(`"${it.name}" o'chirildi`, ()=> restoreFromTrash(it.id), 10000);
  }

  function restoreFromTrash(id) {
    const idx = trash.findIndex(t=>t.id===id);
    if (idx === -1) return;
    const [it] = trash.splice(idx,1);
    delete it.deleted; 
    delete it.deletedAt;
    expenses.push(it); 
    save(); 
    saveTrash(); 
    renderList();
  }

  // ---------------------------
  // LIMIT FUNCTIONALITY
  // ---------------------------
  function checkBudgets() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    
    if (!limitEnabled || !limit || limit <= 0) {
      if (limitNotice) limitNotice.innerHTML = '';
      return;
    }
    
    const monthTotalUZS = calcTotal(getMonthExpenses(expenses));
    const percentage = ((monthTotalUZS / limit) * 100).toFixed(1);
    const isExceeded = monthTotalUZS >= limit;

    if (limitNotice) {
      if (isExceeded) {
        limitNotice.innerHTML = `⚠️ Limit tugadi! ${formatNumberByCurrencyUZS(monthTotalUZS)} / ${formatNumberByCurrencyUZS(limit)} ${currency}`;
        limitNotice.style.color = '#ef4444';
      } else {
        limitNotice.innerHTML = `${percentage}% - ${formatNumberByCurrencyUZS(monthTotalUZS)} / ${formatNumberByCurrencyUZS(limit)} ${currency}`;
        limitNotice.style.color = '#10b981';
      }
    }
  }

  // ---------------------------
  // CATEGORY GRID CLICK
  // ---------------------------
  const categoryGrid = document.querySelector('.category-grid');
  if (categoryGrid) {
    categoryGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.cat-card');
      if (card) {
        if (categoryEl) {
          const catName = card.textContent.trim().split(' ').pop();
          categoryEl.value = catName;
          nameEl && nameEl.focus();
        }
      }
    });
  }

  // ---------------------------
  // EVENT LISTENERS
  // ---------------------------
  if (addBtn) addBtn.addEventListener('click', addOrEditExpense);
  amountEl && amountEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') addOrEditExpense(); });
  nameEl && nameEl.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') amountEl && amountEl.focus(); });
  searchEl && searchEl.addEventListener('input', renderList);
  filterCatEl && filterCatEl.addEventListener('change', renderList);

  if (currencySwitch) {
    currencySwitch.value = currency;
    currencySwitch.addEventListener('change', ()=> { 
      currency = currencySwitch.value; 
      localStorage.setItem('currency', currency); 
      renderList(); 
    });
  }

  // LIMIT CONTROLS
  if (limitToggle) {
    limitToggle.checked = limitEnabled;
    limitToggle.addEventListener('change', (e) => {
      limitEnabled = e.target.checked;
      localStorage.setItem('limit_enabled', limitEnabled);
      checkBudgets();
    });
  }

  if (limitSaveBtn) {
    limitSaveBtn.addEventListener('click', () => {
      const val = Number(limitInput?.value || 0);
      if (!val || val <= 0) {
        alert("Iltimos, to'g'ri limit kiriting!");
        return;
      }
      limit = val;
      localStorage.setItem(LIMIT_KEY, String(limit));
      alert("✅ Limit saqlandi!");
      checkBudgets();
    });
  }

  if (limitInput) limitInput.value = limit;

  // CATEGORY MANAGEMENT
  if (addCatBtn) {
    addCatBtn.addEventListener('click', ()=> { 
      if (catModal) { 
        catModal.classList.add('active'); 
        newCatName && (newCatName.value=''); 
        newCatEmoji && (newCatEmoji.value=''); 
      } 
    });
  }

  if (closeCatModal) closeCatModal.addEventListener('click', ()=> catModal && catModal.classList.remove('active'));
  
  if (saveCatBtn) {
    saveCatBtn.addEventListener('click', ()=> {
      const n = newCatName?.value.trim() || ''; 
      const em = newCatEmoji?.value.trim() || '📦';
      if (!n) { alert("Kategoriya nomini kiriting!"); return; }
      if (categories.some(c=>c.name===n)) { alert("Bu nomda kategoriya bor!"); return; }
      categories.push({ name: n, emoji: em }); 
      saveCategories(); 
      renderCategories(); 
      catModal && catModal.classList.remove('active');
      renderList();
    });
  }

  // EXPORT/IMPORT
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', ()=> {
      const dump = { meta:{ exportedAt: new Date().toISOString(), currencyBase:'UZS'}, expenses, categories, recurring, budgets, goals: goalList };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); 
      a.href = URL.createObjectURL(blob); 
      a.download = `xarajat_backup_${new Date().toISOString().slice(0,10)}.json`; 
      a.click(); 
      URL.revokeObjectURL(a.href);
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', ()=> {
      const rows = [['id','name','date','amountUZS','originalAmount','originalCurrency','category','createdAt']];
      for (let e of expenses) rows.push([e.id, e.name, e.date, e.amountUZS || 0, e.originalAmount || '', e.originalCurrency || '', e.category, e.createdAt || '']);
      const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); 
      a.href = URL.createObjectURL(blob); 
      a.download = `xarajat_export_${new Date().toISOString().slice(0,10)}.csv`; 
      a.click(); 
      URL.revokeObjectURL(a.href);
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener('click', ()=> importFile.click());
    importFile.addEventListener('change', (ev)=> { 
      const f = ev.target.files[0]; 
      if (!f) return; 
      if (f.name.toLowerCase().endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e)=> {
          try {
            const data = JSON.parse(e.target.result);
            if (data.expenses && Array.isArray(data.expenses)) {
              if (confirm("Ma'lumotlarni mavjudlarga qo'shasizmi?")) {
                const existing = new Set(expenses.map(x=>x.id)); 
                let added=0;
                for (let it of data.expenses) if (!existing.has(it.id)) { expenses.push(it); added++; }
                save(); 
                renderList(); 
                alert(`${added} ta yozuv qo'shildi.`);
              } else {
                expenses = data.expenses; 
                categories = data.categories || categories; 
                recurring = data.recurring || recurring; 
                budgets = data.budgets || budgets; 
                goalList = data.goals || goalList;
                save(); 
                saveCategories(); 
                renderCategories(); 
                renderList(); 
                alert("Ma'lumotlar yangilandi.");
              }
            } else alert("Fayl formati noto'g'ri.");
          } catch (err) { alert("JSON o'qishda xatolik: " + err.message); }
        };
        reader.readAsText(f);
      }
    });
  }

  if (trashBtn) {
    trashBtn.addEventListener('click', () => {
      let html = '<div style="max-height:300px;overflow:auto;">';
      if (!trash.length) {
        html += '<div style="color:var(--text-muted);padding:12px;text-align:center">Trash bo\'sh</div>';
      } else {
        for (let t of trash) {
          html += `<div style="padding:8px;background:rgba(139,92,246,0.1);border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <div><b>${escapeHtml(t.name)}</b><div style="font-size:11px;color:var(--text-muted)">${t.date}</div></div>
            <div style="display:flex;gap:4px;">
              <button onclick="location.reload()" style="padding:4px 8px;border-radius:4px;background:var(--green);color:white;border:none;cursor:pointer;font-size:11px;font-weight:700;">Tiklash</button>
              <button onclick="location.reload()" style="padding:4px 8px;border-radius:4px;background:var(--red);color:white;border:none;cursor:pointer;font-size:11px;font-weight:700;">O'chirish</button>
            </div>
          </div>`;
        }
      }
      html += '</div><div style="margin-top:12px;display:flex;gap:8px;"><button onclick="location.reload()" style="flex:1;padding:8px;border-radius:6px;background:var(--red);color:white;border:none;cursor:pointer;font-weight:700;font-size:12px;">Tozalash</button><button onclick="document.querySelector(\'.modal\').classList.remove(\'active\')" style="flex:1;padding:8px;border-radius:6px;background:var(--bg-light);color:var(--text-dark);border:none;cursor:pointer;font-weight:700;font-size:12px;">Yopish</button></div>';
      
      let modal = document.querySelector('.trash-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal trash-modal';
        modal.innerHTML = `<div class="modal-content">${html}</div>`;
        document.body.appendChild(modal);
      }
      modal.classList.add('active');
    });
  }

  // PAGE NAVIGATION
  if (tabHome) tabHome.addEventListener('click', ()=> { 
    tabHome.classList.add('active'); 
    tabChart && tabChart.classList.remove('active'); 
    tabGoal && tabGoal.classList.remove('active'); 
    homePage && (homePage.style.display=''); 
    chartPage && (chartPage.style.display='none'); 
    goalPage && (goalPage.style.display='none');
  });

  if (tabChart) tabChart.addEventListener('click', ()=> { 
    tabHome && tabHome.classList.remove('active'); 
    tabChart.classList.add('active'); 
    tabGoal && tabGoal.classList.remove('active'); 
    homePage && (homePage.style.display='none'); 
    chartPage && (chartPage.style.display=''); 
    goalPage && (goalPage.style.display='none');
    showStatsToday();
  });

  if (tabGoal) tabGoal.addEventListener('click', ()=> { 
    tabHome && tabHome.classList.remove('active'); 
    tabChart && tabChart.classList.remove('active'); 
    tabGoal.classList.add('active'); 
    homePage && (homePage.style.display='none'); 
    chartPage && (chartPage.style.display='none'); 
    goalPage && (goalPage.style.display='');
    renderGoalList();
  });

  if (tabSettings) {
    tabSettings.addEventListener('click', ()=> { 
      homePage && (homePage.style.display='none'); 
      chartPage && (chartPage.style.display='none'); 
      goalPage && (goalPage.style.display='none');
      settingsPage && (settingsPage.style.display=''); 
    });
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', ()=> { 
      settingsPage && (settingsPage.style.display='none'); 
      homePage && (homePage.style.display=''); 
    });
  }

  if (savePinBtn) {
    savePinBtn.addEventListener('click', ()=> { 
      const pin = pinInput?.value.trim() || ''; 
      if (pin.length < 4 || !/^\d{4,}$/.test(pin)) { 
        alert("PIN kamida 4ta raqamdan iborat bo'lishi kerak!"); 
        return; 
      }
      localStorage.setItem(PIN_KEY, pin); 
      alert("✅ PIN saqlandi!"); 
      if (pinInput) pinInput.value='';
    });
  }

  if (removePinBtn) {
    removePinBtn.addEventListener('click', ()=> { 
      if (confirm("PINni o'chirib tashlashni istaysizmi?")) { 
        localStorage.removeItem(PIN_KEY); 
        localStorage.removeItem(PIN_TRIES_KEY); 
        alert("✅ PIN o'chirildi!"); 
      }
    });
  }

  // STATS
  function showStatsToday() {
    const today = new Date(); 
    const key = today.toISOString().slice(0,10);
    const todayExp = expenses.filter(e=>e.date===key && !e.deleted);
    if (statDate) statDate.textContent = `Bugun: ${key}`;
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => todayExp.filter(e=>e.category===cat).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    if (statsList) statsList.innerHTML = cats.map((cat,i)=>`<span>${categories[i].emoji} ${cat}: <b>${formatNumberByCurrencyUZS(data[i])}</b></span>`).join("<br>");
  }

  if (showTodayBtn) showTodayBtn.addEventListener('click', showStatsToday);
  if (showYesterdayBtn) showYesterdayBtn.addEventListener('click', ()=> { 
    const y = new Date(Date.now()-86400000); 
    const key = y.toISOString().slice(0,10);
    if (statDate) statDate.textContent = `Kecha: ${key}`;
    const yExp = expenses.filter(e=>e.date===key && !e.deleted);
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => yExp.filter(e=>e.category===cat).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    if (statsList) statsList.innerHTML = cats.map((cat,i)=>`<span>${categories[i].emoji} ${cat}: <b>${formatNumberByCurrencyUZS(data[i])}</b></span>`).join("<br>");
  });

  if (show7DaysBtn) show7DaysBtn.addEventListener('click', ()=> { 
    let days=[]; 
    for (let i=6;i>=0;i--) { 
      let d=new Date(Date.now()-86400000*i); 
      days.push(d.toISOString().slice(0,10)); 
    }
    const data = days.map(day => expenses.filter(e=>e.date===day && !e.deleted).reduce((s,e)=>s + Number(e.amountUZS != null ? e.amountUZS : e.amount || 0),0));
    if (statDate) statDate.textContent = `Oxirgi 7 kun`;
    if (statsList) statsList.innerHTML = days.map((day,i)=>`<span>${day}: <b>${formatNumberByCurrencyUZS(data[i])}</b></span>`).join("<br>");
  });

  // GOALS
  function saveGoalsLocal(){ try{ localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); }catch(e){} }
  
  function renderGoalList(){
    if (!goalListDiv) return;
    goalListDiv.innerHTML = '';
    if (!goalList.length) { goalListDiv.innerHTML = `<div style='text-align:center;color:var(--text-light);margin-top:18px;'>Maqsadlar hali yo'q</div>`; return; }
    goalList.forEach((goal, idx) => {
      let current = goal.current || 0;
      let percent = Math.min(100, Math.round(current / goal.target * 100));
      const card = document.createElement('div'); 
      card.className='goal-card';
      card.innerHTML = `
        <div class="goal-title">${escapeHtml(goal.name)}</div>
        <div class="goal-meta">Maqsad: <b>${Number(goal.target).toLocaleString('uz-UZ')}</b> ${escapeHtml(goal.currency)}</div>
        <div class="goal-progress-bar"><div class="goal-progress-inner" style="width:${percent}%"></div></div>
        <div class="goal-pct">${percent}%</div>
        <div class="goal-actions">
          <input class="goal-add-amount" type="number" min="1" placeholder="Pul qo'shish">
          <select class="goal-add-currency goal-currency-select"><option value="UZS">UZS</option><option value="USD">USD</option><option value="RUB">RUB</option></select>
          <button class="goal-add-btn">Qo'shish</button>
          <button class="goal-remove-btn">O'chirish</button>
        </div>
      `;
      const addInput = card.querySelector('.goal-add-amount'); 
      const addCur = card.querySelector('.goal-add-currency');
      card.querySelector('.goal-add-btn').addEventListener('click', ()=> {
        const val = Number(addInput.value); 
        const fromCur = addCur.value;
        if (!val || val<=0) { alert("To'g'ri pul miqdorini kiriting!"); return; }
        const addConverted = convert(val, fromCur, goal.currency);
        goal.current = (goal.current||0) + addConverted;
        saveGoalsLocal(); 
        renderGoalList();
      });
      card.querySelector('.goal-remove-btn').addEventListener('click', ()=> { 
        if (confirm("Ushbu maqsadni o'chirishni istaysizmi?")) { 
          goalList.splice(idx,1); 
          saveGoalsLocal(); 
          renderGoalList(); 
        } 
      });
      goalListDiv.appendChild(card);
    });
  }

  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', ()=> {
      const name = goalNameEl?.value.trim() || ''; 
      const target = Number(goalTargetEl?.value.trim() || 0); 
      const cur = goalCurrency?.value || 'UZS';
      if (!name || !target || target<=0) { alert("Narsa nomi va narxini to'g'ri kiriting!"); return; }
      goalList.push({ name, target, current:0, currency: cur, progressHistory: [] }); 
      saveGoalsLocal(); 
      goalNameEl.value=''; 
      goalTargetEl.value=''; 
      renderGoalList();
    });
  }

  // INITIAL RENDER
  updateLanguage();
  renderList();
  renderGoalList();
  renderCategories();

  setTimeout(()=>{ const s=$('splash'); if (s && !s.classList.contains('hide')) s.classList.add('hide'); }, 2000);
});