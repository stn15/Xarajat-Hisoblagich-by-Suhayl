(() => {
'use strict';
const $ = id => document.getElementById(id);
const $$ = s => document.querySelectorAll(s);
const K = { exp:'expenses_v3', inc:'incomes_v1', cat:'categories_v2', lim:'limit_v2', limOn:'limit_enabled', goal:'goal_list', trash:'trash_v1', cur:'currency', theme:'theme', lang:'userLang', rates:'rates_v1', pin:'user_pin_h', oldPin:'user_pin', tries:'pin_tries' };
const raw = (k, d) => localStorage.getItem(k) ?? d;
const put = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch {} };
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const iso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const amt = e => Number(e.amountUZS ?? e.amount ?? 0);
const PAL = ['#1b2a3a', '#1fa97a', '#e9b44c', '#e5584a', '#4f86c6', '#9b6bd6', '#14b8a6', '#f97316', '#84cc16', '#ec4899'];

/* ---------- TARJIMA ---------- */
const T = {
uz: { about:'Biz haqida', navHome:'Asosiy', navIncome:'Kirim', navStats:'Diagramma', navGoals:'Maqsadlar', balance:'Oylik balans (kirim − chiqim)', limitTitle:'Oylik limit', save:'Saqlash', addExpense:'Yangi xarajat', namePh:'Nima oldingiz?', amountPh:'Summasi', add:"Qo'shish", update:'Yangilash', searchPh:'Qidiruv...', all:'Barchasi', incomeTitle:'Kirim puli', incomeThisMonth:'Shu oydagi kirim', noteOpt:'Izoh (masalan: oylik maosh)', addIncome:"Kirim qo'shish", tabMonth:'Oylik', tabToday:'Bugun', tabYest:'Kecha', tab7:'7 kun', goalsTitle:'Maqsadlar', goalNamePh:'Maqsad nomi', goalPricePh:'Narxi', addGoal:"Maqsad qo'shish", pinSection:'PIN himoya', pinPh:'PIN (4–8 raqam)', savePin:'PINni saqlash', removePin:"PINni o'chirish", dataSection:"Ma'lumotlar", exportJson:'JSON yuklab olish', exportCsv:'CSV yuklab olish', importBtn:'JSON import', emptyTrash:'Tozalash', newCat:'Yangi kategoriya', catNamePh:'Kategoriya nomi', emojiPh:'Emoji', cancel:'Yopish', aboutText:'kunlik kirim-chiqimlarni kuzatish uchun qulay vosita.', dev:'Ishlab chiquvchi', version:'Versiya', rights:'Barcha huquqlar himoyalangan.', pinTitle:'Kirish uchun PIN kiriting', confirm:'Tasdiqlash',
  som:"so'm", income:'Kirim', expense:'Chiqim', noData:"Ma'lumot yo'q", fillAll:"Ma'lumot to'liq emas", deleted:"O'chirildi", undo:'Qaytarish', limitOver:'Limitdan oshdi', limitLeft:'Limitgacha qoldi', vsPrev:"o'tgan oy", newVal:'yangi', spentOfIncome:'Kirimning sarflangan ulushi', restore:'Tiklash', delPerm:"O'chirish", trashEmpty:"Trash bo'sh", confirmDel:"O'chirilsinmi?", confirmEmpty:'Trash butunlay tozalansinmi?', wrongPin:"Noto'g'ri PIN! Qolgan urinish", blocked:'Kirish bloklandi.', wipe:"10 marta xato! Barcha ma'lumotlar o'chirilib, ilova yangidan boshlansinmi?", importFound:'ta yozuv topildi', importAsk:"OK — mavjudlarga qo'shish\nBekor — hammasini almashtirish", importSure:"Hozirgi barcha ma'lumotlar o'chib, fayldagilar bilan almashadi. Davom etasizmi?", imported:'Import tugadi', badFile:"Fayl formati noto'g'ri", goalDone:'Maqsadga erishildi!', addMoneyPh:'+ summa', last6:'Oxirgi 6 oy: kirim va chiqim', catShare:'Kategoriyalar ulushi', pinSaved:'PIN saqlandi', pinBad:"PIN 4–8 raqam bo'lishi kerak", pinRemoved:"PIN o'chirildi", limitSaved:'Limit saqlandi', balanceLbl:'Balans', week:'7 kun', today:'Bugun', yesterday:'Kecha', catExists:'Bunday kategoriya bor', ofTotal:'jami xarajatdan', quickPh:'Tez: taksi 15000 yoki kofe 12k', catMgr:'Kategoriyalar', catMgrHint:"Nomi, emoji va oylik limit (so'm). Limit bo'sh bo'lsa, cheklov yo'q.", limitPh:"Limit (so'm)", recTitle:"Takroriy to'lovlar (har oy)", recDay:'Oyning kuni (1–28)', recAdd:"To'lov qo'shish", recAdded:"ta takroriy to'lov qo'shildi", backupDue:"Zaxira nusxa saqlang: ma'lumotlar faqat shu qurilmada", backupBtn:'Saqlash', insTitle:'Tahlil', insDaily:"Kunlik o'rtacha", insForecast:'Oy oxirigacha prognoz (chiqim)', insEndBal:'Oy oxirida balans (taxminan)', insTopCat:"Eng ko'p ketgan kategoriya", insTopDay:'Eng xarajatli hafta kuni', ofLimit:'limitdan', insEarly:"Prognoz uchun kamida 7 kunlik ma'lumot kerak", emptyExp:"Hali xarajat yo'q. Pastdagi + tugmasi bilan birinchisini qo'shing", emptyInc:"Bu yerda kirimlaringiz ko'rinadi. Birinchisini qo'shing", emptyGoal:"Maqsad qo'ying va unga qadam-baqadam yaqinlashing",
  acctTitle:'Hisob va bulut', signIn:'Google bilan kirish', signOut:'Chiqish', syncNow:'Hozir sinxronlash', syncing:'Sinxronlanmoqda…', syncedAt:'Oxirgi sinxron', syncErr:'Xato:', offlineNow:"Internet yo'q — keyin avtomatik yuboriladi", cloudOff:"Bulut hozir mavjud emas (internet yo'q yoki yuklanmadi). Ilova oddiy rejimda ishlaydi.", syncHint:"Kiring — ma'lumotlaringiz bulutda saqlanadi va yangi telefonda qaytadi.", signInFail:"Kirib bo'lmadi", switchAcct:"Bu qurilmada boshqa hisobning ma'lumotlari bor. Davom etsangiz, ular tozalanib, yangi hisobniki yuklanadi. Davom etasizmi?", signOutAsk:"Chiqasizmi? Qurilmadagi ma'lumotlar qoladi, lekin bulutga yuborilmaydi.", pendingN:'yuborilmagan', privacy:'Maxfiylik siyosati', delAcct:"Hisobni va bulut ma'lumotini o'chirish", delWarn:"Bulutdagi hamma ma'lumotingiz va hisobingiz butunlay o'chiriladi. Buni qaytarib bo'lmaydi. Shu qurilmadagi ma'lumot qoladi. Davom etish uchun Google bilan qayta tasdiqlaysiz.", delConfirm:"Tasdiqlash va o'chirish", delCancel:'Bekor qilish', delWorking:"O'chirilmoqda…", acctDeleted:"Hisob va bulut ma'lumoti o'chirildi", delFail:"O'chirib bo'lmadi" },
ru: { about:'О приложении', navHome:'Главная', navIncome:'Доход', navStats:'Диаграмма', navGoals:'Цели', balance:'Баланс месяца (доход − расход)', limitTitle:'Лимит на месяц', save:'Сохранить', addExpense:'Новый расход', namePh:'Что купили?', amountPh:'Сумма', add:'Добавить', update:'Обновить', searchPh:'Поиск...', all:'Все', incomeTitle:'Доход', incomeThisMonth:'Доход за этот месяц', noteOpt:'Заметка (например: зарплата)', addIncome:'Добавить доход', tabMonth:'Месяц', tabToday:'Сегодня', tabYest:'Вчера', tab7:'7 дней', goalsTitle:'Цели', goalNamePh:'Название цели', goalPricePh:'Стоимость', addGoal:'Добавить цель', pinSection:'PIN-защита', pinPh:'PIN (4–8 цифр)', savePin:'Сохранить PIN', removePin:'Удалить PIN', dataSection:'Данные', exportJson:'Скачать JSON', exportCsv:'Скачать CSV', importBtn:'Импорт JSON', emptyTrash:'Очистить', newCat:'Новая категория', catNamePh:'Название категории', emojiPh:'Эмодзи', cancel:'Закрыть', aboutText:'удобный инструмент для учёта ежедневных доходов и расходов.', dev:'Разработчик', version:'Версия', rights:'Все права защищены.', pinTitle:'Введите PIN для входа', confirm:'Подтвердить',
  som:'сум', income:'Доход', expense:'Расход', noData:'Нет данных', fillAll:'Заполните все поля', deleted:'Удалено', undo:'Вернуть', limitOver:'Превышение лимита', limitLeft:'До лимита осталось', vsPrev:'прошлый месяц', newVal:'новое', spentOfIncome:'Доля дохода, потраченная', restore:'Вернуть', delPerm:'Удалить', trashEmpty:'Корзина пуста', confirmDel:'Удалить?', confirmEmpty:'Очистить корзину полностью?', wrongPin:'Неверный PIN! Осталось попыток', blocked:'Вход заблокирован.', wipe:'10 неверных попыток! Удалить все данные и начать заново?', importFound:'записей найдено', importAsk:'OK — добавить к существующим\nОтмена — заменить всё', importSure:'Все текущие данные будут заменены данными из файла. Продолжить?', imported:'Импорт завершён', badFile:'Неверный формат файла', goalDone:'Цель достигнута!', addMoneyPh:'+ сумма', last6:'Последние 6 месяцев: доход и расход', catShare:'Доли категорий', pinSaved:'PIN сохранён', pinBad:'PIN — от 4 до 8 цифр', pinRemoved:'PIN удалён', limitSaved:'Лимит сохранён', balanceLbl:'Баланс', week:'7 дней', today:'Сегодня', yesterday:'Вчера', catExists:'Такая категория уже есть', ofTotal:'от всех расходов', quickPh:'Быстро: такси 15000 или кофе 12k', catMgr:'Категории', catMgrHint:'Название, эмодзи и лимит на месяц (сум). Пустой лимит — без ограничения.', limitPh:'Лимит (сум)', recTitle:'Регулярные платежи (ежемесячно)', recDay:'День месяца (1–28)', recAdd:'Добавить платёж', recAdded:'регулярных платежей добавлено', backupDue:'Сохраните резервную копию: данные хранятся только на этом устройстве', backupBtn:'Сохранить', insTitle:'Анализ', insDaily:'В среднем в день', insForecast:'Прогноз расходов на конец месяца', insEndBal:'Баланс на конец месяца (прибл.)', insTopCat:'Больше всего ушло на', insTopDay:'Самый затратный день недели', ofLimit:'лимита', insEarly:'Для прогноза нужно минимум 7 дней данных', emptyExp:'Расходов пока нет. Добавьте первый кнопкой + внизу', emptyInc:'Здесь появятся ваши доходы. Добавьте первый', emptyGoal:'Поставьте цель и приближайтесь к ней шаг за шагом',
  acctTitle:'Аккаунт и облако', signIn:'Войти через Google', signOut:'Выйти', syncNow:'Синхронизировать', syncing:'Синхронизация…', syncedAt:'Последняя синхронизация', syncErr:'Ошибка:', offlineNow:'Нет интернета — отправится автоматически', cloudOff:'Облако недоступно (нет интернета или не загрузилось). Приложение работает в обычном режиме.', syncHint:'Войдите — данные сохранятся в облаке и вернутся на новом телефоне.', signInFail:'Не удалось войти', switchAcct:'На устройстве данные другого аккаунта. Если продолжить, они будут очищены и загрузятся данные нового аккаунта. Продолжить?', signOutAsk:'Выйти? Данные на устройстве сохранятся, но не будут отправляться в облако.', pendingN:'не отправлено', privacy:'Политика конфиденциальности', delAcct:'Удалить аккаунт и облачные данные', delWarn:'Все ваши данные в облаке и аккаунт будут удалены безвозвратно. Данные на этом устройстве сохранятся. Для продолжения подтвердите вход через Google.', delConfirm:'Подтвердить и удалить', delCancel:'Отмена', delWorking:'Удаление…', acctDeleted:'Аккаунт и облачные данные удалены', delFail:'Не удалось удалить' },
en: { about:'About', navHome:'Home', navIncome:'Income', navStats:'Charts', navGoals:'Goals', balance:'Monthly balance (income − expenses)', limitTitle:'Monthly limit', save:'Save', addExpense:'New expense', namePh:'What did you buy?', amountPh:'Amount', add:'Add', update:'Update', searchPh:'Search...', all:'All', incomeTitle:'Income', incomeThisMonth:'Income this month', noteOpt:'Note (e.g. salary)', addIncome:'Add income', tabMonth:'Monthly', tabToday:'Today', tabYest:'Yesterday', tab7:'7 days', goalsTitle:'Goals', goalNamePh:'Goal name', goalPricePh:'Price', addGoal:'Add goal', pinSection:'PIN protection', pinPh:'PIN (4–8 digits)', savePin:'Save PIN', removePin:'Remove PIN', dataSection:'Data', exportJson:'Download JSON', exportCsv:'Download CSV', importBtn:'Import JSON', emptyTrash:'Empty', newCat:'New category', catNamePh:'Category name', emojiPh:'Emoji', cancel:'Close', aboutText:'a handy tool for tracking your daily income and spending.', dev:'Developer', version:'Version', rights:'All rights reserved.', pinTitle:'Enter PIN to unlock', confirm:'Confirm',
  som:'UZS', income:'Income', expense:'Expenses', noData:'No data', fillAll:'Please fill in all fields', deleted:'Deleted', undo:'Undo', limitOver:'Over the limit by', limitLeft:'Left until limit', vsPrev:'last month', newVal:'new', spentOfIncome:'Share of income spent', restore:'Restore', delPerm:'Delete', trashEmpty:'Trash is empty', confirmDel:'Delete?', confirmEmpty:'Empty the trash completely?', wrongPin:'Wrong PIN! Attempts left', blocked:'Access blocked.', wipe:'10 wrong attempts! Erase all data and start over?', importFound:'records found', importAsk:'OK — add to existing\nCancel — replace everything', importSure:'All current data will be replaced with the file contents. Continue?', imported:'Import finished', badFile:'Invalid file format', goalDone:'Goal reached!', addMoneyPh:'+ amount', last6:'Last 6 months: income vs expenses', catShare:'Category share', pinSaved:'PIN saved', pinBad:'PIN must be 4–8 digits', pinRemoved:'PIN removed', limitSaved:'Limit saved', balanceLbl:'Balance', week:'7 days', today:'Today', yesterday:'Yesterday', catExists:'Category already exists', ofTotal:'of all expenses', quickPh:'Quick: taxi 15000 or coffee 12k', catMgr:'Categories', catMgrHint:'Name, emoji and monthly limit (UZS). Empty limit = no limit.', limitPh:'Limit (UZS)', recTitle:'Recurring payments (monthly)', recDay:'Day of month (1–28)', recAdd:'Add payment', recAdded:'recurring payments added', backupDue:'Save a backup: your data lives only on this device', backupBtn:'Save', insTitle:'Insights', insDaily:'Daily average', insForecast:'Month-end expense forecast', insEndBal:'Estimated month-end balance', insTopCat:'Top category', insTopDay:'Priciest weekday', ofLimit:'of limit', insEarly:'A forecast needs at least 7 days of data', emptyExp:'No expenses yet. Add the first one with the + button below', emptyInc:'Your income will show up here. Add the first one', emptyGoal:'Set a goal and get closer to it step by step',
  acctTitle:'Account & cloud', signIn:'Sign in with Google', signOut:'Sign out', syncNow:'Sync now', syncing:'Syncing…', syncedAt:'Last synced', syncErr:'Error:', offlineNow:'Offline — will send automatically later', cloudOff:'Cloud is unavailable (offline or failed to load). The app works in normal mode.', syncHint:'Sign in — your data is saved in the cloud and comes back on a new phone.', signInFail:'Sign-in failed', switchAcct:'This device holds another account\'s data. If you continue it will be cleared and the new account\'s data loaded. Continue?', signOutAsk:'Sign out? Data on this device stays but will not be sent to the cloud.', pendingN:'not sent yet', privacy:'Privacy policy', delAcct:'Delete account and cloud data', delWarn:'All your cloud data and your account will be permanently deleted. This cannot be undone. Data on this device stays. To continue you will confirm with Google again.', delConfirm:'Confirm and delete', delCancel:'Cancel', delWorking:'Deleting…', acctDeleted:'Account and cloud data deleted', delFail:'Could not delete' }
};

/* ---------- HOLAT ---------- */
let lang = raw(K.lang, 'uz'), theme = raw(K.theme, 'light'), currency = raw(K.cur, 'UZS');
let limit = Number(raw(K.lim, 0)) || 0, limitOn = raw(K.limOn, 'false') === 'true';
let expenses = load(K.exp, []), incomes = load(K.inc, []), trash = load(K.trash, []), goals = load(K.goal, []);
let recurring = load('recurring_v1', []);
const DEF_CATS = [{ name:'Ovqat', emoji:'🍔' }, { name:'Transport', emoji:'🚗' }, { name:'Kommunal', emoji:'⚡' }, { name:'Bozorlik', emoji:'🛍️' }];
let categories = load(K.cat, null) || DEF_CATS.map(c => ({ ...c }));
let justAdded = null, page = 'home', period = 'month', editId = null, homeChart = null, statsChart = null;
let catTouched = false;
let usd = 12000, rub = 140;
const rc = load(K.rates, null); if (rc && rc.usd && rc.rub) { usd = rc.usd; rub = rc.rub; }

// eski versiyadagi "kirim" yozuvlarini alohida bo'limga ko'chirish
const legacyInc = expenses.filter(e => e.type === 'income');
if (legacyInc.length) {
  incomes.push(...legacyInc.map(e => ({ id: String(e.id), amountUZS: amt(e), date: e.date, note: e.name })));
  expenses = expenses.filter(e => e.type !== 'income');
  put(K.exp, expenses); put(K.inc, incomes);
}
const saveAll = () => { syncStamp(); put('recurring_v1', recurring); put(K.exp, expenses); put(K.inc, incomes); put(K.trash, trash); put(K.goal, goals); put(K.cat, categories); syncSoon(); };

/* ---------- YORDAMCHILAR ---------- */
const t = k => (T[lang] && T[lang][k]) || T.uz[k] || k;
const locale = () => ({ uz:'uz-UZ', ru:'ru-RU', en:'en-US' }[lang]);
const rate = c => c === 'USD' ? usd : c === 'RUB' ? rub : 1;
const sym = c => c === 'UZS' ? t('som') : c === 'USD' ? '$' : '₽';
const num = v => Number(v).toLocaleString(locale(), { maximumFractionDigits: 2 });
const money = (uzs, c = currency) => { const v = uzs / rate(c); return num(c === 'UZS' ? Math.round(v) : v) + ' ' + sym(c); };
const monthKey = (d = new Date()) => iso(d).slice(0, 7);
const addMonth = (key, n) => { const [y, m] = key.split('-').map(Number); return iso(new Date(y, m - 1 + n, 1)).slice(0, 7); };
const sumIn = (arr, key) => arr.filter(e => (e.date || '').slice(0, 7) === key).reduce((s, e) => s + amt(e), 0);
const monthName = (key, short) => { const [y, m] = key.split('-').map(Number), n = MN[lang][m - 1]; return short ? n.slice(0, 3) : `${n} ${y}`; };
const pct = (cur, prev) => prev === 0 ? (cur === 0 ? 0 : null) : (cur - prev) / Math.abs(prev) * 100;
const pctText = p => p === null ? t('newVal') : (p > 0 ? '▲ ' : p < 0 ? '▼ ' : '') + Math.abs(p).toFixed(1) + '%';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICONS = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', plus: '<path d="M12 5v14M5 12h14"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', down: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  repeat: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
  wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12v3M16 14h2"/>'
};
const svg = (n, s = 20) => `<svg class="i" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const empty = (k, ic) => `<div class="empty-state"><div class="eico">${svg(ic, 30)}</div><b>${t(k)}</b></div>`;
function countTo(el, to, fmt) {
  const from = el._v ?? 0; el._v = to;
  if (RM || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = now => { const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1 && el._v === to) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const MN = { uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const MG = { uz: MN.uz.map(s => s.toLowerCase()), ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'], en: MN.en.map(s => s.slice(0, 3)) };
const WD = { uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'], ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
const fdate = d => {
  const [y, m, dd] = String(d).split('-').map(Number); if (!m) return d;
  const mm = MG[lang][m - 1], yr = y !== new Date().getFullYear() ? ' ' + y : '';
  return lang === 'uz' ? `${dd}-${mm}${yr}` : lang === 'en' ? `${mm} ${dd}${yr ? ',' + yr : ''}` : `${dd} ${mm}${yr}`;
};
const muted = () => getComputedStyle(document.body).getPropertyValue('--muted').trim() || '#888';

function toast(msg, undoFn, label) {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (undoFn) { const b = document.createElement('button'); b.textContent = label || t('undo'); b.onclick = () => { undoFn(); el.remove(); }; el.appendChild(b); }
  $('toasts').appendChild(el); setTimeout(() => el.remove(), 4500);
}
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const openSheet = id => $(id).classList.add('on');
const closeSheet = id => $(id).classList.remove('on');

/* ---------- KURSLAR ---------- */
fetch('https://open.er-api.com/v6/latest/UZS').then(r => r.json()).then(d => {
  if (d && d.rates && d.rates.USD && d.rates.RUB) { usd = 1 / d.rates.USD; rub = 1 / d.rates.RUB; put(K.rates, { usd, rub }); render(); }
}).catch(() => {});

/* ---------- BULUT (Firebase) ---------- */
const FB_CFG = { apiKey: "AIzaSyAv-bBFrTPU0N7-iNW8U4jL5Igcvz8Z86Q", authDomain: "xarajat-h.firebaseapp.com", projectId: "xarajat-h", storageBucket: "xarajat-h.firebasestorage.app", messagingSenderId: "101856092661", appId: "1:101856092661:web:4eca838bda6c025fef40bc" };
const SK = { sigs: 'sync_sigs_v1', outbox: 'sync_outbox_v1', lastPull: 'sync_lastpull', metaTs: 'sync_meta_ts', metaSig: 'sync_meta_sig', metaSynced: 'sync_meta_synced', uid: 'sync_uid', last: 'sync_last' };
const COLS = ['expenses', 'incomes', 'trash'];
const arrOf = c => c === 'expenses' ? expenses : c === 'incomes' ? incomes : trash;
let sigs = load(SK.sigs, {}), outbox = load(SK.outbox, {});
let lastPull = Number(raw(SK.lastPull, 0)) || 0, metaTs = Number(raw(SK.metaTs, 0)) || 0, metaSig = raw(SK.metaSig, ''), metaSynced = raw(SK.metaSynced, '') === '1';
const S = { auth: null, db: null, user: null, state: 'idle', err: '', busy: false, pending: '', timer: 0, last: Number(raw(SK.last, 0)) || 0 };
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36) + '.' + s.length; };
const itemSig = it => { const { updatedAt, ...rest } = it; return hash(JSON.stringify(rest)); };
const metaObj = () => ({ categories, goals, recurring, limit, limitOn });
const metaHash = () => hash(JSON.stringify(metaObj()));
const DEF_META_SIG = hash(JSON.stringify({ categories: DEF_CATS, goals: [], recurring: [], limit: 0, limitOn: false }));
const persistSync = () => { put(SK.sigs, sigs); put(SK.outbox, outbox); put(SK.metaTs, String(metaTs)); put(SK.metaSig, metaSig); };

// Nima o'zgarganini avtomatik aniqlaydi: yangi/o'zgargan yozuvga vaqt qo'yadi, o'chirilganini "qabr toshi" qilib navbatga qo'yadi
function syncStamp() {
  const now = Date.now();
  COLS.forEach(c => {
    const seen = new Set();
    arrOf(c).forEach(it => {
      const id = String(it.id), k = c + ':' + id, sg = itemSig(it); seen.add(id);
      if (sigs[k] !== sg) { it.updatedAt = now; sigs[k] = sg; outbox[k] = { col: c, id }; }
    });
    Object.keys(sigs).forEach(k => {
      if (!k.startsWith(c + ':')) return;
      const id = k.slice(c.length + 1);
      if (!seen.has(id)) { delete sigs[k]; outbox[k] = { col: c, id, deleted: true, updatedAt: now }; }
    });
  });
  const ms = metaHash();
  if (ms !== metaSig && (metaSig !== '' || ms !== DEF_META_SIG)) { metaTs = now; outbox.meta = { col: 'meta' }; }
  metaSig = ms; persistSync();
}
const touchMeta = () => { syncStamp(); syncSoon(); };

function applyMeta(m) {
  if (Array.isArray(m.categories) && m.categories.length) categories = m.categories;
  goals = Array.isArray(m.goals) ? m.goals : []; recurring = Array.isArray(m.recurring) ? m.recurring : [];
  limit = Number(m.limit) || 0; limitOn = !!m.limitOn;
  put(K.lim, String(limit)); put(K.limOn, String(limitOn)); $('limitInput').value = limit || ''; $('limitToggle').checked = limitOn;
}
function mergeMeta(m) {
  const cn = new Set((m.categories || []).map(c => c.name)); categories = [...(m.categories || []), ...categories.filter(c => !cn.has(c.name))];
  const gn = new Set((m.goals || []).map(g => g.name)); goals = [...(m.goals || []), ...goals.filter(g => !gn.has(g.name))];
  const rn = new Set((m.recurring || []).map(r => r.id)); recurring = [...(m.recurring || []), ...recurring.filter(r => !rn.has(r.id))];
  limit = Number(m.limit) || limit; limitOn = !!m.limitOn || limitOn;
  put(K.lim, String(limit)); put(K.limOn, String(limitOn)); $('limitInput').value = limit || ''; $('limitToggle').checked = limitOn;
}

async function syncPull() {
  const base = S.db.collection('users').doc(S.user.uid), t0 = Date.now();
  const snap = await base.collection('items').where('updatedAt', '>', Math.max(0, lastPull - 600000)).get();
  let changed = false;
  snap.forEach(d => {
    const r = d.data(); if (!COLS.includes(r.col)) return;
    const a = arrOf(r.col), id = String(r.id), k = r.col + ':' + id, i = a.findIndex(x => String(x.id) === id), cur = i >= 0 ? a[i] : null;
    if (cur && (cur.updatedAt || 0) >= r.updatedAt) return;                       // mahalliy yangiroq
    if (!cur && outbox[k] && outbox[k].deleted && outbox[k].updatedAt >= r.updatedAt) return; // biz bunisini o'chirgan edik
    if (r.deleted) { if (i >= 0) { a.splice(i, 1); changed = true; } delete sigs[k]; }
    else {
      let it; try { it = JSON.parse(r.data); } catch { return; }
      it.updatedAt = r.updatedAt; if (i >= 0) a[i] = it; else a.push(it); sigs[k] = itemSig(it); changed = true;
    }
    delete outbox[k];
  });
  const md = await base.collection('meta').doc('state').get();
  if (md.exists) {
    const r = md.data(); let m = null; try { m = JSON.parse(r.data); } catch {}
    if (m) {
      if (!metaSynced) {
        if (metaHash() === DEF_META_SIG) { applyMeta(m); metaTs = r.updatedAt; delete outbox.meta; }
        else { mergeMeta(m); metaTs = Date.now(); outbox.meta = { col: 'meta' }; }
        changed = true;
      } else if (r.updatedAt > metaTs) { applyMeta(m); metaTs = r.updatedAt; delete outbox.meta; changed = true; }
      metaSig = metaHash();
    }
  }
  metaSynced = true; put(SK.metaSynced, '1'); lastPull = t0; put(SK.lastPull, String(t0));
  persistSync();
  if (changed) { saveAll(); renderCats(); render(); }
}

async function syncPush() {
  const keys = Object.keys(outbox); if (!keys.length) return;
  const base = S.db.collection('users').doc(S.user.uid), now = Date.now();
  for (let i = 0; i < keys.length; i += 400) {
    const part = keys.slice(i, i + 400), sent = part.map(k => outbox[k]), batch = S.db.batch();
    part.forEach(k => {
      const o = outbox[k];
      if (k === 'meta') { batch.set(base.collection('meta').doc('state'), { data: JSON.stringify(metaObj()), updatedAt: metaTs || now }); return; }
      const it = o.deleted ? null : arrOf(o.col).find(x => String(x.id) === String(o.id));
      batch.set(base.collection('items').doc(o.col + '_' + encodeURIComponent(o.id)),
        it ? { col: o.col, id: String(o.id), deleted: false, updatedAt: it.updatedAt || now, data: JSON.stringify(it) }
           : { col: o.col, id: String(o.id), deleted: true, updatedAt: o.deleted ? o.updatedAt : now, data: '' });
    });
    await batch.commit();
    part.forEach((k, j) => { if (outbox[k] === sent[j]) delete outbox[k]; });   // yangiroq o'zgarish bo'lsa, navbatda qoladi
    persistSync();
  }
}

async function sync(mode) {
  if (!S.user || !S.db) return;
  if (S.busy) { S.pending = mode === 'full' ? 'full' : (S.pending || 'push'); return; }
  if (!navigator.onLine) { S.state = 'offline'; renderAccount(); return; }
  S.busy = true; S.state = 'syncing'; S.err = ''; renderAccount();
  try {
    if (mode === 'full') await syncPull();
    syncStamp(); await syncPush();
    S.state = 'ok'; S.last = Date.now(); put(SK.last, String(S.last));
  } catch (e) { S.state = navigator.onLine ? 'error' : 'offline'; S.err = e.code || e.message || ''; console.warn('sync', e); }
  S.busy = false; renderAccount();
  if (S.pending) { const m = S.pending; S.pending = ''; if (S.state === 'ok') sync(m); }
}
function syncSoon() { clearTimeout(S.timer); S.timer = setTimeout(() => sync('push'), 1500); }

async function onSignedIn() {
  const prev = raw(SK.uid, '');
  if (prev && prev !== S.user.uid) {
    if (!confirm(t('switchAcct'))) { await S.auth.signOut(); return; }
    expenses = []; incomes = []; trash = []; goals = []; recurring = []; categories = DEF_CATS.map(c => ({ ...c })); limit = 0; limitOn = false;
    sigs = {}; outbox = {}; lastPull = 0; metaTs = 0; metaSig = ''; metaSynced = false;
    [SK.lastPull, SK.metaTs, SK.metaSynced, SK.metaSig].forEach(k => localStorage.removeItem(k)); put(K.lim, '0'); put(K.limOn, 'false');
    saveAll(); renderCats(); render();
  }
  put(SK.uid, S.user.uid); await sync('full');
}
async function signIn() {
  if (!S.auth) return toast(t('cloudOff'));
  const prov = new firebase.auth.GoogleAuthProvider();
  try { await S.auth.signInWithPopup(prov); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return S.auth.signInWithRedirect(prov);
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') toast(t('signInFail') + ' (' + (e.code || e.message || '') + ')');
  }
}
async function deleteAccount() {
  if (!S.user || !S.db || S.deleting) return;
  S.deleting = true; S.busy = true; clearTimeout(S.timer); renderAccount();
  try {
    await S.user.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());   // xavfsizlik: o'chirishdan oldin qayta tasdiqlash
    const base = S.db.collection('users').doc(S.user.uid), refs = [];
    const snap = await base.collection('items').get(); snap.forEach(d => refs.push(d.ref));
    for (let i = 0; i < refs.length; i += 400) { const b = S.db.batch(); refs.slice(i, i + 400).forEach(r => b.delete(r)); await b.commit(); }
    await base.collection('meta').doc('state').delete();
    await S.user.delete();
    sigs = {}; outbox = {}; lastPull = 0; metaTs = 0; metaSig = ''; metaSynced = false;
    [SK.sigs, SK.outbox, SK.lastPull, SK.metaTs, SK.metaSig, SK.metaSynced, SK.uid, SK.last].forEach(k => localStorage.removeItem(k));
    S.last = 0; S.state = 'idle'; S.pending = ''; S.del = false; toast(t('acctDeleted'));
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') toast(t('delFail') + ' (' + (e.code || e.message || '') + ')');
  }
  S.deleting = false; S.busy = false; renderAccount();
}
function initCloud() {
  if (!window.firebase || !firebase.initializeApp) return renderAccount();
  try { firebase.initializeApp(FB_CFG); S.auth = firebase.auth(); S.db = firebase.firestore(); } catch (e) { console.warn(e); return renderAccount(); }
  S.auth.getRedirectResult().catch(e => toast(t('signInFail') + ' (' + (e.code || '') + ')'));
  S.auth.onAuthStateChanged(async u => { S.user = u; renderAccount(); if (u) await onSignedIn(); });
  addEventListener('online', () => sync('full'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - S.last > 30000) sync('full'); });
  renderAccount();
}
function renderAccount() {
  const el = $('acctBody'); if (!el) return;
  if (!S.db) { el.innerHTML = `<div class="note">${t('cloudOff')}</div>`; return; }
  if (!S.user) { el.innerHTML = `<div class="note">${t('syncHint')}</div><button class="btn" data-a="in">${t('signIn')}</button>`; return; }
  const u = S.user, n = Object.keys(outbox).length, tm = S.last ? new Date(S.last).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '';
  const st = S.state === 'syncing' ? t('syncing') : S.state === 'offline' ? t('offlineNow') : S.state === 'error' ? `${t('syncErr')} ${esc(S.err)}` : (tm ? `${t('syncedAt')}: ${tm}` : '');
  el.innerHTML = `<div class="meta"><b>${esc(u.displayName || u.email || '')}</b><small>${esc(u.email || '')}</small></div><div class="note">${st}${n ? ` · ${n} ${t('pendingN')}` : ''}</div><div class="row"><button class="btn" data-a="sync">${t('syncNow')}</button><button class="btn ghost" data-a="out">${t('signOut')}</button></div>` + (S.del
    ? `<div class="note bad">${t('delWarn')}</div><div class="row"><button class="btn danger" data-a="delgo"${S.deleting ? ' disabled' : ''}>${S.deleting ? t('delWorking') : t('delConfirm')}</button><button class="btn ghost" data-a="delno"${S.deleting ? ' disabled' : ''}>${t('delCancel')}</button></div>`
    : `<button class="btn ghost" data-a="del">${t('delAcct')}</button>`);
}

/* ---------- RENDER ---------- */
function render() { ({ home: renderHome, income: renderIncome, stats: renderStats, goals: renderGoals, settings: renderSettings })[page](); }

function renderCats() {
  const fc = $('filterCategory').value, cur = $('category').value;
  $('category').innerHTML = categories.map(c => `<option value="${esc(c.name)}">${esc(c.emoji)} ${esc(c.name)}</option>`).join('');
  $('filterCategory').innerHTML = `<option value="">${t('all')}</option>` + categories.map(c => `<option value="${esc(c.name)}">${esc(c.emoji)} ${esc(c.name)}</option>`).join('');
  $('category').value = categories.some(c => c.name === cur) ? cur : categories[0].name;
  $('filterCategory').value = fc;
  $('recCat').innerHTML = $('category').innerHTML;
}

function renderHome() {
  const mk = monthKey(), inc = sumIn(incomes, mk), out = sumIn(expenses, mk), bal = inc - out;
  countTo($('total'), bal, v => (v < 0 ? '−' : '') + money(Math.abs(v)));
  $('monthLine').innerHTML = `<span><i class="dot in"></i>${t('income')}: ${money(inc)}</span><span><i class="dot out"></i>${t('expense')}: ${money(out)}</span>`;
  $('limitBody').style.display = limitOn ? '' : 'none';
  const bar = $('limitBar'), note = $('limitNotice');
  if (limitOn && limit > 0) {
    const p = out / limit * 100;
    bar.style.width = Math.min(p, 100) + '%'; bar.className = p >= 100 ? 'bad' : p >= 80 ? 'warn' : '';
    note.textContent = p >= 100 ? `${t('limitOver')}: ${money(out - limit)}` : `${t('limitLeft')}: ${money(limit - out)} (${p.toFixed(0)}%)`;
  } else { bar.style.width = '0'; note.textContent = ''; }

  const lim = categories.filter(c => c.limit > 0);
  $('catLimits').style.display = lim.length ? '' : 'none';
  $('catLimits').innerHTML = lim.map(c => { const v = sumIn(expenses.filter(e => e.category === c.name), mk), p = v / c.limit * 100; return `<div class="share"><div class="row"><span>${esc(c.emoji)} ${esc(c.name)}</span><b>${money(v)} / ${money(c.limit)}</b></div><div class="bar"><i class="${p >= 100 ? 'bad' : p >= 80 ? 'warn' : ''}" style="width:${Math.min(p, 100)}%"></i></div></div>`; }).join('');

  const q = $('search').value.trim().toLowerCase(), fc = $('filterCategory').value;
  const list = expenses.filter(e => (!fc || e.category === fc) && (!q || (e.name || '').toLowerCase().includes(q)))
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  $('list').innerHTML = list.length ? list.map(e => {
    const c = categories.find(k => k.name === e.category);
    return `<li${String(e.id) === justAdded ? ' class="pop"' : ''}><div class="ico">${esc(c ? c.emoji : '📦')}</div><div class="meta"><b>${esc(e.name)}</b><small>${esc(e.category)} · ${fdate(e.date)}</small></div><div class="amt">−${money(amt(e))}</div><div class="acts"><button data-a="edit" data-id="${esc(e.id)}">${svg('edit', 18)}</button><button data-a="del" data-id="${esc(e.id)}">${svg('trash', 18)}</button></div></li>`;
  }).join('') : `<li class="plain">${empty('emptyExp', 'wallet')}</li>`;

  justAdded = null;
  const byCat = categories.map(c => ({ c, v: sumIn(list.filter(e => e.category === c.name), mk) })).filter(x => x.v > 0);
  $('chartCard').style.display = byCat.length && window.Chart ? '' : 'none';
  if (homeChart) homeChart.destroy(); homeChart = null;
  if (byCat.length && window.Chart) homeChart = new Chart($('expenseChart'), { type: 'doughnut',
    data: { labels: byCat.map(x => x.c.emoji + ' ' + x.c.name), datasets: [{ data: byCat.map(x => Math.round(x.v / rate(currency) * 100) / 100), backgroundColor: PAL, borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'bottom', labels: { color: muted() } } } } });
}

function renderIncome() {
  const mk = monthKey();
  countTo($('incTotal'), sumIn(incomes, mk), money); $('incMonthName').textContent = monthName(mk);
  const list = [...incomes].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 60);
  $('incList').innerHTML = list.length ? list.map(e => `<li><div class="ico in">${svg('down')}</div><div class="meta"><b>${esc(e.note || t('income'))}</b><small>${fdate(e.date)}</small></div><div class="amt in">+${money(amt(e))}</div><div class="acts"><button data-a="idel" data-id="${esc(e.id)}">${svg('trash', 18)}</button></div></li>`).join('') : `<li class="plain">${empty('emptyInc', 'down')}</li>`;
}

function renderStats() {
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.p === period));
  $('statInsights').style.display = period === 'month' ? '' : 'none';
  if (statsChart) statsChart.destroy(); statsChart = null;
  const cards = $('statCards'), sl = $('statsList'), colors = { grid: muted() + '33', tick: muted() };
  let labels, data, type, list;
  if (period === 'month') {
    const mk = monthKey(), pk = addMonth(mk, -1);
    const I = sumIn(incomes, mk), Ip = sumIn(incomes, pk), E = sumIn(expenses, mk), Ep = sumIn(expenses, pk);
    const card = (lbl, cur, prev, goodUp) => {
      const d = cur - prev, cls = d === 0 ? '' : (d > 0) === goodUp ? 'good' : 'bad';
      return `<div class="stat"><small>${lbl}</small><b>${cur < 0 ? '−' : ''}${money(Math.abs(cur))}</b><div class="delta ${cls}">${pctText(pct(cur, prev))} · ${d < 0 ? '−' : '+'}${money(Math.abs(d))} ${prev === 0 ? '' : `<span>(${t('vsPrev')}: ${(prev < 0 ? '−' : '') + money(Math.abs(prev))})</span>`}</div></div>`;
    };
    $('statDate').textContent = `${monthName(mk)}  ←  ${monthName(pk)}`;
    cards.innerHTML = card('<i class="dot in"></i>' + t('income'), I, Ip, true) + card('<i class="dot out"></i>' + t('expense'), E, Ep, false) + card('<i class="dot bal"></i>' + t('balanceLbl'), I - E, Ip - Ep, true) +
      `<div class="stat"><small>${t('spentOfIncome')}</small><b>${I > 0 ? (E / I * 100).toFixed(0) + '%' : '—'}</b><div class="bar"><i class="${I > 0 && E > I ? 'bad' : ''}" style="width:${I > 0 ? Math.min(100, E / I * 100) : 0}%"></i></div></div>`;
    const now = new Date(), dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), avg = E / now.getDate(), fcast = avg * dim, late = now.getDate() >= 7;
    const byCat = {}, byDay = {};
    expenses.filter(e => (e.date || '').slice(0, 7) === mk).forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + amt(e); const w = new Date(e.date + 'T00:00').getDay(); byDay[w] = (byDay[w] || 0) + amt(e); });
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0], tc = top(byCat), td = top(byDay);
    const wd = w => WD[lang][Number(w)];
    $('statInsights').innerHTML = `<b>${t('insTitle')}</b>` + (E ? `<div>• ${t('insDaily')}: <b>${money(avg)}</b></div>${late ? `<div>• ${t('insForecast')}: <b>${money(fcast)}</b></div>` : `<div class="note">${t('insEarly')}</div>`}` + (I && late ? `<div>• ${t('insEndBal')}: <b>${I - fcast < 0 ? '−' : ''}${money(Math.abs(I - fcast))}</b></div>` : '') + `<div>• ${t('insTopCat')}: <b>${esc(tc[0])}</b> (${(tc[1] / E * 100).toFixed(0)}%)</div><div>• ${t('insTopDay')}: <b>${wd(td[0])}</b></div>` : `<div class="note">${t('noData')}</div>`);
    const keys = [-5, -4, -3, -2, -1, 0].map(n => addMonth(mk, n));
    labels = keys.map(k => monthName(k, { month: 'short' })); type = 'bar';
    data = [{ label: t('income'), data: keys.map(k => sumIn(incomes, k) / rate(currency)), backgroundColor: '#1fa97a', borderRadius: 6 }, { label: t('expense'), data: keys.map(k => sumIn(expenses, k) / rate(currency)), backgroundColor: '#e5584a', borderRadius: 6 }];
    list = expenses.filter(e => (e.date || '').slice(0, 7) === mk);
  } else {
    const n = period === 'week' ? 7 : 1, base = new Date();
    if (period === 'yesterday') base.setDate(base.getDate() - 1);
    const keys = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(base); d.setDate(d.getDate() - i); keys.push(iso(d)); }
    list = expenses.filter(e => keys.includes(e.date));
    const tot = list.reduce((s, e) => s + amt(e), 0);
    $('statDate').textContent = n === 1 ? fdate(keys[0]) : `${fdate(keys[0])} → ${fdate(keys[n - 1])}`;
    cards.innerHTML = `<div class="stat"><small><i class="dot out"></i>${t('expense')}</small><b>${money(tot)}</b></div>`;
    if (n === 7) { labels = keys.map(k => k.slice(5)); type = 'bar'; data = [{ label: t('expense'), data: keys.map(k => list.filter(e => e.date === k).reduce((s, e) => s + amt(e), 0) / rate(currency)), backgroundColor: '#e5584a', borderRadius: 6 }]; }
  }
  const rows = categories.map(c => ({ c, v: list.filter(e => e.category === c.name).reduce((s, e) => s + amt(e), 0) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const total = rows.reduce((s, x) => s + x.v, 0);
  if (!labels) { labels = rows.map(x => x.c.emoji + ' ' + x.c.name); type = 'doughnut'; data = [{ data: rows.map(x => x.v / rate(currency)), backgroundColor: PAL, borderWidth: 0 }]; }
  sl.innerHTML = `<b>${t('catShare')}</b>` + (rows.length ? rows.map(x => `<div class="share"><div class="row"><span>${esc(x.c.emoji)} ${esc(x.c.name)}</span><b>${money(x.v)} · ${(x.v / total * 100).toFixed(0)}%</b></div><div class="bar"><i style="width:${x.v / total * 100}%"></i></div></div>`).join('') : `<div class="note">${t('noData')}</div>`);
  if (window.Chart) statsChart = new Chart($('statsChart'), { type, data: { labels, datasets: data },
    options: { plugins: { legend: { display: type === 'doughnut' || data.length > 1, position: 'bottom', labels: { color: colors.tick } } },
      scales: type === 'bar' ? { x: { ticks: { color: colors.tick }, grid: { display: false } }, y: { ticks: { color: colors.tick }, grid: { color: colors.grid } } } : {} } });
}

function renderGoals() {
  $('goalList').innerHTML = goals.map((g, i) => {
    const p = Math.min(100, (g.current || 0) / (g.target || 1) * 100);
    return `<div class="goal"><div class="goal-top"><b>${p >= 100 ? '🎉 ' : ''}${esc(g.name)}</b><button data-a="gdel" data-i="${i}">${svg('trash', 18)}</button></div><div class="bar"><i style="width:${p}%"></i></div><div class="note">${num(g.current || 0)} / ${num(g.target)} ${sym(g.currency)} · ${p.toFixed(0)}%${p >= 100 ? ' — ' + t('goalDone') : ''}</div><div class="row"><input id="ga${i}" type="number" inputmode="decimal" placeholder="${t('addMoneyPh')}"><button class="btn sm" data-a="gadd" data-i="${i}">＋</button></div></div>`;
  }).join('') || empty('emptyGoal', 'target');
}

/* ---------- KATEGORIYANI AVTO-ANIQLASH ---------- */
// names — foydalanuvchi kategoriyasi nomida qidiriladigan bo'laklar; words — xarajat nomidagi kalit so'zlar
const AUTO = [
  { names: ['ovqat', 'oziq', 'taom', 'food', 'еда', 'питан', 'продукт'],
    words: ['kofe', 'coffee', 'choy', 'tea', 'non', 'osh', 'plov', 'lavash', 'burger', 'pitsa', 'pizza', 'kebab', 'shashlik', 'somsa', 'manti', 'ovqat', 'tushlik', 'nonushta', 'kechki', 'restoran', 'kafe', 'cafe', 'fastfood', 'lunch', 'dinner', 'breakfast', 'ichimlik', 'sok', 'cola', 'kola', 'fanta', 'shirinlik', 'tort', 'muzqaymoq', 'kofe', 'кофе', 'чай', 'хлеб', 'обед', 'ужин', 'завтрак', 'еда', 'пицца', 'бургер', 'ресторан', 'кафе', 'шашлык', 'самса', 'плов', 'лаваш', 'сок', 'кола', 'десерт'] },
  { names: ['transport', 'taksi', "yo'l", 'yol', 'avto', 'транспорт', 'такси', 'проезд'],
    words: ['taksi', 'taxi', 'yandex', 'bolt', 'indrive', 'uber', 'metro', 'avtobus', 'bus', 'benzin', "yoqilg'i", 'yoqilgi', 'parking', 'parkovka', 'mashina', 'avto', 'moyka', 'zapravka', "yo'l", 'yolkira', 'такси', 'метро', 'автобус', 'бензин', 'заправка', 'парковка', 'мойка', 'проезд', 'машина'] },
  { names: ['kommunal', 'uy', 'turar', 'коммун', 'жиль', 'дом'],
    words: ['svet', 'elektr', 'tok', 'gaz', 'internet', 'wifi', 'telefon', 'mobil', 'uzmobile', 'beeline', 'ucell', 'mobiuz', 'humans', 'arenda', 'ijara', 'kvartira', 'kommunal', 'chiqindi', 'isitish', 'rent', 'electricity', 'свет', 'электричество', 'газ', 'интернет', 'телефон', 'аренда', 'квартплата', 'коммуналка', 'коммунал', 'отопление'] },
  { names: ['bozor', 'shop', 'xarid', 'покуп', 'магаз', 'шоп'],
    words: ['bozor', 'bozorlik', 'market', 'korzinka', 'makro', 'magazin', "do'kon", 'dokon', 'kiyim', "ko'ylak", 'koylak', 'poyabzal', 'krossovka', 'kurtka', 'shim', 'supermarket', 'groceries', 'clothes', 'shopping', 'магазин', 'одежда', 'продукты', 'рынок', 'базар', 'обувь', 'куртка', 'кроссовки'] }
];
const norm = s => String(s || '').toLowerCase().replace(/[ʻʼ’‘`´]/g, "'").trim();
const wordsOf = s => norm(s).split(/[^a-z0-9а-яёқўғҳ']+/).filter(Boolean);
function guessCat(name) {
  const ws = wordsOf(name); if (!ws.length) return null;
  const key = norm(name);
  for (let i = expenses.length - 1; i >= 0; i--) {           // avval aynan shu nomdagi oxirgi xarajat
    if (norm(expenses[i].name) === key && categories.some(c => c.name === expenses[i].category)) return expenses[i].category;
  }
  for (const g of AUTO) {
    if (!ws.some(w => g.words.some(k => w === k || (k.length >= 4 && w.startsWith(k))))) continue;
    const c = categories.find(c => { const cn = norm(c.name); return g.names.some(n => cn.includes(n)); });
    if (c) return c.name;
  }
  return null;
}

/* ---------- AMALLAR ---------- */
function submitExpense() {
  const name = $('name').value.trim(), v = parseFloat($('amount').value), cur = $('itemCurrency').value;
  if (!name || !(v > 0)) return toast(t('fillAll'));
  const rec = { name, amountUZS: v * rate(cur), originalAmount: v, originalCurrency: cur, category: $('category').value, date: $('date').value || iso() };
  if (editId) { const e = expenses.find(x => String(x.id) === editId); if (e) Object.assign(e, rec); editId = null; }
  else { justAdded = uid(); expenses.push({ id: justAdded, ...rec, createdAt: new Date().toISOString() }); }
  catTouched = false; $('name').value = ''; $('amount').value = ''; $('addBtn').textContent = t('add'); closeSheet('addSheet');
  saveAll(); render();
  const c = categories.find(k => k.name === rec.category);
  if (c && c.limit > 0) { const p = sumIn(expenses.filter(e => e.category === c.name), monthKey()) / c.limit * 100; if (p >= 80) toast(`${c.emoji} ${c.name}: ${p.toFixed(0)}% ${t('ofLimit')}`); }
}
function quickAdd() {
  const m = $('quick').value.trim().match(/^(.+?)\s+(\d[\d\s.,]*)\s*(k|m|ming|mln|тыс|млн)?$/i);
  if (!m) return toast(t('fillAll'));
  const mult = { k: 1e3, ming: 1e3, 'тыс': 1e3, m: 1e6, mln: 1e6, 'млн': 1e6 }[(m[3] || '').toLowerCase()] || 1;
  $('name').value = m[1]; $('amount').value = parseFloat(m[2].replace(/\s/g, '').replace(',', '.')) * mult;
  const g = guessCat(m[1]); if (g) $('category').value = g;
  $('quick').value = ''; submitExpense();
}
function runRecurring() {
  const mk = monthKey(), today = new Date().getDate(); let n = 0;
  recurring.forEach(r => { if (r.last !== mk && today >= r.day) { expenses.push({ id: uid(), name: r.name, amountUZS: r.amountUZS, originalAmount: r.amountUZS, originalCurrency: 'UZS', category: r.category, date: `${mk}-${String(r.day).padStart(2, '0')}`, createdAt: new Date().toISOString() }); r.last = mk; n++; } });
  if (n) { saveAll(); toast(`${n} ${t('recAdded')}`); }
}
function renderSettings() {
  renderAccount();
  $('recList').innerHTML = recurring.map((r, i) => `<li><div class="ico">${svg('repeat')}</div><div class="meta"><b>${esc(r.name)}</b><small>${esc(r.category)} · ${r.day}</small></div><div class="amt">${money(r.amountUZS)}</div><div class="acts"><button data-i="${i}">${svg('trash', 18)}</button></div></li>`).join('');
}
function renderCatMgr() {
  $('catMgrList').innerHTML = categories.map((c, i) => `<div class="row" data-i="${i}"><input class="ce" value="${esc(c.emoji)}" maxlength="4" style="width:60px"><input class="cn" value="${esc(c.name)}"><input class="cl" type="number" inputmode="decimal" value="${c.limit || ''}" placeholder="${t('limitPh')}"><button class="icon-btn">${svg('trash', 18)}</button></div>`).join('');
}
function delExpense(id) {
  const i = expenses.findIndex(x => String(x.id) === id); if (i < 0) return;
  trash.unshift(expenses.splice(i, 1)[0]); saveAll(); render(); toast(t('deleted'), () => restore(id));
}
function restore(id) {
  const i = trash.findIndex(x => String(x.id) === id); if (i < 0) return;
  expenses.push(trash.splice(i, 1)[0]); saveAll(); render(); if ($('trashModal').classList.contains('on')) renderTrash();
}
function renderTrash() {
  $('trashList').innerHTML = trash.length ? trash.map(e => `<div class="trash-row"><div><b>${esc(e.name)}</b><div class="note">${fdate(e.date)} · ${money(amt(e))}</div></div><div><button data-a="trs" data-id="${esc(e.id)}">${t('restore')}</button><button class="del" data-a="trd" data-id="${esc(e.id)}">${t('delPerm')}</button></div></div>`).join('') : `<div class="note">${t('trashEmpty')}</div>`;
}
function startEdit(id) {
  const e = expenses.find(x => String(x.id) === id); if (!e) return;
  editId = id; $('name').value = e.name; $('amount').value = e.originalAmount ?? Math.round(amt(e)); $('itemCurrency').value = e.originalCurrency || 'UZS';
  $('category').value = e.category; $('date').value = e.date; $('addBtn').textContent = t('update'); openSheet('addSheet');
}
function submitIncome() {
  const v = parseFloat($('incAmount').value), cur = $('incCurrency').value;
  if (!(v > 0)) return toast(t('fillAll'));
  incomes.push({ id: uid(), amountUZS: v * rate(cur), originalAmount: v, originalCurrency: cur, note: $('incNote').value.trim(), date: $('incDate').value || iso() });
  $('incAmount').value = ''; $('incNote').value = ''; saveAll(); render();
}
function csvCell(v) { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
function importData(text) {
  let d; try { d = JSON.parse(text); } catch { return alert(t('badFile')); }
  if (!d || !Array.isArray(d.expenses)) return alert(t('badFile'));
  const clean = (x, isInc) => { if (!x || !isFinite(amt(x))) return null; const base = { ...x, id: String(x.id || uid()), amountUZS: amt(x), date: String(x.date || iso()).slice(0, 10) };
    return isInc ? { ...base, note: String(x.note || x.name || '') } : { ...base, name: String(x.name || '—'), category: String(x.category || categories[0].name) }; };
  const ex = d.expenses.filter(x => x && x.type !== 'income').map(x => clean(x, false)).filter(Boolean);
  const inc = [...(d.incomes || []), ...d.expenses.filter(x => x && x.type === 'income')].map(x => clean(x, true)).filter(Boolean);
  const replace = !confirm(`${ex.length + inc.length} ${t('importFound')}\n\n${t('importAsk')}`);
  if (replace && !confirm(t('importSure'))) return;
  if (replace) { expenses = ex; incomes = inc; if (Array.isArray(d.goals)) goals = d.goals; }
  else { const merge = (a, b) => { const ids = new Set(a.map(x => String(x.id))); b.forEach(x => { if (!ids.has(x.id)) a.push(x); }); }; merge(expenses, ex); merge(incomes, inc); }
  (d.categories || []).forEach(c => { if (c && c.name && !categories.some(k => k.name === c.name)) categories.push({ name: String(c.name), emoji: String(c.emoji || '📦') }); });
  expenses.forEach(e => { if (!categories.some(k => k.name === e.category)) categories.push({ name: e.category, emoji: '📦' }); });
  saveAll(); renderCats(); render(); toast(t('imported'));
}

/* ---------- PIN ---------- */
async function sha(s) { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('xh:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch { return 'p:' + s; } }
async function askPin() {
  const old = localStorage.getItem(K.oldPin); if (old) { put(K.pin, await sha(old)); localStorage.removeItem(K.oldPin); }
  const saved = localStorage.getItem(K.pin); if (!saved) return;
  const input = $('pinModalInput'), err = $('pinError'); openSheet('pinModal'); input.focus();
  return new Promise(resolve => {
    const submit = async () => {
      if (await sha(input.value) === saved) { put(K.tries, '0'); closeSheet('pinModal'); input.value = ''; return resolve(); }
      const n = Number(raw(K.tries, 0)) + 1; put(K.tries, String(n)); input.value = '';
      if (n >= 10) { if (confirm(t('wipe'))) { localStorage.clear(); location.reload(); } else err.textContent = t('blocked'); return; }
      err.textContent = `${t('wrongPin')}: ${10 - n}`;
    };
    $('pinSubmitBtn').onclick = submit; input.onkeydown = e => { if (e.key === 'Enter') submit(); };
  });
}

/* ---------- TIL / MAVZU / NAVIGATSIYA ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  const pl = $('privLink'); if (pl) pl.href = 'privacy.html?lang=' + lang;
  $('addBtn').textContent = t(editId ? 'update' : 'add');
  renderCats(); render();
}
function applyTheme() { document.documentElement.dataset.theme = theme; $('themeSwitch').innerHTML = svg(theme === 'dark' ? 'sun' : 'moon'); }
function show(p) {
  page = p;
  $$('.page').forEach(x => x.classList.toggle('active', x.id === 'page-' + p));
  $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.page === p));
  render(); window.scrollTo(0, 0);
}

/* ---------- HODISALAR ---------- */
function bind() {
  $('quickBtn').onclick = quickAdd; $('quick').onkeydown = e => { if (e.key === 'Enter') quickAdd(); };
  $('manageCatBtn').onclick = () => { renderCatMgr(); openSheet('catMgr'); }; $('closeCatMgr').onclick = () => closeSheet('catMgr');
  $('catMgrList').onclick = e => { const b = e.target.closest('button'); if (b && confirm(t('confirmDel'))) b.parentElement.remove(); };
  $('saveCatMgrBtn').onclick = () => {
    const next = [...$('catMgrList').children].map(r => { const old = categories[Number(r.dataset.i)]; return { old: old.name, name: r.querySelector('.cn').value.trim() || old.name, emoji: r.querySelector('.ce').value.trim() || '📦', limit: Number(r.querySelector('.cl').value) || 0 }; });
    if (!next.length) return toast(t('fillAll'));
    if (new Set(next.map(c => c.name.toLowerCase())).size !== next.length) return toast(t('catExists'));
    next.forEach(c => { if (c.old !== c.name) [...expenses, ...trash, ...recurring].forEach(e => { if (e.category === c.old) e.category = c.name; }); });
    categories = next.map(({ name, emoji, limit }) => ({ name, emoji, limit }));
    saveAll(); renderCats(); render(); closeSheet('catMgr');
  };
  $('addRecBtn').onclick = () => {
    const name = $('recName').value.trim(), v = parseFloat($('recAmount').value), day = Math.min(28, Math.max(1, parseInt($('recDay').value) || 1));
    if (!name || !(v > 0)) return toast(t('fillAll'));
    recurring.push({ id: uid(), name, amountUZS: v * rate($('recCur').value), category: $('recCat').value, day, last: new Date().getDate() >= day ? monthKey() : '' });
    $('recName').value = ''; $('recAmount').value = ''; $('recDay').value = ''; saveAll(); renderSettings();
  };
  $('recList').onclick = e => { const b = e.target.closest('button'); if (b && confirm(t('confirmDel'))) { recurring.splice(Number(b.dataset.i), 1); saveAll(); renderSettings(); } };
  $('addBtn').onclick = submitExpense; $('addIncBtn').onclick = submitIncome;
  $('category').onchange = () => { catTouched = true; };
  $('name').oninput = () => { if (editId || catTouched) return; const g = guessCat($('name').value); if (g) $('category').value = g; };
  $('search').oninput = renderHome; $('filterCategory').onchange = renderHome;
  $('currencySwitch').onchange = e => { currency = e.target.value; put(K.cur, currency); render(); };
  $('themeSwitch').onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; put(K.theme, theme); applyTheme(); render(); };
  $('settingsBtn').onclick = () => show('settings');
  $('acctBody').onclick = e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
    if (a === 'in') signIn(); else if (a === 'sync') sync('full'); else if (a === 'out' && confirm(t('signOutAsk'))) S.auth.signOut();
    else if (a === 'del') { S.del = true; renderAccount(); } else if (a === 'delno') { S.del = false; renderAccount(); } else if (a === 'delgo') deleteAccount(); };
  const openAdd = () => {
    if (editId) { editId = null; $('name').value = ''; $('amount').value = ''; }
    catTouched = false; $('addBtn').textContent = t('add'); openSheet('addSheet');
    if (matchMedia('(pointer: fine)').matches) $('quick').focus();
  };
  $$('.nav button').forEach(b => b.onclick = () => b.dataset.page ? show(b.dataset.page) : openAdd());
  $$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o && o.id !== 'pinModal') o.classList.remove('on'); }));
  $$('.tabs button').forEach(b => b.onclick = () => { period = b.dataset.p; renderStats(); });
  $('menuBtn').onclick = e => { e.stopPropagation(); $('dropdownMenu').classList.toggle('on'); };
  document.addEventListener('click', () => $('dropdownMenu').classList.remove('on'));
  $$('[data-lang]').forEach(b => b.onclick = () => { lang = b.dataset.lang; put(K.lang, lang); applyLang(); });
  $('aboutBtn').onclick = () => openSheet('aboutModal'); $('closeAboutBtn').onclick = () => closeSheet('aboutModal');
  $('limitToggle').onchange = e => { limitOn = e.target.checked; put(K.limOn, String(limitOn)); touchMeta(); renderHome(); };
  $('limitSaveBtn').onclick = () => { limit = Math.max(0, Number($('limitInput').value) || 0); put(K.lim, String(limit)); touchMeta(); renderHome(); toast(t('limitSaved')); };
  $('addCatBtn').onclick = () => openSheet('catModal'); $('closeCatModal').onclick = () => closeSheet('catModal');
  $('saveCatBtn').onclick = () => {
    const name = $('newCatName').value.trim(); if (!name) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return toast(t('catExists'));
    categories.push({ name, emoji: $('newCatEmoji').value.trim() || '📦' }); saveAll(); $('newCatName').value = ''; $('newCatEmoji').value = '';
    renderCats(); $('category').value = name; closeSheet('catModal');
  };
  $('list').onclick = e => { const b = e.target.closest('button'); if (!b) return; b.dataset.a === 'edit' ? startEdit(b.dataset.id) : delExpense(b.dataset.id); };
  $('incList').onclick = e => { const b = e.target.closest('button'); if (b && confirm(t('confirmDel'))) { incomes = incomes.filter(x => String(x.id) !== b.dataset.id); saveAll(); render(); } };
  $('trashBtn').onclick = () => { renderTrash(); openSheet('trashModal'); }; $('closeTrashBtn').onclick = () => closeSheet('trashModal');
  $('trashList').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'trs') restore(b.dataset.id); else { trash = trash.filter(x => String(x.id) !== b.dataset.id); saveAll(); renderTrash(); } };
  $('emptyTrashBtn').onclick = () => { if (trash.length && confirm(t('confirmEmpty'))) { trash = []; saveAll(); renderTrash(); } };
  $('exportJsonBtn').onclick = () => { put('last_backup', iso()); download('xarajat-' + iso() + '.json', JSON.stringify({ expenses, incomes, categories, goals, recurring }, null, 2), 'application/json'); };
  $('exportCsvBtn').onclick = () => {
    const rows = [['type', 'name', 'category', 'date', 'amountUZS']].concat(expenses.map(e => ['expense', e.name, e.category, e.date, amt(e)]), incomes.map(e => ['income', e.note, '', e.date, amt(e)]));
    download('xarajat-' + iso() + '.csv', '\ufeff' + rows.map(r => r.map(csvCell).join(',')).join('\n'), 'text/csv');
  };
  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const r = new FileReader(); r.onload = () => importData(r.result); r.readAsText(f); };
  $('savePinBtn').onclick = async () => { const p = $('pinInput').value.trim(); if (!/^\d{4,8}$/.test(p)) return toast(t('pinBad')); put(K.pin, await sha(p)); $('pinInput').value = ''; toast(t('pinSaved')); };
  $('removePinBtn').onclick = () => { localStorage.removeItem(K.pin); toast(t('pinRemoved')); };
  $('addGoalBtn').onclick = () => {
    const name = $('goalName').value.trim(), target = parseFloat($('goalTarget').value);
    if (!name || !(target > 0)) return toast(t('fillAll'));
    goals.push({ name, target, current: 0, currency: $('goalCurrency').value }); $('goalName').value = ''; $('goalTarget').value = ''; saveAll(); renderGoals();
  };
  $('goalList').onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const i = Number(b.dataset.i);
    if (b.dataset.a === 'gdel') { if (confirm(t('confirmDel'))) goals.splice(i, 1); }
    else { const v = parseFloat($('ga' + i).value); if (!(v > 0)) return; goals[i].current = (goals[i].current || 0) + v; }
    saveAll(); renderGoals();
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.overlay.on').forEach(o => { if (o.id !== 'pinModal') o.classList.remove('on'); }); });
}

/* ---------- BOSHLASH ---------- */
(async () => {
  bind();
  $('currencySwitch').value = currency; $('limitToggle').checked = limitOn; $('limitInput').value = limit || '';
  $('date').value = iso(); $('incDate').value = iso();
  $$('[data-ic]').forEach(el => { el.innerHTML = svg(el.dataset.ic); });
  runRecurring(); applyTheme(); applyLang();
  initCloud();
  setTimeout(() => $('splash').classList.add('hide'), 1600);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('service-worker.js').catch(() => {});
  await askPin();
  const lb = raw('last_backup', '');
  if (expenses.length >= 5 && raw('backup_nag', '') !== iso() && (!lb || (Date.now() - new Date(lb)) / 864e5 > 14)) {
    put('backup_nag', iso()); setTimeout(() => toast(t('backupDue'), () => $('exportJsonBtn').click(), t('backupBtn')), 2500);
  }
})();
})();
