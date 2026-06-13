import { Print } from '@mui/icons-material';
import { Button } from '@mui/material';

const fmtNum = (n) => Number(n).toLocaleString('uz-UZ');
const receiptLine = '--------------------------------';

export default function ReceiptDialog({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 print:bg-white print:p-0"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto print:overflow-visible">
        <div
          className="w-[min(340px,92vw)] bg-[#faf9f6] text-black shadow-2xl print:shadow-none font-mono text-[12px] leading-relaxed px-5 py-6"
          style={{ fontFamily: '"Courier New", Courier, monospace' }}
        >
          <p className="text-center text-[15px] font-black uppercase tracking-wide">
            {receipt.storeName}
          </p>
          <p className="text-center text-[10px] mt-1 text-gray-600">Kassa / POS tizimi</p>
          <p className="text-center text-[10px] text-gray-600">
            {receipt.date} · {receipt.dayName || ''} · {receipt.time}
          </p>
          <p className="text-center text-[10px] font-bold mt-1">CHEK № {receipt.id}</p>

          <p className="text-center my-2 text-[10px]">{receiptLine}</p>

          {(receipt.items || []).map((item, idx) => (
            <div key={idx} className="mb-3">
              <p className="font-bold text-[11px] leading-snug">{item.name}</p>
              <div className="flex justify-between gap-2 mt-0.5 text-[11px]">
                <span>{item.qty} x {fmtNum(item.price)}</span>
                <span className="font-bold">{fmtNum(item.price * item.qty)}</span>
              </div>
            </div>
          ))}

          <p className="text-center my-2 text-[10px]">{receiptLine}</p>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>To&apos;lov turi:</span>
              <span className="font-bold">{receipt.method}</span>
            </div>
            <div className="flex justify-between">
              <span>Kassir:</span>
              <span>{receipt.cashier}</span>
            </div>
          </div>

          <p className="text-center my-3 text-[10px]">{receiptLine}</p>

          <div className="text-right">
            <p className="text-[10px] uppercase text-gray-600 mb-1">Jami to&apos;lov</p>
            <p className="text-[28px] font-black leading-none tracking-tight">
              {fmtNum(receipt.amount)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">so&apos;m</p>
          </div>
        </div>

        <div className="flex gap-2 w-[min(340px,92vw)] print:hidden">
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{ bgcolor: '#fff', borderColor: '#fff', color: '#111', textTransform: 'none', fontWeight: 700 }}
          >
            Chop etish
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{ bgcolor: '#4361ee', fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}
          >
            Yopish
          </Button>
        </div>
      </div>
    </div>
  );
}
