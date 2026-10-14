import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ModalWrapper from "../../components/modals/ModalWrapper";
import LeaveReviewModal from "../../components/modals/LeaveReviewModal";
import {
  getMyBookingDetails,
  addServiceToBooking,
  removeServiceFromBooking,
  rescheduleBooking,
  cancelBooking,
  checkoutPayment,
} from "../../api/customer";
import { getPublicServicesApi } from "../../api/service";
import { storeApi } from "../../api/store";
import { extractList } from "../../utils/dataHelper";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import { showConfirm, showAlert } from "../../context/ConfirmContext";
import { getBranchNavigationUrl } from "../../utils/mapHelper";
import {
  Calendar,
  Clock,
  Scissors,
  CreditCard,
  MapPin,
  ChevronLeft,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Star,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  Tag,
  ShieldCheck,
  User,
  Zap,
  Smartphone,
  CheckCircle,
  Navigation,
  Search,
  X,
} from "lucide-react";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reviewsRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add Service Modal
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("ALL");
  const [serviceLoading, setServiceLoading] = useState(false);
  const [addingServiceId, setAddingServiceId] = useState(null);

  // Reschedule Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  // Review Modal State (Services & Products)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReviewItem, setActiveReviewItem] = useState(null);

  // Pay Online Modal (Active Window)
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("UPI");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);

  const handleOpenPayOnline = () => {
    setPayError("");
    setPaySuccess(false);
    setPayMethod("UPI");
    setPayModalOpen(true);
  };

  const handlePayOnlineSubmit = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    setPayError("");
    try {
      await checkoutPayment({
        bookingId: id,
        paymentMethod: payMethod,
      });
      setPaySuccess(true);
      setTimeout(async () => {
        setPayModalOpen(false);
        setPaySuccess(false);
        await loadBooking();
      }, 1200);
    } catch (err) {
      setPayError(err.response?.data?.message || "Failed to process online payment. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  const loadBooking = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyBookingDetails(id);
      setBooking(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadBooking();
    }
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("review") === "true" && booking && booking.status === "COMPLETED") {
      setTimeout(() => {
        reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
  }, [location.search, booking]);

  const handleOpenServiceReview = (grp) => {
    const existing = (booking?.customerReviews || []).find(
      (r) => r.serviceId === grp.serviceId
    );
    setActiveReviewItem({
      type: "SERVICE",
      serviceId: grp.serviceId,
      serviceName: grp.serviceName,
      initialRating: existing ? existing.rating : 5,
      initialReview: existing ? existing.review : "",
    });
    setReviewModalOpen(true);
  };

  const handleOpenProductReview = (prod) => {
    const prodId = prod.productId || prod.id;
    const existing = (booking?.customerReviews || []).find(
      (r) => r.productId === prodId
    );
    setActiveReviewItem({
      type: "PRODUCT",
      productId: prodId,
      productName: prod.productName,
      initialRating: existing ? existing.rating : 5,
      initialReview: existing ? existing.review : "",
    });
    setReviewModalOpen(true);
  };

  const handleRateExperienceClick = () => {
    if (reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const loadAvailableServices = async () => {
    setServiceLoading(true);
    try {
      let list = [];
      const storeId = booking?.store?.id || booking?.storeId;
      if (storeId) {
        try {
          const res = await storeApi.getStoreServices(storeId);
          list = extractList(res.data);
        } catch (e) {
          // fallback to public
        }
      }
      if (!list || list.length === 0) {
        const res = await getPublicServicesApi();
        list = extractList(res.data);
      }
      setAvailableServices(list);
    } catch (err) {
      console.error(err);
      setAvailableServices([]);
    } finally {
      setServiceLoading(false);
    }
  };

  const handleOpenAddService = () => {
    setServiceSearch("");
    setSelectedServiceCategory("ALL");
    setAddServiceModalOpen(true);
    loadAvailableServices();
  };

  /* Add Service to Booking */
  const handleAddService = async (serviceId) => {
    setAddingServiceId(serviceId);
    try {
      const res = await addServiceToBooking(id, serviceId);
      setBooking(res.data);
      setAddServiceModalOpen(false);
    } catch (err) {
      await showAlert({
        title: "Unable to Add Service",
        message: err.response?.data?.message || "Failed to add service to appointment.",
        variant: "danger",
      });
    } finally {
      setAddingServiceId(null);
    }
  };

  /* Remove Service from Booking */
  const handleRemoveService = async (itemId, serviceName) => {
    if (booking.items?.length <= 1) {
      await showAlert({
        title: "Minimum Service Required",
        message: "An appointment must have at least one service. You can cancel the appointment if needed.",
        variant: "warning",
      });
      return;
    }

    const confirmed = await showConfirm({
      title: "Remove Service",
      message: `Are you sure you want to remove "${serviceName}" from your booking? Your bill and total time will be recalculated.`,
      confirmText: "Remove Service",
      variant: "danger",
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await removeServiceFromBooking(id, itemId);
      setBooking(res.data);
    } catch (err) {
      await showAlert({
        title: "Unable to Remove Service",
        message: err.response?.data?.message || "Failed to remove service.",
        variant: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  /* Open Reschedule Modal */
  const handleOpenReschedule = () => {
    setRescheduleError("");
    if (booking?.scheduledAt) {
      const dt = new Date(booking.scheduledAt);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const hh = String(dt.getHours()).padStart(2, "0");
      const min = String(dt.getMinutes()).padStart(2, "0");
      setRescheduleDate(`${yyyy}-${mm}-${dd}`);
      setRescheduleTime(`${hh}:${min}`);
    } else {
      setRescheduleDate("");
      setRescheduleTime("");
    }
    setRescheduleNotes(booking?.note || "");
    setRescheduleModalOpen(true);
  };

  /* Submit Reschedule */
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError("Please select both a date and time slot.");
      return;
    }

    if (new Date(`${rescheduleDate}T${rescheduleTime}:00`).getTime() <= Date.now()) {
      setRescheduleError("Appointment slot cannot be in the past. Please select an upcoming slot.");
      return;
    }

    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const iso = `${rescheduleDate}T${rescheduleTime}:00`;
      await rescheduleBooking(id, iso);
      setRescheduleModalOpen(false);
      await loadBooking();
    } catch (err) {
      setRescheduleError(err.response?.data?.message || "Failed to reschedule booking.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  /* Cancel Booking */
  const handleCancelBooking = async () => {
    const confirmed = await showConfirm({
      title: "Cancel Salon Appointment",
      message: "Are you sure you want to cancel this salon appointment? This action cannot be undone.",
      confirmText: "Yes, Cancel Booking",
      variant: "danger",
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await cancelBooking(id);
      await loadBooking();
    } catch (err) {
      await showAlert({
        title: "Cancellation Error",
        message: err.response?.data?.message || "Failed to cancel booking.",
        variant: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = () => {
    if (!booking) return;
    const code = booking.bookingCode || id;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-groomish-greenLight text-groomish-green border-groomish-green/30";
      case "COMPLETED":
        return "bg-groomish-blueLight text-groomish-blue border-groomish-blue/30";
      case "CANCELLED":
        return "bg-groomish-crimsonLight text-groomish-crimson border-groomish-crimson/30";
      case "MODIFIED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  const isModifiable = booking?.status !== "CANCELLED" && booking?.status !== "COMPLETED";

  // Group categories from availableServices for quick filter pills
  const serviceCategories = [
    "ALL",
    ...Array.from(new Set(availableServices.map((s) => s.categoryName).filter(Boolean))),
  ];

  const getBookedCount = (serviceId) =>
    (booking?.items || []).filter((it) => it.serviceId === serviceId).length;

  const filteredServices = availableServices
    .filter((s) => {
      if (selectedServiceCategory !== "ALL" && s.categoryName !== selectedServiceCategory) {
        return false;
      }
      if (!serviceSearch.trim()) return true;
      const q = serviceSearch.toLowerCase();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });

  const totalDuration =
    booking?.items?.reduce((sum, it) => sum + (it.durationMinutes || 0), 0) || 0;
  const groupedServices = groupBookingServices(booking?.items || []);

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs text-groomish-slate/60">
          <button
            onClick={() => navigate("/customer/bookings")}
            className="flex items-center gap-1 hover:text-groomish-orange transition font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>My Bookings</span>
          </button>
          <span>/</span>
          <span className="text-groomish-slate font-bold">
            {booking?.bookingCode || (id ? `GN-${id.slice(0, 8).toUpperCase()}` : "Details")}
          </span>
        </div>

        {loading ? (
          <div className="card-groomish p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-groomish-orange animate-spin mx-auto" />
            <p className="text-sm font-semibold text-groomish-slate/70">
              Loading appointment details...
            </p>
          </div>
        ) : error ? (
          <div className="card-groomish p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-groomish-crimson mx-auto" />
            <h2 className="text-lg font-bold text-groomish-slate">Appointment Not Found</h2>
            <p className="text-xs text-groomish-slate/60">{error}</p>
            <button
              onClick={() => navigate("/customer/bookings")}
              className="btn-primary text-xs px-6 py-2.5 mx-auto"
            >
              Back to Bookings
            </button>
          </div>
        ) : booking ? (
          <div className="space-y-6">
            {/* Urgent Reschedule Warning (Post-Slot 2-Hour Grace Period) */}
            {booking.graceMinutesRemaining != null &&
              booking.graceMinutesRemaining > 0 &&
              booking.status !== "CANCELLED" &&
              booking.status !== "COMPLETED" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-400/80 shadow-soft flex items-start gap-3.5 text-amber-900 animate-pulse">
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-extrabold text-amber-950 text-sm">
                        ⚠️ Action Required: Grace Window Active ({booking.graceMinutesRemaining} Mins Left)
                      </h4>
                      <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 font-extrabold rounded-md text-[11px]">
                        Auto-Cancel Protection
                      </span>
                    </div>
                    <p className="mt-1 text-amber-800 leading-relaxed">
                      Your scheduled slot was over 1 hour ago and has not been checked in. You have a{" "}
                      <strong>2-hour grace window</strong> from your appointment slot to reschedule or complete your visit to prevent automatic cancellation.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={handleOpenReschedule}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Reschedule Now (+2 Hours Grace)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Auto-Cancelled Notification Notice */}
            {booking.autoCancelled && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-soft flex items-start gap-3 text-rose-900">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-rose-950 text-sm">Appointment Auto-Cancelled</h4>
                  <p className="mt-0.5 text-rose-700">
                    This booking was automatically cancelled because it was not checked in or rescheduled within the 2-hour grace window after your scheduled slot. A cancellation confirmation was sent to your registered email.
                  </p>
                </div>
              </div>
            )}

            {/* Online Payment Pending Notice Banner */}
            {booking.status === "PENDING" && (
              <div className="card-groomish p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Online Payment Pending:</strong> Your appointment is reserved on hold awaiting online payment confirmation. You can complete payment online now to confirm your booking, or settle it upon arrival at the salon.
                  </span>
                </div>
                <button
                  onClick={handleOpenPayOnline}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition shadow-soft flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Online (₹{booking.pricePaid})</span>
                </button>
              </div>
            )}

            {/* Header Hero Banner */}
            <div className="card-groomish p-6 sm:p-8 bg-gradient-to-br from-white to-groomish-cream/40 border border-groomish-slate/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-groomish-orange/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-groomish-slate/10 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                    <button
                      onClick={copyCode}
                      className="group flex items-center gap-1.5 text-xs font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight px-2.5 py-1 rounded-lg border border-groomish-orange/25 hover:bg-groomish-orange hover:text-white transition"
                      title="Copy Appointment Code"
                    >
                      <span>{booking.bookingCode || `GN-${booking.id?.slice(0, 8).toUpperCase()}`}</span>
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-groomish-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-groomish-slate">
                    Salon Appointment
                  </h1>
                  <p className="text-xs text-groomish-slate/60 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Booked: {booking.bookedAt ? new Date(booking.bookedAt).toLocaleDateString() : "Recently"}</span>
                    {booking.bookedBy && (
                      <>
                        <span>•</span>
                        <span className="text-groomish-slate/80 font-medium">Source: {booking.bookedBy}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Right Hero Summary */}
                <div className="sm:text-right">
                  <div className="text-xs uppercase font-bold text-groomish-slate/50 tracking-wider">
                    Amount Paid
                  </div>
                  <div className="text-3xl font-heading font-extrabold text-groomish-orange">
                    ₹{booking.pricePaid}
                  </div>
                  {booking.totalAmount > booking.pricePaid && (
                    <div className="text-xs text-groomish-slate/40 line-through">
                      MRP: ₹{booking.totalAmount}
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Schedule & Store Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date & Time */}
                <div className="p-4 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-groomish-orange/15 text-groomish-orange flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-groomish-orange tracking-wider">
                      Appointment Schedule
                    </div>
                    <div className="text-base font-bold text-groomish-slate mt-0.5">
                      {booking.scheduledAt
                        ? new Date(booking.scheduledAt).toLocaleDateString(undefined, {
                            weekday: "long",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "To be confirmed"}
                    </div>
                    <div className="text-xs text-groomish-slate/60 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-groomish-slate/40" />
                      <span>
                        {booking.scheduledAt
                          ? new Date(booking.scheduledAt).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                      {totalDuration > 0 && <span>({totalDuration} mins total duration)</span>}
                    </div>
                  </div>
                </div>

                {/* Salon Branch */}
                <div className="p-4 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-groomish-orange/15 text-groomish-orange flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase font-bold text-groomish-orange tracking-wider">
                        Salon Branch
                      </div>
                      <div className="text-base font-bold text-groomish-slate mt-0.5 truncate">
                        {booking.storeName || "Groomish Now Flagship Lounge"}
                      </div>
                      <div className="text-xs text-groomish-slate/60 mt-0.5 line-clamp-2">
                        {booking.storeAddress || "Indiranagar 100ft Road, Bengaluru"}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Button (Opens Google Maps with current location to branch) */}
                  <a
                    href={getBranchNavigationUrl(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-groomish-orange hover:bg-groomish-coral text-white font-bold text-xs shadow-soft transition-all duration-200"
                    title="Open Google Maps with turn-by-turn navigation from your current location"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate to Branch (Google Maps)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Customer Special Notes */}
            {booking.note && (
              <div className="card-groomish p-5 bg-amber-50/70 border border-amber-200/70 flex items-start gap-3 shadow-soft">
                <Tag className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    Customer Special Notes:
                  </span>
                  <p className="text-xs text-amber-800 italic mt-0.5 leading-relaxed">
                    "{booking.note}"
                  </p>
                </div>
              </div>
            )}

            {/* Services Section */}
            <div className="card-groomish p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-groomish-slate/10 pb-4">
                <div>
                  <h2 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-groomish-orange" />
                    <span>Selected Salon Services</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-groomish-orangeLight text-groomish-orange rounded-full">
                      {booking.items?.length || 0}
                    </span>
                  </h2>
                  <p className="text-xs text-groomish-slate/60 mt-0.5">
                    Customize your visit by adding or removing services.
                  </p>
                </div>

                {isModifiable && (
                  <button
                    onClick={handleOpenAddService}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-groomish-orange bg-groomish-orangeLight hover:bg-groomish-orange hover:text-white rounded-xl transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Service</span>
                  </button>
                )}
              </div>

              {/* Service Items List */}
              <div className="divide-y divide-groomish-slate/10">
                {booking.items && booking.items.length > 0 ? (
                  groupBookingServices(booking.items).map((grp, idx) => (
                    <div
                      key={grp.serviceId || grp.serviceName || idx}
                      className="py-3.5 flex items-center justify-between gap-4 transition hover:bg-groomish-cream/30 px-2 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-groomish-orange/10 text-groomish-orange font-bold flex items-center justify-center shrink-0 text-xs">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-groomish-slate truncate">
                              {grp.serviceName}{grp.quantity > 1 ? ` X ${grp.quantity}` : ""}
                            </h3>
                            {grp.quantity > 1 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orange text-white shrink-0">
                                × {grp.quantity}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-groomish-slate/50">
                            {grp.durationMinutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {grp.durationMinutes} mins
                              </span>
                            )}
                            {grp.quantity > 1 && (
                              <span>• ₹{grp.unitPrice} each</span>
                            )}
                            {grp.status && (
                              <span className="text-[10px] uppercase font-bold text-groomish-slate/60">
                                • {grp.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-heading font-extrabold text-groomish-slate">
                          ₹{grp.totalPrice}
                        </span>

                        {isModifiable && booking.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveService(grp.itemIds[grp.itemIds.length - 1], grp.serviceName)}
                            disabled={actionLoading}
                            className="p-1.5 text-groomish-slate/40 hover:text-groomish-crimson hover:bg-groomish-crimson/10 rounded-lg transition"
                            title={grp.quantity > 1 ? "Remove 1 quantity" : "Remove Service"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-groomish-slate/60 py-4 text-center">
                    No services listed for this appointment.
                  </p>
                )}
              </div>
            </div>

            {/* Attached Retail Products (if any) */}
            {booking.products && booking.products.length > 0 && (
              <div className="card-groomish p-6 sm:p-8 space-y-4">
                <div className="border-b border-groomish-slate/10 pb-4">
                  <h2 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-groomish-orange" />
                    <span>Retail Products & Aftercare</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-groomish-orangeLight text-groomish-orange rounded-full">
                      {booking.products.length}
                    </span>
                  </h2>
                  <p className="text-xs text-groomish-slate/60 mt-0.5">
                    Salon products recommended and applied by your stylist during appointment.
                  </p>
                </div>

                <div className="divide-y divide-groomish-slate/10">
                  {booking.products.map((prod) => (
                    <div
                      key={prod.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-groomish-slate/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-groomish-cream border border-groomish-slate/10 flex items-center justify-center text-groomish-slate/40">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-groomish-slate truncate">
                            {prod.productName}
                          </h4>
                          <p className="text-[11px] text-groomish-slate/50">
                            {prod.brand && <span>{prod.brand} • </span>}
                            <span>Qty: {prod.quantity} × ₹{prod.unitPrice}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-sm font-bold text-groomish-slate shrink-0">
                        ₹{prod.totalPrice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Reviews Section for Completed Appointments */}
            {booking.status === "COMPLETED" && (
              <div
                ref={reviewsRef}
                id="reviews-section"
                className="card-groomish p-6 sm:p-8 space-y-6 border-2 border-groomish-gold/40 bg-gradient-to-br from-amber-50/40 via-white to-groomish-orangeLight/20 shadow-soft animate-fade-in"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-groomish-slate/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-groomish-gold/20 text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-groomish-gold fill-current" />
                        Verified Client Reviews
                      </span>
                      {booking.customerReviews && booking.customerReviews.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-groomish-greenLight text-groomish-green flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{booking.customerReviews.length} Submitted</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                      <Star className="w-5 h-5 text-groomish-gold fill-current" />
                      <span>Rate Your Services & Products</span>
                    </h2>
                    <p className="text-xs text-groomish-slate/60 mt-0.5">
                      Share your experience for each unique service and product individually to help us reward top stylists and improve beauty care.
                    </p>
                  </div>
                </div>

                {/* Services Review Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-groomish-slate/70 uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-groomish-orange" />
                    <span>Salon Services ({groupedServices.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {groupedServices.map((grp) => {
                      const rev = (booking.customerReviews || []).find(
                        (r) => r.serviceId === grp.serviceId
                      );

                      return (
                        <div
                          key={grp.serviceId || grp.serviceName}
                          className={`p-4 rounded-2xl border transition ${
                            rev
                              ? "bg-white/95 border-groomish-green/35 shadow-sm"
                              : "bg-white border-groomish-slate/15 hover:border-groomish-gold/60 shadow-soft"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-groomish-slate truncate">
                                {grp.serviceName}
                              </h4>
                              <p className="text-[11px] text-groomish-slate/50">
                                {grp.durationMinutes ? `${grp.durationMinutes} mins • ` : ""}₹{grp.unitPrice}
                              </p>
                            </div>
                            {rev ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-groomish-greenLight text-groomish-green flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Rated</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                Awaiting Rating
                              </span>
                            )}
                          </div>

                          {rev ? (
                            <div className="mt-3 pt-3 border-t border-groomish-slate/10 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= rev.rating
                                          ? "fill-groomish-gold text-groomish-gold"
                                          : "text-groomish-slate/20"
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs font-bold text-groomish-slate ml-1">
                                    {rev.rating}.0
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleOpenServiceReview(grp)}
                                  className="text-xs font-bold text-groomish-orange hover:underline"
                                >
                                  Edit Review
                                </button>
                              </div>
                              {rev.review && (
                                <p className="text-xs text-groomish-slate/80 bg-groomish-cream/70 p-2.5 rounded-xl italic">
                                  "{rev.review}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-groomish-slate/10 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-groomish-slate/30">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className="w-3.5 h-3.5" />
                                ))}
                              </div>
                              <button
                                onClick={() => handleOpenServiceReview(grp)}
                                className="px-3.5 py-1.5 bg-groomish-orange hover:bg-groomish-orangeHover text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-soft"
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>Rate Service</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Products Review Cards (if products attached) */}
                {booking.products && booking.products.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-groomish-slate/70 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-groomish-orange" />
                      <span>Purchased Retail Products ({booking.products.length})</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {booking.products.map((prod) => {
                        const prodId = prod.productId || prod.id;
                        const rev = (booking.customerReviews || []).find(
                          (r) => r.productId === prodId
                        );

                        return (
                          <div
                            key={prodId}
                            className={`p-4 rounded-2xl border transition ${
                              rev
                                ? "bg-white/95 border-groomish-green/35 shadow-sm"
                                : "bg-white border-groomish-slate/15 hover:border-groomish-gold/60 shadow-soft"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {prod.image ? (
                                  <img
                                    src={prod.image}
                                    alt={prod.productName}
                                    className="w-9 h-9 rounded-lg object-cover border border-groomish-slate/10 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-groomish-cream border border-groomish-slate/10 flex items-center justify-center text-groomish-slate/40 shrink-0">
                                    <ShoppingBag className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-groomish-slate truncate">
                                    {prod.productName}
                                  </h4>
                                  <p className="text-[11px] text-groomish-slate/50">
                                    {prod.brand ? `${prod.brand} • ` : ""}₹{prod.unitPrice}
                                  </p>
                                </div>
                              </div>
                              {rev ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-groomish-greenLight text-groomish-green flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Rated</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                  Awaiting Rating
                                </span>
                              )}
                            </div>

                            {rev ? (
                              <div className="mt-3 pt-3 border-t border-groomish-slate/10 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3.5 h-3.5 ${
                                          s <= rev.rating
                                            ? "fill-groomish-gold text-groomish-gold"
                                            : "text-groomish-slate/20"
                                        }`}
                                      />
                                    ))}
                                    <span className="text-xs font-bold text-groomish-slate ml-1">
                                      {rev.rating}.0
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleOpenProductReview(prod)}
                                    className="text-xs font-bold text-groomish-orange hover:underline"
                                  >
                                    Edit Review
                                  </button>
                                </div>
                                {rev.review && (
                                  <p className="text-xs text-groomish-slate/80 bg-groomish-cream/70 p-2.5 rounded-xl italic">
                                    "{rev.review}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-3 pt-3 border-t border-groomish-slate/10 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-groomish-slate/30">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className="w-3.5 h-3.5" />
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleOpenProductReview(prod)}
                                  className="px-3.5 py-1.5 bg-groomish-orange hover:bg-groomish-orangeHover text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-soft"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  <span>Rate Product</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bill Summary & Breakdown */}
            <div className="card-groomish p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2 border-b border-groomish-slate/10 pb-3">
                <CreditCard className="w-5 h-5 text-groomish-orange" />
                <span>Invoice Breakdown</span>
              </h2>

              <div className="space-y-2.5 text-xs text-groomish-slate/80">
                <div className="flex justify-between py-1">
                  <span>Gross Total</span>
                  <span className="font-semibold">₹{booking.totalAmount}</span>
                </div>

                {booking.couponApplied && (
                  <div className="flex justify-between py-1 text-groomish-green font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupon Applied ({booking.couponApplied})</span>
                    </span>
                    <span>-₹{(booking.totalAmount - booking.pricePaid).toFixed(0)}</span>
                  </div>
                )}

                {/* Payment Method & Status */}
                <div className="flex justify-between items-center py-1">
                  <span>Payment Method</span>
                  <span className="font-bold text-groomish-slate">
                    {booking.paymentMethod === "CASH"
                      ? "Pay at Salon"
                      : booking.paymentMethod === "UPI"
                      ? "UPI / QR"
                      : booking.paymentMethod === "CARD"
                      ? "Card / Net Banking"
                      : booking.paymentMethod || "Pay at Salon"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span>Payment Status</span>
                  <div>
                    {booking.status === "CANCELLED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertCircle className="w-3 h-3" />
                        <span>Cancelled • No Payment Received</span>
                      </span>
                    ) : (booking.status === "COMPLETED" || booking.paymentStatus === "COMPLETED") ? (
                      booking.paymentMethod === "CASH" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-groomish-greenLight text-groomish-green border border-groomish-green/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid at Salon</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-groomish-greenLight text-groomish-green border border-groomish-green/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid Online ({booking.paymentMethod || "UPI"})</span>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3" />
                        <span>Payment Pending (Pay at Salon)</span>
                      </span>
                    )}
                  </div>
                </div>

                {booking.invoiceNumber && booking.status !== "CANCELLED" && (
                  <div className="flex justify-between items-center py-1 text-[11px] text-groomish-slate/60">
                    <span>Invoice Ref</span>
                    <span className="font-mono font-bold text-groomish-slate/80">{booking.invoiceNumber}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-groomish-slate/15 pt-2 flex justify-between text-base font-heading font-extrabold text-groomish-slate">
                  <span>Total Amount</span>
                  <span className="text-groomish-orange">₹{booking.pricePaid}</span>
                </div>
              </div>

              {/* Pay Online Anytime in Active Window Callout */}
              {(booking.paymentStatus === "PENDING" || !booking.paymentStatus || booking.paymentMethod === "CASH") &&
                booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-groomish-orangeLight/80 via-amber-50 to-groomish-orangeLight/60 border border-groomish-orange/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-groomish-orange font-bold text-xs uppercase tracking-wider">
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Pay Online Option Active</span>
                      </div>
                      <p className="text-xs text-groomish-slate/80 mt-0.5 leading-relaxed">
                        Chose <strong>Pay at Salon</strong>? You can pay anytime before or during your appointment via UPI or Card to skip the counter queue!
                      </p>
                    </div>
                    <button
                      onClick={handleOpenPayOnline}
                      className="px-5 py-2.5 bg-groomish-orange hover:bg-groomish-orangeHover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-glowOrange transition shrink-0"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>⚡ Pay Online Now (₹{booking.pricePaid})</span>
                    </button>
                  </div>
                )}

              {/* Loyalty Points Section */}
              {booking.status === "CANCELLED" ? (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Reward Points Cancelled:</strong> 0 VIP points credited (appointment was cancelled).
                  </span>
                </div>
              ) : booking.status === "COMPLETED" ? (
                <div className="p-3 bg-groomish-greenLight/60 rounded-xl border border-groomish-green/30 flex items-center gap-2 text-xs text-groomish-slate">
                  <Sparkles className="w-4 h-4 text-groomish-green shrink-0" />
                  <span>
                    ✓ <strong>Confirmed:</strong> You earned <strong className="font-bold text-groomish-green">{booking.expectedRewardPoints || Math.floor(booking.pricePaid / 100)} VIP points</strong> on this completed appointment!
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300/60 flex items-center gap-2 text-xs text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    ⏳ <strong>Pending Reward:</strong> <strong className="font-bold text-amber-700">+{booking.expectedRewardPoints || Math.floor(booking.pricePaid / 100)} VIP points</strong> will be confirmed and added to your wallet once your appointment is completed at the salon.
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => navigate("/customer/bookings")}
                className="btn-secondary text-xs px-5 py-2.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to All Bookings</span>
              </button>

              <div className="flex items-center gap-2.5 flex-wrap">
                {booking.status === "COMPLETED" && (
                  <button
                    onClick={handleRateExperienceClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-groomish-orange bg-groomish-orangeLight hover:bg-groomish-orange hover:text-white rounded-xl transition shadow-soft"
                  >
                    <Star className="w-4 h-4 fill-current text-groomish-gold" />
                    <span>Rate Experience</span>
                  </button>
                )}

                {isModifiable && (
                  <>
                    <button
                      onClick={handleOpenReschedule}
                      disabled={actionLoading}
                      className="btn-secondary text-xs px-4 py-2.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reschedule Slot</span>
                    </button>

                    <button
                      onClick={handleCancelBooking}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl border border-groomish-crimson/30 text-groomish-crimson hover:bg-groomish-crimson/10 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Cancel Appointment</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* ---------------- ADD SERVICE MODAL ---------------- */}
      <ModalWrapper
        open={addServiceModalOpen}
        onClose={() => setAddServiceModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2">
                <Scissors className="w-5 h-5 text-groomish-orange" />
                <span>Add Service to Appointment</span>
              </h3>
              <p className="text-xs text-groomish-slate/60 mt-0.5">
                Select additional salon care to attach to this visit.
              </p>
            </div>
            <button
              onClick={() => setAddServiceModalOpen(false)}
              className="p-1.5 rounded-xl text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar with clear button */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-groomish-slate/40" />
            <input
              type="text"
              placeholder="Search salon services by name or category..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:border-groomish-orange focus:bg-white transition"
            />
            {serviceSearch && (
              <button
                type="button"
                onClick={() => setServiceSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {serviceCategories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedServiceCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition ${
                    selectedServiceCategory === cat
                      ? "bg-groomish-orange text-white shadow-soft"
                      : "bg-groomish-cream hover:bg-groomish-slate/10 text-groomish-slate/70"
                  }`}
                >
                  {cat === "ALL" ? "All Services" : cat}
                </button>
              ))}
            </div>
          )}

          {/* Service options list */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {serviceLoading ? (
              <div className="py-10 text-center text-xs text-groomish-slate/50">
                <RefreshCw className="w-5 h-5 animate-spin text-groomish-orange mx-auto mb-2" />
                Loading salon services...
              </div>
            ) : filteredServices.length > 0 ? (
              filteredServices.map((srv) => {
                const bookedCount = getBookedCount(srv.id);
                return (
                  <div
                    key={srv.id}
                    className="p-3 rounded-2xl border border-groomish-slate/10 hover:border-groomish-orange/40 flex items-center justify-between gap-3 transition hover:bg-groomish-cream/30 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-groomish-cream overflow-hidden border border-groomish-slate/10 shrink-0">
                        <img
                          src={
                            srv.image ||
                            "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80"
                          }
                          alt={srv.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-groomish-slate truncate">
                            {srv.name}
                          </h4>
                          {bookedCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-greenLight text-groomish-green">
                              In Visit ({bookedCount})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                          {srv.durationMinutes || 30} mins • {srv.categoryName || "Salon Care"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-groomish-slate block">
                          ₹{srv.price}
                        </span>
                        {srv.mrp && srv.mrp > srv.price && (
                          <span className="text-[10px] text-groomish-slate/40 line-through">
                            ₹{srv.mrp}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddService(srv.id)}
                        disabled={addingServiceId === srv.id}
                        className="btn-primary text-xs px-3.5 py-1.5 font-bold shadow-soft flex items-center gap-1"
                      >
                        {addingServiceId === srv.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{bookedCount > 0 ? "Add Again" : "Add"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Scissors className="w-8 h-8 text-groomish-slate/20 mx-auto mb-2" />
                <p className="text-xs font-bold text-groomish-slate/70">
                  {serviceSearch.trim() || selectedServiceCategory !== "ALL"
                    ? "No services matched your search"
                    : "No salon services found."}
                </p>
                {(serviceSearch.trim() || selectedServiceCategory !== "ALL") && (
                  <button
                    onClick={() => {
                      setServiceSearch("");
                      setSelectedServiceCategory("ALL");
                    }}
                    className="mt-2 text-xs text-groomish-orange font-bold hover:underline"
                  >
                    Clear Search Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </ModalWrapper>

      {/* ---------------- RESCHEDULE MODAL ---------------- */}
      <ModalWrapper
        open={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <h3 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2">
              <Calendar className="w-5 h-5 text-groomish-orange" />
              <span>Reschedule Appointment</span>
            </h3>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Pick a new date and time for your salon appointment.
            </p>
          </div>

          {rescheduleError && (
            <div className="p-3 rounded-xl bg-groomish-crimson/10 text-groomish-crimson text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rescheduleError}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                New Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate focus:outline-none focus:border-groomish-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                New Time Slot
              </label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate focus:outline-none focus:border-groomish-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                Note / Stylist Instruction (optional)
              </label>
              <textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate focus:outline-none focus:border-groomish-orange"
                placeholder="E.g. prefer evening slot, requested master stylist"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-groomish-slate/10">
            <button
              type="button"
              onClick={() => setRescheduleModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rescheduleLoading}
              className="btn-primary text-xs px-5 py-2"
            >
              {rescheduleLoading ? "Saving..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* ---------------- REVIEW MODAL ---------------- */}
      {reviewModalOpen && booking && activeReviewItem && (
        <LeaveReviewModal
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setActiveReviewItem(null);
          }}
          bookingId={booking.id}
          serviceId={activeReviewItem.serviceId}
          serviceName={activeReviewItem.serviceName}
          productId={activeReviewItem.productId}
          productName={activeReviewItem.productName}
          initialRating={activeReviewItem.initialRating}
          initialReview={activeReviewItem.initialReview}
          onReviewSubmitted={loadBooking}
        />
      )}

      {/* ---------------- PAY ONLINE MODAL ---------------- */}
      <ModalWrapper
        open={payModalOpen}
        onClose={() => !payLoading && setPayModalOpen(false)}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePayOnlineSubmit} className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              Active Window Checkout
            </span>
            <h3 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-groomish-orange" />
              <span>Complete Payment Online</span>
            </h3>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Pay now securely to skip counter payment and collect loyalty points immediately.
            </p>
          </div>

          {paySuccess ? (
            <div className="py-8 text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 bg-groomish-green/15 text-groomish-green rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-groomish-slate">Payment Successful!</h4>
              <p className="text-xs text-groomish-slate/60">
                Your payment of ₹{booking?.pricePaid} has been verified and recorded.
              </p>
            </div>
          ) : (
            <>
              {payError && (
                <div className="p-3 rounded-xl bg-groomish-crimson/10 text-groomish-crimson text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Amount Box */}
              <div className="p-4 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-groomish-slate/60 block">
                    Amount Due
                  </span>
                  <span className="text-2xl font-heading font-extrabold text-groomish-orange">
                    ₹{booking?.pricePaid}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-groomish-slate/50 block">VIP Loyalty Points</span>
                  <span className="font-bold text-groomish-green flex items-center gap-1 justify-end">
                    <Sparkles className="w-3.5 h-3.5" />
                    +{Math.floor((booking?.pricePaid || 0) / 100)} Points
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-groomish-slate/80 mb-2">
                  Select Online Method
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayMethod("UPI")}
                    className={`p-3 rounded-xl border text-center transition ${
                      payMethod === "UPI"
                        ? "bg-groomish-orangeLight border-groomish-orange text-groomish-orange font-bold shadow-soft"
                        : "bg-white border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs block">UPI / QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("CARD")}
                    className={`p-3 rounded-xl border text-center transition ${
                      payMethod === "CARD"
                        ? "bg-groomish-orangeLight border-groomish-orange text-groomish-orange font-bold shadow-soft"
                        : "bg-white border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs block">Card / NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Interactive Preview of Method */}
              {payMethod === "UPI" ? (
                <div className="p-3.5 rounded-xl bg-white border border-groomish-slate/15 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-groomish-slate/70">
                    <span className="font-semibold">UPI ID:</span>
                    <span className="font-mono font-bold text-groomish-slate">groomishnow@okhdfcbank</span>
                  </div>
                  <div className="text-[11px] text-groomish-slate/50">
                    Instant zero-fee simulation. Supports Google Pay, PhonePe, Paytm, and BHIM UPI.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white border border-groomish-slate/15 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-groomish-slate/70">
                    <span className="font-semibold">Instant Card Simulation:</span>
                    <span className="font-mono font-bold text-groomish-slate">Visa / Mastercard / RuPay</span>
                  </div>
                  <div className="text-[11px] text-groomish-slate/50">
                    Protected with 256-bit salon tokenized encryption.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-groomish-slate/10">
                <button
                  type="button"
                  disabled={payLoading}
                  onClick={() => setPayModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="btn-auth flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {payLoading ? "Processing Payment..." : `Pay ₹${booking?.pricePaid} Online`}
                  </span>
                </button>
              </div>
            </>
          )}
        </form>
      </ModalWrapper>

      <Footer />
    </div>
  );
}
