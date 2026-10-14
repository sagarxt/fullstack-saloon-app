import { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";

const COMMON_PRESETS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "12:00", "13:00", "14:00", "18:00", "19:00",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

const HOURS_12 = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTES = ["00", "15", "30", "45"];

export default function CustomTimePicker({
  value = "09:00",
  onChange,
  label,
  placeholder = "Select Time",
  align = "left",
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse "HH:mm" to 12-hour format
  const parse24To12 = (time24) => {
    if (!time24 || typeof time24 !== "string") {
      return { hour12: "09", minute: "00", period: "AM" };
    }
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr || "9", 10);
    const m = mStr ? mStr.padStart(2, "0").slice(0, 2) : "00";
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    const hour12 = String(h).padStart(2, "0");
    return { hour12, minute: m, period };
  };

  const format12To24 = (hour12, minute, period) => {
    let h = parseInt(hour12, 10);
    if (period === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h < 12) h += 12;
    }
    return `${String(h).padStart(2, "0")}:${minute}`;
  };

  const { hour12, minute, period } = parse24To12(value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const updateTime = (newH12, newMin, newPeriod) => {
    const formatted24 = format12To24(newH12, newMin, newPeriod);
    if (onChange) {
      const synthEvent = {
        target: { value: formatted24 },
        value: formatted24,
      };
      onChange(synthEvent, formatted24);
    }
  };

  const handleSelectPreset = (preset24) => {
    if (onChange) {
      onChange({ target: { value: preset24 } }, preset24);
    }
    setOpen(false);
  };

  const formatDisplayTime = (time24) => {
    if (!time24) return placeholder;
    const { hour12: h, minute: m, period: p } = parse24To12(time24);
    return `${h}:${m} ${p}`;
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-groomish-slate mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border transition-all duration-200 cursor-pointer ${
          open
            ? "border-groomish-orange ring-2 ring-groomish-orange/25 bg-white shadow-soft"
            : "border-groomish-slate/20 bg-white hover:border-groomish-slate/40"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-groomish-cream/40" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-3.5 h-3.5 text-groomish-orange shrink-0" />
          <span className="font-bold text-groomish-slate font-mono">
            {formatDisplayTime(value)}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-groomish-slate/50 transition-transform duration-200 ${
            open ? "rotate-180 text-groomish-orange" : ""
          }`}
        />
      </div>

      {/* Popover */}
      {open && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-72 bg-white rounded-2xl border border-groomish-slate/15 shadow-2xl p-4 animate-fade-in divide-y divide-groomish-slate/10 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Header Active Display */}
          <div className="flex items-center justify-between pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-slate/60">
              Salon Time
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold font-mono text-groomish-slate">
                {hour12}:{minute}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-groomish-orange/15 text-groomish-orange font-mono">
                {period}
              </span>
            </div>
          </div>

          {/* Precision Selector: Hour, Minute, AM/PM */}
          <div className="py-3 space-y-3">
            {/* AM / PM Toggle */}
            <div className="flex rounded-xl bg-groomish-cream p-1 border border-groomish-slate/10">
              <button
                type="button"
                onClick={() => updateTime(hour12, minute, "AM")}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${
                  period === "AM"
                    ? "bg-groomish-orange text-white shadow-sm"
                    : "text-groomish-slate/70 hover:text-groomish-slate"
                }`}
              >
                AM (Morning)
              </button>
              <button
                type="button"
                onClick={() => updateTime(hour12, minute, "PM")}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${
                  period === "PM"
                    ? "bg-groomish-orange text-white shadow-sm"
                    : "text-groomish-slate/70 hover:text-groomish-slate"
                }`}
              >
                PM (Evening)
              </button>
            </div>

            {/* Hours Grid */}
            <div>
              <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block mb-1.5">
                Hour
              </span>
              <div className="grid grid-cols-6 gap-1">
                {HOURS_12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => updateTime(h, minute, period)}
                    className={`h-7 rounded-lg text-xs font-bold font-mono transition ${
                      hour12 === h
                        ? "bg-groomish-slate text-white shadow-sm"
                        : "text-groomish-slate/70 hover:bg-groomish-cream hover:text-groomish-orange"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Grid */}
            <div>
              <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block mb-1.5">
                Minute
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateTime(hour12, m, period)}
                    className={`py-1 rounded-lg text-xs font-bold font-mono transition ${
                      minute === m
                        ? "bg-groomish-orange text-white shadow-sm"
                        : "text-groomish-slate/70 hover:bg-groomish-cream hover:text-groomish-orange"
                    }`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Presets Grid */}
          <div className="pt-3">
            <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block mb-1.5">
              Quick Salon Presets
            </span>
            <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto pr-1">
              {COMMON_PRESETS.map((pst) => {
                const isSelected = value === pst;
                return (
                  <button
                    key={pst}
                    type="button"
                    onClick={() => handleSelectPreset(pst)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition text-left flex items-center justify-between ${
                      isSelected
                        ? "bg-groomish-orange/15 text-groomish-orange border border-groomish-orange/30 font-extrabold"
                        : "text-groomish-slate/70 hover:bg-groomish-cream hover:text-groomish-slate"
                    }`}
                  >
                    <span>{pst}</span>
                    {isSelected && <Check className="w-3 h-3 text-groomish-orange" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Done Button */}
          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 bg-groomish-slate text-white text-xs font-bold rounded-lg hover:bg-groomish-slate/90 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
