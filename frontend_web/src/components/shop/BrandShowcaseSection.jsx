import { useState } from "react";
import {
  ShieldCheck,
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
  const BRANDS_PER_PAGE = 4;

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
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-groomish-slate/10 shadow-soft space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-groomish-slate/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
            <Award className="w-4 h-4 text-groomish-orange" />
            <span>Brand Hierarchy & Authenticity Guarantee</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-groomish-slate">
            Shop by Certified Salon Brands
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Every product is sourced directly from authorized salon distributors with batch authentication.
          </p>
        </div>

        {/* Brands Carousel Pagination Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onSelectBrand("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedBrand === "ALL"
                ? "bg-groomish-slate text-white shadow-xs"
                : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
            }`}
          >
            All Brands ({totalProductsCount})
          </button>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-groomish-slate/15">
              <button
                type="button"
                onClick={handlePrev}
                disabled={page === 1}
                className="w-8 h-8 rounded-xl border border-groomish-slate/15 bg-white text-groomish-slate flex items-center justify-center hover:bg-groomish-cream transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="Previous brands"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-groomish-slate/70 px-1 font-mono">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-xl border border-groomish-slate/15 bg-white text-groomish-slate flex items-center justify-center hover:bg-groomish-cream transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                title="Next brands"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentBrands.map((b) => {
          const isSelected =
            selectedBrand !== "ALL" &&
            selectedBrand.toLowerCase() === b.name.toLowerCase();

          return (
            <div
              key={b.name}
              onClick={() => onSelectBrand(isSelected ? "ALL" : b.name)}
              className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-300 relative flex flex-col items-center text-center justify-between ${
                isSelected
                  ? "bg-groomish-orangeLight/40 border-groomish-orange ring-2 ring-groomish-orange/20 shadow-card -translate-y-0.5"
                  : "bg-white border-groomish-slate/10 hover:border-groomish-orange/40 hover:shadow-soft"
              }`}
            >
              {/* Selected Tick Indicator */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-groomish-orange text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Brand Logo / Monogram Frame */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-groomish-slate/15 p-2 flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                {b.logo ? (
                  <img
                    src={getOptimizedImageUrl(b.logo, { width: 160 })}
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
                  className={`w-full h-full rounded-xl flex items-center justify-center font-heading font-extrabold text-lg sm:text-xl text-white ${
                    b.logo ? "hidden" : ""
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${b.accentColor || "#F36A22"}, #1E293B)`,
                  }}
                >
                  {b.initials}
                </div>
              </div>

              {/* Brand Details */}
              <div className="space-y-1 w-full">
                <h3 className="font-heading font-extrabold text-sm text-groomish-slate truncate group-hover:text-groomish-orange transition-colors">
                  {b.name}
                </h3>
                <p className="text-[10px] text-groomish-slate/60 truncate">
                  {b.tagline || "Salon Formulated"}
                </p>
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] font-bold text-groomish-green">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>Authorized • {b.productCount || 0} items</span>
                </div>
              </div>
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
