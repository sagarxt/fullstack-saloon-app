import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalWrapper from "./ModalWrapper";
import { useAuth } from "../../context/useAuth";
import {
  getCustomerProfileApi,
  getCustomerPointsApi,
  getCustomerPointsHistoryApi,
  getCustomerBookingsApi,
  toggleUserStatusApi,
  updateUserGroupsApi,
  getUserGroupsCatalogApi,
} from "../../api/admin";
import { updateCustomerByStaff } from "../../api/staff";
import { extractList } from "../../utils/dataHelper";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import { showAlert } from "../../context/ConfirmContext";
import {
  User,
  Users,
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
  Layers,
  ChevronRight,
  Info,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
} from "lucide-react";
import GroomCoinIcon from "../common/GroomCoinIcon";
import Pagination from "../common/Pagination";
import {
  getUserCart,
  updateItemForUser,
  removeItemForUser,
  clearCartForUser,
} from "../../api/cart";

export default function CustomerProfileModal({
  customerId,
  initialData = null,
  initialTab = "ORDERS",
  open,
  onClose,
  onStatusChange,
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
  const [bookingPage, setBookingPage] = useState(1);
  const BOOKINGS_PAGE_SIZE = 20;
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [userCart, setUserCart] = useState(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Customer Groups State
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [userGroupsCatalog, setUserGroupsCatalog] = useState([]);
  const [savingGroups, setSavingGroups] = useState(false);
  const [groupSuccessMsg, setGroupSuccessMsg] = useState("");
  const [customGroupInput, setCustomGroupInput] = useState("");

  const handleToggleGroup = (groupId) => {
    setGroupSuccessMsg("");
    setAssignedGroups((prev) => {
      const upper = groupId.toUpperCase();
      if (prev.includes(upper)) {
        return prev.filter((g) => g !== upper);
      } else {
        return [...prev, upper];
      }
    });
  };

  const handleAddCustomGroup = (e) => {
    e.preventDefault();
    const tag = customGroupInput.trim().toUpperCase().replace(/\s+/g, "_");
    if (!tag) return;
    if (!assignedGroups.includes(tag)) {
      setAssignedGroups((prev) => [...prev, tag]);
    }
    setCustomGroupInput("");
  };

  const handleSaveUserGroups = async () => {
    if (!customerId || savingGroups) return;
    setSavingGroups(true);
    setGroupSuccessMsg("");
    try {
      const res = await updateUserGroupsApi(customerId, assignedGroups);
      const updatedUser = res.data;
      setProfile((prev) => ({
        ...prev,
        userGroups: updatedUser.userGroups,
        effectiveGroups: updatedUser.effectiveGroups,
      }));
      setAssignedGroups(Array.from(updatedUser.userGroups || []));
      setGroupSuccessMsg("User groups updated successfully!");
      if (onStatusChange) {
        onStatusChange();
      }
      setTimeout(() => setGroupSuccessMsg(""), 3000);
    } catch (err) {
      await showAlert({
        title: "Action Failed",
        message: err.response?.data?.message || "Failed to update user groups",
        variant: "danger",
      });
    } finally {
      setSavingGroups(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!customerId || togglingStatus) return;
    const currentActive = profile?.active !== false;
    const nextActive = !currentActive;
    setTogglingStatus(true);
    try {
      if (isAdmin) {
        await toggleUserStatusApi(customerId, nextActive);
      } else {
        await updateCustomerByStaff(customerId, { active: nextActive });
      }
      setProfile((prev) => (prev ? { ...prev, active: nextActive } : { active: nextActive }));
      if (onStatusChange) {
        onStatusChange(customerId, nextActive);
      }
    } catch (err) {
      console.error("Failed to toggle customer status:", err);
      await showAlert({
        title: "Action Failed",
        message: err.response?.data?.message || "Failed to toggle customer account status",
        variant: "danger",
      });
    } finally {
      setTogglingStatus(false);
    }
  };

  const fetchUserCart = async () => {
    if (!customerId) return;
    setLoadingCart(true);
    try {
      const res = await getUserCart(customerId, isAdmin ? "ADMIN" : "STAFF");
      setUserCart(res.data);
    } catch (err) {
      console.error("Failed to fetch user cart", err);
      setUserCart(null);
    } finally {
      setLoadingCart(false);
    }
  };

  const handleUpdateCartQty = async (itemId, currentQty, delta) => {
    const nextQty = currentQty + delta;
    try {
      if (nextQty <= 0) {
        const res = await removeItemForUser(customerId, itemId, isAdmin ? "ADMIN" : "STAFF");
        setUserCart(res.data);
      } else {
        const res = await updateItemForUser(customerId, itemId, { quantity: nextQty }, isAdmin ? "ADMIN" : "STAFF");
        setUserCart(res.data);
      }
    } catch (err) {
      console.error("Failed to update user cart item", err);
    }
  };

  const handleRemoveCartItem = async (itemId) => {
    try {
      const res = await removeItemForUser(customerId, itemId, isAdmin ? "ADMIN" : "STAFF");
      setUserCart(res.data);
    } catch (err) {
      console.error("Failed to remove user cart item", err);
    }
  };

  const handleClearUserCart = async () => {
    try {
      const res = await clearCartForUser(customerId, isAdmin ? "ADMIN" : "STAFF");
      setUserCart(res.data);
    } catch (err) {
      console.error("Failed to clear user cart", err);
    }
  };

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [profileRes, pointsRes, historyRes, bookingsRes, catalogRes] = await Promise.all([
        getCustomerProfileApi(customerId).catch(() => ({ data: initialData })),
        getCustomerPointsApi(customerId).catch(() => ({ data: null })),
        getCustomerPointsHistoryApi(customerId, 0, 50).catch(() => ({ data: [] })),
        getCustomerBookingsApi(customerId, 0, 50).catch(() => ({ data: [] })),
        getUserGroupsCatalogApi().catch(() => ({ data: [] })),
      ]);

      const prof = profileRes?.data || initialData;
      setProfile(prof);
      setAssignedGroups(prof?.userGroups ? Array.from(prof.userGroups) : []);
      if (catalogRes?.data && Array.isArray(catalogRes.data)) {
        setUserGroupsCatalog(catalogRes.data);
      }
      setPointsData(pointsRes?.data || null);
      setPointsHistory(extractList(historyRes?.data));
      setBookings(extractList(bookingsRes?.data));
      fetchUserCart();
    } catch (err) {
      console.error("Failed to fetch customer profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customerId) {
      setActiveTab(initialTab || "ORDERS");
      fetchCustomerDetails();
    } else {
      setProfile(initialData);
      setAssignedGroups(initialData?.userGroups ? Array.from(initialData.userGroups) : []);
      setPointsData(null);
      setPointsHistory([]);
      setBookings([]);
    }
  }, [open, customerId]);

  useEffect(() => {
    setBookingPage(1);
  }, [bookingFilter]);

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

  const currentPoints = pointsData?.points ?? profile?.points ?? 0;
  const lifetimePoints = pointsData?.lifetimePoints ?? profile?.lifetimePoints ?? currentPoints;
  const calculateTierFromLifetime = (pts) => {
    if (pts >= 300) return "DIAMOND";
    if (pts >= 150) return "PLATINUM";
    if (pts >= 50) return "GOLD";
    return "SILVER";
  };
  const activeTier = pointsData?.tier || profile?.tier || calculateTierFromLifetime(lifetimePoints);
  const tierInfo = getTierDetails(activeTier);

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const totalSpend = completedBookings.reduce(
    (sum, b) => sum + (Number(b.pricePaid ?? b.totalAmount) || 0),
    0
  );

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "ALL") return true;
    return b.status === bookingFilter;
  });

  const sortBookingsByBusinessRules = (list) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const getBucket = (b) => {
      const status = (b.status || "").toUpperCase();
      const isCompletedOrCancelled =
        status === "COMPLETED" ||
        status === "CANCELLED" ||
        status === "CANCELED" ||
        status === "AUTO_CANCELLED";

      if (isCompletedOrCancelled) {
        return 3;
      }

      if (!b.scheduledAt) {
        return 3;
      }

      const bookingTime = new Date(b.scheduledAt).getTime();

      // 1. Today's confirmed/modified/pending bookings
      if (bookingTime >= todayStart && bookingTime < todayEnd) {
        return 1;
      }

      // 2. Upcoming future bookings (after today)
      if (bookingTime >= todayEnd) {
        return 2;
      }

      // Past uncompleted appointments
      return 3;
    };

    return [...list].sort((a, b) => {
      const bucketA = getBucket(a);
      const bucketB = getBucket(b);

      if (bucketA !== bucketB) {
        return bucketA - bucketB;
      }

      const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);

      // Bucket 1 (Today): earliest time today first (ASC)
      if (bucketA === 1) {
        return timeA - timeB;
      }

      // Bucket 2 (Upcoming): nearest upcoming first (ASC)
      if (bucketA === 2) {
        return timeA - timeB;
      }

      // Bucket 3 (Completed / Cancelled): latest to old (DESC)
      return timeB - timeA;
    });
  };

  const sortedBookings = sortBookingsByBusinessRules(filteredBookings);

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
                  {profile?.active !== false ? "Active" : "Deactive"}
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

              {/* Active Groups Chips */}
              {((profile?.effectiveGroups && profile.effectiveGroups.length > 0) || (assignedGroups.length > 0)) && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {(profile?.effectiveGroups || assignedGroups).map((grp) => (
                    <span
                      key={grp}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200/60 inline-flex items-center gap-1"
                    >
                      <Users className="w-2.5 h-2.5" />
                      {grp.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            {/* Toggled (Active / Deactive) Option */}
            {(isAdmin || isStaff) && (
              <div className="flex items-center gap-2 bg-groomish-cream/70 border border-groomish-slate/15 px-3 py-1.5 rounded-2xl shadow-sm">
                <span className="text-[11px] font-bold text-groomish-slate/70 select-none">
                  Status:
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile?.active !== false}
                  disabled={togglingStatus}
                  onClick={handleToggleStatus}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    profile?.active !== false ? "bg-groomish-green" : "bg-groomish-slate/30"
                  } ${togglingStatus ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={profile?.active !== false ? "Click to deactivate customer" : "Click to activate customer"}
                >
                  <span className="sr-only">Toggle customer active state</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      profile?.active !== false ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-extrabold tracking-wide select-none ${
                    profile?.active !== false ? "text-groomish-green" : "text-groomish-crimson"
                  }`}
                >
                  {togglingStatus ? "Updating..." : profile?.active !== false ? "Active" : "Deactive"}
                </span>
              </div>
            )}

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
          {/* Card 1: Groom Coins Balance */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-groomish-slate via-groomish-slate to-[#1a2233] text-white shadow-soft relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  Groom Coins
                </span>
                <GroomCoinIcon className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-heading font-black text-amber-400">
                  {currentPoints}
                </span>
                <span className="text-xs font-bold text-white/70">coins</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
              <span>Lifetime: <b className="text-white">{lifetimePoints} coins</b></span>
              <span className="text-amber-300 font-semibold">{tierInfo.multiplier}</span>
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
                ? "bg-amber-600 text-white shadow-soft"
                : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
            }`}
          >
            <GroomCoinIcon className="w-3.5 h-3.5" />
            <span>Groom Coins Ledger ({pointsHistory.length})</span>
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

          <button
            type="button"
            onClick={() => {
              setActiveTab("CART");
              fetchUserCart();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "CART"
                ? "bg-groomish-orange text-white shadow-soft"
                : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Active Cart ({userCart?.totalItemCount || 0})</span>
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
                Showing {sortedBookings.length} order{sortedBookings.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-groomish-slate/50">
                <div className="w-6 h-6 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading appointment history...
              </div>
            ) : sortedBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-groomish-slate/40 border border-dashed border-groomish-slate/20 rounded-2xl">
                No {bookingFilter !== "ALL" ? bookingFilter.toLowerCase() : ""} orders found for this customer.
              </div>
            ) : (
              <>
                <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                  {sortedBookings
                  .slice((bookingPage - 1) * BOOKINGS_PAGE_SIZE, bookingPage * BOOKINGS_PAGE_SIZE)
                  .map((b) => (
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
                          {b.status === "COMPLETED" || b.paymentStatus === "COMPLETED"
                            ? (b.paymentMethod === "CASH" ? "Paid at Salon" : `Paid Online (${b.paymentMethod || "UPI"})`)
                            : (b.paymentStatus || "PENDING")}{" "}
                          • {b.paymentMethod || "CASH"}
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

              {sortedBookings.length > BOOKINGS_PAGE_SIZE && (
                <div className="pt-2">
                  <Pagination
                    currentPage={bookingPage}
                    totalItems={sortedBookings.length}
                    pageSize={BOOKINGS_PAGE_SIZE}
                    onPageChange={setBookingPage}
                    itemName="bookings"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

        {/* TAB 2: GROOM COINS LEDGER */}
        {activeTab === "POINTS" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <GroomCoinIcon className="w-4 h-4 shrink-0" />
                <span className="font-bold text-groomish-slate">
                  Tier Multiplier: <span className="text-groomish-orange">{tierInfo.multiplier}</span>
                </span>
                <span className="text-groomish-slate/60 hidden sm:inline">
                  • {tierInfo.perk}
                </span>
              </div>
              <span className="font-black text-groomish-slate font-heading flex items-center gap-1.5">
                <GroomCoinIcon className="w-4 h-4" />
                {currentPoints} Coins Available
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-groomish-slate/50">
                <div className="w-6 h-6 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading Groom Coins activity...
              </div>
            ) : pointsHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-groomish-slate/40 border border-dashed border-groomish-slate/20 rounded-2xl">
                No Groom Coin transactions recorded yet.
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
                          {isPositive ? `+${item.changeAmount}` : item.changeAmount} Coins
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

            {/* Customer Groups & Cohorts Management */}
            <div className="mt-4 pt-4 border-t border-groomish-slate/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-heading font-extrabold text-xs text-groomish-slate flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Customer Groups & Targeted Cohorts</span>
                  </h5>
                  <p className="text-[11px] text-groomish-slate/60 mt-0.5">
                    Linked groups determine promotional coupon eligibility and targeted email broadcasts.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleSaveUserGroups}
                    disabled={savingGroups}
                    className="btn-primary text-[11px] px-3 py-1.5 flex items-center gap-1 shadow-xs"
                  >
                    {savingGroups ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Save Groups</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {groupSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{groupSuccessMsg}</span>
                </div>
              )}

              {/* Effective Groups Overview */}
              <div>
                <span className="text-[10px] uppercase font-bold text-groomish-slate/50 block mb-1">
                  Active Effective Cohorts (Dynamic + Assigned)
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(profile?.effectiveGroups && profile.effectiveGroups.length > 0) ? (
                    profile.effectiveGroups.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200/70 inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Users className="w-3 h-3 text-indigo-500" />
                        {g.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-groomish-slate/40 italic">
                      No active customer cohorts.
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned Groups Editor (for Admins) */}
              {isAdmin && (
                <div className="p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-groomish-slate/60 block">
                    Manage Assigned Groups (Click to Toggle)
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      "NEW_USER",
                      "SILVER",
                      "GOLD",
                      "PLATINUM",
                      "1_YEAR_PLUS",
                      "2_YEAR_PLUS",
                      "VIP",
                      "FREQUENT_VISITOR",
                      "STUDENT",
                      "BIRTHDAY_SPECIAL",
                      "CHURN_RISK",
                      ...assignedGroups.filter(
                        (g) =>
                          ![
                            "NEW_USER",
                            "SILVER",
                            "GOLD",
                            "PLATINUM",
                            "1_YEAR_PLUS",
                            "2_YEAR_PLUS",
                            "VIP",
                            "FREQUENT_VISITOR",
                            "STUDENT",
                            "BIRTHDAY_SPECIAL",
                            "CHURN_RISK",
                          ].includes(g)
                      ),
                    ].map((grp) => {
                      const active = assignedGroups.includes(grp);
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => handleToggleGroup(grp)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                            active
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-groomish-slate/70 border-groomish-slate/15 hover:border-indigo-400"
                          }`}
                        >
                          {active ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-groomish-slate/40" />}
                          <span>{grp.replace(/_/g, " ")}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Tag */}
                  <form onSubmit={handleAddCustomGroup} className="flex items-center gap-2 pt-1">
                    <input
                      value={customGroupInput}
                      onChange={(e) => setCustomGroupInput(e.target.value)}
                      placeholder="Add custom cohort tag (e.g. INFLUENCER, BRIDAL)..."
                      className="input-groomish text-xs py-1.5 font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-groomish-slate text-white text-xs font-bold hover:bg-groomish-slate/90 transition shrink-0"
                    >
                      + Add Cohort
                    </button>
                  </form>
                </div>
              )}
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

        {/* TAB 4: CUSTOMER CART (STAFF / ADMIN MANAGEMENT) */}
        {activeTab === "CART" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-groomish-cream/60 p-4 rounded-2xl border border-groomish-slate/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-groomish-orange text-white flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-groomish-slate">
                    Live Database Cart
                  </h4>
                  <p className="text-[11px] text-groomish-slate/60">
                    Store: {userCart?.storeName || "Unassigned"} • Total items: {userCart?.totalItemCount || 0}
                  </p>
                </div>
              </div>

              {userCart?.items && userCart.items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearUserCart}
                  className="text-xs font-bold text-groomish-crimson hover:bg-groomish-crimson/10 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cart</span>
                </button>
              )}
            </div>

            {loadingCart ? (
              <div className="py-12 text-center text-xs text-groomish-slate/50">
                Loading customer cart...
              </div>
            ) : !userCart?.items || userCart.items.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-groomish-slate/10 p-6">
                <ShoppingCart className="w-8 h-8 text-groomish-slate/20 mx-auto mb-2" />
                <p className="text-xs font-bold text-groomish-slate">Cart is currently empty</p>
                <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                  The customer has no items in their cart right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-groomish-slate/10 bg-white rounded-2xl border border-groomish-slate/10 p-4">
                  {userCart.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-groomish-cream text-groomish-slate">
                            {item.itemType}
                          </span>
                          <span className="font-heading font-bold text-xs text-groomish-slate truncate">
                            {item.serviceName || item.productName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-groomish-slate/60 mt-1">
                          <span>Unit: ₹{item.unitPrice}</span>
                          <span>•</span>
                          <span className="font-bold text-groomish-slate">Total: ₹{item.totalPrice}</span>
                          {item.customNotes && (
                            <>
                              <span>•</span>
                              <span className="text-groomish-orange italic">"{item.customNotes}"</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Staff/Admin Quantity Adjustment */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-groomish-slate/20 rounded-full bg-groomish-cream p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.id, item.quantity, -1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white text-groomish-slate text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-groomish-slate">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.id, item.quantity, 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white text-groomish-slate text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(item.id)}
                          className="p-1 rounded-full text-groomish-slate/40 hover:text-groomish-crimson hover:bg-groomish-crimson/10 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Total Summary */}
                <div className="bg-groomish-cream/40 p-4 rounded-2xl border border-groomish-slate/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-groomish-slate block">
                      Services: {userCart.servicesCount} • Products: {userCart.productsCount}
                    </span>
                    <span className="text-[11px] text-groomish-slate/60">
                      Duration: {userCart.totalDurationMinutes || 0} mins
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-groomish-slate/50 uppercase font-bold block">Cart Total</span>
                    <span className="text-lg font-black text-groomish-slate">₹{userCart.totalAmount || 0}</span>
                  </div>
                </div>
              </div>
            )}
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
