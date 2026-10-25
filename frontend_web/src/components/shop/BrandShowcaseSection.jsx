import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Award,
} from "lucide-react";
import { getOptimizedImageUrl } from "../../utils/imageHelper";

export default function BrandShowcaseSection({
  brands = [],
  selectedBrand = "ALL",
  onSelectBrand,
  totalProductsCount = 0,
}) {
  const [page, setPage] = useState(1);
  const BRANDS_PER_PAGE = 8;

  const totalPages = Math.max(1, Math.ceil(brands.length / BRANDS_PER_PAGE));
  const currentBrands = brands.slice(
    (page - 1) * BRANDS_PER_PAGE,
    page * BRANDS_PER_PAGE
  );

  const handlePrev = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl p-3 sm:p-4 border border-groomish-slate/10 shadow-soft space-y-3">
      {/* Header Bar - Compact */}
      <div className="flex items-center justify-between gap-3 border-b border-groomish-slate/10 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0">
            <Award className="w-3.5 h-3.5 text-groomish-orange" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-heading font-extrabold text-groomish-slate truncate">
              Shop by Certified Salon Brands
            </h2>
          </div>
        </div>

        {/* Brands Carousel Pagination Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectBrand("ALL")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
              selectedBrand === "ALL"
                ? "bg-groomish-slate text-white shadow-xs"
                : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
            }`}
          >
            All Brands ({totalProductsCount})
          </button>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 pl-2 border-l border-groomish-slate/15">
              <button
                type="button"
                onClick={handlePrev}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg border border-groomish-slate/15 bg-white text-groomish-slate flex items-center justify-center hover:bg-groomish-cream transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="Previous brands"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-groomish-slate/70 px-1 font-mono">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={page === totalPages}
                className="w-7 h-7 rounded-lg border border-groomish-slate/15 bg-white text-groomish-slate flex items-center justify-center hover:bg-groomish-cream transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="Next brands"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Brand Cards Grid - Compact logo frames */}
      <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {currentBrands.map((b) => {
          const isSelected =
            selectedBrand !== "ALL" &&
            selectedBrand.toLowerCase() === b.name.toLowerCase();

          return (
            <div
              key={b.name}
              onClick={() => onSelectBrand(isSelected ? "ALL" : b.name)}
              title={b.name}
              className={`group cursor-pointer rounded-xl p-2 border transition-all duration-200 relative flex flex-col items-center text-center justify-center ${
                isSelected
                  ? "bg-groomish-orangeLight/40 border-groomish-orange ring-2 ring-groomish-orange/30 shadow-card -translate-y-0.5"
                  : "bg-white border-groomish-slate/10 hover:border-groomish-orange/50 hover:shadow-soft hover:-translate-y-0.5"
              }`}
            >
              {/* Selected Tick Indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-groomish-orange text-white flex items-center justify-center shadow-xs">
                  <Check className="w-2 h-2 stroke-[3]" />
                </div>
              )}

              {/* Brand Logo / Monogram Frame */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-groomish-slate/15 p-1.5 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                {b.logo ? (
                  <img
                    src={getOptimizedImageUrl(b.logo, { width: 100 })}
                    alt={`${b.name} Logo`}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center font-heading font-extrabold text-xs text-white ${
                    b.logo ? "hidden" : ""
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${b.accentColor || "#F36A22"}, #1E293B)`,
                  }}
                >
                  {b.initials}
                </div>
              </div>

              {/* Brand Name */}
              <span className="font-heading font-bold text-[10px] sm:text-[11px] text-groomish-slate truncate w-full mt-1.5 group-hover:text-groomish-orange transition-colors">
                {b.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Brand Details Callout Banner */}
      {selectedBrand !== "ALL" && (
        <div className="bg-groomish-orangeLight/50 border border-groomish-orange/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-groomish-orange text-white flex items-center justify-center font-heading font-extrabold shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-groomish-slate">
                Browsing Authentic <span className="text-groomish-orange font-extrabold">{selectedBrand}</span> Products
              </p>
              <p className="text-[11px] text-groomish-slate/60">
                100% Genuine batch guaranteed with direct in-store pickup across salon branches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectBrand("ALL")}
            className="text-xs font-bold text-groomish-orange hover:text-groomish-crimson underline self-start sm:self-center"
          >
            Clear Brand Filter (Show All Brands)
          </button>
        </div>
      )}
    </section>
  );
}
