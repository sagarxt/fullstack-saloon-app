import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationSeen,
  markAllNotificationsSeen,
  clearAllNotifications,
} from "../../api/customer";
import { extractList } from "../../utils/dataHelper";
import { showConfirm } from "../../context/ConfirmContext";
import {
  Bell,
  CheckCheck,
  Clock,
  X,
  Calendar,
  CreditCard,
  Gift,
  Crown,
  Sparkles,
  ArrowRight,
  Trash2,
  Check,
} from "lucide-react";

export default function NotificationDrawer({ open, onClose, onCountChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | BOOKING | PAYMENT | OFFER
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications(0, 50);
      const list = extractList(res.data);
      setNotifications(list);
      const unread = list.filter((n) => !n.seen).length;
      onCountChange?.(unread);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSeen = async (id) => {
    try {
      await markNotificationSeen(id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, seen: true } : n));
        const unread = next.filter((n) => !n.seen).length;
        onCountChange?.(unread);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllSeen = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsSeen();
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      onCountChange?.(0);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    const ok = await showConfirm({
      title: "Clear Notifications",
      message: "Are you sure you want to clear all notifications from your inbox?",
      confirmText: "Clear All",
      variant: "danger",
    });
    if (!ok) return;
    try {
      setActionLoading(true);
      await clearAllNotifications();
      setNotifications([]);
      onCountChange?.(0);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleItemClick = (n) => {
    if (!n.seen) {
      handleMarkSeen(n.id);
    }
    onClose();

    if (n.type === "BOOKING") {
      navigate("/customer/bookings");
    } else if (n.type === "OFFER" || n.type === "REWARD") {
      navigate("/customer/rewards");
    } else if (n.type === "PAYMENT") {
      navigate("/customer/bookings");
    }
  };

  const unreadCount = notifications.filter((n) => !n.seen).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "BOOKING") return n.type === "BOOKING";
    if (activeTab === "PAYMENT") return n.type === "PAYMENT";
    if (activeTab === "OFFER") return n.type === "OFFER" || n.type === "SYSTEM";
    return true;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case "BOOKING":
        return <Calendar className="w-3.5 h-3.5 text-groomish-blue" />;
      case "PAYMENT":
        return <CreditCard className="w-3.5 h-3.5 text-groomish-green" />;
      case "OFFER":
        return <Crown className="w-3.5 h-3.5 text-groomish-gold fill-groomish-gold" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-groomish-orange" />;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "BOOKING":
        return "bg-groomish-blueLight text-groomish-blue";
      case "PAYMENT":
        return "bg-groomish-greenLight text-groomish-green";
      case "OFFER":
        return "bg-groomish-goldLight text-groomish-slate";
      default:
        return "bg-groomish-orangeLight text-groomish-orange";
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-up border-l border-groomish-slate/10">
        {/* Header */}
        <div className="p-5 border-b border-groomish-slate/10 bg-groomish-cream/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-groomish-orange/10 rounded-xl text-groomish-orange">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-base text-groomish-slate">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orange text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-groomish-slate/50">
                  Appointments, rewards & VIP updates
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-groomish-slate/40 hover:text-groomish-slate hover:bg-black/5 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Row */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between pt-1 text-xs">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleMarkAllSeen}
                  className="inline-flex items-center gap-1 font-bold text-groomish-orange hover:text-groomish-orangeDark transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all as read</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-groomish-green">
                  <Check className="w-3 h-3" />
                  <span>All caught up</span>
                </span>
              )}

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-groomish-slate/50 hover:text-groomish-crimson transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            </div>
          )}

          {/* Tabs Filter */}
          <div className="flex gap-1.5 pt-1 overflow-x-auto pb-0.5">
            {[
              { id: "ALL", label: "All" },
              { id: "BOOKING", label: "Bookings" },
              { id: "PAYMENT", label: "Payments" },
              { id: "OFFER", label: "Rewards & VIP" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-groomish-slate text-white shadow-sm"
                    : "bg-white text-groomish-slate/60 hover:text-groomish-slate border border-groomish-slate/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-groomish-slate/40 gap-2">
              <div className="w-6 h-6 border-2 border-groomish-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Checking for updates...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-12 h-12 rounded-full bg-groomish-cream mx-auto flex items-center justify-center text-groomish-slate/40 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-groomish-slate">No notifications here</p>
              <p className="text-xs text-groomish-slate/50 mt-1 max-w-xs mx-auto">
                {activeTab === "ALL"
                  ? "You will receive real-time updates when you book appointments, earn VIP points, or unlock salon vouchers."
                  : `No ${activeTab.toLowerCase()} updates at the moment.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group relative ${
                  n.seen
                    ? "bg-white border-groomish-slate/10 hover:border-groomish-slate/25"
                    : "bg-gradient-to-r from-groomish-cream/90 to-white border-groomish-orange/30 shadow-soft hover:border-groomish-orange/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${getTypeBadgeClass(
                        n.type
                      )}`}
                    >
                      {getTypeIcon(n.type)}
                      <span>{n.type || "INFO"}</span>
                    </span>

                    {n.createdAt && (
                      <span className="text-[10px] text-groomish-slate/40 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatRelativeTime(n.createdAt)}</span>
                      </span>
                    )}
                  </div>

                  {!n.seen && (
                    <span
                      className="w-2 h-2 rounded-full bg-groomish-orange ring-4 ring-groomish-orange/15 shrink-0"
                      title="Unread notification"
                    />
                  )}
                </div>

                <h4 className="font-bold text-xs text-groomish-slate mt-2 group-hover:text-groomish-orange transition-colors">
                  {n.title}
                </h4>

                <p className="text-xs text-groomish-slate/70 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {/* Deep-link Action Hint */}
                <div className="mt-2.5 pt-2 border-t border-groomish-slate/5 flex items-center justify-between text-[11px] text-groomish-slate/40 group-hover:text-groomish-orange font-bold transition-colors">
                  <span>
                    {n.type === "BOOKING"
                      ? "View in My Bookings"
                      : n.type === "OFFER"
                      ? "Explore Loyalty Rewards"
                      : "View Details"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
