import { useState } from "react";
import { rescheduleBooking } from "../../api/customer";
import { generateSlots } from "../../utils/slotUtils";

export default function RescheduleModal({ booking, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");

  if (!booking) return null;

  const submit = async () => {
    if (!date || !slot) return;

    await rescheduleBooking(booking.id, {
      scheduledAt: `${date}T${slot}`,
    });

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md w-full max-w-md space-y-4">

        <h2 className="font-semibold">Reschedule Booking</h2>

        <input type="date" value={date} onChange={e => setDate(e.target.value)} />

        <div className="grid grid-cols-4 gap-2">
          {generateSlots().map(s => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={`border rounded py-1 ${
                slot === s ? "bg-indigo-600 text-white" : ""
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>
          <button onClick={submit} className="bg-indigo-600 text-white px-3 py-1 rounded">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
