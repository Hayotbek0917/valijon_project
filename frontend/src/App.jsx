import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { getHomePath } from './config/roles';

function AppShell() {
  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

export default function App() {
  const { authReady, currentUser } = useAuth();
  const { dataReady, dataError } = useApp();

  if (!authReady || (currentUser && !dataReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f2f5' }}>
        <p className="text-gray-500 text-sm">Yuklanmoqda...</p>
      </div>
    );
  }

  if (currentUser && dataError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6" style={{ background: '#f0f2f5' }}>
        <p className="text-red-600 text-sm text-center">{dataError}</p>
        <p className="text-gray-500 text-xs text-center">
          Backend ishlayotganini tekshiring: <code>uv run python manage.py runserver</code>
        </p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to={getHomePath(currentUser.role)} replace /> : <Login />}
      />
      <Route
        path="/*"
        element={currentUser ? <AppShell /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
