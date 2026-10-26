import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import AuthModal from "../../components/modals/AuthModal";
import {
  getServices,
  getCategories,
  getServiceReviews,
  getServiceRatingSummary,
  getPublicCoupons,
} from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import { extractList } from "../../utils/dataHelper";
import {
  Scissors,
  Clock,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
  Check,
  CalendarCheck,
  ChevronRight,
  Home,
  MessageSquare,
  ArrowRight,
  User,
  Heart,
  Share2,
  ShoppingCart,
  Tag,
  ChevronDown,
} from "lucide-react";

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [categories, setCategories] = useState([]);
  const [relatedServices, setRelatedServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSubService, setSelectedSubService] = useState(null);

  const { addItem, items } = useCart();
  const { calculateCoins } = useGroomCoin();

  // Modals
  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const role = (user?.role || "").replace("ROLE_", "");
    if (role === "ADMIN") {
      navigate("/admin/services", { replace: true });
    } else if (role === "STAFF") {
      navigate("/staff/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadServiceDetails();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [serviceId]);

  const loadServiceDetails = async () => {
    setLoading(true);
    try {
      const [srvListRes, catListRes, revRes, sumRes, coupRes] = await Promise.all([
        getServices(),
        getCategories(),
        getServiceReviews(serviceId).catch(() => ({ data: { content: [] } })),
        getServiceRatingSummary(serviceId).catch(() => ({ data: null })),
        getPublicCoupons().catch(() => ({ data: [] })),
      ]);

      const allServices = extractList(srvListRes.data);
      const current = allServices.find((s) => String(s.id) === String(serviceId));

      setService(current || null);
      if (current && Array.isArray(current.subServices) && current.subServices.length > 0) {
        setSelectedSubService(current.subServices[0]);
      } else {
        setSelectedSubService(null);
      }
      setCategories(extractList(catListRes.data));
      setReviews(extractList(revRes.data));
      setRatingSummary(sumRes.data || null);
      setCoupons(extractList(coupRes.data));

      if (current) {
        setRelatedServices(
          allServices
            .filter((s) => s.categoryId === current.categoryId && String(s.id) !== String(current.id))
            .slice(0, 4)
        );
      }
    } catch (err) {
      console.error("Failed to load service details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setAddingToCart(true);
    const displayName = selectedSubService
      ? `${service.name} (${selectedSubService.name})`
      : service.name;

    await addItem({
      itemType: "SERVICE",
      serviceId: service.id,
      name: displayName,
      subServiceName: selectedSubService ? selectedSubService.name : null,
      subServicePrice: selectedSubService ? selectedSubService.price : null,
      subServiceDuration: selectedSubService ? selectedSubService.durationMinutes : null,
      quantity: 1,
    });
    setAddingToCart(false);
  };

  const isAlreadyInCart = items?.some(
    (i) =>
      (i.itemType === "SERVICE" || !i.itemType) &&
      (i.serviceId === service?.id || i.service?.id === service?.id) &&
      (!selectedSubService || !i.subServiceName || i.subServiceName === selectedSubService.name)
  );

  const defaultServiceImages = {
    MALE: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80",
    FEMALE: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
    UNISEX: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-groomish-slate/60 font-semibold">Loading treatment details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto py-24 px-4 text-center">
          <Scissors className="w-12 h-12 text-groomish-slate/30 mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold text-groomish-slate">
            Service Not Found
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-1 mb-6">
            The treatment you are looking for may have been archived or removed.
          </p>
          <button
            onClick={() => navigate("/services")}
            className="btn-primary text-xs px-6 py-2.5"
          >
            Browse Salon Services
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryObj = categories.find((c) => c.id === service.categoryId);
  const categoryName = categoryObj ? categoryObj.name : "Salon Service";
  const imgSrc =
    service.image ||
    defaultServiceImages[service.gender] ||
    defaultServiceImages.UNISEX;

  const activePrice = selectedSubService ? selectedSubService.price : service.price;
  const activeDuration = selectedSubService ? selectedSubService.durationMinutes : service.durationMinutes;
  const coinsEarned = calculateCoins(activePrice, service.rewards);
  const averageRating = ratingSummary?.averageRating ? ratingSummary.averageRating.toFixed(1) : "4.9";
  const totalReviewsCount = ratingSummary?.totalReviews ?? reviews.length;

  const reviewsSection = (
    <div className="bg-white rounded-2xl p-4 sm:p-5.5 border border-groomish-slate/10 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-4 gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-groomish-slate flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-groomish-orange shrink-0" />
            <span>Verified Client Reviews</span>
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Authentic ratings from customers who experienced this treatment.
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <div className="flex items-center gap-1 text-2xl font-heading font-extrabold text-groomish-slate">
            <Star className="w-6 h-6 fill-groomish-gold text-groomish-gold" />
            <span>{averageRating}</span>
          </div>
          <span className="text-[11px] text-groomish-slate/50">
            Based on {totalReviewsCount} review{totalReviewsCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="py-10 text-center text-xs text-groomish-slate/50 bg-groomish-cream/50 rounded-2xl">
          <p>No written reviews yet for this treatment.</p>
          <p className="mt-1 font-semibold text-groomish-orange">
            Book this treatment and be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-groomish-orangeLight text-groomish-orange flex items-center justify-center font-bold text-xs">
                    {r.userName?.charAt(0) || "C"}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-groomish-slate block">
                      {r.userName || "Verified Customer"}
                    </span>
                    <span className="text-[10px] text-groomish-green font-semibold">
                      ✓ Verified Visit
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= (r.rating || 5)
                          ? "fill-groomish-gold text-groomish-gold"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {r.review && r.review.trim() && (
                <p className="text-xs text-groomish-slate/80 leading-relaxed italic">
                  "{r.review}"
                </p>
              )}

              <div className="text-[10px] text-groomish-slate/40 text-right">
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })
                  : "Recently"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans w-full max-w-full overflow-x-clip">
      <Navbar />

      <main className="flex-1 w-full max-w-full">
        {/* BREADCRUMBS */}
        <div className="bg-white border-b border-groomish-slate/10 py-2.5 sm:py-3 w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center gap-1.5 sm:gap-2 text-xs text-groomish-slate/60 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-groomish-orange flex items-center gap-1 shrink-0">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30 shrink-0" />
            <Link to="/services" className="hover:text-groomish-orange shrink-0">
              Services
            </Link>
            {categoryObj && (
              <>
                <ChevronRight className="w-3 h-3 text-groomish-slate/30 shrink-0" />
                <Link to={`/category/${categoryObj.id}`} className="hover:text-groomish-orange shrink-0">
                  {categoryObj.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-groomish-slate/30 shrink-0" />
            <span className="font-bold text-groomish-slate truncate max-w-[140px] xs:max-w-[200px] shrink-0">
              {service.name}
            </span>
          </div>
        </div>

        {/* HERO / PRODUCT DETAILS SECTION */}
        <section className="py-3.5 sm:py-7 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full max-w-full min-w-0">
          <div className="grid lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-7 w-full max-w-full min-w-0 items-start">
            {/* LEFT / CENTER COLUMN: IMAGERY & DETAILS */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 w-full max-w-full min-w-0">
              {/* Image Preview - Compact */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-groomish-slate/10 shadow-soft h-[240px] sm:h-[300px] lg:h-[340px] w-full">
                <img
                  src={imgSrc}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-groomish-slateDark/70 via-transparent to-transparent" />

                {/* Floating Chips */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex gap-1.5 sm:gap-2 flex-wrap">
                  <span className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-groomish-slate backdrop-blur-md shadow-sm uppercase">
                    {service.gender}
                  </span>
                  <Link
                    to={categoryObj ? `/category/${categoryObj.id}` : "#"}
                    className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold bg-groomish-orange text-white shadow-sm hover:opacity-90 transition"
                  >
                    {categoryName}
                  </Link>
                </div>

                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between text-white gap-2">
                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold shrink-0">
                    <Clock className="w-3.5 h-3.5 text-groomish-gold" />
                    <span>Duration: {activeDuration}m</span>
                  </div>

                  <div className="flex items-center gap-1 bg-white/95 text-groomish-slate px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold backdrop-blur-md shrink-0">
                    <Star className="w-3.5 h-3.5 fill-groomish-gold text-groomish-gold" />
                    <span>{averageRating}</span>
                    <span className="text-[10px] sm:text-[11px] text-groomish-slate/60">
                      ({totalReviewsCount})
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Overview */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-groomish-slate/10 shadow-soft space-y-4 sm:space-y-6 w-full min-w-0">
                <div>
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-groomish-slate tracking-tight break-words">
                    {service.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-groomish-slate/60 mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>{categoryName} Collection</span>
                    <span>•</span>
                    <span>{service.gender} Treatment</span>
                  </p>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-groomish-slate uppercase tracking-wider mb-1.5 sm:mb-2">
                    Treatment Description
                  </h3>
                  <p className="text-xs sm:text-sm text-groomish-slate/80 leading-relaxed font-normal">
                    {service.description ||
                      "Experience premium salon care tailored to your specific styling needs. Delivered by certified salon specialists using professional, skin-safe products and stringent hygiene protocols."}
                  </p>
                </div>

                {/* SUB-SERVICES / TREATMENT OPTIONS */}
                {Array.isArray(service.subServices) && service.subServices.length > 0 && (
                  <div className="pt-3 sm:pt-4 border-t border-groomish-slate/10 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-xs sm:text-sm text-groomish-slate uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-groomish-orange" />
                        Choose Option / Variation
                      </h3>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-groomish-slate/60 bg-groomish-cream px-2 py-0.5 rounded-full shrink-0">
                        {service.subServices.length} Options Available
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {service.subServices.map((sub, idx) => {
                        const isSelected = selectedSubService?.name === sub.name;
                        return (
                          <button
                            key={sub.id || idx}
                            type="button"
                            onClick={() => setSelectedSubService(sub)}
                            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${isSelected
                                ? "bg-amber-50/80 border-groomish-orange shadow-sm ring-2 ring-groomish-orange/20"
                                : "bg-white border-groomish-slate/15 hover:border-groomish-orange/40 hover:bg-groomish-cream/40"
                              }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-xs font-bold leading-tight ${isSelected ? "text-groomish-orange" : "text-groomish-slate"}`}>
                                  {sub.name}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${isSelected
                                      ? "border-groomish-orange bg-groomish-orange text-white"
                                      : "border-groomish-slate/30 bg-white"
                                    }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </div>
                              {sub.description && (
                                <p className="text-[11px] text-groomish-slate/60 mt-1 line-clamp-2 leading-relaxed">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2.5 sm:mt-3 text-xs">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-extrabold text-groomish-slate text-sm">
                                  ₹{sub.price}
                                </span>
                                {sub.mrp > sub.price && (
                                  <span className="text-[10px] text-groomish-slate/40 line-through">
                                    ₹{sub.mrp}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-groomish-slate/60 flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-groomish-gold" />
                                {sub.durationMinutes} mins
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* What's Included / Highlights */}
                <div className="pt-3 sm:pt-4 border-t border-groomish-slate/10">
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-groomish-slate uppercase tracking-wider mb-2.5 sm:mb-3">
                    What to Expect at Groomish Now
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs text-groomish-slate min-w-0">
                    <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-groomish-cream/70 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold block leading-snug">Certified Stylist Consultation</span>
                        <span className="text-groomish-slate/60 text-[11px] leading-tight block mt-0.5">One-on-one consultation before treatment begins.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-groomish-cream/70 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold block leading-snug">100% Sanitized Instruments</span>
                        <span className="text-groomish-slate/60 text-[11px] leading-tight block mt-0.5">Autoclave sanitized tools for maximum hygiene.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-groomish-cream/70 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold block leading-snug">Organic Professional Care</span>
                        <span className="text-groomish-slate/60 text-[11px] leading-tight block mt-0.5">High-grade styling products and serums.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-groomish-cream/70 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold block leading-snug">Instant Groom Coin Accrual</span>
                        <span className="text-groomish-slate/60 text-[11px] leading-tight block mt-0.5">Earn Groom Coins credited directly to your profile.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESKTOP REVIEWS (Shown in Left Column on Desktop >= lg) */}
              <div className="hidden lg:block">
                {reviewsSection}
              </div>
            </div>

            {/* RIGHT SIDEBAR: STICKY BOOKING CARD (FIXED ON TOP AS PAGE SCROLLS) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 lg:self-start space-y-4 w-full min-w-0 z-20">
              <div className="bg-white rounded-2xl p-4 sm:p-5.5 border border-groomish-slate/10 shadow-card space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-groomish-slate/50 block mb-1">
                      Salon Tariff & Booking
                    </span>

                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-heading font-extrabold text-groomish-slate">
                        ₹{activePrice}
                      </span>
                      {service.mrp > activePrice && (
                        <>
                          <span className="text-sm font-semibold text-groomish-slate/40 line-through">
                            ₹{service.mrp}
                          </span>
                          <span className="text-xs font-bold text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full">
                            {Math.round(((service.mrp - activePrice) / service.mrp) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    {selectedSubService && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-groomish-orange border border-amber-200/60 text-xs font-bold">
                        <span>Option: {selectedSubService.name}</span>
                        <span className="text-groomish-slate/40">•</span>
                        <span>{activeDuration}m</span>
                      </div>
                    )}
                    <p className="text-[11px] text-groomish-slate/50 mt-1">
                      Inclusive of all taxes & professional salon hygiene sanitation.
                    </p>
                  </div>

                  {/* Groom Coins Bonus Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/40">
                      <GroomCoinIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-groomish-slate block flex items-center gap-1.5 flex-wrap">
                        <span>Earn {coinsEarned} Groom Coins</span>
                        {service.rewards > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-black">
                            Includes +{service.rewards} Bonus
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-groomish-slate/70">
                        Redeem Groom Coins for treatment vouchers & salon perks.
                      </span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2.5">
                    {isAlreadyInCart ? (
                      <>
                        <button
                          type="button"
                          onClick={() => navigate("/cart")}
                          className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>View Cart</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={addingToCart}
                          className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 font-bold text-groomish-slate/75 hover:text-groomish-orange cursor-pointer"
                        >
                          <span>{addingToCart ? "Adding..." : "Add Another to Cart (+1)"}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={addingToCart}
                          className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{addingToCart ? "Adding to Cart..." : "Add Service to Cart"}</span>
                        </button>
                        {items?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => navigate("/cart")}
                            className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>View Cart & Checkout</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* AVAILABLE OFFERS & PROMOTIONAL COUPONS (RIGHT SIDEBAR BELOW TARIFF & BOOKING) */}
                {(coupons.length > 0 || service.rewards > 0 || coinsEarned > 0) && (
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-groomish-slate/10 shadow-card space-y-4 w-full min-w-0">
                    <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading font-extrabold text-sm text-groomish-slate truncate">
                            Available Offers & Promotional Coupons
                          </h3>
                          <p className="text-[11px] text-groomish-slate/60">
                            Redeemable during cart checkout on {categoryName} treatments
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full shrink-0">
                        {coupons.length + (service.rewards > 0 || coinsEarned > 0 ? 1 : 0)} Active
                      </span>
                    </div>

                    {/* EXTRA GROOM COINS OFFER - ONE LINE */}
                    {(service.rewards > 0 || coinsEarned > 0) && (
                      <div className="p-3 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/10 border border-amber-300/80 flex items-center justify-between gap-2.5 text-xs shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/25 text-amber-800 flex items-center justify-center shrink-0 border border-amber-400/40">
                            <GroomCoinIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-extrabold text-groomish-slate truncate text-xs">
                            {service.rewards > 0 ? (
                              <>
                                <span className="text-amber-800 uppercase font-black tracking-wider text-[10px] mr-1">Coin Offer:</span>
                                <span>Earn {coinsEarned} Groom Coins (+{service.rewards} Extra Bonus)</span>
                              </>
                            ) : (
                              <>
                                <span className="text-amber-800 uppercase font-black tracking-wider text-[10px] mr-1">Coin Offer:</span>
                                <span>Earn {coinsEarned} Groom Coins on this treatment</span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
                          Loyalty
                        </span>
                      </div>
                    )}

                    {/* PROMOTIONAL COUPONS - 2 LINES PER COUPON, NO COPY BUTTON */}
                    {coupons.length > 0 && (
                      <div className="space-y-2.5 pt-0.5">
                        {(showAllOffers ? coupons : coupons.slice(0, 3)).map((coupon) => (
                          <div
                            key={coupon.id}
                            className="bg-white rounded-2xl border border-groomish-slate/15 hover:border-groomish-orange/50 transition-all shadow-2xs p-3.5 space-y-2 group"
                          >
                            {/* LINE 1: Discount & Min order on left, Promo Code on right (NO COPY BUTTON) */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-black text-groomish-green tracking-tight whitespace-nowrap">
                                  FLAT ₹{coupon.discount} OFF
                                </span>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-groomish-slate/60 bg-groomish-cream px-2 py-0.5 rounded-md border border-groomish-slate/10 whitespace-nowrap">
                                  Min. order: ₹{coupon.minAmount || 0}
                                </span>
                              </div>

                              <span
                                className="font-mono text-xs font-black tracking-wider text-groomish-orange bg-groomish-orangeLight/80 px-2.5 py-1 rounded-lg border border-groomish-orange/30 shrink-0"
                                title={coupon.code}
                              >
                                {coupon.code}
                              </span>
                            </div>

                            {/* LINE 2: Offer Description */}
                            <p className="text-xs text-groomish-slate/75 font-medium leading-relaxed">
                              {coupon.description || "Valid on selected salon treatments at checkout"}
                            </p>
                          </div>
                        ))}

                        {/* View More Offers Toggle */}
                        {coupons.length > 3 && (
                          <div className="pt-1 text-center">
                            <button
                              type="button"
                              onClick={() => setShowAllOffers((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-groomish-orange bg-groomish-orangeLight/80 hover:bg-groomish-orange hover:text-white border border-groomish-orange/30 transition shadow-2xs cursor-pointer active:scale-95"
                            >
                              <span>{showAllOffers ? "Show Less Offers" : `View More Offers (+${coupons.length - 3} more)`}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllOffers ? "rotate-180" : ""}`} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MOBILE REVIEWS (Moved after Add to Cart and Offers on Mobile) */}
                <div className="block lg:hidden pt-2">
                  {reviewsSection}
                </div>
              </div>
            </div>
          </section>

        {/* RELATED SERVICES IN THIS CATEGORY */}
        {relatedServices.length > 0 && (
          <section className="py-12 bg-white border-t border-groomish-slate/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-heading font-extrabold text-groomish-slate">
                    Other {categoryName} Treatments
                  </h3>
                  <p className="text-xs text-groomish-slate/60 mt-0.5">
                    Popular companion services clients also enjoy.
                  </p>
                </div>

                {categoryObj && (
                  <Link
                    to={`/category/${categoryObj.id}`}
                    className="text-xs font-bold text-groomish-orange hover:underline flex items-center gap-1"
                  >
                    <span>View All {categoryName}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedServices.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => navigate(`/services/${rel.id}`)}
                    className="card-groomish overflow-hidden cursor-pointer group hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] w-full overflow-hidden bg-groomish-slate/10 relative">
                        <img
                          src={rel.image || defaultServiceImages[rel.gender] || defaultServiceImages.UNISEX}
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white bg-black/40 px-2 py-0.5 rounded-full">
                          {rel.durationMinutes} mins
                        </span>
                      </div>
                      <div className="p-4 space-y-1">
                        <h4 className="font-heading font-bold text-sm text-groomish-slate group-hover:text-groomish-orange transition-colors line-clamp-1">
                          {rel.name}
                        </h4>
                        <p className="text-xs text-groomish-slate/60 line-clamp-1">
                          {rel.description || "Signature salon therapy"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-groomish-slate/10 mt-2">
                      <span className="font-extrabold text-sm text-groomish-slate">
                        ₹{rel.price}
                      </span>
                      <span className="text-xs font-bold text-groomish-orange group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Booking Modal */}
      <BookingFlowModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        service={service}
      />

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}
