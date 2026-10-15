import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import AuthModal from "../../components/modals/AuthModal";
import CustomSelect from "../../components/common/CustomSelect";
import Pagination from "../../components/common/Pagination";
import { getServices, getCategories } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import { extractList } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import {
  Scissors,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  Star,
  ShoppingCart,
} from "lucide-react";

export default function PublicServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { calculateCoins } = useGroomCoin();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("DEFAULT");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, genderFilter, search, sortBy]);

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

  const [selectedSubServiceByServiceId, setSelectedSubServiceByServiceId] = useState({});

  const handleSelectSubService = (serviceId, sub) => {
    setSelectedSubServiceByServiceId((prev) => ({
      ...prev,
      [serviceId]: sub,
    }));
  };

  const handleAddToCart = async (srv) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const hasSub = srv.subServices && srv.subServices.length > 0;
    const chosenSub = selectedSubServiceByServiceId[srv.id] || (hasSub ? srv.subServices[0] : null);

    await addItem({
      itemType: "SERVICE",
      serviceId: srv.id,
      name: srv.name,
      subServiceName: chosenSub ? chosenSub.name : null,
      subServicePrice: chosenSub ? chosenSub.price : srv.price,
      subServiceDuration: chosenSub ? chosenSub.durationMinutes : srv.durationMinutes,
      quantity: 1,
    });
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
              Explore bespoke haircutting, facial therapies, beard sculpting, and hair wellness. Earn Groom Coins on every confirmed appointment.
            </p>

            {/* Live Search Bar */}
            <div className="mt-6 max-w-md mx-auto relative">
              <Search className="w-4 h-4 text-groomish-slate/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 justify-between sm:justify-end w-full md:w-auto">
              {/* Gender selector */}
              <div className="flex bg-groomish-cream p-1 rounded-xl text-xs font-semibold shrink-0">
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
                containerClassName="flex-1 sm:w-44 sm:flex-none min-w-[130px]"
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
                {serviceList.length === 0
                  ? "No salon services have been created in the catalog yet."
                  : "No services matched the selected category, gender, or search criteria."}
              </p>
              {serviceList.length > 0 && (
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
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices
                .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                .map((service) => {
                const categoryObj = categories.find((c) => c.id === service.categoryId);
                const categoryName = categoryObj ? categoryObj.name : "Salon Service";
                const imgSrc =
                  service.image ||
                  defaultServiceImages[service.gender] ||
                  defaultServiceImages.UNISEX;

                const hasSubServices = service.subServices && service.subServices.length > 0;
                const activeSub =
                  selectedSubServiceByServiceId[service.id] || (hasSubServices ? service.subServices[0] : null);
                const displayPrice = activeSub ? activeSub.price : service.price;
                const displayDuration = activeSub ? activeSub.durationMinutes : service.durationMinutes;
                const coinsEarned = calculateCoins(displayPrice, service.rewards);

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
                          src={getOptimizedImageUrl(imgSrc, { width: 600 })}
                          alt={service.name}
                          loading="lazy"
                          decoding="async"
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
                          <span>{displayDuration} mins</span>
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

                        {/* Sub-Service Toggle Options */}
                        {hasSubServices && (
                          <div className="pt-2 border-t border-groomish-slate/10 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-groomish-slate/60">Choose Option:</span>
                              <span className="font-extrabold text-groomish-orange">{activeSub?.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                              {service.subServices.map((sub, sIdx) => {
                                const isSelected =
                                  activeSub &&
                                  (activeSub.id ? activeSub.id === sub.id : activeSub.name === sub.name);
                                return (
                                  <button
                                    key={sub.id || sIdx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectSubService(service.id, sub);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 border ${
                                      isSelected
                                        ? "bg-groomish-orange text-white border-groomish-orange shadow-xs scale-102"
                                        : "bg-white text-groomish-slate border-groomish-slate/15 hover:border-groomish-orange/40 hover:bg-groomish-cream"
                                    }`}
                                  >
                                    <span>{sub.name}</span>
                                    <span
                                      className={
                                        isSelected ? "text-white/80 text-[10px]" : "text-groomish-slate/50 text-[10px]"
                                      }
                                    >
                                      ₹{sub.price}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Highlighted Extra Coin Section if service has rewards */}
                        {service.rewards > 0 && (
                          <div className="mt-2 p-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/10 border border-amber-300/70 text-amber-900 flex items-center gap-2 shadow-xs">
                            <GroomCoinIcon className="w-4 h-4 shrink-0" />
                            <span className="text-[11px] font-extrabold leading-tight">
                              Special Perk: +{service.rewards} Extra Groom Coins received!
                            </span>
                          </div>
                        )}

                        {/* Groom Coins reward badge */}
                        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-groomish-slate">
                          <GroomCoinIcon className="w-3.5 h-3.5" />
                          <span>Earn +{coinsEarned} Groom Coins</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Booking Action */}
                    <div className="p-4 pt-0 border-t border-groomish-slate/10 mt-3 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-groomish-slate">
                          ₹{displayPrice}
                        </div>
                        {service.mrp > displayPrice && (
                          <div className="text-[11px] text-groomish-slate/40 line-through">
                            ₹{service.mrp}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(service)}
                        className="btn-primary text-xs px-3.5 py-2 shadow-sm group-hover:shadow-glowOrange flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add Service</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredServices.length > 0 && (
              <div className="mt-8 bg-white p-4 rounded-2xl border border-groomish-slate/10 shadow-soft">
                <Pagination
                  currentPage={page}
                  totalItems={filteredServices.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemName="services"
                />
              </div>
            )}
          </>
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
