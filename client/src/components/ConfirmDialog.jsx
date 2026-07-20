// ConfirmDialog — replaces window.confirm with a proper in-UI modal
import { X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', confirmClass = 'btn-primary', onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
      <div className="app-dialog-panel w-full max-w-sm">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onCancel}><X size={18} className="text-slate-400" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-muted">Cancel</button>
          <button onClick={onConfirm} className={confirmClass}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
