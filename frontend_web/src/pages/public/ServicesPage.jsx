import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import AuthModal from "../../components/modals/AuthModal";
import CustomSelect from "../../components/common/CustomSelect";
import { getServices, getCategories } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { extractList } from "../../utils/dataHelper";
import {
  Scissors,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";

export default function PublicServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [loading, setLoading] = useState(true);

  // Modals
  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const role = (user?.role || "").replace("ROLE_", "");
    if (role === "ADMIN") {
      navigate("/admin/services", { replace: true });
    } else if (role === "STAFF") {
      navigate("/staff/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  // Update selectedCategory if URL param changes
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [searchParams]);

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

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    if (catId === "ALL") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: catId });
    }
  };

  const handleBook = (srv) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSelectedService(srv);
    setBookingOpen(true);
  };

  const defaultServiceImages = {
    MALE: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
    FEMALE: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
    UNISEX: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
  };

  const categoryList = extractList(categories);
  const serviceList = extractList(services);

  // Filter logic
  let filteredServices = serviceList.filter((srv) => {
    // Category filter
    if (selectedCategory !== "ALL" && srv.categoryId !== selectedCategory) {
      return false;
    }
    // Gender filter
    if (genderFilter !== "ALL" && srv.gender !== genderFilter) {
      return false;
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = srv.name?.toLowerCase().includes(q);
      const matchDesc = srv.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  // Sorting
  if (sortBy === "PRICE_LOW") {
    filteredServices.sort((a, b) => a.price - b.price);
  } else if (sortBy === "PRICE_HIGH") {
    filteredServices.sort((a, b) => b.price - a.price);
  } else if (sortBy === "DURATION") {
    filteredServices.sort((a, b) => a.durationMinutes - b.durationMinutes);
  }

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO HEADER */}
        <section className="bg-gradient-to-b from-white to-groomish-cream py-10 border-b border-groomish-slate/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-groomish-orangeLight text-groomish-orange text-xs font-bold uppercase tracking-wider mb-3">
              <Scissors className="w-3.5 h-3.5" />
              <span>Full Salon Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-groomish-slate tracking-tight">
              Salon Services & Treatments
            </h1>
            <p className="text-sm sm:text-base text-groomish-slate/60 mt-3 leading-relaxed">
              Explore bespoke haircutting, facial therapies, beard sculpting, and hair wellness. Earn Groomish loyalty points on every confirmed appointment.
            </p>

            {/* Live Search Bar */}
            <div className="mt-6 max-w-md mx-auto relative">
              <Search className="w-4 h-4 text-groomish-slate/40 absolute left-4 top-3.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services (e.g. Keratin, Beard Trim, Facial)..."
                className="input-groomish pl-11 shadow-soft bg-white"
              />
            </div>
          </div>
        </section>

        {/* CONTROLS BAR: CATEGORIES & FILTERS */}
        <section className="bg-white/80 backdrop-blur-md border-b border-groomish-slate/10 sticky top-16 z-30 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Pills (horizontal scrollable) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => handleCategorySelect("ALL")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === "ALL"
                    ? "bg-groomish-orange text-white shadow-glowOrange"
                    : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                }`}
              >
                All Categories
              </button>
              {categoryList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategorySelect(c.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === c.id
                      ? "bg-groomish-orange text-white shadow-glowOrange"
                      : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Gender Filter & Sorting */}
            <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
              {/* Gender selector */}
              <div className="flex bg-groomish-cream p-1 rounded-xl text-xs font-semibold">
                {["ALL", "FEMALE", "MALE", "UNISEX"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      genderFilter === g
                        ? "bg-white text-groomish-slate shadow-sm font-bold"
                        : "text-groomish-slate/60 hover:text-groomish-slate"
                    }`}
                  >
                    {g === "ALL" ? "All" : g === "FEMALE" ? "Women" : g === "MALE" ? "Men" : "Unisex"}
                  </button>
                ))}
              </div>

              {/* Sort by */}
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
        <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-groomish-slate/60 font-medium">Loading salon services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
              <Scissors className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-base text-groomish-slate">
                No Services Found
              </h3>
              <p className="text-xs text-groomish-slate/50 mt-1 mb-4">
                No services matched the selected category, gender, or search criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setGenderFilter("ALL");
                  setSearch("");
                }}
                className="btn-secondary text-xs px-4 py-2"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => {
                const categoryObj = categories.find((c) => c.id === service.categoryId);
                const categoryName = categoryObj ? categoryObj.name : "Salon Service";
                const imgSrc =
                  service.image ||
                  defaultServiceImages[service.gender] ||
                  defaultServiceImages.UNISEX;
                const pointsEarned = Math.floor(service.price / 100);

                return (
                  <div
                    key={service.id}
                    className="card-groomish flex flex-col justify-between overflow-hidden group hover:border-groomish-orange/40 hover:-translate-y-1 transition duration-300"
                  >
                    <div>
                      {/* Thumbnail (Clickable to dedicated service page) */}
                      <div
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="relative h-44 overflow-hidden bg-groomish-slate/10 cursor-pointer"
                      >
                        <img
                          src={imgSrc}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-groomish-slateDark/60 via-transparent to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-groomish-slate backdrop-blur-sm shadow-sm uppercase">
                            {service.gender}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-groomish-orange/90 text-white backdrop-blur-sm shadow-sm">
                            {categoryName}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 text-white flex items-center gap-1 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-groomish-gold" />
                          <span>{service.durationMinutes} mins</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h3
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="font-heading font-bold text-base text-groomish-slate group-hover:text-groomish-orange transition-colors line-clamp-1 cursor-pointer"
                        >
                          {service.name}
                        </h3>

                        <p className="text-xs text-groomish-slate/60 line-clamp-2 leading-relaxed">
                          {service.description || "Signature styling delivered by master salon specialists."}
                        </p>

                        {/* Loyalty Bonus badge */}
                        <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-groomish-orange">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Earn +{pointsEarned} pts with this booking</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Booking Action */}
                    <div className="p-4 pt-0 border-t border-groomish-slate/10 mt-3 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-groomish-slate">
                          ₹{service.price}
                        </div>
                        {service.mrp > service.price && (
                          <div className="text-[11px] text-groomish-slate/40 line-through">
                            ₹{service.mrp}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="btn-secondary text-xs px-2.5 py-2"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleBook(service)}
                          className="btn-primary text-xs px-3.5 py-2 shadow-sm group-hover:shadow-glowOrange"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Booking Flow Modal */}
      <BookingFlowModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        service={selectedService}
      />

      {/* Auth Modal if guest clicks Book */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}
