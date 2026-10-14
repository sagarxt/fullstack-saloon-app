import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CustomDatePicker({
  value,
  onChange,
  label,
  placeholder = "Select Date",
  minDate,
  maxDate,
  align = "left",
  className = "",
  triggerClassName = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial view date
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  const selectedDate = parseDate(value);
  const today = new Date();

  // Viewing month/year state
  const [viewYear, setViewYear] = useState(() => (selectedDate ? selectedDate.getFullYear() : today.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (selectedDate ? selectedDate.getMonth() : today.getMonth()));

  // Sync view when value changes from outside
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close
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

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const formatDateToString = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleDateSelect = (d) => {
    const formatted = formatDateToString(d);
    if (onChange) {
      // Support both direct string and synthetic event shape
      const synthEvent = {
        target: { value: formatted },
        value: formatted,
      };
      onChange(synthEvent, formatted);
    }
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: "" }, value: "" }, "");
    }
    setOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    handleDateSelect(new Date());
  };

  // Generate calendar grid (including leading & trailing days)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth, i),
      isCurrentMonth: true,
    });
  }

  // Next month leading days (fill up to multiple of 7, min 35 or 42)
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth + 1, i),
      isCurrentMonth: false,
    });
  }

  // Display date text in trigger
  const displayFormatted = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const minD = minDate ? parseDate(minDate) : null;
  const maxD = maxDate ? parseDate(maxDate) : null;

  const isDayDisabled = (d) => {
    if (minD && d < new Date(minD.getFullYear(), minD.getMonth(), minD.getDate())) return true;
    if (maxD && d > new Date(maxD.getFullYear(), maxD.getMonth(), maxD.getDate())) return true;
    return false;
  };

  const isFullWidth = className.includes("w-full");

  return (
    <div
      ref={containerRef}
      className={`relative select-none text-left ${
        isFullWidth ? "w-full block" : "inline-block"
      } ${className}`}
    >
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
          open
            ? "border-groomish-orange ring-2 ring-groomish-orange/25 bg-white shadow-soft"
            : "border-groomish-slate/15 bg-groomish-cream/70 hover:bg-white hover:border-groomish-slate/30"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarIcon className="w-4 h-4 text-groomish-orange shrink-0" />

          {label && (
            <span className="text-[11px] font-semibold text-groomish-slate/60 shrink-0">
              {label}
            </span>
          )}

          <span
            className={`text-xs font-bold truncate ${
              selectedDate ? "text-groomish-slate" : "text-groomish-slate/40"
            }`}
          >
            {displayFormatted || placeholder}
          </span>
        </div>

        {selectedDate && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-groomish-slate/10 text-groomish-slate/40 hover:text-groomish-crimson transition shrink-0 ml-1"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Groomish Themed Calendar Popover */}
      {open && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 bg-white rounded-2xl border border-groomish-slate/15 shadow-2xl p-4 animate-fade-in ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Header Month / Year & Chevrons */}
          <div className="flex items-center justify-between pb-3 border-b border-groomish-slate/10">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-heading font-extrabold text-groomish-slate">
                {MONTH_NAMES[viewMonth]}
              </span>
              <span className="text-xs font-bold text-groomish-orange font-mono">
                {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-groomish-slate/70 hover:text-groomish-slate hover:bg-groomish-cream transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-groomish-slate/70 hover:text-groomish-slate hover:bg-groomish-cream transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center py-2">
            {DAY_NAMES.map((name, i) => (
              <span
                key={name}
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  i === 0 || i === 6 ? "text-groomish-orange/80" : "text-groomish-slate/50"
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const d = item.date;
              const isSelected =
                selectedDate &&
                d.getDate() === selectedDate.getDate() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getFullYear() === selectedDate.getFullYear();

              const isToday =
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear();

              const disabledDay = isDayDisabled(d);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleDateSelect(d)}
                  className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-150 ${
                    isSelected
                      ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white font-bold shadow-md shadow-groomish-orange/30 scale-105"
                      : isToday
                      ? "border border-groomish-orange text-groomish-orange font-bold hover:bg-groomish-orange/10"
                      : item.isCurrentMonth
                      ? "text-groomish-slate hover:bg-groomish-cream hover:text-groomish-orange"
                      : "text-groomish-slate/30 hover:bg-groomish-cream/50"
                  } ${disabledDay ? "opacity-25 cursor-not-allowed hover:bg-transparent" : "cursor-pointer"}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-groomish-slate/10 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-groomish-slate/50 hover:text-groomish-crimson font-medium px-2 py-1 rounded-lg hover:bg-groomish-crimson/10 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex items-center gap-1 text-groomish-orange hover:text-groomish-orangeDark font-bold px-2 py-1 rounded-lg hover:bg-groomish-orange/10 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>Today</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
