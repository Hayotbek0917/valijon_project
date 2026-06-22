import { apiRequest } from './client';

function magazinCode(name = '') {
  const match = name.match(/(\d{3})\s*$/);
  return match ? `m${match[1]}` : name.toLowerCase().replace(/\s+/g, '');
}

function mapStore(row) {
  return {
    id: row.id,
    store_name: row.store_name || row.name || '',
    store_code: row.store_code || magazinCode(row.name || row.store_name || ''),
    status: row.status || 'inactive',
    branch_count: row.branch_count ?? 1,
    sales_today: row.sales_today ?? 0,
    revenue_today: row.revenue_today ?? row.sales_today_amount ?? 0,
    sales_7d: row.sales_7d ?? 0,
    revenue_7d: row.revenue_7d ?? row.sales_7d_amount ?? 0,
    sales_30d: row.sales_30d ?? 0,
    revenue_30d: row.revenue_30d ?? row.sales_30d_amount ?? 0,
    sales_total: row.sales_total ?? 0,
    last_sale_date: row.last_sale_date ?? null,
  };
}

export async function fetchMagazinStatus() {
  const raw = await apiRequest('/api/v1/platform/magazin-status');
  const rows = raw.stores || raw.magazins || [];
  const stores = rows.map(mapStore);
  const summary = raw.summary || {};

  return {
    summary: {
      total: summary.total ?? stores.length,
      active: summary.active ?? stores.filter((s) => s.status === 'active').length,
      low: summary.low ?? stores.filter((s) => s.status === 'low').length,
      inactive: summary.inactive ?? stores.filter((s) => s.status === 'inactive').length,
    },
    stores,
  };
}
