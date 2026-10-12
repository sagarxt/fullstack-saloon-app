import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalWrapper from "./ModalWrapper";
import { useAuth } from "../../context/useAuth";
import {
  getCustomerProfileApi,
  getCustomerPointsApi,
  getCustomerPointsHistoryApi,
  getCustomerBookingsApi,
} from "../../api/admin";
import { extractList } from "../../utils/dataHelper";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import {
  User,
  Crown,
  Sparkles,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Copy,
  Check,
  CheckCircle2,
  Scissors,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Gift,
  Package,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";

export default function CustomerProfileModal({
  customerId,
  initialData = null,
  open,
  onClose,
}) {
  const navigate = useNavigate();
  const auth = useAuth();
  let currentUser = auth?.user;
  if (!currentUser) {
    try {
      currentUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      currentUser = null;
    }
  }
  const userRole = (currentUser?.role || localStorage.getItem("role") || "").toUpperCase();
  const isAdmin = userRole.includes("ADMIN");
  const isStaff = userRole.includes("STAFF");

  const handleViewBookingDetails = (bookingId) => {
    if (onClose) onClose();
    if (isAdmin) {
      navigate(`/admin/bookings/${bookingId}`);
    } else if (isStaff) {
      navigate(`/staff/bookings/${bookingId}`);
    } else {
      navigate(`/customer/bookings/${bookingId}`);
    }
  };

  const [activeTab, setActiveTab] = useState("ORDERS"); // ORDERS | POINTS | INFO
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState("ALL"); // ALL | COMPLETED | PENDING | CANCELLED
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [profileRes, pointsRes, historyRes, bookingsRes] = await Promise.all([
        getCustomerProfileApi(customerId).catch(() => ({ data: initialData })),
        getCustomerPointsApi(customerId).catch(() => ({ data: null })),
        getCustomerPointsHistoryApi(customerId, 0, 50).catch(() => ({ data: [] })),
        getCustomerBookingsApi(customerId, 0, 50).catch(() => ({ data: [] })),
      ]);

      setProfile(profileRes?.data || initialData);
      setPointsData(pointsRes?.data || null);
      setPointsHistory(extractList(historyRes?.data));
      setBookings(extractList(bookingsRes?.data));
    } catch (err) {
      console.error("Failed to fetch customer profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customerId) {
      setActiveTab("ORDERS");
      fetchCustomerDetails();
    } else {
      setProfile(initialData);
      setPointsData(null);
      setPointsHistory([]);
      setBookings([]);
    }
  }, [open, customerId]);

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // Tier info & perks helper
  const getTierDetails = (tierName) => {
    const t = (tierName || "SILVER").toUpperCase();
    switch (t) {
      case "DIAMOND":
        return {
          title: "Diamond Member",
          badgeColor: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
          multiplier: "2.0x Points",
          perk: "Complimentary head massage & concierge",
          minPts: 300,
        };
      case "PLATINUM":
        return {
          title: "Platinum Member",
          badgeColor: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
          multiplier: "1.5x Points",
          perk: "Senior stylist preference & birthday gift",
          minPts: 150,
        };
      case "GOLD":
        return {
          title: "Gold Member",
          badgeColor: "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 font-extrabold",
          multiplier: "1.25x Points",
          perk: "Complimentary scalp analysis & priority slots",
          minPts: 50,
        };
      default:
        return {
          title: "Silver Member",
          badgeColor: "bg-slate-200 text-slate-800",
          multiplier: "1.0x Points",
          perk: "1 pt per ₹100 spend, standard bookings",
          minPts: 0,
        };
    }
  };

  const activeTier = pointsData?.tier || profile?.tier || "SILVER";
  const tierInfo = getTierDetails(activeTier);
  const currentPoints = pointsData?.points ?? profile?.points ?? 0;
  const lifetimePoints = pointsData?.lifetimePoints ?? currentPoints;

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const totalSpend = completedBookings.reduce(
    (sum, b) => sum + (Number(b.pricePaid ?? b.totalAmount) || 0),
    0
  );

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "ALL") return true;
    return b.status === bookingFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-groomish-greenLight text-groomish-green border-groomish-green/30";
      case "COMPLETED":
        return "bg-groomish-blueLight text-groomish-blue border-groomish-blue/30";
      case "CANCELLED":
        return "bg-groomish-crimsonLight text-groomish-crimson border-groomish-crimson/30";
      default:
        return "bg-groomish-goldLight text-groomish-slate border-groomish-gold/40";
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-4xl">
      <div className="space-y-5 animate-fade-in text-groomish-slate">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-groomish-slate/10 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-groomish-orange to-amber-600 text-white flex items-center justify-center font-heading font-extrabold text-xl shadow-soft shrink-0">
              {profile?.name?.charAt(0) || "C"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-heading font-extrabold text-groomish-slate">
                  {profile?.name || "Customer Profile"}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${tierInfo.badgeColor}`}>
                  <Crown className="w-3 h-3 inline mr-1 fill-current" />
                  {activeTier}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    profile?.active !== false
                      ? "bg-groomish-greenLight text-groomish-green"
                      : "bg-groomish-crimsonLight text-groomish-crimson"
                  }`}
                >
                  {profile?.active !== false ? "Active Customer" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-groomish-slate/60 mt-1 flex-wrap">
                {profile?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-groomish-slate/40" />
                    {profile.email}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-groomish-slate/40" />
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchCustomerDetails}
              className="p-2 rounded-xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
              title="Refresh profile data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
            </button>
          </div>
        </div>

        {/* LUXURY LOYALTY CARD & STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Reward Points Balance */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-groomish-slate via-groomish-slate to-[#1a2233] text-white shadow-soft relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-groomish-gold/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Available Rewards
                </span>
                <Sparkles className="w-4 h-4 text-groomish-gold" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-heading font-black text-groomish-gold">
                  {currentPoints}
                </span>
                <span className="text-xs font-bold text-white/70">points</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
              <span>Lifetime: <b className="text-white">{lifetimePoints} pts</b></span>
              <span className="text-groomish-goldLight font-semibold">{tierInfo.multiplier}</span>
            </div>
          </div>

          {/* Card 2: Salon Visits & Spend */}
          <div className="p-4 rounded-2xl bg-white border border-groomish-slate/10 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-groomish-slate/50 uppercase tracking-wider">
                  Salon Spend & Visits
                </span>
                <TrendingUp className="w-4 h-4 text-groomish-green" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-heading font-extrabold text-groomish-slate">
                  ₹{totalSpend.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-groomish-slate/50">spent</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-groomish-slate/10 flex items-center justify-between text-[11px] text-groomish-slate/60">
              <span>Completed: <b className="text-groomish-slate">{completedBookings.length} visits</b></span>
              <span>Total Orders: <b className="text-groomish-slate">{bookings.length}</b></span>
            </div>
          </div>

          {/* Card 3: VIP Membership & Referral */}
          <div className="p-4 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-groomish-slate/50 uppercase tracking-wider">
                  Tier Perks & Code
                </span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xs font-bold text-groomish-slate truncate">
                {tierInfo.perk}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-groomish-slate/10 flex items-center justify-between text-[11px]">
              <span className="text-groomish-slate/50">Referral Code:</span>
              <button
                type="button"
                onClick={() => handleCopy(profile?.referralCode || "N/A", "ref")}
                className="font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/20 hover:bg-groomish-orange/20 transition flex items-center gap-1"
                title="Click to copy referral code"
              >
                <span>{profile?.referralCode || "NONE"}</span>
                {copiedRef ? <Check className="w-3 h-3 text-groomish-green" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-groomish-slate/10 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "ORDERS"
                ? "bg-groomish-slate text-white shadow-soft"
                : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Orders & Appointments ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POINTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "POINTS"
                ? "bg-groomish-orange text-white shadow-soft"
                : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reward Points Ledger ({pointsHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INFO")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "INFO"
                ? "bg-groomish-blue text-white shadow-soft"
                : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Full Profile Details</span>
          </button>
        </div>

        {/* TAB 1: ORDERS & APPOINTMENTS */}
        {activeTab === "ORDERS" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                {["ALL", "CONFIRMED", "COMPLETED", "PENDING", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                      bookingFilter === st
                        ? "bg-groomish-slate text-white"
                        : "bg-groomish-cream/60 text-groomish-slate/70 hover:bg-groomish-cream"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-groomish-slate/50">
                Showing {filteredBookings.length} order{filteredBookings.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-groomish-slate/50">
                <div className="w-6 h-6 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading appointment history...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-groomish-slate/40 border border-dashed border-groomish-slate/20 rounded-2xl">
                No {bookingFilter !== "ALL" ? bookingFilter.toLowerCase() : ""} orders found for this customer.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white border border-groomish-slate/10 shadow-soft hover:border-groomish-slate/20 transition space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/20">
                          {b.bookingCode || (b.id ? `GN-${b.id.slice(0, 8).toUpperCase()}` : "GN-BOOKING")}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                            b.status
                          )}`}
                        >
                          {b.status}
                        </span>
                        {b.storeName && (
                          <span className="text-groomish-slate/70 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-groomish-slate/40" />
                            {b.storeName}
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-sm text-groomish-slate">
                          ₹{b.pricePaid ?? b.totalAmount ?? 0}
                        </span>
                        <span className="text-[10px] text-groomish-slate/40 block">
                          {b.paymentStatus || "PENDING"} • {b.paymentMethod || "CASH"}
                        </span>
                      </div>
                    </div>

                    {/* Service & Products Details Row with View Details button on the right */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 text-groomish-slate/70 flex-wrap">
                        {(() => {
                          const grouped = groupBookingServices(b.items || []);
                          const first = grouped[0];
                          const totalDistinct = grouped.length;
                          return (
                            <div className="flex items-center gap-1.5 font-bold text-groomish-slate">
                              <Scissors className="w-3.5 h-3.5 text-groomish-orange shrink-0" />
                              <span>
                                {first ? (
                                  <>
                                    {first.serviceName}
                                    {first.quantity > 1 && (
                                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orange text-white">
                                        × {first.quantity}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  b.serviceName || "Salon Treatment"
                                )}
                              </span>
                              {totalDistinct > 1 && (
                                <span className="text-[10px] text-groomish-slate/50 font-normal">
                                  (+{totalDistinct - 1} more)
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {b.scheduledAt && (
                          <div className="flex items-center gap-1 text-[11px] text-groomish-slate/50">
                            <Calendar className="w-3.5 h-3.5 text-groomish-slate/40" />
                            <span>{new Date(b.scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                          </div>
                        )}

                        {b.products?.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-groomish-blue font-semibold">
                            <Package className="w-3.5 h-3.5" />
                            <span>{b.products.length} Retail Product{b.products.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>

                      {/* View Details Button aligned beside Service & Products */}
                      <button
                        type="button"
                        onClick={() => handleViewBookingDetails(b.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-groomish-orange hover:bg-groomish-orangeDark active:scale-95 rounded-xl shadow-soft transition shrink-0 ml-auto"
                        title="Click to view full booking details & bill"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {b.note && (
                      <p className="text-[11px] italic text-groomish-slate/60 bg-groomish-cream/40 px-2 py-1 rounded-lg">
                        "{b.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REWARD POINTS LEDGER */}
        {activeTab === "POINTS" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-groomish-goldLight/50 border border-groomish-gold/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-groomish-slate">
                  Tier Multiplier: <span className="text-groomish-orange">{tierInfo.multiplier}</span>
                </span>
                <span className="text-groomish-slate/60 hidden sm:inline">
                  • {tierInfo.perk}
                </span>
              </div>
              <span className="font-black text-groomish-slate font-heading">
                {currentPoints} Points Available
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-groomish-slate/50">
                <div className="w-6 h-6 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading loyalty points activity...
              </div>
            ) : pointsHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-groomish-slate/40 border border-dashed border-groomish-slate/20 rounded-2xl">
                No loyalty reward point transactions recorded yet.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {pointsHistory.map((item) => {
                  const isPositive = (item.changeAmount ?? 0) >= 0;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white border border-groomish-slate/10 flex items-center justify-between gap-3 text-xs shadow-soft"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-groomish-slate">
                            {item.reason ? item.reason.replace(/_/g, " ") : "Reward Activity"}
                          </span>
                          {item.bookingCode && (
                            <span className="font-mono text-[10px] bg-groomish-cream px-1.5 py-0.5 rounded text-groomish-slate/70">
                              Order #{item.bookingCode}
                            </span>
                          )}
                          {item.voucherTitle && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                              {item.voucherTitle}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-groomish-slate/50 flex items-center gap-2">
                          {item.createdAt && (
                            <span>{new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                          )}
                          {item.serviceName && <span>• {item.serviceName}</span>}
                          {item.note && <span className="italic truncate max-w-[200px]">"{item.note}"</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black text-sm font-heading ${
                            isPositive ? "text-groomish-green" : "text-groomish-crimson"
                          }`}
                        >
                          {isPositive ? `+${item.changeAmount}` : item.changeAmount} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FULL PROFILE & CONTACT INFO */}
        {activeTab === "INFO" && (
          <div className="bg-white rounded-2xl border border-groomish-slate/10 p-5 shadow-soft space-y-4 text-xs">
            <h4 className="font-heading font-extrabold text-sm text-groomish-slate">
              Account Information & Demographics
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10">
                <span className="text-[10px] font-bold uppercase text-groomish-slate/50 block">Full Name</span>
                <span className="font-bold text-groomish-slate text-sm mt-0.5 block">{profile?.name || "—"}</span>
              </div>

              <div className="p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10">
                <span className="text-[10px] font-bold uppercase text-groomish-slate/50 block">Email Address</span>
                <span className="font-semibold text-groomish-slate text-sm mt-0.5 block">{profile?.email || "—"}</span>
              </div>

              <div className="p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10">
                <span className="text-[10px] font-bold uppercase text-groomish-slate/50 block">Phone Number</span>
                <span className="font-mono font-bold text-groomish-slate text-sm mt-0.5 block">{profile?.phone || "Not provided"}</span>
              </div>

              <div className="p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10">
                <span className="text-[10px] font-bold uppercase text-groomish-slate/50 block">Gender</span>
                <span className="font-semibold text-groomish-slate text-sm mt-0.5 block capitalize">{profile?.gender ? profile.gender.toLowerCase() : "Not specified"}</span>
              </div>

              <div className="p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10">
                <span className="text-[10px] font-bold uppercase text-groomish-slate/50 block">VIP Tier Status</span>
                <span className="font-extrabold text-groomish-orange text-sm mt-0.5 block">{activeTier} ({tierInfo.multiplier})</span>
              </div>

              <div className="p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10">
                <span className="text-[10px] font-bold uppercase text-groomish-slate/50 block">Assigned / Home Salon</span>
                <span className="font-semibold text-groomish-slate text-sm mt-0.5 block">{profile?.storeName || "All Locations"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-groomish-slate/10 flex items-center justify-between text-xs text-groomish-slate/50">
              <span className="font-mono text-[11px]">User UUID: {profile?.id || customerId}</span>
              <button
                type="button"
                onClick={() => handleCopy(profile?.id || customerId, "id")}
                className="hover:text-groomish-orange flex items-center gap-1 font-semibold"
              >
                <span>{copiedId ? "Copied UUID!" : "Copy UUID"}</span>
                {copiedId ? <Check className="w-3 h-3 text-groomish-green" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BUTTON */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6 py-2.5 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
