import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, LocalShipping, CheckCircle } from '@mui/icons-material';
import {
  Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { typeLabels } from '../config/dealerProducts';
import { formatCurrency } from '../utils/format';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } };

export default function DealerReceipts() {
  const {
    dealerOrders, activeBusinessWarehouses, selectedWarehouseId,
    setSelectedWarehouseId, currentBusinessId, confirmPurchaseReceipt, saving,
  } = useApp();
  const [search, setSearch] = useState('');
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);
  const [receivedQty, setReceivedQty] = useState('');
  const [damagedQty, setDamagedQty] = useState('0');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const businessOrders = dealerOrders.filter(o => o.businessId === currentBusinessId);
  const pendingOrders = businessOrders.filter(o => o.status === 'Kutilmoqda');

  const filtered = pendingOrders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const startReceipt = (order) => {
    setActiveReceiptOrder(order);
    const firstItemQty = order.items[0]?.quantity || 0;
    setReceivedQty(String(firstItemQty));
    setDamagedQty('0');
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setError('');
  };

  const handleConfirmReceipt = async () => {
    if (!activeReceiptOrder || !receivedQty) return;
    setError('');

    const recQtyVal = parseInt(receivedQty, 10);
    const lines = activeReceiptOrder.items.map((item, idx) => ({
      line_id: item.lineId,
      received_qty: idx === 0 ? recQtyVal : item.quantity,
      damaged_qty: idx === 0 ? (parseInt(damagedQty, 10) || 0) : 0,
    })).filter((l) => l.line_id);

    const result = await confirmPurchaseReceipt(activeReceiptOrder.dbId, {
      warehouseId: selectedWarehouseId,
      receiptDate,
      lines,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    alert("Prixod muvaffaqiyatli qabul qilindi va mahsulotlar skladga qo'shildi!");
    setActiveReceiptOrder(null);
  };

  const item = activeReceiptOrder?.items[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dilerlar - Prixod (Qabul)</h1>
        <p className="text-sm text-gray-500">{pendingOrders.length} ta kutilayotgan buyurtma</p>
      </div>

      <TextField size="small" placeholder="Qidirish..." value={search}
        onChange={(e) => setSearch(e.target.value)} sx={{ width: 320 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                <TableCell>ID</TableCell>
                <TableCell>Diler</TableCell>
                <TableCell>Summa</TableCell>
                <TableCell>Sana</TableCell>
                <TableCell align="right">Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9ca3af' }}>Kutilayotgan buyurtmalar yo&apos;q</TableCell></TableRow>
              ) : filtered.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.supplierName}</TableCell>
                  <TableCell>{formatCurrency(o.total)}</TableCell>
                  <TableCell>{o.date}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" startIcon={<LocalShipping />}
                      onClick={() => startReceipt(o)}
                      sx={{ bgcolor: '#4361ee', textTransform: 'none', fontSize: 12 }}>Qabul qilish</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog
        open={!!activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {activeReceiptOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 18, pb: 1 }}>
              Prixod qabul qilish ({activeReceiptOrder.id})
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="bg-blue-50 p-4 rounded-xl text-sm space-y-2 border border-blue-100">
                <p><span className="text-gray-500">Diler:</span> <b>{activeReceiptOrder.supplierName}</b></p>
                <p><span className="text-gray-500">Zakaz sanasi:</span> <b>{activeReceiptOrder.date}</b></p>
                {item && (
                  <>
                    <p><span className="text-gray-500">Mahsulot:</span> <b>{item.name}</b></p>
                    <p>
                      <span className="text-gray-500">Buyurtma qilingan:</span>{' '}
                      <b>{item.quantity} ta ({typeLabels[item.type] || item.type}, {item.size})</b>
                    </p>
                  </>
                )}
              </div>

              {activeBusinessWarehouses.length > 1 && (
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Ombor</InputLabel>
                  <Select label="Ombor" value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}>
                    {activeBusinessWarehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField label="Kelgan miqdor (ta)" type="number" value={receivedQty}
                  onChange={(e) => setReceivedQty(e.target.value)} size="small" fullWidth sx={fieldSx} />
                <TextField label="Shikastlangan" type="number" value={damagedQty}
                  onChange={(e) => setDamagedQty(e.target.value)} size="small" fullWidth sx={fieldSx} />
              </div>

              <TextField label="Qabul sanasi" type="date" value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)} size="small" fullWidth
                InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={() => setActiveReceiptOrder(null)} sx={{ textTransform: 'none' }}>
                Bekor
              </Button>
              <Button variant="contained" disabled={saving} startIcon={<CheckCircle />}
                onClick={handleConfirmReceipt}
                sx={{ bgcolor: '#22c55e', textTransform: 'none', '&:hover': { bgcolor: '#16a34a' } }}>
                Prixodni tasdiqlash
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
