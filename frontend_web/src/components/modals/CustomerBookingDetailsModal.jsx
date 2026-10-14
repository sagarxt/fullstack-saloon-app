import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalWrapper from "./ModalWrapper";
import {
  getMyBookingDetails,
  cancelBooking,
} from "../../api/customer";
import RescheduleBookingModal from "./RescheduleBookingModal";
import { showConfirm } from "../../context/ConfirmContext";
import { getBranchNavigationUrl } from "../../utils/mapHelper";
import { Calendar, Clock, CreditCard, Tag, AlertCircle, Scissors, UserCheck, ChevronRight, Navigation, MapPin } from "lucide-react";

export default function CustomerBookingDetailsModal({
  open,
  onClose,
  bookingId,
  refresh,
}) {
  const navigate = useNavigate();
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
    const ok = await showConfirm({
      title: "Cancel Booking",
      message: "Are you sure you want to cancel this salon booking? This cannot be undone.",
      confirmText: "Yes, Cancel Booking",
      variant: "danger",
    });
    if (!ok) return;

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

            {booking.storeName && (
              <div className="flex justify-between items-center pt-1 border-t border-groomish-slate/10">
                <span className="text-groomish-slate/60">Salon Branch:</span>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-medium text-groomish-slate">{booking.storeName}</span>
                  <a
                    href={getBranchNavigationUrl(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-groomish-orange bg-white border border-groomish-orange/30 px-2 py-0.5 rounded-lg hover:bg-groomish-orange hover:text-white transition shadow-2xs"
                    title="Open Google Maps with turn-by-turn navigation from your current location"
                  >
                    <Navigation className="w-2.5 h-2.5" />
                    <span>Navigate</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Customer Special Notes */}
          {booking.note && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-xs shadow-xs">
              <Tag className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-900 tracking-wider">
                  Customer Special Notes:
                </span>
                <p className="text-xs text-amber-800 italic mt-0.5 leading-relaxed">
                  "{booking.note}"
                </p>
              </div>
            </div>
          )}

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

            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                navigate(`/customer/bookings/${booking.id}`);
              }}
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 mt-2"
            >
              <span>View Booking Details & Invoice</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
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
