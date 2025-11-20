// src/pages/customer/MyBookings.jsx
import { useEffect, useState } from "react";
import { getMyBookings, cancelMyBooking } from "../../api/customer";
import { useToast } from "../../components/Toast";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.data);
    } catch {
      showToast("Failed to load bookings", "error");
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel booking?")) return;
    try {
      await cancelMyBooking(id);
      showToast("Booking cancelled", "success");
      load();
    } catch {
      showToast("Failed to cancel", "error");
    }
  };

  if (bookings.length === 0) return <div className="p-6 text-center text-gray-500">No bookings</div>;

  return (
    <div className="p-6 grid md:grid-cols-2 gap-4">
      {bookings.map(b => (
        <div key={b.id} className="bg-white p-4 rounded-xl shadow border">
          <h4 className="text-lg font-semibold">Booking #{String(b.id).slice(0,8)}</h4>
          <p className="text-sm mt-1"><b>Service:</b> {String(b.serviceId).slice(0,8)}</p>
          <p className="text-sm mt-1"><b>When:</b> {b.scheduledAt ? b.scheduledAt.replace('T',' ').slice(0,16) : '—'}</p>
          <p className="text-sm mt-1"><b>Price:</b> ₹{b.pricePaid}</p>
          <p className="text-sm mt-1"><b>Status:</b> {b.status}</p>

          <div className="flex justify-end gap-2 mt-3">
            {b.status === "PENDING" && (
              <button onClick={() => handleCancel(b.id)} className="px-3 py-1 bg-red-500 text-white rounded-lg">Cancel</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
