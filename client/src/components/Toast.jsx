import { useEffect, useState, useSyncExternalStore } from "react";

// One small message at a time at the bottom of the screen, with an optional action ("Rated 4★ · Undo").
// Call showToast() from anywhere; <ToastHost /> (in App.jsx) draws it.
let current = null;
let seq = 0;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function showToast({ message, actionLabel, onAction, durationMs = 5000 }) {
  seq += 1;
  current = { id: seq, message, actionLabel, onAction, durationMs };
  emit();
}

export function dismissToast(id) {
  if (current && (id === undefined || current.id === id)) {
    current = null;
    emit();
  }
}

export default function ToastHost() {
  const toast = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!toast || hover) return undefined;
    const timer = setTimeout(() => dismissToast(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast, hover]);
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toast && (
        <div className="toast" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <span>{toast.message}</span>
          {toast.actionLabel && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                dismissToast(toast.id);
                toast.onAction();
              }}
            >
              {toast.actionLabel}
            </button>
          )}
          <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
