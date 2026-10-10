import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CategoriesSection from "../../components/landing/CategoriesSection";
import ServicesSection from "../../components/landing/ServicesSection";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import { getServices, getCategories, getPublicHome } from "../../api/public";
import { useAuth } from "../../context/useAuth";
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
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleBook = (service) => {
    setSelectedService(service);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-groomish-cream pt-12 pb-24 border-b border-groomish-slate/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Copy & Actions */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
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

              {/* Right Column: Visual Card Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-sm sm:max-w-md">
                  {/* Decorative Glow */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-groomish-orange/20 via-groomish-gold/20 to-groomish-coral/20 rounded-3xl blur-2xl -z-10" />

                  {/* Main Promo Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-card border border-groomish-slate/10 space-y-5">
                    {/* Brand Banner */}
                    <div className="flex items-center justify-between pb-4 border-b border-groomish-slate/10">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/groomisg_now_icon.png"
                          alt="Groomish Icon"
                          className="w-10 h-10 object-contain rounded-xl bg-groomish-cream p-1"
                        />
                        <div>
                          <p className="font-heading font-extrabold text-sm text-groomish-slate">Groomish VIP Club</p>
                          <p className="text-[11px] text-groomish-slateLight">Exclusive Membership Pass</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-groomish-gold text-groomish-slate">
                        PLATINUM
                      </span>
                    </div>

                    {/* Offer Highlight Box */}
                    <div className="bg-gradient-to-r from-groomish-slate to-groomish-slateDark text-white p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                        <Gift className="w-36 h-36" />
                      </div>
                      <span className="text-[11px] uppercase font-bold text-groomish-gold tracking-wider">
                        Welcome Privilege
                      </span>
                      <h4 className="text-2xl font-bold mt-1 text-white">
                        Earn 25 Bonus Points
                      </h4>
                      <p className="text-xs text-gray-300 mt-1 max-w-[200px]">
                        Redeem points for complimentary hair treatments, nail art, or spa passes.
                      </p>
                    </div>

                    {/* Quick Appointment Preview */}
                    <div className="p-4 rounded-xl bg-groomish-cream border border-groomish-slate/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-groomish-orange shadow-sm">
                          <CalendarCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-groomish-slate">Fast 3-Step Booking</p>
                          <p className="text-[11px] text-groomish-slateLight">Instant confirmation on email & SMS</p>
                        </div>
                      </div>
                      <a
                        href="#services"
                        className="text-xs font-bold text-groomish-orange hover:underline flex items-center gap-1"
                      >
                        Book Now →
                      </a>
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

            <div className="grid md:grid-cols-3 gap-8">
              {/* Silver */}
              <div className="card-groomish p-6 bg-white border-groomish-slate/10 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-extrabold mb-4">
                    Ag
                  </div>
                  <h3 className="text-xl font-bold text-groomish-slate">Silver Tier</h3>
                  <p className="text-xs text-groomish-slateLight mt-1">Starting level for all members</p>
                  <ul className="mt-6 space-y-3 text-xs text-groomish-slate">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                      <span>Earn 1 point for every ₹100 spent</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                      <span>Welcome discount coupon (10% off)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                      <span>Birthday surprise loyalty perks</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-groomish-slate/10 text-xs font-bold text-groomish-slateLight">
                  Entry: 0 – 499 Points
                </div>
              </div>

              {/* Gold */}
              <div className="card-groomish p-6 bg-gradient-to-b from-white to-groomish-goldLight/30 border-groomish-gold/40 relative shadow-glowGold flex flex-col justify-between">
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-gold text-groomish-slate tracking-wider uppercase">
                  POPULAR
                </span>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-groomish-goldLight flex items-center justify-center text-groomish-goldDark font-extrabold mb-4">
                    Au
                  </div>
                  <h3 className="text-xl font-bold text-groomish-slate">Gold Tier</h3>
                  <p className="text-xs text-groomish-slateLight mt-1">For frequent styling enthusiasts</p>
                  <ul className="mt-6 space-y-3 text-xs text-groomish-slate">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                      <span>Earn 1.5x points multiplier on all services</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                      <span>Priority booking slots during peak hours</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                      <span>Complimentary beverage & scalp massage</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-groomish-gold/30 text-xs font-bold text-groomish-goldDark">
                  Milestone: 500 – 999 Points
                </div>
              </div>

              {/* Platinum */}
              <div className="card-groomish p-6 bg-groomish-slate text-white border-groomish-slate flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-groomish-gold font-extrabold mb-4">
                    Pt
                  </div>
                  <h3 className="text-xl font-bold text-white">Platinum Elite</h3>
                  <p className="text-xs text-gray-300 mt-1">Ultimate VIP salon privilege</p>
                  <ul className="mt-6 space-y-3 text-xs text-gray-200">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-gold shrink-0" />
                      <span>2x points on all treatments & retail</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-gold shrink-0" />
                      <span>Dedicated Master Stylist reservations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-groomish-gold shrink-0" />
                      <span>Complimentary quarterly hair spa ritual</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-4 border-t border-white/10 text-xs font-bold text-groomish-gold">
                  Milestone: 1,000+ Points
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
