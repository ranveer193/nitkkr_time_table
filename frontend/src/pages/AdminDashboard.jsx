import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { timetableAPI, buildingAPI, roomAPI } from '../services/api';
import { exportTimetablePDF } from '../utils/pdfExport';
import { formatDate } from '../utils/formatters';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();

  const [timetables, setTimetables] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ttRes, bldRes, roomRes] = await Promise.all([
        timetableAPI.getAll(),
        buildingAPI.getAll(),
        roomAPI.getAll(),
      ]);
      setTimetables(ttRes.data?.data || ttRes.data || []);
      setBuildings(bldRes.data?.data || bldRes.data || []);
      setRooms(roomRes.data?.data || roomRes.data || []);
    } catch {
      toast.error('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDownloadPDF(tt) {
    setPdfLoading(tt._id);
    try {
      const res = await timetableAPI.getOne(tt._id);
      const full = res.data?.data || res.data;
      exportTimetablePDF(full);
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(null);
    }
  }

  // Filter rooms by selected building
  const filteredRooms = buildingFilter
    ? rooms.filter((r) => (r.building?._id || r.building) === buildingFilter)
    : rooms;

  // Reset room filter when building changes
  function handleBuildingChange(val) {
    setBuildingFilter(val);
    setRoomFilter('');
  }

  const filteredTimetables = timetables.filter((tt) => {
    const matchSearch = search
      ? (tt.title || '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchBuilding = buildingFilter
      ? (tt.room?.building?._id || tt.room?.building) === buildingFilter
      : true;
    const matchRoom = roomFilter ? (tt.room?._id || tt.room) === roomFilter : true;
    return matchSearch && matchBuilding && matchRoom;
  });

  return (
    <Layout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          {user?.department?.name || 'Department'} Timetables
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View and manage timetables for your department
        </p>
      </div>

      {/* Stat mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-2xl font-bold text-slate-800">{timetables.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Timetables</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-slate-800">
            {timetables.filter((t) => t.isActive).length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Active</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-slate-800">{filteredTimetables.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Filtered Results</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          id="admin-tt-search"
          type="text"
          className="input flex-1"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          id="admin-tt-building"
          className="input sm:w-44"
          value={buildingFilter}
          onChange={(e) => handleBuildingChange(e.target.value)}
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        <select
          id="admin-tt-room"
          className="input sm:w-44"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        >
          <option value="">All Rooms</option>
          {filteredRooms.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Timetable list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTimetables.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-10 h-10 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-sm text-slate-400">
            {search || buildingFilter || roomFilter
              ? 'No timetables match your filters.'
              : 'No timetables found for your department.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTimetables.map((tt) => (
            <div key={tt._id} className="card p-4 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{tt.title}</h3>
                  {tt.isActive && (
                    <span className="badge badge-emerald mt-1">Active</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mb-4 text-xs text-slate-500 flex-1">
                {tt.room?.name && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 text-slate-400">📍</span>
                    {tt.room.name}
                    {tt.room.building?.name ? ` — ${tt.room.building.name}` : ''}
                  </div>
                )}
                {tt.academicYear && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 text-slate-400">📆</span>
                    {tt.academicYear}{tt.semester ? ` · ${tt.semester}` : ''}
                  </div>
                )}
                {tt.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 text-slate-400">🗓</span>
                    Created {formatDate(tt.createdAt)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  id={`open-tt-${tt._id}`}
                  className={`${t.btnPrimary} flex-1 justify-center py-1.5 text-xs`}
                  onClick={() => navigate(`/admin/timetable/${tt._id}`)}
                >
                  Open
                </button>
                <button
                  id={`pdf-tt-${tt._id}`}
                  className="btn-secondary flex-1 justify-center py-1.5 text-xs"
                  onClick={() => handleDownloadPDF(tt)}
                  disabled={pdfLoading === tt._id}
                >
                  {pdfLoading === tt._id ? (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      PDF…
                    </span>
                  ) : (
                    'Download PDF'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
