import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X, Layers, Sparkles } from "lucide-react";

export default function CustomMultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = "🌐 All Categories (Applicable to all)",
  searchPlaceholder = "Search categories...",
  name = "",
  className = "",
  containerClassName = "",
  disabled = false,
  maxTags = 2,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? opt.name ?? "",
        label: opt.label ?? opt.name ?? String(opt.value ?? ""),
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedValues = Array.isArray(value) ? value : [];

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
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const toggleOption = (optValue) => {
    if (!onChange) return;
    const exists = selectedValues.some((v) => String(v).toLowerCase() === String(optValue).toLowerCase());
    let next;
    if (exists) {
      next = selectedValues.filter((v) => String(v).toLowerCase() !== String(optValue).toLowerCase());
    } else {
      next = [...selectedValues, optValue];
    }
    onChange(next);
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (!onChange) return;
    onChange(normalizedOptions.map((o) => o.value));
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    if (!onChange) return;
    onChange([]);
  };

  const removeSingle = (e, valToRemove) => {
    e.stopPropagation();
    if (!onChange) return;
    onChange(selectedValues.filter((v) => String(v).toLowerCase() !== String(valToRemove).toLowerCase()));
  };

  // Filter options by search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return opt.label.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className={`relative select-none ${containerClassName || "w-full"}`}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs transition-all duration-200 cursor-pointer ${
          open
            ? "ring-2 ring-groomish-orange/40 border-groomish-orange shadow-soft"
            : "hover:border-groomish-slate/30"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-groomish-cream/40" : ""} ${className}`}
      >
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 overflow-hidden">
          {selectedValues.length === 0 ? (
            <div className="flex items-center gap-1.5 text-groomish-green font-semibold">
              <span className="w-2 h-2 rounded-full bg-groomish-green animate-pulse" />
              <span className="truncate">{placeholder}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedValues.slice(0, maxTags).map((val) => {
                const opt = normalizedOptions.find((o) => String(o.value).toLowerCase() === String(val).toLowerCase());
                const label = opt ? opt.label : val;
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-groomish-orangeLight text-groomish-orange font-bold text-[11px] border border-groomish-orange/20 animate-fade-in"
                  >
                    <span className="truncate max-w-[110px]">{label}</span>
                    <button
                      type="button"
                      onClick={(e) => removeSingle(e, val)}
                      className="hover:text-groomish-crimson transition shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {selectedValues.length > maxTags && (
                <span className="px-2 py-0.5 rounded-lg bg-groomish-cream text-groomish-slate font-extrabold text-[10px] border border-groomish-slate/15">
                  +{selectedValues.length - maxTags} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              title="Reset to All Categories"
              className="p-1 rounded-full text-groomish-slate/40 hover:text-groomish-crimson transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-groomish-slate/50 transition-transform duration-200 ${
              open ? "rotate-180 text-groomish-orange !text-groomish-orange" : ""
            }`}
          />
        </div>
      </div>

      {/* Floating Menu */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-groomish-slate/15 shadow-2xl overflow-hidden animate-fade-in">
          {/* Header & Quick Action Buttons */}
          <div className="p-2.5 border-b border-groomish-slate/10 bg-groomish-cream/40 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/60 flex items-center gap-1">
              <Layers className="w-3 h-3 text-groomish-orange" />
              Eligible Categories ({selectedValues.length}/{normalizedOptions.length})
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-groomish-orange font-bold hover:underline px-1 py-0.5"
              >
                Select All
              </button>
              <span className="text-groomish-slate/30">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-groomish-slate/60 font-semibold hover:text-groomish-crimson px-1 py-0.5"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Search Input */}
          {normalizedOptions.length > 4 && (
            <div className="p-2 border-b border-groomish-slate/10 bg-white">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-groomish-cream/50 border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
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
                    }}
                    className="text-groomish-slate/40 hover:text-groomish-slate"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Checklist */}
          <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-groomish-slate/5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-groomish-slate/50">
                No matching categories found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.some(
                  (v) => String(v).toLowerCase() === String(opt.value).toLowerCase()
                );
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isSelected
                        ? "bg-groomish-orangeLight/60 text-groomish-slate font-bold"
                        : "hover:bg-groomish-cream/60 text-groomish-slate/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                          isSelected
                            ? "bg-groomish-orange border-groomish-orange text-white"
                            : "border-groomish-slate/30 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{opt.label}</span>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-bold text-groomish-orange uppercase tracking-wider">
                        Included
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note & Done */}
          <div className="p-2.5 border-t border-groomish-slate/10 bg-groomish-cream/40 flex items-center justify-between gap-2">
            <span className="text-[10px] text-groomish-slate/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-groomish-gold shrink-0" />
              {selectedValues.length === 0
                ? "Applicable to all categories"
                : `${selectedValues.length} category restriction active`}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearchQuery("");
              }}
              className="px-3 py-1 bg-groomish-slate text-white text-xs font-bold rounded-lg hover:bg-groomish-slate/90 transition shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
