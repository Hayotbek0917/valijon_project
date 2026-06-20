import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { FileDownload, TrendingUp, TrendingDown } from '@mui/icons-material';
import { Button, Chip, MenuItem, Select } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import ReceiptDialog from '../components/pos/ReceiptDialog';
import {
  buildCategoryChart,
  buildDailyChart,
  buildHourlyChart,
  filterSalesByBusiness,
  filterSalesByPeriod,
  formatPercent,
  parseSaleDateTime,
  percentChange,
  saleToReceipt,
  sortSalesDesc,
  summarizeSales,
} from '../utils/analytics';
import { formatCurrency } from '../utils/format';

const fmt = (n) => formatCurrency(n);
const fmtM = (n) => (n / 1000000).toFixed(1) + 'M';
const methodColor = { Naqd: '#22c55e', Karta: '#4361ee', Online: '#f59e0b', Nasiya: '#d97706' };

export default function Reports() {
  const { permissions } = useAuth();
  const { sales, products, currentBusinessId, currentBusiness } = useApp();
  const showProfit = permissions.viewNetProfitReports;
  const [period, setPeriod] = useState('Bugun');
  const [receipt, setReceipt] = useState(null);

  const businessSales = useMemo(
    () => sortSalesDesc(filterSalesByBusiness(sales, currentBusinessId)),
    [sales, currentBusinessId],
  );

  const periodSales = useMemo(
    () => filterSalesByPeriod(businessSales, period),
    [businessSales, period],
  );

  const prevPeriodSales = useMemo(() => {
    const ref = new Date();
    if (period === 'Bugun') {
      ref.setDate(ref.getDate() - 1);
      return filterSalesByPeriod(businessSales, 'Bugun', ref);
    }
    if (period === '7 kun') {
      ref.setDate(ref.getDate() - 7);
      return filterSalesByPeriod(businessSales, '7 kun', ref);
    }
    ref.setDate(ref.getDate() - 30);
    return filterSalesByPeriod(businessSales, '30 kun', ref);
  }, [businessSales, period]);

  const summary = useMemo(
    () => summarizeSales(periodSales, products),
    [periodSales, products],
  );

  const prevSummary = useMemo(
    () => summarizeSales(prevPeriodSales, products),
    [prevPeriodSales, products],
  );

  const chartData = useMemo(() => {
    if (period === 'Bugun') return buildHourlyChart(periodSales, products);
    const days = period === '30 kun' ? 30 : 7;
    return buildDailyChart(periodSales, products, days);
  }, [period, periodSales, products]);

  const categoryData = useMemo(
    () => buildCategoryChart(periodSales, products),
    [periodSales, products],
  );

  const summaryCards = [
    {
      label: 'Jami sotuv',
      value: fmt(summary.sotuv),
      sub: `${formatPercent(percentChange(summary.sotuv, prevSummary.sotuv))} oldingi davrga nisbatan`,
      positive: summary.sotuv >= prevSummary.sotuv,
    },
    ...(showProfit
      ? [{
          label: 'Umumiy foyda',
          value: fmt(summary.foyda),
          sub: `${formatPercent(percentChange(summary.foyda, prevSummary.foyda))} oldingi davrga nisbatan`,
          positive: summary.foyda >= prevSummary.foyda,
        }]
      : []),
    {
      label: 'Xarajat (tannarx)',
      value: fmt(summary.xarajat),
      sub: 'Sotilgan mahsulot tannarxi',
      positive: false,
    },
    {
      label: 'Jami tranzaksiyalar',
      value: `${summary.transactions} ta`,
      sub: `${formatPercent(percentChange(summary.transactions, prevSummary.transactions))} oldingi davrga nisbatan`,
      positive: summary.transactions >= prevSummary.transactions,
    },
    {
      label: 'O\'rtacha order',
      value: fmt(summary.avgOrder),
      sub: summary.transactions ? 'Har bir chek bo\'yicha' : 'Tranzaksiya yo\'q',
      positive: summary.avgOrder >= prevSummary.avgOrder,
    },
  ];

  const openReceipt = (sale) => {
    setReceipt(saleToReceipt(sale, currentBusiness?.name || 'SmartPOS Market'));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Hisobotlar</h1>
          <p className="text-sm text-gray-500">
            {showProfit ? 'Haqiqiy sotuv, xarajat va foyda' : 'Haqiqiy sotuv va aylanma'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            size="small"
            sx={{ fontSize: 13, height: 36, minWidth: 110, borderRadius: 1.5 }}
          >
            <MenuItem value="Bugun" sx={{ fontSize: 13 }}>Bugun (soat)</MenuItem>
            <MenuItem value="7 kun" sx={{ fontSize: 13 }}>7 kun</MenuItem>
            <MenuItem value="30 kun" sx={{ fontSize: 13 }}>30 kun</MenuItem>
          </Select>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: 13, color: '#4361ee', borderColor: '#4361ee' }}
          >
            Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-gray-800">{s.value}</p>
            <p className="text-xs mt-0.5 flex items-center gap-0.5" style={{ color: s.positive ? '#22c55e' : '#6b7280' }}>
              {s.positive ? <TrendingUp style={{ fontSize: 13 }} /> : <TrendingDown style={{ fontSize: 13 }} />}
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-1">
            {period === 'Bugun' ? 'Bugungi sotuv (soat bo\'yicha)' : 'Sotuv dinamikasi'}
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {period === 'Bugun'
              ? 'Qaysi soatda savdo ko\'proq — haqiqiy kassa ma\'lumotlari'
              : 'Kunlik sotuv, xarajat va foyda'}
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={fmtM} />
              <Tooltip formatter={(v, n) => [fmt(v), n === 'sotuv' ? 'Sotuv' : n === 'foyda' ? 'Foyda' : 'Xarajat']} />
              <Legend formatter={(v) => (v === 'sotuv' ? 'Sotuv' : v === 'foyda' ? 'Foyda' : 'Xarajat')} />
              <Line type="monotone" dataKey="sotuv" stroke="#4361ee" strokeWidth={2.5} dot={false} />
              {showProfit && (
                <>
                  <Line type="monotone" dataKey="foyda" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="xarajat" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Kategoriya bo&apos;yicha</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Bu davrda sotuv yo&apos;q</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={fmtM} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="cat" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="sotuv" fill="#4361ee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-3">So&apos;nggi tranzaksiyalar</h2>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              {['ID', 'Sana', 'Kun', 'Vaqt', 'Mahsulotlar', 'Summa', "To'lov turi", 'Kassir'].map((h) => (
                <th key={h} className="pb-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                  Bu davrda tranzaksiya yo&apos;q
                </td>
              </tr>
            ) : periodSales.slice(0, 50).map((txn) => {
              const dt = parseSaleDateTime(txn);
              return (
                <tr
                  key={txn.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openReceipt(txn)}
                >
                  <td className="py-2.5 text-xs font-bold" style={{ color: '#4361ee' }}>{txn.id}</td>
                  <td className="py-2.5 text-xs text-gray-500">
                    {dt.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="py-2.5 text-xs text-gray-500">
                    {dt.toLocaleDateString('uz-UZ', { weekday: 'short' })}
                  </td>
                  <td className="py-2.5 text-xs text-gray-500">{(txn.time || '').slice(0, 5)}</td>
                  <td className="py-2.5 text-xs text-gray-600">
                    {(txn.items || []).reduce((s, i) => s + Number(i.qty || 0), 0)} ta
                  </td>
                  <td className="py-2.5 text-xs font-semibold text-gray-800">{fmt(txn.amount)}</td>
                  <td className="py-2.5">
                    <Chip
                      label={txn.method}
                      size="small"
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        height: 20,
                        bgcolor: `${methodColor[txn.method] || '#6b7280'}22`,
                        color: methodColor[txn.method] || '#6b7280',
                      }}
                    />
                  </td>
                  <td className="py-2.5 text-xs text-gray-600">{txn.cashier || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">ID ustiga bosing — chek ochiladi</p>
      </div>

      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
