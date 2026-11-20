// Общие данные и функции для serverless-функций (заказ, вебхук оплаты, статус).
// Цены проверяются на сервере (фронтенду не доверяем). Держите в синхроне с js/app.js
export const PRODUCTS = { tshirt:{ name:'T-SHIRT Black STATUE OF LIBERTY', price:2500 }, hoodie:{ name:'ZIP-HOODIE', price:3500 } };
export const COURIER_PRICE = null;   // null = цена доставки пока не определена (как в js/app.js)
export const SIZES = ['S','M','L','XL'];

export const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export const clip = (s, n) => esc(String(s || '').slice(0, n));
export const money = n => n.toLocaleString('ru-RU').replace(/\u00A0/g,' ') + ' ₽';
export const prepayRub = () => Number(process.env.PREPAY_RUB || 100);

export const normTg = v => String(v || '').trim().replace(/^(https?:\/\/)?(t\.me\/|telegram\.me\/)/i, '').replace(/^@/, '');

// Проверка данных заказа. Возвращает { ok, error, data }
export function validateOrder(b) {
  const p = PRODUCTS[b.product];
  const qty = parseInt(b.qty, 10);
  const d = String(b.phone || '').replace(/\D/g, '');
  const phoneOk = (d.length === 11 && d[0] === '7') || (d.length === 12 && d.startsWith('998'));
  const tg = normTg(b.tg);
  if (!p || !SIZES.includes(b.size) || !(qty >= 1 && qty <= 20)
    || String(b.name||'').trim().length < 2 || String(b.city||'').trim().length < 2
    || String(b.address||'').trim().length < 5 || !phoneOk
    || !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tg)
    || !['courier','pickup'].includes(b.delivery)) {
    return { ok: false, error: 'Некорректные данные' };
  }
  return { ok: true, data: { product: b.product, p, size: b.size, qty, delivery: b.delivery,
    name: String(b.name).trim(), phone: String(b.phone), city: String(b.city).trim(),
    address: String(b.address).trim(), comment: String(b.comment || '').trim(), tg: '@' + tg } };
}

// Текст сообщения в Telegram (отправляется только ПОСЛЕ успешной оплаты)
export function buildMessage(o, orderId, paymentId, prepay) {
  const courier = o.delivery === 'courier';
  const delivery = courier ? (COURIER_PRICE || 0) : 0;
  const total = o.p.price * o.qty + delivery;
  const delText = !courier ? 'Самовывоз (0 ₽)' : (COURIER_PRICE == null ? 'Курьер (цена уточняется)' : `Курьер (${money(delivery)})`);
  const when = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  return `🛒 <b>Новый заказ №${esc(orderId)}</b> — ✅ ОПЛАЧЕНО

👕 Товар: ${esc(o.p.name)}
📏 Размер: ${o.size}
🔢 Количество: ${o.qty}
💰 Цена: ${money(o.p.price)}
🚚 Доставка: ${delText}
💵 <b>ИТОГО: ${money(total)}${courier && COURIER_PRICE == null ? ' + доставка' : ''}</b>
💳 Оплачено при заказе: ${money(prepay)}

👤 Имя: ${clip(o.name,80)}
📞 Телефон: ${clip(o.phone,25)}
✈️ Telegram: ${clip(o.tg,40)}
🏙 Город: ${clip(o.city,80)}
📍 Адрес: ${clip(o.address,200)}
💬 Комментарий: ${clip(o.comment,500) || '—'}

🧾 Платёж: ${esc(paymentId)}
🕒 ${when}`;
}

// Запрос к API ЮKassa (Basic-авторизация: ID магазина + секретный ключ)
export function yooAuth() {
  const { YOOKASSA_SHOP_ID: shop, YOOKASSA_SECRET_KEY: key } = process.env;
  if (!shop || !key) return null;
  return 'Basic ' + Buffer.from(`${shop}:${key}`).toString('base64');
}
