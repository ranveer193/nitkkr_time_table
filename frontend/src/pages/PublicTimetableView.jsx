import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PublicLayout from '../components/PublicLayout';
import { useTheme } from '../context/ThemeContext';
import { publicAPI } from '../services/api';
import { exportTimetablePDF } from '../utils/pdfExport';
import { DAYS, PERIODS } from '../utils/constants';

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

  const days = timetable?.days || DAYS;
  const periods = timetable?.periods || PERIODS;

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-24">
          <span className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
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
          ← All Timetables
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{timetable.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {timetable.room?.building?.name && (
                <span className="badge badge-slate">{timetable.room.building.name}</span>
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
      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 mb-5 text-xs text-slate-600">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>This is a <strong>view-only</strong> timetable. Log in as an admin to make edits.</span>
      </div>

      {/* Timetable grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="w-full border-collapse text-sm" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th className="timetable-cell bg-slate-50 font-semibold text-slate-700 text-left w-28">
                Period
              </th>
              {days.map((day) => (
                <th key={day} className="timetable-cell bg-slate-50 font-semibold text-slate-700 text-center">
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
                <tr key={pIdx} className="hover:bg-slate-50 transition-colors">
                  <td className="timetable-cell bg-slate-50 font-medium text-slate-700 text-xs">
                    <div>{periodLabel}</div>
                    {periodTime && (
                      <div className="text-slate-400 font-normal mt-0.5">{periodTime}</div>
                    )}
                  </td>

                  {days.map((day) => {
                    const cell = getCell(day, pIdx);
                    return (
                      <td
                        key={`${day}-${pIdx}`}
                        className={
                          cell?.department ? 'timetable-cell-locked' : 'timetable-cell-empty'
                        }
                      >
                        {cell?.department ? (
                          <div className="space-y-1">
                            {cell.subject ? (
                              <div className="font-medium text-slate-800 text-xs leading-snug">
                                {cell.subject}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic">[No subject]</div>
                            )}
                            <span className={`badge ${t.badgeAccent} text-xs`}>
                              {cell.department.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
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

      <p className="text-xs text-slate-400 mt-3">
        This timetable is publicly accessible. For any corrections, please contact your department admin.
      </p>
    </PublicLayout>
  );
}
