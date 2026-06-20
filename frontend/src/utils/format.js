export function formatCurrency(n) {
  return n.toLocaleString('uz-UZ') + " so'm";
}

/** Sotuv narxi − tannarx (manfiy = zarar) */
export function computeProductProfit(price, cost) {
  return (Number(price) || 0) - (Number(cost) || 0);
}

/** +3 000 so'm / -2 000 so'm */
export function formatSignedCurrency(amount) {
  const n = Number(amount) || 0;
  const formatted = Math.abs(n).toLocaleString('uz-UZ') + " so'm";
  if (n > 0) return `+${formatted}`;
  if (n < 0) return `-${formatted}`;
  return formatted;
}

export function profitStyle(profit) {
  const n = Number(profit) || 0;
  if (n < 0) return { color: '#ef4444' };
  if (n > 0) return { color: '#22c55e' };
  return { color: '#6b7280' };
}

export function formatMillions(n) {
  return (n / 1_000_000).toFixed(1) + 'M';
}
