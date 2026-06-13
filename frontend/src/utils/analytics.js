const WEEKDAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseSaleDateTime(sale) {
  const date = sale.date || '';
  const time = (sale.time || '00:00').slice(0, 5);
  return new Date(`${date}T${time}:00`);
}

export function filterSalesByBusiness(sales, businessId) {
  if (!businessId) return sales;
  return sales.filter((s) => String(s.businessId) === String(businessId));
}

export function filterSalesByPeriod(sales, period, referenceDate = new Date()) {
  const today = toDateStr(referenceDate);
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  if (period === 'Bugun' || period === 'bugun') {
    return sales.filter((s) => s.date === today);
  }

  let daysBack = 6;
  if (period === '30 kun' || period === '30 kunlik') daysBack = 29;
  if (period === 'Oy' || period === 'Yil') daysBack = 29;

  const start = new Date(referenceDate);
  start.setDate(start.getDate() - daysBack);
  const startStr = toDateStr(start);
  return sales.filter((s) => s.date >= startStr && s.date <= today);
}

function findProduct(products, name) {
  return products.find((p) => p.name === name);
}

export function calcSaleCost(sale, products) {
  let cost = 0;
  for (const item of sale.items || []) {
    const prod = findProduct(products, item.name);
    const unitCost = prod?.cost ?? Number(item.price || 0) * 0.65;
    cost += unitCost * Number(item.qty || 0);
  }
  return cost;
}

export function calcSaleMetrics(sale, products) {
  const revenue = Number(sale.amount || 0);
  const cost = calcSaleCost(sale, products);
  return { revenue, cost, profit: revenue - cost };
}

export function summarizeSales(sales, products) {
  let sotuv = 0;
  let xarajat = 0;
  for (const sale of sales) {
    const m = calcSaleMetrics(sale, products);
    sotuv += m.revenue;
    xarajat += m.cost;
  }
  return {
    sotuv,
    xarajat,
    foyda: sotuv - xarajat,
    transactions: sales.length,
    avgOrder: sales.length ? Math.round(sotuv / sales.length) : 0,
  };
}

export function buildHourlyChart(sales, products) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, '0')}:00`,
    hour,
    sotuv: 0,
    foyda: 0,
    xarajat: 0,
    count: 0,
  }));

  for (const sale of sales) {
    const dt = parseSaleDateTime(sale);
    const hour = dt.getHours();
    const m = calcSaleMetrics(sale, products);
    buckets[hour].sotuv += m.revenue;
    buckets[hour].foyda += m.profit;
    buckets[hour].xarajat += m.cost;
    buckets[hour].count += 1;
  }

  return buckets;
}

export function buildDailyChart(sales, products, days = 7, referenceDate = new Date()) {
  const rows = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const key = toDateStr(d);
    const daySales = sales.filter((s) => s.date === key);
    const summary = summarizeSales(daySales, products);
    rows.push({
      label: `${d.getDate()} ${d.toLocaleString('uz-UZ', { month: 'short' })}`,
      dayName: WEEKDAYS[d.getDay()],
      date: key,
      sotuv: summary.sotuv,
      foyda: summary.foyda,
      xarajat: summary.xarajat,
      count: summary.transactions,
    });
  }
  return rows;
}

export function buildCategoryChart(sales, products) {
  const totals = {};
  for (const sale of sales) {
    for (const item of sale.items || []) {
      const prod = findProduct(products, item.name);
      const cat = prod?.category || 'Boshqa';
      const amount = Number(item.price || 0) * Number(item.qty || 0);
      totals[cat] = (totals[cat] || 0) + amount;
    }
  }
  return Object.entries(totals)
    .map(([cat, sotuv]) => ({ cat, sotuv }))
    .sort((a, b) => b.sotuv - a.sotuv);
}

export function buildTopProducts(sales, products, limit = 5) {
  const totals = {};
  for (const sale of sales) {
    for (const item of sale.items || []) {
      const name = item.name;
      if (!totals[name]) {
        const prod = findProduct(products, name);
        totals[name] = {
          name,
          sold: 0,
          revenue: 0,
          img: prod?.image || '',
          emoji: prod?.emoji || '📦',
        };
      }
      totals[name].sold += Number(item.qty || 0);
      totals[name].revenue += Number(item.price || 0) * Number(item.qty || 0);
    }
  }
  return Object.values(totals)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p, idx) => ({ ...p, rank: idx + 1 }));
}

export function buildProfitLossRows(sales, products, limit = 5) {
  const totals = {};
  for (const sale of sales) {
    for (const item of sale.items || []) {
      const name = item.name;
      const prod = findProduct(products, name);
      const qty = Number(item.qty || 0);
      const revenue = Number(item.price || 0) * qty;
      const cost = (prod?.cost ?? Number(item.price || 0) * 0.65) * qty;
      if (!totals[name]) totals[name] = { product: name, sotuv: 0, profit: 0 };
      totals[name].sotuv += revenue;
      totals[name].profit += revenue - cost;
    }
  }
  return Object.values(totals)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit)
    .map((row) => ({ ...row, positive: row.profit >= 0 }));
}

export function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercent(value) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function saleToReceipt(sale, storeName = 'SmartPOS Market') {
  const dt = parseSaleDateTime(sale);
  return {
    id: sale.id,
    date: dt.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    time: (sale.time || '').slice(0, 5) || dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    dayName: WEEKDAYS[dt.getDay()],
    items: (sale.items || []).map((i) => ({
      name: i.name,
      qty: i.qty,
      price: i.price,
      barcode: i.barcode || '',
    })),
    amount: Number(sale.amount || 0),
    method: sale.method || 'Naqd',
    cashier: sale.cashier || '',
    storeName,
    itemCount: (sale.items || []).reduce((s, i) => s + Number(i.qty || 0), 0),
  };
}

export function sortSalesDesc(sales) {
  return [...sales].sort((a, b) => {
    const da = parseSaleDateTime(a).getTime();
    const db = parseSaleDateTime(b).getTime();
    return db - da;
  });
}
