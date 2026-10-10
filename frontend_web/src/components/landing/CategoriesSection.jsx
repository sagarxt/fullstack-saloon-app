import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { extractList } from "../../utils/dataHelper";

export default function CategoriesSection({
  categories = [],
}) {
  const navigate = useNavigate();

  const categoryList = extractList(categories);
  // Show only 2 lines on home page (5 items per row on md screens = 10 items max)
  const displayedCategories = categoryList.slice(0, 9);

  return (
    <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-groomish-coralLight text-groomish-coral mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Specialties
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-groomish-slate tracking-tight">
            Browse by Category
          </h2>
          <p className="mt-2 text-sm text-groomish-slateLight max-w-xl">
            Click any salon category to view its dedicated treatment menu, pricing, and certified stylists.
          </p>
        </div>

        <button
          onClick={() => navigate("/categories")}
          className="btn-secondary text-xs px-4 py-2.5 self-start md:self-auto flex items-center gap-1.5"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-3.5 h-3.5 text-groomish-orange" />
        </button>
      </div>

      {/* Grid: Exactly 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {/* All option */}
        <div
          onClick={() => navigate("/services")}
          className="cursor-pointer p-4 rounded-2xl text-center border border-groomish-slate/10 bg-white text-groomish-slate hover:border-groomish-orange/40 hover:shadow-soft transition-all duration-300 flex flex-col items-center justify-center group"
        >
          <div className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center bg-groomish-cream text-groomish-orange transition-transform duration-300 group-hover:scale-110">
            <Sparkles className="w-7 h-7" />
          </div>
          <p className="font-bold text-sm">All Services</p>
          <span className="text-[11px] text-groomish-slate/50 mt-0.5">Explore full menu →</span>
        </div>

        {displayedCategories.map((cat) => {
          return (
            <div
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="cursor-pointer p-4 rounded-2xl text-center border border-groomish-slate/10 bg-white text-groomish-slate hover:border-groomish-orange hover:shadow-card transition-all duration-300 flex flex-col items-center justify-center group hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center overflow-hidden bg-groomish-cream transition-transform duration-300 group-hover:scale-110">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-6 h-6 text-groomish-orange" />
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
    </section>
  );
}
