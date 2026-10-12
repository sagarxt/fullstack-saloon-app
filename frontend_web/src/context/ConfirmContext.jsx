import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { AlertCircle, HelpCircle, CheckCircle2, Trash2, X, AlertTriangle } from "lucide-react";

const ConfirmContext = createContext({
  confirm: () => Promise.resolve(false),
  alert: () => Promise.resolve(true),
});

let globalConfirmHandler = null;
let globalAlertHandler = null;

export const showConfirm = (options) => {
  if (globalConfirmHandler) {
    if (typeof options === "string") {
      return globalConfirmHandler({ message: options });
    }
    return globalConfirmHandler(options);
  }
  return Promise.resolve(window.confirm(typeof options === "string" ? options : options.message));
};

export const showAlert = (options) => {
  if (globalAlertHandler) {
    if (typeof options === "string") {
      return globalAlertHandler({ message: options });
    }
    return globalAlertHandler(options);
  }
  return Promise.resolve(window.alert(typeof options === "string" ? options : options.message));
};

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "primary", // "primary" | "danger" | "success" | "warning"
    isAlert: false,
  });

  const resolverRef = useRef(null);

  const confirm = useCallback(
    ({
      title = "Confirm Action",
      message = "Are you sure you want to proceed?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      variant = "primary",
    }) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setModalState({
          open: true,
          title,
          message,
          confirmText,
          cancelText,
          variant,
          isAlert: false,
        });
      });
    },
    []
  );

  const alertModal = useCallback(
    ({
      title = "Notice",
      message = "",
      confirmText = "Got it",
      variant = "primary",
    }) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setModalState({
          open: true,
          title,
          message,
          confirmText,
          cancelText: "",
          variant,
          isAlert: true,
        });
      });
    },
    []
  );

  useEffect(() => {
    globalConfirmHandler = confirm;
    globalAlertHandler = alertModal;
    return () => {
      globalConfirmHandler = null;
      globalAlertHandler = null;
    };
  }, [confirm, alertModal]);

  const handleConfirm = () => {
    setModalState((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setModalState((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && modalState.open) {
        handleCancel();
      }
    };
    if (modalState.open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalState.open]);

  // Variant helper styles
  const getVariantStyles = () => {
    switch (modalState.variant) {
      case "danger":
        return {
          icon: <Trash2 className="w-5 h-5 text-groomish-crimson" />,
          iconBg: "bg-red-50 border-red-200",
          confirmBtn:
            "bg-groomish-crimson hover:bg-red-600 text-white font-bold shadow-sm active:scale-95",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          iconBg: "bg-amber-50 border-amber-200",
          confirmBtn:
            "bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm active:scale-95",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          iconBg: "bg-emerald-50 border-emerald-200",
          confirmBtn:
            "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm active:scale-95",
        };
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-groomish-orange" />,
          iconBg: "bg-groomish-orangeLight border-groomish-orange/20",
          confirmBtn:
            "bg-gradient-to-r from-groomish-orange to-groomish-coral hover:shadow-glowOrange text-white font-bold active:scale-95",
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={{ confirm, alert: alertModal }}>
      {children}

      {/* Groomish Themed Confirmation Pop-up Modal */}
      {modalState.open && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 animate-fade-in select-none">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-groomish-slate/70 backdrop-blur-sm transition-opacity"
            onClick={handleCancel}
          />

          {/* Dialog Card */}
          <div
            className="relative bg-white text-groomish-slate rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 border border-groomish-slate/15 animate-slide-up my-auto flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Icon & Close */}
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${currentStyles.iconBg}`}
              >
                {currentStyles.icon}
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-xl text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Title & Message */}
            <div className="space-y-1.5">
              <h3 className="font-heading font-extrabold text-lg text-groomish-slate tracking-tight">
                {modalState.title}
              </h3>
              <p className="text-xs sm:text-sm text-groomish-slate/70 leading-relaxed font-normal">
                {modalState.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-groomish-slate/10 flex items-center justify-end gap-2.5">
              {!modalState.isAlert && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-full border border-groomish-slate/20 bg-white text-xs font-bold text-groomish-slate hover:bg-groomish-cream active:scale-95 transition"
                >
                  {modalState.cancelText || "Cancel"}
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2 rounded-full text-xs transition duration-150 ${currentStyles.confirmBtn}`}
              >
                {modalState.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
