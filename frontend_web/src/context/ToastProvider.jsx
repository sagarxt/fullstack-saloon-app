import { createContext, useState, useEffect, useCallback, useContext } from "react";
import Toast from "../components/Toast";
import { setToastRef } from "../utils/toastEmitter";

export const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", title) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev.slice(-3), { id, message, type, title }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg, title) => showToast(msg, "success", title), [showToast]);
  const error = useCallback((msg, title) => showToast(msg, "error", title), [showToast]);
  const warning = useCallback((msg, title) => showToast(msg, "warning", title), [showToast]);
  const info = useCallback((msg, title) => showToast(msg, "info", title), [showToast]);

  useEffect(() => {
    setToastRef(showToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Floating Notifications Hub */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            title={t.title}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
