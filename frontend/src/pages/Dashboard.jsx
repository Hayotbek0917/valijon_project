import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart, AttachMoney, Inventory2, Warning, EventBusy,
  ArrowForward, SmartToy, CheckCircle, Info,
} from '@mui/icons-material';
import { Chip, Button, MenuItem, Select, LinearProgress } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  buildDailyChart,
  buildHourlyChart,
  buildProfitLossRows,
  buildTopProducts,
  filterSalesByBusiness,
  filterSalesByPeriod,
  formatPercent,
  percentChange,
  summarizeSales,
} from '../utils/analytics';
import { formatCurrency } from '../utils/format';

const fmt = (n) => formatCurrency(n);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-3 py-2 text-xs border border-gray-100">
        <p className="font-semibold text-gray-700">{label}</p>
        <p className="text-blue-600 font-bold">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

function StatCard({ icon, iconBg, title, value, sub, subColor, subText }) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{title}</p>
        <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs mt-0.5" style={{ color: subColor }}>
          {sub && <span className="font-medium">{sub} </span>}
          <span className="text-gray-400">{subText}</span>
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { permissions, currentUser } = useAuth();
  const showProfit = permissions.viewProfit;
  const {
    sales, products, getBusinessProducts, getProductStock,
    selectedWarehouseId, currentBusinessId,
  } = useApp();

  const [chartPeriod, setChartPeriod] = useState('Bugun');
  const [topPeriod, setTopPeriod] = useState('Bugun');

  const businessSales = useMemo(
    () => filterSalesByBusiness(sales, currentBusinessId),
    [sales, currentBusinessId],
  );

  const todaySales = useMemo(
    () => filterSalesByPeriod(businessSales, 'Bugun'),
    [businessSales],
  );

  const yesterdaySales = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() - 1);
    return filterSalesByPeriod(businessSales, 'Bugun', ref);
  }, [businessSales]);

  const todaySummary = useMemo(() => summarizeSales(todaySales, products), [todaySales, products]);
  const yesterdaySummary = useMemo(() => summarizeSales(yesterdaySales, products), [yesterdaySales, products]);

  const chartData = useMemo(() => {
    const periodMap = { Bugun: 'Bugun', '7 kunlik': '7 kun', '30 kunlik': '30 kun' };
    const period = periodMap[chartPeriod] || 'Bugun';
    const filtered = filterSalesByPeriod(businessSales, period);
    if (period === 'Bugun') return buildHourlyChart(filtered, products);
    return buildDailyChart(filtered, products, period === '30 kun' ? 30 : 7);
  }, [businessSales, chartPeriod, products]);

  const topProducts = useMemo(() => {
    const periodMap = { Bugun: 'Bugun', Hafta: '7 kun', Oy: '30 kun' };
    const filtered = filterSalesByPeriod(businessSales, periodMap[topPeriod] || 'Bugun');
    return buildTopProducts(filtered, products, 5);
  }, [businessSales, topPeriod, products]);

  const businessProducts = useMemo(
    () => getBusinessProducts().map((p) => ({
      ...p,
      stock: getProductStock(p.id, selectedWarehouseId),
    })),
    [getBusinessProducts, getProductStock, selectedWarehouseId],
  );

  const lowStockItems = useMemo(
    () => businessProducts.filter((p) => p.stock > 0 && p.stock <= 5).slice(0, 8),
    [businessProducts],
  );

  const outOfStockItems = useMemo(
    () => businessProducts.filter((p) => p.stock === 0).slice(0, 8),
    [businessProducts],
  );

  const autoOrders = useMemo(
    () => businessProducts.filter((p) => p.stock <= 5).slice(0, 5),
    [businessProducts],
  );

  const profitLoss = useMemo(
    () => buildProfitLossRows(filterSalesByPeriod(businessSales, '7 kun'), products, 5),
    [businessSales, products],
  );

  const aiInsights = useMemo(() => {
    const insights = [];
    if (topProducts[0]) {
      insights.push({
        type: 'success',
        icon: <CheckCircle style={{ fontSize: 18 }} />,
        text: `${topProducts[0].name} eng ko'p sotilmoqda.`,
        sub: `${topProducts[0].sold} ta sotildi.`,
        bg: '#f0fdf4', border: '#86efac', color: '#16a34a',
      });
    }
    if (lowStockItems[0]) {
      insights.push({
        type: 'warning',
        icon: <Warning style={{ fontSize: 18 }} />,
        text: `${lowStockItems[0].name} qoldiqi kam.`,
        sub: `Faqat ${lowStockItems[0].stock} ta qoldi.`,
        bg: '#fffbeb', border: '#fcd34d', color: '#d97706',
      });
    }
    const lossItem = profitLoss.find((p) => !p.positive);
    if (lossItem) {
      insights.push({
        type: 'danger',
        icon: <Info style={{ fontSize: 18 }} />,
        text: `${lossItem.product} zarar keltirmoqda.`,
        sub: 'Narx yoki tannarxni tekshiring.',
        bg: '#fff1f2', border: '#fca5a5', color: '#dc2626',
      });
    }
    return insights;
  }, [topProducts, lowStockItems, profitLoss]);

  const statCards = [
    {
      key: 'sales',
      icon: <ShoppingCart style={{ color: '#4361ee', fontSize: 22 }} />,
      iconBg: '#eef0ff',
      title: 'Bugungi Sotuv',
      value: fmt(todaySummary.sotuv),
      sub: formatPercent(percentChange(todaySummary.sotuv, yesterdaySummary.sotuv)),
      subColor: todaySummary.sotuv >= yesterdaySummary.sotuv ? '#16a34a' : '#ef4444',
      subText: 'Kecha bilan solishtirganda',
    },
    ...(showProfit ? [{
      key: 'profit',
      icon: <AttachMoney style={{ color: '#22c55e', fontSize: 22 }} />,
      iconBg: '#f0fdf4',
      title: 'Bugungi Foyda',
      value: fmt(todaySummary.foyda),
      sub: formatPercent(percentChange(todaySummary.foyda, yesterdaySummary.foyda)),
      subColor: todaySummary.foyda >= yesterdaySummary.foyda ? '#16a34a' : '#ef4444',
      subText: 'Kecha bilan solishtirganda',
    }] : []),
    {
      key: 'products',
      icon: <Inventory2 style={{ color: '#3b82f6', fontSize: 22 }} />,
      iconBg: '#eff6ff',
      title: 'Jami Mahsulotlar',
      value: String(businessProducts.length),
      sub: `${todaySummary.transactions} ta`,
      subColor: '#3b82f6',
      subText: 'bugungi savdo',
    },
    {
      key: 'lowStock',
      icon: <Warning style={{ color: '#f97316', fontSize: 22 }} />,
      iconBg: '#fff7ed',
      title: 'Kam Qolgan Mahsulotlar',
      value: String(lowStockItems.length),
      sub: '▲ Ogohlantirish',
      subColor: '#f97316',
      subText: '',
    },
    {
      key: 'expired',
      icon: <EventBusy style={{ color: '#ef4444', fontSize: 22 }} />,
      iconBg: '#fff1f2',
      title: 'Tugagan mahsulotlar',
      value: String(outOfStockItems.length),
      sub: '▲ Qayta buyurtma',
      subColor: '#ef4444',
      subText: '',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Xush kelibsiz, {currentUser?.name?.split(' ')[0] ?? 'Foydalanuvchi'}!
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Haqiqiy kassa ma&apos;lumotlari</p>
      </div>

      <div className={`grid gap-4 ${statCards.length >= 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {statCards.map((card) => <StatCard key={card.key} {...card} />)}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-700">Sotuv Statistikasi</h2>
              <p className="text-[11px] text-gray-400">
                {chartPeriod === 'Bugun' ? 'Soat bo\'yicha bugungi savdo' : 'Kunlik savdo'}
              </p>
            </div>
            <Select value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)} size="small" sx={{ fontSize: 12, height: 28, minWidth: 90 }}>
              <MenuItem value="Bugun" sx={{ fontSize: 12 }}>Bugun</MenuItem>
              <MenuItem value="7 kunlik" sx={{ fontSize: 12 }}>7 kunlik</MenuItem>
              <MenuItem value="30 kunlik" sx={{ fontSize: 12 }}>30 kunlik</MenuItem>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey={chartPeriod === 'Bugun' ? 'sotuv' : 'sotuv'} stroke="#4361ee" strokeWidth={2.5} dot={{ fill: '#4361ee', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4361ee' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-4 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Top Mahsulotlar</h2>
            <Select value={topPeriod} onChange={(e) => setTopPeriod(e.target.value)} size="small" sx={{ fontSize: 12, height: 28, minWidth: 70 }}>
              <MenuItem value="Bugun" sx={{ fontSize: 12 }}>Bugun</MenuItem>
              <MenuItem value="Hafta" sx={{ fontSize: 12 }}>Hafta</MenuItem>
              <MenuItem value="Oy" sx={{ fontSize: 12 }}>Oy</MenuItem>
            </Select>
          </div>
          <div className="space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">Sotuv yo&apos;q</p>
            ) : topProducts.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4">{p.rank}</span>
                {p.img ? (
                  <img src={p.img} alt="" className="w-6 h-6 rounded object-cover" />
                ) : (
                  <span className="text-base">{p.emoji}</span>
                )}
                <span className="flex-1 text-xs font-medium text-gray-700 truncate">{p.name}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{p.sold} ta</span>
                <span className="text-xs font-semibold text-gray-700 w-24 text-right">{fmt(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SmartToy style={{ color: '#4361ee', fontSize: 18 }} />
            <h2 className="text-sm font-bold text-gray-700">AI Insight</h2>
          </div>
          <div className="space-y-2.5">
            {aiInsights.length === 0 ? (
              <p className="text-xs text-gray-400">Hozircha tavsiya yo&apos;q</p>
            ) : aiInsights.map((ins, i) => (
              <div key={i} className="rounded-lg p-2.5" style={{ background: ins.bg, border: `1px solid ${ins.border}` }}>
                <div className="flex items-start gap-2">
                  <span style={{ color: ins.color, marginTop: 1 }}>{ins.icon}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: ins.color }}>{ins.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ins.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Inventory Ogohlantirishlar</h2>
          <div className="space-y-2.5">
            {[...lowStockItems, ...outOfStockItems].slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">{item.emoji || '📦'}</div>
                )}
                <span className="flex-1 text-xs font-medium text-gray-700">{item.name}</span>
                <span className="text-xs" style={{ color: item.stock === 0 ? '#ef4444' : '#f97316' }}>
                  {item.stock} ta qoldi
                </span>
                <Chip label={item.stock === 0 ? 'Tugagan' : 'Kam'} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600 }} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Zaxira buyurtma tavsiyasi</h2>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 text-left font-medium">Mahsulot</th>
                <th className="pb-2 text-left font-medium">Holat</th>
                <th className="pb-2 text-left font-medium">Qoldiq</th>
                <th className="pb-2 text-left font-medium">Amal</th>
              </tr>
            </thead>
            <tbody>
              {autoOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50">
                  <td className="py-2.5 text-xs font-medium text-gray-700">{order.name}</td>
                  <td className="py-2.5 text-xs font-medium text-red-500">
                    {order.stock === 0 ? 'Tugagan' : 'Kam qoldi'}
                  </td>
                  <td className="py-2.5 text-xs text-gray-600">{order.stock} ta</td>
                  <td className="py-2.5">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate('/dealer-orders')}
                      sx={{ fontSize: 10, py: 0.4, px: 1.5, bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', minWidth: 0 }}
                    >
                      Zakaz berish
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showProfit && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Foyda / Zarar Tahlili (7 kun)</h2>
          <div className="space-y-3">
            {profitLoss.map((item) => (
              <div key={item.product}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{item.product}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{fmt(item.sotuv)}</span>
                    <span className="text-xs font-bold" style={{ color: item.positive ? '#22c55e' : '#ef4444' }}>
                      {item.positive ? '+' : ''}{fmt(item.profit)}
                    </span>
                  </div>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={item.positive ? Math.min((item.profit / Math.max(item.sotuv, 1)) * 100 + 40, 100) : 20}
                  sx={{ height: 6, borderRadius: 3, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: item.positive ? '#22c55e' : '#ef4444', borderRadius: 3 } }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
