export const initialProducts = [
  { id: 1, name: 'Cola 1L', category: 'Ichimliklar', price: 10000, cost: 7000, barcode: '8901234567890', emoji: '🥤', isDraft: false, businessId: 1 },
  { id: 2, name: 'Pepsi 1L', category: 'Ichimliklar', price: 9500, cost: 6500, barcode: '8901234567891', emoji: '🥤', isDraft: false, businessId: 1 },
  { id: 3, name: 'Non (Tandir)', category: 'Oziq-ovqat', price: 8000, cost: 4000, barcode: '8901234567892', emoji: '🫓', isDraft: false, businessId: 1 },
  { id: 4, name: "Lay's Chips", category: 'Shirinliklar', price: 12000, cost: 8000, barcode: '8901234567893', emoji: '🍟', isDraft: false, businessId: 1 },
  { id: 5, name: 'Snickers 50g', category: 'Shirinliklar', price: 9000, cost: 6000, barcode: '8901234567894', emoji: '🍫', isDraft: true, businessId: 1 },
  { id: 6, name: 'Smetana 20%', category: 'Sut mahsulotlari', price: 15000, cost: 10000, barcode: '8901234567895', emoji: '🥛', isDraft: false, businessId: 1 },
  { id: 7, name: 'Qatiq', category: 'Sut mahsulotlari', price: 11000, cost: 7500, barcode: '8901234567896', emoji: '🥛', isDraft: false, businessId: 1 },
];

export const initialWarehouses = [
  { id: 1, name: 'Asosiy Oziq-ovqat Ombori', businessId: 1 },
];

export const initialInventory = [
  { id: 1, productId: 1, warehouseId: 1, quantity: 150 },
  { id: 2, productId: 2, warehouseId: 1, quantity: 80 },
  { id: 3, productId: 3, warehouseId: 1, quantity: 20 },
  { id: 4, productId: 4, warehouseId: 1, quantity: 100 },
  { id: 5, productId: 5, warehouseId: 1, quantity: 15 },
];

export const initialSuppliers = [
  { id: 1, name: 'Coca-Cola Uzbekistan', contact: 'Alisher', phone: '+998901112233', email: 'alcola@uz.com', address: 'Toshkent, Yunusobod', category: 'Ichimliklar', totalOrders: 45, status: 'Faol', businessId: 1 },
  { id: 2, name: 'PepsiCo UZ', contact: 'Bahodur', phone: '+998912223344', email: 'bpepsi@uz.com', address: 'Toshkent, Chilonzor', category: 'Ichimliklar', totalOrders: 32, status: 'Faol', businessId: 1 },
  { id: 3, name: 'Novda Non', contact: 'Xurshid', phone: '+998923334455', email: 'novda@uz.com', address: "Toshkent, Mirzo Ulug'bek", category: 'Non mahsulotlari', totalOrders: 78, status: 'Faol', businessId: 1 },
];

export const initialDealerOrders = [
  {
    id: 'PO-001',
    supplierId: 1,
    supplierName: 'Coca-Cola Uzbekistan',
    date: '2026-05-18',
    businessId: 1,
    items: [{ productId: 1, name: 'Cola 1L', quantity: 150, type: 'tuzsiz', size: '1L', unit: 'litr', costPrice: 7000 }],
    total: 1050000,
    status: 'Yetkazilgan',
    receiptDate: '2026-05-18',
  },
  {
    id: 'PO-002',
    supplierId: 3,
    supplierName: 'Novda Non',
    date: '2026-05-20',
    businessId: 1,
    items: [{ productId: 3, name: 'Non (Tandir)', quantity: 200, type: 'tuzli', size: '300g', unit: 'gr', costPrice: 4000 }],
    total: 800000,
    status: 'Kutilmoqda',
  },
];

export const initialCustomers = [
  { id: 1, name: 'Bobur Mirzo', phone: '+998901234567', email: 'bobur@gmail.com', businessId: 1 },
  { id: 2, name: 'Zilola Ahmedova', phone: '+998934567890', email: 'zilola@gmail.com', businessId: 1 },
];

export const initialAgents = [
  { id: 1, name: 'Agent Davron', phone: '+998909998877', businessId: 1, supplierId: 1, supplierName: 'Coca-Cola Uzbekistan' },
];

export const initialAgentOrders = [
  { id: 1, agentId: 1, agentName: 'Agent Davron', customerName: 'Bobur Mirzo', items: 'Cola 1L x50', total: 500000, date: '2026-05-20', businessId: 1 },
];

export const initialSales = [
  {
    id: 'TXN-001',
    date: '2026-05-21',
    time: '12:30',
    items: [{ name: 'Cola 1L', qty: 2, price: 10000 }, { name: 'Non (Tandir)', qty: 1, price: 8000 }],
    amount: 28000,
    method: 'Naqd',
    cashier: 'Akmaljon',
    businessId: 1,
  },
];

export const businesses = [{ id: 1, name: 'Market (Oziq-ovqat)' }];

export const defaultCategories = ['Ichimliklar', 'Oziq-ovqat', 'Sut mahsulotlari', 'Shirinliklar', 'Kraxmal'];
