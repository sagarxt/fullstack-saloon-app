import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CategoriesSection from "../../components/landing/CategoriesSection";
import ServicesSection from "../../components/landing/ServicesSection";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import AuthModal from "../../components/modals/AuthModal";
import { getServices, getCategories, getPublicHome } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { useStore } from "../../context/StoreContext";
import { extractList } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import {
  Sparkles,
  Award,
  Shield,
  ShieldCheck,
  CalendarCheck,
  Star,
  Zap,
  ArrowRight,
  Gift,
  CheckCircle2,
  Crown,
  Gem,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  Clock,
  Check,
  Image as ImageIcon,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stores, selectedStore, selectStore } = useStore();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingService, setPendingService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Branch hero slider states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const branchImages = (
    Array.isArray(selectedStore?.images) && selectedStore.images.length > 0
      ? selectedStore.images
      : selectedStore?.image
        ? [selectedStore.image]
        : []
  );

  useEffect(() => {
    setCurrentSlide(0);
  }, [selectedStore?.id]);

  useEffect(() => {
    if (branchImages.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % branchImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [branchImages.length, isPaused]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + branchImages.length) % branchImages.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % branchImages.length);
  };

  // Directly open Admin in Admin Panel and Staff in Staff Dashboard
  useEffect(() => {
    const role = (user?.role || "").replace("ROLE_", "");
    if (role === "ADMIN") {
      navigate("/admin/dashboard", { replace: true });
    } else if (role === "STAFF") {
      navigate("/staff/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, srvRes] = await Promise.all([
        getCategories(),
        getServices(),
      ]);

      setCategories(extractList(catRes.data));
      setServices(extractList(srvRes.data));
    } catch (err) {
      console.error("Failed to load landing data", err);
      setCategories([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const { addItem } = useCart();

  const handleBook = async (service) => {
    if (!user) {
      setPendingService(service);
      setAuthOpen(true);
      return;
    }
    const added = await addItem({
      itemType: "SERVICE",
      serviceId: service.id,
      name: service.name,
      quantity: 1,
    });
    if (added) {
      navigate("/cart");
    }
  };

  const handleAuthSuccess = async () => {
    setAuthOpen(false);
    if (pendingService) {
      const added = await addItem({
        itemType: "SERVICE",
        serviceId: pendingService.id,
        name: pendingService.name,
        quantity: 1,
      });
      setPendingService(null);
      if (added) {
        navigate("/cart");
      }
    }
  };

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {/* HERO SECTION */}
        <section className="relative overflow-x-hidden bg-gradient-to-b from-white to-groomish-cream pt-3.5 sm:pt-10 pb-8 sm:pb-16 border-b border-groomish-slate/10 w-full max-w-full">
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full max-w-full min-w-0">
            <div className="grid lg:grid-cols-12 gap-5 lg:gap-12 items-center w-full max-w-full min-w-0">
              {/* Right Column (Branch Photos Slider): On Mobile order-1, on Desktop lg:order-2 */}
              <div className="lg:col-span-6 relative order-1 lg:order-2 w-full max-w-full min-w-0">
                <div className="relative mx-auto w-full max-w-xl min-w-0">
                  {/* Decorative Ambient Glow (hidden on mobile to prevent horizontal viewport bleed) */}
                  <div className="hidden sm:block absolute -inset-4 bg-gradient-to-tr from-groomish-orange/20 via-groomish-gold/20 to-groomish-coral/20 rounded-3xl blur-2xl -z-10 pointer-events-none" />

                  {!selectedStore || branchImages.length === 0 ? (
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-card border border-groomish-slate/10 text-center space-y-4 w-full min-w-0">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-groomish-cream text-groomish-orange flex items-center justify-center mx-auto border border-groomish-slate/10">
                        <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <h3 className="font-heading font-extrabold text-base sm:text-xl text-groomish-slate">
                        {selectedStore ? selectedStore.name : "Welcome to Groomish Now"}
                      </h3>
                      <p className="text-xs sm:text-sm text-groomish-slateLight max-w-md mx-auto leading-relaxed">
                        {selectedStore
                          ? `${selectedStore.address || ""}, ${selectedStore.city || ""}`
                          : "No salon branches are currently available. Salon branch locations and photos will appear here once configured in the system."}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-groomish-slate/70">
                        <span className="px-3 py-1 rounded-full bg-groomish-cream border border-groomish-slate/10">VIP Loyalty Program</span>
                        <span className="px-3 py-1 rounded-full bg-groomish-cream border border-groomish-slate/10">Instant Rewards</span>
                      </div>
                    </div>
                  ) : (
                    /* Main Showcase Container */
                    <div
                      className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-card border border-groomish-slate/10 space-y-2.5 sm:space-y-3 relative group w-full max-w-full min-w-0 overflow-hidden"
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                    >
                    {/* Branch Header Bar */}
                    <div className="flex items-center justify-between px-1 pt-0.5 gap-2 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Branch Logo */}
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-groomish-cream border border-groomish-slate/15 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-sm">
                          {selectedStore?.logo ? (
                            <img
                              src={getOptimizedImageUrl(selectedStore.logo, { width: 120 })}
                              alt={`${selectedStore.name} Logo`}
                              className="w-full h-full object-contain rounded-xl"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <img
                              src="/groomisg_now_icon.png"
                              alt="Groomish Icon"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                            <h3 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate leading-tight truncate">
                              {selectedStore?.name}
                            </h3>
                            {selectedStore?.code && (
                              <span className="font-mono text-[9px] sm:text-[10px] font-extrabold bg-groomish-slate text-white px-1.5 py-0.5 rounded-md shrink-0">
                                {selectedStore.code}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-groomish-slateLight flex items-center gap-1 mt-0.5 min-w-0">
                            <MapPin className="w-3 h-3 text-groomish-orange shrink-0" />
                            <span className="truncate max-w-[190px] xs:max-w-[240px] sm:max-w-[280px]">
                              {selectedStore?.city ? `${selectedStore.city}, ` : ""}{selectedStore?.address || "Salon Lounge"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Main Image Slider Viewport */}
                    <div className="relative w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-groomish-slate/10 shadow-inner group/slider">
                      {branchImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            idx === currentSlide ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                          }`}
                        >
                          <img
                            src={getOptimizedImageUrl(imgUrl, { width: 1200 })}
                            alt={`${selectedStore?.name || "Salon"} Photo ${idx + 1}`}
                            className="w-full h-full object-cover select-none"
                            loading={idx === 0 ? "eager" : "lazy"}
                            decoding="async"
                          />
                        </div>
                      ))}

                      {/* Ambient Top & Bottom Gradients for Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45 z-10 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20 shrink-0">
                            <ImageIcon className="w-3 h-3 text-groomish-gold shrink-0" />
                            <span className="truncate">
                              {branchImages.length > 0 ? `Photo ${currentSlide + 1} of ${branchImages.length}` : "Branch Showcase"}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="bg-white/95 backdrop-blur-md text-groomish-slate text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3 text-groomish-orange shrink-0" />
                            <span>{selectedStore?.openingTime || "09:00 AM"} - {selectedStore?.closingTime || "09:00 PM"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Navigation Chevrons */}
                      {branchImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevSlide}
                            aria-label="Previous Branch Photo"
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-groomish-orange text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md opacity-80 sm:opacity-0 sm:group-hover/slider:opacity-100"
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={nextSlide}
                            aria-label="Next Branch Photo"
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-groomish-orange text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md opacity-80 sm:opacity-0 sm:group-hover/slider:opacity-100"
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </>
                      )}

                      {/* Bottom Slide Info & Indicators */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 z-20 flex items-center justify-between text-white gap-2">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-xs font-bold drop-shadow-sm flex items-center gap-1.5 truncate">
                            <span>{selectedStore?.name}</span>
                          </p>
                          <p className="text-[10px] text-white/85 line-clamp-1 drop-shadow-sm truncate">
                            {selectedStore?.address}
                          </p>
                        </div>

                        {/* Dots Indicator */}
                        {branchImages.length > 1 && (
                          <div className="flex items-center gap-1 shrink-0 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
                            {branchImages.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() => setCurrentSlide(dotIdx)}
                                aria-label={`Go to slide ${dotIdx + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  dotIdx === currentSlide
                                    ? "w-3.5 sm:w-4 bg-groomish-orange"
                                    : "w-1.5 bg-white/50 hover:bg-white"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mini Thumbnails / Photo Strip */}
                    {branchImages.length > 1 && (
                      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 pt-0.5 scrollbar-thin w-full max-w-full">
                        {branchImages.map((imgUrl, thumbIdx) => (
                          <button
                            key={thumbIdx}
                            type="button"
                            onClick={() => setCurrentSlide(thumbIdx)}
                            className={`relative h-10 w-14 sm:h-12 sm:w-20 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                              thumbIdx === currentSlide
                                ? "border-groomish-orange shadow-md scale-102"
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Thumbnail ${thumbIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>

              {/* Left Column: Copy & Actions (On Mobile order-2, on Desktop lg:order-1) */}
              <div className="lg:col-span-6 space-y-3.5 sm:space-y-6 text-center lg:text-left order-2 lg:order-1 w-full max-w-full min-w-0">
                {/* Pill */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-groomish-orangeLight border border-groomish-orange/30 text-groomish-orange text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider shadow-xs max-w-full">
                  <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-groomish-orange fill-groomish-orange shrink-0" />
                  <span className="truncate">Next-Gen Salon Experience & VIP Loyalty</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-groomish-slate tracking-tight leading-[1.14] break-words">
                  Look Sharp. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-groomish-orange via-groomish-coral to-groomish-crimson">
                    Earn Rewards Every Visit.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-base lg:text-lg text-groomish-slateLight max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal break-words px-1 sm:px-0">
                  Reserve certified salon specialists, luxurious grooming therapies, and unlock complimentary upgrades with Groomish Now Groom Coins.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-1 w-full max-w-md mx-auto lg:mx-0">
                  <a
                    href="#services"
                    className="btn-primary text-xs sm:text-base px-5 sm:px-7 py-2.5 sm:py-3.5 shadow-glowOrange w-full sm:w-auto"
                  >
                    <span>Explore Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href="#rewards"
                    className="btn-secondary text-xs sm:text-base px-5 sm:px-6 py-2.5 sm:py-3.5 w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4 text-groomish-orange" />
                    <span>View Loyalty Perks</span>
                  </a>
                </div>

                {/* Trust Badges - Hidden on mobile view */}
                <div className="hidden sm:grid pt-5 sm:pt-6 border-t border-groomish-slate/10 grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-groomish-greenLight text-groomish-green flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-groomish-slate">100% Verified</p>
                      <p className="text-[11px] text-groomish-slateLight">Top Stylists</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-groomish-goldLight text-groomish-goldDark flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 fill-groomish-gold text-groomish-goldDark" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-groomish-slate">4.9 / 5.0</p>
                      <p className="text-[11px] text-groomish-slateLight">Client Rating</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-groomish-blueLight text-groomish-blue flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-groomish-slate">Instant Points</p>
                      <p className="text-[11px] text-groomish-slateLight">On Every Booking</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES SECTION */}
        <CategoriesSection
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => setSelectedCategoryId(id)}
        />

        {/* SERVICES SECTION */}
        <ServicesSection
          services={services}
          selectedCategoryId={selectedCategoryId}
          categories={categories}
          onBook={handleBook}
        />

        {/* VIP LOYALTY PERKS SECTION */}
        <section id="rewards" className="py-8 sm:py-14 bg-white border-t border-groomish-slate/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-groomish-slate">
                  VIP Loyalty &amp; Tier Privileges
                </h2>
                <p className="text-xs sm:text-sm text-groomish-slateLight mt-0.5">
                  Why Join Us: Earn Groom Coins with every cut and treatment
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/customer/rewards")}
                className="text-sm sm:text-base font-bold text-groomish-orange hover:text-groomish-coral transition shrink-0"
              >
                Explore
              </button>
            </div>

            {/* Compact Row-Wise Tier Cards */}
            <div className="space-y-3 sm:space-y-4">
              {/* Silver Tier */}
              <div className="rounded-2xl border border-slate-200/90 bg-[#F4F7FB] p-4 sm:p-5 transition hover:shadow-soft">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Shield className="w-5 h-5 fill-white/20" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-500">Silver Tier</h3>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800">1x Coins</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Earn 1 Groom Coin for every ₹10 spent. Free birthday hair consultation.
                </p>
              </div>

              {/* Gold Tier */}
              <div className="rounded-2xl border border-[#FBEAC4] bg-[#FDF9ED] p-4 sm:p-5 transition hover:shadow-soft">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#E5A93C] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Star className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#C2821E]">Gold Tier</h3>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800">1.5x Coins</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  50% faster coin accumulation. Dedicated master stylist priority slots.
                </p>
              </div>

              {/* Platinum Tier */}
              <div className="rounded-2xl border border-[#CCE0FF] bg-[#F0F5FF] p-4 sm:p-5 transition hover:shadow-soft">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#2563EB]">Platinum Tier</h3>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800">2x Coins</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Double coin earnings, complimentary scalp detox every quarter &amp; zero cancellation fees.
                </p>
              </div>

              {/* Diamond Tier */}
              <div className="rounded-2xl border border-[#FFD9CE] bg-[#FFF5F2] p-4 sm:p-5 transition hover:shadow-soft">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F05A28] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Gem className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#E05020]">Diamond Tier</h3>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800">3x Coins</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Triple coins on all services &amp; retail care, VIP private suite access &amp; personal styling concierge.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* BOOKING MODAL */}
      <BookingFlowModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        service={selectedService}
      />

      {/* AUTH MODAL FOR PROMPTING LOGIN / REGISTER */}
      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingService(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
