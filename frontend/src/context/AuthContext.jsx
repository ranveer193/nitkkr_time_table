import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  // ─── Check Auth on Mount ───────────────────────────────────────────────────
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('tt_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      const userData = res.data?.data || res.data;
      setUser(userData);
      setAwaitingApproval(userData?.role === 'PENDING');
    } catch {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ─── Register Admin ────────────────────────────────────────────────────────
  const registerAdmin = useCallback(async (formData) => {
    const res = await authAPI.registerAdmin(formData);
    return res.data;
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    const token = res.data.token;
    const userData = res.data.data;
    localStorage.setItem('tt_token', token);
    localStorage.setItem('tt_user', JSON.stringify(userData));
    setUser(userData);
    setAwaitingApproval(userData?.role === 'PENDING');
    return userData;
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('tt_token');
    localStorage.removeItem('tt_user');
    setUser(null);
    setAwaitingApproval(false);
  }, []);

  // ─── Permission helpers ────────────────────────────────────────────────────
  const isLoggedIn = Boolean(user);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isDepartmentAdmin = user?.role === ROLES.DEPARTMENT_ADMIN;

  /**
   * Can the current user edit cells of a given department id?
   */
  const canEditCells = useCallback(
    (departmentId) => {
      if (!isLoggedIn) return false;
      if (isDepartmentAdmin) {
        return user?.department?._id === departmentId ||
          user?.department === departmentId;
      }
      return false;
    },
    [isLoggedIn, isDepartmentAdmin, user]
  );

  /**
   * Can manage system resources (super admin only)
   */
  const canManageSystem = isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        awaitingApproval,
        isLoggedIn,
        isSuperAdmin,
        isDepartmentAdmin,
        canEditCells,
        canManageSystem,
        checkAuth,
        login,
        registerAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
