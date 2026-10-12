import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  searchPlaceholder = "Type to search...",
  name = "",
  className = "",
  containerClassName = "",
  menuClassName = "",
  disabled = false,
  searchable = true,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Extract raw value if object or event was passed
  const rawValue =
    typeof value === "object" && value !== null
      ? (value.target?.value ?? value.value ?? "")
      : (value ?? "");

  // Normalize options to [{ value, label, raw }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? "",
        label: opt.label ?? opt.name ?? String(opt.value ?? ""),
        raw: opt,
      };
    }
    return { value: opt, label: String(opt), raw: opt };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(rawValue)
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearchQuery("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      // Auto-focus search input when opened
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const handleSelect = (optValue) => {
    setOpen(false);
    setSearchQuery("");
    if (!onChange) return;

    // Support both onChange(event) and onChange(value)
    const eventObj = {
      target: { name: name || "", value: optValue },
      value: optValue,
      toString: () => String(optValue),
      valueOf: () => optValue,
      toJSON: () => optValue,
    };
    onChange(eventObj, optValue);
  };

  // Filter options by search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const labelMatch = String(opt.label).toLowerCase().includes(q);
    const valueMatch = String(opt.value).toLowerCase().includes(q);
    return labelMatch || valueMatch;
  });

  const showSearch = searchable && normalizedOptions.length > 3;

  return (
    <div ref={containerRef} className={`relative select-none ${containerClassName || "w-full"}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            if (open) setSearchQuery("");
          }
        }}
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
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-groomish-slate/15 shadow-2xl overflow-hidden animate-fade-in ${menuClassName}`}
        >
          {/* Integrated Groomish Search Bar */}
          {showSearch && (
            <div className="p-2 border-b border-groomish-slate/10 bg-groomish-cream/40 sticky top-0 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition shadow-xs">
                <Search className="w-3.5 h-3.5 text-groomish-orange shrink-0" />
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full text-xs bg-transparent border-none outline-none text-groomish-slate font-medium placeholder:text-groomish-slate/40"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    className="p-0.5 rounded-full hover:bg-groomish-slate/10 text-groomish-slate/40 hover:text-groomish-slate transition shrink-0"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="p-1.5 max-h-60 overflow-y-auto divide-y divide-groomish-slate/5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-4 text-center text-xs text-groomish-slate/50 space-y-1">
                <p className="font-semibold text-groomish-slate/70">No matching items found</p>
                {searchQuery && (
                  <p className="text-[11px] text-groomish-slate/40">
                    No results matching &ldquo;{searchQuery}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(rawValue);
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
        </div>
      )}
    </div>
  );
}
