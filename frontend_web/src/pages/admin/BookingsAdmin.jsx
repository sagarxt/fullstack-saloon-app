import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  adminFilterBookings,
  adminDeleteBooking,
} from "../../api/admin";
import { useToast } from "../../components/Toast";

export default function BookingsAdmin() {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // FILTERS
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // DELETE POPUP
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  /* ----------------------------------------------------
     LOAD BOOKINGS
  ---------------------------------------------------- */
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (filters = {}) => {
    setLoading(true);
    try {
      const filtered = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );

      const res = await adminFilterBookings(filtered);
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load bookings", "error");
    }
    setLoading(false);
  };

  /* ----------------------------------------------------
     FILTERS
  ---------------------------------------------------- */
  const applyFilters = () => {
    loadBookings({
      keyword,
      status: statusFilter,
      fromDate,
      toDate,
    });
  };

  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    loadBookings({});
  };

  /* ----------------------------------------------------
     DELETE LOGIC
  ---------------------------------------------------- */
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    try {
      await adminDeleteBooking(deleteId);
      showToast("Booking deleted", "success");
      setShowDeletePopup(false);
      loadBookings();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete booking", "error");
    }
  };

  /* ----------------------------------------------------
     SAFE HELPERS
  ---------------------------------------------------- */

  const safeUUID = (id) => String(id || "").slice(0, 8);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Not Scheduled";

    try {
      return timestamp.replace("T", " ").slice(0, 16);
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusClasses = (status) => {
    const s = status?.toUpperCase() || "UNKNOWN";
    switch (s) {
      case "COMPLETED": return "bg-green-600";
      case "CONFIRMED": return "bg-blue-600";
      case "CANCELLED": return "bg-red-600";
      case "PENDING": return "bg-gray-500";
      default: return "bg-gray-400";
    }
  };

  /* ----------------------------------------------------
     UI
  ---------------------------------------------------- */

  return (
    <AdminLayout>
      <h2 className="text-2xl font-semibold mb-4">Manage Bookings</h2>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3 items-center mb-6 bg-white p-4 rounded-xl shadow">

        <input
          type="text"
          placeholder="Search note, user, service..."
          className="border p-2 rounded-xl w-60"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <select
          className="border p-2 rounded-xl"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div className="flex gap-2 items-center">
          <input
            type="date"
            className="border p-2 rounded-xl"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            className="border p-2 rounded-xl"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <button
          onClick={applyFilters}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
        >
          Apply
        </button>

        <button
          onClick={clearFilters}
          className="bg-gray-200 px-4 py-2 rounded-xl"
        >
          Reset
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-gray-500">Loading bookings...</div>
      )}

      {/* EMPTY STATE */}
      {!loading && bookings.length === 0 && (
        <div className="text-center py-20 text-gray-500 text-lg">
          No bookings available
        </div>
      )}

      {/* BOOKINGS LIST */}
      {!loading && bookings.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((b) => {
            const status = b.status?.toUpperCase() || "UNKNOWN";
            return (
              <div key={b.id} className="bg-white p-4 rounded-xl shadow border">
                <h4 className="text-lg font-semibold">
                  Booking #{safeUUID(b.id)}
                </h4>

                <p className="text-sm mt-1"><strong>User:</strong> {safeUUID(b.userId)}</p>
                <p className="text-sm mt-1"><strong>Service:</strong> {safeUUID(b.serviceId)}</p>
                <p className="text-sm mt-1"><strong>When:</strong> {formatDate(b.scheduledAt)}</p>

                <p className="text-sm mt-1">
                  <strong>Status:</strong>{" "}
                  <span className={`px-2 py-1 text-white rounded ${getStatusClasses(status)}`}>
                    {status}
                  </span>
                </p>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => handleDeleteClick(b.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-80 animate-scaleIn">
            <h3 className="text-xl font-semibold text-center text-red-600">
              Delete Booking?
            </h3>

            <p className="text-gray-600 text-center mt-2">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setShowDeletePopup(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          <style>{`
            @keyframes scaleIn {
              0% { transform: scale(0.85); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-scaleIn {
              animation: scaleIn 0.25s ease-out;
            }
          `}</style>
        </div>
      )}
    </AdminLayout>
  );
}
