import { useState } from 'react';
import { Add, Search, LocalShipping, CheckCircle, HourglassEmpty, Cancel } from '@mui/icons-material';
import {
  Button, Chip, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';

const initialOrders = [
  { id: 'PO-001', supplier: 'Coca-Cola Uzbekistan', items: 3, qty: 150, total: 1050000, date: '2025-05-18', status: 'Yetkazildi', eta: '2025-05-18' },
  { id: 'PO-002', supplier: 'Novda Non', items: 1, qty: 200, total: 1600000, date: '2025-05-17', status: 'Yetkazilmoqda', eta: '2025-05-19' },
  { id: 'PO-003', supplier: 'Sut Kombinati', items: 4, qty: 80, total: 960000, date: '2025-05-16', status: 'Kutilmoqda', eta: '2025-05-20' },
  { id: 'PO-004', supplier: 'Lays Distributor', items: 2, qty: 100, total: 800000, date: '2025-05-15', status: 'Bekor qilindi', eta: '—' },
  { id: 'PO-005', supplier: 'PepsiCo UZ', items: 2, qty: 90, total: 855000, date: '2025-05-14', status: 'Yetkazildi', eta: '2025-05-16' },
  { id: 'PO-006', supplier: 'Coca-Cola Uzbekistan', items: 5, qty: 200, total: 1400000, date: '2025-05-13', status: 'Yetkazildi', eta: '2025-05-15' },
];

const statusConfig = {
  'Yetkazildi': { icon: <CheckCircle style={{ fontSize: 14 }} />, bg: '#f0fdf4', color: '#22c55e' },
  'Yetkazilmoqda': { icon: <LocalShipping style={{ fontSize: 14 }} />, bg: '#eff6ff', color: '#3b82f6' },
  'Kutilmoqda': { icon: <HourglassEmpty style={{ fontSize: 14 }} />, bg: '#fffbeb', color: '#f59e0b' },
  'Bekor qilindi': { icon: <Cancel style={{ fontSize: 14 }} />, bg: '#fee2e2', color: '#ef4444' },
};

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";

export default function PurchaseOrders() {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ supplier: '', items: '', qty: '', total: '', eta: '' });

  const filtered = orders.filter((o) =>
    o.supplier.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.supplier) return;
    const newOrder = {
      id: `PO-${String(orders.length + 1).padStart(3, '0')}`,
      ...form,
      items: +form.items || 1,
      qty: +form.qty || 0,
      total: +form.total || 0,
      date: new Date().toISOString().slice(0, 10),
      status: 'Kutilmoqda',
    };
    setOrders((prev) => [newOrder, ...prev]);
    setForm({ supplier: '', items: '', qty: '', total: '', eta: '' });
    setOpenDialog(false);
  };

  const counts = {
    total: orders.length,
    delivered: orders.filter((o) => o.status === 'Yetkazildi').length,
    inTransit: orders.filter((o) => o.status === 'Yetkazilmoqda').length,
    pending: orders.filter((o) => o.status === 'Kutilmoqda').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Xarid Buyurtmalari</h1>
          <p className="text-sm text-gray-500">{orders.length} ta buyurtma</p>
        </div>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}>
          Yangi buyurtma
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Jami buyurtmalar', value: counts.total, color: '#4361ee', bg: '#eef0ff' },
          { label: 'Yetkazildi', value: counts.delivered, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Yetkazilmoqda', value: counts.inTransit, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Kutilmoqda', value: counts.pending, color: '#f59e0b', bg: '#fffbeb' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <TextField
        size="small"
        placeholder="Buyurtma yoki yetkazib beruvchi qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 340, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Buyurtma ID</TableCell>
                <TableCell>Yetkazib beruvchi</TableCell>
                <TableCell>Mahsulotlar</TableCell>
                <TableCell>Miqdor</TableCell>
                <TableCell>Jami summa</TableCell>
                <TableCell>Sana</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((o) => {
                const sc = statusConfig[o.status] || statusConfig['Kutilmoqda'];
                return (
                  <TableRow key={o.id} hover sx={{ '& td': { py: 1.5, fontSize: 13 } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#4361ee' }}>{o.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151' }}>{o.supplier}</TableCell>
                    <TableCell sx={{ color: '#6b7280' }}>{o.items} xil</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{o.qty} ta</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#4361ee' }}>{fmt(o.total)}</TableCell>
                    <TableCell sx={{ color: '#9ca3af' }}>{o.date}</TableCell>
                    <TableCell sx={{ color: '#9ca3af' }}>{o.eta}</TableCell>
                    <TableCell>
                      <Chip
                        icon={sc.icon}
                        label={o.status}
                        size="small"
                        sx={{ fontSize: 11, fontWeight: 600, bgcolor: sc.bg, color: sc.color, '& .MuiChip-icon': { color: sc.color } }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Yangi xarid buyurtmasi</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Yetkazib beruvchi', field: 'supplier' },
            { label: "Mahsulot turlari soni", field: 'items', type: 'number' },
            { label: 'Umumiy miqdor (ta)', field: 'qty', type: 'number' },
            { label: "Jami summa (so'm)", field: 'total', type: 'number' },
            { label: 'Yetkazish sanasi (ETA)', field: 'eta', type: 'date' },
          ].map(({ label, field, type }) => (
            <TextField key={field} label={label} type={type || 'text'} value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              size="small" fullWidth InputLabelProps={type === 'date' ? { shrink: true } : {}}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Bekor qilish</Button>
          <Button onClick={handleSave} variant="contained"
            sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
