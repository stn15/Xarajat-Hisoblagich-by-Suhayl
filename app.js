document.addEventListener('DOMContentLoaded', () => {
  // Splash animatsiya 1.7s dan so‘ng yo‘qotiladi
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
  // Tab bar
  const homePage = document.getElementById('homePage');
  const chartPage = document.getElementById('chartPage');
  const tabHome = document.getElementById('tabHome');
  const tabChart = document.getElementById('tabChart');
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
  let theme = localStorage.getItem(THEME_KEY) || "dark";

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) expenses = JSON.parse(raw);
    const catRaw = localStorage.getItem(CAT_KEY);
    if (catRaw) categories = JSON.parse(catRaw);
  } catch (e) { expenses = []; }
  langSwitch.value = lang;
  currencySwitch.value = currency;
  themeSwitch.textContent = theme === "dark" ? "🌙" : "☀️";
  document.body.classList.add(theme + "-mode");
   // --- PIN KOD KIRISH NAZORATI ---
const PIN_KEY = 'user_pin';
const PIN_TRIES_KEY = 'pin_tries';

function checkPinAccess() {
  const savedPin = localStorage.getItem(PIN_KEY);
  if (!savedPin) return true; // PIN yo‘q — to‘g‘ridan kirish

  let tries = Number(localStorage.getItem(PIN_TRIES_KEY) || "0");
  let userPin = prompt("Ilovaga kirish uchun PIN kodni kiriting:");

  if (userPin === savedPin) {
    localStorage.setItem(PIN_TRIES_KEY, "0");
    return true;
  } else {
    tries++;
    localStorage.setItem(PIN_TRIES_KEY, tries.toString());

    if (tries >= 10) {
      const confirmReset = confirm("10 marta noto‘g‘ri urinish! Eski ma’lumotlarni o‘chirib tashlab, yangidan boshlaysizmi?");
      if (confirmReset) {
        localStorage.clear();
        alert("Ma’lumotlar o‘chirildi. Ilova yangidan boshlanadi.");
        location.reload();
      }
    } else {
      alert(`Noto‘g‘ri PIN! Qolgan urinishlar: ${10 - tries}`);
    }
    return false;
  }
}

// Kirishda PINni tekshirish
if (!checkPinAccess()) return;


  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); }
  function saveCategories() { localStorage.setItem(CAT_KEY, JSON.stringify(categories)); }
  function formatNumber(n) {
    if (currency === "UZS") return Number(n).toLocaleString("uz-UZ");
    if (currency === "USD") return (Number(n)/12000).toFixed(2);
    if (currency === "RUB") return (Number(n)/140).toFixed(2);
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
        <span>${escapeHtml(item.name)}</span>
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
          legend: { position: 'bottom', labels: { color: "#cbd5e1" } }
        }
      }
    });
  }

  // THEME
  themeSwitch.addEventListener('click', () => {
    document.body.classList.remove(theme + "-mode");
    theme = theme === "dark" ? "light" : "dark";
    document.body.classList.add(theme + "-mode");
    themeSwitch.textContent = theme === "dark" ? "🌙" : "☀️";
    localStorage.setItem("theme_v2", theme);
  });

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
  });

  // LIMIT
  limitInput.value = limit > 0 ? limit : "";
  limitSaveBtn.addEventListener('click', () => {
    limit = Number(limitInput.value) || 0;
    localStorage.setItem(LIMIT_KEY, limit);
    renderList();
  });

  // CATEGORY QO‘SHISH MODAL
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
    tabHome.classList.add("active"); tabChart.classList.remove("active");
    homePage.style.display = ""; chartPage.style.display = "none";
  });
  tabChart.addEventListener('click', () => {
    tabHome.classList.remove("active"); tabChart.classList.add("active");
    homePage.style.display = "none"; chartPage.style.display = "";
    showStatsToday();
  });

  // Diagramma sahifasi funksiya va eventlar
  function renderStatsChart(labels, data) {
    if(statsChartObj) statsChartObj.destroy();
    statsChartObj = new Chart(statsChart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Sarflangan summa',
          data: data,
          backgroundColor: "#8b5cf6"
        }]
      },
      options: {
        scales: { x: { grid:{color:'#e0e7ef'} }, y: { beginAtZero:true, grid:{color:'#e0e7ef'} } },
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
    statsList.innerHTML = cats.map((cat,i)=> `${categories[i].emoji} ${cat}: <b>${data[i]}</b>` ).join("<br>");
  }
  function showStatsYesterday() {
    const yester = new Date(Date.now()-86400000);
    const key = yester.toISOString().slice(0,10);
    const yesterExp = expenses.filter(e => e.date === key);
    statDate.textContent = `Kecha: ${key}`;
    let cats = categories.map(c=>c.name);
    let data = cats.map(cat => yesterExp.filter(e=>e.category===cat).reduce((sum,e)=>sum+Number(e.amount),0));
    renderStatsChart(cats, data);
    statsList.innerHTML = cats.map((cat,i)=> `${categories[i].emoji} ${cat}: <b>${data[i]}</b>` ).join("<br>");
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
    renderStatsChart(days, data);
    statsList.innerHTML = days.map((day,i)=> `${day}: <b>${data[i]}</b>` ).join("<br>");
  }
  showTodayBtn.addEventListener('click',()=>{showStatsToday(); showTodayBtn.classList.add('active'); showYesterdayBtn.classList.remove('active'); show7DaysBtn.classList.remove('active');});
  showYesterdayBtn.addEventListener('click',()=>{showStatsYesterday(); showYesterdayBtn.classList.add('active'); showTodayBtn.classList.remove('active'); show7DaysBtn.classList.remove('active');});
  show7DaysBtn.addEventListener('click',()=>{showStats7Days(); show7DaysBtn.classList.add('active'); showTodayBtn.classList.remove('active'); showYesterdayBtn.classList.remove('active');});
});
const tabSettings = document.getElementById('tabSettings');
const settingsPage = document.getElementById('settingsPage');
const pinInput = document.getElementById('pinInput');
const savePinBtn = document.getElementById('savePinBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

tabSettings.addEventListener('click', () => {
  homePage.style.display = "none";
  chartPage.style.display = "none";
  settingsPage.style.display = "";
});

closeSettingsBtn.addEventListener('click', () => {
  settingsPage.style.display = "none";
  homePage.style.display = "";
});

savePinBtn.addEventListener('click', () => {
  const pin = pinInput.value.trim();
  if (pin.length < 4) {
    alert("PIN kamida 4 raqamdan iborat bo‘lishi kerak!");
    return;
  }
  localStorage.setItem(PIN_KEY, pin);
  localStorage.setItem(PIN_TRIES_KEY, "0");
  alert("PIN saqlandi!");
  settingsPage.style.display = "none";
  homePage.style.display = "";
});
