import { useState } from 'react';
import { Add, Search, Phone, Email, LocationOn, Star } from '@mui/icons-material';
import {
  Button, Avatar, Chip, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';

const initialSuppliers = [
  { id: 1, name: 'Coca-Cola Uzbekistan', contact: 'Alisher', phone: '+998901112233', email: 'alcola@uz.com', address: 'Toshkent, Yunusobod', category: 'Ichimliklar', rating: 5, totalOrders: 45, status: 'Faol' },
  { id: 2, name: 'PepsiCo UZ', contact: 'Bahodur', phone: '+998912223344', email: 'bpepsi@uz.com', address: 'Toshkent, Chilonzor', category: 'Ichimliklar', rating: 4, totalOrders: 32, status: 'Faol' },
  { id: 3, name: 'Novda Non', contact: 'Xurshid', phone: '+998923334455', email: 'novda@uz.com', address: 'Toshkent, Mirzo Ulugbek', category: 'Non mahsulotlari', rating: 5, totalOrders: 78, status: 'Faol' },
  { id: 4, name: 'Lays Distributor', contact: 'Dilshod', phone: '+998934445566', email: 'lays@uz.com', address: 'Toshkent, Sergeli', category: 'Shirinliklar', rating: 3, totalOrders: 21, status: 'Nofaol' },
  { id: 5, name: 'Sut Kombinati', contact: 'Mohira', phone: '+998945556677', email: 'sut@uz.com', address: 'Samarkand', category: 'Sut mahsulotlari', rating: 4, totalOrders: 55, status: 'Faol' },
];

const fmt = (n) => n.toLocaleString('uz-UZ') + " so'm";
const avatarColor = (name) => {
  const colors = ['#4361ee', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];
  return colors[name.charCodeAt(0) % colors.length];
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', address: '', category: '' });

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.name) return;
    setSuppliers((prev) => [...prev, { id: Date.now(), ...form, rating: 3, totalOrders: 0, status: 'Faol' }]);
    setForm({ name: '', contact: '', phone: '', email: '', address: '', category: '' });
    setOpenDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Yetkazib beruvchilar</h1>
          <p className="text-sm text-gray-500">{suppliers.length} ta yetkazib beruvchi</p>
        </div>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}>
          Yetkazib beruvchi qo'shish
        </Button>
      </div>

      <TextField
        size="small"
        placeholder="Yetkazib beruvchi qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Yetkazib beruvchi</TableCell>
                <TableCell>Kategoriya</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>Manzil</TableCell>
                <TableCell>Buyurtmalar</TableCell>
                {/*<TableCell>Reyting</TableCell>*/}
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} hover sx={{ '& td': { py: 1.5, fontSize: 13 } }}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: avatarColor(s.name) }}>
                        {s.name.charAt(0)}
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.contact}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip label={s.category} size="small" sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone style={{ fontSize: 13, color: '#9ca3af' }} /> {s.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-500">
                      <LocationOn style={{ fontSize: 13, color: '#9ca3af' }} /> {s.address}
                    </div>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{s.totalOrders} ta</TableCell>
                  {/*<TableCell>*/}
                  {/*  <div className="flex items-center gap-0.5">*/}
                  {/*    {Array.from({ length: 5 }).map((_, i) => (*/}
                  {/*      <Star key={i} style={{ fontSize: 14, color: i < s.rating ? '#f59e0b' : '#e5e7eb' }} />*/}
                  {/*    ))}*/}
                  {/*  </div>*/}
                  {/*</TableCell>*/}
                  <TableCell>
                    <Chip
                      label={s.status}
                      size="small"
                      sx={{
                        fontSize: 11, fontWeight: 600,
                        bgcolor: s.status === 'Yaxshi' ? '#f0fdf4' : '#f3f4f6',
                        color: s.status === 'Faol' ? '#22c55e' : '#9ca3af',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Yangi yetkazib beruvchi</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Kompaniya nomi', field: 'name' },
            { label: 'Mas\'ul shaxs', field: 'contact' },
            { label: 'Telefon', field: 'phone' },
            { label: 'Email', field: 'email' },
            { label: 'Manzil', field: 'address' },
            { label: 'Kategoriya', field: 'category' },
          ].map(({ label, field }) => (
            <TextField key={field} label={label} value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
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
