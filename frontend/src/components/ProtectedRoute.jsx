import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * Rules:
 * - Not logged in → redirect /login
 * - Awaiting approval → redirect /awaiting-approval
 * - Optional: require specific role (role prop)
 */
export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, loading, awaitingApproval, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (awaitingApproval) {
    return <Navigate to="/awaiting-approval" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
