export function formatCurrency(n) {
  return n.toLocaleString('uz-UZ') + " so'm";
}

export function formatMillions(n) {
  return (n / 1_000_000).toFixed(1) + 'M';
}
