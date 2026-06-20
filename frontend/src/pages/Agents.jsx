
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Add, Search, Person, Inventory2 } from '@mui/icons-material';
import {
  Button, Avatar, Chip, InputAdornment, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import SupplierCatalogForm from '../components/dealer/SupplierCatalogForm';
import { formatCatalogItemOption } from '../config/dealerProducts';

export default function Agents() {
  const {
    agents, suppliers, currentBusinessId, addAgent, addSupplierCatalogItem,
    getSupplierCatalog, saving,
  } = useApp();
  const [search, setSearch] = useState('');
  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [agentForm, setAgentForm] = useState({ name: '', phone: '', supplierId: '' });

  const businessAgents = agents.filter((a) => String(a.businessId) === String(currentBusinessId));
  const businessSuppliers = suppliers.filter((s) => String(s.businessId) === String(currentBusinessId));

  const filteredAgents = businessAgents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
    || (a.supplierName || '').toLowerCase().includes(search.toLowerCase()),
  );

  const selectedSupplier = selectedAgent
    ? businessSuppliers.find((s) => String(s.id) === String(selectedAgent.supplierId))
    : null;
  const supplierCatalog = selectedAgent
    ? getSupplierCatalog(selectedAgent.supplierId)
    : [];

  const handleSaveAgent = async () => {
    if (!agentForm.name.trim() || !agentForm.phone.trim() || !agentForm.supplierId) return;
    const sup = businessSuppliers.find((s) => String(s.id) === String(agentForm.supplierId));
    const result = await addAgent({
      name: agentForm.name.trim(),
      phone: agentForm.phone.trim(),
      supplierId: sup?.id,
      supplierName: sup?.name || '',
    });
    if (result.ok) {
      setAgentForm({ name: '', phone: '', supplierId: '' });
      setOpenAgentDialog(false);
    } else {
      alert(result.error);
    }
  };

  const handleAddCatalogItem = async (item) => {
    if (!selectedAgent?.supplierId) return;
    setCatalogError('');
    const result = await addSupplierCatalogItem(
      selectedAgent.supplierId,
      item,
      selectedSupplier?.category || '',
    );
    if (!result.ok) {
      setCatalogError(result.error);
    }
  };

  const avatarColor = (name) => {
    const colors = ['#4361ee', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];
    return colors[(name || 'A').charCodeAt(0) % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agentlar</h1>
          <p className="text-sm text-gray-500">Agent ustiga bosing — dilerga yangi mahsulot qo&apos;shing</p>
        </div>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setOpenAgentDialog(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Yangi agent
        </Button>
      </div>

      <TextField
        size="small"
        placeholder="Agent qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280' } }}>
                <TableCell>Agent</TableCell>
                <TableCell>Kompaniya (diler)</TableCell>
                <TableCell>Telefon</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                    <Person style={{ fontSize: 40, color: '#d1d5db' }} />
                    <p className="text-sm mt-2">Agentlar yo&apos;q</p>
                  </TableCell>
                </TableRow>
              ) : filteredAgents.map((a, index) => (
                <TableRow
                  key={a.id}
                  hover
                  onClick={() => {
                    setCatalogError('');
                    setSelectedAgent(a);
                  }}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: index % 2 === 1 ? '#f4f9ff' : 'white',
                    '&:hover': { bgcolor: '#eaf4ff !important' },
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: avatarColor(a.name) }}>
                        {a.name.charAt(0)}
                      </Avatar>
                      <p className="font-semibold text-gray-800">{a.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.supplierName || '—'}
                      size="small"
                      sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#4b5563' }}>{a.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="px-4 py-2 border-t text-xs text-gray-500">
          Jami {filteredAgents.length} ta agent
        </div>
      </div>

      {/* Agent detail — yangi mahsulot qo'shish */}
      <Dialog
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAgent && (
          <>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 18, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
              {selectedAgent.name}
            </DialogTitle>
            <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5, maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-3 border">
                <div>
                  <p className="text-gray-500 text-xs">Diler</p>
                  <p className="font-semibold text-gray-800">{selectedAgent.supplierName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Telefon</p>
                  <p className="font-semibold text-gray-800">{selectedAgent.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Inventory2 style={{ fontSize: 16 }} />
                  Mavjud mahsulotlar ({supplierCatalog.length})
                </p>
                {supplierCatalog.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3 border">Hali mahsulot yo&apos;q</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {supplierCatalog.map((item) => (
                      <Chip
                        key={item.id}
                        label={formatCatalogItemOption(item)}
                        size="small"
                        sx={{ fontSize: 11, maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Divider />

              {catalogError && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{catalogError}</p>
              )}

              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Yangi mahsulot qo&apos;shish</p>
              <SupplierCatalogForm
                singleMode
                onAddSingle={handleAddCatalogItem}
                onError={setCatalogError}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #f1f5f9' }}>
              <Button onClick={() => setSelectedAgent(null)} sx={{ textTransform: 'none' }}>
                Yopish
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Mavjud dilerga yangi agent */}
      <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Yangi agent</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <p className="text-xs text-gray-500">
            Mavjud dilerga agent biriktirish. Yangi diler — <b>Dilerlar → Zakaz → Yangi diler</b>.
          </p>
          <TextField
            label="Agent ismi"
            value={agentForm.name}
            onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
            size="small"
            fullWidth
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Diler (kompaniya) *</InputLabel>
            <Select
              label="Diler (kompaniya) *"
              value={agentForm.supplierId}
              onChange={(e) => setAgentForm((f) => ({ ...f, supplierId: e.target.value }))}
            >
              {businessSuppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Telefon"
            value={agentForm.phone}
            onChange={(e) => setAgentForm((f) => ({ ...f, phone: e.target.value }))}
            size="small"
            fullWidth
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAgentDialog(false)} sx={{ textTransform: 'none' }}>Bekor</Button>
          <Button
            onClick={handleSaveAgent}
            variant="contained"
            disabled={saving}
            sx={{ bgcolor: '#4361ee', textTransform: 'none' }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
