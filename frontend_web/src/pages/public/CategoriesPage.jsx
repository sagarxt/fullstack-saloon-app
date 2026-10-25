import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getCategories, getServices } from "../../api/public";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { extractList } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import { Layers, ArrowRight, Scissors, Sparkles, Search } from "lucide-react";

export default function PublicCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const role = (user?.role || "").replace("ROLE_", "");
    if (role === "ADMIN") {
      navigate("/admin/categories", { replace: true });
    } else if (role === "STAFF") {
      navigate("/staff/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, srvRes] = await Promise.all([
        getCategories(),
        getServices(),
      ]);
      setCategories(extractList(catRes.data));
      setServices(extractList(srvRes.data));
    } catch (err) {
      console.error(err);
      setCategories([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const defaultCategoryImages = {
    Hair: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
    Beard: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
    Facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
    Spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
    Bridal: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
  };

  const categoryList = extractList(categories);
  const serviceList = extractList(services);

  const filteredCategories = categoryList.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION - COMPACT & CLEAN */}
        <section className="bg-gradient-to-b from-white to-groomish-cream py-4 sm:py-5 border-b border-groomish-slate/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-groomish-orangeLight text-groomish-orange text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
              <Layers className="w-3 h-3" />
              <span>Curated Salon Collections</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-heading font-extrabold text-groomish-slate tracking-tight">
              Explore Salon Categories
            </h1>
            <p className="text-xs text-groomish-slate/60 mt-1 leading-relaxed">
              Discover tailored treatments from master haircuts and beard styling to facials and spas.
            </p>

            {/* Search Box - Compact */}
            <div className="mt-3 max-w-md mx-auto relative">
              <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category by name or service..."
                className="w-full pl-10 pr-4 py-1.5 rounded-full bg-white text-xs text-groomish-slate outline-none border border-groomish-slate/15 focus:border-groomish-orange transition shadow-2xs"
              />
            </div>
          </div>
        </section>

        {/* CATEGORIES GRID */}
        <section className="py-4 sm:py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
              <p className="text-xs text-groomish-slate/60 font-medium">Loading salon categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-groomish-slate/10 p-8 text-center max-w-md mx-auto shadow-soft">
              <Layers className="w-9 h-9 text-groomish-slate/30 mx-auto mb-2.5" />
              <h3 className="font-heading font-bold text-base text-groomish-slate">
                No Categories Found
              </h3>
              <p className="text-xs text-groomish-slate/50 mt-1">
                {search
                  ? `No categories matched your search term "${search}".`
                  : "No salon categories are currently available in the catalog."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredCategories.map((category) => {
                const serviceCount = serviceList.filter((s) => s.categoryId === category.id).length;
                const imgSrc =
                  category.image ||
                  defaultCategoryImages[category.name] ||
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={category.id}
                    className="group bg-white rounded-2xl border border-groomish-slate/10 overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Circular Image Showcase - Compact */}
                      <div
                        onClick={() => navigate(`/category/${category.id}`)}
                        className="relative pt-3 sm:pt-4 pb-2 px-3 bg-gradient-to-b from-groomish-cream/80 to-white flex flex-col items-center justify-center cursor-pointer border-b border-groomish-slate/5"
                      >
                        {/* Service count badge */}
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-groomish-orange border border-groomish-orange/30 shadow-xs">
                          {serviceCount > 0 ? `${serviceCount} Services` : "Curated Care"}
                        </span>

                        {/* Circular Avatar */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white border-2 border-groomish-orange/25 shadow-sm p-0.5 group-hover:border-groomish-orange group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                          <img
                            src={getOptimizedImageUrl(imgSrc, { width: 400 })}
                            alt={category.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>

                        <h3 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate text-center mt-2 group-hover:text-groomish-orange transition-colors">
                          {category.name}
                        </h3>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 sm:p-4 space-y-2">
                        <p className="text-[11px] sm:text-xs text-groomish-slate/70 leading-relaxed line-clamp-2 text-center sm:text-left">
                          {category.description || "Indulge in our signature salon therapies delivered by master stylists using premium products."}
                        </p>

                        {/* Top Services preview */}
                        {serviceCount > 0 && (
                          <div className="pt-1 flex flex-wrap gap-1">
                            {services
                              .filter((s) => s.categoryId === category.id)
                              .slice(0, 3)
                              .map((srv) => (
                                <span
                                  key={srv.id}
                                  onClick={() => navigate(`/services/${srv.id}`)}
                                  className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-groomish-cream text-groomish-slate hover:text-groomish-orange cursor-pointer transition-colors"
                                >
                                  {srv.name}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-3.5 sm:p-4 pt-0 sm:pt-0">
                      <button
                        onClick={() => navigate(`/category/${category.id}`)}
                        className="w-full btn-primary text-[11px] sm:text-xs py-2 sm:py-2.5 flex items-center justify-center gap-1.5 group-hover:shadow-glowOrange"
                      >
                        <span>View {category.name}</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
