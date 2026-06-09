
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Add, Search, Person } from '@mui/icons-material';
import PagePagination from '../components/ui/PagePagination';
import { Button, Avatar, Chip, InputAdornment, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const itemsPerPage = 5;

export default function Agents() {
  const { agents, suppliers, currentBusinessId, addAgent, saving } = useApp();
  const [search, setSearch] = useState('');
  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', phone: '', supplierId: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const businessAgents = agents.filter(a => a.businessId === currentBusinessId);
  const businessSuppliers = suppliers.filter(s => s.businessId === currentBusinessId);

  const handleSaveAgent = async () => {
    if (!agentForm.name || !agentForm.phone || !agentForm.supplierId) return;
    const sup = businessSuppliers.find(s => String(s.id) === String(agentForm.supplierId));
    const result = await addAgent({
      name: agentForm.name,
      phone: agentForm.phone,
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

  const avatarColor = (name) => {
    const colors = ['#4361ee', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const filteredAgents = businessAgents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agentlar Tizimi</h1>
          <p className="text-sm text-gray-500">Agentlar ro'yxati va ularni boshqarish</p>
        </div>
        <div>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAgentDialog(true)}
            sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}
          >
            Yangi Agent
          </Button>
        </div>
      </div>

      {/* Filtering */}
      <div className="flex gap-3">
        <TextField
          size="small"
          placeholder="Agent qidirish..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px]">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Agent ismi</TableCell>
                <TableCell>Kompaniya / Agentlik</TableCell>
                <TableCell>Telefon raqami</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                    <Person className="mb-2 text-gray-300" style={{ fontSize: 40 }} />
                    <p className="text-sm">Agentlar mavjud emas</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedList.map((a, index) => {
                  const isEven = index % 2 === 1;
                  return (
                    <TableRow 
                      key={a.id} 
                      hover 
                      sx={{ 
                        '& td': { py: 1.5, fontSize: 13 },
                        bgcolor: isEven ? '#f4f9ff' : 'white',
                        '&:hover': { bgcolor: '#eaf4ff !important' }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: avatarColor(a.name) }}>
                            {a.name.charAt(0)}
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-800">{a.name}</p>
                            <p className="text-xs text-gray-400">ID: {a.id.toString().slice(-6)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={a.supplierName || 'Kompaniya kiritilmagan'} 
                          size="small" 
                          sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} 
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#4b5563', fontWeight: 500 }}>{a.phone}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PagePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          info={`Jami ${filteredAgents.length} ta · ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filteredAgents.length)}`}
        />
      </div>

      {/* Dialog for adding Agent */}
      <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, borderBottom: '1px solid #f1f5f9', pb: 2 }}>Yangi Agent Qo'shish</DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
            Agent faqat diler bilan bog&apos;lanadi. Yangi mahsulotlar <b>Dilerlar → Zakaz</b> da katalogga qo&apos;shiladi,
            keyin <b>Mahsulotlar</b> sahifasida bildirishnoma orqali ro&apos;yxatga olinadi va <b>Prixod</b>da qoldiq to&apos;ldiriladi.
          </p>
          <TextField
            label="Agent Ismi"
            value={agentForm.name}
            onChange={(e) => setAgentForm(f => ({ ...f, name: e.target.value }))}
            size="small"
            fullWidth
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Diler (Supplier)</InputLabel>
            <Select label="Diler (Supplier)" value={agentForm.supplierId}
              onChange={(e) => setAgentForm(f => ({ ...f, supplierId: e.target.value }))}>
              {businessSuppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Telefon raqami"
            value={agentForm.phone}
            onChange={(e) => setAgentForm(f => ({ ...f, phone: e.target.value }))}
            size="small"
            fullWidth
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenAgentDialog(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Bekor qilish</Button>
          <Button onClick={handleSaveAgent} variant="contained" disabled={saving}
            sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}>
            Agentni Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
