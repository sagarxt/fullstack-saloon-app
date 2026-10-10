import { useState } from "react";
import CustomerBookingDetailsModal from "../modals/CustomerBookingDetailsModal";
import LeaveReviewModal from "../modals/LeaveReviewModal";
import { Calendar, Clock, CreditCard, ChevronRight, Star, Scissors } from "lucide-react";

export default function BookingCard({ booking, refresh }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

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

  const firstItem = booking.items?.[0];
  const serviceName = firstItem?.serviceNameSnapshot || "Salon Care";
  const serviceId = firstItem?.serviceId || booking.serviceId;

  // Format date
  const formattedDate = booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }) : "Date pending";

  return (
    <>
      <div className="card-groomish p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-groomish-orange/30">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(
                booking.status
              )}`}
            >
              {booking.status}
            </span>
            <span className="text-xs font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/20 tracking-wider">
              {booking.bookingCode || (booking.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "GN-NEW")}
            </span>
          </div>

          <h3 className="font-heading font-bold text-base text-groomish-slate flex items-center gap-2">
            <Scissors className="w-4 h-4 text-groomish-orange shrink-0" />
            {serviceName}
            {booking.items?.length > 1 && (
              <span className="text-xs font-normal text-groomish-slate/60">
                +{booking.items.length - 1} more
              </span>
            )}
          </h3>

          <div className="flex items-center gap-4 text-xs text-groomish-slate/60 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-groomish-slate/40" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-groomish-slate">
              <CreditCard className="w-3.5 h-3.5 text-groomish-slate/40" />
              ₹{booking.pricePaid}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {booking.status === "COMPLETED" && (
            <button
              onClick={() => setReviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-groomish-orange bg-groomish-orangeLight hover:bg-groomish-orange hover:text-white rounded-xl transition"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Review</span>
            </button>
          )}

          <button
            onClick={() => setDetailsOpen(true)}
            className="btn-secondary text-xs px-4 py-2"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CustomerBookingDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        bookingId={booking.id}
        refresh={refresh}
      />

      {serviceId && (
        <LeaveReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          serviceId={serviceId}
          serviceName={serviceName}
          onReviewSubmitted={refresh}
        />
      )}
    </>
  );
}
