export default function ConfirmDialog({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}) {
  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 animate-[popIn_0.25s_ease-out]">
        
        <h3 className="text-xl font-semibold text-center text-red-600">
          {title}
        </h3>

        <p className="text-gray-600 text-center mt-2">
          {message}
        </p>

        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-xl hover:bg-gray-100"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
