import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { buildingAPI } from '../services/api';

export default function CreateBuildingModal({ isOpen, building, onClose, onSaved }) {
  const isEditing = Boolean(building);
  const [form, setForm] = useState({ name: '', code: '', totalFloors: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEditing && building) {
        setForm({
          name: building.name || '',
          code: building.code || '',
          totalFloors: building.totalFloors || '',
          description: building.description || '',
        });
      } else {
        setForm({ name: '', code: '', totalFloors: '', description: '' });
      }
      setErrors({});
    }
  }, [isOpen, building, isEditing]);

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
    if (!form.name.trim()) errs.name = 'Building name is required';
    if (!form.code.trim()) errs.code = 'Building code is required';
    if (form.totalFloors && isNaN(Number(form.totalFloors))) errs.totalFloors = 'Must be a number';
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
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        ...(form.totalFloors ? { totalFloors: Number(form.totalFloors) } : {}),
      };
      if (isEditing) {
        await buildingAPI.update(building._id, payload);
        toast.success('Building updated');
      } else {
        await buildingAPI.create(payload);
        toast.success('Building created');
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
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="building-modal-title">
      <div className="modal-card">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="building-modal-title" className="text-base font-semibold text-slate-800">
            {isEditing ? 'Edit Building' : 'Add Building'}
          </h2>
          <button className="btn-ghost p-1 text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="building-name" className="label">Building Name *</label>
              <input
                id="building-name"
                type="text"
                className="input"
                placeholder="e.g. Main Academic Block"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="building-code" className="label">Code *</label>
                <input
                  id="building-code"
                  type="text"
                  className="input"
                  placeholder="e.g. MAB"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
              </div>

              <div>
                <label htmlFor="building-floors" className="label">Floors</label>
                <input
                  id="building-floors"
                  type="number"
                  min={1}
                  className="input"
                  placeholder="e.g. 4"
                  value={form.totalFloors}
                  onChange={(e) => setForm((f) => ({ ...f, totalFloors: e.target.value }))}
                />
                {errors.totalFloors && <p className="text-xs text-red-500 mt-1">{errors.totalFloors}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="building-desc" className="label">Description</label>
              <textarea
                id="building-desc"
                className="input resize-none"
                rows={2}
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
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
                'Add Building'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
