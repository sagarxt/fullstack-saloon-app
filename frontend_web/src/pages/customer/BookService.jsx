// src/pages/customer/BookService.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getService, createBooking } from "../../api/customer";
import { useToast } from "../../components/Toast";

export default function BookService() {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [scheduledAt, setScheduledAt] = useState(""); // value for datetime-local
  const [note, setNote] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (serviceId) load();
  }, [serviceId]);

  const load = async () => {
    try {
      const res = await getService(serviceId);
      setService(res.data);
    } catch {
      showToast("Failed to load service", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!scheduledAt) {
      showToast("Please choose date & time", "warning");
      return;
    }

    try {
      // scheduledAt is like "2025-11-16T14:30" from datetime-local → send it as-is
      const payload = {
        serviceId: service.id,
        note,
        scheduledAt // will be parsed as LocalDateTime by backend
      };

      await createBooking(payload);
      showToast("Booking created", "success");
      navigate("/customer/bookings");
    } catch (err) {
      console.error(err);
      showToast("Failed to create booking", "error");
    }
  };

  if (!service) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Book: {service.name}</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <label className="block text-sm mb-1">Choose date & time</label>
          <input
            type="datetime-local"
            className="border p-2 rounded-xl w-full"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Note (optional)</label>
          <textarea className="border p-2 rounded-xl w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <div className="text-gray-500 text-sm">Price</div>
            <div className="text-lg font-semibold">₹{service.price}</div>
          </div>

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl">Confirm Booking</button>
        </div>
      </form>
    </div>
  );
}
