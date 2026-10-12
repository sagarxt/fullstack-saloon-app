import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getMyVouchers } from "../../api/customer";
import { extractList } from "../../utils/dataHelper";
import BookingFlowModal from "../../components/modals/BookingFlowModal";
import {
  Ticket,
  Sparkles,
  Scissors,
  Calendar,
  Clock,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  Gift,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function MyVouchersPage() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, ACTIVE, APPLIED, EXPIRED
  const [copiedId, setCopiedId] = useState(null);

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await getMyVouchers();
      setVouchers(extractList(res.data));
    } catch (err) {
      console.error("Failed to load customer vouchers:", err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleBookWithVoucher = (voucher) => {
    if (voucher.serviceId) {
      setSelectedServiceForBooking({
        id: voucher.serviceId,
        name: voucher.serviceName || voucher.title,
      });
      setBookingModalOpen(true);
    } else {
      navigate("/services");
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (filter === "ACTIVE") return v.status === "ACTIVE";
    if (filter === "APPLIED") return v.status === "APPLIED";
    if (filter === "EXPIRED") return v.status === "EXPIRED";
    return true;
  });

  const activeCount = vouchers.filter((v) => v.status === "ACTIVE").length;

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
              <Ticket className="w-4 h-4" />
              <span>Groomish Club Perks</span>
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-groomish-slate">
              My Redeemed Vouchers
            </h1>
            <p className="text-sm text-groomish-slate/60 mt-1">
              All your unlocked salon treatment perks, discount passes, and reward vouchers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/customer/rewards"
              className="px-4 py-2.5 rounded-2xl border border-groomish-slate/15 bg-white text-xs font-bold text-groomish-slate hover:bg-groomish-cream transition flex items-center gap-2 shadow-sm"
            >
              <Gift className="w-4 h-4 text-groomish-orange" />
              <span>Rewards Catalog</span>
            </Link>

            <button
              onClick={loadVouchers}
              disabled={loading}
              className="p-2.5 rounded-2xl border border-groomish-slate/15 bg-white text-xs font-bold text-groomish-slate hover:bg-groomish-cream transition shadow-sm"
              title="Refresh vouchers"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-white rounded-2xl border border-groomish-slate/10 shadow-soft w-fit">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === "ALL"
                ? "bg-groomish-slate text-white shadow-sm"
                : "text-groomish-slate/60 hover:text-groomish-slate"
            }`}
          >
            All Vouchers ({vouchers.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filter === "ACTIVE"
                ? "bg-groomish-green text-white shadow-sm"
                : "text-groomish-slate/60 hover:text-groomish-green"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-groomish-green" />
            <span>Ready to Use ({activeCount})</span>
          </button>
          <button
            onClick={() => setFilter("APPLIED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === "APPLIED"
                ? "bg-groomish-slate text-white shadow-sm"
                : "text-groomish-slate/60 hover:text-groomish-slate"
            }`}
          >
            Used
          </button>
          <button
            onClick={() => setFilter("EXPIRED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === "EXPIRED"
                ? "bg-groomish-crimson text-white shadow-sm"
                : "text-groomish-slate/60 hover:text-groomish-crimson"
            }`}
          >
            Expired
          </button>
        </div>

        {/* Voucher Cards Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-groomish-orange animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-groomish-slateLight">
              Loading your redeemed vouchers...
            </p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-groomish-slate/10 shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-groomish-cream text-groomish-orange flex items-center justify-center mx-auto mb-4 border border-groomish-slate/10">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-extrabold text-xl text-groomish-slate">
              No Vouchers in this Category
            </h3>
            <p className="text-xs text-groomish-slate/60 mt-1 max-w-sm mx-auto">
              {filter === "ALL"
                ? "You haven't redeemed any reward vouchers yet. Head over to the Rewards page to exchange points for salon discounts!"
                : "No vouchers currently match this status filter."}
            </p>
            <Link
              to="/customer/rewards"
              className="btn-groomish-primary inline-flex items-center gap-2 mt-6 text-xs px-6 py-2.5 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Browse Redeemable Rewards</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVouchers.map((voucher) => {
              const isActive = voucher.status === "ACTIVE";
              const isApplied = voucher.status === "APPLIED";
              const isExpired = voucher.status === "EXPIRED";

              return (
                <div
                  key={voucher.id}
                  className={`bg-white rounded-3xl p-6 border shadow-soft flex flex-col justify-between transition relative overflow-hidden ${
                    isActive
                      ? "border-groomish-orange/30 hover:shadow-card hover:border-groomish-orange/50"
                      : "border-groomish-slate/10 opacity-75"
                  }`}
                >
                  {/* Background Brand Accent */}
                  <div className="absolute -right-12 -top-12 w-32 h-32 bg-groomish-orange/5 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-groomish-orange to-groomish-coral text-white tracking-wide uppercase shadow-sm">
                        {voucher.discountPercent
                          ? `${voucher.discountPercent}% OFF`
                          : "SALON PERK"}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                          isActive
                            ? "bg-groomish-green/15 text-groomish-green border border-groomish-green/30"
                            : isApplied
                            ? "bg-gray-100 text-gray-600 border border-gray-200"
                            : "bg-groomish-crimson/10 text-groomish-crimson border border-groomish-crimson/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? "bg-groomish-green animate-pulse"
                              : isApplied
                              ? "bg-gray-500"
                              : "bg-groomish-crimson"
                          }`}
                        />
                        <span>
                          {isActive
                            ? "Ready to Use"
                            : isApplied
                            ? "Applied"
                            : "Expired"}
                        </span>
                      </span>
                    </div>

                    {/* Voucher Title */}
                    <h3 className="font-heading font-extrabold text-lg text-groomish-slate">
                      {voucher.title}
                    </h3>

                    {/* Special Applicable Service Highlight */}
                    <div className="my-3 p-3 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-groomish-orange">
                        <Scissors className="w-3.5 h-3.5 shrink-0" />
                        <span>Specially applicable on:</span>
                      </div>
                      <p className="text-xs font-extrabold text-groomish-slate mt-0.5">
                        {voucher.serviceName || "All Salon Grooming & Treatments"}
                      </p>
                    </div>

                    {/* Description */}
                    {voucher.description && (
                      <p className="text-xs text-groomish-slate/60 mb-4 line-clamp-2">
                        {voucher.description}
                      </p>
                    )}

                    {/* Voucher Code Box with Copy */}
                    <div className="p-3 bg-groomish-slate text-white rounded-2xl flex items-center justify-between gap-3 mb-4 shadow-sm">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-white/50 block">
                          Voucher Code
                        </span>
                        <span className="font-mono font-extrabold text-sm sm:text-base text-groomish-gold tracking-wider">
                          {voucher.voucherCode}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyCode(voucher.id, voucher.voucherCode)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs font-bold text-white flex items-center gap-1.5 shrink-0 border border-white/10"
                        title="Copy voucher code"
                      >
                        {copiedId === voucher.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-groomish-green" />
                            <span className="text-groomish-green">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-groomish-gold" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Meta info: Bought date & Expiry date */}
                    <div className="space-y-1.5 text-[11px] text-groomish-slate/60 pt-2 border-t border-groomish-slate/10">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-groomish-slate/40" />
                          <span>Bought on:</span>
                        </span>
                        <span className="font-semibold text-groomish-slate">
                          {voucher.redeemedAt
                            ? new Date(voucher.redeemedAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "Recent"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-groomish-slate/40" />
                          <span>Valid until:</span>
                        </span>
                        <span
                          className={`font-semibold ${
                            isExpired ? "text-groomish-crimson font-bold" : "text-groomish-slate"
                          }`}
                        >
                          {voucher.expiresAt
                            ? new Date(voucher.expiresAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "No expiry"}
                          {isActive && voucher.daysRemaining !== null && (
                            <span className="text-[10px] text-groomish-orange font-bold ml-1">
                              ({voucher.daysRemaining} days left)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-4 border-t border-groomish-slate/10">
                    {isActive ? (
                      <button
                        onClick={() => handleBookWithVoucher(voucher)}
                        className="btn-groomish-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer group"
                      >
                        <Scissors className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" />
                        <span>Book This Service Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isApplied ? (
                      <div className="py-2 text-center text-xs font-bold text-groomish-slate/50 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-groomish-green" />
                        <span>Redeemed & Applied in Appointment</span>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs font-bold text-groomish-crimson flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Expired Voucher</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {bookingModalOpen && selectedServiceForBooking && (
        <BookingFlowModal
          open={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          service={selectedServiceForBooking}
        />
      )}

      <Footer />
    </div>
  );
}
