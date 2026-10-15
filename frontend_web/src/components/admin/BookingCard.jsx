import { useState } from "react";
import { Link } from "react-router-dom";
import { updateBookingStatus } from "../../api/admin";
import CustomerProfileModal from "../modals/CustomerProfileModal";
import { Calendar, Clock, CreditCard, ChevronRight, Check, X, CheckCircle2, MapPin, User, Trash2 } from "lucide-react";
import { forceDeleteBookingApi } from "../../api/maintenance";

export default function BookingCard({ booking, refresh }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      await updateBookingStatus(booking.id, status);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const formattedDate = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date pending";

  return (
    <>
      <div className="bg-white rounded-2xl border border-groomish-slate/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft hover:shadow-card transition">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                booking.status
              )}`}
            >
              {booking.status}
            </span>
            <Link
              to={`/admin/bookings/${booking.id}`}
              className="text-xs font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/20 tracking-wider hover:bg-groomish-orange/20 transition"
              title="Click to view full booking details"
            >
              {booking.bookingCode || (booking.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "GN-NEW")}
            </Link>
            {(booking.bookedBy || booking.userName) && (
              <span className="text-xs text-groomish-slate/70 font-semibold flex items-center gap-1">
                <span>•</span>
                {booking.userId ? (
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(true)}
                    className="hover:text-groomish-orange hover:underline underline-offset-2 transition text-groomish-slate font-bold inline-flex items-center gap-1"
                    title="Click to view customer profile, orders and Groom Coins"
                  >
                    <User className="w-3 h-3 text-groomish-slate/40" />
                    <span>{booking.userName || booking.bookedBy}</span>
                  </button>
                ) : (
                  <span>{booking.userName || booking.bookedBy}</span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-groomish-slate/60 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-groomish-slate/40" />
              {formattedDate}
            </span>
            {booking.storeName && (
              <span className="flex items-center gap-1.5 text-groomish-orange font-bold">
                <MapPin className="w-3.5 h-3.5" />
                {booking.storeName}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-bold text-groomish-slate">
              <CreditCard className="w-3.5 h-3.5 text-groomish-slate/40" />
              ₹{booking.pricePaid ?? booking.totalAmount}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {booking.status === "PENDING" && (
            <>
              <button
                disabled={loading}
                onClick={() => updateStatus("CONFIRMED")}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 transition shadow-soft"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                disabled={loading}
                onClick={() => updateStatus("CANCELLED")}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-crimson text-white font-bold text-xs hover:bg-rose-600 transition shadow-soft"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}

          {booking.status === "CONFIRMED" && (
            <button
              disabled={loading}
              onClick={() => updateStatus("COMPLETED")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-blue text-white font-bold text-xs hover:bg-sky-600 transition shadow-soft"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Completed</span>
            </button>
          )}

          <Link
            to={`/admin/bookings/${booking.id}`}
            className="btn-secondary text-xs px-3.5 py-1.5 inline-flex items-center gap-1"
            title="View full booking details"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <button
            disabled={loading}
            onClick={async () => {
              if (window.confirm(`FORCE DELETE booking ${booking.bookingCode || ""}? This permanently deletes the appointment from the database.`)) {
                try {
                  setLoading(true);
                  await forceDeleteBookingApi(booking.id);
                  if (refresh) refresh();
                } catch (err) {
                  alert(err.response?.data?.message || "Failed to force delete booking.");
                } finally {
                  setLoading(false);
                }
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition shadow-2xs"
            title="Permanently remove booking from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Force Delete</span>
          </button>
        </div>
      </div>

      {booking.userId && (
        <CustomerProfileModal
          customerId={booking.userId}
          initialData={{
            id: booking.userId,
            name: booking.userName || booking.bookedBy,
            email: booking.userEmail,
            phone: booking.userPhone,
          }}
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </>
  );
}
