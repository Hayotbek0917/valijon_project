export function mapUserFromApi(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    role: u.role,
    active: u.active ?? u.is_active ?? true,
    branch: u.branch ?? null,
  };
}

export function mapBranchToBusiness(b) {
  return {
    id: b.id,
    name: b.name,
  };
}

export function mapProductFromApi(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category_name || p.category || '',
    price: Number(p.price ?? p.selling_price ?? 0),
    cost: Number(p.cost ?? p.base_price ?? 0),
    barcode: p.barcode || '',
    emoji: p.emoji || '',
    isDraft: p.is_draft ?? false,
    businessId: p.business_id || p.branch,
    stock: p.stock ?? 0,
  };
}

export function mapWarehouseFromApi(w) {
  return {
    id: w.id,
    name: w.name,
    businessId: w.business_id || w.branch,
  };
}

export function mapInventoryFromApi(i) {
  return {
    id: i.id,
    productId: i.product_id ?? i.product,
    warehouseId: i.warehouse_id ?? i.warehouse,
    quantity: i.quantity ?? 0,
  };
}

export function mapSupplierFromApi(s) {
  return {
    id: s.id,
    name: s.name,
    contact: s.contact || '',
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    category: s.category || '',
    totalOrders: s.total_orders ?? 0,
    status: s.status || 'Faol',
    businessId: s.business_id || s.branch,
    catalog: (s.catalog || []).map(mapCatalogItemFromApi),
  };
}

export function mapCatalogItemFromApi(c) {
  return {
    id: c.id,
    name: c.name,
    category: c.category || '',
    defaultCost: Number(c.default_cost ?? 0),
    itemType: c.item_type || '',
    size: c.size || '',
    unit: c.unit || 'ta',
    productId: c.product_id ?? c.product ?? null,
  };
}

export function mapPurchaseOrderFromApi(o) {
  return {
    dbId: o.id,
    id: o.external_id || String(o.id),
    supplierId: o.supplier_id ?? o.supplier,
    supplierName: o.supplier_name || '',
    date: o.date,
    businessId: o.business_id || o.branch,
    items: (o.lines || []).map((l) => ({
      lineId: l.id,
      productId: l.product_id ?? l.product,
      catalogItemId: l.catalog_item_id ?? l.catalog_item,
      name: l.name,
      quantity: l.quantity,
      type: l.item_type,
      size: l.size,
      unit: l.unit,
      costPrice: Number(l.cost_price ?? 0),
    })),
    total: Number(o.total ?? 0),
    status: o.status || '',
    receiptDate: o.receipt_date || null,
  };
}

export function mapCustomerFromApi(c) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    businessId: c.business_id || c.branch,
  };
}

export function mapAgentFromApi(a) {
  return {
    id: a.id,
    name: a.name,
    phone: a.phone || '',
    businessId: a.business_id || a.branch,
    supplierId: a.supplier_id ?? a.supplier,
    supplierName: a.supplier_name || '',
  };
}

export function mapAgentOrderFromApi(o) {
  return {
    id: o.id,
    agentId: o.agent_id ?? o.agent,
    agentName: o.agent_name || '',
    customerName: o.customer_name || '',
    items: o.items || '',
    total: Number(o.total ?? 0),
    date: o.date,
    businessId: o.business_id || o.branch,
  };
}

export function mapSaleFromApi(s) {
  return {
    id: s.external_id || String(s.id),
    date: s.date,
    time: s.time || '',
    items: s.items || [],
    amount: Number(s.amount ?? 0),
    method: s.method || 'Naqd',
    cashier: s.cashier_name || '',
    businessId: s.business_id || s.branch,
  };
}

export function mapCategoryFromApi(c) {
  return typeof c === 'string' ? c : c.name;
}
