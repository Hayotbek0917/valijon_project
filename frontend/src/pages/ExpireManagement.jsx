import { useState } from 'react';
import { Warning, EventBusy, CheckCircle, Search } from '@mui/icons-material';
import {
  Chip, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button,
} from '@mui/material';

const expireData = [
  { id: 1, name: 'Smetana 20%', emoji: '🥛', category: 'Sut mahsulotlari', batch: 'BAT-001', qty: 12, expires: '2025-06-01', daysLeft: 14, status: 'Yashil' },
  { id: 2, name: 'Qatiq', emoji: '🥛', category: 'Sut mahsulotlari', batch: 'BAT-002', qty: 8, expires: '2025-05-20', daysLeft: 2, status: 'Sariq' },
  { id: 3, name: "Salat Yaprog'i", emoji: '🥬', category: 'Sabzavot', batch: 'BAT-003', qty: 5, expires: '2025-05-19', daysLeft: 1, status: 'Sariq' },
  { id: 4, name: 'Tvorog', emoji: '🧀', category: 'Sut mahsulotlari', batch: 'BAT-004', qty: 3, expires: '2025-05-18', daysLeft: 0, status: 'Qizil' },
  { id: 5, name: 'Sut 1L', emoji: '🥛', category: 'Sut mahsulotlari', batch: 'BAT-005', qty: 6, expires: '2025-05-17', daysLeft: -1, status: 'Qizil' },
  { id: 6, name: 'Kefir', emoji: '🥛', category: 'Sut mahsulotlari', batch: 'BAT-006', qty: 4, expires: '2025-05-16', daysLeft: -2, status: 'Qizil' },
  { id: 7, name: 'Pomidor', emoji: '🍅', category: 'Sabzavot', batch: 'BAT-007', qty: 15, expires: '2025-05-25', daysLeft: 7, status: 'Yashil' },
  { id: 8, name: 'Qovoq', emoji: '🥕', category: 'Sabzavot', batch: 'BAT-008', qty: 10, expires: '2025-05-30', daysLeft: 12, status: 'Yashil' },
];

const statusInfo = {
  Yashil: { label: 'Yaxshi', bg: '#f0fdf4', color: '#22c55e', icon: <CheckCircle style={{ fontSize: 14 }} /> },
  Sariq: { label: 'Diqqat', bg: '#fffbeb', color: '#f59e0b', icon: <Warning style={{ fontSize: 14 }} /> },
  Qizil: { label: "Muddati o'tgan", bg: '#fee2e2', color: '#ef4444', icon: <EventBusy style={{ fontSize: 14 }} /> },
};

export default function ExpireManagement() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Barchasi');

  const filtered = expireData.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Barchasi' || item.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    total: expireData.length,
    yashil: expireData.filter((i) => i.status === 'Yashil').length,
    sariq: expireData.filter((i) => i.status === 'Sariq').length,
    qizil: expireData.filter((i) => i.status === 'Qizil').length,
  };

  const daysLabel = (days) => {
    if (days < 0) return `${Math.abs(days)} kun o'tgan`;
    if (days === 0) return "Bugun tugaydi";
    return `${days} kun qoldi`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Muddatni Boshqarish</h1>
          <p className="text-sm text-gray-500">Mahsulotlar muddatini kuzatish</p>
        </div>
        <Button variant="contained"
          sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}>
          Hisobot yuklab olish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Jami mahsulotlar', value: counts.total, color: '#4361ee', bg: '#eef0ff' },
          { label: 'Yaxshi holat', value: counts.yashil, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Diqqat talab', value: counts.sariq, color: '#f59e0b', bg: '#fffbeb' },
          { label: "Muddati o'tgan", value: counts.qizil, color: '#ef4444', bg: '#fee2e2' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <TextField
          size="small"
          placeholder="Mahsulot qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
        <div className="flex gap-2">
          {['Barchasi', 'Yashil', 'Sariq', 'Qizil'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{
                background: filter === f ? '#4361ee' : '#f3f4f6',
                color: filter === f ? '#fff' : '#6b7280',
              }}
            >
              {f === 'Barchasi' ? 'Barchasi' : f === 'Yashil' ? 'Yaxshi' : f === 'Sariq' ? 'Diqqat' : "Muddati o'tgan"}
            </button>
          ))}
        </div>
      </div>

      {/* Expired Alert Banner */}
      {counts.qizil > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <EventBusy style={{ color: '#ef4444', fontSize: 22 }} />
          <div>
            <p className="text-sm font-bold text-red-600">
              {counts.qizil} ta mahsulotning muddati o'tgan!
            </p>
            <p className="text-xs text-red-400">Ushbu mahsulotlarni darhol sotuvdan olib tashlash kerak.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Kategoriya</TableCell>
                <TableCell>Partiya</TableCell>
                <TableCell>Miqdor</TableCell>
                <TableCell>Muddati</TableCell>
                <TableCell>Vaqt</TableCell>
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item) => {
                const si = statusInfo[item.status];
                return (
                  <TableRow key={item.id} hover sx={{ '& td': { py: 1.5, fontSize: 13 } }}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="font-semibold text-gray-800">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small"
                        sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ color: '#9ca3af', fontFamily: 'monospace' }}>{item.batch}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{item.qty} ta</TableCell>
                    <TableCell sx={{ color: '#374151' }}>{item.expires}</TableCell>
                    <TableCell>
                      <span className="font-medium text-xs" style={{ color: si.color }}>
                        {daysLabel(item.daysLeft)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={si.icon}
                        label={si.label}
                        size="small"
                        sx={{ fontSize: 11, fontWeight: 600, bgcolor: si.bg, color: si.color, '& .MuiChip-icon': { color: si.color } }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
