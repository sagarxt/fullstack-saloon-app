import { useState } from "react";
import { updateBookingStatus } from "../../api/admin";
import BookingDetailsModal from "../modals/BookingDetailsModal";
import { Calendar, Clock, CreditCard, ChevronRight, Check, X, CheckCircle2 } from "lucide-react";

export default function BookingCard({ booking, refresh }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
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
            <span className="text-xs font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/20 tracking-wider">
              {booking.bookingCode || (booking.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "GN-NEW")}
            </span>
            {booking.bookedBy && (
              <span className="text-xs text-groomish-slate/70 font-semibold">
                • {booking.bookedBy}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-groomish-slate/60 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-groomish-slate/40" />
              {formattedDate}
            </span>
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

          <button
            onClick={() => setDetailsOpen(true)}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <BookingDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        bookingId={booking.id}
      />
    </>
  );
}
