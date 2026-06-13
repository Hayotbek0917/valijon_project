import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { fetchPosDrafts, createPosDraft, deletePosDraft } from '../api/pos';
import { NAV_MAIN, NAV_BOTTOM, filterByRole } from '../config/navigation';
import { canAccessRoute } from '../config/roles';
import {
  Search, Add, Remove, Delete, ShoppingCartCheckout,
  CategoryOutlined, CalendarToday, Assistant, Close,
  PauseCircleOutlined, PlaylistPlay, Menu, ArrowBack, Print,
} from '@mui/icons-material';
import { Button, Chip, Divider, IconButton, InputAdornment, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Drawer, Badge, List, ListItemButton, ListItemText, Autocomplete } from '@mui/material';

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";
const fmtNum = (n) => Number(n).toLocaleString('uz-UZ');
const formatNasiyaOption = (a) => `${a.customerName} · ${fmtNum(a.balance)} so'm qarz`;
const receiptLine = '--------------------------------';
const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
const TOUCH_BTN = { minHeight: 48, fontSize: 15, fontWeight: 700, borderRadius: 12, textTransform: 'none' };

export default function POS() {
  const navigate = useNavigate();
  const { products, getProductStock, addSale, saving, currentBusinessId, currentBusiness, creditAccounts } = useApp();
  const { currentUser } = useAuth();
  const cashierName = currentUser?.name ?? 'Kassir';
  
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);
  const searchDraftRef = useRef('');
  const lastScanRef = useRef({ code: '', at: 0 });
  const scanProcessingRef = useRef(false);
  const SCAN_COOLDOWN_MS = 600;
  const [selectedCat, setSelectedCat] = useState('Barchasi');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('Naqd');

  const [posDrafts, setPosDrafts] = useState([]);
  const [draftsDrawerOpen, setDraftsDrawerOpen] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [qtyEditItem, setQtyEditItem] = useState(null);
  const [qtyInput, setQtyInput] = useState('');
  
  // Dialog and AI drawer states
  const [receiptDialog, setReceiptDialog] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [nasiyaOpen, setNasiyaOpen] = useState(false);
  const [nasiyaCustomer, setNasiyaCustomer] = useState('');
  const [nasiyaNewMode, setNasiyaNewMode] = useState(false);
  const [selectedNasiyaAccount, setSelectedNasiyaAccount] = useState(null);

  const loadDrafts = useCallback(async () => {
    if (!currentBusinessId) return;
    try {
      const list = await fetchPosDrafts(currentBusinessId);
      setPosDrafts(list);
    } catch {
      setPosDrafts([]);
    }
  }, [currentBusinessId]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  /** Boshqa chernoviklarda band qilingan miqdor (joriy ochilgan chernovikdan tashqari) */
  const getDraftReserved = useCallback((productId, excludeDraftId = activeDraftId) => {
    let n = 0;
    for (const d of posDrafts) {
      if (excludeDraftId && d.id === excludeDraftId) continue;
      for (const item of d.items || []) {
        if (Number(item.id) === Number(productId)) {
          n += Number(item.qty) || 0;
        }
      }
    }
    return n;
  }, [posDrafts, activeDraftId]);

  /** Savatga qo'shish mumkin bo'lgan maksimal miqdor */
  const getMaxQtyForProduct = useCallback((productId, excludeDraftId = activeDraftId) => {
    const physical = getProductStock(productId);
    const reserved = getDraftReserved(productId, excludeDraftId);
    return Math.max(0, physical - reserved);
  }, [getProductStock, getDraftReserved, activeDraftId]);

  /** Yana 1 ta qo'shish mumkinmi (joriy savat hisobga olinadi) */
  const canAddMoreToCart = useCallback((productId, currentQtyInCart) => {
    return currentQtyInCart < getMaxQtyForProduct(productId);
  }, [getMaxQtyForProduct]);

  // Time state
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => searchRef.current?.focus(), 150);
    return () => window.clearTimeout(t);
  }, []);

  const focusSearch = useCallback(() => {
    window.setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const getSearchCode = useCallback(() => {
    const domVal = searchRef.current?.value;
    if (domVal != null && String(domVal).trim()) return String(domVal).trim();
    if (searchDraftRef.current.trim()) return searchDraftRef.current.trim();
    return search.trim();
  }, [search]);

  const clearSearchInput = useCallback(() => {
    searchDraftRef.current = '';
    setSearch('');
    if (searchRef.current) searchRef.current.value = '';
    focusSearch();
  }, [focusSearch]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.businessId === currentBusinessId),
    [products, currentBusinessId],
  );

  // Categories list derived from products
  const categoriesList = ['Barchasi', ...new Set(activeProducts.map(p => p.category))];

  const filtered = activeProducts.filter((p) => {
    const matchCat = selectedCat === 'Barchasi' || p.category === selectedCat;
    const matchSearch = !search.trim()
      || p.name.toLowerCase().includes(search.toLowerCase())
      || (p.barcode && p.barcode.includes(search.trim()));
    return matchCat && matchSearch;
  });

  const menuPages = useMemo(() => {
    const role = currentUser?.role;
    if (!role) return [];
    const items = [
      ...filterByRole(NAV_MAIN, role),
      ...filterByRole(NAV_BOTTOM, role),
    ].filter((item) => item.path !== '/pos' && canAccessRoute(role, item.path));
    return items;
  }, [currentUser?.role]);

  const addByBarcode = useCallback((code) => {
    const barcodeTrimmed = String(code || '').trim();
    if (!barcodeTrimmed) return false;

    const now = Date.now();
    if (
      lastScanRef.current.code === barcodeTrimmed
      && now - lastScanRef.current.at < SCAN_COOLDOWN_MS
    ) {
      return true;
    }
    if (scanProcessingRef.current) return true;

    const exactMatch = activeProducts.find(
      (p) => String(p.barcode || '').trim() === barcodeTrimmed,
    );
    if (!exactMatch) return false;

    scanProcessingRef.current = true;

    let added = false;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === exactMatch.id);
      const maxQty = getMaxQtyForProduct(exactMatch.id);
      const inCart = existing?.qty || 0;

      if (inCart >= maxQty) {
        alert(`${exactMatch.name}: qoldiq yetarli emas (mavjud: ${maxQty} ta)!`);
        return prev;
      }

      added = true;
      if (existing) {
        return prev.map((i) => (
          i.id === exactMatch.id ? { ...i, qty: i.qty + 1 } : i
        ));
      }
      return [...prev, { ...exactMatch, qty: 1 }];
    });

    if (added) {
      lastScanRef.current = { code: barcodeTrimmed, at: now };
    }

    window.setTimeout(() => {
      scanProcessingRef.current = false;
    }, 150);

    return added;
  }, [activeProducts, getMaxQtyForProduct]);

  const runBarcodeScan = useCallback((code) => addByBarcode(code), [addByBarcode]);

  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault?.();
    const code = getSearchCode();
    if (!code) return;

    let matched = runBarcodeScan(code);
    if (!matched) {
      const byName = activeProducts.find((p) => p.name.toLowerCase() === code.toLowerCase());
      if (byName?.barcode) matched = runBarcodeScan(byName.barcode);
    }

    clearSearchInput();
  }, [activeProducts, clearSearchInput, getSearchCode, runBarcodeScan]);

  const addToCart = (product) => {
    const maxQty = getMaxQtyForProduct(product.id);
    if (maxQty < 1) {
      alert(`${product.name}: boshqa navbatda band — sotib bo'lmaydi!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (!canAddMoreToCart(product.id, existing.qty)) {
          alert("Skladda yetarli mahsulot yo'q (navbatlarda band qilingan)!");
          return prev;
        }
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    const maxQty = getMaxQtyForProduct(id);
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQty = i.qty + delta;
          if (newQty > maxQty) {
            alert(`Eng ko'pi ${maxQty} ta (navbatlarda band qilinganlar hisobga olingan)!`);
            return i;
          }
          return { ...i, qty: Math.max(1, newQty) };
        }
        return i;
      })
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const openQtyEditor = (item) => {
    setQtyEditItem(item);
    setQtyInput(String(item.qty));
  };

  const applyQtyInput = () => {
    if (!qtyEditItem) return;
    const maxQty = getMaxQtyForProduct(qtyEditItem.id);
    const n = parseInt(qtyInput, 10);
    if (!qtyInput.trim() || Number.isNaN(n) || n < 1) {
      alert('To\'g\'ri son kiriting');
      return;
    }
    if (n > maxQty) {
      alert(`Faqat ${maxQty} ta mavjud (buncha mahsulot yo'q)!`);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === qtyEditItem.id ? { ...i, qty: n } : i))
    );
    setQtyEditItem(null);
    setQtyInput('');
  };

  const handleNumpad = (key) => {
    if (key === 'C') {
      setQtyInput('');
      return;
    }
    if (key === 'OK') {
      applyQtyInput();
      return;
    }
    setQtyInput((prev) => {
      const next = `${prev}${key}`;
      if (next.length > 5) return prev;
      return next;
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal;

  const clearCart = () => {
    setCart([]);
    setActiveDraftId(null);
  };

  const serializeCartItems = (items) =>
    items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      emoji: i.emoji,
      barcode: i.barcode,
      category: i.category,
      cost: i.cost,
    }));

  const saveCartToDraft = async () => {
    if (!currentBusinessId) return;
    if (cart.length === 0) {
      alert("Savat bo'sh — avval mahsulot qo'shing");
      return;
    }
    const defaultLabel = `Navbat #${posDrafts.length + 1}`;
    const label = window.prompt('Navbat nomi (masalan: qizil ko\'ylakli mijoz):', defaultLabel);
    if (label === null) return;

    setDraftSaving(true);
    try {
      await createPosDraft(currentBusinessId, {
        label: label.trim() || defaultLabel,
        payMethod,
        items: serializeCartItems(cart),
        total,
      });
      setCart([]);
      setActiveDraftId(null);
      await loadDrafts();
    } catch (err) {
      alert(err.message || 'Chernovik saqlanmadi');
    } finally {
      setDraftSaving(false);
    }
  };

  const restoreDraft = (draft) => {
    if (cart.length > 0) {
      const ok = window.confirm(
        "Joriy savat bekor qilinadi. Saqlangan navbat ochilsinmi?"
      );
      if (!ok) return;
    }
    const restored = [];
    const skipped = [];
    for (const item of draft.items || []) {
      const maxQty = getMaxQtyForProduct(item.id, draft.id);
      const want = Number(item.qty) || 1;
      if (maxQty < 1) {
        skipped.push(item.name);
        continue;
      }
      const qty = Math.min(want, maxQty);
      if (qty < want) {
        alert(`${item.name}: faqat ${qty} ta qoldi (${want - qty} ta boshqa mijozga sotilgan yoki band).`);
      }
      restored.push({ ...item, qty });
    }
    if (restored.length === 0) {
      alert(
        skipped.length
          ? `Savat ochilmadi — mahsulotlar boshqa mijozga sotilgan yoki band: ${skipped.join(', ')}`
          : 'Savat bo\'sh'
      );
      return;
    }
    setCart(restored);
    setPayMethod(draft.payMethod || 'Naqd');
    setActiveDraftId(draft.id);
    setDraftsDrawerOpen(false);
  };

  const handleDeleteDraft = async (draftId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Bu chernovik o\'chirilsinmi?')) return;
    try {
      await deletePosDraft(draftId);
      if (activeDraftId === draftId) setActiveDraftId(null);
      await loadDrafts();
    } catch (err) {
      alert(err.message || 'O\'chirib bo\'lmadi');
    }
  };

  const activeDraftLabel = posDrafts.find((d) => d.id === activeDraftId)?.label;

  const nasiyaAccounts = useMemo(
    () => creditAccounts
      .filter((a) => String(a.businessId) === String(currentBusinessId))
      .sort((a, b) => b.balance - a.balance || a.customerName.localeCompare(b.customerName, 'uz')),
    [creditAccounts, currentBusinessId],
  );

  const matchedNasiyaAccount = selectedNasiyaAccount;

  const resetNasiyaForm = useCallback(() => {
    setSelectedNasiyaAccount(null);
    setNasiyaCustomer('');
    setNasiyaNewMode(false);
  }, []);

  const checkout = async ({
    method = payMethod,
    customerName = '',
    customerPhone = '',
    creditAccountId = null,
    createNewCreditAccount = false,
  } = {}) => {
    if (cart.length === 0) return;

    for (const item of cart) {
      const maxQty = getMaxQtyForProduct(item.id);
      if (item.qty > maxQty) {
        alert(`${item.name}: faqat ${maxQty} ta sotish mumkin (qoldiq yoki navbatlar band).`);
        return;
      }
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toLocaleDateString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
    const txnId = `TXN-${Date.now().toString().slice(-6)}`;
    const receiptSnapshot = {
      id: txnId,
      date: formattedDate,
      time: formattedTime,
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        barcode: i.barcode,
      })),
      amount: total,
      method,
      customerName: method === 'Nasiya' ? customerName : '',
      customerPhone: method === 'Nasiya' ? customerPhone : '',
      cashier: cashierName,
      storeName: currentBusiness?.name || 'SmartPOS Market',
      itemCount: cart.reduce((s, i) => s + i.qty, 0),
    };

    const newSale = {
      externalId: txnId,
      id: txnId,
      date: now.toISOString().slice(0, 10),
      time: formattedTime,
      items: receiptSnapshot.items,
      amount: total,
      method,
      customerName: method === 'Nasiya' ? customerName : '',
      customerPhone: method === 'Nasiya' ? customerPhone : '',
      creditAccountId: method === 'Nasiya' ? creditAccountId : null,
      createNewCreditAccount: method === 'Nasiya' ? createNewCreditAccount : false,
      cashier: cashierName,
      posDraftId: activeDraftId,
    };

    const result = await addSale(newSale);
    if (!result.ok) {
      alert(result.error || 'Sotuv saqlanmadi');
      return false;
    }

    setReceiptDialog(receiptSnapshot);
    if (activeDraftId) {
      try {
        await deletePosDraft(activeDraftId);
      } catch {
        /* chernovik allaqachon o'chirilgan bo'lishi mumkin */
      }
      setActiveDraftId(null);
      await loadDrafts();
    }
    setCart([]);
    return true;
  };

  const handleNasiyaSale = async () => {
    if (nasiyaNewMode) {
      const name = nasiyaCustomer.trim();
      if (!name) {
        alert('Mijoz ismini kiriting');
        return;
      }
      const ok = await checkout({
        method: 'Nasiya',
        customerName: name,
        createNewCreditAccount: true,
      });
      if (ok) {
        setNasiyaOpen(false);
        resetNasiyaForm();
      }
      return;
    }

    if (!selectedNasiyaAccount) {
      alert('Ro\'yxatdan mijozni tanlang yoki "Yangi mijoz" tugmasini bosing');
      return;
    }
    const ok = await checkout({
      method: 'Nasiya',
      customerName: selectedNasiyaAccount.customerName,
      creditAccountId: selectedNasiyaAccount.id,
    });
    if (ok) {
      setNasiyaOpen(false);
      resetNasiyaForm();
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Kassa sarlavha — monoblok */}
      <div className="shrink-0 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-3 py-2 shadow-md gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton
            onClick={() => setMenuOpen(true)}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', width: 48, height: 48, '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
            aria-label="Menyu"
          >
            <Menu />
          </IconButton>
          <div className="min-w-0">
            <span className="font-bold text-lg block leading-tight">KASSA</span>
            <span className="text-xs text-blue-100 truncate block">{cashierName}</span>
          </div>
          <Chip label="ONLINE" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.25)', color: '#86efac', fontWeight: 700, fontSize: 10, display: { xs: 'none', sm: 'flex' } }} />
        </div>
        <span className="font-mono text-base sm:text-lg font-bold bg-white/15 px-3 py-1.5 rounded-xl shrink-0">
          {time.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)} PaperProps={{ sx: { width: 280 } }}>
        <div className="p-4 border-b flex items-center justify-between">
          <p className="font-bold text-gray-800">Boshqa bo&apos;limlar</p>
          <IconButton size="small" onClick={() => setMenuOpen(false)}><Close /></IconButton>
        </div>
        <List sx={{ py: 1 }}>
          {menuPages.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">Boshqa sahifa yo&apos;q</p>
          ) : (
            menuPages.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => { setMenuOpen(false); navigate(item.path); }}
                sx={{ py: 1.5, minHeight: 52 }}
              >
                <ListItemText primary={item.label} secondary={item.title} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            ))
          )}
        </List>
        <div className="p-4 border-t mt-auto">
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => { setMenuOpen(false); navigate('/products'); }}
            sx={{ ...TOUCH_BTN, borderColor: '#4361ee', color: '#4361ee' }}
          >
            Mahsulotlar
          </Button>
        </div>
      </Drawer>

      <div className="flex flex-1 min-h-0 gap-2 p-2 overflow-hidden">
        {/* Mahsulotlar — scroll */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-w-0">
          <div className="shrink-0 p-2.5 bg-gray-50 border-b border-gray-100 space-y-2">
            <form onSubmit={handleSearchSubmit}>
              <TextField
                inputRef={searchRef}
                placeholder="Qidirish yoki shtrix-kod skaner..."
                value={search}
                onChange={(e) => {
                  const v = e.target.value;
                  searchDraftRef.current = v;
                  setSearch(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'NumpadEnter') {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }
                }}
                autoComplete="off"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search style={{ fontSize: 22, color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: 52,
                    fontSize: 16,
                    borderRadius: 2,
                    bgcolor: '#fff',
                  },
                }}
              />
            </form>
          </div>

          <div className="shrink-0 px-2 py-2 bg-white border-b border-gray-100 space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all min-h-[44px]"
                  style={{
                    background: selectedCat === cat ? '#4361ee' : '#f3f4f6',
                    color: selectedCat === cat ? '#fff' : '#4b5563',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 px-1">{filtered.length} ta mahsulot</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 grid grid-cols-3 xl:grid-cols-4 gap-2.5 content-start bg-[#f8fafc] auto-rows-min">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-16 text-gray-400">Mahsulot topilmadi</div>
            ) : (
              filtered.map((p) => {
                const physical = getProductStock(p.id);
                const available = getMaxQtyForProduct(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => available > 0 && addToCart(p)}
                    disabled={available === 0}
                    className="bg-white rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[128px] flex flex-col gap-2 shadow-sm"
                    style={{ borderColor: available > 0 ? '#e5e7eb' : '#fecaca' }}
                  >
                    <div className="flex items-center gap-2.5 min-h-0">
                      <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-2xl">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover rounded-lg" /> : '📦'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{p.name}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{p.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <p className="text-base font-black text-blue-600 leading-none">{fmt(p.price)}</p>
                      {available > 0 ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          {available} ta
                        </span>
                      ) : physical > 0 ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Band</span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Tugagan</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Savat */}
        <div className="w-[min(420px,38vw)] shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-3 bg-gray-50 border-b border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-gray-800 text-sm uppercase">Savatcha</h2>
              <span className="text-sm font-extrabold bg-blue-600 text-white px-3 py-1 rounded-full">
                {cart.length}
              </span>
            </div>
            {activeDraftLabel && (
              <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                Chernovik: <b>{activeDraftLabel}</b>
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outlined"
                startIcon={<PauseCircleOutlined />}
                onClick={saveCartToDraft}
                disabled={cart.length === 0 || draftSaving}
                sx={{
                  flex: 1, ...TOUCH_BTN,
                  borderColor: '#f59e0b', color: '#b45309',
                  '&:hover': { borderColor: '#d97706', bgcolor: '#fffbeb' },
                }}
              >
                Navbat
              </Button>
              <Badge badgeContent={posDrafts.length} color="warning" max={99}>
                <Button
                  variant="contained"
                  startIcon={<PlaylistPlay />}
                  onClick={() => setDraftsDrawerOpen(true)}
                  sx={{ ...TOUCH_BTN, bgcolor: '#6366f1', boxShadow: 'none', '&:hover': { bgcolor: '#4f46e5' } }}
                >
                  Ro&apos;yxat
                </Button>
              </Badge>
            </div>
          </div>

          {/* Cart Items Table */}
          <div className="flex-1 overflow-y-auto bg-white">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center space-y-2">
                <CategoryOutlined style={{ fontSize: 40, color: '#d1d5db' }} />
                <p className="text-xs font-semibold text-gray-500">Savat hozircha bo'sh</p>
                <p className="text-[10px] text-gray-400">Kassaga mahsulot qo'shish uchun chap tomondagi kartalarni bosing yoki shtrix-kodni skanerlang.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100 text-xs text-gray-500 uppercase font-bold">
                    <th className="p-2 pl-3">Mahsulot</th>
                    <th className="p-2 text-center w-32">Soni</th>
                    <th className="p-2 text-right">Summa</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <tr key={item.id} className="text-sm hover:bg-gray-50/55">
                      <td className="p-2 pl-3 min-w-0">
                        <p className="font-bold text-gray-800 truncate max-w-[120px]" title={item.name}>{item.name}</p>
                        <p className="text-xs text-blue-600 font-semibold">{fmt(item.price)}</p>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-between border-2 border-gray-200 rounded-xl bg-white p-1 w-[120px]">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg font-bold text-lg active:bg-gray-200"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => openQtyEditor(item)}
                            className="text-base font-bold text-blue-600 min-w-[36px] text-center py-1 rounded-lg active:bg-blue-50"
                          >
                            {item.qty}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg font-bold text-lg active:bg-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-2 text-right font-bold text-gray-800 text-sm">
                        {fmt(item.price * item.qty).replace(" so'm", "")}
                      </td>
                      <td className="p-2 text-center">
                        <IconButton
                          onClick={() => removeItem(item.id)}
                          sx={{
                            color: '#ef4444',
                            bgcolor: '#fef2f2',
                            border: '1px solid #fee2e2',
                            borderRadius: 2,
                            width: 44,
                            height: 44,
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary & Payment */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-150 space-y-2 shadow-inner">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Turlar soni:</span>
                <span className="font-semibold text-gray-700">{cart.length} xil</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Dona soni:</span>
                <span className="font-semibold text-gray-700">{cart.reduce((sum, item) => sum + item.qty, 0)} ta</span>
              </div>
              <Divider sx={{ my: 1 }} />
              <div className="flex justify-between items-center">
                <span className="text-sm uppercase text-gray-500 font-bold">Jami:</span>
                <span className="text-blue-600 font-black text-2xl">{fmt(total)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <p className="text-xs uppercase font-bold text-gray-400 mb-2">To&apos;lov</p>
              <div className="flex gap-2">
                {['Naqd', 'Karta', 'Online'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className="flex-1 font-bold rounded-xl transition-all min-h-[48px] text-sm"
                    style={{
                      background: payMethod === m ? '#4361ee' : '#f3f4f6',
                      color: payMethod === m ? '#fff' : '#4b5563',
                      border: payMethod === m ? 'none' : '1px solid #e5e7eb',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) return;
                  resetNasiyaForm();
                  setNasiyaOpen(true);
                }}
                disabled={cart.length === 0 || saving}
                className="w-full mt-2 font-bold rounded-xl transition-all min-h-[48px] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '2px solid #f59e0b',
                }}
              >
                Nasiya (qarzga)
              </button>
            </div>

            <Button
              fullWidth
              variant="contained"
              startIcon={<ShoppingCartCheckout sx={{ fontSize: 26 }} />}
              onClick={() => checkout()}
              disabled={cart.length === 0 || saving}
              sx={{
                bgcolor: '#4361ee',
                color: '#fff',
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 800,
                fontSize: 17,
                minHeight: 56,
                py: 1.5,
                boxShadow: '0 4px 14px rgba(67,97,238,0.35)',
                '&:hover': { bgcolor: '#3451d1' },
                '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
              }}
            >
              {saving ? 'Saqlanmoqda...' : 'SOTISH'}
            </Button>
          </div>
        </div>
      </div>

      {/* Miqdor kiritish */}
      <Dialog open={!!qtyEditItem} onClose={() => setQtyEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          Miqdor: {qtyEditItem?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <p className="text-xs text-gray-500 mb-2">
            Maksimal: <b>{qtyEditItem ? getMaxQtyForProduct(qtyEditItem.id) : 0}</b> ta
          </p>
          <TextField
            fullWidth
            size="small"
            label="Soni"
            type="number"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => e.key === 'Enter' && applyQtyInput()}
            inputProps={{ min: 1, max: qtyEditItem ? getMaxQtyForProduct(qtyEditItem.id) : 999 }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 18, fontWeight: 700 } }}
          />
          <div className="grid grid-cols-3 gap-2">
            {NUMPAD.map((key) => (
              <Button
                key={key}
                variant={key === 'OK' ? 'contained' : 'outlined'}
                onClick={() => handleNumpad(key)}
                sx={{
                  minHeight: 52,
                  fontSize: 18,
                  fontWeight: 700,
                  borderRadius: 2,
                  ...(key === 'OK'
                    ? { bgcolor: '#4361ee', '&:hover': { bgcolor: '#3451d1' } }
                    : { borderColor: '#e5e7eb', color: '#374151' }),
                }}
              >
                {key}
              </Button>
            ))}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQtyEditItem(null)}>Bekor</Button>
          <Button variant="contained" onClick={applyQtyInput} sx={{ bgcolor: '#4361ee' }}>
            Tasdiqlash
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kutilayotgan savatlar (chernoviklar) */}
      <Drawer
        anchor="right"
        open={draftsDrawerOpen}
        onClose={() => setDraftsDrawerOpen(false)}
        PaperProps={{ sx: { width: 340 } }}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Navbatdagi savatlar</h3>
            <p className="text-xs text-gray-500">Mijoz ketganda saqlangan chernoviklar</p>
          </div>
          <IconButton size="small" onClick={() => setDraftsDrawerOpen(false)}>
            <Close />
          </IconButton>
        </div>
        <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {posDrafts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 px-4">
              Hozircha navbat yo&apos;q. Savatni to&apos;ldirib «Navbatga saqlash» tugmasini bosing.
            </p>
          ) : (
            posDrafts.map((draft) => (
              <button
                key={draft.id}
                type="button"
                onClick={() => restoreDraft(draft)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeDraftId === draft.id
                    ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100'
                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{draft.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {draft.items?.length || 0} xil · {draft.itemCount || 0} dona
                    </p>
                    <p className="text-xs font-bold text-blue-600 mt-1">{fmt(draft.total)}</p>
                  </div>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    sx={{ color: '#ef4444' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Bosib davom ettiring →</p>
              </button>
            ))
          )}
        </div>
      </Drawer>

      {/* Termal chek — ekranda (keyin printer/terminal) */}
      {receiptDialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 print:bg-white print:p-0"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto print:overflow-visible">
            <div
              id="pos-receipt-slip"
              className="w-[min(340px,92vw)] bg-[#faf9f6] text-black shadow-2xl print:shadow-none font-mono text-[12px] leading-relaxed px-5 py-6"
              style={{ fontFamily: '"Courier New", Courier, monospace' }}
            >
              <p className="text-center text-[15px] font-black uppercase tracking-wide">
                {receiptDialog.storeName}
              </p>
              <p className="text-center text-[10px] mt-1 text-gray-600">
                Kassa / POS tizimi
              </p>
              <p className="text-center text-[10px] text-gray-600">
                {receiptDialog.date} &nbsp; {receiptDialog.time}
              </p>
              <p className="text-center text-[10px] font-bold mt-1">
                CHEK № {receiptDialog.id}
              </p>

              <p className="text-center my-2 text-[10px]">{receiptLine}</p>
              <p className="text-center text-[11px] font-bold uppercase mb-3">
                Tovar chek / Savdo cheki
              </p>

              {receiptDialog.items.map((item, idx) => (
                <div key={idx} className="mb-3">
                  <p className="font-bold text-[11px] leading-snug">{item.name}</p>
                  {item.barcode && (
                    <p className="text-[9px] text-gray-500">{item.barcode}</p>
                  )}
                  <div className="flex justify-between gap-2 mt-0.5 text-[11px]">
                    <span>{item.qty} x {fmtNum(item.price)}</span>
                    <span className="font-bold">{fmtNum(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}

              <p className="text-center my-2 text-[10px]">{receiptLine}</p>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Mahsulot turlari:</span>
                  <span>{receiptDialog.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jami dona:</span>
                  <span>{receiptDialog.itemCount} ta</span>
                </div>
                <div className="flex justify-between">
                  <span>To&apos;lov turi:</span>
                  <span className="font-bold">{receiptDialog.method}</span>
                </div>
                {receiptDialog.method === 'Nasiya' && receiptDialog.customerName && (
                  <div className="flex justify-between">
                    <span>Mijoz:</span>
                    <span className="font-bold">
                      {receiptDialog.customerName}
                      {receiptDialog.customerPhone ? ` · ${receiptDialog.customerPhone}` : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Kassir:</span>
                  <span>{receiptDialog.cashier}</span>
                </div>
              </div>

              <p className="text-center my-3 text-[10px]">{receiptLine}</p>

              <div className="text-right">
                <p className="text-[10px] uppercase text-gray-600 mb-1">Jami to&apos;lov</p>
                <p className="text-[28px] font-black leading-none tracking-tight">
                  {fmtNum(receiptDialog.amount)}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">so&apos;m</p>
              </div>

              <p className="text-center mt-4 text-[10px] text-gray-500">
                *** Xaridingiz uchun rahmat! ***
              </p>
              <p className="text-center text-[9px] text-gray-400 mt-1">
                Keyinchalik terminal printerdan chiqadi
              </p>
            </div>

            <div className="flex gap-2 w-[min(340px,92vw)] print:hidden">
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Print />}
                onClick={() => window.print()}
                sx={{
                  bgcolor: '#fff',
                  borderColor: '#fff',
                  color: '#111',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#f3f4f6', borderColor: '#fff' },
                }}
              >
                Chop etish
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setReceiptDialog(null)}
                sx={{
                  bgcolor: '#4361ee',
                  fontWeight: 800,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#3451d1' },
                }}
              >
                Yangi savdo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Nasiya — mijoz tanlash */}
      <Dialog
        open={nasiyaOpen}
        onClose={() => {
          if (!saving) {
            setNasiyaOpen(false);
            resetNasiyaForm();
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Nasiya (qarzga) sotish</DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-500 mb-3">
            Mavjud mijozni tanlang yoki bir xil ism bo&apos;lsa &quot;Yangi mijoz&quot; bosing.
          </p>

          <div className="flex gap-2 mb-3">
            <Button
              fullWidth
              variant={!nasiyaNewMode ? 'contained' : 'outlined'}
              onClick={() => setNasiyaNewMode(false)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Mavjud mijoz
            </Button>
            <Button
              fullWidth
              variant={nasiyaNewMode ? 'contained' : 'outlined'}
              onClick={() => {
                setNasiyaNewMode(true);
                setSelectedNasiyaAccount(null);
              }}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Yangi mijoz
            </Button>
          </div>

          {!nasiyaNewMode ? (
            <>
              <Autocomplete
                autoHighlight
                options={nasiyaAccounts}
                value={selectedNasiyaAccount}
                onChange={(_, val) => setSelectedNasiyaAccount(val)}
                getOptionLabel={(opt) => formatNasiyaOption(opt)}
                filterOptions={(opts, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return opts.filter((a) => a.balance > 0).slice(0, 10);
                  return opts.filter(
                    (a) => a.customerName.toLowerCase().includes(q)
                      || (a.phone && a.phone.includes(q)),
                  );
                }}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                disabled={saving}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div className="py-0.5">
                      <p className="font-medium">{option.customerName}</p>
                      <p className="text-xs text-gray-500">
                        <span className="text-amber-700 font-bold">{fmtNum(option.balance)} so&apos;m qarz</span>
                      </p>
                    </div>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    label="Mijoz qidirish"
                    placeholder="Ism bo'yicha qidiring"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNasiyaSale();
                      }
                    }}
                  />
                )}
              />

              {nasiyaAccounts.some((a) => a.balance > 0) && !selectedNasiyaAccount && (
                <div className="mt-3">
                  <p className="text-[11px] uppercase font-bold text-gray-400 mb-2">Tez tanlash</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nasiyaAccounts.filter((a) => a.balance > 0).slice(0, 6).map((a) => (
                      <Chip
                        key={a.id}
                        label={`${a.customerName} · ${fmtNum(a.balance)}`}
                        size="small"
                        onClick={() => setSelectedNasiyaAccount(a)}
                        sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <TextField
              autoFocus
              fullWidth
              label="Mijoz ismi"
              placeholder="Masalan: Botir"
              value={nasiyaCustomer}
              onChange={(e) => setNasiyaCustomer(e.target.value)}
              disabled={saving}
              helperText="Bir xil ism bo'lsa ham yangi alohida hisob ochiladi"
            />
          )}

          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm space-y-1">
            <p>
              <span className="text-gray-600">Bu savdo: </span>
              <b>{fmt(total)}</b>
            </p>
            {matchedNasiyaAccount ? (
              <>
                <p>
                  <span className="text-gray-600">Tanlangan: </span>
                  <b>{matchedNasiyaAccount.customerName}</b>
                  {matchedNasiyaAccount.phone ? ` · ${matchedNasiyaAccount.phone}` : ''}
                </p>
                <p>
                  <span className="text-gray-600">Hozirgi qarz: </span>
                  <b>{fmt(matchedNasiyaAccount.balance)}</b>
                </p>
                <p className="text-amber-800 font-bold">
                  Savdodan keyin jami: {fmt(matchedNasiyaAccount.balance + total)}
                </p>
              </>
            ) : nasiyaNewMode && nasiyaCustomer.trim() ? (
              <p className="text-gray-600">Yangi mijoz hisobi ochiladi.</p>
            ) : null}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setNasiyaOpen(false);
              resetNasiyaForm();
            }}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleNasiyaSale}
            disabled={
              saving
              || (!nasiyaNewMode && !selectedNasiyaAccount)
              || (nasiyaNewMode && !nasiyaCustomer.trim())
            }
            sx={{
              bgcolor: '#f59e0b',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#d97706' },
            }}
          >
            {saving ? 'Saqlanmoqda...' : 'Qarzga yozish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Assistant Drawer */}
      <Drawer anchor="right" open={aiOpen} onClose={() => setAiOpen(false)}>
        <div className="w-80 p-5 flex flex-col justify-between h-full bg-[#1e1b4b] text-white">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Assistant className="text-purple-400" />
                <h2 className="font-bold text-base">POS AI Ko'makchisi</h2>
              </div>
              <IconButton onClick={() => setAiOpen(false)} size="small" sx={{ color: '#fff' }}>
                <Close />
              </IconButton>
            </div>

            <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
              <p>Salom! Men sizga POS dasturidagi asosiy funksiyalar va imkoniyatlarni tushuntiraman:</p>
              
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">💡 Mahsulotlarni sotish (Kassa)</p>
                <p>O'ng tomondagi ro'yxatdan mahsulotlarni tanlab savatga qo'shing. To'lov usulini belgilang va "Sotish" tugmasini bosing.</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">📦 Sklad / Prixod nazorati</p>
                <p>Dilerga buyurtma (Zakaz) bering. Prixod bo'limidan kelgan mahsulotlarni qabul qiling, bu mahsulotlar avtomatik ravishda ombor qoldig'iga qo'shiladi.</p>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-bold text-purple-400 mb-1">👥 Agentlar va CRM</p>
                <p>Mijozlarni ro'yxatga oling. Agentlar orqali buyurtmalarni tarqating va ularning statistikasini alohida kuzating.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 text-[10px] text-gray-400 text-center">
            POS System AI • v1.0.0
          </div>
        </div>
      </Drawer>
    </div>
  );
}
