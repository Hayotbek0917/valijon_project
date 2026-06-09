import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  PointOfSale,
  Inventory as InventoryIcon,
  LocalShipping,
  ShoppingCart,
  Analytics,
  WarningAmber,
  Assessment,
  Settings,
  ExpandMore,
  ExpandLess,
  ShoppingBag,
  Person,
  MenuOpen,
  Menu,
  Groups,
} from '@mui/icons-material';
import { Avatar, Collapse, IconButton } from '@mui/material';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_MAIN, NAV_GROUPS, NAV_BOTTOM, isDilerlarPath, filterByRole, filterGroupsByRole } from '../../config/navigation';
import { ROLE_LABELS } from '../../config/roles';
import { PRIMARY_COLOR, SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from '../../config/constants';

const navIcons = {
  dashboard: <DashboardIcon fontSize="small" />,
  pos: <PointOfSale fontSize="small" />,
  products: <ShoppingBag fontSize="small" />,
  inventory: <InventoryIcon fontSize="small" />,
  agents: <Person fontSize="small" />,
  suppliers: <LocalShipping fontSize="small" />,
  'ai-analytics': <Analytics fontSize="small" />,
  expire: <WarningAmber fontSize="small" />,
  reports: <Assessment fontSize="small" />,
  settings: <Settings fontSize="small" />,
  staff: <Groups fontSize="small" />,
};

function NavButton({ item, isActive, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-2.5'} text-left transition-all duration-150 relative`}
      style={{
        background: isActive ? PRIMARY_COLOR : 'transparent',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
      }}
      title={collapsed ? item.label : undefined}
    >
      <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
        {navIcons[item.icon]}
      </span>
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      {isActive && !collapsed && (
        <span className="absolute right-0 w-1 h-8 rounded-l" style={{ background: '#fff' }} />
      )}
    </button>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed } = useApp();
  const { currentUser, logout } = useAuth();
  const [dilerlarOpen, setDilerlarOpen] = useState(isDilerlarPath(location.pathname));
  const [userOpen, setUserOpen] = useState(false);

  const role = currentUser?.role;
  const mainNav = filterByRole(NAV_MAIN, role);
  const bottomNav = filterByRole(NAV_BOTTOM, role);
  const navGroups = filterGroupsByRole(NAV_GROUPS, role);
  const dilerlarGroup = navGroups.find((g) => g.id === 'dilerlar');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (isDilerlarPath(location.pathname)) {
      setDilerlarOpen(true);
    }
  }, [location.pathname]);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div
      className="flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300"
      style={{
        background: 'linear-gradient(180deg, #1a2035 0%, #1a2035 100%)',
        width: sidebarWidth,
      }}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PRIMARY_COLOR }}>
              <ShoppingCart style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <span className="text-white font-bold text-base leading-tight">POS</span>
          </div>
        )}
        {!collapsed && (
          <IconButton onClick={() => setCollapsed(true)} size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <MenuOpen />
          </IconButton>
        )}
        {collapsed && (
          <IconButton
            onClick={() => setCollapsed(false)}
            size="small"
            sx={{ color: 'rgba(255,255,255,0.6)', mt: 1, mx: 'auto' }}
          >
            <Menu />
          </IconButton>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide space-y-1">
        {mainNav.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            collapsed={collapsed}
            onClick={() => navigate(item.path)}
          />
        ))}

        {dilerlarGroup && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                  setDilerlarOpen(true);
                } else {
                  setDilerlarOpen(!dilerlarOpen);
                }
              }}
              className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-2.5'} text-left transition-all duration-150`}
              style={{
                background: isDilerlarPath(location.pathname) ? PRIMARY_COLOR : 'transparent',
                color: isDilerlarPath(location.pathname) ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                {navIcons[dilerlarGroup.icon]}
              </span>
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{dilerlarGroup.label}</span>
                  {dilerlarOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </>
              )}
            </button>
            <Collapse in={dilerlarOpen && !collapsed}>
              <div className="bg-black/20 py-1">
                {dilerlarGroup.children.map((child) => (
                  <button
                    key={child.path}
                    type="button"
                    onClick={() => navigate(child.path)}
                    className={`w-full flex items-center gap-3 pl-12 pr-5 py-2 text-left text-xs transition-colors ${
                      location.pathname === child.path ? 'text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>• {child.label}</span>
                  </button>
                ))}
              </div>
            </Collapse>
          </div>
        )}

        {bottomNav.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            collapsed={collapsed}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      <div className="border-t border-white/10">
        <button
          type="button"
          className={`w-full flex items-center ${collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-4'} hover:bg-white/5 transition-colors`}
          onClick={() => !collapsed && setUserOpen(!userOpen)}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: PRIMARY_COLOR, fontSize: 14 }}>
            {currentUser?.name?.charAt(0) ?? '?'}
          </Avatar>
          {!collapsed && (
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-medium leading-tight">{currentUser?.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {ROLE_LABELS[currentUser?.role] ?? ''}
              </p>
            </div>
          )}
          {!collapsed &&
            (userOpen ? (
              <ExpandLess style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
            ) : (
              <ExpandMore style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
            ))}
        </button>
        <Collapse in={userOpen && !collapsed}>
          <div className="px-5 pb-3">
            <button
              type="button"
              className="w-full text-left text-xs py-1.5 hover:text-white transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onClick={() => navigate('/settings')}
            >
              Profil sozlamalari
            </button>
            <button
              type="button"
              className="w-full text-left text-xs py-1.5 hover:text-red-400 transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onClick={handleLogout}
            >
              Chiqish
            </button>
          </div>
        </Collapse>
      </div>
    </div>
  );
}
