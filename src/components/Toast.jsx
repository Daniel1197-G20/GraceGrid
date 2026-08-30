import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type}`} role="status" aria-live="polite">
      <div className="toast-icon">
        {type === 'success' && <CheckCircle2 size={18} />}
        {type === 'error' && <AlertCircle size={18} />}
        {type === 'info' && <Info size={18} />}
      </div>
      <span className="toast-message">{message}</span>
      {onClose && (
        <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
