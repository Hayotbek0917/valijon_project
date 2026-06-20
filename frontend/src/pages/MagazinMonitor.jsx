import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MonitorHeart, CheckCircle, WarningAmber, Cancel, Refresh,
} from '@mui/icons-material';
import { Button, Chip, MenuItem, Select, TextField, InputAdornment } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { fetchMagazinStatus } from '../api/platform';
import { formatCurrency } from '../utils/format';
import { PRIMARY_COLOR } from '../config/constants';

const STATUS = {
  active: { label: 'Ishlayapti', color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle },
  low: { label: 'Kam faol', color: '#f97316', bg: '#fff7ed', icon: WarningAmber },
  inactive: { label: 'Ishlatmayapti', color: '#ef4444', bg: '#fef2f2', icon: Cancel },
};

const fmt = formatCurrency;

export default function MagazinMonitor() {
  const { currentUser } = useAuth();
  const { setCurrentBusinessId, businesses } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMagazinStatus();
      setData(res);
    } catch (err) {
      setError(err.message || 'Ma\'lumot yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isGlobalAdmin) load();
  }, [currentUser?.isGlobalAdmin]);

  const filtered = useMemo(() => {
    if (!data?.stores) return [];
    return data.stores.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return s.store_name.toLowerCase().includes(q)
        || s.store_code.toLowerCase().includes(q);
    });
  }, [data, statusFilter, search]);

  const openStore = (store) => {
    const primary = businesses.find((b) => b.name === store.store_name)
      || businesses.find((b) => b.name?.startsWith(store.store_name));
    if (primary) {
      setCurrentBusinessId(primary.id);
      navigate('/');
    }
  };

  if (!currentUser?.isGlobalAdmin) {
    return <p className="text-gray-500">Bu sahifa faqat platform egasi uchun.</p>;
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MonitorHeart style={{ color: PRIMARY_COLOR }} />
            Magazinlar holati
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            100 ta magazindan qaysi biri ishlayapti, qaysi biri umuman ishlatmayapti — oxirgi 7/30 kun savdo bo&apos;yicha.
          </p>
        </div>
        <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading}>
          Yangilash
        </Button>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 uppercase font-bold">Jami</p>
            <p className="text-2xl font-black">{data.summary.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-700 uppercase font-bold">Ishlayapti</p>
            <p className="text-2xl font-black text-green-700">{data.summary.active}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-xs text-orange-700 uppercase font-bold">Kam faol</p>
            <p className="text-2xl font-black text-orange-700">{data.summary.low}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-xs text-red-700 uppercase font-bold">Ishlatmayapti</p>
            <p className="text-2xl font-black text-red-700">{data.summary.inactive}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <TextField
          size="small"
          placeholder="Magazin qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
          }}
          sx={{ minWidth: 220 }}
        />
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Barchasi</MenuItem>
          <MenuItem value="active">Ishlayapti</MenuItem>
          <MenuItem value="low">Kam faol</MenuItem>
          <MenuItem value="inactive">Ishlatmayapti</MenuItem>
        </Select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b">
              {['Magazin', 'Holat', 'Filiallar', 'Bugun savdo', '7 kun', '30 kun', 'Oxirgi savdo', 'Amal'].map((h) => (
                <th key={h} className="py-3 px-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">Yuklanmoqda...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">Ma&apos;lumot topilmadi</td></tr>
            ) : filtered.map((store) => {
              const st = STATUS[store.status] || STATUS.inactive;
              const Icon = st.icon;
              return (
                <tr key={store.store_code} className="border-b border-gray-50 hover:bg-gray-50/80">
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-800">{store.store_name}</p>
                    <p className="text-xs text-gray-400">{store.store_code}.admin</p>
                  </td>
                  <td className="py-3 px-3">
                    <Chip
                      icon={<Icon sx={{ fontSize: 16 }} />}
                      label={st.label}
                      size="small"
                      sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700 }}
                    />
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-600">{store.branch_count} ta</td>
                  <td className="py-3 px-3 text-sm">
                    {store.sales_today} ta
                    <span className="block text-xs text-gray-400">{fmt(store.revenue_today)}</span>
                  </td>
                  <td className="py-3 px-3 text-sm">
                    {store.sales_7d} ta
                    <span className="block text-xs text-gray-400">{fmt(store.revenue_7d)}</span>
                  </td>
                  <td className="py-3 px-3 text-sm">
                    {store.sales_30d} ta
                    <span className="block text-xs text-gray-400">{fmt(store.revenue_30d)}</span>
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-500">
                    {store.last_sale_date
                      ? new Date(store.last_sale_date).toLocaleDateString('uz-UZ')
                      : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <Button size="small" variant="outlined" onClick={() => openStore(store)}>
                      Ko&apos;rish
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        <b>Ishlayapti</b> — oxirgi 7 kunda savdo bor. <b>Kam faol</b> — 30 kun ichida bor, lekin 7 kunda yo&apos;q.
        <b> Ishlatmayapti</b> — 30 kunda savdo yo&apos;q.
      </p>
    </div>
  );
}
