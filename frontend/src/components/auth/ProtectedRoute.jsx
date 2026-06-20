import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoute, getHomePath } from '../../config/roles';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canAccessRoute(currentUser.role, location.pathname)) {
    return <Navigate to={getHomePath(currentUser.role)} replace />;
  }

  return children;
}
