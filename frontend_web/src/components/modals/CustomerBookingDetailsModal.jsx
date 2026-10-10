import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import {
  getMyBookingDetails,
  cancelBooking,
} from "../../api/customer";
import RescheduleBookingModal from "./RescheduleBookingModal";
import { Calendar, Clock, CreditCard, Tag, AlertCircle, Scissors, UserCheck } from "lucide-react";

export default function CustomerBookingDetailsModal({
  open,
  onClose,
  bookingId,
  refresh,
}) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  /* ---------------- LOAD BOOKING DETAILS ---------------- */
  useEffect(() => {
    if (!open || !bookingId) return;

    const loadDetails = async () => {
      try {
        const res = await getMyBookingDetails(bookingId);
        setBooking(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    loadDetails();
  }, [open, bookingId]);

  /* ---------------- CANCEL BOOKING ---------------- */
  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setLoading(true);
    setError("");
    try {
      await cancelBooking(bookingId);
      refresh();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to cancel booking";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const formattedDate = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "Date pending";

  return (
    <>
      <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              Booking Overview
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate font-mono">
              {booking.bookingCode || (booking.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "GN-NEW")}
            </h2>
          </div>

          {error && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* BASIC INFO */}
          <div className="bg-groomish-cream/70 rounded-2xl p-4 border border-groomish-slate/10 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-groomish-slate/60">Status:</span>
              <span className="font-bold px-2.5 py-0.5 rounded-full bg-white border border-groomish-slate/15 text-groomish-slate uppercase text-[10px]">
                {booking.status}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-groomish-slate/60">Appointment:</span>
              <span className="font-medium text-groomish-slate text-right">{formattedDate}</span>
            </div>

            {booking.staffAssigned && (
              <div className="flex justify-between items-center">
                <span className="text-groomish-slate/60">Stylist Assigned:</span>
                <span className="font-medium text-groomish-slate flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-groomish-orange" />
                  {booking.staffAssigned}
                </span>
              </div>
            )}
          </div>

          {/* SERVICES LIST */}
          <div>
            <h4 className="text-xs font-bold text-groomish-slate/80 mb-2">
              Reserved Services
            </h4>
            <div className="space-y-2">
              {booking.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 rounded-xl bg-white border border-groomish-slate/10 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-groomish-orange shrink-0" />
                    <div>
                      <p className="font-bold text-groomish-slate">
                        {item.serviceNameSnapshot}
                      </p>
                      <p className="text-[11px] text-groomish-slate/50">
                        Duration: {item.serviceDurationSnapshot} mins
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-groomish-slate">
                    ₹{item.servicePriceSnapshot}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PRICE BREAKDOWN */}
          <div className="border-t border-groomish-slate/10 pt-3 space-y-1.5 text-xs">
            {booking.coupon && (
              <div className="flex justify-between text-groomish-green font-semibold">
                <span>Coupon Applied ({booking.coupon.code})</span>
                <span>-₹{booking.coupon.discount || 0}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-bold text-groomish-slate pt-1">
              <span>Total Paid</span>
              <span className="text-lg font-extrabold text-groomish-orange">
                ₹{booking.pricePaid}
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setRescheduleOpen(true)}
                className="btn-secondary w-full text-xs py-2.5"
              >
                Reschedule Appointment
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="btn-danger w-full text-xs py-2.5"
              >
                {loading ? "Cancelling..." : "Cancel Booking"}
              </button>
            </div>
          )}
        </div>
      </ModalWrapper>

      {/* RESCHEDULE MODAL */}
      <RescheduleBookingModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        booking={booking}
        refresh={refresh}
      />
    </>
  );
}
