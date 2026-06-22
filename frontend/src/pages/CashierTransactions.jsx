import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Chip } from '@mui/material';
import { ReceiptLong, TrendingUp } from '@mui/icons-material';
import ReceiptDialog from '../components/pos/ReceiptDialog';
import {
  filterSalesByBusiness,
  parseSaleDateTime,
  saleToReceipt,
  sortSalesDesc,
  summarizeSales,
} from '../utils/analytics';
import { formatCurrency } from '../utils/format';
import { payMethodChipSx } from '../utils/payment';
import { PRIMARY_COLOR } from '../config/constants';

const fmt = (n) => formatCurrency(n);

export default function CashierTransactions() {
  const { sales, products, currentBusinessId, currentBusiness } = useApp();
  const [receipt, setReceipt] = useState(null);

  const mySales = useMemo(
    () => sortSalesDesc(filterSalesByBusiness(sales, currentBusinessId)),
    [sales, currentBusinessId],
  );

  const summary = useMemo(() => summarizeSales(mySales, products), [mySales, products]);

  const openReceipt = (txn) => {
    setReceipt(saleToReceipt(txn, currentBusiness?.name || 'SmartPOS Market'));
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ReceiptLong style={{ color: PRIMARY_COLOR }} />
          Tranzaksiyalar
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Faqat sizning oxirgi 1 oylik savdolaringiz ko&apos;rsatiladi. Boshqa kassirlarning cheklarini ko&apos;ra olmaysiz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs uppercase font-bold text-gray-400 tracking-wide">Jami savdolar</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{summary.transactions} ta</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs uppercase font-bold text-gray-400 tracking-wide">Jami summa</p>
          <p className="text-2xl font-black mt-1" style={{ color: PRIMARY_COLOR }}>{fmt(summary.sotuv)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs uppercase font-bold text-gray-400 tracking-wide">O&apos;rtacha chek</p>
          <p className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-1">
            <TrendingUp sx={{ fontSize: 22, color: '#22c55e' }} />
            {summary.transactions ? fmt(summary.avgOrder) : '0 so\'m'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Savdolar ro&apos;yxati</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                {['Chek №', 'Sana', 'Vaqt', 'Mahsulotlar', 'Summa', "To'lov"].map((h) => (
                  <th key={h} className="pb-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mySales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                    Oxirgi 1 oyda sizning savdolaringiz topilmadi
                  </td>
                </tr>
              ) : mySales.map((txn) => {
                const dt = parseSaleDateTime(txn);
                return (
                  <tr
                    key={txn.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openReceipt(txn)}
                  >
                    <td className="py-2.5 text-xs font-bold" style={{ color: PRIMARY_COLOR }}>{txn.id}</td>
                    <td className="py-2.5 text-xs text-gray-500">
                      {dt.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
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
                        sx={{ height: 20, ...payMethodChipSx(txn.method) }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Qatorni bosing — chek ochiladi</p>
      </div>

      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
