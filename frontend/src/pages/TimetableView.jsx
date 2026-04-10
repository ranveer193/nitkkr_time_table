import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import CellHistoryModal from '../components/CellHistoryModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { timetableAPI, departmentAPI } from '../services/api';
import { exportTimetablePDF } from '../utils/pdfExport';
import { DAYS, PERIODS, DEPARTMENT_COLORS } from '../utils/constants';

export default function TimetableView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEditCells, isSuperAdmin } = useAuth();
  const { t } = useTheme();

  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Editing state
  const [editingCell, setEditingCell] = useState(null); // cell doc
  const [editSubject, setEditSubject] = useState('');
  const [editDept, setEditDept] = useState('');
  const [saving, setSaving] = useState(false);

  const [departments, setDepartments] = useState([]);

  // History modal
  const [historyModal, setHistoryModal] = useState({ open: false, cell: null, history: [] });

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timetableAPI.getOne(id);
      setTimetable(res.data?.data || res.data);
    } catch (err) {
      toast.error('Failed to load timetable');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTimetable();
    if (isSuperAdmin) {
      departmentAPI.getAll().then(res => setDepartments(res.data?.data || res.data || []));
    }
  }, [loadTimetable, isSuperAdmin]);

  // ─── Get cell for a given day + period index ───────────────────────────────
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

  // ─── Can user edit this cell ───────────────────────────────────────────────
  function cellIsEditable(cell) {
    if (!cell) return false;
    if (isSuperAdmin) return true;
    const deptId = cell.department?._id || cell.department;
    if (!deptId) return false;
    return canEditCells(deptId);
  }

  // ─── Start editing ─────────────────────────────────────────────────────────
  function startEdit(cell) {
    if (!cell) return;
    setEditingCell(cell);
    setEditSubject(cell.subject || '');
    setEditDept(cell.department?._id || cell.department || '');
  }

  // ─── Cancel editing ────────────────────────────────────────────────────────
  function cancelEdit() {
    setEditingCell(null);
    setEditSubject('');
    setEditDept('');
  }

  // ─── Save cell ─────────────────────────────────────────────────────────────
  async function saveCell() {
    if (!editingCell) return;
    setSaving(true);
    try {
      const payload = isSuperAdmin ? { departmentId: editDept || null } : { subject: editSubject };
      await timetableAPI.updateCell(id, editingCell._id, payload);
      toast.success('Cell updated');
      setEditingCell(null);
      setEditSubject('');
      setEditDept('');
      await loadTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save cell');
    } finally {
      setSaving(false);
    }
  }

  // ─── Open history ──────────────────────────────────────────────────────────
  function openHistory(cell) {
    setHistoryModal({
      open: true,
      cell,
      history: cell?.history || [],
    });
  }

  // ─── PDF Export ────────────────────────────────────────────────────────────
  async function handleExportPDF() {
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
      <Layout>
        <div className="flex items-center justify-center py-24">
          <span className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!timetable) return null;

  return (
    <Layout>
      {/* Sticky header */}
      <div className="sticky top-14 z-20 bg-slate-50 pb-3 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-slate-200 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <button
              className="btn-ghost text-xs text-slate-400 mb-1 px-0"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-slate-800">{timetable.title}</h1>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2 mt-1.5">
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

          <div className="flex gap-2 flex-shrink-0">
            {isSuperAdmin && (
              <span className="badge badge-slate self-center">View Only</span>
            )}
            <button
              id="export-pdf-btn"
              className="btn-secondary text-sm"
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
      </div>

      {/* ─── Timetable Grid ─── */}
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
                  {/* Period label */}
                  <td className="timetable-cell bg-slate-50 font-medium text-slate-700 text-xs">
                    <div>{periodLabel}</div>
                    {periodTime && (
                      <div className="text-slate-400 font-normal mt-0.5">{periodTime}</div>
                    )}
                  </td>

                  {/* Day cells */}
                  {days.map((day) => {
                    const cell = getCell(day, pIdx);
                    const isEditing =
                      editingCell &&
                      editingCell._id === cell?._id;
                    const editable = cellIsEditable(cell);

                    return (
                      <td
                        key={`${day}-${pIdx}`}
                        className={
                          isEditing
                            ? 'timetable-cell bg-indigo-50 border-indigo-200'
                            : cell?.department
                              ? editable
                                ? 'timetable-cell-editable rounded outline outline-1 outline-slate-200'
                                : 'timetable-cell-locked'
                              : isSuperAdmin
                                ? 'timetable-cell-editable opacity-50 hover:bg-slate-50'
                                : 'timetable-cell-empty'
                        }
                        onClick={() => {
                          if (editable && !isEditing && !editingCell) startEdit(cell);
                        }}
                      >
                        {isEditing ? (
                          <div className="space-y-2 p-1" onClick={(e) => e.stopPropagation()}>
                            {isSuperAdmin ? (
                              <select
                                className="input py-1 px-2 text-xs w-full mb-1"
                                value={editDept}
                                onChange={(e) => setEditDept(e.target.value)}
                              >
                                <option value="">[Unassigned]</option>
                                {departments.map(d => (
                                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                id={`cell-edit-${cell._id}`}
                                autoFocus
                                type="text"
                                className="input py-1 text-xs"
                                placeholder="Enter subject…"
                                value={editSubject}
                                onChange={(e) => setEditSubject(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveCell();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                              />
                            )}
                            <div className="flex gap-1">
                              <button
                                className={`${t.btnPrimary} py-0.5 px-2 text-xs`}
                                onClick={saveCell}
                                disabled={saving}
                              >
                                {saving ? '…' : 'Save'}
                              </button>
                              <button
                                className="btn-secondary py-0.5 px-2 text-xs"
                                onClick={cancelEdit}
                                disabled={saving}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : cell?.department ? (
                          // ── Has Assigned Department ──
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
                            <div className="flex items-center gap-1 mt-1">
                              {(cell.history?.length > 0) && (
                                <button
                                  id={`history-${cell._id}`}
                                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openHistory(cell);
                                  }}
                                >
                                  History ({cell.history.length})
                                </button>
                              )}
                              {editable && (
                                <span className="text-xs text-indigo-400 ml-auto">✎ edit</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          // ── Empty ──
                          <div className="text-xs text-slate-300 text-center mt-2">
                            {editable ? (
                              <span className="text-indigo-400">+ Assign Dept</span>
                            ) : (
                              <span className="text-slate-200">Empty</span>
                            )}
                          </div>
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

      {/* Edit instructions */}
      <div className="mt-3 text-xs text-slate-400">
        {isSuperAdmin ? (
          <p>💡 Click any cell to assign or clear a department. You cannot edit the subject itself.</p>
        ) : (
          <p>💡 Click any highlighted cell to edit the subject. You can only edit cells assigned to your department.</p>
        )}
      </div>

      {/* History Modal */}
      <CellHistoryModal
        isOpen={historyModal.open}
        cell={historyModal.cell}
        history={historyModal.history}
        loading={false}
        onClose={() => setHistoryModal({ open: false, cell: null, history: [] })}
      />
    </Layout>
  );
}
