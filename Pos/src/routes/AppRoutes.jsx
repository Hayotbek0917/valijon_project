import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import POS from '../pages/POS';
import Products from '../pages/Products';
import Agents from '../pages/Agents';
import DealerOrders from '../pages/DealerOrders';
import DealerReceipts from '../pages/DealerReceipts';
import Suppliers from '../pages/Suppliers';
import PurchaseOrders from '../pages/PurchaseOrders';
import AIAnalytics from '../pages/AIAnalytics';
import ExpireManagement from '../pages/ExpireManagement';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import Staff from '../pages/Staff';

function Guard({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Guard><Dashboard /></Guard>} />
      <Route path="/pos" element={<Guard><POS /></Guard>} />
      <Route path="/products" element={<Guard><Products /></Guard>} />
      <Route path="/inventory" element={<Navigate to="/products" replace />} />
      <Route path="/agents" element={<Guard><Agents /></Guard>} />
      <Route path="/dilerlar/zakaz" element={<Guard><DealerOrders /></Guard>} />
      <Route path="/dilerlar/prixod" element={<Guard><DealerReceipts /></Guard>} />
      <Route path="/suppliers" element={<Guard><Suppliers /></Guard>} />
      <Route path="/purchase-orders" element={<Guard><PurchaseOrders /></Guard>} />
      <Route path="/ai-analytics" element={<Guard><AIAnalytics /></Guard>} />
      <Route path="/expire-management" element={<Guard><ExpireManagement /></Guard>} />
      <Route path="/reports" element={<Guard><Reports /></Guard>} />
      <Route path="/staff" element={<Guard><Staff /></Guard>} />
      <Route path="/settings" element={<Guard><Settings /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
