import { useEffect, useState } from 'react';

/**
 * ApprovalModal — shown when super admin approves or rejects a pending admin.
 * Shows admin details, optional note, and a confirm action.
 */
export default function ApprovalModal({
  isOpen,
  admin,            // { _id, name, email, userId, department? }
  action,           // 'approve' | 'reject'
  loading = false,
  onConfirm,        // (note) => void
  onCancel,
}) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) setNote('');
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen || !admin) return null;

  const isApprove = action === 'approve';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="approval-modal-title">
      <div className="modal-card max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                isApprove ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {isApprove ? '✓' : '✕'}
            </div>
            <h2 id="approval-modal-title" className="text-base font-semibold text-slate-800">
              {isApprove ? 'Approve Admin' : 'Reject Admin'}
            </h2>
          </div>
          <button
            className="btn-ghost p-1 text-slate-400 hover:text-slate-600"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Admin details */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-800">{admin.name}</span>
              <span className="badge badge-slate">{admin.userId}</span>
            </div>
            <p className="text-sm text-slate-500">{admin.email}</p>
            {admin.department?.name && (
              <p className="text-xs text-slate-400">
                Department: <span className="font-medium text-slate-600">{admin.department.name}</span>
              </p>
            )}
          </div>

          {/* Confirmation text */}
          <p className="text-sm text-slate-600">
            {isApprove
              ? 'This admin will be granted access to manage their department timetables.'
              : 'This registration request will be rejected. The admin will not be able to log in.'}
          </p>

          {/* Optional note */}
          <div>
            <label htmlFor="approval-note" className="label">
              Note <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="approval-note"
              className="input resize-none"
              rows={2}
              placeholder="Add a reason or note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            id={`approval-modal-${action}`}
            className={isApprove ? 'btn-primary' : 'btn-danger'}
            onClick={() => onConfirm(note)}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isApprove ? 'Approving…' : 'Rejecting…'}
              </span>
            ) : isApprove ? (
              'Approve'
            ) : (
              'Reject'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
