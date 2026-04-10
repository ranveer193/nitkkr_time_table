import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { timetableAPI } from '../services/api';

export default function CreateTimetableModal({ isOpen, departments, rooms, buildings, onClose, onSaved }) {
  const [form, setForm] = useState({
    building: '',
    room: '',
    academicYear: '',
    semester: '',
    isActive: true,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periodsPerDay: 8,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        building: '',
        room: '',
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        semester: '',
        isActive: true,
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 8,
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter rooms by selected building
  const filteredRooms = form.building
    ? (rooms || []).filter((r) => (r.building?._id || r.building) === form.building)
    : [];

  function validate() {
    const errs = {};
    if (!form.building) errs.building = 'Building is required';
    if (!form.room) errs.room = 'Room is required';
    if (form.days.length === 0) errs.days = 'Select at least one day';
    if (form.periodsPerDay < 1 || form.periodsPerDay > 16) errs.periodsPerDay = 'Periods must be between 1 and 16';
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
      await timetableAPI.create({
        roomId: form.room,
        buildingId: form.building,
        academicYear: form.academicYear.trim(),
        semester: form.semester.trim(),
        isActive: form.isActive,
        days: form.days,
        periodsPerDay: form.periodsPerDay,
      });
      toast.success('Timetable created successfully');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create timetable');
    } finally {
      setLoading(false);
    }
  }

  const SEMESTERS = ['Odd Semester', 'Even Semester', 'Summer Term', 'Special Term'];
  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function toggleDay(day) {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day]
    }));
  }

  function handleBuildingChange(val) {
    setForm(f => ({ ...f, building: val, room: '' }));
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tt-modal-title">
      <div className="modal-card max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="tt-modal-title" className="text-base font-semibold text-slate-800">
            Create Timetable
          </h2>
          <button className="btn-ghost p-1 text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">
            {/* Building selector */}
            <div>
              <label htmlFor="tt-building" className="label">Building *</label>
              <select
                id="tt-building"
                className="input"
                value={form.building}
                onChange={(e) => handleBuildingChange(e.target.value)}
              >
                <option value="">Select building…</option>
                {(buildings || []).map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              {errors.building && <p className="text-xs text-red-500 mt-1">{errors.building}</p>}
            </div>

            {/* Room selector — filtered by building */}
            <div>
              <label htmlFor="tt-room" className="label">Room *</label>
              <select
                id="tt-room"
                className="input"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                disabled={!form.building}
              >
                <option value="">{form.building ? 'Select room…' : 'Select a building first…'}</option>
                {filteredRooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}{r.floor !== undefined ? ` · Floor ${r.floor}` : ''}{r.capacity ? ` · Cap: ${r.capacity}` : ''}
                  </option>
                ))}
              </select>
              {form.building && filteredRooms.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No rooms found for this building. Add a room first.</p>
              )}
              {errors.room && <p className="text-xs text-red-500 mt-1">{errors.room}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tt-year" className="label">Academic Year</label>
                <input
                  id="tt-year"
                  type="text"
                  className="input"
                  placeholder="e.g. 2024-2025"
                  value={form.academicYear}
                  onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="tt-semester" className="label">Semester</label>
                <select
                  id="tt-semester"
                  className="input"
                  value={form.semester}
                  onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Days Active *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${form.days.includes(day)
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
              {errors.days && <p className="text-xs text-red-500 mt-1">{errors.days}</p>}
            </div>

            <div>
              <label htmlFor="tt-periods" className="label">Periods Per Day * <span className="text-slate-400 font-normal">(max 16)</span></label>
              <input
                id="tt-periods"
                type="number"
                min={1}
                max={16}
                className="input"
                value={form.periodsPerDay}
                onChange={(e) => setForm((f) => ({ ...f, periodsPerDay: Number(e.target.value) }))}
              />
              {errors.periodsPerDay && <p className="text-xs text-red-500 mt-1">{errors.periodsPerDay}</p>}
            </div>

            {/* Preview */}
            {form.days.length > 0 && form.periodsPerDay > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Grid preview:</span>{' '}
                  {form.days.length} day{form.days.length !== 1 ? 's' : ''} × {form.periodsPerDay} period{form.periodsPerDay !== 1 ? 's' : ''} = {form.days.length * form.periodsPerDay} cells
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                id="tt-active"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <label htmlFor="tt-active" className="text-sm text-slate-700 cursor-pointer">
                Mark as active timetable
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                'Create Timetable'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
