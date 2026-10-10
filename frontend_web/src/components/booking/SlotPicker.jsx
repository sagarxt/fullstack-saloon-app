import { useEffect, useState } from "react";
import { getSlotAvailability } from "../../api/customer";
import { generateSlots } from "../../utils/slots";
import { Calendar, Clock } from "lucide-react";

export default function SlotPicker({
  serviceId,
  date,
  onDateChange,
  selectedSlot,
  onSlotSelect,
}) {
  const [slots, setSlots] = useState([]);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;

    const loadSlots = async () => {
      setLoading(true);
      try {
        const res = await getSlotAvailability(date, serviceId);
        setUnavailableSlots(res.data?.unavailableSlots || []);
        setSlots(generateSlots());
      } catch (err) {
        setSlots(generateSlots());
        setUnavailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [date, serviceId]);

  return (
    <div className="space-y-4">
      {/* DATE */}
      <div>
        <label className="block text-xs font-bold text-groomish-slate/80 mb-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-groomish-orange" />
          Select New Date
        </label>
        <input
          type="date"
          className="input-groomish"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {/* SLOTS */}
      {date && (
        <div>
          <label className="block text-xs font-bold text-groomish-slate/80 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-groomish-orange" />
            Select Available Slot
          </label>

          {loading ? (
            <div className="text-center py-4 text-xs text-groomish-slate/50">
              Loading slots...
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
              {slots.map((slot) => {
                const disabled = unavailableSlots.includes(slot);
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSlotSelect(slot)}
                    className={`text-xs py-2 px-1 rounded-xl font-semibold border transition ${
                      disabled
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-groomish-orange text-white border-groomish-orange shadow-glowOrange scale-105"
                        : "bg-white text-groomish-slate border-groomish-slate/15 hover:border-groomish-orange hover:bg-groomish-orangeLight"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
