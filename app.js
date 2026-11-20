/* ============ НАСТРОЙКИ ============
   ВАЖНО: цены дублируются в api/order.js — меняйте в обоих местах. */
const CONFIG = {
  prepay: 100,                    // сумма оплаты при заказе, ₽ (на сервере задаётся переменной PREPAY_RUB)
  courierPrice: null,             // цена курьера пока неизвестна: null = «уточним». Когда узнаете — впишите число, напр. 300
  products: [
    { id:'tshirt', name:'T-SHIRT Black STATUE OF LIBERTY', category:'Футболка', price:2500,
      desc:'Плотная чёрная футболка премиального кроя. Спереди — эмблема Statue of Liberty, на спине — графика FLATIX. Принт не выцветает после стирок.',
      images:['assets/products/tshirt-1.jpg','assets/products/tshirt-2.jpg','assets/products/tshirt-3.jpg','assets/products/tshirt-4.jpg','assets/products/tshirt-7.jpg','assets/products/tshirt-8.jpg','assets/products/tshirt-6.jpg'] },
    { id:'hoodie', name:'ZIP-HOODIE', category:'Зип-худи', price:3500,
      desc:'Зип-худи на длинной молнии до капюшона. Лого на груди, на спине — принт-цикл: Work, Train, Study, Love, Sleep, Eat. Мягкий плотный материал.',
      images:['assets/products/hoodie-1.jpg','assets/products/hoodie-2.jpg','assets/products/hoodie-3.jpg','assets/products/hoodie-6.jpg','assets/products/hoodie-7.jpg','assets/products/tshirt-6.jpg'] }
  ]
};
/* Ссылки на сообщество — впишите свои */
const LINKS = {
  telegram: 'https://t.me/+CCCYN3qwMWQ1NmEy',  // VIP-чат Telegram
  twitch:   'https://www.twitch.tv/forzi_1',   // канал Twitch
  channel:  'https://t.me/+3fSt3ktcRyJmOTFi'   // Telegram-канал
};
document.querySelectorAll('[data-link]').forEach(a => a.href = LINKS[a.dataset.link]);

const $ = (s, r=document) => r.querySelector(s);
const fmt = n => n.toLocaleString('ru-RU').replace(/\u00A0/g,' ') + ' ₽';
const numFmt = n => n.toLocaleString('ru-RU').replace(/\u00A0/g,' ');
const priceHtml = n => `<span class="num">${numFmt(n)}</span><span class="cur">₽</span>`;   // цена: крупные цифры + знак ₽
// Если картинки нет — скрываем её, остаётся чёрный фон
const imgFallback = img => { img.onerror = () => { img.onerror=null; img.style.visibility='hidden'; }; };

/* ============ ЛОГОТИП (если нет logo.png — текст готическим шрифтом) ============ */
$('#logoImg').onerror = () => { $('#logoImg').hidden = true; $('#logoText').hidden = false; };

/* ============ ФЕНИКС: летает за курсором / пальцем ============ */
(function phoenix(){
  const el = $('#phoenix'), hero = $('#hero');
  imgFallback($('#phoenixImg'));
  let x=0, y=0, tx=0, ty=0, rot=0, active=false, t0=performance.now();
  // цель = позиция курсора относительно центра феникса (в координатах hero)
  function setTarget(e){
    const r = hero.getBoundingClientRect();
    const hx = r.left + r.width/2, hy = r.top + r.height*0.62;      // базовая точка феникса
    const lim = el.offsetWidth*.5;
    tx = Math.max(-r.width/2+lim, Math.min(r.width/2-lim, e.clientX - hx));
    ty = Math.max(-r.height*.35, Math.min(r.height*.3, e.clientY - hy));
    active = true;
  }
  hero.addEventListener('pointermove', setTarget);
  hero.addEventListener('pointerdown', setTarget);
  hero.addEventListener('pointerleave', () => { active = false; });
  (function loop(now){
    const t = (now - t0)/1000;
    if (!active){ tx += (0 - tx)*.02; ty += (0 - ty)*.02; }          // нет курсора — плавно парит на месте
    const px = x, py = y;
    x += (tx - x)*.07; y += (ty - y)*.07;                              // плавное следование
    const vx = x - px;
    rot += (Math.max(-25,Math.min(25,vx*3)) - rot)*.12;               // наклон по направлению полёта
    const fy = Math.sin(t*1.6)*8;                                      // лёгкое парение
    el.style.transform = `translate(${x}px,${y+fy}px) rotate(${rot}deg)`;
    el.classList.toggle('fast', Math.abs(vx) > 1.2);                   // быстрее машет крыльями
    requestAnimationFrame(loop);
  })(t0);
})();

