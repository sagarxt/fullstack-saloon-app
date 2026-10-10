import { useEffect, useState } from "react";
import {
  getStaffDashboard,
  cancelStaffBooking,
  createCustomerByStaff,
  getStaffProducts,
  addProductToBookingByStaff,
  removeProductFromBookingByStaff,
  completeBookingAndSendBillByStaff,
  getStaffBooking,
} from "../../api/staff";
import ModalWrapper from "../../components/modals/ModalWrapper";
import CustomSelect from "../../components/common/CustomSelect";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";
import { extractList } from "../../utils/dataHelper";
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
} from "lucide-react";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TODAY"); // TODAY | UPCOMING | RECENT
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  // Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Store Products & Billing Modal
  const [billingBooking, setBillingBooking] = useState(null);
  const [staffProducts, setStaffProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQty, setProductQty] = useState(1);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billSuccess, setBillSuccess] = useState("");
  const [billError, setBillError] = useState("");

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

  /* Open Billing & Store Products Modal */
  const handleOpenBilling = async (booking) => {
    setBillError("");
    setBillSuccess("");
    setSelectedProductId("");
    setProductQty(1);
    setBillingBooking(booking);

    try {
      const [prodsRes, bookingRes] = await Promise.all([
        getStaffProducts(),
        getStaffBooking(booking.id).catch(() => ({ data: booking })),
      ]);
      setStaffProducts(extractList(prodsRes.data));
      if (bookingRes.data) {
        setBillingBooking(bookingRes.data);
      }
    } catch (err) {
      console.error(err);
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

  // Select list based on active tab
  const upcomingList = extractList(metrics.upcomingBookings);
  const recentList = extractList(metrics.recentBookings);
  const baseBookings =
    filter === "UPCOMING"
      ? upcomingList
      : filter === "RECENT"
      ? recentList
      : [...upcomingList, ...recentList];

  const bookingList = baseBookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, "");

    const code = (b.bookingCode || b.id || "").toLowerCase();
    const cleanCode = code.replace(/[^a-z0-9]/g, "");
    const matchCode = code.includes(q) || (cleanQ && cleanCode.includes(cleanQ));

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

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      {/* TOP HEADER */}
      <header className="h-16 bg-white border-b border-groomish-slate/10 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-soft">
        <div className="flex items-center gap-3">
          <img
            src="/groomish_logo_2.png"
            alt="Groomish Now"
            className="h-9 w-auto object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />
          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full">
            Staff Stylist Station
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* User profile badge */}
          <div className="flex items-center gap-2 bg-groomish-cream px-3 py-1.5 rounded-full border border-groomish-slate/10">
            <div className="w-6 h-6 rounded-full bg-groomish-orange text-white font-bold text-xs flex items-center justify-center">
              {user?.name?.charAt(0) || "S"}
            </div>
            <span className="text-xs font-bold text-groomish-slate">
              {user?.name || "Stylist"}
            </span>
          </div>

          <button
            onClick={() => navigate("/")}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-groomish-slate/70 hover:text-groomish-slate px-2 py-1 rounded-lg transition"
            title="Switch to customer website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Website</span>
          </button>

          <button
            onClick={logout}
            className="p-2 text-groomish-crimson hover:bg-groomish-crimsonLight rounded-full transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "TODAY"
                    ? "bg-groomish-slate text-white shadow-soft"
                    : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                }`}
              >
                Today's Appointments
              </button>
              <button
                onClick={() => setFilter("UPCOMING")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "UPCOMING"
                    ? "bg-groomish-orange text-white shadow-soft"
                    : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter("RECENT")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  filter === "RECENT"
                    ? "bg-groomish-blue text-white shadow-soft"
                    : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                }`}
              >
                Completed History
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
                {bookingList.length} listed
              </span>
            </div>
          </div>

          {/* Table / List */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-groomish-slate/60">Loading stylist schedule...</p>
            </div>
          ) : bookingList.length === 0 ? (
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
            <div className="divide-y divide-groomish-slate/10">
              {bookingList.map((b) => {
                const firstItem = b.items?.[0];
                const serviceName = firstItem?.serviceNameSnapshot || "Salon Care";
                const timeStr = b.scheduledAt
                  ? new Date(b.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Scheduled";
                const dateStr = b.scheduledAt
                  ? new Date(b.scheduledAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })
                  : "Today";

                return (
                  <div
                    key={b.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-groomish-cream/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-sm text-groomish-slate">
                            {serviceName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === "CONFIRMED"
                                ? "bg-groomish-greenLight text-groomish-green"
                                : b.status === "COMPLETED"
                                ? "bg-groomish-blueLight text-groomish-blue"
                                : b.status === "CANCELLED"
                                ? "bg-groomish-crimsonLight text-groomish-crimson"
                                : "bg-groomish-goldLight text-groomish-slate"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-extrabold bg-groomish-slate/5 text-groomish-slate border border-groomish-slate/15 tracking-wider">
                            {b.bookingCode || b.id?.slice(0, 8)}
                          </span>
                          <span className="text-xs text-groomish-slate/60">
                            Client: <b>{b.bookedBy || b.userName || "Walk-In Client"}</b>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-groomish-slate flex items-center gap-1 justify-end">
                          <Clock className="w-3.5 h-3.5 text-groomish-orange" />
                          <span>{timeStr}</span>
                          <span className="text-groomish-slate/40 text-[10px]">({dateStr})</span>
                        </div>
                        <div className="text-xs font-extrabold text-groomish-orange mt-0.5">
                          ₹{b.pricePaid ?? b.totalAmount}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {b.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleOpenBilling(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-groomish-cream text-groomish-slate border border-groomish-slate/15 hover:border-groomish-orange hover:bg-groomish-orange/10 font-bold text-xs transition shadow-soft"
                            title="Add salon products & finalize bill"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-groomish-orange" />
                            <span>Bill & Products</span>
                          </button>
                        )}

                        {b.status === "CONFIRMED" && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleMarkComplete(b.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 transition shadow-soft"
                            title="Complete appointment and dispatch bill email"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        )}

                        {b.status === "PENDING" && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleCancel(b.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-crimsonLight text-groomish-crimson font-bold text-xs hover:bg-groomish-crimson hover:text-white transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

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
              Instantly create a customer loyalty profile to award them reward points.
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

      {/* APPOINTMENT DETAILS MODAL */}
      <ModalWrapper
        open={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        maxWidth="max-w-md"
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            <div className="border-b border-groomish-slate/10 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-blue bg-groomish-blueLight px-2.5 py-0.5 rounded-full inline-block mb-1">
                Booking ID: {selectedBooking.bookingCode || selectedBooking.id?.slice(0, 8)}
              </span>
              <h2 className="text-xl font-heading font-bold text-groomish-slate">
                Appointment Information
              </h2>
            </div>

            <div className="bg-groomish-cream/70 rounded-2xl p-4 border border-groomish-slate/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-groomish-slate/60">Client:</span>
                <span className="font-bold text-groomish-slate">{selectedBooking.bookedBy || "Walk-In Client"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-groomish-slate/60">Scheduled Time:</span>
                <span className="font-medium text-groomish-slate">
                  {new Date(selectedBooking.scheduledAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-groomish-slate/60">Status:</span>
                <span className="font-bold text-groomish-orange">{selectedBooking.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-groomish-slate/60">Total Paid:</span>
                <span className="font-extrabold text-groomish-slate text-sm">
                  ₹{selectedBooking.pricePaid ?? selectedBooking.totalAmount}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-groomish-slate mb-2">Service Line Items</h4>
              <div className="space-y-1.5">
                {selectedBooking.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-groomish-slate/10"
                  >
                    <span>{item.serviceNameSnapshot} ({item.serviceDurationSnapshot} mins)</span>
                    <span className="font-bold">₹{item.servicePriceSnapshot}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="btn-secondary w-full py-2.5"
            >
              Close
            </button>
          </div>
        )}
      </ModalWrapper>

      {/* STORE PRODUCTS & ITEMIZED BILLING MODAL */}
      <ModalWrapper
        open={Boolean(billingBooking)}
        onClose={() => setBillingBooking(null)}
        maxWidth="max-w-lg"
      >
        {billingBooking && (
          <div className="space-y-4 text-xs">
            <div className="border-b border-groomish-slate/10 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
                Ref: {billingBooking.bookingCode || billingBooking.id?.slice(0, 8)}
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

            {/* Base Service Info */}
            <div className="p-3.5 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 space-y-1">
              <div className="flex justify-between font-bold text-groomish-slate">
                <span>Salon Treatment:</span>
                <span className="text-groomish-orange">{billingBooking.serviceName || "Signature Care"}</span>
              </div>
              <div className="flex justify-between text-groomish-slate/70">
                <span>Client:</span>
                <span className="font-semibold">{billingBooking.userName || billingBooking.bookedBy || "Walk-In Guest"}</span>
              </div>
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
                      className="p-2.5 rounded-xl bg-white border border-groomish-slate/10 flex items-center justify-between gap-3 shadow-soft"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-groomish-cream flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-groomish-orange" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-groomish-slate truncate">{bp.productName}</p>
                          <p className="text-[10px] text-groomish-slate/50">
                            Qty: {bp.quantity} × ₹{bp.unitPrice}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-groomish-slate">₹{bp.totalPrice}</span>
                        {billingBooking.status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(bp.id)}
                            className="p-1 text-groomish-crimson hover:bg-groomish-crimson/10 rounded-lg transition"
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
              <form onSubmit={handleAddProduct} className="p-3.5 rounded-2xl bg-white border border-groomish-slate/15 space-y-3">
                <label className="block font-bold text-groomish-slate text-[11px] uppercase tracking-wider">
                  Add Product from Store Inventory
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomSelect
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.value || e.target.value)}
                      placeholder="-- Choose Store Product --"
                      options={staffProducts.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.volumeOrSize || p.category}) - ₹${p.price} [Stock: ${p.stockQuantity}]`
                      }))}
                      className="py-2 text-xs"
                    />
                  </div>

                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={productQty}
                    onChange={(e) => setProductQty(e.target.value)}
                    className="input-groomish w-16 text-center text-xs py-2 font-bold"
                    title="Quantity"
                  />

                  <button
                    type="submit"
                    disabled={billingLoading || !selectedProductId}
                    className="btn-secondary text-xs px-3 py-2 shrink-0 flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
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
    </div>
  );
}
