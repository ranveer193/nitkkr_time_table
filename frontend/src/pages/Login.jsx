import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const user = await login(form);
      if (user?.role === 'PENDING') {
        navigate('/awaiting-approval');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className={`w-12 h-12 rounded-xl ${t.bg} text-white text-lg font-bold flex items-center justify-center mx-auto mb-3`}
          >
            TT
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">Sign in to TimeTabl</h1>
          <p className="text-sm text-slate-500 mt-1">Admin portal for timetable management</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="Enter your email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <button
              id="login-submit"
              type="submit"
              className={`${t.btnPrimary} w-full justify-center py-2.5`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-sm text-slate-500">
              Need admin access?{' '}
              <Link
                to="/register-admin"
                className={`${t.text} font-medium hover:underline`}
              >
                Register as Admin
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to public timetables
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
