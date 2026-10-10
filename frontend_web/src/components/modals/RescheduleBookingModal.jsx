import { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import SlotPicker from "../booking/SlotPicker";
import { rescheduleBooking } from "../../api/customer";
import { CalendarSync, AlertCircle } from "lucide-react";

export default function RescheduleBookingModal({
  open,
  onClose,
  booking,
  refresh,
}) {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!booking) return null;

  const serviceId = booking.items?.[0]?.serviceId || booking.serviceId;

  const handleReschedule = async () => {
    if (!date || !slot) {
      setError("Please pick both a date and a time slot.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await rescheduleBooking(
        booking.id,
        `${date}T${slot}:00`
      );
      refresh();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reschedule booking. Please try another slot.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="border-b border-groomish-slate/10 pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-blue bg-groomish-blueLight px-2.5 py-0.5 rounded-full inline-block mb-1">
            Reschedule
          </span>
          <h2 className="text-xl font-heading font-bold text-groomish-slate flex items-center gap-2">
            <CalendarSync className="w-5 h-5 text-groomish-blue" />
            Pick a New Date & Slot
          </h2>
        </div>

        {error && (
          <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <SlotPicker
          serviceId={serviceId}
          date={date}
          onDateChange={(d) => {
            setDate(d);
            setError("");
          }}
          selectedSlot={slot}
          onSlotSelect={(s) => {
            setSlot(s);
            setError("");
          }}
        />

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 text-xs py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !slot || !date}
            onClick={handleReschedule}
            className="btn-primary flex-1 text-xs py-2.5"
          >
            {loading ? "Updating..." : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
