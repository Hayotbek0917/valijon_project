import { apiRequest } from './client';
import { fetchAll } from './client';
import { normalizeUzPhone } from '../utils/phone';
import {
  mapBranchToBusiness,
  mapProductFromApi,
  mapWarehouseFromApi,
  mapInventoryFromApi,
  mapSupplierFromApi,
  mapAgentsFromSuppliers,
  mapCatalogItemFromApi,
  mapPurchaseOrderFromApi,
  mapCreditAccountFromApi,
  mapAgentOrderFromApi,
  mapSaleFromApi,
  mapCategoryFromApi,
  payMethodCode,
  payMethodLabel,
} from './mappers';

function scopedPath(base, branchId, extra = {}) {
  const params = new URLSearchParams();
  if (branchId) params.set('branch', branchId);
  params.set('page_size', '2000');
  Object.entries(extra).forEach(([key, value]) => {
    if (value != null && value !== '') params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

const BRANCH_STORAGE_KEY = 'pos_selected_branch';

function pickEffectiveBranch(branches, branchId) {
  const ids = new Set(branches.map((b) => String(b.id)));
  let effective = branchId ? String(branchId) : null;

  if (effective && !ids.has(effective)) {
    effective = null;
    try {
      localStorage.removeItem(BRANCH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  if (!effective) {
    const mag = branches.find((b) => b.name?.startsWith('Magazin'));
    effective = mag?.id ? String(mag.id) : (branches[0]?.id ? String(branches[0].id) : null);
  } else {
    const current = branches.find((b) => String(b.id) === effective);
    if (current && !current.name?.startsWith('Magazin')) {
      const mag = branches.find((b) => b.name?.startsWith('Magazin'));
      if (mag) effective = String(mag.id);
    }
  }

  return effective;
}

export async function loadPosEssentials(branchId = null) {
  const branches = await fetchAll('/api/v1/branches');
  const effectiveBranch = pickEffectiveBranch(branches, branchId);

  const [products, warehouses, inventory, suppliers, categories] = await Promise.all([
    fetchAll(scopedPath('/api/v1/products', effectiveBranch)),
    fetchAll(scopedPath('/api/v1/warehouses', effectiveBranch)),
    fetchAll(scopedPath('/api/v1/inventory', effectiveBranch)),
    fetchAll(scopedPath('/api/v1/suppliers', effectiveBranch)),
    fetchAll('/api/v1/categories'),
  ]);

  const mappedSuppliers = suppliers.map(mapSupplierFromApi);

  return {
    businesses: branches.map(mapBranchToBusiness),
    activeBranchId: effectiveBranch,
    products: products.map(mapProductFromApi),
    warehouses: warehouses.map(mapWarehouseFromApi),
    inventory: inventory.map(mapInventoryFromApi),
    suppliers: mappedSuppliers,
    agents: mapAgentsFromSuppliers(mappedSuppliers),
    categories: categories.map(mapCategoryFromApi),
  };
}

export async function loadPosHeavy(activeBranchId) {
  const [dealerOrders, creditAccounts, agentOrders, sales] = await Promise.all([
    fetchAll(scopedPath('/api/v1/purchase-orders', activeBranchId)),
    fetchAll(scopedPath('/api/v1/credit-accounts', activeBranchId)),
    fetchAll(scopedPath('/api/v1/agent-orders', activeBranchId)),
    fetchAll(scopedPath('/api/v1/sales', activeBranchId, { days: '35' })),
  ]);

  return {
    dealerOrders: dealerOrders.map(mapPurchaseOrderFromApi),
    creditAccounts: creditAccounts.map(mapCreditAccountFromApi),
    agentOrders: agentOrders.map(mapAgentOrderFromApi),
    sales: sales.map(mapSaleFromApi),
  };
}

export async function loadPosData(branchId = null) {
  const essentials = await loadPosEssentials(branchId);
  const heavy = await loadPosHeavy(essentials.activeBranchId);
  return { ...essentials, ...heavy };
}

export async function registerCatalogProduct(supplierId, catalogItemId, options = {}) {
  const res = await apiRequest(`/suppliers/${supplierId}/register-catalog-product`, {
    method: 'POST',
    body: JSON.stringify({
      catalog_item_id: catalogItemId,
      selling_price: options.sellingPrice ?? null,
      barcode: options.barcode ?? null,
    }),
  });
  return mapProductFromApi(res);
}

export async function createSupplier(branchId, data) {
  const payload = {
    branch: branchId,
    name: data.name,
    contact: data.contact || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    category: data.category || '',
    status: 'Faol',
    catalog: (data.catalog || []).map((item) => ({
      name: item.name,
      category: item.category || data.category || '',
      default_cost: item.defaultCost || 0,
      item_type: item.itemType || '',
      size: item.size || '',
      unit: item.unit || 'ta',
      barcode: item.barcode || '',
    })),
  };
  const res = await apiRequest('/api/v1/suppliers', { method: 'POST', body: JSON.stringify(payload) });
  return mapSupplierFromApi(res);
}

export async function addCatalogItemToSupplier(supplierId, item, category = '') {
  const res = await apiRequest(`/suppliers/${supplierId}/catalog`, {
    method: 'POST',
    body: JSON.stringify({
      name: item.name,
      category: item.category || category || '',
      default_cost: item.defaultCost || 0,
      item_type: item.itemType || '',
      size: item.size || '',
      unit: item.unit || 'dona',
      barcode: item.barcode || '',
    }),
  });
  return mapCatalogItemFromApi(res);
}

export async function createPurchaseOrder(branchId, data) {
  const payload = {
    branch: branchId,
    external_id: data.externalId,
    supplier: data.supplierId,
    supplier_name: data.supplierName,
    date: data.date,
    total: data.total,
    status: 'Kutilmoqda',
    lines: data.items.map((item) => ({
      product: item.productId || null,
      catalog_item: item.catalogItemId || null,
      name: item.name,
      quantity: item.quantity,
      item_type: item.type || '',
      size: item.size || '',
      unit: item.unit || 'ta',
      cost_price: item.costPrice,
    })),
  };
  const res = await apiRequest('/api/v1/purchase-orders', { method: 'POST', body: JSON.stringify(payload) });
  return mapPurchaseOrderFromApi(res);
}

export async function receivePurchaseOrder(orderDbId, payload) {
  const res = await apiRequest(`/purchase-orders/${orderDbId}/receive`, {
    method: 'POST',
    body: JSON.stringify({
      warehouse: payload.warehouseId,
      receipt_date: payload.receiptDate,
      lines: payload.lines,
    }),
  });
  return mapPurchaseOrderFromApi(res);
}

export async function saveProduct(branchId, data, editId) {
  const payload = {
    name: data.name,
    category: data.category,
    branch: branchId,
    selling_price: data.price,
    base_price: data.cost,
    price: data.price,
    cost: data.cost,
    barcode: data.barcode || '',
    emoji: data.emoji || '📦',
    is_draft: data.isDraft ?? false,
  };
  const path = editId ? `/products/${editId}` : '/products';
  const method = editId ? 'PATCH' : 'POST';
  const res = await apiRequest(path, { method, body: JSON.stringify(payload) });
  return mapProductFromApi(res);
}

export async function uploadProductImage(productId, file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiRequest(`/products/${productId}/upload-image`, {
    method: 'POST',
    body: formData,
  });
  return mapProductFromApi(res);
}

export async function deleteProduct(id) {
  await apiRequest(`/products/${id}`, { method: 'DELETE' });
}

export async function createAgent(branchId, data) {
  const payload = {
    branch: branchId,
    name: data.name,
    phone: data.phone,
    supplier: data.supplierId || null,
    supplier_name: data.supplierName || '',
  };
  const res = await apiRequest('/api/v1/agents', { method: 'POST', body: JSON.stringify(payload) });
  return mapAgentFromApi(res);
}

export function mapPosDraftFromApi(d) {
  return {
    id: d.id,
    label: d.label,
    payMethod: payMethodLabel(d.pay_method),
    items: d.items || [],
    total: Number(d.total ?? 0),
    itemCount: d.item_count ?? 0,
    createdAt: d.created_at,
  };
}

export async function fetchPosDrafts(branchId) {
  const qs = branchId ? `?branch=${branchId}` : '';
  const all = await fetchAll(`/api/v1/pos-drafts${qs}`);
  return all.map(mapPosDraftFromApi);
}

export async function createPosDraft(branchId, data) {
  const res = await apiRequest('/api/v1/pos-drafts', {
    method: 'POST',
    body: JSON.stringify({
      branch: branchId,
      label: data.label || '',
      pay_method: payMethodCode(data.payMethod),
      items: data.items,
      total: data.total,
    }),
  });
  return mapPosDraftFromApi(res);
}

export async function deletePosDraft(id) {
  await apiRequest(`/pos-drafts/${id}`, { method: 'DELETE' });
}

export async function createSale(branchId, data) {
  const payload = {
    branch: branchId,
    external_id: data.externalId,
    date: data.date,
    time: data.time,
    amount: data.amount,
    method: payMethodCode(data.method),
    cashier_name: data.cashier,
    customer_name: data.customerName || '',
    customer_phone: data.customerPhone || '',
    credit_account_id: data.creditAccountId || null,
    create_new_credit_account: Boolean(data.createNewCreditAccount),
    pos_draft_id: data.posDraftId || null,
    lines: data.items.map((i) => ({
      product_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
    })),
  };
  const res = await apiRequest('/api/v1/sales', { method: 'POST', body: JSON.stringify(payload) });
  return mapSaleFromApi(res);
}

export async function payCreditAccount(accountId, amount, note = '') {
  const res = await apiRequest(`/credit-accounts/${accountId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
  });
  return mapCreditAccountFromApi(res);
}

export async function fetchPurchaseOrderDbId(externalId) {
  const all = await fetchAll('/api/v1/purchase-orders');
  const found = all.find((o) => o.external_id === externalId);
  return found?.id ?? null;
}
