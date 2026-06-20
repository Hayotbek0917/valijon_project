import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search, TrendingDown, TrendingUp, ArrowBack, ArrowForward,
} from '@mui/icons-material';
import {
  Button, Chip, InputAdornment, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

const statusInfo = (qty) => {
  if (qty === 0) return { label: 'Tugagan', bg: '#fee2e2', color: '#ef4444' };
  if (qty <= 5) return { label: 'Kam', bg: '#fff7ed', color: '#f97316' };
  return { label: 'Yetarli', bg: '#f0fdf4', color: '#22c55e' };
};

export default function Inventory() {
  const {
    getBusinessProducts,
    activeBusinessWarehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    getProductStock
  } = useApp();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all'); // 'all', 'low', 'out'
  const itemsPerPage = 8;

  const businessProducts = getBusinessProducts();

  // Map products to their stock in the selected warehouse
  const productsWithStock = businessProducts.map((p) => {
    const stock = getProductStock(p.id, selectedWarehouseId);
    return { ...p, stock };
  });

  const filtered = productsWithStock.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));

    if (!matchesSearch) return false;

    if (filterType === 'low') {
      return p.stock <= 5;
    }
    if (filterType === 'out') {
      return p.stock === 0;
    }
    return true; // 'all'
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInventory = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const totalTypes = productsWithStock.length;
  const totalStockSum = productsWithStock.reduce((sum, p) => sum + p.stock, 0);
  const lowStockTypes = productsWithStock.filter(p => p.stock <= 5).length;
  const outOfStockTypes = productsWithStock.filter(p => p.stock === 0).length;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const activeWarehouseName = activeBusinessWarehouses.find(w => w.id === selectedWarehouseId)?.name || 'Ombor';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sklad (Ombor)</h1>
          <p className="text-sm text-gray-500">Mahsulotlar qoldig'ini alohida omborlar kesimida boshqarish</p>
        </div>
        {activeBusinessWarehouses.length > 1 && (
          <div className="flex items-center gap-3">
            {/* Warehouse Selector */}
            <FormControl size="small" sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' } }}>
              <InputLabel id="warehouse-select-label">Ombor (Sklad)</InputLabel>
              <Select
                labelId="warehouse-select-label"
                label="Ombor (Sklad)"
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {activeBusinessWarehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            id: 'all',
            label: 'Jami mahsulot turlari',
            value: totalTypes,
            color: '#4361ee',
            bg: '#eef0ff',
            clickable: true,
            icon: <TrendingUp style={{ color: '#4361ee', fontSize: 20 }} />
          },
          {
            id: 'low',
            label: 'Kam qolgan mahsulotlar',
            value: lowStockTypes,
            color: '#f97316',
            bg: '#fff7ed',
            clickable: true,
            icon: <TrendingDown style={{ color: '#f97316', fontSize: 20 }} />
          },
          {
            id: 'out',
            label: 'Tugagan mahsulotlar',
            value: outOfStockTypes,
            color: '#ef4444',
            bg: '#fee2e2',
            clickable: true,
            icon: <TrendingDown style={{ color: '#ef4444', fontSize: 20 }} />
          },
          {
            id: 'total_qty',
            label: 'Umumiy qoldiq (dona)',
            value: totalStockSum,
            color: '#22c55e',
            bg: '#f0fdf4',
            clickable: false,
            icon: <TrendingUp style={{ color: '#22c55e', fontSize: 20 }} />
          },
        ].map((card) => {
          const isActive = card.clickable && filterType === card.id;
          return (
            <div
              key={card.label}
              onClick={() => {
                if (card.clickable) {
                  setFilterType(card.id);
                  setCurrentPage(1);
                }
              }}
              className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border transition-all ${
                card.clickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''
              }`}
              style={{
                borderColor: isActive ? card.color : '#f1f5f9',
                borderWidth: isActive ? '2px' : '1px',
                padding: isActive ? '14px' : '16px'
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <TextField
          size="small"
          placeholder="Mahsulot qidirish..."
          value={search}
          onChange={handleSearchChange}
          sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14, bgcolor: 'white' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>#</TableCell>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Kategoriya</TableCell>
                <TableCell>Joriy miqdor (Skladda)</TableCell>
                <TableCell>Holat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                    Skladda mahsulotlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInventory.map((item, i) => {
                  const status = statusInfo(item.stock);
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ 
                        '& td': { py: 1.5, fontSize: 13 },
                        bgcolor: i % 2 === 0 ? '#ffffff' : '#f4f9ff',
                        '&:hover': {
                          bgcolor: i % 2 === 0 ? '#f1f5f9 !important' : '#eaf4ff !important'
                        }
                      }}
                    >
                      <TableCell sx={{ color: '#9ca3af' }}>{startIndex + i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-[#f2f2f2] flex items-center justify-center shrink-0 border border-[#e5e5e5] overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">📦</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.barcode || 'Shtrix-kod yo\'q'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: status.color }}>
                        {item.stock} ta
                      </TableCell>
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

        {/* Pagination Controls */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-xs text-gray-500">
            Jami {filtered.length} ta mahsulotdan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} ko'rsatilmoqda ({activeWarehouseName})
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', fontSize: 11 }}
            >
              Oldingi
            </Button>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border rounded-md">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              endIcon={<ArrowForward />}
              sx={{ textTransform: 'none', fontSize: 11 }}
            >
              Keyingi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
