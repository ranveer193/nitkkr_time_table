import { useEffect } from 'react';
import { formatDateTime } from '../utils/formatters';

export default function CellHistoryModal({ isOpen, cell, history, loading, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Process history to compute the 'new' state after each edit
  const processedHistory = [...(history || [])]
    .sort((a, b) => new Date(a.timestamp || a.editedAt) - new Date(b.timestamp || b.editedAt))
    .map((entry, i, arr) => {
      const isLast = i === arr.length - 1;
      const nextStateValue = isLast ? cell?.subject : arr[i + 1].previousValue;
      const nextStateDept = isLast ? cell?.department : arr[i + 1].previousDepartment;
      
      return {
        ...entry,
        nextValue: nextStateValue,
        nextDepartment: nextStateDept
      };
    })
    .reverse(); // Newest first

  return (
    <div className="modal-overlay z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="modal-card max-w-lg w-full bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh] animate-modal-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 id="history-modal-title" className="text-lg font-semibold text-slate-800 leading-tight">
                Cell Edit History
              </h2>
              {cell && (
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {cell.day} · Period {(cell.periodIndex ?? cell.period ?? 0) + (cell.periodIndex !== undefined ? 1 : 0)}
                  {cell.department?.name ? ` · ${cell.department.name}` : ''}
                </p>
              )}
            </div>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" onClick={onClose} aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-2 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400 mt-4">Loading history...</p>
            </div>
          ) : processedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No edit history available for this cell.</p>
            </div>
          ) : (
            <div className="py-4">
              <ol className="relative border-l-2 border-indigo-100 space-y-6 ml-3">
                {processedHistory.map((entry, idx) => {
                  const timeStr = formatDateTime(entry.timestamp || entry.editedAt);
                  const isDept = entry.action === 'DEPT_ASSIGNMENT';
                  
                  const prevDeptName = entry.previousDepartment?.name || 'Unassigned';
                  const nextDeptName = entry.nextDepartment?.name || 'Unassigned';
                  
                  const prevValStr = entry.previousValue || 'Empty';
                  const nextValStr = entry.nextValue || 'Empty';

                  return (
                    <li key={idx} className="ml-6 flex flex-col group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[9px] mt-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-500 ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all" />
                      
                      <div className="bg-white border border-slate-200 shadow-sm shadow-slate-100 rounded-xl p-4 transition-shadow hover:shadow-md">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            {isDept ? (
                              <span className="badge badge-emerald py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Department Assigned
                              </span>
                            ) : (
                              <span className="badge badge-indigo py-0.5 px-2 bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Subject Updated
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md">
                            {timeStr}
                          </span>
                        </div>

                        {/* Changes visualizer */}
                        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 mb-3 space-y-2">
                          {isDept ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                              <div className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-500 line-through decoration-slate-300">
                                {prevDeptName}
                              </div>
                              <svg className="w-4 h-4 text-slate-400 hidden sm:block flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                              <div className="flex-1 px-3 py-1.5 bg-white border border-emerald-200 rounded-md text-emerald-700 font-medium whitespace-break-spaces">
                                {nextDeptName}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                              <div className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-500 line-through decoration-slate-300">
                                {prevValStr}
                              </div>
                              <svg className="w-4 h-4 text-slate-400 hidden sm:block flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                              <div className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-md text-indigo-700 font-medium whitespace-break-spaces">
                                {nextValStr}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          Updated by <span className="font-medium text-slate-700">{entry.editedBy?.name || entry.editedByName || 'Unknown User'}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button className="btn-secondary px-5 py-2" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
