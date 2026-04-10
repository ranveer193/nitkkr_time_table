import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PublicLayout from '../components/PublicLayout';
import { useTheme } from '../context/ThemeContext';
import { publicAPI, departmentAPI, buildingAPI, roomAPI } from '../services/api';
import { exportTimetablePDF } from '../utils/pdfExport';
import { timetableAPI } from '../services/api';
import { formatDate } from '../utils/formatters';

export default function PublicHome() {
  const { t } = useTheme();
  const navigate = useNavigate();

  const [timetables, setTimetables] = useState([]);
  const [departments, setDepartments] = useState([]);
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
      const [ttRes, dRes, bRes, rRes] = await Promise.all([
        publicAPI.getAllTimetables(),
        departmentAPI.getAll(),
        buildingAPI.getAll(),
        roomAPI.getAll(),
      ]);
      setTimetables(ttRes.data?.data || ttRes.data || []);
      setDepartments(dRes.data?.data || dRes.data || []);
      setBuildings(bRes.data?.data || bRes.data || []);
      setRooms(rRes.data?.data || rRes.data || []);
    } catch {
      toast.error('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleBuildingChange(val) {
    setBuildingFilter(val);
    setRoomFilter('');
  }

  const filteredRooms = buildingFilter
    ? rooms.filter((r) => (r.building?._id || r.building) === buildingFilter)
    : rooms;

  const filteredTimetables = timetables.filter((tt) => {
    const matchSearch = search
      ? (tt.title || '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchBuilding = buildingFilter
      ? (tt.room?.building?._id || tt.room?.building) === buildingFilter
      : true;
    const matchRoom = roomFilter
      ? (tt.room?._id || tt.room) === roomFilter
      : true;
    return matchSearch && matchBuilding && matchRoom;
  });

  async function handleDownloadPDF(tt) {
    setPdfLoading(tt._id);
    try {
      const res = await publicAPI.getPublicTimetable(tt._id);
      const full = res.data?.data || res.data;
      exportTimetablePDF(full);
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(null);
    }
  }

  return (
    <PublicLayout>
      {/* Hero section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">College Timetables</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search and download timetables for any department, building or room.
        </p>
      </div>

      {/* Search + filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              id="public-search"
              type="text"
              className="input pl-9"
              placeholder="Search timetable title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label htmlFor="public-building-filter" className="label text-xs">Building</label>
            <select
              id="public-building-filter"
              className="input"
              value={buildingFilter}
              onChange={(e) => handleBuildingChange(e.target.value)}
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="public-room-filter" className="label text-xs">Room</label>
            <select
              id="public-room-filter"
              className="input"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="">All Rooms</option>
              {filteredRooms.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {(search || buildingFilter || roomFilter) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing <strong>{filteredTimetables.length}</strong> of {timetables.length} timetables
            </p>
            <button
              id="clear-filters"
              className="btn-ghost text-xs text-slate-400"
              onClick={() => {
                setSearch('');
                setBuildingFilter('');
                setRoomFilter('');
              }}
            >
              Clear filters ✕
            </button>
          </div>
        )}
      </div>

      {/* Timetable cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTimetables.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-12 h-12 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-slate-500 text-sm">
            {search || buildingFilter || roomFilter
              ? 'No timetables match your filters. Try adjusting your search.'
              : 'No timetables are currently available.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTimetables.map((tt) => (
            <div key={tt._id} className="card p-4 hover:shadow-md transition-shadow flex flex-col">
              {/* Title + active badge */}
              <div className="flex justify-between items-start gap-2 mb-3">
                <h2 className="text-sm font-semibold text-slate-800 leading-snug">
                  {tt.title}
                </h2>
                {tt.isActive && <span className="badge badge-emerald flex-shrink-0">Active</span>}
              </div>

              {/* Meta info */}
              <div className="space-y-1.5 mb-4 text-xs text-slate-500 flex-1">
                {tt.room?.name && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300">📍</span>
                    <span className="badge badge-slate">{tt.room.name}</span>
                    {tt.room.building?.name && (
                      <span className="badge badge-slate">{tt.room.building.name}</span>
                    )}
                  </div>
                )}
                {tt.academicYear && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300">📆</span>
                    {tt.academicYear}{tt.semester ? ` · ${tt.semester}` : ''}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button
                  id={`open-public-tt-${tt._id}`}
                  className={`${t.btnPrimary} flex-1 justify-center py-1.5 text-xs`}
                  onClick={() => navigate(`/public/timetable/${tt._id}`)}
                >
                  View Timetable
                </button>
                <button
                  id={`pdf-public-tt-${tt._id}`}
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
    </PublicLayout>
  );
}
