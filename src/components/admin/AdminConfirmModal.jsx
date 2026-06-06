import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function AdminConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl shadow-2xl p-5 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${danger ? 'bg-red-500/10 text-red-400' : 'bg-brand-gold/10 text-brand-gold'}`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="admin-confirm-title" className="text-lg font-bold text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-white p-1 rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-300 mb-6">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-dark-border text-gray-300 hover:text-white hover:border-gray-500 transition-colors min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-lg font-semibold min-h-[44px] transition-opacity disabled:opacity-50 ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-brand-gold hover:opacity-90 text-black'
            }`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
