import { useEffect, useState, useMemo } from "react";
import {
  getStaffDashboard,
  cancelStaffBooking,
  createCustomerByStaff,
  getStaffProducts,
  getStaffServices,
  addServiceToBookingByStaff,
  removeServiceFromBookingByStaff,
  addProductToBookingByStaff,
  removeProductFromBookingByStaff,
  completeBookingAndSendBillByStaff,
  confirmBookingByStaff,
  checkInBookingByStaff,
  getStaffBooking,
  updateStaffBooking,
  getCustomerBookingsByStaff,
  getCustomerHistoryByStaff,
} from "../../api/staff";
import ModalWrapper from "../../components/modals/ModalWrapper";
import CustomerProfileModal from "../../components/modals/CustomerProfileModal";
import CustomSelect from "../../components/common/CustomSelect";
import CustomDatePicker from "../../components/common/CustomDatePicker";
import { generateSlots } from "../../utils/slots";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../context/useAuth";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { extractList, sortBookingsWithTodayOnTop } from "../../utils/dataHelper";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import StaffBranchServicesTab from "../../components/staff/StaffBranchServicesTab";
import StaffBranchInventoryTab from "../../components/staff/StaffBranchInventoryTab";
import StaffBranchAnalyticsTab from "../../components/staff/StaffBranchAnalyticsTab";
import StaffProfileTab from "../../components/staff/StaffProfileTab";
import StaffCustomersTab from "../../components/staff/StaffCustomersTab";
import StaffBookingCard from "../../components/staff/StaffBookingCard";
import StaffSidebar from "../../components/staff/StaffSidebar";
import { showAlert } from "../../context/ConfirmContext";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Scissors,
  Users,
  DollarSign,
  UserCheck,
  TrendingUp,
  RefreshCw,
  LogOut,
  ExternalLink,
  Plus,
  AlertCircle,
  X,
  Check,
  Calendar,
  ShoppingBag,
  Trash2,
  Receipt,
  Package,
  Search,
  MapPin,
  Crown,
  Sparkles,
  History,
  User as UserIcon,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialFilter = tabParam === "customers"
    ? "BRANCH_CUSTOMERS"
    : tabParam === "analytics"
      ? "BRANCH_ANALYTICS"
      : tabParam === "services"
        ? "BRANCH_SERVICES"
        : tabParam === "inventory"
          ? "BRANCH_INVENTORY"
          : tabParam === "profile"
            ? "BRANCH_PROFILE"
            : "TODAY";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);

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

  // Close mobile drawer on tab change
  useEffect(() => {
    setSidebarOpen(false);
  }, [tabParam, filter]);

  // Ctrl+B shortcut to toggle sidebar
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

  useEffect(() => {
    if (tabParam === "customers") setFilter("BRANCH_CUSTOMERS");
    else if (tabParam === "analytics") setFilter("BRANCH_ANALYTICS");
    else if (tabParam === "services") setFilter("BRANCH_SERVICES");
    else if (tabParam === "inventory") setFilter("BRANCH_INVENTORY");
    else if (tabParam === "profile") setFilter("BRANCH_PROFILE");
    else if (!tabParam && (filter === "BRANCH_CUSTOMERS" || filter === "BRANCH_ANALYTICS" || filter === "BRANCH_SERVICES" || filter === "BRANCH_INVENTORY" || filter === "BRANCH_PROFILE")) {
      setFilter("TODAY");
    }
  }, [tabParam]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  // Walk-In Client Modal
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "Password@123",
    gender: "NOT_SPECIFIED",
  });
  const [clientError, setClientError] = useState("");
  const [clientSuccess, setClientSuccess] = useState("");



  // Store Products & Billing Modal
  const [billingBooking, setBillingBooking] = useState(null);
  const [staffProducts, setStaffProducts] = useState([]);
  const [staffServices, setStaffServices] = useState([]);
  const [selectedStaffServiceId, setSelectedStaffServiceId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQty, setProductQty] = useState(1);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billSuccess, setBillSuccess] = useState("");
  const [billError, setBillError] = useState("");

  // Reschedule / Modify Booking Modal
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  // Customer History & Rewards Modal
  const [customerModalBooking, setCustomerModalBooking] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getStaffDashboard();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load staff dashboard", err);
      // Fallback structure if network issue
      setData({
        todaysBookings: 0,
        todaysCompleted: 0,
        todaysPending: 0,
        todaysRevenue: 0,
        totalBookingsByStaff: 0,
        upcomingBookings: [],
        recentBookings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* Complete Booking & Send Bill */
  const handleMarkComplete = async (bookingId) => {
    setActionLoading(true);
    try {
      await completeBookingAndSendBillByStaff(bookingId);
      loadDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  /* Confirm Booking (Payment verified / Pay at salon) */
  const handleConfirm = async (bookingId) => {
    setActionLoading(true);
    try {
      await confirmBookingByStaff(bookingId);
      loadDashboard();
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Action Failed",
        message: err.response?.data?.message || "Failed to confirm appointment",
        variant: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  /* Check In Client upon arrival at salon */
  const handleCheckIn = async (bookingId) => {
    setActionLoading(true);
    try {
      await checkInBookingByStaff(bookingId);
      loadDashboard();
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Check-in Failed",
        message: err.response?.data?.message || "Failed to check in client",
        variant: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  /* Open Billing & Store Products Modal */
  const handleOpenBilling = async (booking) => {
    setBillError("");
    setBillSuccess("");
    setSelectedProductId("");
    setSelectedStaffServiceId("");
    setProductQty(1);
    setBillingBooking(booking);

    try {
      const [prodsRes, bookingRes, servsRes] = await Promise.all([
        getStaffProducts(),
        getStaffBooking(booking.id).catch(() => ({ data: booking })),
        getStaffServices().catch(() => ({ data: [] })),
      ]);
      setStaffProducts(extractList(prodsRes.data));
      setStaffServices(extractList(servsRes.data));
      if (bookingRes.data) {
        setBillingBooking(bookingRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* Add Service to Booking by Staff */
  const handleAddServiceByStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaffServiceId || !billingBooking) return;

    setBillingLoading(true);
    setBillError("");
    setBillSuccess("");
    try {
      let srvId = selectedStaffServiceId;
      let subName = undefined;
      if (selectedStaffServiceId.includes(":::")) {
        const parts = selectedStaffServiceId.split(":::");
        srvId = parts[0];
        subName = parts[1];
      }
      const res = await addServiceToBookingByStaff(billingBooking.id, srvId, subName);
      setBillingBooking(res.data);
      setBillSuccess("Service added to appointment!");
      setSelectedStaffServiceId("");
      loadDashboard();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add service";
      setBillError(msg);
    } finally {
      setBillingLoading(false);
    }
  };

  /* Remove Service from Booking by Staff */
  const handleRemoveServiceByStaff = async (itemId) => {
    if (!billingBooking) return;
    if (billingBooking.items?.length <= 1) {
      setBillError("Cannot remove the only service in this appointment.");
      return;
    }

    setBillingLoading(true);
    setBillError("");
    setBillSuccess("");
    try {
      const res = await removeServiceFromBookingByStaff(billingBooking.id, itemId);
      setBillingBooking(res.data);
      setBillSuccess("Service removed from appointment.");
      loadDashboard();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to remove service";
      setBillError(msg);
    } finally {
      setBillingLoading(false);
    }
  };

  /* Add Product to Appointment Bill */
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !billingBooking) return;

    setBillingLoading(true);
    setBillError("");
    setBillSuccess("");
    try {
      const res = await addProductToBookingByStaff(billingBooking.id, {
        productId: selectedProductId,
        quantity: Number(productQty) || 1,
      });
      setBillingBooking(res.data);
      setBillSuccess("Product added to appointment bill!");
      setSelectedProductId("");
      setProductQty(1);
      loadDashboard();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add product to booking";
      setBillError(msg);
    } finally {
      setBillingLoading(false);
    }
  };

  /* Remove Product from Appointment Bill */
  const handleRemoveProduct = async (bookingProductId) => {
    if (!billingBooking) return;
    setBillingLoading(true);
    setBillError("");
    try {
      const res = await removeProductFromBookingByStaff(billingBooking.id, bookingProductId);
      setBillingBooking(res.data);
      setBillSuccess("Product removed from bill.");
      loadDashboard();
    } catch (err) {
      setBillError("Failed to remove product");
    } finally {
      setBillingLoading(false);
    }
  };

  /* Finalize Service & Email Final Bill */
  const handleFinalizeBillAndComplete = async () => {
    if (!billingBooking) return;

    setBillingLoading(true);
    setBillError("");
    try {
      await completeBookingAndSendBillByStaff(billingBooking.id);
      setBillSuccess("Treatment completed! Itemized tax invoice & payment bill dispatched to client email.");
      setTimeout(() => {
        setBillingBooking(null);
      }, 2000);
      loadDashboard();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to complete appointment and send bill";
      setBillError(msg);
    } finally {
      setBillingLoading(false);
    }
  };

  /* Cancel Booking */
  const handleCancel = async (bookingId) => {
    const reason = window.prompt("Reason for cancellation (optional):", "Client requested reschedule");
    if (reason === null) return;

    setActionLoading(true);
    try {
      await cancelStaffBooking(bookingId, reason);
      loadDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  /* Reschedule / Modify Appointment */
  const handleOpenReschedule = (booking) => {
    setRescheduleError("");
    setRescheduleBooking(booking);
    if (booking.scheduledAt) {
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
    setRescheduleNotes(booking.note || "");
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) {
      setRescheduleError("Please select both a date and time.");
      return;
    }

    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const scheduledIso = `${rescheduleDate}T${rescheduleTime}:00`;
      await updateStaffBooking(rescheduleBooking.id, {
        scheduledAt: scheduledIso,
        note: rescheduleNotes.trim(),
      });
      setRescheduleBooking(null);
      loadDashboard();
    } catch (err) {
      setRescheduleError(err.response?.data?.message || "Failed to reschedule booking.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  /* Customer Profile & Rewards Inspection */
  const handleOpenCustomerHistory = (booking) => {
    setCustomerModalBooking(booking);
  };

  /* Register Walk-In Client */
  const handleRegisterClient = async (e) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email) {
      setClientError("Name and email are required.");
      return;
    }

    setActionLoading(true);
    setClientError("");
    setClientSuccess("");
    try {
      await createCustomerByStaff(clientForm);
      setClientSuccess("Walk-in client registered! Welcome email with loyalty account dispatched.");
      setClientForm({
        name: "",
        email: "",
        phone: "",
        password: "Password@123",
        gender: "NOT_SPECIFIED",
      });
      loadDashboard();
      setTimeout(() => {
        setClientModalOpen(false);
        setClientSuccess("");
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to register client.";
      setClientError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const metrics = data || {
    todaysBookings: 0,
    todaysCompleted: 0,
    todaysPending: 0,
    todaysRevenue: 0,
    totalBookingsByStaff: 0,
    upcomingBookings: [],
    recentBookings: [],
  };

  // Aggregate all unique bookings
  const allList = useMemo(() => {
    const raw = [
      ...extractList(metrics.allBookings),
      ...extractList(metrics.todaysBookingsList),
      ...extractList(metrics.upcomingBookings),
      ...extractList(metrics.completedBookings),
      ...extractList(metrics.recentBookings),
    ];
    const map = new Map();
    raw.forEach((b) => {
      if (b && b.id && !map.has(b.id)) map.set(b.id, b);
    });
    return Array.from(map.values());
  }, [metrics]);

  // Today helper
  const isTodayDate = (b) => {
    const raw = b.scheduledAt || b.createdAt;
    if (!raw) return false;
    const dateStr = String(raw).slice(0, 10);
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return dateStr === todayISO || dateStr === localToday;
  };

  // Today's Appointments
  const todayList = useMemo(() => {
    if (Array.isArray(metrics.todaysBookingsList) && metrics.todaysBookingsList.length > 0) {
      return metrics.todaysBookingsList;
    }
    return allList.filter((b) => isTodayDate(b));
  }, [metrics.todaysBookingsList, allList]);

  // Upcoming Appointments
  const upcomingList = useMemo(() => {
    if (Array.isArray(metrics.upcomingBookings) && metrics.upcomingBookings.length > 0) {
      return metrics.upcomingBookings;
    }
    const now = new Date();
    return allList.filter((b) => {
      if (b.status === "COMPLETED" || b.status === "CANCELLED") return false;
      if (!b.scheduledAt) return false;
      return new Date(b.scheduledAt) > now;
    });
  }, [metrics.upcomingBookings, allList]);

  // Completed History
  const completedList = useMemo(() => {
    if (Array.isArray(metrics.completedBookings) && metrics.completedBookings.length > 0) {
      return metrics.completedBookings;
    }
    return allList.filter((b) => b.status === "COMPLETED");
  }, [metrics.completedBookings, allList]);

  // Select list based on active tab
  const baseBookings = useMemo(() => {
    if (filter === "TODAY") return todayList;
    if (filter === "UPCOMING") return upcomingList;
    if (filter === "RECENT") return completedList;
    if (filter === "ALL") return allList;
    return todayList;
  }, [filter, todayList, upcomingList, completedList, allList]);

  const bookingList = baseBookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, "");

    const code = (b.bookingCode || (b.id ? `GN-${b.id.slice(0, 8).toUpperCase()}` : "") || "").toLowerCase();
    const cleanCode = code.replace(/[^a-z0-9]/g, "");
    const matchCode = code.includes(q) || (cleanQ && cleanCode.includes(cleanQ)) || (b.id && b.id.toLowerCase().includes(q));

    const matchUser =
      (b.bookedBy && b.bookedBy.toLowerCase().includes(q)) ||
      (b.userName && b.userName.toLowerCase().includes(q)) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.userEmail && b.userEmail.toLowerCase().includes(q)) ||
      (b.userPhone && b.userPhone.toLowerCase().includes(q));

    const matchService = b.items?.some((item) =>
      item.serviceNameSnapshot?.toLowerCase().includes(q)
    );

    return matchCode || matchUser || matchService;
  });

  const sortedBookingList = useMemo(() => {
    return sortBookingsWithTodayOnTop(bookingList);
  }, [bookingList]);

  return (
    <div className="min-h-screen bg-groomish-cream font-sans w-full max-w-full overflow-x-hidden">
      {/* STAFF SIDEBAR (Drawer on Mobile, Collapsible on Desktop) */}
      <StaffSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {/* MAIN VIEW AREA */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-0" : "lg:pl-64"
          } pl-0`}
      >
        {/* TOP HEADER (Desktop) with Sidebar Toggle & Quick Actions */}
        <header className="hidden lg:flex h-14 bg-white/85 backdrop-blur-md border-b border-groomish-slate/10 px-6 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="px-2.5 py-1.5 rounded-xl text-groomish-slate/75 hover:text-groomish-orange hover:bg-groomish-orange/10 border border-groomish-slate/15 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-groomish-slate uppercase tracking-wider">
                Salon Stylist Terminal
              </span>
              {(data?.storeName || user?.storeName) && (
                <span className="text-[10px] bg-groomish-orange/15 text-groomish-orange font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{data?.storeName || user?.storeName}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setClientError("");
                setClientSuccess("");
                setClientModalOpen(true);
              }}
              className="btn-primary text-xs px-3 py-1.5 font-bold shadow-soft flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Walk-In</span>
            </button>

            <button
              type="button"
              onClick={loadDashboard}
              className="p-1.5 rounded-xl border border-groomish-slate/15 bg-white text-groomish-slate hover:bg-groomish-cream transition cursor-pointer"
              title="Refresh schedule"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs font-bold text-groomish-slate/75 hover:text-groomish-orange px-2.5 py-1.5 rounded-xl border border-groomish-slate/15 transition flex items-center gap-1 bg-white shadow-2xs cursor-pointer"
            >
              <span>Store</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* TOP HEADER (Mobile / Tablet) with Hamburger Menu */}
        <header className="h-14 sm:h-16 bg-white border-b border-groomish-slate/10 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs lg:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-xl hover:bg-groomish-cream text-groomish-slate border border-groomish-slate/15 transition cursor-pointer"
              aria-label="Open staff navigation menu"
              title="Open Staff Menu"
            >
              <Menu className="w-5 h-5 text-groomish-slate" />
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/staff/dashboard")}
            >
              <img
                src="/groomish_logo_2.png"
                alt="Groomish Now"
                className="h-7 sm:h-8 w-auto object-contain"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-full">
                Staff
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setClientError("");
                setClientSuccess("");
                setClientModalOpen(true);
              }}
              className="btn-primary text-xs px-2.5 py-1 font-bold shadow-soft flex items-center gap-1 cursor-pointer"
              title="Register Walk-In Client"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Walk-In</span>
            </button>

            <button
              onClick={logout}
              className="p-1.5 text-groomish-crimson hover:bg-groomish-crimsonLight rounded-xl border border-groomish-slate/10 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Strip */}
        <div className="lg:hidden bg-groomish-slate text-white px-4 py-2 flex items-center gap-2 overflow-x-auto border-b border-white/10 select-none">
          <button
            onClick={() => {
              navigate("/staff/dashboard");
              setFilter("TODAY");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filter === "TODAY" || filter === "UPCOMING" || filter === "RECENT" || filter === "ALL"
              ? "bg-groomish-orange text-white"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            Branch Bookings
          </button>
          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=customers");
              setFilter("BRANCH_CUSTOMERS");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filter === "BRANCH_CUSTOMERS"
              ? "bg-groomish-orange text-white"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            Customers
          </button>
          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=analytics");
              setFilter("BRANCH_ANALYTICS");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filter === "BRANCH_ANALYTICS"
              ? "bg-groomish-orange text-white"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            Analysis Dashboard
          </button>
          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=profile");
              setFilter("BRANCH_PROFILE");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filter === "BRANCH_PROFILE"
              ? "bg-groomish-orange text-white"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            Stylist Profile
          </button>
          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=services");
              setFilter("BRANCH_SERVICES");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filter === "BRANCH_SERVICES"
              ? "bg-groomish-orange text-white"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            Branch Services
          </button>
          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=inventory");
              setFilter("BRANCH_INVENTORY");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filter === "BRANCH_INVENTORY"
              ? "bg-groomish-orange text-white"
              : "text-white/70 hover:bg-white/10"
              }`}
          >
            Branch Inventory
          </button>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 space-y-4">
          {filter === "BRANCH_CUSTOMERS" ? (
            <StaffCustomersTab
              onOpenRegisterModal={() => {
                setClientError("");
                setClientSuccess("");
                setClientModalOpen(true);
              }}
            />
          ) : filter === "BRANCH_PROFILE" ? (
            <StaffProfileTab
              onNavigateTab={(tab) => {
                if (tab === "services") {
                  navigate("/staff/dashboard?tab=services");
                  setFilter("BRANCH_SERVICES");
                } else if (tab === "inventory") {
                  navigate("/staff/dashboard?tab=inventory");
                  setFilter("BRANCH_INVENTORY");
                } else {
                  navigate("/staff/dashboard");
                  setFilter("TODAY");
                }
              }}
            />
          ) : filter === "BRANCH_ANALYTICS" ? (
            <StaffBranchAnalyticsTab
              storeName={data?.storeName || user?.storeName}
            />
          ) : filter === "BRANCH_SERVICES" ? (
            <StaffBranchServicesTab
              storeName={data?.storeName || user?.storeName}
            />
          ) : filter === "BRANCH_INVENTORY" ? (
            <StaffBranchInventoryTab
              storeName={data?.storeName || user?.storeName}
            />
          ) : (
            <>
              {/* Title & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
                    Today's Styling Schedule
                  </h1>
                  <p className="text-xs text-groomish-slate/60 mt-0.5">
                    Review assigned appointments, complete salon treatments, and onboard walk-in guests.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadDashboard}
                    className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
                    title="Refresh schedule"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
                  </button>

                  <button
                    onClick={() => {
                      setClientError("");
                      setClientSuccess("");
                      setClientModalOpen(true);
                    }}
                    className="btn-primary text-xs px-4 py-2.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Walk-In Client</span>
                  </button>
                </div>
              </div>

              {/* METRICS ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Today's Bookings */}
                <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
                      Today's Bookings
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center">
                      <CalendarClock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-heading font-extrabold text-groomish-slate">
                    {metrics.todaysBookings || 0}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1">
                    {metrics.todaysPending || 0} pending treatments
                  </p>
                </div>

                {/* Completed */}
                <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
                      Completed
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-groomish-greenLight text-groomish-green flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-heading font-extrabold text-groomish-green">
                    {metrics.todaysCompleted || 0}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1">
                    Treatments fulfilled
                  </p>
                </div>

                {/* Today's Revenue */}
                <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
                      Today's Billing
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-groomish-goldLight text-groomish-orange flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-heading font-extrabold text-groomish-slate">
                    ₹{metrics.todaysRevenue || 0}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1">
                    Services completed today
                  </p>
                </div>

                {/* Total Assisted */}
                <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
                      Total Services
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-groomish-blueLight text-groomish-blue flex items-center justify-center">
                      <Scissors className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-heading font-extrabold text-groomish-slate">
                    {metrics.totalBookingsByStaff || 0}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1">
                    All-time completed visits
                  </p>
                </div>
              </div>

              {/* APPOINTMENTS QUEUE */}
              <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
                {/* Tabs & Search */}
                <div className="p-4 sm:p-6 border-b border-groomish-slate/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setFilter("TODAY")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${filter === "TODAY"
                        ? "bg-groomish-slate text-white shadow-soft"
                        : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                        }`}
                    >
                      <span>Today's Appointments</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${filter === "TODAY"
                          ? "bg-white/20 text-white"
                          : "bg-groomish-slate/10 text-groomish-slate font-bold"
                          }`}
                      >
                        {todayList.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFilter("UPCOMING")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${filter === "UPCOMING"
                        ? "bg-groomish-orange text-white shadow-soft"
                        : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                        }`}
                    >
                      <span>Upcoming</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${filter === "UPCOMING"
                          ? "bg-white/20 text-white"
                          : "bg-groomish-slate/10 text-groomish-slate font-bold"
                          }`}
                      >
                        {upcomingList.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFilter("RECENT")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${filter === "RECENT"
                        ? "bg-groomish-green text-white shadow-soft"
                        : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                        }`}
                    >
                      <span>Completed History</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${filter === "RECENT"
                          ? "bg-white/20 text-white"
                          : "bg-groomish-slate/10 text-groomish-slate font-bold"
                          }`}
                      >
                        {completedList.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFilter("ALL")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${filter === "ALL"
                        ? "bg-groomish-blue text-white shadow-soft"
                        : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                        }`}
                    >
                      <span>All</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${filter === "ALL"
                          ? "bg-white/20 text-white"
                          : "bg-groomish-slate/10 text-groomish-slate font-bold"
                          }`}
                      >
                        {allList.length}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72">
                      <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by ID (GN-XX-123456), client..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 focus:bg-white transition"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-groomish-slate/50 font-medium whitespace-nowrap">
                      {sortedBookingList.length} listed
                    </span>
                  </div>
                </div>

                {/* Table / List */}
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-groomish-slate/60">Loading stylist schedule...</p>
                  </div>
                ) : sortedBookingList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-groomish-slate/50 space-y-2">
                    {search ? (
                      <>
                        <p className="font-semibold text-groomish-slate text-sm">
                          No appointments match "{search}"
                        </p>
                        <p className="text-groomish-slate/60 text-xs">
                          Try searching by 10-digit Booking ID (e.g. GN-XX-123456), client name, or service.
                        </p>
                        <button
                          onClick={() => setSearch("")}
                          className="mt-2 text-xs font-bold text-groomish-orange hover:underline inline-block"
                        >
                          Clear search filter
                        </button>
                      </>
                    ) : (
                      <p>No appointments found for the selected view.</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 space-y-3">
                    {sortedBookingList
                      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                      .map((b) => (
                        <StaffBookingCard
                          key={b.id}
                          booking={b}
                          onOpenReschedule={handleOpenReschedule}
                          onOpenBilling={handleOpenBilling}
                          onConfirm={handleConfirm}
                          onCheckIn={handleCheckIn}
                          onComplete={handleMarkComplete}
                          onCancel={handleCancel}
                          actionLoading={actionLoading}
                          refresh={loadDashboard}
                        />
                      ))}
                  </div>
                )}

                {sortedBookingList.length > 0 && (
                  <div className="p-4 border-t border-groomish-slate/10 bg-white">
                    <Pagination
                      currentPage={page}
                      totalItems={sortedBookingList.length}
                      pageSize={PAGE_SIZE}
                      onPageChange={setPage}
                      itemName="appointments"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* WALK-IN CLIENT MODAL */}
      <ModalWrapper
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              Stylist Station Registration
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate">
              Register Walk-In Client
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Instantly create a customer loyalty profile to award them Groom Coins.
            </p>
          </div>

          {clientError && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{clientError}</span>
            </div>
          )}

          {clientSuccess && (
            <div className="p-3 bg-groomish-green/10 text-groomish-green text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{clientSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRegisterClient} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Client Full Name
              </label>
              <input
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                required
                className="input-groomish"
                placeholder="e.g. Ananya Roy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Email Address (For Appointment Receipts)
              </label>
              <input
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                required
                className="input-groomish"
                placeholder="ananya@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Phone Number
                </label>
                <input
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="input-groomish"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Gender
                </label>
                <CustomSelect
                  name="gender"
                  value={clientForm.gender}
                  onChange={(e) => setClientForm({ ...clientForm, gender: e.target.value })}
                  options={[
                    { value: "FEMALE", label: "Female" },
                    { value: "MALE", label: "Male" },
                    { value: "NOT_SPECIFIED", label: "Other / Unspecified" },
                  ]}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="btn-auth mt-2"
            >
              {actionLoading ? "Registering..." : "Enroll Client & Create Loyalty Account"}
            </button>
          </form>
        </div>
      </ModalWrapper>

      {/* STORE PRODUCTS & ITEMIZED BILLING MODAL */}
      <ModalWrapper
        open={Boolean(billingBooking)}
        onClose={() => setBillingBooking(null)}
        maxWidth="max-w-2xl"
      >
        {billingBooking && (
          <div className="space-y-4 text-xs">
            <div className="border-b border-groomish-slate/10 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
                Ref: {billingBooking.bookingCode || (billingBooking.id ? `GN-${billingBooking.id.slice(0, 8).toUpperCase()}` : "")}
              </span>
              <h2 className="text-xl font-heading font-bold text-groomish-slate">
                Add Products & Final Bill
              </h2>
              <p className="text-xs text-groomish-slate/60 mt-0.5">
                Attach retail store products to this visit and dispatch the official tax invoice to the client.
              </p>
            </div>

            {billError && (
              <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{billError}</span>
              </div>
            )}

            {billSuccess && (
              <div className="p-3 bg-groomish-green/10 text-groomish-green rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{billSuccess}</span>
              </div>
            )}

            {/* Salon Services in Appointment */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-groomish-slate flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-groomish-orange" />
                  <span>Salon Services ({billingBooking.items?.length || (billingBooking.products?.length > 0 ? 0 : 1)})</span>
                </h4>
                <span className="text-[11px] text-groomish-slate/60">
                  Client: <strong className="text-groomish-slate">{billingBooking.userName || billingBooking.bookedBy || "Walk-In Guest"}</strong>
                </span>
              </div>

              {/* Service Items List */}
              <div className="space-y-2">
                {billingBooking.items && billingBooking.items.length > 0 ? (
                  groupBookingServices(billingBooking.items).map((grp, idx) => (
                    <div
                      key={grp.key || `${grp.serviceId || ""}_${grp.serviceName || ""}_${idx}`}
                      className="p-3 rounded-xl bg-white border border-groomish-slate/10 flex items-center justify-between gap-3 shadow-soft"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-groomish-orangeLight text-groomish-orange font-bold flex items-center justify-center text-[10px] shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-groomish-slate truncate">
                              {grp.serviceName}{grp.quantity > 1 ? ` X ${grp.quantity}` : ""}
                            </p>
                            {grp.quantity > 1 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orange text-white shrink-0">
                                × {grp.quantity}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-groomish-slate/50">
                            {grp.totalDuration || grp.durationMinutes} mins
                            {grp.quantity > 1 && ` (₹${grp.unitPrice} each)`}
                            {" • Status: "}
                            <span className={billingBooking.status === "CANCELLED" || grp.status === "CANCELLED" ? "text-groomish-crimson font-bold uppercase" : ""}>
                              {billingBooking.status === "CANCELLED" || grp.status === "CANCELLED" ? "CANCELLED" : (grp.status || "CONFIRMED")}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-extrabold text-groomish-slate block">₹{grp.totalPrice}</span>
                          {grp.totalMrp && grp.totalMrp > grp.totalPrice && (
                            <span className="text-[10px] text-groomish-slate/40 line-through block">
                              ₹{grp.totalMrp}
                            </span>
                          )}
                        </div>
                        {billingBooking.status !== "COMPLETED" && billingBooking.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceByStaff(grp.itemIds[grp.itemIds.length - 1])}
                            className="p-1.5 text-groomish-crimson hover:bg-groomish-crimson/10 rounded-lg transition"
                            title={grp.quantity > 1 ? "Remove 1 quantity" : "Remove service"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (billingBooking.products && billingBooking.products.length > 0) ? (
                  <div className="p-3 rounded-xl bg-white border border-groomish-slate/10 text-center text-xs text-groomish-slate/60">
                    <p className="font-semibold text-groomish-slate">No Salon Services in this Order</p>
                    <p className="text-[11px] text-groomish-slate/50 mt-0.5">This appointment contains retail products only.</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-groomish-slate/10 flex items-center justify-between">
                    <span className="font-bold text-groomish-slate">{billingBooking.serviceName || "Salon Service"}</span>
                    <span className="font-extrabold text-groomish-slate">₹{billingBooking.totalAmount}</span>
                  </div>
                )}
              </div>

              {/* Add Service by Stylist Form */}
              {billingBooking.status !== "COMPLETED" && (
                <form onSubmit={handleAddServiceByStaff} className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-groomish-cream/40 p-2.5 rounded-xl border border-groomish-slate/10">
                  <div className="flex-1 min-w-0">
                    <CustomSelect
                      value={selectedStaffServiceId}
                      onChange={(e) => setSelectedStaffServiceId(e.value || e.target.value)}
                      placeholder="-- Add Service to Appointment --"
                      searchPlaceholder="Search services..."
                      searchable={true}
                      options={staffServices.flatMap((s) => {
                        if (Array.isArray(s.subServices) && s.subServices.length > 0) {
                          return s.subServices.map((sub) => ({
                            value: `${s.id}:::${sub.name}`,
                            label: `${s.name} - ${sub.name} (₹${sub.price} • ${sub.durationMinutes || s.durationMinutes}m)`,
                          }));
                        }
                        return [{
                          value: s.id,
                          label: `${s.name} (₹${s.price} • ${s.durationMinutes}m)`,
                        }];
                      })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedStaffServiceId || billingLoading}
                    className="btn-primary py-2.5 px-4 text-xs shrink-0 flex items-center justify-center gap-1.5 font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service</span>
                  </button>
                </form>
              )}
            </div>

            {/* Attached Products List */}
            <div>
              <h4 className="font-bold text-groomish-slate mb-2 flex items-center justify-between">
                <span>Attached Retail Products ({billingBooking.products?.length || 0})</span>
                <span className="text-[11px] text-groomish-slate/50 font-normal">Included in final bill</span>
              </h4>

              {(!billingBooking.products || billingBooking.products.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-groomish-slate/20 text-center text-groomish-slate/50">
                  No retail products added yet. Use the selector below to add hair serums, facial cleansers, or styling clay.
                </div>
              ) : (
                <div className="space-y-2">
                  {billingBooking.products.map((bp) => (
                    <div
                      key={bp.id}
                      className="p-3 rounded-xl bg-white border border-groomish-slate/10 flex items-center justify-between gap-3 shadow-soft"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-groomish-cream flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-groomish-orange" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-groomish-slate truncate">
                            {bp.productName}{bp.quantity > 1 ? ` X ${bp.quantity}` : ""}
                          </p>
                          <p className="text-[10px] text-groomish-slate/50">
                            Qty: {bp.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-extrabold text-groomish-slate block">₹{bp.totalPrice}</span>
                          {bp.mrp && bp.mrp > bp.unitPrice && (
                            <span className="text-[10px] text-groomish-slate/40 line-through block">
                              ₹{bp.mrp * (bp.quantity || 1)}
                            </span>
                          )}
                        </div>
                        {billingBooking.status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(bp.id)}
                            className="p-1.5 text-groomish-crimson hover:bg-groomish-crimson/10 rounded-lg transition"
                            title="Remove product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Product Form (if not completed) */}
            {billingBooking.status !== "COMPLETED" && (
              <form onSubmit={handleAddProduct} className="p-3.5 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/15 space-y-2.5">
                <label className="block font-bold text-groomish-slate text-[11px] uppercase tracking-wider">
                  Add Product from Store Inventory
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <CustomSelect
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.value || e.target.value)}
                      placeholder="-- Choose Store Product --"
                      searchPlaceholder="Search 100+ store products..."
                      searchable={true}
                      options={staffProducts.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.volumeOrSize || p.category}) - ₹${p.price} [Stock: ${p.stockQuantity}]`
                      }))}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-white border border-groomish-slate/15 rounded-xl px-2.5 py-1.5">
                      <span className="text-[10px] text-groomish-slate/50 font-bold uppercase">Qty</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={productQty}
                        onChange={(e) => setProductQty(e.target.value)}
                        className="w-10 text-center text-xs font-bold outline-none bg-transparent"
                        title="Quantity"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={billingLoading || !selectedProductId}
                      className="btn-primary text-xs px-4 py-2.5 shrink-0 flex items-center justify-center gap-1 font-bold shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Bill Summary */}
            <div className="p-4 bg-groomish-cream rounded-2xl border border-groomish-slate/10 space-y-2">
              <div className="flex justify-between text-xs text-groomish-slate/70">
                <span>Total Items:</span>
                <span>{(billingBooking.products?.length || 0) + 1} item(s)</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-groomish-slate/10">
                <span className="font-extrabold text-sm text-groomish-slate">Final Bill Amount:</span>
                <span className="text-xl font-extrabold text-groomish-orange">
                  ₹{billingBooking.pricePaid ?? billingBooking.totalAmount}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBillingBooking(null)}
                className="btn-secondary flex-1 py-3 text-xs"
              >
                Close
              </button>

              {billingBooking.status !== "COMPLETED" ? (
                <button
                  type="button"
                  disabled={billingLoading}
                  onClick={() => handleFinalizeBillAndComplete()}
                  className="btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5 shadow-glowOrange"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{billingLoading ? "Dispatching..." : "Complete & Send Bill Email"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={billingLoading}
                  onClick={() => handleFinalizeBillAndComplete()}
                  className="btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Resend Bill Email</span>
                </button>
              )}
            </div>
          </div>
        )}
      </ModalWrapper>

      {/* ============================================================ */}
      {/* RESCHEDULE APPOINTMENT MODAL                                 */}
      {/* ============================================================ */}
      <ModalWrapper
        open={Boolean(rescheduleBooking)}
        onClose={() => setRescheduleBooking(null)}
        title="Reschedule Appointment"
      >
        {rescheduleBooking && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-groomish-slate/60 font-medium">Client</p>
                <p className="text-sm font-bold text-groomish-slate">
                  {rescheduleBooking.bookedBy || rescheduleBooking.userName || "Walk-In Client"}
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white border border-groomish-slate/10 font-extrabold text-groomish-slate">
                {rescheduleBooking.bookingCode || (rescheduleBooking.id ? `GN-${rescheduleBooking.id.slice(0, 8).toUpperCase()}` : "")}
              </span>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-groomish-crimsonLight text-groomish-crimson text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">New Appointment Date</label>
                <CustomDatePicker
                  value={rescheduleDate}
                  minDate={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })()}
                  onChange={(e, val) => setRescheduleDate(val || e?.target?.value || "")}
                  placeholder="Select Date"
                  align="left"
                  className="w-full"
                  triggerClassName="w-full !py-2.5 !px-3.5 !rounded-xl !bg-groomish-cream/60 hover:!bg-white !border-groomish-slate/20 text-xs font-bold transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-groomish-slate mb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-groomish-orange" />
                    <span>Branch Time Slots</span>
                    {rescheduleTime && (
                      <span className="text-[10px] font-mono font-bold text-groomish-green bg-groomish-greenLight px-2 py-0.5 rounded-full border border-groomish-green/20">
                        Selected: {rescheduleTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 border border-groomish-slate/15 rounded-xl bg-groomish-cream/40">
                  {generateSlots("09:00", "21:00", 30).map((time) => {
                    const isSelected = rescheduleTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setRescheduleTime(time)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${isSelected
                          ? "bg-groomish-orange text-white shadow-soft font-black"
                          : "bg-white text-groomish-slate border border-groomish-slate/20 hover:border-groomish-orange hover:bg-groomish-orangeLight/30"
                          }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-groomish-slate/50 mt-1">
                  * 24-hour salon schedule format without AM/PM.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Stylist Notes / Special Instructions
              </label>
              <textarea
                rows={3}
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Client requested to postpone by 1 hour, hair wash required first..."
                className="w-full p-3 rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:ring-1 focus:ring-groomish-orange text-xs text-groomish-slate"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleBooking(null)}
                className="btn-secondary flex-1 py-2.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rescheduleLoading}
                className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <CalendarClock className="w-4 h-4" />
                <span>{rescheduleLoading ? "Saving..." : "Update Schedule"}</span>
              </button>
            </div>
          </form>
        )}
      </ModalWrapper>

      {/* ============================================================ */}
      {/* CUSTOMER PROFILE, ORDERS & REWARDS MODAL                     */}
      {/* ============================================================ */}
      <CustomerProfileModal
        customerId={customerModalBooking?.userId}
        initialData={{
          id: customerModalBooking?.userId,
          name: customerModalBooking?.bookedBy || customerModalBooking?.userName,
          email: customerModalBooking?.userEmail,
          phone: customerModalBooking?.userPhone,
        }}
        open={Boolean(customerModalBooking)}
        onClose={() => setCustomerModalBooking(null)}
      />
    </div>
  );
}
