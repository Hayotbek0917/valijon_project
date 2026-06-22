/**
 * O'zbekiston telefoni — API/DB: 9 raqam (901234567).
 * Ko'rinish: +998901234567
 */

const PHONE_9 = /^9\d{8}$/;

/** 9 raqam to'liq va to'g'rimi */
export function isUzPhoneComplete(value) {
  const d = parseUzPhoneInput(value);
  return PHONE_9.test(d);
}

/** Form validatsiyasi uchun xato matni */
export function uzPhoneValidationError(value, { required = false, label = 'Telefon' } = {}) {
  const d = parseUzPhoneInput(value);
  if (!d) {
    return required ? `${label} raqamini kiriting` : '';
  }
  if (d.length < 9) {
    return `${label}: +998 dan keyin yana ${9 - d.length} ta raqam kerak`;
  }
  if (!PHONE_9.test(d)) {
    return `${label}: O'zbekiston raqami 9 bilan boshlanadi (masalan 901234567)`;
  }
  return '';
}

/** API ga yuborish uchun — faqat 9 raqam */
export function normalizeUzPhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  let local = '';

  if (digits.startsWith('998') && digits.length >= 12) {
    local = digits.slice(-9);
  } else if (digits.length === 9) {
    local = digits;
  } else if (digits.length === 10 && digits.startsWith('0')) {
    local = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith('9')) {
    local = digits;
  } else {
    throw new Error("Telefon noto'g'ri. Namuna: 901234567 yoki +998901234567");
  }

  if (!PHONE_9.test(local)) {
    throw new Error("Telefon noto'g'ri. O'zbekiston raqami: 9 ta raqam");
  }
  return local;
}

/** Input maydoni uchun — faqat 9 raqam qismi (998 siz) */
export function parseUzPhoneInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998')) return digits.slice(3, 12);
  if (digits.startsWith('0')) return digits.slice(1, 10);
  return digits.slice(0, 9);
}

/** Ko'rinish: +998 90 123 45 67 */
export function formatUzPhoneDisplay(phone) {
  if (!phone) return '';
  try {
    const local = normalizeUzPhone(phone);
    return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  } catch {
    return String(phone);
  }
}

/** Input uchun qisqa ko'rinish: +998901234567 */
export function formatUzPhoneCompact(phone) {
  if (!phone) return '';
  try {
    return `+998${normalizeUzPhone(phone)}`;
  } catch {
    return String(phone);
  }
}

/** Yozayotganda faqat raqamlar */
export function stripPhoneInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 9);
}
