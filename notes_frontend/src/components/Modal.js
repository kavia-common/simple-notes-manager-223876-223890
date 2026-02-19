import React, { useEffect } from "react";
import "../App.css";

// PUBLIC_INTERFACE
export function Modal({ title, children, onClose }) {
  /** Simple accessible modal dialog (ESC + backdrop close). */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modalCard"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div className="modalTitle">{title}</div>
          <button className="btn btnGhost" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
