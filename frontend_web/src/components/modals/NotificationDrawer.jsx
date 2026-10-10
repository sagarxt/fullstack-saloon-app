import { useEffect, useState } from "react";
import { getNotifications, markNotificationSeen } from "../../api/customer";
import { extractList } from "../../utils/dataHelper";
import { Bell, CheckCheck, Clock, X } from "lucide-react";

export default function NotificationDrawer({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(extractList(res.data));
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, seen: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-up border-l border-groomish-slate/10">
        {/* Header */}
        <div className="p-5 border-b border-groomish-slate/10 flex items-center justify-between bg-groomish-cream">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-groomish-orange/10 rounded-xl text-groomish-orange">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-groomish-slate">Notifications</h3>
              <p className="text-xs text-groomish-slateLight">Stay updated on bookings & rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-groomish-slateLight hover:text-groomish-slate hover:bg-black/5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-sm text-groomish-slateLight">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-groomish-cream mx-auto flex items-center justify-center text-groomish-slateLight mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-semibold text-groomish-slate">No notifications yet</p>
              <p className="text-xs text-groomish-slateLight mt-1">
                You'll receive updates here when you book appointments or earn rewards!
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.seen && handleMarkSeen(n.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  n.seen
                    ? "bg-white border-groomish-slate/10 text-groomish-slate"
                    : "bg-groomish-orangeLight/60 border-groomish-orange/30 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      n.type === "BOOKING"
                        ? "bg-groomish-blueLight text-groomish-blue"
                        : n.type === "PAYMENT"
                        ? "bg-groomish-greenLight text-groomish-green"
                        : "bg-groomish-goldLight text-groomish-goldDark"
                    }`}
                  >
                    {n.type || "INFO"}
                  </span>
                  {!n.seen && (
                    <span className="w-2 h-2 rounded-full bg-groomish-orange shrink-0"></span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-groomish-slate mt-2">{n.title}</h4>
                <p className="text-xs text-groomish-slateLight mt-1 leading-relaxed">{n.message}</p>
                {n.createdAt && (
                  <div className="flex items-center gap-1 text-[11px] text-groomish-slateLight/70 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
