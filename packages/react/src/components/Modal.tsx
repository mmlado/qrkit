import { useEffect, useRef } from "react";

import { createFocusTrap } from "focus-trap";

export interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ title, onClose, children, className }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    const trap = el
      ? createFocusTrap(el, {
          escapeDeactivates: true,
          onDeactivate: onClose,
          allowOutsideClick: true,
        })
      : null;

    trap?.activate();
    return () => { trap?.deactivate(); };
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="qrkit qrkit-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={containerRef}
        className={`qrkit-modal${className ? ` ${className}` : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qrkit-modal-header">
          <h2 className="qrkit-modal-title">{title}</h2>
          <button className="qrkit-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
