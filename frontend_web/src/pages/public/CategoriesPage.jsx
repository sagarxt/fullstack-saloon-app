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
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-white to-groomish-cream py-12 border-b border-groomish-slate/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-groomish-orangeLight text-groomish-orange text-xs font-bold uppercase tracking-wider mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>Curated Salon Collections</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-groomish-slate tracking-tight">
              Explore Salon Categories
            </h1>
            <p className="text-sm sm:text-base text-groomish-slate/60 mt-3 leading-relaxed">
              Discover tailored treatments from master haircuts and bespoke beard styling to restorative facials, soothing spas, and luxury bridal packages.
            </p>

            {/* Search Box */}
            <div className="mt-6 max-w-md mx-auto relative">
              <Search className="w-4 h-4 text-groomish-slate/40 absolute left-4 top-3.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category by name or service..."
                className="input-groomish pl-11 shadow-soft bg-white"
              />
            </div>
          </div>
        </section>

        {/* CATEGORIES GRID */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-groomish-slate/60 font-medium">Loading salon categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
              <Layers className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredCategories.map((category) => {
                const serviceCount = serviceList.filter((s) => s.categoryId === category.id).length;
                const imgSrc =
                  category.image ||
                  defaultCategoryImages[category.name] ||
                  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={category.id}
                    className="group bg-white rounded-3xl border border-groomish-slate/10 overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Circular Image Showcase */}
                      <div
                        onClick={() => navigate(`/category/${category.id}`)}
                        className="relative pt-8 pb-4 px-6 bg-gradient-to-b from-groomish-cream/80 to-white flex flex-col items-center justify-center cursor-pointer border-b border-groomish-slate/5"
                      >
                        {/* Service count badge */}
                        <span className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full bg-white text-groomish-orange border border-groomish-orange/30 shadow-xs">
                          {serviceCount > 0 ? `${serviceCount} Services` : "Curated Care"}
                        </span>

                        {/* Circular Avatar */}
                        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-white border-4 border-groomish-orange/25 shadow-md p-1 group-hover:border-groomish-orange group-hover:scale-105 group-hover:shadow-card transition-all duration-300 flex items-center justify-center">
                          <img
                            src={getOptimizedImageUrl(imgSrc, { width: 400 })}
                            alt={category.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>

                        <h3 className="font-heading font-extrabold text-xl text-groomish-slate text-center mt-4 group-hover:text-groomish-orange transition-colors">
                          {category.name}
                        </h3>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-3">
                        <p className="text-xs text-groomish-slate/70 leading-relaxed line-clamp-3 text-center sm:text-left">
                          {category.description || "Indulge in our signature salon therapies delivered by master stylists using premium products."}
                        </p>

                        {/* Top Services preview */}
                        {serviceCount > 0 && (
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {services
                              .filter((s) => s.categoryId === category.id)
                              .slice(0, 3)
                              .map((srv) => (
                                <span
                                  key={srv.id}
                                  onClick={() => navigate(`/services/${srv.id}`)}
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-groomish-cream text-groomish-slate hover:text-groomish-orange cursor-pointer transition-colors"
                                >
                                  {srv.name}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-6 pt-0">
                      <button
                        onClick={() => navigate(`/category/${category.id}`)}
                        className="w-full btn-primary text-xs py-3 flex items-center justify-center gap-2 group-hover:shadow-glowOrange"
                      >
                        <span>View {category.name} Services</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
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
