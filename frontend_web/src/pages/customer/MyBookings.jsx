import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/user/UserNavbar";
import { getMyBookings } from "../../api/customer";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data || []);
    } catch {
      alert("Failed to load bookings");
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      MODIFIED: "bg-indigo-100 text-indigo-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">My Bookings</h1>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Booking ID</th>
                <th className="p-3">Scheduled At</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3 font-mono text-xs">
                      {b.id.slice(0, 8)}...
                    </td>

                    <td className="p-3">
                      {new Date(b.scheduledAt).toLocaleString()}
                    </td>

                    <td className="p-3 font-medium">
                      ₹{b.pricePaid}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          navigate(`/customer/bookings/${b.id}`)
                        }
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
