import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  loadPosData, createSupplier, createPurchaseOrder, receivePurchaseOrder,
  saveProduct, deleteProduct, createAgent, createSale, registerCatalogProduct,
} from '../api/pos';
import { businesses as fallbackBusinesses, defaultCategories } from '../data/initialData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { currentUser, authReady, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    const val = localStorage.getItem('sidebar_collapsed');
    return val ? JSON.parse(val) : false;
  });

  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [businesses, setBusinesses] = useState(fallbackBusinesses);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dealerOrders, setDealerOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentOrders, setAgentOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

  const refreshData = useCallback(async () => {
    if (!currentUser) {
      setDataReady(true);
      return;
    }

    setDataReady(false);
    setDataError(null);

    try {
      const data = await loadPosData();
      setBusinesses(data.businesses.length ? data.businesses : fallbackBusinesses);
      setProducts(data.products);
      setWarehouses(data.warehouses);
      setInventory(data.inventory);
      setSuppliers(data.suppliers);
      setDealerOrders(data.dealerOrders);
      setCustomers(data.customers);
      setAgents(data.agents);
      setAgentOrders(data.agentOrders);
      setSales(data.sales);
      setCategories(data.categories.length ? data.categories : defaultCategories);

      const branchId = data.businesses[0]?.id ?? null;
      setCurrentBusinessId(branchId);
      setSelectedWarehouseId(data.warehouses[0]?.id ?? null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        return;
      }
      setDataError(err.message || 'Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setDataReady(true);
    }
  }, [currentUser, logout]);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      setDataReady(true);
      setDataError(null);
      return;
    }
    refreshData();
  }, [authReady, currentUser, refreshData]);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const activeBusinessWarehouses = warehouses.filter(
    (w) => w.businessId === currentBusinessId
  );

  useEffect(() => {
    if (!currentBusinessId) return;
    const validWarehouses = warehouses.filter((w) => w.businessId === currentBusinessId);
    if (validWarehouses.length > 0 && !validWarehouses.some((w) => w.id === selectedWarehouseId)) {
      setSelectedWarehouseId(validWarehouses[0].id);
    }
  }, [currentBusinessId, warehouses, selectedWarehouseId]);

  const getProductStock = (productId, wId) => {
    const whId = wId || selectedWarehouseId;
    const inv = inventory.find((i) => i.productId === productId && i.warehouseId === whId);
    return inv ? inv.quantity : 0;
  };

  const getBusinessProducts = () =>
    products.filter((p) => p.businessId === currentBusinessId);

  const getSupplierCatalog = (supplierId) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    return sup?.catalog || [];
  };

  const getIncomingAlerts = useCallback(() => {
    if (!currentBusinessId) {
      return { unlinkedCatalog: [], pendingReceipts: [], totalCount: 0 };
    }
    const businessSuppliers = suppliers.filter((s) => s.businessId === currentBusinessId);
    const unlinkedCatalog = [];
    for (const sup of businessSuppliers) {
      for (const item of sup.catalog || []) {
        if (!item.productId) {
          unlinkedCatalog.push({
            ...item,
            supplierId: sup.id,
            supplierName: sup.name,
          });
        }
      }
    }
    const pendingReceipts = dealerOrders.filter(
      (o) => o.businessId === currentBusinessId && o.status === 'Kutilmoqda',
    );
    return {
      unlinkedCatalog,
      pendingReceipts,
      totalCount: unlinkedCatalog.length + pendingReceipts.length,
    };
  }, [suppliers, dealerOrders, currentBusinessId]);

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId);

  const withSave = useCallback(async (fn) => {
    setSaving(true);
    try {
      await fn();
      await refreshData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Xatolik yuz berdi' };
    } finally {
      setSaving(false);
    }
  }, [refreshData]);

  const addSupplier = useCallback((data) =>
    withSave(() => createSupplier(currentBusinessId, data)), [currentBusinessId, withSave]);

  const addPurchaseOrder = useCallback((data) =>
    withSave(() => createPurchaseOrder(currentBusinessId, data)), [currentBusinessId, withSave]);

  const confirmPurchaseReceipt = useCallback((orderDbId, payload) =>
    withSave(() => receivePurchaseOrder(orderDbId, payload)), [withSave]);

  const addProduct = useCallback((data, editId) =>
    withSave(() => saveProduct(currentBusinessId, data, editId)), [currentBusinessId, withSave]);

  const removeProduct = useCallback((id) =>
    withSave(() => deleteProduct(id)), [withSave]);

  const addAgent = useCallback((data) =>
    withSave(() => createAgent(currentBusinessId, data)), [currentBusinessId, withSave]);

  const addCatalogToProducts = useCallback((supplierId, catalogItemId, options) =>
    withSave(() => registerCatalogProduct(supplierId, catalogItemId, options)), [withSave]);

  const addSale = useCallback((data) =>
    withSave(() => createSale(currentBusinessId, data)), [currentBusinessId, withSave]);

  return (
    <AppContext.Provider
      value={{
        collapsed, setCollapsed,
        dataReady, dataError, saving, refreshData,
        businesses, currentBusiness, currentBusinessId, setCurrentBusinessId,
        products, setProducts, getBusinessProducts,
        warehouses, setWarehouses, activeBusinessWarehouses,
        selectedWarehouseId, setSelectedWarehouseId,
        inventory, setInventory, getProductStock,
        suppliers, setSuppliers, getSupplierCatalog, getIncomingAlerts,
        dealerOrders, setDealerOrders,
        customers, setCustomers,
        agents, setAgents,
        agentOrders, setAgentOrders,
        sales, setSales,
        categories, setCategories,
        addSupplier, addPurchaseOrder, confirmPurchaseReceipt,
        addProduct, removeProduct, addAgent, addCatalogToProducts, addSale,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
