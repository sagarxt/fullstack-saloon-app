import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalWrapper({ open, isOpen, onClose, children, maxWidth = "max-w-lg", zIndex = "z-[9999]" }) {
  const isModalOpen = Boolean(open ?? isOpen);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        onClose();
      }
    };

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, onClose]);

  if (!isModalOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in`}>
      {/* Full Viewport Backdrop */}
      <div
        className="fixed inset-0 bg-groomish-slate/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card - Constrained to Viewport with Internal Scroll */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative bg-white text-groomish-slate rounded-2xl shadow-2xl w-full ${maxWidth} p-4 sm:p-5.5 z-10 border border-groomish-slate/10 animate-slide-up my-auto max-h-[92vh] flex flex-col`}
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
