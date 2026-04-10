import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

/**
 * Public layout — no authentication, used for home and public timetable pages
 */
export default function PublicLayout({ children }) {
  const { t } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-slate-800 hover:text-slate-900">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold ${t.bg}`}
              >
                TT
              </div>
              <span className="font-semibold text-base">TimeTabl</span>
            </Link>

            {/* Right nav */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                id="admin-login-btn"
                className="btn-secondary text-sm"
                onClick={() => navigate('/login')}
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            TimeTabl · College Timetable Management System
          </p>
          <Link to="/login" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Admin Login →
          </Link>
        </div>
      </footer>
    </div>
  );
}
