import { createContext, useContext, useState, useEffect } from "react";
import Popup from "../components/Popup";
import Toast from "../components/Toast";
import { setToastRef } from "../utils/toastEmitter";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast(<Toast message={message} type={type} />);
  };

  useEffect(() => {
    setToastRef(showToast);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Popup toast={toast} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}
