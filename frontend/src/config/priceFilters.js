export const PRICE_FILTER_OPTIONS = [
  { id: 'all', label: 'Barcha narx' },
  { id: 'under10', label: '< 10 000' },
  { id: '10-20', label: '10 000 – 20 000' },
  { id: 'over20', label: '> 20 000' },
];

export function matchesPriceFilter(price, filterId) {
  const p = Number(price) || 0;
  if (filterId === 'under10') return p < 10000;
  if (filterId === '10-20') return p >= 10000 && p < 20000;
  if (filterId === 'over20') return p >= 20000;
  return true;
}
