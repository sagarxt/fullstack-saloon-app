import { createContext, useContext, useState } from "react";

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "error") => {
        setToast({ message, type });

        // Auto hide in 3 seconds
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast UI */}
            {toast && (
                <div className="fixed bottom-10 inset-x-0 flex items-center justify-center z-50">
                    <div
                        className={`px-6 py-4 rounded-2xl shadow-2xl animate-fadeIn
        ${toast.type === "error"
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : ""
                            }
        ${toast.type === "success"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : ""
                            }
        ${toast.type === "info"
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : ""
                            }
        ${toast.type === "warning" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : ""}
      `}
                    >
                        {toast.message}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}
