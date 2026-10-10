import { useEffect } from "react";

export default function Popup({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-5 right-5 z-50">
      {toast}
    </div>
  );
}
