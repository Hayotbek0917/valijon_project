import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { fetchPosDrafts, createPosDraft, deletePosDraft } from '../api/pos';
import { NAV_MAIN, NAV_BOTTOM, filterByRole } from '../config/navigation';
import { canAccessRoute } from '../config/roles';
import {
  Search, Add, Remove, Delete, ShoppingCartCheckout,
  CategoryOutlined, CalendarToday, Assistant, Close,
  PauseCircleOutlined, PlaylistPlay, Menu, ArrowBack,
} from '@mui/icons-material';
import { Button, Chip, Divider, IconButton, InputAdornment, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Drawer, Badge, List, ListItemButton, ListItemText } from '@mui/material';

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";
const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
const TOUCH_BTN = { minHeight: 48, fontSize: 15, fontWeight: 700, borderRadius: 12, textTransform: 'none' };

export default function POS() {
  const navigate = useNavigate();
  const { getBusinessProducts, getProductStock, addSale, saving, currentBusinessId } = useApp();
  const { currentUser } = useAuth();
  const cashierName = currentUser?.name ?? 'Kassir';
  
  const [search, setSearch] = useState('');
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

  const businessProducts = getBusinessProducts();

  // Show all products in POS
  const activeProducts = businessProducts;

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

  useEffect(() => {
    if (!search.trim()) return;
    const barcodeTrimmed = search.trim();
    const exactMatch = activeProducts.find(p => p.barcode === barcodeTrimmed);
    if (exactMatch) {
      setCart((prev) => {
        const existing = prev.find((i) => i.id === exactMatch.id);
        const maxQty = getMaxQtyForProduct(exactMatch.id);
        if (maxQty < 1) {
          alert(`${exactMatch.name}: boshqa navbatda band — sotish uchun qolmagan!`);
          return prev;
        }
        if (existing) {
          if (!canAddMoreToCart(exactMatch.id, existing.qty)) {
            alert("Skladda yetarli mahsulot yo'q (navbatlarda band qilingan)!");
            return prev;
          }
          return prev.map((i) => i.id === exactMatch.id ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, { ...exactMatch, qty: 1 }];
      });
      setSearch('');
    }
  }, [search, activeProducts, getMaxQtyForProduct, canAddMoreToCart]);

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

  const checkout = async () => {
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
    const formattedDate = now.toISOString().slice(0, 10);
    const txnId = `TXN-${Date.now().toString().slice(-6)}`;

    const newSale = {
      externalId: txnId,
      id: txnId,
      date: formattedDate,
      time: formattedTime,
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      amount: total,
      method: payMethod,
      cashier: cashierName,
      posDraftId: activeDraftId,
    };

    const result = await addSale(newSale);
    if (!result.ok) {
      alert(result.error);
      return;
    }

    setReceiptDialog(newSale);
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
          <div className="shrink-0 p-2.5 bg-gray-50 border-b border-gray-100">
            <TextField
              placeholder="Qidirish yoki shtrix-kod..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            </div>

            <Button
              fullWidth
              variant="contained"
              startIcon={<ShoppingCartCheckout sx={{ fontSize: 26 }} />}
              onClick={checkout}
              disabled={cart.length === 0}
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
              SOTISH
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

      {/* Success Dialog Receipt Details */}
      <Dialog open={!!receiptDialog} onClose={() => setReceiptDialog(null)} maxWidth="xs" fullWidth>
        {receiptDialog && (
          <>
            <DialogTitle sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 'bold', fontSize: 16, py: 2, px: 3, textAlign: 'center' }}>
              Xarid Muvaffaqiyatli Yakunlandi!
            </DialogTitle>
            <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <div className="text-center font-bold text-sm text-gray-800 border-b border-gray-100 pb-2 uppercase tracking-widest text-[11px]">
                SAVDO CHEKI / RECEIPT
              </div>
              <div className="bg-gray-50 border rounded-2xl p-4 text-xs space-y-2 font-mono">
                <div className="flex justify-between"><span className="text-gray-400">Tranzaksiya ID:</span> <b className="text-gray-700">{receiptDialog.id}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Sana / Vaqt:</span> <b className="text-gray-700">{receiptDialog.date} {receiptDialog.time}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Kassir:</span> <b className="text-gray-700">{receiptDialog.cashier}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">To'lov turi:</span> <b className="text-gray-700">{receiptDialog.method}</b></div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Mahsulotlar</p>
                <div className="border rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                        <th className="p-2 pl-3">Mahsulot nomi</th>
                        <th className="p-2 text-center">Soni</th>
                        <th className="p-2 text-right pr-3">Jami</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {receiptDialog.items.map((item, idx) => (
                        <tr key={idx} className="text-gray-700">
                          <td className="p-2 pl-3 font-semibold">{item.name}</td>
                          <td className="p-2 text-center font-mono">{item.qty} ta</td>
                          <td className="p-2 text-right pr-3 font-mono font-bold">{fmt(item.price * item.qty).replace(" so'm", "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-3 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-xs text-green-800">To'langan jami summa:</span>
                <span className="font-extrabold text-green-600 text-base font-mono">{fmt(receiptDialog.amount)}</span>
              </div>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
              <Button 
                onClick={() => setReceiptDialog(null)} 
                variant="contained" 
                fullWidth
                sx={{ 
                  bgcolor: '#4361ee', 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 'bold',
                  py: 1,
                  '&:hover': { bgcolor: '#3451d1' } 
                }}
              >
                Chekni Yopish
              </Button>
            </DialogActions>
          </>
        )}
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
