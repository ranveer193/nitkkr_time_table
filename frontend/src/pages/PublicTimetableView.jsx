import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PublicLayout from '../components/PublicLayout';
import { useTheme } from '../context/ThemeContext';
import { publicAPI } from '../services/api';
import { exportTimetablePDF } from '../utils/pdfExport';
import { DAYS, PERIODS, DEPARTMENT_COLORS } from '../utils/constants';

export default function PublicTimetableView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTheme();

  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await publicAPI.getPublicTimetable(id);
      setTimetable(res.data?.data || res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        toast.error('Timetable not found');
      } else {
        toast.error('Failed to load timetable');
      }
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  // ─── Color map for departments ───────────────────────────────────────────
  const deptColorMap = useMemo(() => {
    const map = {};
    if (!timetable?.cells) return map;
    const uniqueDepts = [];
    timetable.cells.forEach((c) => {
      const deptId = c.department?._id || c.department;
      if (deptId && !uniqueDepts.includes(deptId)) {
        uniqueDepts.push(deptId);
      }
    });
    uniqueDepts.forEach((deptId, idx) => {
      const color = DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length];
      map[deptId] = color;
    });
    return map;
  }, [timetable]);

  function getCell(day, periodIndex) {
    if (!timetable?.cells) return null;
    return (
      timetable.cells.find(
        (c) =>
          c.day === day &&
          (c.periodIndex === periodIndex || c.period === periodIndex + 1)
      ) || null
    );
  }

  function getDeptStyles(cell) {
    const deptId = cell?.department?._id || cell?.department;
    if (!deptId) return {};
    const color = deptColorMap[deptId];
    if (!color) return {};
    return {
      '--dept-color': color.border,
      '--dept-bg': color.bg,
      '--dept-bg-hover': color.bg,
      '--dept-text': color.text,
    };
  }

  function handleExportPDF() {
    setPdfLoading(true);
    try {
      exportTimetablePDF(timetable);
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  }

  const days = (timetable?.days && timetable.days.length > 0) ? timetable.days : DAYS;
  const periodsCount = timetable?.periodsPerDay || PERIODS.length;
  const periods = Array.from({ length: periodsCount }, (_, i) => {
    if (PERIODS[i]) return PERIODS[i];
    return { label: `Period ${i + 1}`, start: null, end: null };
  });

  if (loading) {
    return (
      <PublicLayout>
        <div className="animate-fade-in">
          <div className="mb-6 space-y-3">
            <div className="skeleton h-5 w-24 rounded-lg" />
            <div className="skeleton h-7 w-72 rounded-lg" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="timetable-wrapper p-1">
            <div className="grid gap-px" style={{ gridTemplateColumns: `110px repeat(5, 1fr)` }}>
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="skeleton-table-cell" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!timetable) return null;

  return (
    <PublicLayout>
      {/* Header */}
      <div className="mb-5">
        <button
          className="btn-ghost text-xs text-slate-400 px-0 mb-1"
          onClick={() => navigate('/')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          All Timetables
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{timetable.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {timetable.room?.building?.name && (
                <span className="badge badge-slate">
                  <svg className="w-3 h-3 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                  </svg>
                  {timetable.room.building.name}
                </span>
              )}
              {timetable.room?.name && (
                <span className="badge badge-slate">{timetable.room.name}</span>
              )}
              {timetable.academicYear && (
                <span className="badge badge-slate">{timetable.academicYear}</span>
              )}
              {timetable.semester && (
                <span className="badge badge-slate">{timetable.semester}</span>
              )}
              {timetable.isActive && (
                <span className="badge badge-emerald">Active</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {days.length} day{days.length !== 1 ? 's' : ''} × {periodsCount} period{periodsCount !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            id="public-export-pdf"
            className="btn-secondary flex-shrink-0"
            onClick={handleExportPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Generating…
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* View-only banner */}
      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 mb-5 text-xs text-slate-600">
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>This is a <strong>view-only</strong> timetable. Log in as an admin to make edits.</span>
      </div>

      {/* Timetable grid */}
      <div className="timetable-wrapper">
        <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th className="timetable-header-cell text-left w-28">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Period
                </div>
              </th>
              {days.map((day) => (
                <th key={day} className="timetable-header-cell text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, pIdx) => {
              const periodLabel =
                typeof period === 'string'
                  ? period
                  : period.label || `Period ${pIdx + 1}`;
              const periodTime =
                typeof period === 'object' && period.start
                  ? `${period.start}–${period.end}`
                  : null;

              return (
                <tr key={pIdx}>
                  <td className="timetable-period-cell">
                    <div className="font-semibold">{periodLabel}</div>
                    {periodTime && (
                      <div className="text-slate-400 font-normal mt-0.5 text-[11px]">{periodTime}</div>
                    )}
                  </td>

                  {days.map((day) => {
                    const cell = getCell(day, pIdx);
                    const hasDept = Boolean(cell?.department);
                    const deptStyles = getDeptStyles(cell);

                    return (
                      <td
                        key={`${day}-${pIdx}`}
                        className={hasDept ? 'timetable-cell dept-cell' : 'timetable-cell-empty'}
                        style={hasDept ? deptStyles : undefined}
                      >
                        {hasDept ? (
                          <div className="space-y-1 animate-cell-in">
                            {cell.subject ? (
                              <div className="dept-cell-subject">
                                {cell.subject}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic">[No subject]</div>
                            )}
                            <div className="dept-cell-badge">
                              {cell.department?.code || cell.department?.name || 'Dept'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-200 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {Object.keys(deptColorMap).length > 0 && (
        <div className="mt-4 card p-4">
          <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Department Legend</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(deptColorMap).map(([deptId, color]) => {
              const dept = timetable.cells.find(c => (c.department?._id || c.department) === deptId)?.department;
              const name = dept?.name || dept?.code || deptId;
              return (
                <span
                  key={deptId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: color.border }} />
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        This timetable is publicly accessible. For any corrections, please contact your department admin.
      </p>
    </PublicLayout>
  );
}
