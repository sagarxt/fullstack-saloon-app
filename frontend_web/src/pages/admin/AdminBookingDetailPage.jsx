import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getBookingDetails,
  updateBookingDetails,
  updateBookingStatus,
  checkInBookingByAdmin,
} from "../../api/admin";
import CustomerProfileModal from "../../components/modals/CustomerProfileModal";
import BookingTimelineSection from "../../components/booking/BookingTimelineSection";
import CustomSelect from "../../components/common/CustomSelect";
import CustomDatePicker from "../../components/common/CustomDatePicker";
import CustomTimePicker from "../../components/common/CustomTimePicker";
import InvoiceBreakdownCard from "../../components/booking/InvoiceBreakdownCard";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import { formatLocalDateTime } from "../../utils/dataHelper";
import {
  Calendar,
  Clock,
  Scissors,
  CreditCard,
  MapPin,
  ChevronLeft,
  Sparkles,
  User,
  UserCheck,
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
  Trash2,
} from "lucide-react";
import { showConfirm } from "../../context/ConfirmContext";
import { forceDeleteBookingApi } from "../../api/maintenance";

const APPOINTMENT_STATUS_OPTIONS = [
  { value: "CONFIRMED", label: "CONFIRMED (Active Confirmed)" },
  { value: "CHECKED_IN", label: "CHECKED IN (Client Arrived / In Progress)" },
  { value: "COMPLETED", label: "COMPLETED (Finished & Billed)" },
  { value: "MODIFIED", label: "MODIFIED (Rescheduled)" },
  { value: "CANCELLED", label: "CANCELLED" },
  { value: "PENDING", label: "PENDING (Online Payment Pending)" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "CASH (Salon Counter)" },
  { value: "CARD", label: "CARD (POS Terminal)" },
  { value: "UPI", label: "UPI (Direct QR/App)" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "PENDING" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "FAILED", label: "FAILED" },
];

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

  const handleForceDeleteBooking = async () => {
    const ok = await showConfirm({
      title: `Force Delete Appointment ${bookingCode}?`,
      message:
        "This will permanently delete this booking, including all associated service line items, retail products, payment ledger records, and timeline audit entries from the database. This action cannot be undone.",
      confirmText: "Force Delete Booking",
      variant: "danger",
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await forceDeleteBookingApi(id);
      navigate("/admin/bookings");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to force delete booking");
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
      setSuccessMsg("Appointment changes saved & updated details email sent to customer (Overrided by Administrator)!");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save booking overrides");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckInBooking = async () => {
    const ok = await showConfirm({
      title: "Check In Client",
      message: "Check in customer for this appointment? Status will update to CHECKED IN and reminders will be suppressed.",
      confirmText: "Check In Now",
      variant: "primary",
    });
    if (!ok) return;

    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await checkInBookingByAdmin(id);
      setSuccessMsg("Client checked in successfully! Status is now CHECKED IN.");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check in client");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CHECKED_IN":
      case "IN_PROGRESS":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "CONFIRMED":
        return "bg-groomish-greenLight text-groomish-green border-groomish-green/30";
      case "COMPLETED":
        return "bg-groomish-blueLight text-groomish-blue border-groomish-blue/30";
      case "MODIFIED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "CANCELLED":
        return "bg-groomish-crimsonLight text-groomish-crimson border-groomish-crimson/30";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
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
    <div className="space-y-4 animate-fade-in pb-6">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 active:scale-95 transition shadow-soft cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Appointment</span>
              </button>
            )}

            {/* Check In Client Button */}
            {(booking.status === "CONFIRMED" || booking.status === "MODIFIED" || booking.status === "PENDING") && (
              <button
                disabled={actionLoading}
                onClick={handleCheckInBooking}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 active:scale-95 transition shadow-soft cursor-pointer"
                title="Check in client upon arrival"
              >
                <UserCheck className="w-4 h-4" />
                <span>Check In Client</span>
              </button>
            )}

            {/* Complete & Bill - Only available after client check-in */}
            {(booking.status === "CHECKED_IN" || booking.status === "IN_PROGRESS") && (
              <button
                disabled={actionLoading}
                onClick={() => handleQuickStatus("COMPLETED")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-groomish-blue text-white font-bold text-xs hover:bg-sky-600 active:scale-95 transition shadow-soft cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete & Bill</span>
              </button>
            )}

            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <button
                disabled={actionLoading}
                onClick={() => handleQuickStatus("CANCELLED")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-groomish-crimson/30 text-groomish-crimson bg-white hover:bg-groomish-crimsonLight active:scale-95 transition text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cancel Appointment</span>
              </button>
            )}

            <button
              disabled={actionLoading}
              onClick={handleForceDeleteBooking}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-95 transition text-xs font-bold shadow-soft cursor-pointer"
              title="Permanently remove this booking from database"
            >
              <Trash2 className="w-4 h-4" />
              <span>Force Delete</span>
            </button>

            <button
              onClick={loadBooking}
              disabled={actionLoading}
              className="p-2 rounded-xl border border-groomish-slate/20 text-groomish-slate/70 hover:text-groomish-orange hover:bg-white active:scale-95 transition cursor-pointer"
              title="Refresh details"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Checked In In-Progress Banner */}
        {(booking.status === "CHECKED_IN" || booking.status === "IN_PROGRESS") && (
          <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-sky-950">Client Checked In — Service In Progress</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-900 font-extrabold text-[10px] uppercase tracking-wider">
                    Active in Salon
                  </span>
                </div>
                <p className="text-xs text-sky-800 mt-0.5">
                  Client has arrived at the salon and treatments are underway. Appointment reminders and auto-cancellations are suppressed.
                </p>
              </div>
            </div>
            <button
              disabled={actionLoading}
              onClick={() => handleQuickStatus("COMPLETED")}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 transition shadow-soft flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete & Bill</span>
            </button>
          </div>
        )}

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

      {/* Online Payment Pending Banner */}
      {booking.status === "PENDING" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Online Payment Pending:</strong> Customer booked with an online payment method that is pending confirmation. You can verify the transaction or confirm the appointment directly.
            </span>
          </div>
          <button
            onClick={() => handleQuickStatus("CONFIRMED")}
            disabled={actionLoading}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
          >
            Confirm Appointment
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
                    {formatLocalDateTime(booking.createdAt)}
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
                        ? new Date(booking.scheduledAt).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
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
                const grouped = groupBookingServices(booking.items || booking.bookingItems || []);
                if (grouped.length > 0) {
                  return grouped.map((grp, idx) => (
                    <div
                      key={grp.key || idx}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-groomish-cream/20 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Service Image */}
                        {grp.image ? (
                          <img
                            src={grp.image}
                            alt={grp.serviceName}
                            className="w-14 aspect-[4/3] rounded-xl object-cover border border-groomish-slate/10 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-14 aspect-[4/3] rounded-xl bg-groomish-cream border border-groomish-slate/10 flex items-center justify-center text-groomish-orange shrink-0">
                            <Scissors className="w-5 h-5 opacity-70" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs text-groomish-slate">
                              {grp.serviceName}
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
                            <span className={booking.status === "CANCELLED" || grp.status === "CANCELLED" ? "text-groomish-crimson font-bold uppercase" : "capitalize"}>
                              {booking.status === "CANCELLED" || grp.status === "CANCELLED" ? "CANCELLED" : (grp.status || booking.status)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black font-heading text-sm text-groomish-slate block">
                          ₹{grp.totalPrice}
                        </span>
                        {grp.totalMrp && grp.totalMrp > grp.totalPrice && (
                          <span className="text-[11px] text-groomish-slate/40 line-through block">
                            ₹{grp.totalMrp}
                          </span>
                        )}
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
                        <p className="text-[11px] text-groomish-slate/50 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{booking.totalDurationMinutes || 45} mins</span>
                          <span>•</span>
                          <span className={booking.status === "CANCELLED" ? "text-groomish-crimson font-bold uppercase" : "capitalize"}>
                            {booking.status === "CANCELLED" ? "CANCELLED" : booking.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black font-heading text-sm text-groomish-slate block">
                        ₹{booking.totalAmount || 0}
                      </span>
                      {booking.totalMrp && booking.totalMrp > booking.totalAmount && (
                        <span className="text-[11px] text-groomish-slate/40 line-through block">
                          ₹{booking.totalMrp}
                        </span>
                      )}
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
                {booking.products.map((prod, idx) => {
                  const prodImg = prod.image || prod.productImage || prod.product?.image || (Array.isArray(prod.product?.images) && prod.product?.images[0]);
                  const prodName = prod.productName || prod.productNameSnapshot || prod.product?.name || "Salon Product";
                  const qty = prod.quantity || 1;

                  return (
                    <div
                      key={prod.id || idx}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-groomish-cream/20 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Product Image */}
                        {prodImg ? (
                          <img
                            src={prodImg}
                            alt={prodName}
                            className="w-11 h-11 rounded-xl object-cover border border-groomish-slate/10 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-groomish-cream border border-groomish-slate/10 flex items-center justify-center text-groomish-blue shrink-0">
                            <ShoppingBag className="w-5 h-5 opacity-70" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs text-groomish-slate">
                              {prodName}
                            </p>
                            {qty > 1 && (
                              <span className="px-2 py-0.5 rounded-md font-extrabold text-[11px] bg-groomish-blueLight text-groomish-blue border border-groomish-blue/20 shadow-xs">
                                × {qty}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                            Qty: {qty}
                          </p>
                        </div>
                      </div>
                    <div className="text-right">
                      <span className="font-black font-heading text-sm text-groomish-slate block">
                        ₹{prod.totalPrice || prod.subtotal || (prod.quantity * (prod.unitPriceSnapshot || prod.unitPrice || 0))}
                      </span>
                      {prod.mrp && prod.mrp > (prod.unitPriceSnapshot || prod.unitPrice) && (
                        <span className="text-[11px] text-groomish-slate/40 line-through block">
                          ₹{prod.mrp * (prod.quantity || 1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}


          {/* Activity & Audit Timeline */}
          <BookingTimelineSection timeline={booking.timeline} />
        </div>

        {/* Right 1 Column: Billing Breakdown & Admin Override Panel */}
        <div className="space-y-6">
          {/* Complete Invoice Breakdown Card */}
          <InvoiceBreakdownCard
            booking={booking}
            className="rounded-3xl border border-groomish-slate/10 p-6 shadow-soft"
          />

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
                <CustomSelect
                  name="editStatus"
                  options={APPOINTMENT_STATUS_OPTIONS}
                  value={editStatus}
                  onChange={(e) => {
                    const val = typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e;
                    setEditStatus(val);
                  }}
                  searchable={false}
                  placeholder="Select Status"
                  className="!py-2 !px-3 !bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Reschedule Date
                  </label>
                  <CustomDatePicker
                    value={editDate}
                    onChange={(e, val) => setEditDate(val || e.target?.value || "")}
                    placeholder="Select Date"
                    align="left"
                    className="w-full"
                    triggerClassName="!py-2 !px-3 !rounded-xl !bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Time Slot
                  </label>
                  <CustomTimePicker
                    value={editTime}
                    onChange={(e, val) => setEditTime(val || e.target?.value || "")}
                    placeholder="Select Time"
                    align="right"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Payment Method
                  </label>
                  <CustomSelect
                    name="editPaymentMethod"
                    options={PAYMENT_METHOD_OPTIONS}
                    value={editPaymentMethod}
                    onChange={(e) => {
                      const val = typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e;
                      setEditPaymentMethod(val);
                    }}
                    searchable={false}
                    placeholder="Method"
                    className="!py-2 !px-3 !bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Payment Status
                  </label>
                  <CustomSelect
                    name="editPaymentStatus"
                    options={PAYMENT_STATUS_OPTIONS}
                    value={editPaymentStatus}
                    onChange={(e) => {
                      const val = typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e;
                      setEditPaymentStatus(val);
                    }}
                    searchable={false}
                    placeholder="Status"
                    className="!py-2 !px-3 !bg-white font-semibold"
                  />
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
                  className="w-full px-3 py-2 rounded-xl bg-white border border-groomish-slate/15 text-xs text-groomish-slate font-bold focus:outline-none focus:border-groomish-orange focus:ring-2 focus:ring-groomish-orange/20 transition-all"
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
                  className="w-full px-3 py-2 rounded-xl bg-white border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:border-groomish-orange focus:ring-2 focus:ring-groomish-orange/20 transition-all resize-none"
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

              <div className="pt-1 text-center">
                <p className="text-[11px] text-groomish-slate/60 font-medium">
                  Customer receives an instant updated details email.
                </p>
                <p className="text-[10px] text-groomish-orange font-bold uppercase tracking-wider mt-0.5">
                  below (Overrided by Administrator)
                </p>
              </div>
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
