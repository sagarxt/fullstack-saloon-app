import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getBookingDetails,
  updateBookingDetails,
  updateBookingStatus,
} from "../../api/admin";
import CustomerProfileModal from "../../components/modals/CustomerProfileModal";
import BookingTimelineSection from "../../components/booking/BookingTimelineSection";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import {
  Calendar,
  Clock,
  Scissors,
  CreditCard,
  MapPin,
  ChevronLeft,
  Sparkles,
  User,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  X,
  AlertCircle,
  RefreshCw,
  Save,
  Phone,
  Mail,
  ShieldCheck,
  Tag,
} from "lucide-react";

export default function AdminBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customerProfileOpen, setCustomerProfileOpen] = useState(false);

  // Edit / Override controls
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("PENDING");
  const [editPaymentMethod, setEditPaymentMethod] = useState("CASH");
  const [editPricePaid, setEditPricePaid] = useState(0);

  const loadBooking = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await getBookingDetails(id);
      const b = res.data;
      setBooking(b);
      setEditStatus(b.status || "PENDING");
      setEditNote(b.note || "");
      setEditPricePaid(b.pricePaid ?? b.totalAmount ?? 0);
      setEditPaymentMethod(b.paymentMethod || "CASH");
      setEditPaymentStatus(b.paymentStatus || "PENDING");

      if (b.scheduledAt) {
        const parts = b.scheduledAt.split("T");
        if (parts.length >= 2) {
          setEditDate(parts[0]);
          setEditTime(parts[1].slice(0, 5));
        } else {
          const d = new Date(b.scheduledAt);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setEditDate(`${y}-${m}-${day}`);
          setEditTime(`${hh}:${mm}`);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [id]);

  const handleCopyCode = () => {
    const code = booking?.bookingCode || booking?.id;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickStatus = async (newStatus) => {
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await updateBookingStatus(id, newStatus);
      setSuccessMsg(`Status updated to ${newStatus}`);
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveOverrides = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const payload = {
        status: editStatus,
        note: editNote,
        pricePaid: Number(editPricePaid) || 0,
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
      };
      if (editDate && editTime) {
        payload.scheduledAt = `${editDate}T${editTime}:00`;
      }
      await updateBookingDetails(id, payload);
      setSuccessMsg("Appointment changes updated successfully!");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save booking overrides");
    } finally {
      setActionLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-groomish-slate/60">Loading appointment details...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-groomish-crimsonLight text-groomish-crimson flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-heading text-groomish-slate">Appointment Not Found</h2>
        <p className="text-xs text-groomish-slate/60">{error}</p>
        <button
          onClick={() => navigate("/admin/bookings")}
          className="btn-primary text-xs px-5 py-2.5 mx-auto inline-flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Bookings</span>
        </button>
      </div>
    );
  }

  const bookingCode = booking.bookingCode || `GN-${booking.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-groomish-slate/60">
            <button
              onClick={() => navigate(-1)}
              className="hover:text-groomish-orange inline-flex items-center gap-1 transition font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span>/</span>
            <Link to="/admin/bookings" className="hover:text-groomish-orange transition font-medium">
              Admin Bookings
            </Link>
            <span>/</span>
            <span className="font-bold text-groomish-slate font-mono">{bookingCode}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-heading text-groomish-slate">
              Appointment Details
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(
                booking.status
              )}`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        {/* Quick Status Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {booking.status === "PENDING" && (
            <button
              disabled={actionLoading}
              onClick={() => handleQuickStatus("CONFIRMED")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 active:scale-95 transition shadow-soft"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Appointment</span>
            </button>
          )}

          {booking.status === "CONFIRMED" && (
            <button
              disabled={actionLoading}
              onClick={() => handleQuickStatus("COMPLETED")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-groomish-blue text-white font-bold text-xs hover:bg-sky-600 active:scale-95 transition shadow-soft"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Completed</span>
            </button>
          )}

          {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
            <button
              disabled={actionLoading}
              onClick={() => handleQuickStatus("CANCELLED")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-groomish-crimson/30 text-groomish-crimson bg-white hover:bg-groomish-crimsonLight active:scale-95 transition text-xs font-bold"
            >
              <X className="w-4 h-4" />
              <span>Cancel Appointment</span>
            </button>
          )}

          <button
            onClick={loadBooking}
            disabled={actionLoading}
            className="p-2 rounded-xl border border-groomish-slate/20 text-groomish-slate/70 hover:text-groomish-orange hover:bg-white active:scale-95 transition"
            title="Refresh details"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-groomish-greenLight border border-groomish-green/30 text-groomish-green text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-groomish-crimsonLight border border-groomish-crimson/30 text-groomish-crimson text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Client, Location, Schedule, Services, Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card: Code, Booking Source, Created Timestamp */}
          <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-groomish-slate/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50">
                  Appointment Reference
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black font-mono text-groomish-orange tracking-wider">
                    {bookingCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 rounded-lg text-groomish-slate/40 hover:text-groomish-orange hover:bg-groomish-cream/60 transition"
                    title="Copy booking code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50">
                  Booked Source
                </span>
                <p className="text-xs font-bold text-groomish-slate">
                  {booking.bookedBy || "BOOKED_BY_SELF"}
                </p>
                {booking.createdAt && (
                  <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Cards Grid: Customer, Store, Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-groomish-slate/50">Customer</span>
                  <User className="w-3.5 h-3.5 text-groomish-orange" />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setCustomerProfileOpen(true)}
                    className="font-bold text-sm text-groomish-slate hover:text-groomish-orange hover:underline text-left transition"
                    title="Click to view full customer profile"
                  >
                    {booking.userName || booking.bookedBy || "Walk-in Guest"}
                  </button>
                  {booking.userEmail && (
                    <p className="text-[11px] text-groomish-slate/60 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span>{booking.userEmail}</span>
                    </p>
                  )}
                  {booking.userPhone && (
                    <p className="text-[11px] text-groomish-slate/60 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{booking.userPhone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Salon Store Box */}
              <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-groomish-slate/50">Salon Branch</span>
                  <MapPin className="w-3.5 h-3.5 text-groomish-blue" />
                </div>
                <div>
                  <p className="font-bold text-sm text-groomish-slate truncate">
                    {booking.storeName || "Primary Salon Branch"}
                  </p>
                  <p className="text-[11px] text-groomish-slate/60 line-clamp-2 mt-0.5">
                    {booking.storeAddress || "Salon Main Location"}
                  </p>
                </div>
              </div>

              {/* Schedule Box */}
              <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-groomish-slate/50">Scheduled At</span>
                  <Calendar className="w-3.5 h-3.5 text-groomish-green" />
                </div>
                <div>
                  <p className="font-bold text-sm text-groomish-slate">
                    {booking.scheduledAt
                      ? new Date(booking.scheduledAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date Pending"}
                  </p>
                  <p className="text-[11px] text-groomish-slate/60 flex items-center gap-1 mt-0.5 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>
                      {booking.scheduledAt
                        ? new Date(booking.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}{" "}
                      ({booking.totalDurationMinutes || 45} mins)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booked Services Card */}
          <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-groomish-orange" />
                <h3 className="font-heading font-bold text-base text-groomish-slate">
                  Selected Salon Services ({booking.bookingItems?.length || 1})
                </h3>
              </div>
              <span className="text-xs text-groomish-slate/50">
                Duration: {booking.totalDurationMinutes || 45} mins
              </span>
            </div>

            <div className="divide-y divide-groomish-slate/10 border border-groomish-slate/10 rounded-2xl overflow-hidden">
              {(() => {
                const grouped = groupBookingServices(booking.bookingItems || []);
                if (grouped.length > 0) {
                  return grouped.map((grp, idx) => (
                    <div
                      key={grp.key || idx}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-groomish-cream/20 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-groomish-orangeLight text-groomish-orange font-bold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs text-groomish-slate">
                              {grp.serviceName}{grp.quantity > 1 ? ` X ${grp.quantity}` : ""}
                            </p>
                            {grp.quantity > 1 && (
                              <span className="px-2 py-0.5 rounded-md font-extrabold text-[11px] bg-groomish-orangeLight text-groomish-orange border border-groomish-orange/20 shadow-xs">
                                × {grp.quantity}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-groomish-slate/50 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{grp.unitDuration} mins each</span>
                            {grp.quantity > 1 && (
                              <>
                                <span>•</span>
                                <span>₹{grp.unitPrice} each</span>
                                <span>•</span>
                                <span className="font-semibold text-groomish-slate/70">
                                  Total: {grp.totalDuration} mins
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="capitalize">{grp.status || booking.status}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-black font-heading text-sm text-groomish-slate">
                        ₹{grp.totalPrice}
                      </div>
                    </div>
                  ));
                }
                return (
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-groomish-orangeLight text-groomish-orange font-bold text-xs flex items-center justify-center">
                        #1
                      </div>
                      <div>
                        <p className="font-bold text-xs text-groomish-slate">
                          {booking.serviceName || "Salon Service"}
                        </p>
                        <p className="text-[11px] text-groomish-slate/50">
                          {booking.totalDurationMinutes || 45} mins
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-black font-heading text-sm text-groomish-slate">
                      ₹{booking.totalAmount || 0}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Retail Products Card (if any) */}
          {booking.products && booking.products.length > 0 && (
            <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-groomish-blue" />
                <h3 className="font-heading font-bold text-base text-groomish-slate">
                  Retail Products Added ({booking.products.length})
                </h3>
              </div>

              <div className="divide-y divide-groomish-slate/10 border border-groomish-slate/10 rounded-2xl overflow-hidden">
                {booking.products.map((prod, idx) => (
                  <div
                    key={prod.id || idx}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-groomish-cream/20 transition"
                  >
                    <div>
                      <p className="font-bold text-xs text-groomish-slate">
                        {(prod.productName || "Salon Product") + (prod.quantity > 1 ? ` X ${prod.quantity}` : "")}
                      </p>
                      <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                        Qty: {prod.quantity} × ₹{prod.unitPriceSnapshot || prod.unitPrice || 0}
                      </p>
                    </div>
                    <div className="text-right font-black font-heading text-sm text-groomish-slate">
                      ₹{prod.subtotal || (prod.quantity * (prod.unitPriceSnapshot || prod.unitPrice || 0))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Activity & Audit Timeline */}
          <BookingTimelineSection timeline={booking.timeline} />
        </div>

        {/* Right 1 Column: Billing Breakdown & Admin Override Panel */}
        <div className="space-y-6">
          {/* Payment & Invoice Summary */}
          <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-groomish-slate/10">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-groomish-orange" />
                <h3 className="font-heading font-bold text-sm text-groomish-slate">
                  Payment Summary
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                  booking.paymentStatus === "COMPLETED"
                    ? "bg-groomish-greenLight text-groomish-green border border-groomish-green/30"
                    : "bg-groomish-goldLight text-groomish-slate border border-groomish-gold/40"
                }`}
              >
                {booking.paymentStatus || "PENDING"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-groomish-slate/70">
                <span>Services Total:</span>
                <span className="font-semibold text-groomish-slate">₹{booking.totalAmount || 0}</span>
              </div>
              {booking.couponCode && (
                <div className="flex items-center justify-between text-groomish-green">
                  <span>Coupon ({booking.couponCode}):</span>
                  <span>-₹{booking.discountAmount || 0}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-groomish-slate/10 text-sm font-bold text-groomish-slate">
                <span>Final Price Paid:</span>
                <span className="font-black text-lg text-groomish-orange font-heading">
                  ₹{booking.pricePaid ?? booking.totalAmount ?? 0}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-1.5 text-[11px] text-groomish-slate/70">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold text-groomish-slate">{booking.paymentMethod || "CASH (Salon)"}</span>
              </div>
              {booking.invoiceNumber && (
                <div className="flex justify-between">
                  <span>Invoice Ref:</span>
                  <span className="font-mono font-bold text-groomish-slate">{booking.invoiceNumber}</span>
                </div>
              )}
              {booking.paymentGatewayId && (
                <div className="flex justify-between">
                  <span>Gateway ID:</span>
                  <span className="font-mono text-groomish-slate truncate max-w-[130px]">{booking.paymentGatewayId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Edit & Override Controls */}
          <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-groomish-slate/10">
              <ShieldCheck className="w-4 h-4 text-groomish-orange" />
              <h3 className="font-heading font-bold text-sm text-groomish-slate">
                Admin Controls & Overrides
              </h3>
            </div>

            <form onSubmit={handleSaveOverrides} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                  Appointment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate font-semibold focus:outline-none focus:border-groomish-orange"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Reschedule Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:border-groomish-orange"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:border-groomish-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:border-groomish-orange"
                  >
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:border-groomish-orange"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                  Adjust Price Paid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPricePaid}
                  onChange={(e) => setEditPricePaid(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate font-bold focus:outline-none focus:border-groomish-orange"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                  Admin Internal Note
                </label>
                <textarea
                  rows="2"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Notes about client request, staff assignment..."
                  className="w-full px-3 py-2 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:border-groomish-orange resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full btn-primary text-xs py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 font-bold shadow-soft"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{actionLoading ? "Saving..." : "Save Appointment Changes"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Customer Profile Modal Popup if requested */}
      {booking.userId && (
        <CustomerProfileModal
          customerId={booking.userId}
          initialData={{
            id: booking.userId,
            name: booking.userName || booking.bookedBy,
            email: booking.userEmail,
            phone: booking.userPhone,
          }}
          open={customerProfileOpen}
          onClose={() => setCustomerProfileOpen(false)}
        />
      )}
    </div>
  );
}
