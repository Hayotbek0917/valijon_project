import { useState } from 'react';
import { GroupAdd, Delete } from '@mui/icons-material';
import {
  Alert, Button, TextField, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../config/roles';

const btnSx = {
  bgcolor: '#4361ee',
  borderRadius: 1.5,
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': { bgcolor: '#3451d1' },
};

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' },
};

const ASSIGNABLE_ROLES = [ROLES.BOSS, ROLES.MANAGER, ROLES.CASHIER];

export default function Staff() {
  const {
    currentUser,
    permissions,
    users,
    addUser,
    updateUserRole,
    toggleUserActive,
  } = useAuth();

  const isReadOnly = !permissions.manageUsers;
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', role: ROLES.CASHIER });
  const [userMsg, setUserMsg] = useState({ type: '', text: '' });

  const handleAddUser = async () => {
    const result = await addUser(userForm);
    if (result.ok) {
      setUserForm({ username: '', password: '', name: '', role: ROLES.CASHIER });
      setUserMsg({ type: 'success', text: "Xodim qo'shildi" });
    } else {
      setUserMsg({ type: 'error', text: result.error });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Xodimlar</h1>
        <p className="text-sm text-gray-500">
          {permissions.manageUsers
            ? 'Xodimlar ro\'yxati va yangi xodim qo\'shish (Admin / Boss)'
            : 'Xodimlar ro\'yxati (faqat ko\'rish)'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {userMsg.text && (
          <Alert severity={userMsg.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setUserMsg({ type: '', text: '' })}>
            {userMsg.text}
          </Alert>
        )}

        {permissions.manageUsers && (
          <div className="p-5 border border-gray-100 rounded-xl mb-6 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Yangi xodim</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Login"
                value={userForm.username}
                onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Parol"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Ism"
                value={userForm.name}
                onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <FormControl size="small" fullWidth sx={fieldSx}>
                <InputLabel id="new-user-role">Rol</InputLabel>
                <Select
                  labelId="new-user-role"
                  label="Rol"
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <Button variant="contained" startIcon={<GroupAdd />} onClick={handleAddUser} sx={{ mt: 4, ...btnSx }}>
              Xodim qo&apos;shish
            </Button>
          </div>
        )}

        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: '#6b7280' } }}>
              <TableCell>Login</TableCell>
              <TableCell>Ism</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Holat</TableCell>
              <TableCell align="right">Amal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ fontSize: 13 }}>{u.username}</TableCell>
                <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{u.name}</TableCell>
                <TableCell>
                  {isReadOnly || u.id === currentUser?.id || u.role === ROLES.ADMIN ? (
                    <Chip label={ROLE_LABELS[u.role]} size="small" sx={{ fontSize: 11 }} />
                  ) : (
                    <Select
                      size="small"
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      sx={{ fontSize: 12, minWidth: 140 }}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <MenuItem key={r} value={r} sx={{ fontSize: 12 }}>{ROLE_LABELS[r]}</MenuItem>
                      ))}
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.active ? 'Faol' : 'Nofaol'}
                    size="small"
                    sx={{
                      fontSize: 11,
                      bgcolor: u.active ? '#f0fdf4' : '#fee2e2',
                      color: u.active ? '#22c55e' : '#ef4444',
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  {!isReadOnly && u.id !== currentUser?.id && u.role !== ROLES.ADMIN && (
                    <IconButton
                      size="small"
                      onClick={() => toggleUserActive(u.id, !u.active)}
                      title={u.active ? 'Nofaol qilish' : 'Faollashtirish'}
                    >
                      <Delete style={{ fontSize: 16, color: u.active ? '#9ca3af' : '#22c55e' }} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
