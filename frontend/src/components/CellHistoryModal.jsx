import { useEffect } from 'react';
import { formatDateTime } from '../utils/formatters';

/**
 * CellHistoryModal — Shows the edit history of a timetable cell.
 * history: Array of { subject, editedBy: {name}, editedAt, previousSubject }
 */
export default function CellHistoryModal({ isOpen, cell, history, loading, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="modal-card max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="history-modal-title" className="text-base font-semibold text-slate-800">
              Cell Edit History
            </h2>
            {cell && (
              <p className="text-xs text-slate-500 mt-0.5">
                {cell.day} · Period {(cell.periodIndex ?? cell.period ?? 0) + 1}
                {cell.department?.name ? ` · ${cell.department.name}` : ''}
              </p>
            )}
          </div>
          <button className="btn-ghost p-1 text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No edit history available for this cell.</p>
            </div>
          ) : (
            <ol className="relative border-l border-slate-200 space-y-4 ml-2">
              {history.map((entry, idx) => (
                <li key={idx} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border border-white bg-indigo-400" />
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">
                        {entry.subject || <em className="text-slate-400">Empty</em>}
                      </span>
                      <span className="text-xs text-slate-400">{formatDateTime(entry.editedAt)}</span>
                    </div>
                    {entry.previousSubject !== undefined && (
                      <p className="text-xs text-slate-500">
                        Previously:{' '}
                        <span className="font-medium">{entry.previousSubject || '(empty)'}</span>
                      </p>
                    )}
                    {entry.editedBy?.name && (
                      <p className="text-xs text-slate-400">
                        Edited by:{' '}
                        <span className="font-medium text-slate-600">{entry.editedBy.name}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