/* ============ КАТАЛОГ ============ */
const grid = $('#grid');
// Проверяем, какие фото реально существуют: для отсутствующих миниатюры не создаются совсем
const probe = src => new Promise(res => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = src; });
const existing = list => Promise.all(list.map(probe)).then(ok => list.filter((_, i) => ok[i]));

CONFIG.products.forEach(p => {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="main-img" title="Нажмите, чтобы приблизить"><img alt="${p.name}" hidden></div>
    <div class="thumbs" hidden></div>
    <div class="info">
      <h3>${p.name}</h3><div class="price">${priceHtml(p.price)}</div><p class="desc">${p.desc}</p>
      <div class="sizes">${['S','M','L','XL'].map(s=>`<button data-s="${s}" class="${s==='M'?'on':''}">${s}</button>`).join('')}</div>
      <button class="btn btn-gold order-btn"><span>Заказать</span></button>
    </div>`;
  grid.appendChild(card);
  const big = card.querySelector('.main-img img'), thumbs = card.querySelector('.thumbs');
  let size = 'M', imgs = [], idx = 0;
  existing(p.images).then(list => {
    imgs = list; if (!list.length) { card.querySelector('.main-img').hidden = true; return; }
    big.src = list[0]; big.hidden = false;
    if (list.length > 1) {                                       // миниатюры — только для реально загруженных фото
      thumbs.innerHTML = list.map((s,i)=>`<button class="${i?'':'on'}" data-i="${i}" aria-label="Фото ${i+1}"><img src="${s}" alt=""></button>`).join('');
      thumbs.hidden = false;
    }
  });
  thumbs.onclick = e => {                                         // галерея
    const b = e.target.closest('button'); if(!b) return; idx = +b.dataset.i;
    big.style.opacity = 0;                                        // плавная смена фото
    setTimeout(() => { big.src = imgs[idx]; big.style.opacity = 1; }, 180);
    thumbs.querySelectorAll('button').forEach(t => t.classList.toggle('on', t===b));
  };
  card.querySelector('.main-img').onclick = () => imgs.length && openLightbox(imgs, idx);   // клик — приблизить и осмотреть
  card.querySelector('.sizes').onclick = e => {                   // выбор размера
    const b = e.target.closest('button'); if(!b) return; size = b.dataset.s;
    card.querySelectorAll('.sizes button').forEach(t => t.classList.toggle('on', t===b));
  };
  card.querySelector('.info .btn').onclick = () => openOrder(p, size);
});
// Карточка «Скоро» — без кнопки заказа
grid.insertAdjacentHTML('beforeend',
  `<article class="card soon"><div class="stage"><canvas class="morph-cv" id="morph" role="img" aria-label="Скоро: новая вещь"></canvas></div><p class="soon-title">Скоро выйдет</p></article>`);
initMorph(document.getElementById('morph'));

/* ============ ЗАКАЗ ============ */
const modal = $('#modal'), form = $('#orderForm');
let cur = null, qty = 1, sending = false;

let closeTimer = null;
function openOrder(p, size){
  clearTimeout(closeTimer); modal.classList.remove('closing','status'); stampEl.classList.remove('go','off');
  cur = p; qty = 1; sending = false;
  rcDate = new Date().toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',','');
  form.reset(); form.hidden = false; $('#success').hidden = true; $('#formError').hidden = true;
  form.size.value = size; $('#qty').textContent = 1;
  $('#orderTitle').textContent = p.name;
  $('#courierPrice').textContent = CONFIG.courierPrice==null ? 'уточним' : fmt(CONFIG.courierPrice);
  $('#submitBtn').disabled = false; $('#submitBtn').textContent = 'Оплатить ' + fmt(CONFIG.prepay);
  form.querySelectorAll('.bad').forEach(i => i.classList.remove('bad'));
  calc(); modal.hidden = false; document.body.style.overflow = 'hidden';
  playReceipt();                                                  // чек появляется вместе с формой
}
function closeOrder(){
  if (modal.hidden || modal.classList.contains('closing')) return;
  modal.classList.add('closing');                                 // чек сворачивается обратно, окно плавно гаснет
  closeTimer = setTimeout(() => { modal.hidden = true; modal.classList.remove('closing','status'); document.body.style.overflow = ''; }, 520);
}
$('#closeBtn').onclick = $('#doneBtn').onclick = closeOrder;
modal.addEventListener('pointerdown', e => { if (e.target === modal) closeOrder(); });
document.addEventListener('keydown', e => { if (e.key==='Escape' && !modal.hidden) closeOrder(); });

// Подсчёт: цена × количество + доставка = ИТОГО
function calc(){
  const courier = form.delivery.value === 'courier', unk = courier && CONFIG.courierPrice==null;
  const del = courier ? (CONFIG.courierPrice||0) : 0, item = cur.price*qty;
  $('#sItem').textContent = `${fmt(cur.price)} × ${qty} = ${fmt(item)}`;
  $('#sDel').textContent = unk ? 'уточним' : fmt(del); $('#sTotal').textContent = fmt(item+del) + (unk ? ' + доставка' : '');
  $('#sPay').textContent = fmt(CONFIG.prepay);
  renderReceipt(unk, del, item);                                  // чек берёт данные из текущего заказа
}
form.size.addEventListener('change', calc);                       // смена размера обновляет чек
form.querySelectorAll('.qty button').forEach(b => b.onclick = () => {
  qty = Math.min(20, Math.max(1, qty + +b.dataset.q)); $('#qty').textContent = qty; calc();
});
form.querySelectorAll('[name=delivery]').forEach(r => r.onchange = calc);

// Маска телефона: по умолчанию +7 (XXX) XXX-XX-XX; если начать с +998 — формат Узбекистана
form.phone.addEventListener('input', () => {
  const raw = form.phone.value, uz = raw.startsWith('+998');
  let d = raw.replace(/\D/g,'');
  if (uz){ d = d.slice(3,12); form.phone.value = '+998' + (d ? ' (' + d.slice(0,2) : '') + (d.length>=2 ? ')' : '') + (d.length>2 ? ' ' + d.slice(2,5) : '') + (d.length>5 ? '-' + d.slice(5,7) : '') + (d.length>7 ? '-' + d.slice(7,9) : ''); return; }
  if (d[0]==='7' || d[0]==='8') d = d.slice(1);
  d = d.slice(0,10);
  form.phone.value = d ? '+7 (' + d.slice(0,3) + (d.length>=3 ? ')' : '') + (d.length>3 ? ' ' + d.slice(3,6) : '') + (d.length>6 ? '-' + d.slice(6,8) : '') + (d.length>8 ? '-' + d.slice(8,10) : '') : '';
});
form.addEventListener('input', e => e.target.classList.remove('bad'));

const normTg = v => v.trim().replace(/^(https?:\/\/)?(t\.me\/|telegram\.me\/)/i,'').replace(/^@/,'');
function validate(){
  let ok = true;
  [['name',2],['city',2],['address',5]].forEach(([n,min]) => {
    const bad = form[n].value.trim().length < min; form[n].classList.toggle('bad', bad); ok = ok && !bad;
  });
  const d = form.phone.value.replace(/\D/g,'');
  const badP = !(d.length===11 && d[0]==='7') && !(d.length===12 && d.startsWith('998'));
  form.phone.classList.toggle('bad', badP);
  const badT = !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(normTg(form.tg.value));       // юзернейм Telegram: 5–32 символа, латиница/цифры/_
  form.tg.classList.toggle('bad', badT);
  return ok && !badP && !badT;
}

/* ============ ПЕЧАТЬ: после нажатия «Оплатить» золотая печать ставится в правый нижний угол формы ============ */
const stampEl = $('#stamp'), compose = document.querySelector('.compose');
const wait = ms => new Promise(r => setTimeout(r, ms));
function playStamp(){
  stampEl.classList.remove('go','off'); void stampEl.offsetWidth; stampEl.classList.add('go');
  setTimeout(() => { compose.classList.add('thud'); setTimeout(() => compose.classList.remove('thud'), 360); }, 540);   // «удар» в момент касания
}
function clearStamp(){
  if (!stampEl.classList.contains('go')) return;
  stampEl.classList.add('off'); setTimeout(() => stampEl.classList.remove('go','off'), 380);
}
window.addEventListener('pageshow', e => {                          // вернулись кнопкой «назад» со страницы оплаты
  if (e.persisted){ clearStamp(); sending = false; const b = $('#submitBtn'); b.disabled = false; b.textContent = 'Оплатить ' + fmt(CONFIG.prepay); }
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (sending) return;                                   // защита от двойной отправки
  const err = $('#formError');
  if (!validate()){ err.textContent = 'Заполните выделенные поля правильно.'; err.hidden = false; return; }
  err.hidden = true; sending = true;
  const btn = $('#submitBtn'); btn.disabled = true; btn.textContent = 'Переходим к оплате…';
  const t0 = performance.now(); playStamp();                          // печать начинает падать сразу
  try {
    const r = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        product: cur.id, size: form.size.value, qty, delivery: form.delivery.value,
        name: form.name.value.trim(), phone: form.phone.value, tg: '@' + normTg(form.tg.value), city: form.city.value.trim(),
        address: form.address.value.trim(), comment: form.comment.value.trim(), website: form.website.value
      }) });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data.error || 'Ошибка отправки');
    // Переходим на страницу оплаты. Номер платежа запоминаем, чтобы после возврата проверить статус.
    try { sessionStorage.setItem('forzi_pay', JSON.stringify({ paymentId: data.paymentId, orderId: data.orderId })); } catch {}
    await wait(Math.max(0, 1500 - (performance.now() - t0)));          // даём печати красиво «лечь» перед переходом
    location.href = data.confirmationUrl;
    return;
  } catch (ex) {
    clearStamp();                                                      // не получилось — печать аккуратно исчезает
    err.textContent = ex.message + '. Попробуйте ещё раз.'; err.hidden = false;
    sending = false; btn.disabled = false;
  } finally { if (!sending) btn.textContent = 'Оплатить ' + fmt(CONFIG.prepay); }
});

/* ============ ЧЕК: декоративная сводка заказа (не платёжный документ) ============
   Сначала появляется свёрнутый рулончик, затем бумага разворачивается. Данные берутся из текущего заказа. */
const RC_TPL = `
  <div class="rc-roll"><span class="rc-cap"></span></div>
  <div class="rc-reveal">
    <div class="rc-paper"><div class="rc-in">
      <div class="rc-logo">FORZI</div>
      <div class="rc-tag">ORDER SUMMARY</div>
      <div class="rc-dash"></div>
      <div class="rc-item"><b data-rc="name"></b><span data-rc="cat"></span></div>
      <div class="rc-row"><span>Size</span><b data-rc="size"></b></div>
      <div class="rc-row"><span>Price</span><b data-rc="price"></b></div>
      <div class="rc-row"><span>Qty</span><b data-rc="qty"></b></div>
      <div class="rc-row"><span>Delivery</span><b data-rc="del"></b></div>
      <div class="rc-dash"></div>
      <div class="rc-row rc-total"><span>Total</span><b data-rc="total"></b></div>
      <div class="rc-dash"></div>
      <div class="rc-row"><span>Date</span><b data-rc="date"></b></div>
      <div class="rc-row"><span>Order №</span><b data-rc="no">—</b></div>
      <div class="rc-bars"></div>
      <p class="rc-foot">Сводка заказа, не платёжный документ. Номер заказа присваивается после оформления.</p>
      <p class="rc-brand">✦ FORZI SHOP ✦</p>
    </div></div>
    <div class="rc-lip"></div>
  </div>`;
const rcEls = [...document.querySelectorAll('[data-receipt]')];
const rcReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let rcDate = '';
// зубчатый нижний край бумаги, как у настоящего чека
const RC_ZZ = (() => { const n = 22, t = 7, pts = ['0 0', '100% 0', `100% calc(100% - ${t}px)`];
  for (let i = n; i >= 0; i--) pts.push(`${(i/n*100).toFixed(2)}% ${i % 2 ? `calc(100% - ${t}px)` : '100%'}`);
  return `polygon(${pts.join(',')})`; })();
rcEls.forEach(el => {
  el.innerHTML = RC_TPL; el.querySelector('.rc-paper').style.clipPath = RC_ZZ;
  [...el.querySelectorAll('.rc-in > *')].forEach((n, i) => n.style.setProperty('--i', i));       // строки «печатаются» по очереди
  el.querySelector('.rc-reveal').addEventListener('animationend', e => {
    if (e.animationName === 'rcReveal' && !el.classList.contains('closing')) el.classList.add('done');
  });
});
function renderReceipt(unk, del, item){
  const set = (k, v) => rcEls.forEach(el => { const n = el.querySelector(`[data-rc="${k}"]`); if (n) n.textContent = v; });
  set('name', cur.name); set('cat', cur.category || ''); set('size', form.size.value); set('price', fmt(cur.price));
  set('qty', '× ' + qty); set('del', unk ? 'уточним' : fmt(del)); set('total', fmt(item + del) + (unk ? ' + дост.' : '')); set('date', rcDate);
}
function playReceipt(){
  rcEls.forEach(el => {
    clearTimeout(el._ac); el.classList.remove('go', 'done', 'closing', 'collapsed'); el.style.minHeight = '';
    const rev = el.querySelector('.rc-reveal'); rev.style.height = '';
    if (getComputedStyle(el).display === 'none') return;                      // скрытый вариант (ПК/телефон) не анимируем
    const h = el.querySelector('.rc-paper').offsetHeight;
    el.style.setProperty('--h', h + 'px'); el.style.setProperty('--rch', (42 + h - 9) + 'px');   // место под чек резервируем сразу, форма не «прыгает»
    if (rcReduce){ el.classList.add('done'); return; }
    void el.offsetWidth; el.classList.add('go');
  });
}
// на телефоне чек после показа сам сворачивается в рулончик (не мешает форме); нажатие на рулончик разворачивает его снова
function setRcCollapsed(el, on){
  const rev = el.querySelector('.rc-reveal');
  if (!el.classList.contains('done')) return;
  if (on && !el.classList.contains('collapsed')){ rev.style.height = rev.offsetHeight + 'px'; void rev.offsetHeight; el.classList.add('collapsed'); }
  else if (!on && el.classList.contains('collapsed')){ el.classList.remove('collapsed'); setTimeout(() => { rev.style.height = ''; }, 520); }
}
const rcMob = document.querySelector('.rc-mob');
rcMob.querySelector('.rc-roll').addEventListener('click', () => { clearTimeout(rcMob._ac); setRcCollapsed(rcMob, !rcMob.classList.contains('collapsed')); });
rcMob.querySelector('.rc-reveal').addEventListener('animationend', e => {
  if (e.animationName === 'rcReveal' && !rcMob.classList.contains('closing')) rcMob._ac = setTimeout(() => setRcCollapsed(rcMob, true), 4500);
});

/* ============ ВОЗВРАТ ПОСЛЕ ОПЛАТЫ: проверяем статус платежа ============ */
function showStatus(kind, orderId){
  const T = {
    wait: ['…', 'Проверяем оплату', 'Это займёт несколько секунд.'],
    ok:   ['✓', 'Спасибо!', 'Оплата получена. Мы скоро свяжемся с вами.'],
    fail: ['!', 'Оплата не прошла', 'Деньги не списаны. Попробуйте оформить заказ ещё раз.'],
    late: ['…', 'Оплата обрабатывается', 'Если деньги списались, заказ придёт к нам автоматически и мы свяжемся с вами.']
  }[kind];
  $('#okIcon').textContent = T[0]; $('#okTitle').textContent = T[1]; $('#okText').textContent = T[2];
  $('#orderNum').textContent = orderId && kind === 'ok' ? `Заказ № ${orderId}` : '';
  form.hidden = true; $('#success').hidden = false; modal.classList.add('status'); modal.hidden = false; document.body.style.overflow = 'hidden';
}
(function checkReturn(){
  if (!new URLSearchParams(location.search).has('paid')) return;
  history.replaceState(null, '', location.pathname);                    // убираем параметр из адреса
  let saved = null; try { saved = JSON.parse(sessionStorage.getItem('forzi_pay') || 'null'); } catch {}
  if (!saved || !saved.paymentId) return;
  showStatus('wait');
  let tries = 0;
  const poll = async () => {
    tries++;
    try {
      const r = await fetch('/api/payment-status?id=' + encodeURIComponent(saved.paymentId)); const s = await r.json();
      if (s.status === 'succeeded') { sessionStorage.removeItem('forzi_pay'); return showStatus('ok', saved.orderId); }
      if (s.status === 'canceled')  { sessionStorage.removeItem('forzi_pay'); return showStatus('fail'); }
    } catch {}
    if (tries < 10) setTimeout(poll, 2500); else showStatus('late');
  };
  poll();
})();

/* ============ ПРОСМОТР ФОТО: клик — приблизить, двигайте мышью / пальцем, чтобы осмотреть ============ */
const lb = $('#lightbox'), lbImg = $('#lbImg'), lbStage = $('#lbStage'), lbHint = $('#lbHint');
let lbList = [], lbIdx = 0, zoomed = false, base = null, lbMoved = false, lbDown = null;
const ZOOM = 2.8;
function lbSet(i){
  lbIdx = (i + lbList.length) % lbList.length; lbImg.src = lbList[lbIdx]; zoom(false);
  lb.classList.toggle('single', lbList.length < 2);
}
function openLightbox(list, i){ lbList = list; lb.hidden = false; document.body.style.overflow = 'hidden'; lbSet(i); }
function closeLightbox(){ lb.hidden = true; zoom(false); if (modal.hidden) document.body.style.overflow = ''; }
function pan(e){                                                         // точка под курсором остаётся в центре внимания
  const x = Math.min(1, Math.max(0, (e.clientX - base.left) / base.width));
  const y = Math.min(1, Math.max(0, (e.clientY - base.top) / base.height));
  lbImg.style.transformOrigin = `${x*100}% ${y*100}%`;
}
function zoom(on, e){
  zoomed = on; lb.classList.toggle('zoomed', on);
  if (on && e){ base = lbImg.getBoundingClientRect(); pan(e); lbImg.getBoundingClientRect(); lbImg.style.transform = `scale(${ZOOM})`; }
  else { lbImg.style.transform = 'scale(1)'; lbImg.style.transformOrigin = '50% 50%'; }
  lbHint.textContent = on ? 'Двигайте мышью или пальцем, чтобы осмотреть · нажмите, чтобы уменьшить' : 'Нажмите на фото, чтобы приблизить';
}
lbImg.addEventListener('pointerdown', e => { lbDown = { x:e.clientX, y:e.clientY }; lbMoved = false; });
lbImg.addEventListener('pointermove', e => {
  if (lbDown && Math.hypot(e.clientX-lbDown.x, e.clientY-lbDown.y) > 6) lbMoved = true;
  if (zoomed && (e.pointerType === 'mouse' || e.buttons)) pan(e);
});
lbImg.addEventListener('click', e => { if (lbMoved){ lbMoved = false; return; } zoomed ? zoom(false) : zoom(true, e); });
lbStage.addEventListener('click', e => { if (e.target === lbStage && !zoomed) closeLightbox(); });
$('#lbClose').onclick = closeLightbox;
$('#lbPrev').onclick = () => lbSet(lbIdx - 1); $('#lbNext').onclick = () => lbSet(lbIdx + 1);
document.addEventListener('keydown', e => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLightbox(); else if (e.key === 'ArrowLeft') lbSet(lbIdx - 1); else if (e.key === 'ArrowRight') lbSet(lbIdx + 1);
});

/* ============ КОМАНДА: на телефоне «оживляем» стикмана по касанию ============ */
document.querySelectorAll('.member').forEach(m => {
  m.addEventListener('click', () => m.classList.toggle('alive'));
  m.addEventListener('keydown', e => { if (e.key==='Enter' || e.key===' ') { e.preventDefault(); m.classList.toggle('alive'); } });
});


/* ============ КАРТОЧКА «СКОРО»: «?» плавно перетекает в золотого феникса ============
   Знак и феникс раскладываются на золотые частицы; частицы перелетают из формы в форму (как трансформер). */
function initMorph(cv){
  const W = 320, H = 280, N = 1500, dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W*dpr; cv.height = H*dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const qC = mk(), pC = mk();
  const clamp = (v,a=0,b=1) => Math.min(b, Math.max(a, v));
  const ease = t => t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  let P = [], sparks = [], phoenixOk = false;

  // собираем N точек формы (цвет берём из самого пикселя)
  function sample(c, test){
    const d = c.getContext('2d').getImageData(0,0,W,H).data, pts = [];
    for (let y=0; y<H; y+=2) for (let x=0; x<W; x+=2){
      const i = (y*W+x)*4; if (test(d,i)) pts.push({x, y, r:d[i], g:d[i+1], b:d[i+2]});
    }
    if (!pts.length) return null;
    const out = [];
    for (let k=0; k<N; k++){ const p = pts[(Math.random()*pts.length)|0];
      out.push({x:p.x+Math.random()*2-1, y:p.y+Math.random()*2-1, r:p.r, g:p.g, b:p.b}); }
    return out.sort((a,b) => (Math.round(a.y/6)-Math.round(b.y/6)) || (a.x-b.x));  // сверху вниз: верх «?» -> верх феникса
  }

  function build(img){
    // 1) знак «?» в золотом градиенте, шрифт сайта
    const q = qC.getContext('2d');
    q.font = '400 235px "Pirata One", serif'; q.textAlign = 'center'; q.textBaseline = 'middle';
    const g = q.createLinearGradient(0,30,0,250);
    g.addColorStop(0,'#fff2b0'); g.addColorStop(.35,'#F5D76E'); g.addColorStop(.7,'#D4AF37'); g.addColorStop(1,'#a8801f');
    q.fillStyle = g; q.fillText('?', W/2, H/2+8);
    const A = sample(qC, (d,i) => d[i+3] > 128);
    // 2) феникс: картинка с мягкой маской (для чёткого кадра) + готовые точки (для превращения)
    let B = null;
    if (img && img.naturalWidth){
      const p = pC.getContext('2d'), w = 270, h = w*img.naturalHeight/img.naturalWidth;
      p.drawImage(img, (W-w)/2, (H-h)/2, w, h);
      p.globalCompositeOperation = 'destination-in';
      const m = p.createRadialGradient(W/2,H/2,60,W/2,H/2,150);
      m.addColorStop(0,'#000'); m.addColorStop(.6,'#000'); m.addColorStop(1,'rgba(0,0,0,0)');
      p.fillStyle = m; p.fillRect(0,0,W,H);
      if (typeof PHOENIX_POINTS !== 'undefined') B = PHOENIX_POINTS.map(v => ({x:v[0], y:v[1], r:v[2], g:v[3], b:v[4]}));
    }
    phoenixOk = !!B; if (!A) return;
    B = B || A;
    P = A.map((a,k) => ({a, b:B[k], delay:Math.random()*.28, amp:(Math.random()-.5)*80, sz:1.1+Math.random()*1.5, ph:Math.random()*6.28}));
    for (let k=0; k<16; k++) sparks.push(newSpark(true));
    if (reduce){ drawStatic(); return; }
    start();
  }

  // золотые искры — только в центре, у фигуры
  function newSpark(rand){
    return {x:W/2+(Math.random()-.5)*90, y:H/2+30+Math.random()*60, vy:.25+Math.random()*.5, life:rand?Math.random():1, r:.9+Math.random()*1.4};
  }
  function drawSparks(){
    ctx.globalCompositeOperation = 'lighter';
    sparks.forEach((s,i) => {
      s.y -= s.vy; s.life -= .006;
      if (s.life <= 0 || s.y < H/2-110) sparks[i] = newSpark(false);
      ctx.fillStyle = `rgba(245,215,110,${(Math.sin(Math.PI*clamp(s.life))*.9).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    });
  }

  function crisp(c, alpha, t, kind){
    if (alpha <= .01) return;
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = alpha;
    ctx.translate(W/2, H/2);
    if (kind === 'q'){ ctx.translate(0, Math.sin(t/700)*5); ctx.shadowColor = 'rgba(245,215,110,.85)'; ctx.shadowBlur = 16 + 8*Math.sin(t/500); }
    else { ctx.translate(0, Math.sin(t/900)*4); ctx.scale(1 + .015*Math.sin(t/170), 1 + .012*Math.sin(t/230)); }
    ctx.drawImage(c, -W/2, -H/2); ctx.restore();
  }

  const HOLD1 = 2600, M1 = 2600, HOLD2 = 3000, M2 = 2600, TOTAL = HOLD1+M1+HOLD2+M2;
  function frame(t){
    const tt = t % TOTAL;
    ctx.clearRect(0,0,W,H);
    let mode = 'q', p = 0, dir = 1;
    if (!phoenixOk) mode = 'q';
    else if (tt < HOLD1) mode = 'q';
    else if (tt < HOLD1+M1){ mode = 'm'; p = (tt-HOLD1)/M1; dir = 1; }
    else if (tt < HOLD1+M1+HOLD2) mode = 'p';
    else { mode = 'm'; p = (tt-HOLD1-M1-HOLD2)/M2; dir = -1; }

    if (mode === 'm'){
      ctx.globalCompositeOperation = 'lighter';
      for (const q of P){
        const pl = clamp((p - q.delay)/.72), s = dir > 0 ? ease(pl) : 1 - ease(pl);
        let x = q.a.x + (q.b.x-q.a.x)*s, y = q.a.y + (q.b.y-q.a.y)*s;
        const dx = q.b.x-q.a.x, dy = q.b.y-q.a.y, len = Math.hypot(dx,dy) || 1, sw = Math.sin(Math.PI*s)*q.amp;
        x += -dy/len*sw + Math.sin(t/260+q.ph)*1.2; y += dx/len*sw + Math.cos(t/300+q.ph)*1.2;   // завихрение при перелёте
        const r = q.a.r+(q.b.r-q.a.r)*s|0, g = q.a.g+(q.b.g-q.a.g)*s|0, b = q.a.b+(q.b.b-q.a.b)*s|0;
        ctx.fillStyle = `rgba(${r},${g},${b},${(.3+.7*Math.sin(Math.PI*s)).toFixed(2)})`;
        ctx.fillRect(x, y, q.sz, q.sz);
      }
    }
    const qA = mode==='q' ? 1 : mode==='m' ? (dir>0 ? 1-clamp(p/.2) : clamp((p-.8)/.2)) : 0;
    const pA = mode==='p' ? 1 : mode==='m' ? (dir>0 ? clamp((p-.8)/.2) : 1-clamp(p/.2)) : 0;
    crisp(qC, qA, t, 'q'); crisp(pC, pA, t, 'p');
    // мягкое золотое свечение за фигурой (поверх, в режиме «lighter», чтобы не было видно границ картинки)
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,140);
    gl.addColorStop(0,'rgba(212,175,55,.16)'); gl.addColorStop(1,'rgba(212,175,55,0)');
    ctx.fillStyle = gl; ctx.fillRect(0,0,W,H);
    drawSparks();
  }

  function drawStatic(){ ctx.clearRect(0,0,W,H); ctx.drawImage(qC,0,0); }
  let raf = null, run = false;
  function loop(t){ if (!run) return; frame(t); raf = requestAnimationFrame(loop); }
  function start(){
    new IntersectionObserver(es => es.forEach(e => {            // анимация идёт только пока карточку видно
      run = e.isIntersecting; if (run) raf = requestAnimationFrame(loop);
    })).observe(cv);
  }

  const img = new Image(); img.src = 'assets/phoenix.png';
  const fontP = (document.fonts && document.fonts.load) ? document.fonts.load('235px "Pirata One"', '?').catch(()=>{}) : Promise.resolve();
  const imgP = new Promise(r => { img.onload = r; img.onerror = r; });
  Promise.race([Promise.all([fontP, imgP]), new Promise(r => setTimeout(r, 2500))]).then(() => build(img));
}
