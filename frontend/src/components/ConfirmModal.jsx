import { useEffect, useRef } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'neutral'
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmClass = {
    danger: 'btn-danger',
    warning:
      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 border border-amber-600 transition-colors',
    neutral: 'btn-primary',
  }[variant];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="modal-card max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
              variant === 'danger'
                ? 'bg-red-100 text-red-600'
                : variant === 'warning'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            {variant === 'danger' ? '⚠' : variant === 'warning' ? '⚡' : 'ℹ'}
          </div>
          <h2 id="confirm-modal-title" className="text-base font-semibold text-slate-800">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
          <button
            id="confirm-modal-cancel"
            ref={cancelRef}
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-modal-confirm"
            className={confirmClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
