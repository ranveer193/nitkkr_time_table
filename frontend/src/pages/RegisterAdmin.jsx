import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { departmentAPI } from '../services/api';

// Field component OUTSIDE the render function to prevent re-mount on every keystroke
function Field({ id, label, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function RegisterAdmin() {
  const { registerAdmin } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  useEffect(() => {
    departmentAPI
      .getAll()
      .then((res) => setDepartments(res.data?.data || res.data || []))
      .catch(() => {});
  }, []);

  function validate() {
    const errs = {};
    if (!form.userId.trim()) errs.userId = 'User ID is required';
    if (form.userId.length < 3) errs.userId = 'User ID must be at least 3 characters';
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.department) errs.department = 'Please select your department';
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
      await registerAdmin({
        userId: form.userId,
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department,
      });
      toast.success('Registration submitted! Awaiting super admin approval.');
      navigate('/awaiting-approval');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <div
            className={`w-12 h-12 rounded-xl ${t.bg} text-white flex items-center justify-center mx-auto mb-3`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">Register as Department Admin</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your account will be reviewed by a super admin.
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field id="reg-userid" label="User ID" required>
              <input
                id="reg-userid"
                type="text"
                className="input"
                placeholder="e.g. john.doe"
                value={form.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
              />
              {errors.userId && <p className="text-xs text-red-500 mt-1">{errors.userId}</p>}
            </Field>

            <Field id="reg-name" label="Full Name" required>
              <input
                id="reg-name"
                type="text"
                className="input"
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </Field>

            <Field id="reg-email" label="Email" required>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="e.g. john@college.edu"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </Field>

            <Field id="reg-dept" label="Department" required>
              <select
                id="reg-dept"
                className="input"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
              >
                <option value="">Select your department…</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="reg-password" label="Password" required>
                <input
                  id="reg-password"
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </Field>

              <Field id="reg-confirm" label="Confirm Password" required>
                <input
                  id="reg-confirm"
                  type="password"
                  className="input"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </Field>
            </div>

            <button
              id="reg-submit"
              type="submit"
              className={`${t.btnPrimary} w-full justify-center py-2.5 mt-1`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                'Submit Registration'
              )}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className={`${t.text} font-medium hover:underline`}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
