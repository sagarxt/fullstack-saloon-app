import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  name = "",
  className = "",
  containerClassName = "",
  menuClassName = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? "",
        label: opt.label ?? opt.name ?? String(opt.value ?? ""),
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const handleSelect = (optValue) => {
    setOpen(false);
    if (!onChange) return;

    // Support both onChange(value) and standard form event onChange({ target: { name, value } })
    onChange({
      target: { name: name || "", value: optValue },
      value: optValue,
    });
  };

  return (
    <div ref={containerRef} className={`relative select-none ${containerClassName || "w-full"}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-groomish-slate/15 bg-white text-groomish-slate text-xs text-left transition-all duration-200 ${
          open
            ? "ring-2 ring-groomish-orange/40 border-groomish-orange shadow-soft"
            : "hover:border-groomish-slate/30"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-groomish-cream/40" : "cursor-pointer"} ${className}`}
      >
        <span
          className={`truncate font-medium ${
            selectedOption ? "font-semibold" : "opacity-50"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 opacity-60 ${
            open ? "rotate-180 text-groomish-orange !opacity-100" : ""
          }`}
        />
      </button>

      {/* Smooth Floating Menu */}
      {open && (
        <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-groomish-slate/15 shadow-2xl p-1.5 max-h-60 overflow-y-auto animate-fade-in divide-y divide-groomish-slate/5 ${menuClassName}`}>
          {normalizedOptions.length === 0 ? (
            <div className="py-3 px-4 text-center text-xs text-groomish-slate/40 italic">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-groomish-orange/10 text-groomish-orange font-bold"
                      : "text-groomish-slate hover:bg-groomish-cream hover:text-groomish-slate font-medium"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-groomish-orange shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
