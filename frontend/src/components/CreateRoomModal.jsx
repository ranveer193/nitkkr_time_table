import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { roomAPI } from '../services/api';

export default function CreateRoomModal({ isOpen, room, buildings, onClose, onSaved }) {
  const isEditing = Boolean(room);
  const [form, setForm] = useState({ name: '', number: '', floor: '', building: '', capacity: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEditing && room) {
        setForm({
          name: room.name || '',
          number: room.number || '',
          floor: room.floor ?? '',
          building: room.building?._id || room.building || '',
          capacity: room.capacity || '',
        });
      } else {
        setForm({ name: '', number: '', floor: '', building: '', capacity: '' });
      }
      setErrors({});
    }
  }, [isOpen, room, isEditing]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Room name is required';
    if (!form.building) errs.building = 'Please select a building';
    if (form.capacity && isNaN(Number(form.capacity))) errs.capacity = 'Must be a number';
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
      const payload = {
        name: form.name.trim(),
        number: form.number.trim(),
        buildingId: form.building,
        ...(form.floor !== '' ? { floor: Number(form.floor) } : {}),
        ...(form.capacity ? { capacity: Number(form.capacity) } : {}),
      };
      if (isEditing) {
        await roomAPI.update(room._id, payload);
        toast.success('Room updated');
      } else {
        await roomAPI.create(payload);
        toast.success('Room created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
      <div className="modal-card">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="room-modal-title" className="text-base font-semibold text-slate-800">
            {isEditing ? 'Edit Room' : 'Add Room'}
          </h2>
          <button className="btn-ghost p-1 text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="room-name" className="label">Room Name *</label>
              <input
                id="room-name"
                type="text"
                className="input"
                placeholder="e.g. Seminar Hall A"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="room-number" className="label">Room Number</label>
                <input
                  id="room-number"
                  type="text"
                  className="input"
                  placeholder="e.g. 101"
                  value={form.number}
                  onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="room-floor" className="label">Floor</label>
                <input
                  id="room-floor"
                  type="number"
                  min={0}
                  className="input"
                  placeholder="e.g. 1"
                  value={form.floor}
                  onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="room-building" className="label">Building *</label>
              <select
                id="room-building"
                className="input"
                value={form.building}
                onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
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

            <div>
              <label htmlFor="room-capacity" className="label">Capacity</label>
              <input
                id="room-capacity"
                type="number"
                min={1}
                className="input"
                placeholder="e.g. 60"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
              {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
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
                  {isEditing ? 'Saving…' : 'Creating…'}
                </span>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
