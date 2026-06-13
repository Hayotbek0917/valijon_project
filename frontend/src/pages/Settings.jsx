import { useState } from 'react';
import {
  Store, Person, Notifications, Security, Palette,
  Receipt, DarkMode, LightMode,
} from '@mui/icons-material';
import {
  Switch, Button, TextField, Avatar, Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../config/roles';

const allSections = [
  { id: 'market', label: "Market Ma'lumotlari", icon: <Store fontSize="small" />, roles: [ROLES.ADMIN], readOnlyRoles: [ROLES.BOSS] },
  { id: 'profile', label: 'Profil', icon: <Person fontSize="small" />, roles: [ROLES.ADMIN, ROLES.BOSS, ROLES.MANAGER] },
  { id: 'notifications', label: 'Bildirishnomalar', icon: <Notifications fontSize="small" />, roles: [ROLES.ADMIN] },
  { id: 'security', label: 'Xavfsizlik', icon: <Security fontSize="small" />, roles: [ROLES.ADMIN, ROLES.BOSS] },
  { id: 'appearance', label: "Ko'rinish", icon: <Palette fontSize="small" />, roles: [ROLES.ADMIN] },
  { id: 'receipt', label: 'Kvitansiya', icon: <Receipt fontSize="small" />, roles: [ROLES.ADMIN] },
];

const btnSx = { bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } };

export default function Settings() {
  const {
    currentUser,
    permissions,
    updateOwnPassword,
  } = useAuth();

  const isMarketReadOnly = permissions.viewMarketReadOnly;

  const sections = allSections.filter(
    (s) => s.roles.includes(currentUser?.role) || s.readOnlyRoles?.includes(currentUser?.role)
  );
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? 'profile');
  const [darkMode, setDarkMode] = useState(false);
  const [notifs, setNotifs] = useState({ lowStock: true, expire: true, dailyReport: false, orders: true });
  const [market, setMarket] = useState({
    name: 'SmartPOS Market',
    address: 'Toshkent, Yunusobod tumani',
    phone: '+998901234567',
    email: 'info@market.uz',
    taxRate: 12,
    currency: "so'm",
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Parollar mos kelmaydi' });
      return;
    }
    const result = updateOwnPassword(currentPassword, newPassword);
    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: "Parol o'zgartirildi" });
    } else {
      setPasswordMsg({ type: 'error', text: result.error });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Sozlamalar</h1>
        <p className="text-sm text-gray-500">
          {permissions.systemSettings
            ? 'Tizim sozlamalari'
            : isMarketReadOnly
              ? "Do'kon ma'lumotlari va profil"
              : 'Profil va xavfsizlik'}
        </p>
      </div>

      <div className="flex gap-5">
        <div className="w-52 bg-white rounded-xl shadow-sm p-2 h-fit">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors"
              style={{
                background: activeSection === sec.id ? '#eef0ff' : 'transparent',
                color: activeSection === sec.id ? '#4361ee' : '#6b7280',
              }}
            >
              <span style={{ color: activeSection === sec.id ? '#4361ee' : '#9ca3af' }}>{sec.icon}</span>
              {sec.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
          {activeSection === 'market' && (permissions.systemSettings || isMarketReadOnly) && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Market Ma'lumotlari</h2>
              {isMarketReadOnly && (
                <p className="text-sm text-gray-500 mb-4">Faqat ko'rish rejimi</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Market nomi', field: 'name' },
                  { label: 'Manzil', field: 'address' },
                  { label: 'Telefon', field: 'phone' },
                  { label: 'Email', field: 'email' },
                ].map(({ label, field }) => (
                  <TextField
                    key={field}
                    label={label}
                    value={market[field]}
                    onChange={(e) => setMarket((m) => ({ ...m, [field]: e.target.value }))}
                    size="small"
                    disabled={isMarketReadOnly}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                ))}
                <TextField
                  label="Soliq stavkasi (%)"
                  type="number"
                  value={market.taxRate}
                  onChange={(e) => setMarket((m) => ({ ...m, taxRate: e.target.value }))}
                  size="small"
                  disabled={isMarketReadOnly}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  label="Valyuta"
                  value={market.currency}
                  onChange={(e) => setMarket((m) => ({ ...m, currency: e.target.value }))}
                  size="small"
                  disabled={isMarketReadOnly}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
              </div>
              {!isMarketReadOnly && (
                <Button variant="contained" sx={{ mt: 4, ...btnSx }}>Saqlash</Button>
              )}
            </div>
          )}

          {activeSection === 'profile' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Profil</h2>
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#4361ee', fontSize: 22 }}>
                  {currentUser?.name?.charAt(0)}
                </Avatar>
                <div>
                  <p className="font-bold text-gray-800">{currentUser?.name}</p>
                  <p className="text-sm text-gray-500">{ROLE_LABELS[currentUser?.role]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Login: {currentUser?.username}</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && permissions.systemSettings && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Bildirishnomalar</h2>
              <div className="space-y-4">
                {[
                  { key: 'lowStock', label: 'Kam qolgan mahsulotlar', sub: 'Stock minimal darajaga tushganda' },
                  { key: 'expire', label: 'Muddati tugayotgan mahsulotlar', sub: '3 kun oldin ogohlantirish' },
                  { key: 'dailyReport', label: 'Kunlik hisobot', sub: 'Kun oxirida hisobot' },
                  { key: 'orders', label: 'Yangi buyurtmalar', sub: 'Xarid buyurtmasi kelganda' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                    <Switch
                      checked={notifs[key]}
                      onChange={(e) => setNotifs((n) => ({ ...n, [key]: e.target.checked }))}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4361ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4361ee' } }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Parolni o'zgartirish</h2>
              {passwordMsg.text && (
                <Alert severity={passwordMsg.type} sx={{ mb: 3 }} onClose={() => setPasswordMsg({ type: '', text: '' })}>
                  {passwordMsg.text}
                </Alert>
              )}
              <div className="grid grid-cols-1 gap-4 max-w-sm">
                <TextField
                  label="Joriy parol"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  label="Yangi parol"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  label="Yangi parolni tasdiqlang"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
              </div>
              <Button variant="contained" onClick={handlePasswordChange} sx={{ mt: 3, ...btnSx }}>
                Parolni o'zgartirish
              </Button>
            </div>
          )}

          {activeSection === 'appearance' && permissions.systemSettings && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Ko'rinish</h2>
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl max-w-md">
                <div className="flex items-center gap-3">
                  {darkMode ? <DarkMode style={{ color: '#6366f1' }} /> : <LightMode style={{ color: '#f59e0b' }} />}
                  <p className="text-sm font-semibold text-gray-700">{darkMode ? "Qorong'u" : 'Yorug\''} rejim</p>
                </div>
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#4361ee' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4361ee' } }}
                />
              </div>
            </div>
          )}

          {activeSection === 'receipt' && permissions.systemSettings && (
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4">Kvitansiya</h2>
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <TextField label="Sarlavha" defaultValue="SmartPOS Market" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                <TextField label="Pastki matn" defaultValue="Rahmat!" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
              </div>
              <Button variant="contained" sx={{ mt: 4, ...btnSx }}>Saqlash</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
