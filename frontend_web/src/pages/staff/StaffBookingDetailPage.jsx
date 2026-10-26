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
  confirmBookingByStaff,
  checkInBookingByStaff,
} from "../../api/staff";
import { useAuth } from "../../context/useAuth";
import StaffSidebar from "../../components/staff/StaffSidebar";
import CustomerProfileModal from "../../components/modals/CustomerProfileModal";
import BookingTimelineSection from "../../components/booking/BookingTimelineSection";
import InvoiceBreakdownCard from "../../components/booking/InvoiceBreakdownCard";
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
  UserCheck,
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
  Search,
  Minus,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function StaffBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("groomish_staff_sidebar_collapsed") === "true";
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("groomish_staff_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebarCollapsed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
  const [productQtyMap, setProductQtyMap] = useState({});
  const [addingItemId, setAddingItemId] = useState(null);

  // Search and filter states
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [serviceSelectedCategory, setServiceSelectedCategory] = useState("ALL");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSelectedCategory, setProductSelectedCategory] = useState("ALL");

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

  const handleOpenAddServiceModal = () => {
    setServiceSearchQuery("");
    setServiceSelectedCategory("ALL");
    setAddServiceOpen(true);
    loadCatalog();
  };

  const handleOpenAddProductModal = () => {
    setProductSearchQuery("");
    setProductSelectedCategory("ALL");
    setAddProductOpen(true);
    loadCatalog();
  };

  const handleAddServiceDirect = async (serviceId) => {
    setActionLoading(true);
    setAddingItemId(serviceId);
    setError("");
    setSuccessMsg("");
    try {
      await addServiceToBookingByStaff(id, serviceId);
      setSuccessMsg("Salon service added to appointment!");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add service");
    } finally {
      setActionLoading(false);
      setAddingItemId(null);
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

  const handleAddProductDirect = async (productId) => {
    const qty = Number(productQtyMap[productId]) || 1;
    setActionLoading(true);
    setAddingItemId(productId);
    setError("");
    setSuccessMsg("");
    try {
      await addProductToBookingByStaff(id, {
        productId,
        quantity: qty,
      });
      setSuccessMsg("Retail product added to appointment bill!");
      setProductQtyMap((prev) => ({ ...prev, [productId]: 1 }));
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add product");
    } finally {
      setActionLoading(false);
      setAddingItemId(null);
    }
  };

  const handleQtyChange = (productId, delta) => {
    setProductQtyMap((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  // Service Filter & Categories
  const serviceCategories = [
    "ALL",
    ...Array.from(new Set(availableServices.map((s) => s.categoryName).filter(Boolean))),
  ];

  const filteredServices = availableServices.filter((s) => {
    if (serviceSelectedCategory !== "ALL" && s.categoryName !== serviceSelectedCategory) {
      return false;
    }
    if (!serviceSearchQuery.trim()) return true;
    const q = serviceSearchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  // Product Filter & Categories
  const productCategories = [
    "ALL",
    ...Array.from(new Set(availableProducts.map((p) => p.category || p.brand).filter(Boolean))),
  ];

  const filteredProducts = availableProducts.filter((p) => {
    if (
      productSelectedCategory !== "ALL" &&
      p.category !== productSelectedCategory &&
      p.brand !== productSelectedCategory
    ) {
      return false;
    }
    if (!productSearchQuery.trim()) return true;
    const q = productSearchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

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

  const handleConfirmBooking = async () => {
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await confirmBookingByStaff(id);
      setSuccessMsg("Appointment successfully confirmed!");
      await loadBooking();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckInBooking = async () => {
    const ok = await showConfirm({
      title: "Check In Client",
      message: "Check in customer for this appointment and start services? Status will become CHECKED IN and services will be in progress.",
      confirmText: "Check In Client",
      variant: "primary",
    });
    if (!ok) return;

    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await checkInBookingByStaff(id);
      setSuccessMsg("Client checked in successfully! Services are now in progress.");
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

  const bookingCode = booking?.bookingCode || (booking?.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "");
  const groupedServices = booking ? groupBookingServices(booking.items || booking.bookingItems || []) : [];
  const totalRawItems = (booking?.items || booking?.bookingItems || []).length;
  const isOwnBranch = !user?.storeId || !booking?.storeId || String(user.storeId) === String(booking.storeId);

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
    <div className="min-h-screen bg-groomish-cream font-sans w-full max-w-full overflow-x-hidden">
      {/* STAFF SIDEBAR */}
      <StaffSidebar
        activeBookingCode={bookingCode}
        activeBookingId={id}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {/* MAIN VIEWPORT */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-0" : "lg:pl-64"
        } pl-0`}
      >
        {/* Top Mobile Bar with Hamburger & Back */}
        <header className="lg:hidden h-14 bg-white border-b border-groomish-slate/10 px-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-xl hover:bg-groomish-cream text-groomish-slate border border-groomish-slate/15 transition cursor-pointer"
              aria-label="Open staff menu"
            >
              <Menu className="w-5 h-5 text-groomish-slate" />
            </button>
            <button
              onClick={() => navigate("/staff/dashboard")}
              className="text-xs font-bold text-groomish-orange flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
          <span className="font-mono text-xs font-bold text-groomish-slate bg-groomish-cream px-2 py-0.5 rounded-lg border border-groomish-slate/15">
            {bookingCode}
          </span>
        </header>

        {/* Desktop Top Header Bar with Sidebar Toggle */}
        <header className="hidden lg:flex h-12 bg-white/80 backdrop-blur-md border-b border-groomish-slate/10 px-6 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="px-2.5 py-1 rounded-xl text-groomish-slate/75 hover:text-groomish-orange hover:bg-groomish-orange/10 border border-groomish-slate/15 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title={sidebarCollapsed ? "Show sidebar (Ctrl+B)" : "Hide sidebar (Ctrl+B)"}
            >
              {sidebarCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-groomish-orange" />
                  <span>Show Sidebar</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Hide Sidebar</span>
                </>
              )}
            </button>
            <span className="text-xs text-groomish-slate/30">|</span>
            <span className="text-xs font-bold text-groomish-slate/70">
              Appointment Console • <strong className="font-mono text-groomish-slate">{bookingCode}</strong>
            </span>
          </div>

          <button
            onClick={() => navigate("/staff/dashboard")}
            className="text-xs font-bold text-groomish-slate hover:text-groomish-orange flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Bookings</span>
          </button>
        </header>

        <div className="p-3.5 sm:p-5 max-w-6xl w-full mx-auto space-y-4 min-w-0">
          {/* Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="hidden sm:flex items-center gap-2 text-xs text-groomish-slate/60">
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
              {!isOwnBranch && (
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>View-Only ({booking.storeName || "Other Branch"})</span>
                </span>
              )}

              {isOwnBranch && booking.status === "PENDING" && (
                <button
                  disabled={actionLoading}
                  onClick={handleConfirmBooking}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 active:scale-95 transition shadow-soft cursor-pointer"
                  title="Confirm booking (payment received at counter / verified)"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Appointment</span>
                </button>
              )}

              {/* CHECK IN CLIENT - When customer arrives at salon */}
              {isOwnBranch && (booking.status === "CONFIRMED" || booking.status === "MODIFIED" || booking.status === "PENDING") && (
                <button
                  disabled={actionLoading}
                  onClick={handleCheckInBooking}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 active:scale-95 transition shadow-soft cursor-pointer"
                  title="Check in client upon arrival at salon"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Check In Client</span>
                </button>
              )}

              {/* COMPLETE & BILL - When client is checked in & services are done */}
              {isOwnBranch && (booking.status === "CHECKED_IN" || booking.status === "IN_PROGRESS") && (
                <button
                  disabled={actionLoading}
                  onClick={handleCompleteAndBill}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-groomish-blue text-white font-bold text-xs hover:bg-sky-600 active:scale-95 transition shadow-soft cursor-pointer"
                  title="Finalize appointment & generate bill invoice"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete & Bill</span>
                </button>
              )}

              {/* Secondary Complete & Bill option if already confirmed */}
              {isOwnBranch && (booking.status === "CONFIRMED" || booking.status === "MODIFIED") && (
                <button
                  disabled={actionLoading}
                  onClick={handleCompleteAndBill}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-groomish-blue/30 text-groomish-blue bg-white hover:bg-sky-50 active:scale-95 transition text-xs font-bold cursor-pointer"
                  title="Directly complete and bill without check-in"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete & Bill</span>
                </button>
              )}

              {isOwnBranch && booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                <button
                  disabled={actionLoading}
                  onClick={() => setCancelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-groomish-crimson/30 text-groomish-crimson bg-white hover:bg-groomish-crimsonLight active:scale-95 transition text-xs font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                onClick={loadBooking}
                disabled={actionLoading}
                className="p-2 rounded-xl border border-groomish-slate/20 text-groomish-slate/70 hover:text-groomish-orange bg-white active:scale-95 transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* CLIENT CHECKED IN BANNER */}
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
                      In Chair
                    </span>
                  </div>
                  <p className="text-xs text-sky-800 mt-0.5">
                    Customer is currently in the salon receiving treatments. Reminders and auto-cancellations are automatically disabled. When treatments are finished, click <strong>Complete & Bill</strong>.
                  </p>
                </div>
              </div>
              {isOwnBranch && (
                <button
                  disabled={actionLoading}
                  onClick={handleCompleteAndBill}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 transition shadow-soft flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete & Bill</span>
                </button>
              )}
            </div>
          )}

          {/* VIEW-ONLY OTHER BRANCH BANNER */}
          {!isOwnBranch && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Branch View-Only Mode</span>
                <span>
                  This appointment belongs to <b>{booking.storeName || "another salon branch"}</b>.
                  Stylists have read-only access to view customer services, bill breakdown, and timeline. Only stylists assigned to this branch can edit, add services, or cancel this booking.
                </span>
              </div>
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

          {/* Online Payment Pending Notice */}
          {booking.status === "PENDING" && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Online Payment Pending:</strong> This appointment is on hold awaiting online payment confirmation. You can confirm it once payment is completed or received at the counter.
                </span>
              </div>
              {isOwnBranch && (
                <button
                  onClick={handleConfirmBooking}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
                >
                  Confirm Booking Now
                </button>
              )}
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

              {/* Booked Services Card with Multipliers */}
              <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-groomish-orange" />
                    <h3 className="font-heading font-bold text-base text-groomish-slate">
                      Salon Services ({totalRawItems || 1})
                    </h3>
                  </div>
                  {isOwnBranch && booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
                    <button
                      onClick={handleOpenAddServiceModal}
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
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-groomish-orangeLight text-groomish-orange font-bold text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </div>

                          {/* Service Image */}
                          {grp.image ? (
                            <img
                              src={grp.image}
                              alt={grp.serviceName}
                              className="w-11 h-11 rounded-xl object-cover border border-groomish-slate/10 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-groomish-cream border border-groomish-slate/10 flex items-center justify-center text-groomish-orange shrink-0">
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

                        <div className="flex items-center gap-3">
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
                          {isOwnBranch && booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && totalRawItems > 1 && (
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
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-groomish-orangeLight text-groomish-orange font-bold text-xs flex items-center justify-center shrink-0">
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
                  )}
                </div>
              </div>

              {/* Retail Products Card */}
              <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-groomish-blue" />
                    <h3 className="font-heading font-bold text-base text-groomish-slate">
                      Retail Products ({(booking.products || booking.bookingProducts || []).length})
                    </h3>
                  </div>
                  {isOwnBranch && booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
                    <button
                      onClick={handleOpenAddProductModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-groomish-blue text-white text-xs font-bold hover:bg-sky-600 active:scale-95 transition shadow-soft"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Retail Product</span>
                    </button>
                  )}
                </div>

                {(booking.products || booking.bookingProducts) && (booking.products || booking.bookingProducts).length > 0 ? (
                  <div className="divide-y divide-groomish-slate/10 border border-groomish-slate/10 rounded-2xl overflow-hidden">
                    {(booking.products || booking.bookingProducts).map((prod, idx) => {
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
                                Qty: {qty} × ₹{prod.unitPriceSnapshot || prod.unitPrice || 0}
                                {prod.mrp && prod.mrp > (prod.unitPriceSnapshot || prod.unitPrice) && (
                                  <span className="text-groomish-slate/40 line-through ml-1.5">
                                    (MRP ₹{prod.mrp})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        <div className="flex items-center gap-3">
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
                          {isOwnBranch && booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
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
                    );
                  })}
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

            {/* Right 1 Col: Complete Invoice Breakdown & Finalize */}
            <div className="space-y-6">
              <InvoiceBreakdownCard
                booking={booking}
                className="rounded-3xl border border-groomish-slate/10 p-6 shadow-soft"
              >
                {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (() => {
                  const total = Number(booking.totalAmount ?? booking.pricePaid ?? 0);
                  const paid = Number(booking.pricePaid ?? 0);
                  const remaining = Number(
                    booking.remainingAmount !== undefined && booking.remainingAmount !== null
                      ? booking.remainingAmount
                      : Math.max(0, total - paid)
                  );
                  return (
                    <div className="space-y-2 mt-2">
                      {remaining > 0.01 && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 leading-tight">
                          <strong>Outstanding Balance:</strong> Collect <strong>₹{remaining}</strong> from client at counter (Cash/UPI/Card) before finalizing.
                        </div>
                      )}
                      <button
                        disabled={actionLoading}
                        onClick={handleCompleteAndBill}
                        className="w-full btn-primary text-xs py-3 rounded-2xl inline-flex items-center justify-center gap-2 font-bold shadow-soft cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {remaining > 0.01
                            ? `Finalize & Collect Balance (₹${remaining})`
                            : "Finalize & Bill Client"}
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </InvoiceBreakdownCard>
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {addServiceOpen && (
        <div className="fixed inset-0 z-50 bg-groomish-slate/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-groomish-slate/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-groomish-orange" />
                <div>
                  <h3 className="font-heading font-bold text-base text-groomish-slate">
                    Add Service to Appointment
                  </h3>
                  <p className="text-[11px] text-groomish-slate/60">
                    Search and attach salon services directly to this customer visit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddServiceOpen(false)}
                className="p-1.5 rounded-xl text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-groomish-slate/40" />
              <input
                type="text"
                placeholder="Search services by name or category..."
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:border-groomish-orange focus:bg-white transition"
              />
              {serviceSearchQuery && (
                <button
                  type="button"
                  onClick={() => setServiceSearchQuery("")}
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
                    onClick={() => setServiceSelectedCategory(cat)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition ${
                      serviceSelectedCategory === cat
                        ? "bg-groomish-orange text-white shadow-soft"
                        : "bg-groomish-cream hover:bg-groomish-slate/10 text-groomish-slate/70"
                    }`}
                  >
                    {cat === "ALL" ? "All Services" : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Services List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredServices.length > 0 ? (
                filteredServices.map((srv) => {
                  const inBookingCount = (booking?.bookingItems || []).filter(
                    (bi) => bi.serviceId === srv.id
                  ).length;
                  const isAdding = addingItemId === srv.id;
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
                            {inBookingCount > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-greenLight text-groomish-green">
                                In Booking ({inBookingCount})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                            {srv.durationMinutes || 30} mins • {srv.categoryName || "Salon Care"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-extrabold text-groomish-slate">
                          ₹{srv.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddServiceDirect(srv.id)}
                          disabled={actionLoading}
                          className="btn-primary text-xs px-3.5 py-1.5 font-bold shadow-soft flex items-center gap-1"
                        >
                          {isAdding ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{inBookingCount > 0 ? "Add Again" : "Add Service"}</span>
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
                    No services matched your search
                  </p>
                  <button
                    onClick={() => {
                      setServiceSearchQuery("");
                      setServiceSelectedCategory("ALL");
                    }}
                    className="mt-2 text-xs text-groomish-orange font-bold hover:underline"
                  >
                    Clear Search Filters
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setAddServiceOpen(false)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {addProductOpen && (
        <div className="fixed inset-0 z-50 bg-groomish-slate/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-groomish-slate/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-groomish-blue" />
                <div>
                  <h3 className="font-heading font-bold text-base text-groomish-slate">
                    Add Retail Product to Bill
                  </h3>
                  <p className="text-[11px] text-groomish-slate/60">
                    Search and bill salon retail care items for this customer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddProductOpen(false)}
                className="p-1.5 rounded-xl text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-groomish-slate/40" />
              <input
                type="text"
                placeholder="Search retail products by name, brand or category..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:border-groomish-orange focus:bg-white transition"
              />
              {productSearchQuery && (
                <button
                  type="button"
                  onClick={() => setProductSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Product Category Filter Pills */}
            {productCategories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {productCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductSelectedCategory(cat)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition ${
                      productSelectedCategory === cat
                        ? "bg-groomish-blue text-white shadow-soft"
                        : "bg-groomish-cream hover:bg-groomish-slate/10 text-groomish-slate/70"
                    }`}
                  >
                    {cat === "ALL" ? "All Products" : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Products List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const qty = productQtyMap[p.id] || 1;
                  const isAdding = addingItemId === p.id;
                  const inBillCount = (booking?.products || []).filter(
                    (bp) => bp.productId === p.id
                  ).reduce((sum, bp) => sum + (bp.quantity || 1), 0);

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl border border-groomish-slate/10 hover:border-groomish-blue/40 flex items-center justify-between gap-3 transition hover:bg-groomish-cream/30 bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-groomish-cream overflow-hidden border border-groomish-slate/10 shrink-0">
                          <img
                            src={
                              p.image ||
                              "https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=200&q=80"
                            }
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-groomish-slate truncate">
                              {p.name}
                            </h4>
                            {inBillCount > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-groomish-blue">
                                In Bill ({inBillCount})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                            {p.brand || "Groomish"} • {p.volumeOrSize || "Standard"} •{" "}
                            <span className="text-groomish-green font-semibold">
                              {p.stockQuantity ?? 10} in stock
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-groomish-slate block">
                            ₹{p.price}
                          </span>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-groomish-slate/20 rounded-xl overflow-hidden bg-groomish-cream/40">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(p.id, -1)}
                            className="p-1.5 hover:bg-groomish-slate/10 text-groomish-slate transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-groomish-slate min-w-[20px] text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(p.id, 1)}
                            className="p-1.5 hover:bg-groomish-slate/10 text-groomish-slate transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddProductDirect(p.id)}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 rounded-xl bg-groomish-blue text-white text-xs font-bold hover:bg-sky-600 active:scale-95 transition shadow-soft flex items-center gap-1"
                        >
                          {isAdding ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-8 h-8 text-groomish-slate/20 mx-auto mb-2" />
                  <p className="text-xs font-bold text-groomish-slate/70">
                    No products matched your search
                  </p>
                  <button
                    onClick={() => {
                      setProductSearchQuery("");
                      setProductSelectedCategory("ALL");
                    }}
                    className="mt-2 text-xs text-groomish-blue font-bold hover:underline"
                  >
                    Clear Search Filters
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setAddProductOpen(false)}
                className="btn-secondary text-xs px-4 py-2 font-bold"
              >
                Done
              </button>
            </div>
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
