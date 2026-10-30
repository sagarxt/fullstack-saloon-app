import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import AuthModal from "../../components/modals/AuthModal";
import CustomSelect from "../../components/common/CustomSelect";
import { getCategories, getServices } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { extractList, getServicePriceRange, getServiceDurationRange, calculateGroomCoins } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import {
  Scissors,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Home,
  Layers,
  ShoppingCart,
  Eye,
} from "lucide-react";

export default function CategoryDetailPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, items } = useCart();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [loading, setLoading] = useState(true);

  // Modals
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categoryId]);

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

  const categoryList = extractList(categories);
  const serviceList = extractList(services);

  // Find active category
  const currentCategory = useMemo(() => {
    return categoryList.find((c) => String(c.id) === String(categoryId)) || null;
  }, [categoryList, categoryId]);

  // Filter services by this category & gender & search
  const categoryServices = useMemo(() => {
    return serviceList.filter((srv) => {
      // Category match
      if (String(srv.categoryId) !== String(categoryId)) return false;

      // Gender match
      if (genderFilter !== "ALL") {
        if (srv.gender && srv.gender !== genderFilter && srv.gender !== "UNISEX") {
          return false;
        }
      }

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = srv.name?.toLowerCase().includes(q);
        const matchDesc = srv.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [services, categoryId, genderFilter, searchTerm]);

  // Sort services
  const sortedServices = useMemo(() => {
    const list = [...categoryServices];
    if (sortBy === "PRICE_LOW") list.sort((a, b) => a.price - b.price);
    if (sortBy === "PRICE_HIGH") list.sort((a, b) => b.price - a.price);
    if (sortBy === "DURATION") list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    return list;
  }, [categoryServices, sortBy]);

  const defaultCategoryImages = {
    Hair: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    Beard: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
    Facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
    Spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
    Bridal: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
  };

  const defaultServiceImages = {
    MALE: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
    FEMALE: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
    UNISEX: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
  };

  const handleAddToCart = async (srv) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    await addItem({
      itemType: "SERVICE",
      serviceId: srv.id,
      name: srv.name,
      quantity: 1,
    });
  };

  const categoryName = currentCategory ? currentCategory.name : "";
  const categoryImage = currentCategory?.image || "";

  if (!loading && !currentCategory) {
    return (
      <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto py-24 px-4 text-center">
          <Layers className="w-12 h-12 text-groomish-slate/30 mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold text-groomish-slate">
            Category Not Found
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-1 mb-6">
            The salon category you requested does not exist or has been removed.
          </p>
          <Link to="/categories" className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2">
            <span>Browse All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-groomish-slate/10 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-groomish-slate/60">
            <Link to="/" className="hover:text-groomish-orange flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <Link to="/categories" className="hover:text-groomish-orange">
              Categories
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <span className="font-bold text-groomish-slate">{categoryName}</span>
          </div>
        </div>

        {/* HERO BANNER - COMPACT */}
        <section className="relative overflow-hidden bg-gradient-to-r from-groomish-slate via-groomish-slateDark to-groomish-slate text-white py-3.5 sm:py-5 border-b border-white/10">
          {/* Subtle ambient blur glow in background */}
          {categoryImage && (
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-groomish-orange/15 blur-3xl pointer-events-none" />
          )}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4.5">
              {/* Compact Circular Category Artwork */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 shadow-md p-0.5 shrink-0 backdrop-blur-md flex items-center justify-center">
                {categoryImage ? (
                  <img
                    src={getOptimizedImageUrl(categoryImage, { width: 250 })}
                    alt={categoryName}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Layers className="w-7 h-7 text-groomish-gold" />
                )}
              </div>

              {/* Category Info */}
              <div className="space-y-1 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-groomish-gold backdrop-blur-md border border-white/15">
                    <Layers className="w-3 h-3" />
                    <span>Dedicated Collection</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-groomish-orange text-white font-bold shadow-2xs text-[10px]">
                    {categoryServices.length} Treatments
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold tracking-tight">
                  {categoryName} Services
                </h1>

                <p className="text-xs text-gray-300 leading-relaxed max-w-2xl line-clamp-2">
                  {currentCategory?.description ||
                    "Indulge in certified salon therapies curated for the highest standard of grooming, styling, and hygiene."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FILTER BAR: GENDER TABS & SEARCH - COMPACT */}
        <section className="bg-white/90 backdrop-blur-md border-b border-groomish-slate/10 sticky top-16 z-30 py-2 shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Gender Filter Tabs (Male / Female / Unisex) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-groomish-slate/60 shrink-0">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span>Gender:</span>
              </span>
              <div className="flex bg-groomish-cream p-0.5 rounded-xl text-xs font-semibold">
                {["ALL", "FEMALE", "MALE", "UNISEX"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-2.5 py-1 rounded-lg transition text-xs ${
                      genderFilter === g
                        ? "bg-groomish-orange text-white shadow-2xs font-bold"
                        : "text-groomish-slate/70 hover:text-groomish-slate"
                    }`}
                  >
                    {g === "ALL" ? "All" : g === "FEMALE" ? "Women" : g === "MALE" ? "Men" : "Unisex"}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search in ${categoryName}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 rounded-full bg-groomish-cream text-groomish-slate text-xs border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                />
              </div>

              <CustomSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.value || e.target.value)}
                options={[
                  { value: "DEFAULT", label: "Recommended" },
                  { value: "PRICE_LOW", label: "Price: Low to High" },
                  { value: "PRICE_HIGH", label: "Price: High to Low" },
                  { value: "DURATION", label: "Duration: Shortest" },
                ]}
                containerClassName="w-48 shrink-0"
              />
            </div>
          </div>
        </section>

        {/* SERVICES GRID */}
        <section className="py-4 sm:py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-14 text-center">
              <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
              <p className="text-xs text-groomish-slate/60 font-medium">Loading treatments...</p>
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-groomish-slate/10 p-8 text-center max-w-md mx-auto shadow-soft">
              <Scissors className="w-9 h-9 text-groomish-slate/30 mx-auto mb-2.5" />
              <h3 className="font-heading font-bold text-base text-groomish-slate">
                No Services Found
              </h3>
              <p className="text-xs text-groomish-slate/50 mt-1 mb-4">
                No treatments match the selected gender or search filter in {categoryName}.
              </p>
              <button
                onClick={() => {
                  setGenderFilter("ALL");
                  setSearchTerm("");
                }}
                className="btn-secondary text-xs px-4 py-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {sortedServices.map((service) => {
                const imgSrc =
                  service.image ||
                  defaultServiceImages[service.gender] ||
                  defaultServiceImages.UNISEX;
                const pointsEarned = calculateGroomCoins(service.price, service.rewards);

                const serviceDiscountPercent = (() => {
                  if (service.subServices && service.subServices.length > 0) {
                    const discounts = service.subServices
                      .filter((s) => s.mrp && s.mrp > s.price)
                      .map((s) => Math.round(((s.mrp - s.price) / s.mrp) * 100));
                    if (discounts.length > 0) {
                      return Math.max(...discounts);
                    }
                  }
                  if (service.mrp && service.mrp > service.price) {
                    return Math.round(((service.mrp - service.price) / service.mrp) * 100);
                  }
                  return 0;
                })();

                return (
                  <div
                    key={service.id}
                    className="card-groomish overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition duration-300"
                  >
                    <div>
                      {/* Image Preview (Clickable to Service Detail) */}
                      <div
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="relative w-full aspect-[4/3] overflow-hidden bg-groomish-slate/10 cursor-pointer"
                      >
                        <img
                          src={getOptimizedImageUrl(imgSrc, { width: 600 })}
                          alt={service.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-groomish-slateDark/60 via-transparent to-transparent" />

                        {/* Gender Chip */}
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-groomish-slate shadow-sm backdrop-blur-sm">
                          {service.gender || "UNISEX"}
                        </span>

                        {/* Discount Chip on Top Right */}
                        {serviceDiscountPercent > 0 && (
                          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-crimson text-white shadow-sm z-10">
                            {serviceDiscountPercent}% OFF
                          </span>
                        )}

                        {/* Duration */}
                        <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-groomish-gold" />
                          <span>
                            {service.subServices && service.subServices.length > 0
                              ? getServiceDurationRange(service)
                              : `${service.durationMinutes} mins`}
                          </span>
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <h3
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="font-heading font-bold text-base text-groomish-slate leading-snug group-hover:text-groomish-orange transition-colors cursor-pointer line-clamp-1"
                        >
                          {service.name}
                        </h3>

                        <p className="text-xs text-groomish-slateLight line-clamp-2 leading-relaxed">
                          {service.description || "Signature styling delivered by certified salon experts."}
                        </p>

                        <div className="pt-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-groomish-goldLight border border-groomish-gold/30 text-groomish-slate text-[10px] font-bold">
                            <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Earn {pointsEarned} Groom Coin{pointsEarned !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="p-4 sm:p-5 pt-3 border-t border-groomish-slate/10 flex items-center justify-between gap-2 mt-auto">
                      <div className="min-w-0 pr-1">
                        <div className="text-base sm:text-[17px] font-extrabold text-groomish-slate leading-tight whitespace-nowrap">
                          {service.subServices && service.subServices.length > 0
                            ? getServicePriceRange(service)
                            : `₹${service.price}`}
                        </div>
                        {(!service.subServices || service.subServices.length === 0) && service.mrp > service.price && (
                          <div className="text-[11px] text-groomish-slateLight line-through">
                            ₹{service.mrp}
                          </div>
                        )}
                      </div>

                      {service.subServices && service.subServices.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Options</span>
                        </button>
                      ) : items?.some(
                        (i) =>
                          (i.itemType === "SERVICE" || !i.itemType) &&
                          (i.serviceId === service.id || i.service?.id === service.id)
                      ) ? (
                        <button
                          type="button"
                          onClick={() => navigate("/cart")}
                          className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 bg-groomish-orangeLight/60 border border-groomish-orange/40 text-groomish-orange hover:bg-groomish-orange hover:text-white transition shadow-2xs font-bold shrink-0 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>View Cart</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(service)}
                          className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add Service</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* EXPLORE OTHER CATEGORIES CAROUSEL */}
        <section className="py-12 bg-white border-t border-groomish-slate/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg text-groomish-slate">
                Explore Other Collections
              </h3>
              <Link
                to="/categories"
                className="text-xs font-bold text-groomish-orange hover:underline flex items-center gap-1"
              >
                <span>All Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {categories
                .filter((c) => String(c.id) !== String(categoryId))
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/category/${cat.id}`)}
                    className="p-3.5 rounded-2xl bg-groomish-cream hover:bg-groomish-orangeLight border border-groomish-slate/10 hover:border-groomish-orange/30 shrink-0 min-w-[160px] text-left transition group"
                  >
                    <span className="font-bold text-xs text-groomish-slate group-hover:text-groomish-orange block">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-groomish-slate/50 mt-0.5 block">
                      Explore options →
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Booking Modal */}
      <BookingFlowModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        service={selectedService}
      />

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}
