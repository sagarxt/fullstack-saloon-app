import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CategoriesSection from "../../components/landing/CategoriesSection";
import ServicesSection from "../../components/landing/ServicesSection";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import { getServices, getCategories, getPublicHome } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { useStore } from "../../context/StoreContext";
import { extractList } from "../../utils/dataHelper";
import {
  Sparkles,
  Award,
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
  const { stores, selectedStore, setSelectedStore } = useStore();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Branch hero slider states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [branchSelectorOpen, setBranchSelectorOpen] = useState(false);

  const fallbackImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=80",
  ];

  const branchImages = (
    Array.isArray(selectedStore?.images) && selectedStore.images.length > 0
      ? selectedStore.images
      : selectedStore?.image
        ? [selectedStore.image]
        : fallbackImages
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
      setSelectedService(service);
      setBookingOpen(true);
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

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-groomish-cream pt-12 pb-24 border-b border-groomish-slate/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Copy & Actions */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                {/* Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-groomish-orangeLight border border-groomish-orange/30 text-groomish-orange text-xs font-bold uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-groomish-orange fill-groomish-orange" />
                  <span>Next-Gen Salon Experience & VIP Loyalty</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-groomish-slate tracking-tight leading-[1.12]">
                  Look Sharp. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-groomish-orange via-groomish-coral to-groomish-crimson">
                    Earn Rewards Every Visit.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-groomish-slateLight max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Reserve certified salon specialists, luxurious grooming therapies, and unlock complimentary upgrades with Groomish Now loyalty points.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <a
                    href="#services"
                    className="btn-primary text-sm sm:text-base px-7 py-3.5 shadow-glowOrange w-full sm:w-auto"
                  >
                    <span>Explore Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href="#rewards"
                    className="btn-secondary text-sm sm:text-base px-6 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4 text-groomish-orange" />
                    <span>View Loyalty Perks</span>
                  </a>
                </div>

                {/* Trust Badges */}
                <div className="pt-6 border-t border-groomish-slate/10 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
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

              {/* Right Column: Interactive Branch Experience & Photos Slider */}
              <div className="lg:col-span-6 relative">
                <div className="relative mx-auto w-full max-w-xl">
                  {/* Decorative Ambient Glow */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-groomish-orange/20 via-groomish-gold/20 to-groomish-coral/20 rounded-3xl blur-2xl -z-10" />

                  {/* Main Showcase Container */}
                  <div
                    className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-card border border-groomish-slate/10 space-y-3 relative group"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                  >
                    {/* Branch Header Bar */}
                    <div className="flex items-center justify-between px-1.5 pt-0.5">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Branch Logo */}
                        <div className="w-11 h-11 rounded-2xl bg-groomish-cream border border-groomish-slate/15 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-sm">
                          {selectedStore?.logo ? (
                            <img
                              src={selectedStore.logo}
                              alt={`${selectedStore.name} Logo`}
                              className="w-full h-full object-contain rounded-xl"
                            />
                          ) : (
                            <img
                              src="/groomisg_now_icon.png"
                              alt="Groomish Icon"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <h3 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate leading-tight line-clamp-1">
                              {selectedStore?.name || "Ambika Groomish Salon"}
                            </h3>
                            {selectedStore?.code && (
                              <span className="font-mono text-[10px] font-extrabold bg-groomish-slate text-white px-1.5 py-0.5 rounded-md shrink-0">
                                {selectedStore.code}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-groomish-slateLight flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-groomish-orange shrink-0" />
                            <span className="truncate max-w-[190px] sm:max-w-[260px]">
                              {selectedStore?.city || "Bangalore"}, {selectedStore?.address || "Flagship Salon Lounge"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Proximity / Branch Selector Quick Pill */}
                      <div className="relative shrink-0">
                        {stores.length > 1 ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => setBranchSelectorOpen((v) => !v)}
                              className="text-[11px] font-bold text-groomish-orange bg-groomish-orangeLight border border-groomish-orange/30 px-2.5 py-1 rounded-xl hover:bg-groomish-orange hover:text-white transition flex items-center gap-1"
                            >
                              <span>Change Branch</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {branchSelectorOpen && (
                              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-groomish-slate/10 p-2 z-30 animate-in fade-in zoom-in-95">
                                <p className="text-[10px] font-bold text-groomish-slateLight uppercase px-2 py-1">
                                  Select Salon Branch
                                </p>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {stores.map((s) => (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedStore(s);
                                        localStorage.setItem("groomish_selected_store_id", s.id);
                                        setBranchSelectorOpen(false);
                                      }}
                                      className={`w-full text-left px-2 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                                        selectedStore?.id === s.id
                                          ? "bg-groomish-orange text-white font-bold"
                                          : "hover:bg-groomish-cream text-groomish-slate"
                                      }`}
                                    >
                                      <span className="truncate">{s.name}</span>
                                      {selectedStore?.id === s.id && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-groomish-green bg-groomish-greenLight px-2.5 py-1 rounded-xl">
                            <span className="w-2 h-2 rounded-full bg-groomish-green animate-pulse" />
                            <span>Active Branch</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Main Image Slider Viewport */}
                    <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-groomish-slate/10 shadow-inner group/slider">
                      {branchImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            idx === currentSlide ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${selectedStore?.name || "Salon"} Photo ${idx + 1}`}
                            className="w-full h-full object-cover select-none"
                            loading={idx === 0 ? "eager" : "lazy"}
                          />
                        </div>
                      ))}

                      {/* Ambient Top & Bottom Gradients for Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45 z-10 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-2">
                          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                            <ImageIcon className="w-3 h-3 text-groomish-gold" />
                            <span>
                              {branchImages.length > 0 ? `Photo ${currentSlide + 1} of ${branchImages.length}` : "Branch Showcase"}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="bg-white/90 backdrop-blur-md text-groomish-slate text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3 text-groomish-orange" />
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
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-groomish-orange text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md opacity-80 sm:opacity-0 sm:group-hover/slider:opacity-100"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={nextSlide}
                            aria-label="Next Branch Photo"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-groomish-orange text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md opacity-80 sm:opacity-0 sm:group-hover/slider:opacity-100"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Bottom Slide Info & Indicators */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-white">
                        <div className="space-y-0.5 max-w-[70%]">
                          <p className="text-xs font-bold drop-shadow-sm flex items-center gap-1.5">
                            <span>{selectedStore?.name || "Ambika Groomish Salon"}</span>
                            <span className="text-[10px] text-groomish-gold font-normal">★ 4.9</span>
                          </p>
                          <p className="text-[10px] text-white/85 line-clamp-1 drop-shadow-sm">
                            {selectedStore?.address || "Modern styling stations, private wash zones & luxury lounge"}
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
                                    ? "w-4 bg-groomish-orange"
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
                      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5 scrollbar-thin">
                        {branchImages.map((imgUrl, thumbIdx) => (
                          <button
                            key={thumbIdx}
                            type="button"
                            onClick={() => setCurrentSlide(thumbIdx)}
                            className={`relative h-11 w-16 sm:h-12 sm:w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                              thumbIdx === currentSlide
                                ? "border-groomish-orange shadow-md scale-105"
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
        <section id="rewards" className="py-20 bg-white border-t border-groomish-slate/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-groomish-goldLight text-groomish-goldDark mb-3">
                <Award className="w-3.5 h-3.5" />
                Loyalty Tiers
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-groomish-slate">
                How Our Rewards Program Works
              </h2>
              <p className="mt-2 text-sm text-groomish-slateLight">
                Every rupee spent translates directly into redeemable rewards. Unlock higher tiers as you visit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Silver */}
              <div className="card-groomish p-6 bg-white border-groomish-slate/10 flex flex-col justify-between hover:shadow-card transition duration-300">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-extrabold mb-4 text-base">
                    Ag
                  </div>
                  <h3 className="text-xl font-bold text-groomish-slate">Silver Tier</h3>
                  <p className="text-xs text-groomish-slateLight mt-1">Starting level for all members</p>
                  
                  <div className="my-4 py-2 px-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-extrabold text-groomish-slate">1 pt per ₹100</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-groomish-slate">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <span>Standard online bookings & OTP receipts.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <span>Welcome salon perks & referral points</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-groomish-slate/10 text-xs font-bold text-groomish-slateLight flex items-center justify-between">
                  <span>Entry Milestone</span>
                  <span className="text-groomish-slate font-extrabold">0 Points</span>
                </div>
              </div>

              {/* Gold */}
              <div className="card-groomish p-6 bg-gradient-to-b from-white to-groomish-goldLight/30 border-groomish-gold/40 relative shadow-glowGold flex flex-col justify-between hover:scale-[1.02] transition duration-300">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-groomish-goldLight flex items-center justify-center text-groomish-goldDark font-extrabold mb-4 text-base">
                    Au
                  </div>
                  <h3 className="text-xl font-bold text-groomish-slate">Gold Tier</h3>
                  <p className="text-xs text-groomish-slateLight mt-1">For regular salon enthusiasts</p>

                  <div className="my-4 py-2 px-3 rounded-xl bg-groomish-goldLight/60 border border-groomish-gold/30">
                    <span className="text-xs font-extrabold text-groomish-goldDark">1.25x Points Multiplier</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-groomish-slate">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <span>Complimentary scalp analysis & priority slots.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <span>1.25x point boost on all services</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-groomish-gold/30 text-xs font-bold text-groomish-goldDark flex items-center justify-between">
                  <span>Requirement</span>
                  <span className="font-extrabold">50 Points</span>
                </div>
              </div>

              {/* Platinum */}
              <div className="card-groomish p-6 bg-gradient-to-b from-white to-groomish-blueLight/30 border-groomish-blue/40 flex flex-col justify-between hover:scale-[1.02] transition duration-300">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-groomish-blueLight flex items-center justify-center text-groomish-blue font-extrabold mb-4 text-base">
                    Pt
                  </div>
                  <h3 className="text-xl font-bold text-groomish-slate">Platinum Tier</h3>
                  <p className="text-xs text-groomish-slateLight mt-1">Elite VIP luxury styling</p>

                  <div className="my-4 py-2 px-3 rounded-xl bg-groomish-blueLight/60 border border-groomish-blue/30">
                    <span className="text-xs font-extrabold text-groomish-blue">1.5x Points Multiplier</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-groomish-slate">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-blue shrink-0 mt-0.5" />
                      <span>Senior stylist preference & birthday gift.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-blue shrink-0 mt-0.5" />
                      <span>1.5x point boost on all bookings</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-groomish-blue/30 text-xs font-bold text-groomish-blue flex items-center justify-between">
                  <span>Requirement</span>
                  <span className="font-extrabold">150 Points</span>
                </div>
              </div>

              {/* Diamond */}
              <div className="card-groomish p-6 bg-gradient-to-br from-groomish-slate via-groomish-slateDark to-black text-white border-groomish-coral/40 relative shadow-card flex flex-col justify-between hover:scale-[1.02] transition duration-300">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-groomish-coral font-extrabold mb-4 text-base border border-white/10">
                    <Gem className="w-6 h-6 text-groomish-coral" />
                  </div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    Diamond Tier
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Supreme concierge & prestige</p>

                  <div className="my-4 py-2 px-3 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-xs font-extrabold text-groomish-coral">2.0x Points Multiplier</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-gray-200">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-coral shrink-0 mt-0.5" />
                      <span>Complimentary head massage & concierge.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-coral shrink-0 mt-0.5" />
                      <span>2.0x double point boost & VIP lounge</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-xs font-bold text-groomish-coral flex items-center justify-between">
                  <span>Requirement</span>
                  <span className="font-extrabold">300 Points</span>
                </div>
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
    </div>
  );
}
