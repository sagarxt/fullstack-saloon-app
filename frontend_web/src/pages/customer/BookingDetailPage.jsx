import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  createRazorpayOrder,
  verifyRazorpayPayment,
  getSlotAvailability,
} from "../../api/customer";
import { getPublicServicesApi } from "../../api/service";
import { storeApi } from "../../api/store";
import { extractList } from "../../utils/dataHelper";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import { showConfirm, showAlert } from "../../context/ConfirmContext";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import CustomDatePicker from "../../components/common/CustomDatePicker";
import { generateSlots } from "../../utils/slots";
import { getBranchNavigationUrl } from "../../utils/mapHelper";

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
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
  Store,
  UserCheck,
} from "lucide-react";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reviewsRef = useRef(null);
  const { calculateCoins, config } = useGroomCoin();

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
  const [rescheduleUnavailableSlots, setRescheduleUnavailableSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduleNow, setRescheduleNow] = useState(new Date());

  const rescheduleTimeSlots = generateSlots("09:00", "21:00", 30);

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
      // 1. Create Razorpay Order on Backend
      const orderRes = await createRazorpayOrder({ bookingId: id });
      const orderData = orderRes.data;

      // 2. Open Razorpay Gateway popup if client script is available
      if (typeof window !== "undefined" && window.Razorpay && orderData.keyId) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Groomish Now",
          description: `Salon Booking Payment (${orderData.bookingCode || id})`,
          image: "https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png",
          order_id: orderData.orderId?.startsWith("order_sim_") ? undefined : orderData.orderId,
          prefill: {
            name: orderData.customerName || "",
            email: orderData.customerEmail || "",
            contact: orderData.customerPhone || "",
          },
          notes: {
            bookingId: id,
            bookingCode: orderData.bookingCode || "",
          },
          theme: {
            color: "#FA7B47",
          },
          modal: {
            ondismiss: () => {
              setPayLoading(false);
            },
          },
          handler: async (response) => {
            try {
              setPayLoading(true);
              await verifyRazorpayPayment({
                bookingId: id,
                razorpayOrderId: response.razorpay_order_id || orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setPaySuccess(true);
              setTimeout(async () => {
                setPayModalOpen(false);
                setPaySuccess(false);
                await loadBooking();
              }, 1200);
            } catch (err) {
              setPayError(err.response?.data?.message || "Payment signature verification failed.");
            } finally {
              setPayLoading(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          setPayError(resp.error?.description || "Payment failed on Razorpay.");
          setPayLoading(false);
        });
        rzp.open();
      } else {
        // Fallback simulation if Razorpay popup is blocked
        await checkoutPayment({
          bookingId: id,
          paymentMethod: "ONLINE",
        });
        setPaySuccess(true);
        setTimeout(async () => {
          setPayModalOpen(false);
          setPaySuccess(false);
          await loadBooking();
        }, 1200);
      }
    } catch (err) {
      setPayError(err.response?.data?.message || "Failed to process payment. Please try again.");
      setPayLoading(false);
    }
  };

  const loadBooking = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyBookingDetails(id);
      setBooking(res.data);
      if (res.data?.id && res.data.id !== id) {
        navigate(`/customer/bookings/${res.data.id}`, { replace: true });
      }
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
    if ((params.get("pay") === "true" || params.get("pay") === "online") && booking && (!booking.payment || booking.payment.status !== "COMPLETED")) {
      handleOpenPayOnline();
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

  const handleOpenStoreReview = () => {
    const storeId = booking?.storeId || booking?.store?.id;
    const storeName = booking?.storeName || booking?.store?.name || "Salon Branch";
    const existing = (booking?.customerReviews || []).find(
      (r) => (r.storeId && r.storeId === storeId) || (!r.serviceId && !r.productId)
    );
    setActiveReviewItem({
      type: "STORE",
      storeId: storeId,
      storeName: storeName,
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
      const normalized = (list || []).map((s) => ({
        ...s,
        id: s.serviceId || s.id,
        serviceId: s.serviceId || s.id,
      }));
      setAvailableServices(normalized);
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
    if (!serviceId) {
      console.error("Missing serviceId when attempting to add service to booking");
      await showAlert({
        title: "Unable to Add Service",
        message: "Invalid salon service selected. Please refresh the page and try again.",
        variant: "danger",
      });
      return;
    }
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
    const todayStr = getLocalDateStr();
    if (booking?.scheduledAt) {
      const dt = new Date(booking.scheduledAt);
      const bDateStr = getLocalDateStr(dt);
      const hh = String(dt.getHours()).padStart(2, "0");
      const min = String(dt.getMinutes()).padStart(2, "0");
      const initialDate = bDateStr >= todayStr ? bDateStr : todayStr;
      setRescheduleDate(initialDate);
      setRescheduleTime(`${hh}:${min}`);
    } else {
      setRescheduleDate(todayStr);
      setRescheduleTime("");
    }
    setRescheduleNotes(booking?.note || "");
    setRescheduleModalOpen(true);
  };

  const fetchRescheduleSlots = useCallback(async (isManual = false) => {
    if (!rescheduleDate) return;
    setLoadingRescheduleSlots(true);
    try {
      const primaryServiceId =
        booking?.items?.find((i) => i.serviceId || i.service?.id)?.serviceId ||
        booking?.items?.find((i) => i.serviceId || i.service?.id)?.service?.id ||
        null;
      const res = await getSlotAvailability(rescheduleDate, primaryServiceId);
      setRescheduleUnavailableSlots(res.data?.unavailableSlots || []);
    } catch (err) {
      console.error("Failed to load branch reschedule slots:", err);
      setRescheduleUnavailableSlots([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  }, [rescheduleDate, booking]);

  useEffect(() => {
    if (rescheduleModalOpen && rescheduleDate) {
      fetchRescheduleSlots();
      const pollInterval = setInterval(() => {
        fetchRescheduleSlots();
      }, 30000);
      return () => clearInterval(pollInterval);
    }
  }, [rescheduleModalOpen, rescheduleDate, fetchRescheduleSlots]);

  useEffect(() => {
    if (!rescheduleModalOpen) return;
    const tick = setInterval(() => {
      setRescheduleNow(new Date());
    }, 15000);
    return () => clearInterval(tick);
  }, [rescheduleModalOpen]);

  const isRescheduleSlotPast = useCallback((timeStr) => {
    const today = getLocalDateStr(rescheduleNow);
    if (rescheduleDate !== today) return false;
    const [h, m] = timeStr.split(":").map(Number);
    const slotDate = new Date(rescheduleNow);
    slotDate.setHours(h, m, 0, 0);
    return slotDate <= rescheduleNow;
  }, [rescheduleDate, rescheduleNow]);

  useEffect(() => {
    if (rescheduleTime && isRescheduleSlotPast(rescheduleTime)) {
      setRescheduleTime("");
    }
  }, [rescheduleDate, rescheduleTime, isRescheduleSlotPast]);

  /* Submit Reschedule */
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError("Please select both a date and a time slot.");
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
      case "CHECKED_IN":
      case "IN_PROGRESS":
        return "bg-sky-100 text-sky-800 border-sky-300";
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

  const isModifiable =
    booking?.status !== "CANCELLED" &&
    booking?.status !== "COMPLETED" &&
    booking?.status !== "CHECKED_IN" &&
    booking?.status !== "IN_PROGRESS";

  // Group categories from availableServices for quick filter pills
  const serviceCategories = [
    "ALL",
    ...Array.from(new Set(availableServices.map((s) => s.categoryName).filter(Boolean))),
  ];

  const getBookedCount = (targetServiceId) => {
    if (!targetServiceId || !booking?.items) return 0;
    return booking.items.filter(
      (it) => it.serviceId === targetServiceId || it.service?.id === targetServiceId
    ).length;
  };

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

  const invoiceBreakdown = useMemo(() => {
    if (!booking) return null;

    // Services MRP sum
    const servicesMrp = (booking.items || []).reduce((sum, item) => {
      const price = Number(item.servicePriceSnapshot ?? item.price ?? item.service?.price ?? 0);
      const rawMrp = Number(item.subServiceMrp ?? item.mrp ?? item.serviceMrp ?? item.service?.mrp ?? price);
      const mrp = Math.max(rawMrp, price);
      return sum + mrp;
    }, 0);

    // Products MRP sum
    const productsMrp = (booking.products || []).reduce((sum, prod) => {
      const price = Number(prod.unitPrice ?? 0);
      const rawMrp = Number(prod.mrp ?? prod.productMrp ?? price);
      const mrp = Math.max(rawMrp, price);
      const qty = Number(prod.quantity ?? 1);
      return sum + (mrp * qty);
    }, 0);

    const calculatedTotalMrp = servicesMrp + productsMrp;
    const baseAmount = Number(booking.totalAmount ?? 0);
    const subtotal = calculatedTotalMrp > baseAmount ? calculatedTotalMrp : baseAmount;
    const mrpDiscount = Math.max(0, subtotal - baseAmount);

    // Coupon or Voucher discount
    const paid = Number(booking.pricePaid ?? baseAmount);
    const codeDiscount = Math.max(0, baseAmount - paid);

    const isVoucher = Boolean(
      booking.couponApplied &&
      (booking.couponApplied.toUpperCase().includes("VOUCH") ||
       booking.couponApplied.toUpperCase().includes("VIP"))
    );

    return {
      subtotal,
      mrpDiscount,
      couponOrVoucherCode: booking.couponApplied,
      isVoucher,
      codeDiscount,
      finalPayable: paid,
    };
  }, [booking]);

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-3.5 text-xs text-groomish-slate/60">
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
          <div className="space-y-4">
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

            {/* Checked In In-Progress Banner */}
            {(booking.status === "CHECKED_IN" || booking.status === "IN_PROGRESS") && (
              <div className="card-groomish p-4 bg-sky-50 border-2 border-sky-300 text-sky-950 text-xs flex items-center gap-3.5 shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-sky-950">You're Checked In — Services In Progress</h4>
                  <p className="mt-0.5 text-sky-800 leading-relaxed">
                    Welcome to Groomish Now! Your appointment is currently underway with your stylist. Relax and enjoy your bespoke grooming treatments.
                  </p>
                </div>
              </div>
            )}

            {/* Header Hero Banner */}
            <div className="card-groomish p-4 sm:p-5 bg-gradient-to-br from-white to-groomish-cream/40 border border-groomish-slate/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-groomish-orange/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-groomish-slate/10 pb-4 mb-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date & Time */}
                <div className="p-3.5 rounded-xl bg-groomish-cream/70 border border-groomish-slate/10 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-groomish-orange/15 text-groomish-orange flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-groomish-orange tracking-wider">
                      {booking.bookingItems && booking.bookingItems.length > 0
                        ? "Appointment Schedule"
                        : "Order & Salon Pickup Schedule"}
                    </div>
                    <div className="text-sm font-bold text-groomish-slate mt-0.5">
                      {booking.scheduledAt
                        ? new Date(booking.scheduledAt).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                        : "To be confirmed"}
                    </div>
                    <div className="text-xs text-groomish-slate/60 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-groomish-slate/40" />
                      <span className="font-semibold text-groomish-slate">
                        {booking.scheduledAt
                          ? new Date(booking.scheduledAt).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                          : ""}
                      </span>
                      {totalDuration > 0 && <span>({totalDuration} mins duration)</span>}
                    </div>
                  </div>
                </div>

                {/* Salon Branch */}
                <div className="p-3.5 rounded-xl bg-groomish-cream/70 border border-groomish-slate/10 flex flex-col justify-between gap-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-groomish-orange/15 text-groomish-orange flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase font-bold text-groomish-orange tracking-wider">
                        Salon Branch
                      </div>
                      <div className="text-sm font-bold text-groomish-slate mt-0.5 truncate">
                        {booking.storeName || "Groomish Now Flagship Lounge"}
                      </div>
                      <div className="text-xs text-groomish-slate/60 mt-0.5 line-clamp-1">
                        {booking.storeAddress || "Indiranagar 100ft Road, Bengaluru"}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Button (Rating moved cleanly to Feedback Section at bottom) */}
                  <div>
                    <a
                      href={getBranchNavigationUrl(booking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-groomish-slate/10 hover:bg-groomish-slate/20 text-groomish-slate font-bold text-xs transition-all duration-200"
                      title="Open Google Maps with turn-by-turn navigation"
                      aria-label={`Directions to ${booking.storeName || "Salon Branch"} on Google Maps`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-groomish-orange" />
                      <span>Directions (Maps)</span>
                    </a>
                  </div>
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
            <div className="card-groomish p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-groomish-slate/10 pb-3">
                <div>
                  <h2 className="text-base font-heading font-bold text-groomish-slate flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-groomish-orange" />
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-groomish-orange bg-groomish-orangeLight hover:bg-groomish-orange hover:text-white rounded-lg transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service</span>
                  </button>
                )}
              </div>

              {/* Service Items List */}
              <div className="divide-y divide-groomish-slate/10">
                {booking.items && booking.items.length > 0 ? (
                  groupBookingServices(booking.items).map((grp, idx) => (
                    <div
                      key={grp.key || `${grp.serviceId || ""}_${grp.serviceName || ""}_${idx}`}
                      className="py-2.5 flex items-center justify-between gap-3 transition hover:bg-groomish-cream/30 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {grp.image ? (
                          <img
                            src={grp.image}
                            alt={grp.serviceName}
                            className="w-10 h-10 rounded-lg object-cover border border-groomish-slate/10 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-groomish-cream border border-groomish-slate/10 flex items-center justify-center text-groomish-orange shrink-0">
                            <Scissors className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-groomish-slate truncate">
                              {grp.serviceName}
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
                        <div className="text-right">
                          <span className="text-sm font-heading font-extrabold text-groomish-slate block">
                            ₹{grp.totalPrice}
                          </span>
                          {grp.totalMrp && grp.totalMrp > grp.totalPrice && (
                            <span className="text-[11px] text-groomish-slate/40 line-through block">
                              ₹{grp.totalMrp}
                            </span>
                          )}
                        </div>

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
              <div className="card-groomish p-4 sm:p-5 space-y-3">
                <div className="border-b border-groomish-slate/10 pb-3">
                  <h2 className="text-base font-heading font-bold text-groomish-slate flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-groomish-orange" />
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
                      className="py-2.5 flex items-center justify-between gap-3"
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
                            {prod.mrp && prod.mrp > prod.unitPrice && (
                              <span className="text-groomish-slate/40 line-through ml-1.5">
                                (MRP ₹{prod.mrp})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-groomish-slate block">
                          ₹{prod.totalPrice}
                        </span>
                        {prod.mrp && prod.mrp > prod.unitPrice && (
                          <span className="text-[11px] text-groomish-slate/40 line-through block">
                            ₹{prod.mrp * prod.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bill Summary & Breakdown */}
            <div className="card-groomish p-4 sm:p-5 space-y-3">
              <h2 className="text-base font-heading font-bold text-groomish-slate flex items-center gap-2 border-b border-groomish-slate/10 pb-2.5">
                <CreditCard className="w-4 h-4 text-groomish-orange" />
                <span>Invoice Breakdown</span>
              </h2>

              <div className="space-y-2 text-xs text-groomish-slate/80">
                <div className="flex justify-between py-1">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{invoiceBreakdown?.subtotal ?? booking.totalAmount}</span>
                </div>

                {invoiceBreakdown?.mrpDiscount > 0 && (
                  <div className="flex justify-between py-1 text-groomish-green font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Discount on MRP</span>
                    </span>
                    <span>-₹{invoiceBreakdown.mrpDiscount}</span>
                  </div>
                )}

                {invoiceBreakdown?.couponOrVoucherCode && !invoiceBreakdown.isVoucher && (
                  <div className="flex justify-between py-1 text-groomish-green font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupon Applied ({invoiceBreakdown.couponOrVoucherCode})</span>
                    </span>
                    <span>-₹{invoiceBreakdown.codeDiscount}</span>
                  </div>
                )}

                {invoiceBreakdown?.couponOrVoucherCode && invoiceBreakdown.isVoucher && (
                  <div className="flex justify-between py-1 text-groomish-green font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Voucher Applied ({invoiceBreakdown.couponOrVoucherCode})</span>
                    </span>
                    <span>-₹{invoiceBreakdown.codeDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between py-1">
                  <span className="text-groomish-slate/70">Salon Hygiene & Taxes</span>
                  <span className="text-groomish-green font-bold text-[11px]">FREE</span>
                </div>

                {/* Payment Method & Status */}
                <div className="flex justify-between items-center py-1">
                  <span>Payment Method</span>
                  <span className="font-bold text-groomish-slate">
                    {booking.paymentMethod === "CASH"
                      ? "Pay at Salon"
                      : booking.paymentMethod === "ONLINE"
                        ? "Online Payment"
                        : booking.paymentMethod === "UPI"
                          ? "Online (UPI)"
                          : booking.paymentMethod === "CARD"
                            ? "Online (Card)"
                            : booking.paymentMethod || "Pay at Salon"}
                  </span>
                </div>

                {/* Payment Status & Balance Breakdown */}
                {(() => {
                  const totalAmount = Number(booking.totalAmount ?? booking.pricePaid ?? 0);
                  const pricePaid = Number(booking.pricePaid ?? 0);
                  const remainingAmount = Number(
                    booking.remainingAmount !== undefined && booking.remainingAmount !== null
                      ? booking.remainingAmount
                      : Math.max(0, totalAmount - pricePaid)
                  );
                  const isPartiallyPaid = pricePaid > 0.01 && remainingAmount > 0.01;
                  const isFullyPaid = remainingAmount <= 0.01 && (pricePaid > 0 || booking.status === "COMPLETED" || booking.paymentStatus === "COMPLETED");
                  const hasRemainingBalance = remainingAmount > 0.01 && booking.status !== "CANCELLED" && booking.status !== "COMPLETED";

                  return (
                    <>
                      <div className="flex justify-between items-center py-1">
                        <span>Payment Status</span>
                        <div>
                          {booking.status === "CANCELLED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Cancelled • No Payment Received</span>
                            </span>
                          ) : isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-groomish-greenLight text-groomish-green border border-groomish-green/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {booking.paymentMethod === "CASH"
                                  ? "Paid at Salon"
                                  : `Paid Online (${booking.paymentMethod === "ONLINE" ? "Razorpay" : booking.paymentMethod || "Razorpay"})`}
                              </span>
                            </span>
                          ) : isPartiallyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Partially Paid (₹{pricePaid} Paid • ₹{remainingAmount} Due)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {booking.paymentMethod === "ONLINE"
                                  ? "Payment Pending (Online)"
                                  : "Payment Pending (Pay at Salon)"}
                              </span>
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

                      {/* Grand Total */}
                      <div className="border-t border-dashed border-groomish-slate/15 pt-2 flex justify-between text-base font-heading font-extrabold text-groomish-slate">
                        <span>Total Bill</span>
                        <span className="text-groomish-slate font-black text-lg">₹{totalAmount}</span>
                      </div>

                      {/* Already Paid Online (Partial) */}
                      {isPartiallyPaid && (
                        <div className="flex justify-between py-1 text-xs text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Already Paid Online</span>
                          </span>
                          <span>-₹{pricePaid}</span>
                        </div>
                      )}

                      {/* Remaining Balance to Pay */}
                      {isPartiallyPaid && (
                        <div className="flex justify-between items-center py-2 px-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold">
                          <span className="flex items-center gap-1.5 text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Remaining Balance to Pay:</span>
                          </span>
                          <span className="text-base font-black text-amber-700 font-mono">
                            ₹{remainingAmount}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Pay Balance Action Callout */}
              {(() => {
                const totalAmount = Number(booking.totalAmount ?? booking.pricePaid ?? 0);
                const pricePaid = Number(booking.pricePaid ?? 0);
                const remainingAmount = Number(
                  booking.remainingAmount !== undefined && booking.remainingAmount !== null
                    ? booking.remainingAmount
                    : Math.max(0, totalAmount - pricePaid)
                );
                const isPartiallyPaid = pricePaid > 0.01 && remainingAmount > 0.01;
                const hasRemainingBalance = remainingAmount > 0.01 && booking.status !== "CANCELLED" && booking.status !== "COMPLETED";

                if (!hasRemainingBalance) return null;

                return (
                  <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 shadow-soft space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                          <Zap className="w-4 h-4 text-groomish-orange fill-current" />
                          <span>{isPartiallyPaid ? "Outstanding Balance Due" : "Pay Online Option Active"}</span>
                        </div>
                        <p className="text-xs text-groomish-slate/85 mt-1 leading-relaxed">
                          {isPartiallyPaid ? (
                            <>
                              Extra services or products were added. You have paid <strong>₹{pricePaid}</strong>. Remaining balance to settle: <strong className="text-amber-800 text-sm">₹{remainingAmount}</strong>.
                            </>
                          ) : (
                            <>
                              Chose <strong>Pay at Salon</strong>? You can pay anytime before or during your appointment via UPI or Card to skip the counter queue!
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={handleOpenPayOnline}
                        className="px-4 py-2.5 bg-groomish-orange hover:bg-groomish-orangeHover text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-glowOrange transition shrink-0 active:scale-95 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>⚡ Pay {isPartiallyPaid ? "Remaining Balance" : "Now"} (₹{remainingAmount})</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2 text-[11px] text-amber-900/80 font-medium">
                      <Store className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                      <span>
                        Prefer to <strong>Pay at Salon</strong>? You can settle the balance of <strong>₹{remainingAmount}</strong> via Cash, UPI, or Card at the salon counter during your appointment.
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Groom Coins Section */}
              {booking.status === "CANCELLED" ? (
                <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    <strong>Groom Coins Cancelled:</strong> 0 Groom Coins credited (appointment was cancelled).
                  </span>
                </div>
              ) : booking.status === "COMPLETED" ? (
                <div className="p-2.5 bg-groomish-greenLight/60 rounded-lg border border-groomish-green/30 flex items-center gap-2 text-xs text-groomish-slate">
                  <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    ✓ <strong>Confirmed:</strong> You earned <strong className="font-bold text-groomish-green">+{booking.expectedRewardPoints ?? calculateCoins(booking.pricePaid)} Groom Coins</strong> on this completed appointment!
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-300/60 flex items-center gap-2 text-xs text-amber-900">
                  <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    ⏳ <strong className="font-bold text-amber-700">{booking.expectedRewardPoints ?? calculateCoins(booking.pricePaid)} Pending Groom Coins.</strong> Confirmed upon appointment completion.
                  </span>
                </div>
              )}
            </div>

            {/* Customer Feedback & Ratings Section (Compact & Accessible) */}
            {booking.status === "COMPLETED" && (() => {
              const storeId = booking.storeId || booking.store?.id;
              const storeName = booking.storeName || booking.store?.name || "Salon Branch";
              const storeReview = (booking.customerReviews || []).find(
                (r) => (r.storeId && r.storeId === storeId) || (!r.serviceId && !r.productId)
              );

              const totalReviewables = 1 + groupedServices.length + (booking.products?.length || 0);
              const ratedCount =
                (storeReview ? 1 : 0) +
                groupedServices.filter((g) =>
                  (booking.customerReviews || []).some((r) => r.serviceId === g.serviceId)
                ).length +
                (booking.products || []).filter((p) =>
                  (booking.customerReviews || []).some((r) => r.productId === (p.productId || p.id))
                ).length;

              return (
                <div
                  ref={reviewsRef}
                  id="reviews-section"
                  className="card-groomish p-3.5 sm:p-4.5 space-y-2.5 border border-groomish-slate/15 bg-white shadow-soft animate-fade-in"
                >
                  {/* Compact Header */}
                  <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/40">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-heading font-extrabold text-groomish-slate leading-tight">
                          Feedback & Ratings
                        </h2>
                        <p className="text-[11px] text-groomish-slate/60">
                          Rate your salon visit, treatments, and retail products
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-groomish-cream text-groomish-slate border border-groomish-slate/10 shrink-0">
                      {ratedCount}/{totalReviewables} Rated
                    </span>
                  </div>

                  {/* Compact Feedback List */}
                  <div className="divide-y divide-groomish-slate/10">
                    {/* 1. Salon Branch */}
                    <div className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-groomish-cream border border-groomish-slate/10 text-groomish-slate/60 flex items-center justify-center shrink-0">
                          <Store className="w-3.5 h-3.5 text-groomish-orange" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-groomish-slate truncate">
                              {storeName}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-groomish-slate/60 bg-groomish-cream border border-groomish-slate/10 px-1.5 py-0.5 rounded">
                              Salon
                            </span>
                          </div>
                          {storeReview && storeReview.review && storeReview.review.trim() && (
                            <p className="text-[11px] text-groomish-slate/75 italic line-clamp-1 mt-0.5">
                              "{storeReview.review}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {storeReview ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                              <span className="sr-only">Rated </span>
                              <span>{storeReview.rating}.0</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenStoreReview}
                              className="text-xs font-bold text-groomish-orange hover:underline px-1.5 py-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-groomish-orange focus-visible:outline-none rounded"
                              aria-label={`Edit review for salon branch ${storeName}. Current rating: ${storeReview.rating} out of 5 stars`}
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleOpenStoreReview}
                            className="px-3 py-1 bg-groomish-orange hover:bg-groomish-orangeHover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-groomish-orange focus-visible:outline-none"
                            aria-label={`Rate salon branch ${storeName}`}
                          >
                            <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                            <span>Rate Salon</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Services */}
                    {groupedServices.map((grp) => {
                      const rev = (booking.customerReviews || []).find((r) => r.serviceId === grp.serviceId);
                      return (
                        <div
                          key={grp.serviceId || grp.serviceName}
                          className="py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-groomish-cream border border-groomish-slate/10 text-groomish-slate/60 flex items-center justify-center shrink-0">
                              <Scissors className="w-3.5 h-3.5 text-groomish-orange" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-groomish-slate truncate">
                                  {grp.serviceName}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-groomish-slate/60 bg-groomish-cream border border-groomish-slate/10 px-1.5 py-0.5 rounded">
                                  Service
                                </span>
                              </div>
                              {rev && rev.review && rev.review.trim() && (
                                <p className="text-[11px] text-groomish-slate/75 italic line-clamp-1 mt-0.5">
                                  "{rev.review}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {rev ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                                  <span className="sr-only">Rated </span>
                                  <span>{rev.rating}.0</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenServiceReview(grp)}
                                  className="text-xs font-bold text-groomish-orange hover:underline px-1.5 py-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-groomish-orange focus-visible:outline-none rounded"
                                  aria-label={`Edit review for service ${grp.serviceName}. Current rating: ${rev.rating} out of 5 stars`}
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenServiceReview(grp)}
                                className="px-3 py-1 bg-groomish-orange hover:bg-groomish-orangeHover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-groomish-orange focus-visible:outline-none"
                                aria-label={`Rate service ${grp.serviceName}`}
                              >
                                <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                                <span>Rate Service</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 3. Products (if any) */}
                    {booking.products &&
                      booking.products.map((prod) => {
                        const prodId = prod.productId || prod.id;
                        const rev = (booking.customerReviews || []).find((r) => r.productId === prodId);
                        return (
                          <div
                            key={prodId}
                            className="py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-groomish-cream border border-groomish-slate/10 text-groomish-slate/60 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-3.5 h-3.5 text-groomish-orange" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-groomish-slate truncate">
                                    {prod.productName}
                                  </span>
                                  <span className="text-[9px] uppercase font-bold text-groomish-slate/60 bg-groomish-cream border border-groomish-slate/10 px-1.5 py-0.5 rounded">
                                    Product
                                  </span>
                                </div>
                                {rev && rev.review && rev.review.trim() && (
                                  <p className="text-[11px] text-groomish-slate/75 italic line-clamp-1 mt-0.5">
                                    "{rev.review}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {rev ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                                    <span className="sr-only">Rated </span>
                                    <span>{rev.rating}.0</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProductReview(prod)}
                                    className="text-xs font-bold text-groomish-orange hover:underline px-1.5 py-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-groomish-orange focus-visible:outline-none rounded"
                                    aria-label={`Edit review for product ${prod.productName}. Current rating: ${rev.rating} out of 5 stars`}
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenProductReview(prod)}
                                  className="px-3 py-1 bg-groomish-orange hover:bg-groomish-orangeHover text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-groomish-orange focus-visible:outline-none"
                                  aria-label={`Rate product ${prod.productName}`}
                                >
                                  <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                                  <span>Rate Product</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })()}

            {/* Action Bar (Clean & compact with no duplicate buttons) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                onClick={() => navigate("/customer/bookings")}
                className="btn-secondary text-xs px-4 py-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to All Bookings</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {isModifiable && (
                  <>
                    <button
                      onClick={handleOpenReschedule}
                      disabled={actionLoading}
                      className="btn-secondary text-xs px-3.5 py-2"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reschedule Slot</span>
                    </button>

                    <button
                      onClick={handleCancelBooking}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl border border-groomish-crimson/30 text-groomish-crimson hover:bg-groomish-crimson/10 text-xs font-bold transition flex items-center gap-1.5"
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
                  className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition ${selectedServiceCategory === cat
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
                const srvId = srv.serviceId || srv.id;
                const bookedCount = getBookedCount(srvId);
                return (
                  <div
                    key={srvId}
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
                        onClick={() => handleAddService(srvId)}
                        disabled={addingServiceId === srvId}
                        className="btn-primary text-xs px-3.5 py-1.5 font-bold shadow-soft flex items-center gap-1"
                      >
                        {addingServiceId === srvId ? (
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
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2">
                <Calendar className="w-5 h-5 text-groomish-orange" />
                <span>Reschedule Appointment</span>
              </h3>
              <p className="text-xs text-groomish-slate/60 mt-0.5">
                Select a new date and choose from live branch time slots (24-hour time).
              </p>
            </div>
            {(booking?.storeName || booking?.store?.name) && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-groomish-cream border border-groomish-slate/15 text-groomish-slate shrink-0">
                {booking.storeName || booking.store.name}
              </span>
            )}
          </div>

          {rescheduleError && (
            <div className="p-3 rounded-xl bg-groomish-crimson/10 text-groomish-crimson text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rescheduleError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-groomish-orange" />
                <span>New Appointment Date</span>
              </label>
              <CustomDatePicker
                value={rescheduleDate}
                minDate={getLocalDateStr()}
                onChange={(e, val) => {
                  const nextVal = val || e?.target?.value || "";
                  setRescheduleDate(nextVal);
                }}
                placeholder="Select New Date"
                align="left"
                className="w-full"
                triggerClassName="w-full !py-2.5 !px-3.5 !rounded-xl !bg-groomish-cream/70 hover:!bg-white !border-groomish-slate/15 text-xs font-bold transition"
              />
            </div>

            {/* Branch Time Slots (Strictly 24-hour, NO AM-PM) */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-groomish-slate/80 mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-groomish-orange" />
                  <span>Branch Time Slots</span>
                  {rescheduleTime && (
                    <span className="text-[11px] font-mono font-bold text-groomish-green bg-groomish-greenLight px-2 py-0.5 rounded-full border border-groomish-green/20">
                      Selected: {rescheduleTime}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {loadingRescheduleSlots && (
                    <span className="text-[10px] text-groomish-orange font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Loading slots...
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchRescheduleSlots(true)}
                    disabled={loadingRescheduleSlots}
                    className="py-1 px-2.5 rounded-xl text-[10px] font-bold text-groomish-slate/70 hover:text-groomish-orange bg-groomish-cream hover:bg-white border border-groomish-slate/15 flex items-center gap-1 transition shadow-2xs"
                    title="Refresh branch slots"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingRescheduleSlots ? "animate-spin text-groomish-orange" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-groomish-slate/10 rounded-2xl bg-groomish-cream/30">
                {rescheduleTimeSlots.map((time) => {
                  const isPast = isRescheduleSlotPast(time);
                  const isUnavailable = rescheduleUnavailableSlots.includes(time) || isPast;
                  const isSelected = rescheduleTime === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => !isUnavailable && setRescheduleTime(time)}
                      title={
                        isPast
                          ? "Slot has already passed for today"
                          : isUnavailable
                          ? "Slot fully booked or unavailable"
                          : `Select ${time}`
                      }
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center font-mono ${
                        isSelected
                          ? "bg-groomish-orange text-white shadow-soft scale-102 border border-groomish-orange font-black"
                          : isUnavailable
                          ? "bg-groomish-slate/5 text-groomish-slate/30 border border-groomish-slate/10 cursor-not-allowed line-through"
                          : "bg-white text-groomish-slate border border-groomish-slate/20 hover:border-groomish-orange hover:bg-groomish-orangeLight/40"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-groomish-slate/50 mt-1.5">
                * Slots displayed in 24-hour branch schedule format without AM/PM. Past or unavailable stylist slots are disabled.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1.5">
                Note / Stylist Instruction (optional)
              </label>
              <textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate focus:outline-none focus:border-groomish-orange transition placeholder:text-groomish-slate/40 resize-none font-medium"
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
              disabled={rescheduleLoading || !rescheduleDate || !rescheduleTime}
              className="btn-primary text-xs px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          storeId={activeReviewItem.storeId}
          storeName={activeReviewItem.storeName}
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
              Pay now securely to skip counter payment and collect Groom Coins immediately.
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
                  <span className="text-groomish-slate/50 block">Groom Coins Earned</span>
                  <span className="font-bold text-amber-700 flex items-center gap-1 justify-end">
                    <GroomCoinIcon className="w-3.5 h-3.5" />
                    +{booking?.expectedRewardPoints != null ? booking.expectedRewardPoints : calculateCoins(booking?.pricePaid || 0)} Coins
                  </span>
                </div>
              </div>

              {/* Online Payment Method Info */}
              <div className="p-4 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/15 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-groomish-slate">
                      Razorpay Online Payment Gateway
                    </h5>
                    <p className="text-[11px] text-groomish-slate/60 mt-0.5">
                      Pay securely using UPI, Credit / Debit Cards, NetBanking, or Wallets.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-groomish-slate/60 pt-2 border-t border-groomish-slate/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-groomish-green shrink-0" />
                  <span>256-bit bank encrypted payment • Instant booking confirmation</span>
                </div>
              </div>

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
