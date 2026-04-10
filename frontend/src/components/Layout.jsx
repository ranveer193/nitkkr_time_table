import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

/**
 * Authenticated admin layout with top navigation bar
 */
export default function Layout({ children }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 text-slate-800 hover:text-slate-900"
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold ${t.bg}`}
              >
                TT
              </div>
              <span className="font-semibold text-base">TimeTabl</span>
              {isSuperAdmin && (
                <span className={`badge ${t.badgeAccent} ml-1`}>Super Admin</span>
              )}
            </Link>

            {/* Right nav */}
            <div className="flex items-center gap-2">
              {/* User info */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 mr-1">
                  <div className={`w-7 h-7 rounded-full ${t.bgLight} ${t.textDark} flex items-center justify-center text-xs font-semibold`}>
                    {(user.name || user.userId || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name || user.userId}</span>
                </div>
              )}

              <ThemeToggle />

              <button
                id="logout-btn"
                onClick={handleLogout}
                className="btn-ghost text-slate-500"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3">
        <p className="text-center text-xs text-slate-400">
          TimeTabl · College Timetable Management System
        </p>
      </footer>
    </div>
  );
}
