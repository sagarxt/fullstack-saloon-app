export default function Popup({ message, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center animate-fadeIn">

        <h2 className="text-xl font-semibold text-red-600 mb-3">
          Error
        </h2>

        <p className="text-gray-700 mb-5">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
