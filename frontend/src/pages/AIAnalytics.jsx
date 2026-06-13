import {
  SmartToy, TrendingUp, TrendingDown, Lightbulb,
  AutoAwesome, Timeline, Inventory2,
} from '@mui/icons-material';
import { Chip, LinearProgress } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const salesForecast = [
  { day: 'Dush', actual: 8200000, forecast: 8500000 },
  { day: 'Sesh', actual: 9500000, forecast: 9000000 },
  { day: 'Chor', actual: 7800000, forecast: 8200000 },
  { day: 'Pay', actual: 11000000, forecast: 10500000 },
  { day: 'Juma', actual: 10200000, forecast: 10000000 },
  { day: 'Shan', actual: 9800000, forecast: 11000000 },
  { day: 'Yak', actual: 12450000, forecast: 12000000 },
];

const categoryShare = [
  { name: 'Ichimliklar', value: 38, color: '#4361ee' },
  { name: 'Oziq-ovqat', value: 25, color: '#22c55e' },
  { name: 'Sut mahsulotlari', value: 18, color: '#f59e0b' },
  { name: 'Shirinliklar', value: 12, color: '#ec4899' },
  { name: 'Boshqa', value: 7, color: '#9ca3af' },
];

const aiRecommendations = [
  {
    type: 'success',
    icon: <TrendingUp style={{ fontSize: 20 }} />,
    title: "Cola 1L — eng ko'p sotilmoqda",
    desc: "Haftalik o'rtacha 87 ta sotilmoqda. Stock 50 tagacha ko'paytirish tavsiya etiladi.",
    confidence: 92,
    bg: '#f0fdf4', border: '#86efac', color: '#16a34a',
  },
  {
    type: 'warning',
    icon: <Inventory2 style={{ fontSize: 20 }} />,
    title: 'Non (Tandir) — stock kritik darajada',
    desc: "Qolgan miqdor minimal me'yordan past. Bugun buyurtma berish tavsiya etiladi.",
    confidence: 88,
    bg: '#fffbeb', border: '#fcd34d', color: '#d97706',
  },
  {
    type: 'danger',
    icon: <TrendingDown style={{ fontSize: 20 }} />,
    title: 'Qurt mahsuloti — zarar keltiryapti',
    desc: 'So\'nggi 30 kunda -700,000 so\'m zarar. Assortimentdan chiqarish ko\'rib chiqilsin.',
    confidence: 79,
    bg: '#fff1f2', border: '#fca5a5', color: '#dc2626',
  },
  {
    type: 'info',
    icon: <Lightbulb style={{ fontSize: 20 }} />,
    title: "Shanba — eng ko'p sotuv kuni",
    desc: "Tahlil bo'yicha shanba kunlari sotuv 23% yuqori. Maxsus aksiya o'tkazish tavsiya etiladi.",
    confidence: 85,
    bg: '#eff6ff', border: '#93c5fd', color: '#3b82f6',
  },
];

const topPerformers = [
  { name: 'Cola 1L', revenue: 1250000, growth: 12.5 },
  { name: 'Non (Tandir)', revenue: 980000, growth: 8.2 },
  { name: 'Pepsi 1L', revenue: 760000, growth: -3.1 },
  { name: "Lay's Chips", revenue: 650000, growth: 5.7 },
  { name: 'Snickers 50g', revenue: 540000, growth: 2.3 },
];

const fmt = (n) => (n / 1000000).toFixed(1) + 'M';

export default function AIAnalytics() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eef0ff' }}>
          <SmartToy style={{ color: '#4361ee', fontSize: 22 }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI Analytics</h1>
          <p className="text-sm text-gray-500">Sun'iy intellekt tahlili va tavsiyalari</p>
        </div>
        <Chip
          icon={<AutoAwesome style={{ fontSize: 14 }} />}
          label="AI Powered"
          size="small"
          sx={{ ml: 2, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 700, fontSize: 11 }}
        />
      </div>

      {/* AI Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'AI Aniqlik darajasi', value: '94%', sub: 'bashorat aniqligi', color: '#4361ee', bg: '#eef0ff' },
          { label: 'Sotuv o\'sishi', value: '+18.5%', sub: 'kecha bilan', color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Tejab qolingan', value: '2.1M', sub: "so'm (inventar)", color: '#f59e0b', bg: '#fffbeb' },
          { label: 'AI Tavsiyalar', value: '4 ta', sub: 'yangi tavsiya', color: '#8b5cf6', bg: '#f5f3ff' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Sales Forecast */}
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Timeline style={{ color: '#4361ee', fontSize: 18 }} />
            <h2 className="text-sm font-bold text-gray-700">Sotuv Bashorati vs Haqiqat</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesForecast} barGap={4} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip formatter={(v, n) => [v.toLocaleString('uz-UZ') + " so'm", n === 'actual' ? 'Haqiqat' : 'Bashorat']} />
              <Bar dataKey="actual" fill="#4361ee" radius={[4, 4, 0, 0]} name="actual" />
              <Bar dataKey="forecast" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="forecast" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm" style={{ background: '#4361ee' }} />
              Haqiqiy sotuv
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm" style={{ background: '#e0e7ff' }} />
              AI Bashorat
            </div>
          </div>
        </div>

        {/* Category Pie */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Kategoriya bo'yicha sotuv</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryShare}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryShare.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryShare.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="flex-1 text-xs text-gray-600">{cat.name}</span>
                <span className="text-xs font-bold text-gray-700">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations + Top Performers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AutoAwesome style={{ color: '#4361ee', fontSize: 18 }} />
            <h2 className="text-sm font-bold text-gray-700">AI Tavsiyalar</h2>
          </div>
          <div className="space-y-3">
            {aiRecommendations.map((rec, i) => (
              <div key={i} className="rounded-lg p-3"
                style={{ background: rec.bg, border: `1px solid ${rec.border}` }}>
                <div className="flex items-start gap-2">
                  <span style={{ color: rec.color, marginTop: 1 }}>{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: rec.color }}>{rec.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rec.desc}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400">Ishonch:</span>
                      <LinearProgress
                        variant="determinate"
                        value={rec.confidence}
                        sx={{
                          flex: 1, height: 4, borderRadius: 2, bgcolor: '#f3f4f6',
                          '& .MuiLinearProgress-bar': { bgcolor: rec.color, borderRadius: 2 },
                        }}
                      />
                      <span className="text-xs font-bold" style={{ color: rec.color }}>{rec.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Top mahsulotlar (haftalik)</h2>
          <div className="space-y-3">
            {topPerformers.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: '#4361ee' }}>{i + 1}</span>
                    <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{(p.revenue / 1000).toFixed(0)}K so'm</span>
                    <span className="text-xs font-bold flex items-center gap-0.5"
                      style={{ color: p.growth >= 0 ? '#22c55e' : '#ef4444' }}>
                      {p.growth >= 0 ? <TrendingUp style={{ fontSize: 13 }} /> : <TrendingDown style={{ fontSize: 13 }} />}
                      {Math.abs(p.growth)}%
                    </span>
                  </div>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={(p.revenue / 1250000) * 100}
                  sx={{
                    height: 5, borderRadius: 2, bgcolor: '#f3f4f6',
                    '& .MuiLinearProgress-bar': { bgcolor: '#4361ee', borderRadius: 2 },
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
