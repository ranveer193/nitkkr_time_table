import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';

// Pages
import Login from './pages/Login';
import RegisterAdmin from './pages/RegisterAdmin';
import AwaitingApproval from './pages/AwaitingApproval';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TimetableView from './pages/TimetableView';
import PublicHome from './pages/PublicHome';
import PublicTimetableView from './pages/PublicTimetableView';

// Route guard
import ProtectedRoute from './components/ProtectedRoute';

function AdminDashboardRouter() {
  const { user } = useAuth();
  if (user?.role === ROLES.SUPER_ADMIN) return <SuperAdminDashboard />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <Routes>
      {/* ─── Public Routes ───────────────────────────────────────────── */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/public/timetable/:id" element={<PublicTimetableView />} />

      {/* ─── Auth Routes ─────────────────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-admin" element={<RegisterAdmin />} />
      <Route path="/awaiting-approval" element={<AwaitingApproval />} />

      {/* ─── Protected Admin Routes ──────────────────────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/timetable/:id"
        element={
          <ProtectedRoute>
            <TimetableView />
          </ProtectedRoute>
        }
      />

      {/* ─── Fallback ────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
