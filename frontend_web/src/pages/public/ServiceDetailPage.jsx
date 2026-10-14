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
import { extractList } from "../../utils/dataHelper";
import {
  Scissors,
  Clock,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
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
  Copy,
  Check,
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
  const [copiedCode, setCopiedCode] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);

  const { addItem, items } = useCart();

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
    await addItem({
      itemType: "SERVICE",
      serviceId: service.id,
      name: service.name,
      quantity: 1,
    });
    setAddingToCart(false);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2500);
  };

  const isAlreadyInCart = items.some((i) => i.serviceId === service?.id);

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

  const pointsEarned = Math.floor(service.price / 100);
  const averageRating = ratingSummary?.averageRating ? ratingSummary.averageRating.toFixed(1) : "4.9";
  const totalReviewsCount = ratingSummary?.totalReviews ?? reviews.length;

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* BREADCRUMBS */}
        <div className="bg-white border-b border-groomish-slate/10 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-groomish-slate/60">
            <Link to="/" className="hover:text-groomish-orange flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <Link to="/services" className="hover:text-groomish-orange">
              Services
            </Link>
            {categoryObj && (
              <>
                <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
                <Link to={`/category/${categoryObj.id}`} className="hover:text-groomish-orange">
                  {categoryObj.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <span className="font-bold text-groomish-slate truncate max-w-[200px]">
              {service.name}
            </span>
          </div>
        </div>

        {/* HERO / PRODUCT DETAILS SECTION */}
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT / CENTER COLUMN: IMAGERY & DETAILS */}
            <div className="lg:col-span-7 space-y-8">
              {/* Image Preview */}
              <div className="relative rounded-3xl overflow-hidden bg-white border border-groomish-slate/10 shadow-soft h-[320px] sm:h-[440px]">
                <img
                  src={imgSrc}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-groomish-slateDark/70 via-transparent to-transparent" />

                {/* Floating Chips */}
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-groomish-slate backdrop-blur-md shadow-sm uppercase">
                    {service.gender}
                  </span>
                  <Link
                    to={categoryObj ? `/category/${categoryObj.id}` : "#"}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-groomish-orange text-white shadow-sm hover:opacity-90 transition"
                  >
                    {categoryName}
                  </Link>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-groomish-gold" />
                    <span>Duration: {service.durationMinutes} Minutes</span>
                  </div>

                  <div className="flex items-center gap-1 bg-white/90 text-groomish-slate px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md">
                    <Star className="w-3.5 h-3.5 fill-groomish-gold text-groomish-gold" />
                    <span>{averageRating}</span>
                    <span className="text-[11px] text-groomish-slate/60">
                      ({totalReviewsCount})
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Overview */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-groomish-slate/10 shadow-soft space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-groomish-slate tracking-tight">
                    {service.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-groomish-slate/60 mt-1 flex items-center gap-2">
                    <span>{categoryName} Collection</span>
                    <span>•</span>
                    <span>{service.gender} Treatment</span>
                  </p>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-heading font-bold text-sm text-groomish-slate uppercase tracking-wider mb-2">
                    Treatment Description
                  </h3>
                  <p className="text-xs sm:text-sm text-groomish-slate/80 leading-relaxed font-normal">
                    {service.description ||
                      "Experience premium salon care tailored to your specific styling needs. Delivered by certified salon specialists using professional, skin-safe products and stringent hygiene protocols."}
                  </p>
                </div>

                {/* What's Included / Highlights */}
                <div className="pt-4 border-t border-groomish-slate/10">
                  <h3 className="font-heading font-bold text-sm text-groomish-slate uppercase tracking-wider mb-3">
                    What to Expect at Groomish Now
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-groomish-slate">
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Certified Stylist Consultation</span>
                        <span className="text-groomish-slate/60 text-[11px]">One-on-one consultation before treatment begins.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">100% Sanitized Instruments</span>
                        <span className="text-groomish-slate/60 text-[11px]">Autoclave sanitized tools for maximum hygiene.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Organic Professional Care</span>
                        <span className="text-groomish-slate/60 text-[11px]">High-grade styling products and serums.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Instant Loyalty Accrual</span>
                        <span className="text-groomish-slate/60 text-[11px]">Earn reward points credited directly to your profile.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AVAILABLE OFFERS & PROMOTIONAL COUPONS */}
              {coupons.length > 0 && (
                <div className="bg-gradient-to-br from-white to-groomish-cream/40 rounded-3xl p-6 sm:p-8 border border-groomish-orange/20 shadow-soft space-y-5">
                  <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-heading font-extrabold text-base sm:text-lg text-groomish-slate">
                          Available Offers & Promotional Coupons
                        </h2>
                        <p className="text-[11px] text-groomish-slate/60">
                          Redeemable during cart checkout on {categoryName} treatments
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-groomish-orange bg-groomish-orangeLight px-2.5 py-1 rounded-full">
                      {coupons.length} Offers Active
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="p-4 rounded-2xl bg-white border border-groomish-slate/15 hover:border-groomish-orange transition-all shadow-sm space-y-2.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-extrabold tracking-wider bg-groomish-cream text-groomish-orange px-2.5 py-1 rounded-lg border border-groomish-orange/20">
                              {coupon.code}
                            </span>
                            <span className="text-xs font-black text-groomish-green">
                              FLAT ₹{coupon.discount} OFF
                            </span>
                          </div>
                          <p className="text-xs text-groomish-slate/80 mt-2 font-medium line-clamp-2">
                            {coupon.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-groomish-slate/10 flex items-center justify-between text-[11px]">
                          <span className="text-groomish-slate/50">
                            Min Order: ₹{coupon.minAmount || 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="text-groomish-orange hover:text-groomish-orangeDark font-bold flex items-center gap-1 transition"
                          >
                            {copiedCode === coupon.code ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-groomish-green" />
                                <span className="text-groomish-green">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VERIFIED CUSTOMER REVIEWS & RATINGS */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-groomish-slate/10 shadow-soft space-y-6">
                <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-4">
                  <div>
                    <h2 className="font-heading font-extrabold text-xl text-groomish-slate flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-groomish-orange" />
                      Verified Client Reviews
                    </h2>
                    <p className="text-xs text-groomish-slate/60 mt-0.5">
                      Authentic ratings from customers who experienced this treatment.
                    </p>
                  </div>

                  <div className="text-right">
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

                        <p className="text-xs text-groomish-slate/80 leading-relaxed italic">
                          "{r.review}"
                        </p>

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
            </div>

            {/* RIGHT SIDEBAR: STICKY BOOKING CARD */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-groomish-slate/10 shadow-card space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-groomish-slate/50 block mb-1">
                    Salon Tariff & Booking
                  </span>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-heading font-extrabold text-groomish-slate">
                      ₹{service.price}
                    </span>
                    {service.mrp > service.price && (
                      <>
                        <span className="text-sm font-semibold text-groomish-slate/40 line-through">
                          ₹{service.mrp}
                        </span>
                        <span className="text-xs font-bold text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full">
                          {Math.round(((service.mrp - service.price) / service.mrp) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1">
                    Inclusive of all taxes & professional salon hygiene sanitation.
                  </p>
                </div>

                {/* Loyalty Bonus Banner */}
                <div className="p-4 rounded-2xl bg-groomish-goldLight border border-groomish-gold/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-groomish-gold text-groomish-slate flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-groomish-slate fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-groomish-slate block">
                      Earn +{pointsEarned} Loyalty Points
                    </span>
                    <span className="text-[11px] text-groomish-slate/70">
                      Redeem points for discounts & complimentary upgrades.
                    </span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{addingToCart ? "Adding to Cart..." : isAlreadyInCart ? "Add Another to Cart (+1)" : "Add Service to Cart"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2"
                  >
                    <span>View Cart & Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Trust Points */}
                <div className="space-y-2.5 pt-2 text-xs text-groomish-slate/70">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-groomish-green shrink-0" />
                    <span>Real-time email booking confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-groomish-blue shrink-0" />
                    <span>Free rescheduling up to appointment time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-groomish-orange shrink-0" />
                    <span>Pay online (UPI / Card) or pay at the salon</span>
                  </div>
                </div>

                {/* Concierge contact */}
                <div className="pt-4 border-t border-groomish-slate/10 text-center text-xs text-groomish-slate/60">
                  <span>Questions about this treatment?</span>
                  <p className="font-bold text-groomish-orange mt-0.5">
                    Call Salon Concierge: +91 98765 43210
                  </p>
                </div>
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
                      <div className="h-36 overflow-hidden bg-groomish-slate/10 relative">
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
