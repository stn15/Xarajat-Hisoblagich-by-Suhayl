document.addEventListener('DOMContentLoaded', () => {
  // --- VALYUTA KURSLARI ---
  let kursUSD = 12000, kursRUB = 140;
  function fetchRates() {
    fetch('https://open.er-api.com/v6/latest/UZS')
      .then(r=>r.json()).then(d=>{
        if(d && d.rates){
          kursUSD = 1/d.rates.USD;
          kursRUB = 1/d.rates.RUB;
        }
      }).catch(()=>{});
  }
  fetchRates();
  setInterval(fetchRates, 1000*60*60*3);

  function convert(amount, from, to) {
    if(from===to) return amount;
    if(from==="UZS" && to==="USD") return amount/kursUSD;
    if(from==="UZS" && to==="RUB") return amount/kursRUB;
    if(from==="USD" && to==="UZS") return amount*kursUSD;
    if(from==="USD" && to==="RUB") return (amount*kursUSD)/kursRUB;
    if(from==="RUB" && to==="UZS") return amount*kursRUB;
    if(from==="RUB" && to==="USD") return (amount*kursRUB)/kursUSD;
    return amount;
  }

  // --- PIN KOD KIRISH NAZORATI ---
  const PIN_KEY = 'user_pin';
  const PIN_TRIES_KEY = 'pin_tries';

  function askPinIfNeeded() {
    const savedPin = localStorage.getItem(PIN_KEY);
    if (!savedPin) return true; // PIN yo'q, to'g'ridan kirish

    let tries = Number(localStorage.getItem(PIN_TRIES_KEY) || "0");
    while (true) {
      let userPin = prompt("Ilovaga kirish uchun PIN kodni kiriting:");
      if (userPin === null) { return false; } // Cancel bosildi
      if (userPin === savedPin) {
        localStorage.setItem(PIN_TRIES_KEY, "0");
        return true;
      } else {
        tries++;
        localStorage.setItem(PIN_TRIES_KEY, tries.toString());
        if (tries >= 10) {
          const confirmReset = confirm("10 marta noto'g'ri urinish! Eski ma'lumotlarni o'chirib tashlab, yangidan boshlaysizmi?");
          if (confirmReset) {
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

  // Kirishda PIN ni tekshirish
  if (!askPinIfNeeded()) return;

  // Splash animatsiya 1.7s dan so'ng yo'qotiladi
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.classList.add('hide');
  }, 1700);

  // --- ELEMENTS
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
  // Tab bar & pages
  const homePage = document.getElementById('homePage');
  const chartPage = document.getElementById('chartPage');
  const goalPage = document.getElementById('goalPage');
  const tabHome = document.getElementById('tabHome');
  const tabChart = document.getElementById('tabChart');
  const tabGoal = document.getElementById('tabGoal');
  // Stats
  const statsChart = document.getElementById('statsChart');
  const showTodayBtn = document.getElementById('showTodayBtn');
  const showYesterdayBtn = document.getElementById('showYesterdayBtn');
  const show7DaysBtn = document.getElementById('show7DaysBtn');
  const statDate = document.getElementById('statDate');
  const statsList = document.getElementById('statsList');
  let statsChartObj = null;

  // --- STATE
  const STORAGE_KEY = 'expenses_v2';
  const CAT_KEY = 'categories_v2';
  const LIMIT_KEY = 'limit_v2';
  const LANG_KEY = 'lang_v2';
  const CUR_KEY = 'currency_v2';
  const THEME_KEY = 'theme_v2';
  const GOALS_KEY = 'goal_list';

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
  let editingId = null;
  let limit = Number(localStorage.getItem(LIMIT_KEY) || "0");
  let lang = localStorage.getItem(LANG_KEY) || "uz";
  let currency = localStorage.getItem(CUR_KEY) || "UZS";
  let theme = localStorage.getItem(THEME_KEY);
  let goalList = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) expenses = JSON.parse(raw);
    const catRaw = localStorage.getItem(CAT_KEY);
    if (catRaw) categories = JSON.parse(catRaw);
    const goalsRaw = localStorage.getItem(GOALS_KEY);
    if (goalsRaw) goalList = JSON.parse(goalsRaw);
  } catch (e) { expenses = []; }
  langSwitch.value = lang;
  currencySwitch.value = currency;

  // --- DARK/LIGHT MODE AUTO + TOGGLER ---
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
    document.querySelectorAll(".cat, #statsList, .goal-title, .goal-meta").forEach(e=>{
      e.style.color = newTheme === "dark" ? "#cbd5e1" : "#222";
    });
  }
  if (!theme) {
    theme = getSystemTheme();
    localStorage.setItem('theme_v2', theme);
  }
  applyTheme(theme);

  themeSwitch.addEventListener('click', () => {
    theme = (theme === "dark") ? "light" : "dark";
    localStorage.setItem('theme_v2', theme);
    applyTheme(theme);
    renderList();
    renderGoalList();
    showStatsToday();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme_v2')) {
      theme = e.matches ? "dark" : "light";
      applyTheme(theme);
    }
  });

  // --- Qidiruvda highlight funksiyasi ---
  function highlightMatch(text, keyword) {
    if (!keyword) return escapeHtml(text);
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }
  function saveCategories() { localStorage.setItem(CAT_KEY, JSON.stringify(categories)); }
  function saveGoals() { localStorage.setItem(GOALS_KEY, JSON.stringify(goalList)); }
  function formatNumber(n) {
    if (currency === "UZS") return Number(n).toLocaleString("uz-UZ");
    if (currency === "USD") return (Number(n)/kursUSD).toFixed(2);
    if (currency === "RUB") return (Number(n)/kursRUB).toFixed(2);
    return Number(n).toLocaleString();
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]);
    });
  }
  function calcTotal(list = expenses) {
    return list.reduce((s, it) => s + Number(it.amount), 0);
  }
  function getMonthExpenses(list = expenses) {
    const now = new Date();
    return list.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }

  // Sana inputiga bugungi sanani avtomatik belgilash
  function setTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }

  // CATEGORIES RENDER
  function renderCategories() {
    categoryEl.innerHTML = "";
    filterCatEl.innerHTML = `<option value="">Barchasi</option>`;
    categories.forEach(cat => {
      const html = `<option value="${cat.name}">${cat.emoji} ${cat.name}</option>`;
      categoryEl.insertAdjacentHTML("beforeend", html);
      filterCatEl.insertAdjacentHTML("beforeend", html);
    });
  }
  renderCategories();

  // EXPENSES RENDER
  function renderList() {
    listEl.innerHTML = '';
    const keyword = (searchEl?.value ?? '').toLowerCase();
    const filterCat = filterCatEl?.value ?? '';
    let filtered = expenses.filter(item => {
      const matchName = item.name.toLowerCase().includes(keyword);
      const matchCat = !filterCat || item.category === filterCat;
      return matchName && matchCat;
    });
    for (const item of filtered) {
      const li = document.createElement('li');
      const cat = categories.find(c => c.name === item.category) || { emoji: '', name: item.category };
      const left = document.createElement('div');
      left.innerHTML = `
        <span>${highlightMatch(item.name, keyword)}</span>
        <span class="cat">${cat.emoji} ${escapeHtml(item.category)}</span>
        <span>${formatNumber(item.amount)} ${currency}</span>
        <span style="margin-left:8px; color:#bbb;">${item.date ? item.date : ''}</span>
      `;
      const editBtn = document.createElement('button');
      editBtn.className = 'del-btn';
      editBtn.textContent = '✏️';
      editBtn.title = "Tahrirlash";
      editBtn.addEventListener('click', () => editExpense(item.id));
      const btn = document.createElement('button');
      btn.className = 'del-btn';
      btn.textContent = '❌';
      btn.title = "O'chirish";
      btn.addEventListener('click', () => deleteExpense(item.id));
      li.appendChild(left);
      li.appendChild(editBtn);
      li.appendChild(btn);
      listEl.appendChild(li);
    }
    totalEl.textContent = formatNumber(filtered.reduce((s, it) => s + Number(it.amount), 0));
    currencyLabel.textContent = currency === "UZS" ? "so'm" : (currency === "USD" ? "$" : "₽");
    renderChart(filtered);

    let monthTotal = calcTotal(getMonthExpenses(expenses));
    if (limit > 0 && monthTotal > limit) {
      limitNotice.textContent = `Diqqat! Oylik limitdan oshib ketdingiz. (${formatNumber(monthTotal)} ${currency})`;
    } else {
      limitNotice.textContent = "";
    }
  }

  // ADD/EDIT
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
    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || !isFinite(amount)) {
      alert("Iltimos, to'g'ri summa kiriting!");
      return;
    }
    if (editingId) {
      const expense = expenses.find(e => e.id === editingId);
      if (expense) {
        expense.name = name;
        expense.amount = Math.round(amount);
        expense.category = category;
        expense.date = date;
      }
      editingId = null;
      addBtn.textContent = "➕ Qo'shish";
    } else {
      const expense = {
        id: Date.now().toString(),
        name: name,
        amount: Math.round(amount),
        category: category,
        date: date
      };
      expenses.push(expense);
    }
    save();
    renderList();
    nameEl.value = '';
    amountEl.value = '';
    setTodayDate();
    nameEl.focus();
  }

  function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    save();
    renderList();
  }

  function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    nameEl.value = expense.name;
    amountEl.value = expense.amount;
    categoryEl.value = expense.category;
    dateEl.value = expense.date;
    editingId = id;
    addBtn.textContent = "✏️ Saqlash";
  }

  // CHART (statistika)
  let expChart = null;
  function renderChart(filtered) {
    if (!chartCanvas) return;
    const cats = categories.map(c=>c.name);
    const data = cats.map(cat => filtered.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0));
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
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: theme === "dark" ? "#cbd5e1" : "#222"
            }
          }
        }
      }
    });
  }

  // LANGUAGE (Qisqa variant)
  langSwitch.addEventListener('change', () => {
    lang = langSwitch.value;
    localStorage.setItem(LANG_KEY, lang);
    nameEl.placeholder = lang === "ru" ? "Что купили?" : lang === "en" ? "Item?" : "Nima oldingiz?";
    amountEl.placeholder = lang === "ru" ? "Сумма" : lang === "en" ? "Amount" : "Summasi";
    addBtn.textContent = lang === "ru" ? "Добавить" : lang === "en" ? "Add" : "Qo'shish";
    searchEl.placeholder = lang === "ru" ? "Поиск..." : lang === "en" ? "Search..." : "Qidiruv...";
  });

  // CURRENCY
  currencySwitch.addEventListener('change', () => {
    currency = currencySwitch.value;
    localStorage.setItem(CUR_KEY, currency);
    renderList();
    renderGoalList();
  });

  // LIMIT
  limitInput.value = limit > 0 ? limit : "";
  limitSaveBtn.addEventListener('click', () => {
    limit = Number(limitInput.value) || 0;
    localStorage.setItem(LIMIT_KEY, limit);
    renderList();
  });

  // CATEGORY QO'SHISH MODAL
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
    saveCategories();
    renderCategories();
    catModal.classList.remove("active");
  });

  addBtn.addEventListener('click', addOrEditExpense);
  amountEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') addOrEditExpense(); });
  nameEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') amountEl.focus(); });
  searchEl.addEventListener('input', renderList);
  filterCatEl.addEventListener('change', renderList);
  dateEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') addOrEditExpense(); });

  setTodayDate();
  renderList();

  // TAB BAR switching
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

  // ------ SOZLAMALAR SAHIFASI (PIN SAQLASH/O'CHIRISH) ------
  const tabSettings = document.getElementById('tabSettings');
  const settingsPage = document.getElementById('settingsPage');
  const pinInput = document.getElementById('pinInput');
  const savePinBtn = document.getElementById('savePinBtn');
  const removePinBtn = document.getElementById('removePinBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  tabSettings.addEventListener('click', () => {
    homePage.style.display = "none";
    chartPage.style.display = "none";
    goalPage.style.display = "none";
    settingsPage.style.display = "";
    pinInput.value = "";

    if (localStorage.getItem(PIN_KEY)) {
      removePinBtn.style.display = "";
    } else {
      removePinBtn.style.display = "none";
    }
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsPage.style.display = "none";
    homePage.style.display = "";
  });

  savePinBtn.addEventListener('click', () => {
    const pin = pinInput.value.trim();
    if (pin.length < 4 || !/^\d{4,}$/.test(pin)) {
      alert("PIN kamida 4ta raqamdan iborat bo'lishi kerak!");
      return;
    }
    localStorage.setItem(PIN_KEY, pin);
    localStorage.setItem(PIN_TRIES_KEY, "0");
    alert("PIN saqlandi!");
    settingsPage.style.display = "none";
    homePage.style.display = "";
  });

  removePinBtn.addEventListener('click', () => {
    const conf = confirm("PINni o'chirib tashlashni istaysizmi?");
    if (conf) {
      localStorage.removeItem(PIN_KEY);
      localStorage.removeItem(PIN_TRIES_KEY);
      alert("PIN o'chirildi! Endi ilova himoyasiz ochiladi.");
      settingsPage.style.display = "none";
      homePage.style.display = "";
    }
  });

  // ---- Kategoriya statistikasi modal + trend ----
  const catStatsModal = document.getElementById('catStatsModal');
  const catStatsTitle = document.getElementById('catStatsTitle');
  const catStatsInfo = document.getElementById('catStatsInfo');
  const catStatsChart = document.getElementById('catStatsChart');
  const closeCatStatsModal = document.getElementById('closeCatStatsModal');
  let catStatsChartObj = null;

  closeCatStatsModal.addEventListener('click', () => {
    catStatsModal.classList.remove('active');
    if(catStatsChartObj) catStatsChartObj.destroy();
  });

  function openCategoryStats(categoryName) {
    const catExps = expenses.filter(e => e.category === categoryName);
    if (!catExps.length) return;

    const total = catExps.reduce((s, it) => s + Number(it.amount), 0);

    let byDay = {};
    for(let e of catExps) {
      byDay[e.date] = (byDay[e.date]||0) + Number(e.amount);
    }
    let maxDay = Object.keys(byDay).length ? Object.keys(byDay).reduce((a,b)=> byDay[a]>byDay[b]?a:b ) : "-";
    let maxSum = byDay[maxDay] || 0;

    let days = [];
    let data = [];
    for(let i=6;i>=0;i--){
      let d = new Date(Date.now()-86400000*i);
      let dayStr = d.toISOString().slice(0,10);
      days.push(dayStr);
      data.push(catExps.filter(e=>e.date===dayStr).reduce((sum,e)=>sum+Number(e.amount),0));
    }

    catStatsTitle.textContent = `Statistika: ${categoryName}`;
    catStatsInfo.innerHTML = `
      <b>Umumiy:</b> ${formatNumber(total)} ${currency}<br>
      <b>Ko'p sarflangan kun:</b> ${maxDay} (${formatNumber(maxSum)} ${currency})
    `;

    if(catStatsChartObj) catStatsChartObj.destroy();
    catStatsChartObj = new Chart(catStatsChart, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: "7 kunlik trend",
          data: data,
          backgroundColor: theme === "dark" ? "#8b5cf6" : "#4caf50"
        }]
      },
      options: {
        scales: {
          x: {
            ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" },
            grid: { color: theme === "dark" ? "#22242c" : "#e0e7ef" }
          },
          y: {
            beginAtZero:true,
            ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" },
            grid: { color: theme === "dark" ? "#22242c" : "#e0e7ef" }
          }
        },
        plugins: { legend:{display:false} }
      }
    });

    catStatsModal.classList.add('active');
  }

  // --- STATISTIKA DIAGRAMMASI ---
  function renderStatsChart(labels, data) {
    if(statsChartObj) statsChartObj.destroy();
    statsChartObj = new Chart(statsChart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Sarflangan summa',
          data: data,
          backgroundColor: theme === "dark" ? "#8b5cf6" : "#4caf50"
        }]
      },
      options: {
        scales: {
          x: {
            ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" },
            grid: { color: theme === "dark" ? "#22242c" : "#e0e7ef" }
          },
          y: {
            beginAtZero:true,
            ticks: { color: theme === "dark" ? "#cbd5e1" : "#222" },
            grid: { color: theme === "dark" ? "#22242c" : "#e0e7ef" }
          }
        },
        plugins: { legend:{display:false} }
      }
    });
  }

  function showStatsToday() {
    const today = new Date();
    const key = today.toISOString().slice(0,10);
    const todayExp = expenses.filter(e => e.date === key);
    statDate.textContent = `Bugun: ${key}`;
    let cats = categories.map(c=>c.name);
    let data = cats.map(cat => todayExp.filter(e=>e.category===cat).reduce((sum,e)=>sum+Number(e.amount),0));
    renderStatsChart(cats, data);
    statsList.innerHTML = cats.map((cat,i) =>
      `<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${data[i]}</b></span>`
    ).join("<br>");
  }
  function showStatsYesterday() {
    const yester = new Date(Date.now()-86400000);
    const key = yester.toISOString().slice(0,10);
    const yesterExp = expenses.filter(e => e.date === key);
    statDate.textContent = `Kecha: ${key}`;
    let cats = categories.map(c=>c.name);
    let data = cats.map(cat => yesterExp.filter(e=>e.category===cat).reduce((sum,e)=>sum+Number(e.amount),0));
    renderStatsChart(cats, data);
    statsList.innerHTML = cats.map((cat,i) =>
      `<span class="cat-link" data-cat="${cat}">${categories[i].emoji} ${cat}: <b>${data[i]}</b></span>`
    ).join("<br>");
  }
  function showStats7Days() {
    let days = [];
    for(let i=6;i>=0;i--){
      let d = new Date(Date.now()-86400000*i);
      days.push(d.toISOString().slice(0,10));
    }
    let data = days.map(day=>{
      return expenses.filter(e=>e.date===day).reduce((sum,e)=>sum+Number(e.amount),0);
    });
    statDate.textContent = `Oxirgi 7 kun: ${days[0]} - ${days[6]}`;
    statsList.innerHTML = days.map((day,i)=>
      `<span class="cat-link" data-cat="${categories[i] ? categories[i].name : ''}">${day}: <b>${data[i]}</b></span>`
    ).join("<br>");
    renderStatsChart(days, data);
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

  // --------- GOAL (MAQSADLAR) BO'LIMI ---------
  const goalName = document.getElementById('goalName');
  const goalTarget = document.getElementById('goalTarget');
  const addGoalBtn = document.getElementById('addGoalBtn');
  const goalListDiv = document.getElementById('goalList');
  const goalCurrency = document.getElementById('goalCurrency');
  try {
    const goalsRaw = localStorage.getItem('goal_list');
    if (goalsRaw) goalList = JSON.parse(goalsRaw);
  } catch (e) { goalList = []; }
  function saveGoals() { localStorage.setItem('goal_list', JSON.stringify(goalList)); }

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
        saveGoals();
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
        saveGoals();
        renderGoalList();
      });
      const removeBtn = card.querySelector('.goal-remove-btn');
      removeBtn.addEventListener('click', () => {
        if (confirm("Ushbu maqsadni o'chirishni istaysizmi?")) {
          goalList.splice(idx,1);
          saveGoals();
          renderGoalList();
        }
      });
      goalListDiv.appendChild(card);
    });
  }

  addGoalBtn.addEventListener('click', () => {
    const name = goalName.value.trim();
    const target = Number(goalTarget.value.trim());
    const currency = goalCurrency.value;
    if (!name || !target || target<=0) {
      alert("Narsa nomi va narxini to'g'ri kiriting!");
      return;
    }
    goalList.push({
      name,
      target,
      current: 0,
      currency,
      progressHistory: []
    });
    saveGoals();
    goalName.value = '';
    goalTarget.value = '';
    renderGoalList();
  });

  renderGoalList();
});