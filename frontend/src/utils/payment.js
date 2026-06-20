/** To'lov turlari — o'zbekcha va ranglar */

export const PAY_METHOD_LABELS = {
  cash: 'Naqd',
  card: 'Karta',
  transfer: 'Online',
  credit: 'Nasiya',
  mixed: 'Aralash',
  'Naqd+Karta': 'Naqd+Karta',
  Naqd: 'Naqd',
  Karta: 'Karta',
  Online: 'Online',
  Nasiya: 'Nasiya',
  Aralash: 'Aralash',
};

export const PAY_METHOD_COLORS = {
  Naqd: '#22c55e',
  Karta: '#4361ee',
  Online: '#f59e0b',
  Nasiya: '#d97706',
  Aralash: '#8b5cf6',
  'Naqd+Karta': '#6366f1',
};

export function formatPayMethod(method) {
  if (!method) return 'Naqd';
  const raw = String(method).trim();
  const key = raw.toLowerCase();
  return PAY_METHOD_LABELS[key] || PAY_METHOD_LABELS[raw] || raw;
}

export function payMethodColor(method) {
  const label = formatPayMethod(method);
  return PAY_METHOD_COLORS[label] || '#6b7280';
}

export function payMethodChipSx(method) {
  const label = formatPayMethod(method);
  const color = payMethodColor(method);
  return {
    fontSize: 11,
    fontWeight: 700,
    bgcolor: `${color}22`,
    color,
  };
}
