import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ROLES, isAdmin } from '../config/roles';
import { getPermissions, resolvePermissions, canManageUsers } from '../config/permissions';
import {
  loginRequest,
  logoutRequest,
  getStoredUser,
  fetchStaffUsers,
  validateSession,
  createStaffUser,
} from '../api/auth';
import { getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const loadStaff = useCallback(async (branchId = null) => {
    const staff = await fetchStaffUsers(branchId);
    setUsers(staff);
    return staff;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getAccessToken();
      const stored = getStoredUser();

      if (!token || !stored?.active) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        await validateSession();
        if (cancelled) return;
        setCurrentUser(stored);
      } catch {
        logoutRequest();
        if (!cancelled) {
          setCurrentUser(null);
          setUsers([]);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const user = await loginRequest(username, password);
      try {
        localStorage.removeItem('pos_selected_branch');
      } catch {
        /* ignore */
      }
      setCurrentUser(user);
      setUsers([]);
      return { ok: true, user };
    } catch (err) {
      return { ok: false, error: err.message || "Login yoki parol noto'g'ri" };
    }
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setCurrentUser(null);
    setUsers([]);
  }, []);

  const addUser = useCallback(async ({ username, password, name, role }) => {
    const un = (username || '').trim().toLowerCase();
    if (!un || !password || !name?.trim()) {
      return { ok: false, error: "Barcha maydonlarni to'ldiring" };
    }
    if (!Object.values(ROLES).includes(role)) {
      return { ok: false, error: 'Rol tanlanmagan' };
    }
    try {
      await createStaffUser({ username: un, password, name: name.trim(), role });
      await loadStaff();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Xodim qo\'shilmadi' };
    }
  }, [loadStaff]);

  const addCashier = useCallback((form) => addUser({ ...form, role: ROLES.CASHIER }), [addUser]);

  const updateUserRole = useCallback(() => (
    { ok: false, error: 'Rolni o\'zgartirish hozircha API orqali qo\'llab-quvvatlanmaydi' }
  ), []);

  const toggleUserActive = useCallback((userId, active) => {
    if (currentUser?.id === userId && !active) logout();
    return { ok: false, error: 'Holatni o\'zgartirish hozircha API orqali qo\'llab-quvvatlanmaydi' };
  }, [currentUser, logout]);

  const toggleCashierActive = toggleUserActive;
  const updateOwnPassword = useCallback(() => (
    { ok: false, error: 'Parolni o\'zgartirish hozircha API orqali qo\'llab-quvvatlanmaydi' }
  ), []);

  const permissions = useMemo(
    () => resolvePermissions(currentUser),
    [currentUser],
  );

  return (
    <AuthContext.Provider
      value={{
        authReady,
        currentUser,
        users,
        staffUsers: users,
        cashiers: users.filter((u) => u.role === ROLES.CASHIER),
        loadStaff,
        permissions,
        login,
        logout,
        addUser,
        addCashier,
        updateUserRole,
        toggleUserActive,
        toggleCashierActive,
        updateOwnPassword,
        isAdmin: isAdmin(currentUser),
        isGlobalAdmin: Boolean(currentUser?.isGlobalAdmin),
        isCashier: currentUser?.role === ROLES.CASHIER,
        canManageUsers: canManageUsers(currentUser?.role) && !currentUser?.isGlobalAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
