import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import ApprovalModal from '../components/ApprovalModal';
import ConfirmModal from '../components/ConfirmModal';
import CreateDepartmentModal from '../components/CreateDepartmentModal';
import CreateBuildingModal from '../components/CreateBuildingModal';
import CreateRoomModal from '../components/CreateRoomModal';
import CreateTimetableModal from '../components/CreateTimetableModal';
import {
  adminAPI,
  departmentAPI,
  buildingAPI,
  roomAPI,
  timetableAPI,
} from '../services/api';
import { formatDate } from '../utils/formatters';

const TABS = [
  { id: 'pending', label: 'Pending Admins' },
  { id: 'admins', label: 'Department Admins' },
  { id: 'departments', label: 'Departments' },
  { id: 'buildings', label: 'Buildings' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'timetables', label: 'Timetables' },
];

export default function SuperAdminDashboard() {
  const { t } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState(null);

  // Data lists
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetables, setTimetables] = useState([]);

  // Loading states per tab
  const [loading, setLoading] = useState({});

  // Timetable filters
  const [ttSearch, setTtSearch] = useState('');

  // Modals
  const [approvalModal, setApprovalModal] = useState({ open: false, admin: null, action: null });
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [deptModal, setDeptModal] = useState({ open: false, department: null });
  const [buildingModal, setBuildingModal] = useState({ open: false, building: null });
  const [roomModal, setRoomModal] = useState({ open: false, room: null });
  const [ttModal, setTtModal] = useState(false);

  // ─── Load Stats ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data?.data || res.data);
    } catch { }
  }, []);

  // ─── Per-tab data loaders ────────────────────────────────────────────────────
  const loaders = {
    pending: useCallback(async () => {
      setLoading((l) => ({ ...l, pending: true }));
      try {
        const res = await adminAPI.getPendingAdmins();
        setPendingAdmins(res.data?.data || res.data || []);
      } finally {
        setLoading((l) => ({ ...l, pending: false }));
      }
    }, []),

    admins: useCallback(async () => {
      setLoading((l) => ({ ...l, admins: true }));
      try {
        const res = await adminAPI.getActiveAdmins();
        setActiveAdmins(res.data?.data || res.data || []);
      } finally {
        setLoading((l) => ({ ...l, admins: false }));
      }
    }, []),

    departments: useCallback(async () => {
      setLoading((l) => ({ ...l, departments: true }));
      try {
        const res = await departmentAPI.getAll();
        setDepartments(res.data?.data || res.data || []);
      } finally {
        setLoading((l) => ({ ...l, departments: false }));
      }
    }, []),

    buildings: useCallback(async () => {
      setLoading((l) => ({ ...l, buildings: true }));
      try {
        const res = await buildingAPI.getAll();
        setBuildings(res.data?.data || res.data || []);
      } finally {
        setLoading((l) => ({ ...l, buildings: false }));
      }
    }, []),

    rooms: useCallback(async () => {
      setLoading((l) => ({ ...l, rooms: true }));
      try {
        const [roomsRes, bldRes] = await Promise.all([roomAPI.getAll(), buildingAPI.getAll()]);
        setRooms(roomsRes.data?.data || roomsRes.data || []);
        setBuildings(bldRes.data?.data || bldRes.data || []);
      } finally {
        setLoading((l) => ({ ...l, rooms: false }));
      }
    }, []),

    timetables: useCallback(async () => {
      setLoading((l) => ({ ...l, timetables: true }));
      try {
        const [ttRes, dRes, bldRes, roomsRes] = await Promise.all([
          timetableAPI.getAll(),
          departmentAPI.getAll(),
          buildingAPI.getAll(),
          roomAPI.getAll(),
        ]);
        setTimetables(ttRes.data?.data || ttRes.data || []);
        setDepartments(dRes.data?.data || dRes.data || []);
        setBuildings(bldRes.data?.data || bldRes.data || []);
        setRooms(roomsRes.data?.data || roomsRes.data || []);
      } finally {
        setLoading((l) => ({ ...l, timetables: false }));
      }
    }, []),
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const loader = loaders[activeTab];
    if (loader) loader();
  }, [activeTab]); // eslint-disable-line

  // ─── Approval actions ────────────────────────────────────────────────────────
  async function handleApprovalConfirm() {
    const { admin, action } = approvalModal;
    setApprovalLoading(true);
    try {
      if (action === 'approve') {
        const payload = { departmentId: admin.department?._id || admin.department };
        await adminAPI.approveAdmin(admin._id, payload);
        toast.success(`${admin.name} approved`);
      } else {
        await adminAPI.rejectAdmin(admin._id);
        toast.success(`${admin.name} rejected`);
      }
      setApprovalModal({ open: false, admin: null, action: null });
      loaders.pending();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setApprovalLoading(false);
    }
  }

  // ─── Delete helpers via ConfirmModal ─────────────────────────────────────────
  function confirmDelete(title, message, onConfirm) {
    setConfirmModal({ open: true, title, message, onConfirm });
  }

  async function handleConfirmAction() {
    setConfirmLoading(true);
    try {
      await confirmModal.onConfirm();
    } finally {
      setConfirmLoading(false);
      setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
    }
  }

  // ─── Delete department ────────────────────────────────────────────────────────
  function deleteDepartment(dept) {
    confirmDelete(
      'Delete Department',
      `Are you sure you want to delete "${dept.name}"? This action is irreversible.`,
      async () => {
        await departmentAPI.delete(dept._id);
        toast.success('Department deleted');
        loaders.departments();
        loadStats();
      }
    );
  }

  // ─── Delete building ──────────────────────────────────────────────────────────
  function deleteBuilding(b) {
    confirmDelete(
      'Delete Building',
      `Deleting this building will permanently remove all associated rooms and timetables. This action cannot be undone.`,
      async () => {
        await buildingAPI.delete(b._id);
        toast.success('Building deleted successfully');
        loaders.buildings();
        loadStats();
      }
    );
  }

  // ─── Delete room ──────────────────────────────────────────────────────────────
  function deleteRoom(r) {
    confirmDelete(
      'Delete Room',
      `Deleting this room will remove all associated timetables. This action cannot be undone.`,
      async () => {
        await roomAPI.delete(r._id);
        toast.success('Room deleted successfully');
        loaders.rooms();
        loadStats();
      }
    );
  }

  // ─── Delete timetable ─────────────────────────────────────────────────────────
  function deleteTimetable(tt) {
    confirmDelete(
      'Delete Timetable',
      `Delete timetable "${tt.title}"? All cell data will be permanently removed.`,
      async () => {
        await timetableAPI.delete(tt._id);
        toast.success('Timetable deleted');
        loaders.timetables();
        loadStats();
      }
    );
  }

  // ─── Delete admin ─────────────────────────────────────────────────────────────
  function deleteAdmin(admin) {
    confirmDelete(
      'Remove Admin',
      `Remove "${admin.name}" from the system? They will lose all access.`,
      async () => {
        await adminAPI.deleteAdmin(admin._id);
        toast.success('Admin removed');
        loaders.admins();
        loadStats();
      }
    );
  }

  // ─── Toggle admin status ──────────────────────────────────────────────────────
  async function toggleAdmin(admin) {
    try {
      await adminAPI.toggleAdminStatus(admin._id);
      toast.success('Admin status updated');
      loaders.admins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  }

  // ─── Filtered timetables ──────────────────────────────────────────────────────
  const filteredTimetables = timetables.filter((tt) => {
    if (!ttSearch) return true;
    const s = ttSearch.toLowerCase();
    const titleMatch = (tt.title || '').toLowerCase().includes(s);
    const buildingMatch = (tt.building?.name || '').toLowerCase().includes(s) || (tt.building?.code || '').toLowerCase().includes(s);
    const roomMatch = (tt.room?.name || '').toLowerCase().includes(s);
    return titleMatch || buildingMatch || roomMatch;
  });

  // ─── Skeleton Loader ──────────────────────────────────────────────────────────
  function SkeletonRows({ count = 3 }) {
    return (
      <div className="animate-fade-in">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-row border-b border-slate-100 last:border-0">
            <div className="skeleton h-9 w-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3 rounded-md" />
              <div className="skeleton h-3 w-1/3 rounded-md" />
            </div>
            <div className="skeleton h-8 w-20 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  function EmptyState({ message, icon }) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          {icon || (
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
        </div>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Super Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage all system resources and admin accounts</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending Applications', value: stats.pendingAdmins ?? 0, icon: '⏳', color: 'bg-amber-50 text-amber-600' },
            { label: 'Active Admins', value: stats.activeAdmins ?? 0, icon: '👤', color: `${t.bgLight} ${t.textDark}` },
            { label: 'Total Timetables', value: stats.timetables ?? 0, icon: '📅', color: 'bg-blue-50 text-blue-600' },
            { label: 'Departments', value: stats.departments ?? 0, icon: '🏛', color: 'bg-purple-50 text-purple-600' },
          ].map((s) => (
            <div key={s.label} className="stat-card flex items-center gap-4">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? t.tabActive : 'tab-btn'}
          >
            {tab.label}
            {tab.id === 'pending' && pendingAdmins.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5">
                {pendingAdmins.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab: Pending Admins ─── */}
      {activeTab === 'pending' && (
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Pending Approval Requests</h2>
          </div>
          {loading.pending ? (
            <SkeletonRows />
          ) : pendingAdmins.length === 0 ? (
            <EmptyState message="No pending approval requests." />
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingAdmins.map((admin) => (
                <div key={admin._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{admin.name}</span>
                      <span className="badge badge-slate">{admin.userId}</span>
                      <span className="badge badge-amber">Pending</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{admin.email}</p>
                    {admin.department?.name && (
                      <p className="text-xs text-slate-400">Dept: {admin.department.name}</p>
                    )}
                    <p className="text-xs text-slate-400">Applied: {formatDate(admin.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      id={`approve-${admin._id}`}
                      className="btn-primary py-1.5 px-3 text-xs"
                      onClick={() => setApprovalModal({ open: true, admin, action: 'approve' })}
                    >
                      Approve
                    </button>
                    <button
                      id={`reject-${admin._id}`}
                      className="btn-danger py-1.5 px-3 text-xs"
                      onClick={() => setApprovalModal({ open: true, admin, action: 'reject' })}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Active Admins ─── */}
      {activeTab === 'admins' && (
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Department Admins</h2>
          </div>
          {loading.admins ? (
            <SkeletonRows />
          ) : activeAdmins.length === 0 ? (
            <EmptyState message="No department admins found." />
          ) : (
            <div className="divide-y divide-slate-100">
              {activeAdmins.map((admin) => (
                <div key={admin._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{admin.name}</span>
                      <span className="badge badge-slate">{admin.userId}</span>
                      <span className={`badge ${admin.isActive !== false ? 'badge-emerald' : 'badge-red'}`}>
                        {admin.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{admin.email}</p>
                    {admin.department?.name && (
                      <p className="text-xs text-slate-400">Dept: {admin.department.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      id={`toggle-${admin._id}`}
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => toggleAdmin(admin)}
                    >
                      {admin.isActive !== false ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      id={`delete-admin-${admin._id}`}
                      className="btn-danger py-1.5 px-3 text-xs"
                      onClick={() => deleteAdmin(admin)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Departments ─── */}
      {activeTab === 'departments' && (
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Departments</h2>
            <button
              id="create-dept-btn"
              className={t.btnPrimary}
              onClick={() => setDeptModal({ open: true, department: null })}
            >
              + Add Department
            </button>
          </div>
          {loading.departments ? (
            <SkeletonRows />
          ) : departments.length === 0 ? (
            <EmptyState message="No departments found. Create one to get started." />
          ) : (
            <div className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <div key={dept._id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{dept.name}</span>
                      <span className="badge badge-slate">{dept.code}</span>
                    </div>
                    {dept.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      id={`edit-dept-${dept._id}`}
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => setDeptModal({ open: true, department: dept })}
                    >
                      Edit
                    </button>
                    <button
                      id={`delete-dept-${dept._id}`}
                      className="btn-danger py-1.5 px-3 text-xs"
                      onClick={() => deleteDepartment(dept)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Buildings ─── */}
      {activeTab === 'buildings' && (
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Buildings</h2>
            <button
              id="create-building-btn"
              className={t.btnPrimary}
              onClick={() => setBuildingModal({ open: true, building: null })}
            >
              + Add Building
            </button>
          </div>
          {loading.buildings ? (
            <SkeletonRows />
          ) : buildings.length === 0 ? (
            <EmptyState message="No buildings found. Add one to get started." />
          ) : (
            <div className="divide-y divide-slate-100">
              {buildings.map((b) => (
                <div key={b._id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{b.name}</span>
                      <span className="badge badge-slate">{b.code}</span>
                    </div>
                    {b.totalFloors && (
                      <p className="text-xs text-slate-500 mt-0.5">{b.totalFloors} floors</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      id={`edit-building-${b._id}`}
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => setBuildingModal({ open: true, building: b })}
                    >
                      Edit
                    </button>
                    <button
                      id={`delete-building-${b._id}`}
                      className="btn-danger py-1.5 px-3 text-xs"
                      onClick={() => deleteBuilding(b)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Rooms ─── */}
      {activeTab === 'rooms' && (
        <div className="card">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Rooms</h2>
            <button
              id="create-room-btn"
              className={t.btnPrimary}
              onClick={() => setRoomModal({ open: true, room: null })}
            >
              + Add Room
            </button>
          </div>
          {loading.rooms ? (
            <SkeletonRows />
          ) : rooms.length === 0 ? (
            <EmptyState message="No rooms found. Add one to get started." />
          ) : (
            <div className="divide-y divide-slate-100">
              {rooms.map((r) => (
                <div key={r._id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{r.name}</span>
                      {r.number && <span className="badge badge-slate">#{r.number}</span>}
                      {r.building?.name && (
                        <span className="badge badge-indigo">{r.building.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.floor !== undefined ? `Floor ${r.floor}` : ''}{' '}
                      {r.capacity ? `· Capacity: ${r.capacity}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      id={`edit-room-${r._id}`}
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => setRoomModal({ open: true, room: r })}
                    >
                      Edit
                    </button>
                    <button
                      id={`delete-room-${r._id}`}
                      className="btn-danger py-1.5 px-3 text-xs"
                      onClick={() => deleteRoom(r)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Timetables ─── */}
      {activeTab === 'timetables' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="tt-search"
              type="text"
              className="input flex-1"
              placeholder="Search by title…"
              value={ttSearch}
              onChange={(e) => setTtSearch(e.target.value)}
            />
            <button
              id="create-tt-btn"
              className={t.btnPrimary}
              onClick={() => setTtModal(true)}
            >
              + Create Timetable
            </button>
          </div>

          <div className="card">
            {loading.timetables ? (
              <SkeletonRows />
            ) : filteredTimetables.length === 0 ? (
              <EmptyState message="No timetables found." />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTimetables.map((tt) => (
                  <div key={tt._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{tt.title}</span>
                        {tt.isActive && <span className="badge badge-emerald">Active</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {tt.room?.name && (
                          <span className="badge badge-slate">{tt.room.name}</span>
                        )}
                        {tt.academicYear && (
                          <span className="text-xs text-slate-400">{tt.academicYear}</span>
                        )}
                        {tt.semester && (
                          <span className="text-xs text-slate-400">{tt.semester}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        id={`view-tt-${tt._id}`}
                        className="btn-secondary py-1.5 px-3 text-xs"
                        onClick={() => navigate(`/admin/timetable/${tt._id}`)}
                      >
                        View
                      </button>
                      <button
                        id={`delete-tt-${tt._id}`}
                        className="btn-danger py-1.5 px-3 text-xs"
                        onClick={() => deleteTimetable(tt)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      <ApprovalModal
        isOpen={approvalModal.open}
        admin={approvalModal.admin}
        action={approvalModal.action}
        loading={approvalLoading}
        onConfirm={handleApprovalConfirm}
        onCancel={() => setApprovalModal({ open: false, admin: null, action: null })}
      />

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
      />

      <CreateDepartmentModal
        isOpen={deptModal.open}
        department={deptModal.department}
        onClose={() => setDeptModal({ open: false, department: null })}
        onSaved={() => { loaders.departments(); loadStats(); }}
      />

      <CreateBuildingModal
        isOpen={buildingModal.open}
        building={buildingModal.building}
        onClose={() => setBuildingModal({ open: false, building: null })}
        onSaved={() => loaders.buildings()}
      />

      <CreateRoomModal
        isOpen={roomModal.open}
        room={roomModal.room}
        buildings={buildings}
        onClose={() => setRoomModal({ open: false, room: null })}
        onSaved={() => loaders.rooms()}
      />

      <CreateTimetableModal
        isOpen={ttModal}
        departments={departments}
        buildings={buildings}
        rooms={rooms}
        onClose={() => setTtModal(false)}
        onSaved={() => { loaders.timetables(); loadStats(); }}
      />
    </Layout>
  );
}
