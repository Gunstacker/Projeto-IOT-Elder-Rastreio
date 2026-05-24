import { X } from "lucide-react";
import { eventMeta, formatTime } from "../constants/monitoring";

export default function ToastCenter({ toasts = [], onDismiss }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const meta = eventMeta(toast.eventType);
        const Icon = meta.icon;

        return (
          <article key={toast.id} className={`toast toast-${toast.tone || meta.tone}`}>
            <div className="toast-icon">
              <Icon size={17} />
            </div>
            <div>
              <strong>{toast.title || meta.label}</strong>
              <p>{toast.message || meta.description}</p>
              <span>{formatTime(toast.createdAt)}</span>
            </div>
            <button className="icon-button toast-close" onClick={() => onDismiss(toast.id)} title="Fechar">
              <X size={15} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
