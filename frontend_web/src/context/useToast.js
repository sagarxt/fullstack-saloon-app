import { useContext } from "react";
import { ToastContext } from "./ToastProvider";

export const useToast = () => useContext(ToastContext);
export default useToast;
