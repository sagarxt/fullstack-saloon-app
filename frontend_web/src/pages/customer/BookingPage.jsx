import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserNavbar from "../../components/user/UserNavbar";
import {
  getServiceById,
  getUnavailableSlots,
} from "../../api/customer";
import {
  generateSlots,
  isSlotBlocked,
} from "../../utils/slotUtils";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [note, setNote] = useState("");
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const slots = generateSlots(); // 10:00 – 20:00, 30-min gap

  /* ===============================
     Load service
     =============================== */
  useEffect(() => {
    getServiceById(id).then((res) => setService(res.data));
  }, [id]);

  /* ===============================
     Fetch unavailable slots
     =============================== */
  useEffect(() => {
    if (!date) return;

    setSelectedSlot("");
    getUnavailableSlots(date, id)
      .then((res) =>
        setUnavailableSlots(res.data?.unavailableSlots || [])
      )
      .catch(() => setUnavailableSlots([]));
  }, [date, id]);

  const continueToConfirm = () => {
    if (!date || !selectedSlot) {
      alert("Please select date and time");
      return;
    }

    navigate("/customer/confirm-booking", {
      state: {
        service,
        date,
        time: selectedSlot,
        note,
      },
    });
  };

  if (!service) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-semibold">
          Book {service.name}
        </h1>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-md px-3 py-2"
          />
        </div>

        {/* Slots */}
        {date && (
          <div>
            <h2 className="text-sm font-medium mb-2">
              Available Time Slots
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map((slot) => {
                const blocked = isSlotBlocked(
                  slot,
                  unavailableSlots,
                  service.durationMinutes
                );

                return (
                  <button
                    key={slot}
                    disabled={blocked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      blocked
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : selectedSlot === slot
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Note (Optional)
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border rounded-md px-3 py-2 resize-none"
          />
        </div>

        {/* Continue */}
        <button
          onClick={continueToConfirm}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          Continue
        </button>
      </main>
    </div>
  );
}
