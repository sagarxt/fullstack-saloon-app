import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { extractList } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";

export default function CategoriesSection({
  categories = [],
}) {
  const navigate = useNavigate();

  const categoryList = extractList(categories);
  // Show only 2 lines on home page (5 items per row on md screens = 10 items max)
  const displayedCategories = categoryList.slice(0, 9);

  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-groomish-coralLight text-groomish-coral mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Specialties
          </span>
          <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-groomish-slate tracking-tight">
            Browse by Category
          </h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-groomish-slateLight max-w-xl">
            Click any salon category to view its dedicated treatment menu, pricing, and certified stylists.
          </p>
        </div>

        <button
          onClick={() => navigate("/categories")}
          className="btn-secondary text-xs px-4 py-2 sm:py-2.5 self-start md:self-auto flex items-center gap-1.5"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-3.5 h-3.5 text-groomish-orange" />
        </button>
      </div>

      {/* Grid or Empty State */}
      {displayedCategories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 sm:p-10 text-center max-w-md mx-auto shadow-soft">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-groomish-slate/30 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-groomish-slate">
            No Categories Available
          </h3>
          <p className="text-xs text-groomish-slate/50 mt-1">
            Salon treatment collections will appear here once published by salon administration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
          {/* All option */}
          <div
            onClick={() => navigate("/services")}
            className="cursor-pointer p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center border border-groomish-slate/10 bg-white text-groomish-slate hover:border-groomish-orange/40 hover:shadow-soft transition-all duration-300 flex flex-col items-center justify-center group"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-2 sm:mb-3 flex items-center justify-center bg-groomish-cream text-groomish-orange border-2 border-groomish-orange/20 shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:border-groomish-orange group-hover:shadow-soft">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <p className="font-bold text-xs sm:text-sm">All Services</p>
            <span className="text-[10px] sm:text-[11px] text-groomish-slate/50 mt-0.5">Explore full menu →</span>
          </div>

          {displayedCategories.map((cat) => {
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/category/${cat.id}`)}
                className="cursor-pointer p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-center border border-groomish-slate/10 bg-white text-groomish-slate hover:border-groomish-orange hover:shadow-card transition-all duration-300 flex flex-col items-center justify-center group hover:-translate-y-1"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-2 sm:mb-3 flex items-center justify-center overflow-hidden bg-groomish-cream border-2 border-groomish-orange/20 shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:border-groomish-orange group-hover:shadow-soft p-0.5">
                  {cat.image ? (
                    <img
                      src={getOptimizedImageUrl(cat.image, { width: 300 })}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Sparkles className="w-8 h-8 text-groomish-orange" />
                  )}
                </div>
                <p className="font-bold text-sm leading-snug line-clamp-1 group-hover:text-groomish-orange transition-colors">
                  {cat.name}
                </p>
                <span className="text-[11px] text-groomish-slate/50 mt-0.5 group-hover:text-groomish-orange flex items-center gap-0.5">
                  <span>View Page</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
