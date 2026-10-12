import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange,
  itemName = "items",
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-groomish-slate/10 text-xs ${className}`}
    >
      {/* Item Range Summary */}
      <div className="text-groomish-slate/60 font-medium">
        Showing <span className="font-bold text-groomish-slate">{startItem}</span> to{" "}
        <span className="font-bold text-groomish-slate">{endItem}</span> of{" "}
        <span className="font-bold text-groomish-slate">{totalItems}</span> {itemName}
        <span className="ml-2 text-[10px] bg-groomish-slate/5 text-groomish-slate/50 px-2 py-0.5 rounded-full font-mono">
          {pageSize} / page
        </span>
      </div>

      {/* Page Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 select-none">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
              currentPage === 1
                ? "border-groomish-slate/10 text-groomish-slate/30 cursor-not-allowed bg-groomish-cream/40"
                : "border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream hover:border-groomish-orange/40 bg-white shadow-xs"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-groomish-slate/40 text-xs font-bold"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => onPageChange(p)}
                  className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                    currentPage === p
                      ? "bg-groomish-orange text-white shadow-sm ring-2 ring-groomish-orange/30"
                      : "bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream hover:border-groomish-orange/30"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
              currentPage === totalPages
                ? "border-groomish-slate/10 text-groomish-slate/30 cursor-not-allowed bg-groomish-cream/40"
                : "border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream hover:border-groomish-orange/40 bg-white shadow-xs"
            }`}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
