import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Add, Search,
  Inventory2, WarningAmber, TrendingDown,
  LocalShipping, ExpandMore, ExpandLess,
} from '@mui/icons-material';
import {
  Button, Chip, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, Collapse, IconButton,
} from '@mui/material';
import { PRICE_FILTER_OPTIONS, matchesPriceFilter } from '../config/priceFilters';
import { formatCurrency } from '../utils/format';

const stockStatus = (qty) => {
  if (qty === 0) return { label: 'Tugagan', bg: '#fee2e2', color: '#ef4444' };
  if (qty <= 5) return { label: 'Kam', bg: '#fff7ed', color: '#f97316' };
  return { label: 'Yetarli', bg: '#f0fdf4', color: '#22c55e' };
};

export default function Products() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canEdit = permissions.editProducts;
  const showCost = permissions.viewProductCost;
  const {
    getBusinessProducts,
    categories,
    selectedWarehouseId,
    setSelectedWarehouseId,
    activeBusinessWarehouses,
    getProductStock,
    getIncomingAlerts,
    addProduct,
    addCatalogToProducts,
    removeProduct,
    saving,
  } = useApp();

  const { unlinkedCatalog, pendingReceipts } = getIncomingAlerts();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('Barchasi');
  const [priceFilter, setPriceFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [showIncoming, setShowIncoming] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', cost: '', barcode: '', image: '' });

  const productsWithStock = getBusinessProducts().map((p) => ({
    ...p,
    stock: getProductStock(p.id, selectedWarehouseId),
  }));

  const lowStockCount = productsWithStock.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = productsWithStock.filter((p) => p.stock === 0).length;
  const totalStockSum = productsWithStock.reduce((s, p) => s + p.stock, 0);

  const categoryOptions = ['Barchasi', ...new Set(productsWithStock.map((p) => p.category))];

  const filtered = productsWithStock.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    if (!matchesSearch) return false;
    if (filterCategory !== 'Barchasi' && p.category !== filterCategory) return false;
    if (!matchesPriceFilter(p.price, priceFilter)) return false;
    if (filterType === 'low') return p.stock > 0 && p.stock <= 5;
    if (filterType === 'out') return p.stock === 0;
    return true;
  });

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', category: categories[0] || '', price: '', cost: '', barcode: '', image: '' });
    setOpenDialog(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      cost: p.cost,
      barcode: p.barcode || '',
      image: p.image || ''
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    const newPrice = parseFloat(form.price) || 0;
    const newCost = parseFloat(form.cost) || 0;

    const result = await addProduct({
      name: form.name,
      category: form.category,
      price: newPrice,
      cost: newCost,
      barcode: form.barcode,
      emoji: form.image || '📦',
      isDraft: false,
    }, editProduct?.id);

    if (!result.ok) {
      alert(result.error);
      return;
    }
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("O'chirishni tasdiqlaysizmi?")) {
      const result = await removeProduct(id);
      if (!result.ok) alert(result.error);
    }
  };

  const handleRegisterCatalogItem = async (item) => {
    const cost = item.defaultCost || 0;
    const defaultPrice = cost ? Math.round(cost * 1.3) : 0;
    const priceStr = window.prompt(
      `"${item.name}" uchun sotuv narxini kiriting (so'm):`,
      String(defaultPrice),
    );
    if (priceStr === null) return;
    const sellingPrice = parseFloat(priceStr);
    if (!sellingPrice || sellingPrice <= 0) {
      alert('Narx 0 dan katta bo\'lishi kerak');
      return;
    }
    const result = await addCatalogToProducts(item.supplierId, item.id, { sellingPrice });
    if (!result.ok) alert(result.error);
  };

  const handleRegisterAllCatalog = async () => {
    if (!window.confirm(`${unlinkedCatalog.length} ta mahsulotni ro'yxatga qo'shasizmi? (standart narx: tannarx + 30%)`)) return;
    for (const item of unlinkedCatalog) {
      const cost = item.defaultCost || 0;
      const sellingPrice = cost ? Math.round(cost * 1.3) : 1000;
      const result = await addCatalogToProducts(item.supplierId, item.id, { sellingPrice });
      if (!result.ok) {
        alert(`${item.name}: ${result.error}`);
        break;
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const applyFilter = (type) => {
    setFilterType(type);
  };

  const warehouseName = activeBusinessWarehouses.find((w) => w.id === selectedWarehouseId)?.name || 'Asosiy ombor';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mahsulotlar</h1>
          <p className="text-sm text-gray-500">
            Mahsulotlar, narxlar va ombor qoldiqlari ({warehouseName})
          </p>
        </div>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openAdd}
            sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}
          >
            Mahsulot qo'shish
          </Button>
        )}
      </div>

      {(unlinkedCatalog.length > 0 || pendingReceipts.length > 0) && (
        <Alert
          severity="warning"
          sx={{ borderRadius: 2, alignItems: 'flex-start' }}
          action={
            unlinkedCatalog.length > 0 ? (
              <IconButton size="small" onClick={() => setShowIncoming((v) => !v)} aria-label="Yig'ish">
                {showIncoming ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            ) : null
          }
        >
          <div className="space-y-1">
            {unlinkedCatalog.length > 0 && (
              <p className="font-semibold text-sm">
                {unlinkedCatalog.length} ta yangi mahsulot diler katalogida — Mahsulotlar ro&apos;yxatiga qo&apos;shilmagan
              </p>
            )}
            {pendingReceipts.length > 0 && (
              <p className="text-sm">
                {pendingReceipts.length} ta prixod kutilmoqda —{' '}
                <button
                  type="button"
                  className="underline font-semibold text-inherit"
                  onClick={() => navigate('/dilerlar/prixod')}
                >
                  Qabul qilish
                </button>
              </p>
            )}
          </div>
        </Alert>
      )}

      <Collapse in={showIncoming && unlinkedCatalog.length > 0}>
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div>
              <p className="font-bold text-gray-800 text-sm">Yangi kelgan mol (diler katalogi)</p>
              <p className="text-xs text-gray-500">Ro&apos;yxatga qo&apos;shgandan keyin prixod orqali qoldiq to&apos;ldirasiz</p>
            </div>
            {canEdit && unlinkedCatalog.length > 1 && (
              <Button
                size="small"
                variant="contained"
                onClick={handleRegisterAllCatalog}
                disabled={saving}
                sx={{ bgcolor: '#4361ee', textTransform: 'none', fontSize: 12 }}
              >
                Hammasini qo&apos;shish
              </Button>
            )}
          </div>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#fffbeb', fontWeight: 700, fontSize: 11 } }}>
                  <TableCell>Mahsulot</TableCell>
                  <TableCell>Diler</TableCell>
                  <TableCell>O&apos;lchov</TableCell>
                  {showCost && <TableCell>Tannarx</TableCell>}
                  {canEdit && <TableCell align="right">Amal</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {unlinkedCatalog.map((item) => (
                  <TableRow key={`${item.supplierId}-${item.id}`} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell>
                      <Chip label={item.supplierName} size="small" sx={{ fontSize: 10 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#6b7280' }}>{item.unit || 'dona'}</TableCell>
                    {showCost && (
                      <TableCell sx={{ fontSize: 12 }}>{formatCurrency(item.defaultCost || 0)}</TableCell>
                    )}
                    {canEdit && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => handleRegisterCatalogItem(item)}
                          disabled={saving}
                          sx={{ textTransform: 'none', fontSize: 11 }}
                        >
                          Qo&apos;shish
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {pendingReceipts.length > 0 && (
            <div className="px-4 py-3 border-t border-amber-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <LocalShipping style={{ fontSize: 18, color: '#4361ee' }} />
                <span>{pendingReceipts.length} ta buyurtma prixod kutmoqda</span>
              </div>
              <Button
                size="small"
                onClick={() => navigate('/dilerlar/prixod')}
                sx={{ textTransform: 'none', color: '#4361ee' }}
              >
                Prixodga o&apos;tish →
              </Button>
            </div>
          )}
        </div>
      </Collapse>

      {/* Qoldiq statistikasi — bosilsa filtrlanadi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => applyFilter('all')}
          className={`text-left bg-white rounded-xl p-4 shadow-sm border transition-all ${
            filterType === 'all' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Inventory2 style={{ color: '#4361ee', fontSize: 20 }} />
            <span className="text-xs text-gray-500">Jami mahsulot</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{productsWithStock.length}</p>
        </button>
        <button
          type="button"
          onClick={() => applyFilter('all')}
          className="text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-gray-200"
        >
          <div className="flex items-center gap-2 mb-1">
            <Inventory2 style={{ color: '#22c55e', fontSize: 20 }} />
            <span className="text-xs text-gray-500">Jami qoldiq</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{totalStockSum} dona</p>
        </button>
        <button
          type="button"
          onClick={() => applyFilter('low')}
          className={`text-left bg-white rounded-xl p-4 shadow-sm border transition-all ${
            filterType === 'low' ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown style={{ color: '#f97316', fontSize: 20 }} />
            <span className="text-xs text-gray-500">Kam qolgan (≤5)</span>
          </div>
          <p className="text-xl font-bold text-orange-600">{lowStockCount} ta</p>
        </button>
        <button
          type="button"
          onClick={() => applyFilter('out')}
          className={`text-left bg-white rounded-xl p-4 shadow-sm border transition-all ${
            filterType === 'out' ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-100 hover:border-red-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <WarningAmber style={{ color: '#ef4444', fontSize: 20 }} />
            <span className="text-xs text-gray-500">Tugagan</span>
          </div>
          <p className="text-xl font-bold text-red-600">{outOfStockCount} ta</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center bg-white p-4 rounded-xl border border-gray-100">
        {activeBusinessWarehouses.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Ombor</InputLabel>
            <Select
              label="Ombor"
              value={selectedWarehouseId ?? ''}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
            >
              {activeBusinessWarehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Kategoriya</InputLabel>
          <Select label="Kategoriya" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {categoryOptions.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Narx</InputLabel>
          <Select label="Narx" value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
            {PRICE_FILTER_OPTIONS.map((pf) => (
              <MenuItem key={pf.id} value={pf.id}>{pf.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="Qidirish..."
          value={search}
          onChange={handleSearchChange}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
        <span className="text-sm text-gray-500 w-full sm:w-auto">{filtered.length} ta</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col max-h-[calc(100vh-320px)]">
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>#</TableCell>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Kategoriya</TableCell>
                <TableCell>Narx</TableCell>
                {showCost && <TableCell>Tannarx</TableCell>}
                {showCost && <TableCell>Foyda</TableCell>}
                <TableCell>Qoldiq (omborda)</TableCell>
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showCost ? 8 : 6} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                    Mahsulotlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => {
                  const stock = p.stock;
                  const status = stockStatus(stock);
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      onClick={canEdit ? () => openEdit(p) : undefined}
                      style={{ cursor: canEdit ? 'pointer' : 'default' }}
                      sx={{ 
                        '& td': { py: 1.5, fontSize: 13 },
                        bgcolor: i % 2 === 0 ? '#ffffff' : '#f4f9ff',
                        '&:hover': {
                          bgcolor: i % 2 === 0 ? '#f1f5f9 !important' : '#eaf4ff !important'
                        }
                      }}
                    >
                      <TableCell sx={{ color: '#9ca3af' }}>{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-[#f2f2f2] flex items-center justify-center shrink-0 border border-[#e5e5e5] overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">📦</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-800">{p.name}</p>
                            </div>
                            <p className="text-xs text-gray-400">{p.barcode || 'Shtrix-kod yo\'q'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.category} size="small" sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#4361ee' }}>{formatCurrency(p.price)}</TableCell>
                      {showCost && <TableCell sx={{ color: '#6b7280' }}>{formatCurrency(p.cost)}</TableCell>}
                      {showCost && (
                        <TableCell sx={{ fontWeight: 600, color: '#22c55e' }}>+{formatCurrency(p.price - p.cost)}</TableCell>
                      )}
                      <TableCell sx={{ fontWeight: 600 }}>{stock} ta</TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{ fontSize: 11, bgcolor: status.bg, color: status.color, fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Dialog — faqat tahrirlash huquqi bo'lsa */}
      {canEdit && (
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <TextField
              label="Nomi"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              size="small"
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
              <InputLabel id="category-select-label">Kategoriya</InputLabel>
              <Select
                labelId="category-select-label"
                label="Kategoriya"
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                MenuProps={{ disablePortal: true }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Narx (so'm)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              size="small"
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              label="Tannarx (so'm)"
              type="number"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Shtrix-kod"
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <div className="flex flex-col gap-1 justify-center">
              <label className="text-xs text-gray-500 font-semibold">Mahsulot rasmi (ixtiyoriy)</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{ textTransform: 'none', fontSize: 12, py: 0.7 }}
                >
                  Rasm yuklash
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm(f => ({ ...f, image: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
                {form.image && (
                  <div className="flex items-center gap-1">
                    <img src={form.image} alt="Preview" className="w-8 h-8 object-cover rounded border" />
                    <Button
                      color="error"
                      size="small"
                      onClick={() => setForm(f => ({ ...f, image: '' }))}
                      sx={{ textTransform: 'none', fontSize: 10, minWidth: 'auto', p: 0.5 }}
                    >
                      O'chirish
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Bekor qilish</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </div>
  );
}
