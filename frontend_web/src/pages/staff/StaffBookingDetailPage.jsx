import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getStaffBooking,
  cancelStaffBooking,
  addServiceToBookingByStaff,
  removeServiceFromBookingByStaff,
  getStaffServices,
  getStaffProducts,
  addProductToBookingByStaff,
  removeProductFromBookingByStaff,
  completeBookingAndSendBillByStaff,
} from "../../api/staff";
import StaffSidebar from "../../components/staff/StaffSidebar";
import CustomerProfileModal from "../../components/modals/CustomerProfileModal";
import BookingTimelineSection from "../../components/booking/BookingTimelineSection";
import CustomSelect from "../../components/common/CustomSelect";
import { showConfirm } from "../../context/ConfirmContext";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import { extractList } from "../../utils/dataHelper";
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
  Copy,
  Check,
  CheckCircle2,
  X,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Plus,
  Trash2,
  Tag,
  Receipt,
  Layers,
} from "lucide-react";

export default function StaffBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customerProfileOpen, setCustomerProfileOpen] = useState(false);

  // Available staff services & products
  const [availableServices, setAvailableServices] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQty, setProductQty] = useState(1);

  // Modals for adding items
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const loadBooking = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await getStaffBooking(id);
      setBooking(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load staff booking details");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        getStaffServices().catch(() => ({ data: [] })),
        getStaffProducts().catch(() => ({ data: [] })),
      ]);
      setAvailableServices(extractList(sRes.data));
      setAvailableProducts(extractList(pRes.data));
    } catch (err) {
      console.error("Failed to load staff catalog:", err);
    }
  };

  useEffect(() => {
    loadBooking();
    loadCatalog();
  }, [id]);

  const handleCopyCode = () => {
    const code = booking?.bookingCode || booking?.id;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await addServiceToBookingByStaff(id, selectedServiceId);
      setSuccessMsg("Salon service added to appointment!");
      setSelectedServiceId("");
      setAddServiceOpen(false);
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add service");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveService = async (itemId) => {
    const ok = await showConfirm({
      title: "Remove Salon Service",
      message: "Are you sure you want to remove this service from the appointment?",
      confirmText: "Remove Service",
      variant: "danger",
    });
    if (!ok) return;

    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await removeServiceFromBookingByStaff(id, itemId);
      setSuccessMsg("Service removed from appointment.");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove service");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await addProductToBookingByStaff(id, {
        productId: selectedProductId,
        quantity: Number(productQty) || 1,
      });
      setSuccessMsg("Retail product added to appointment bill!");
      setSelectedProductId("");
      setProductQty(1);
      setAddProductOpen(false);
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProduct = async (bookingProductId) => {
    const ok = await showConfirm({
      title: "Remove Retail Product",
      message: "Are you sure you want to remove this product from the appointment bill?",
      confirmText: "Remove Product",
      variant: "danger",
    });
    if (!ok) return;

    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await removeProductFromBookingByStaff(id, bookingProductId);
      setSuccessMsg("Product removed.");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAndBill = async () => {
    const ok = await showConfirm({
      title: "Finalize Appointment & Generate Bill",
      message: "Mark this appointment as COMPLETED and finalize the customer invoice?",
      confirmText: "Complete & Finalize",
      variant: "primary",
    });
    if (!ok) return;

    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await completeBookingAndSendBillByStaff(id);
      setSuccessMsg("Appointment marked as COMPLETED and invoice generated!");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await cancelStaffBooking(id, cancelReason);
      setSuccessMsg("Appointment has been cancelled.");
      setCancelModalOpen(false);
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
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

  const bookingCode = booking?.bookingCode || (booking?.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "");
  const groupedServices = booking ? groupBookingServices(booking.bookingItems || []) : [];
  const totalRawItems = booking?.bookingItems?.length || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-groomish-cream font-sans">
        <StaffSidebar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-groomish-slate/60">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="flex min-h-screen bg-groomish-cream font-sans">
        <StaffSidebar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-groomish-slate/10 shadow-soft text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-groomish-crimsonLight text-groomish-crimson flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-heading text-groomish-slate">Appointment Not Found</h2>
            <p className="text-xs text-groomish-slate/60">{error}</p>
            <button
              onClick={() => navigate("/staff/dashboard")}
              className="btn-primary text-xs px-5 py-2.5 mx-auto inline-flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Staff Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-groomish-cream font-sans">
      {/* FIXED STAFF SIDEBAR */}
      <StaffSidebar activeBookingCode={bookingCode} activeBookingId={id} />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-groomish-slate/60">
                <button
                  onClick={() => navigate("/staff/dashboard")}
                  className="hover:text-groomish-orange inline-flex items-center gap-1 transition font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Staff Dashboard</span>
                </button>
                <span>/</span>
                <span className="font-bold text-groomish-slate font-mono">{bookingCode}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black font-heading text-groomish-slate">
                  Staff Appointment Console
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

            {/* Quick Staff Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
                <button
                  disabled={actionLoading}
                  onClick={handleCompleteAndBill}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 active:scale-95 transition shadow-soft"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete & Bill</span>
                </button>
              )}

              {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                <button
                  disabled={actionLoading}
                  onClick={() => setCancelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-groomish-crimson/30 text-groomish-crimson bg-white hover:bg-groomish-crimsonLight active:scale-95 transition text-xs font-bold"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                onClick={loadBooking}
                disabled={actionLoading}
                className="p-2 rounded-xl border border-groomish-slate/20 text-groomish-slate/70 hover:text-groomish-orange bg-white active:scale-95 transition"
                title="Refresh"
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

          {/* Console Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Client & Salon info, Services, Products */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header info card */}
              <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-groomish-slate/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50">
                      Booking Code
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xl font-black font-mono text-groomish-orange tracking-wider">
                        {bookingCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-1 rounded-lg text-groomish-slate/40 hover:text-groomish-orange hover:bg-groomish-cream/60 transition"
                        title="Copy code"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50">
                      Source
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

                {/* Client & Branch Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-groomish-slate/50">Customer</span>
                      <User className="w-3.5 h-3.5 text-groomish-orange" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setCustomerProfileOpen(true)}
                        className="font-bold text-sm text-groomish-slate hover:text-groomish-orange hover:underline text-left transition"
                        title="View Customer Profile"
                      >
                        {booking.userName || booking.bookedBy || "Walk-in Guest"}
                      </button>
                      {booking.userPhone && (
                        <p className="text-[11px] text-groomish-slate/60 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{booking.userPhone}</span>
                        </p>
                      )}
                      {booking.userEmail && (
                        <p className="text-[11px] text-groomish-slate/60 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{booking.userEmail}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-groomish-slate/50">Salon Branch</span>
                      <MapPin className="w-3.5 h-3.5 text-groomish-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-groomish-slate truncate">
                        {booking.storeName || "Primary Salon Branch"}
                      </p>
                      <p className="text-[11px] text-groomish-slate/60 line-clamp-2 mt-0.5">
                        {booking.storeAddress || "Salon Location"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-1.5">
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

              {/* Booked Services Card with Multipliers */}
              <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-groomish-orange" />
                    <h3 className="font-heading font-bold text-base text-groomish-slate">
                      Salon Services ({totalRawItems || 1})
                    </h3>
                  </div>
                  {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
                    <button
                      onClick={() => setAddServiceOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-groomish-orange text-white text-xs font-bold hover:bg-groomish-orangeDark active:scale-95 transition shadow-soft"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Service</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-groomish-slate/10 border border-groomish-slate/10 rounded-2xl overflow-hidden">
                  {groupedServices.length > 0 ? (
                    groupedServices.map((grp, idx) => (
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
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-black font-heading text-sm text-groomish-slate">
                            ₹{grp.totalPrice}
                          </span>
                          {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && totalRawItems > 1 && (
                            <button
                              onClick={() => handleRemoveService(grp.itemIds[grp.itemIds.length - 1])}
                              className="p-1.5 text-groomish-slate/40 hover:text-groomish-crimson hover:bg-groomish-crimsonLight rounded-lg transition"
                              title={grp.quantity > 1 ? `Remove 1 ${grp.serviceName}` : "Remove service"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 flex items-center justify-between gap-4">
                      <p className="font-bold text-xs text-groomish-slate">
                        {booking.serviceName || "Salon Service"}
                      </p>
                      <span className="font-black font-heading text-sm text-groomish-slate">
                        ₹{booking.totalAmount || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Retail Products Card */}
              <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-groomish-blue" />
                    <h3 className="font-heading font-bold text-base text-groomish-slate">
                      Retail Products ({booking.products?.length || 0})
                    </h3>
                  </div>
                  {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
                    <button
                      onClick={() => setAddProductOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-groomish-blue text-white text-xs font-bold hover:bg-sky-600 active:scale-95 transition shadow-soft"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Retail Product</span>
                    </button>
                  )}
                </div>

                {booking.products && booking.products.length > 0 ? (
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
                        <div className="flex items-center gap-3">
                          <span className="font-black font-heading text-sm text-groomish-slate">
                            ₹{prod.subtotal || (prod.quantity * (prod.unitPriceSnapshot || prod.unitPrice || 0))}
                          </span>
                          {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleRemoveProduct(prod.id)}
                              className="p-1.5 text-groomish-slate/40 hover:text-groomish-crimson hover:bg-groomish-crimsonLight rounded-lg transition"
                              title="Remove product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-groomish-slate/20 rounded-2xl text-xs text-groomish-slate/50">
                    No retail products added yet. Click "+ Add Retail Product" to add salon aftercare items.
                  </div>
                )}
              </div>

              {/* Activity & Audit Timeline */}
              <BookingTimelineSection timeline={booking.timeline} />
            </div>

            {/* Right 1 Col: Invoice & Finalize */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-groomish-slate/10">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-groomish-orange" />
                    <h3 className="font-heading font-bold text-sm text-groomish-slate">
                      Invoice & Bill Total
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
                    <span>Services Subtotal:</span>
                    <span className="font-semibold text-groomish-slate">₹{booking.totalAmount || 0}</span>
                  </div>
                  {booking.couponCode && (
                    <div className="flex items-center justify-between text-groomish-green">
                      <span>Coupon ({booking.couponCode}):</span>
                      <span>-₹{booking.discountAmount || 0}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-groomish-slate/10 text-sm font-bold text-groomish-slate">
                    <span>Total Amount Due:</span>
                    <span className="font-black text-xl text-groomish-orange font-heading">
                      ₹{booking.pricePaid ?? booking.totalAmount ?? 0}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-1 text-[11px] text-groomish-slate/70">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold text-groomish-slate">{booking.paymentMethod || "CASH"}</span>
                  </div>
                  {booking.invoiceNumber && (
                    <div className="flex justify-between">
                      <span>Invoice #:</span>
                      <span className="font-mono font-bold text-groomish-slate">{booking.invoiceNumber}</span>
                    </div>
                  )}
                </div>

                {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
                  <button
                    disabled={actionLoading}
                    onClick={handleCompleteAndBill}
                    className="w-full btn-primary text-xs py-3 rounded-2xl inline-flex items-center justify-center gap-2 font-bold shadow-soft"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalize & Bill Client</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {addServiceOpen && (
        <div className="fixed inset-0 z-50 bg-groomish-slate/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-groomish-slate/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-groomish-orange" />
                <h3 className="font-heading font-bold text-base text-groomish-slate">
                  Add Service to Appointment
                </h3>
              </div>
              <button
                onClick={() => setAddServiceOpen(false)}
                className="p-1 rounded-lg text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 mb-1.5">
                  Select Salon Service
                </label>
                <CustomSelect
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.value || e.target.value)}
                  placeholder="-- Choose a salon service --"
                  searchPlaceholder="Search services..."
                  searchable={true}
                  options={availableServices.map((s) => ({
                    value: s.id,
                    label: `${s.name} - ₹${s.price} (${s.durationMinutes} mins)`,
                  }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-groomish-slate/10">
                <button
                  type="button"
                  onClick={() => setAddServiceOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedServiceId || actionLoading}
                  className="btn-primary text-xs px-5 py-2 font-bold shadow-soft"
                >
                  {actionLoading ? "Adding..." : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {addProductOpen && (
        <div className="fixed inset-0 z-50 bg-groomish-slate/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-groomish-slate/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-groomish-blue" />
                <h3 className="font-heading font-bold text-base text-groomish-slate">
                  Add Retail Product to Bill
                </h3>
              </div>
              <button
                onClick={() => setAddProductOpen(false)}
                className="p-1 rounded-lg text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 mb-1.5">
                  Select Product
                </label>
                <CustomSelect
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.value || e.target.value)}
                  placeholder="-- Choose a product --"
                  searchPlaceholder="Search 100+ retail products..."
                  searchable={true}
                  options={availableProducts.map((p) => ({
                    value: p.id,
                    label: `${p.name} - ₹${p.price} (${p.stockQuantity ?? 10} in stock)`,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={productQty}
                  onChange={(e) => setProductQty(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate font-bold focus:outline-none focus:border-groomish-orange"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-groomish-slate/10">
                <button
                  type="button"
                  onClick={() => setAddProductOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedProductId || actionLoading}
                  className="btn-primary text-xs px-5 py-2 font-bold shadow-soft"
                >
                  {actionLoading ? "Adding..." : "Add to Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-groomish-slate/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-groomish-slate/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
              <h3 className="font-heading font-bold text-base text-groomish-slate">
                Cancel Appointment
              </h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-groomish-slate/40 hover:text-groomish-slate">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCancelBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 mb-1.5">
                  Cancellation Reason
                </label>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="w-full px-3 py-2 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:border-groomish-orange resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-groomish-crimson text-white text-xs font-bold hover:bg-rose-700 transition shadow-soft"
                >
                  {actionLoading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
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
