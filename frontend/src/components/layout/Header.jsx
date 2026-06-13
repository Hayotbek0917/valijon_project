import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  NotificationsOutlined,
  FullscreenOutlined,
  CalendarToday,
  LocalShipping,
  Inventory2,
} from '@mui/icons-material';
import { Badge, Menu, MenuItem, Divider, ListItemIcon, ListItemText } from '@mui/material';
import { getPageTitle } from '../../config/navigation';
import { useApp } from '../../context/AppContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getIncomingAlerts } = useApp();
  const { unlinkedCatalog, pendingReceipts, totalCount } = getIncomingAlerts();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const pageTitle = getPageTitle(location.pathname);
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const goTo = (path) => {
    setAnchorEl(null);
    navigate(path);
  };

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-40"
      style={{ minHeight: 60 }}
    >
      <h1 className="text-lg font-bold text-gray-800 shrink-0">{pageTitle}</h1>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{today}</span>
        <CalendarToday style={{ fontSize: 16, color: '#6b7280' }} />
      </div>

      <button
        type="button"
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Bildirishnomalar"
      >
        <Badge
          badgeContent={totalCount}
          color="error"
          invisible={totalCount === 0}
          sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}
        >
          <NotificationsOutlined style={{ fontSize: 22, color: '#6b7280' }} />
        </Badge>
      </button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 320, mt: 1, borderRadius: 2 } }}
      >
        <div className="px-4 py-2">
          <p className="font-bold text-sm text-gray-800">Bildirishnomalar</p>
        </div>
        <Divider />
        {totalCount === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="Yangi xabar yo'q" secondary="Hammasi tartibda" />
          </MenuItem>
        ) : (
          <>
            {unlinkedCatalog.length > 0 && (
              <MenuItem onClick={() => goTo('/products')}>
                <ListItemIcon><Inventory2 fontSize="small" color="warning" /></ListItemIcon>
                <ListItemText
                  primary={`${unlinkedCatalog.length} ta yangi mahsulot`}
                  secondary="Diler katalogidan — Mahsulotlar ro'yxatiga qo'shing"
                />
              </MenuItem>
            )}
            {pendingReceipts.length > 0 && (
              <MenuItem onClick={() => goTo('/dilerlar/prixod')}>
                <ListItemIcon><LocalShipping fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText
                  primary={`${pendingReceipts.length} ta prixod kutilmoqda`}
                  secondary="Dilerlar → Prixod bo'limida qabul qiling"
                />
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      <button
        type="button"
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={handleFullscreen}
      >
        <FullscreenOutlined style={{ fontSize: 22, color: '#6b7280' }} />
      </button>
    </header>
  );
}
