import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalWrapper({ open, onClose, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      document.body.style.overflow = "hidden";
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Full Viewport Backdrop */}
      <div
        className="fixed inset-0 bg-groomish-slate/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card - Constrained to Viewport with Internal Scroll */}
      <div
        className={`relative bg-white text-groomish-slate rounded-3xl shadow-2xl w-full ${maxWidth} p-5 sm:p-7 z-10 border border-groomish-slate/10 animate-slide-up my-auto max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 pr-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
