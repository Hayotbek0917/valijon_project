import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search } from '@mui/icons-material';
import {
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import { formatCurrency } from '../utils/format';

const fmt = (n) => formatCurrency(n);

export default function CreditLedger() {
  const { creditAccounts, currentBusinessId, recordCreditPayment, saving } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [error, setError] = useState('');

  const accounts = useMemo(
    () => creditAccounts.filter((a) => String(a.businessId) === String(currentBusinessId)),
    [creditAccounts, currentBusinessId],
  );

  const filtered = accounts.filter((a) =>
    a.customerName.toLowerCase().includes(search.toLowerCase())
    || (a.phone && a.phone.includes(search)),
  );

  const totalDebt = filtered.reduce((s, a) => s + a.balance, 0);

  const openPay = (account) => {
    setSelected(account);
    setPayAmount('');
    setPayNote('');
    setError('');
  };

  const handlePay = async () => {
    if (!selected) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      setError('To\'lov summasini kiriting');
      return;
    }
    const result = await recordCreditPayment(selected.id, amount, payNote.trim());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Qarz daftarchasi</h1>
          <p className="text-sm text-gray-500">Nasiya (qarz) mijozlari va to&apos;lovlar</p>
        </div>
        <Chip
          label={`Jami qarz: ${fmt(totalDebt)}`}
          sx={{ fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309', fontSize: 13, py: 2.5 }}
        />
      </div>

      <TextField
        size="small"
        placeholder="Mijoz qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 320, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12 } }}>
                <TableCell>Mijoz</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell align="right">Qarz summasi</TableCell>
                <TableCell align="center">Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                    Qarzdor mijozlar yo&apos;q
                  </TableCell>
                </TableRow>
              ) : filtered.map((a, i) => (
                <TableRow
                  key={a.id}
                  hover
                  onClick={() => openPay(a)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: i % 2 === 1 ? '#fffbeb' : 'white',
                    '&:hover': { bgcolor: '#fef3c7 !important' },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    {a.customerName}
                    {accounts.filter((x) => x.customerName.toLowerCase() === a.customerName.toLowerCase()).length > 1 && (
                      <span className="block text-[11px] font-normal text-gray-500">
                        {a.phone || 'Telefon kiritilmagan'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{a.phone || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#b45309' }}>
                    {fmt(a.balance)}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}>
                      To&apos;lov
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="px-4 py-2 border-t text-xs text-gray-500">
          Jami {filtered.length} ta mijoz
        </div>
      </div>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selected?.customerName} — to&apos;lov
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p className="text-sm bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            Joriy qarz: <b>{selected ? fmt(selected.balance) : ''}</b>
          </p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <TextField
            label="To'lov summasi (so'm)"
            type="number"
            size="small"
            fullWidth
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="Masalan: 5000"
          />
          <TextField
            label="Izoh (ixtiyoriy)"
            size="small"
            fullWidth
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
          />
          {selected?.transactions?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold text-gray-500 mb-1">So&apos;nggi harakatlar</p>
              <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                {selected.transactions.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex justify-between border-b py-1">
                    <span>{t.kind === 'payment' ? "To'lov" : 'Qarz'}</span>
                    <span className={t.kind === 'payment' ? 'text-green-600' : 'text-amber-700'}>
                      {t.kind === 'payment' ? '-' : '+'}{fmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelected(null)} sx={{ textTransform: 'none' }}>Bekor</Button>
          <Button
            variant="contained"
            onClick={handlePay}
            disabled={saving}
            sx={{ bgcolor: '#4361ee', textTransform: 'none' }}
          >
            To&apos;lovni saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
