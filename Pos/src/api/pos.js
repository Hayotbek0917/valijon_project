import { apiRequest } from './client';
import { fetchAll } from './client';
import {
  mapAgentFromApi,
  mapAgentOrderFromApi,
  mapBranchToBusiness,
  mapCategoryFromApi,
  mapCustomerFromApi,
  mapInventoryFromApi,
  mapProductFromApi,
  mapPurchaseOrderFromApi,
  mapSaleFromApi,
  mapSupplierFromApi,
  mapWarehouseFromApi,
} from './mappers';

export async function loadPosData() {
  const [
    branches, products, warehouses, inventory, suppliers,
    dealerOrders, customers, agents, agentOrders, sales, categories,
  ] = await Promise.all([
    fetchAll('/api/v1/branches'),
    fetchAll('/api/v1/products'),
    fetchAll('/api/v1/warehouses'),
    fetchAll('/api/v1/inventory'),
    fetchAll('/api/v1/suppliers'),
    fetchAll('/api/v1/purchase-orders'),
    fetchAll('/api/v1/customers'),
    fetchAll('/api/v1/agents'),
    fetchAll('/api/v1/agent-orders'),
    fetchAll('/api/v1/sales'),
    fetchAll('/api/v1/categories'),
  ]);

  return {
    businesses: branches.map(mapBranchToBusiness),
    products: products.map(mapProductFromApi),
    warehouses: warehouses.map(mapWarehouseFromApi),
    inventory: inventory.map(mapInventoryFromApi),
    suppliers: suppliers.map(mapSupplierFromApi),
    dealerOrders: dealerOrders.map(mapPurchaseOrderFromApi),
    customers: customers.map(mapCustomerFromApi),
    agents: agents.map(mapAgentFromApi),
    agentOrders: agentOrders.map(mapAgentOrderFromApi),
    sales: sales.map(mapSaleFromApi),
    categories: categories.map(mapCategoryFromApi),
  };
}

export async function registerCatalogProduct(supplierId, catalogItemId, options = {}) {
  const res = await apiRequest(`/api/v1/suppliers/${supplierId}/register-catalog-product`, {
    method: 'POST',
    body: JSON.stringify({
      catalog_item_id: catalogItemId,
      selling_price: options.sellingPrice ?? null,
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
    })),
  };
  const res = await apiRequest('/api/v1/suppliers', { method: 'POST', body: JSON.stringify(payload) });
  return mapSupplierFromApi(res);
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
  const res = await apiRequest(`/api/v1/purchase-orders/${orderDbId}/receive`, {
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
  const path = editId ? `/api/v1/products/${editId}` : '/api/v1/products';
  const method = editId ? 'PATCH' : 'POST';
  const res = await apiRequest(path, { method, body: JSON.stringify(payload) });
  return mapProductFromApi(res);
}

export async function deleteProduct(id) {
  await apiRequest(`/api/v1/products/${id}`, { method: 'DELETE' });
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
    payMethod: d.pay_method || 'Naqd',
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
      pay_method: data.payMethod || 'Naqd',
      items: data.items,
      total: data.total,
    }),
  });
  return mapPosDraftFromApi(res);
}

export async function deletePosDraft(id) {
  await apiRequest(`/api/v1/pos-drafts/${id}`, { method: 'DELETE' });
}

export async function createSale(branchId, data) {
  const payload = {
    branch: branchId,
    external_id: data.externalId,
    date: data.date,
    time: data.time,
    amount: data.amount,
    method: data.method,
    cashier_name: data.cashier,
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

export async function fetchPurchaseOrderDbId(externalId) {
  const all = await fetchAll('/api/v1/purchase-orders');
  const found = all.find((o) => o.external_id === externalId);
  return found?.id ?? null;
}
