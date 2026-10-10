import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { getBookingDetails } from "../../api/admin";

export default function BookingDetailsModal({
  open,
  onClose,
  bookingId,
}) {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!open) return;

    const loadDetails = async () => {
      const res = await getBookingDetails(bookingId);
      setBooking(res.data);
    };

    loadDetails();
  }, [open, bookingId]);

  if (!booking) return null;

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <h2 className="text-xl font-serif text-luxe-gold mb-4">
        Booking Details
      </h2>

      <div className="space-y-2 text-sm">
        <p><b>Booking ID:</b> <span className="font-mono font-bold text-groomish-orange">{booking.bookingCode || booking.id}</span></p>
        <p><b>Status:</b> {booking.status}</p>
        <p><b>Booked By:</b> {booking.bookedBy}</p>
        <p><b>Appointment:</b> {booking.scheduledAt}</p>
      </div>

      <hr className="my-4" />

      {/* Services */}
      <div className="space-y-2">
        {booking.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.serviceNameSnapshot} ({item.serviceDurationSnapshot} mins)
            </span>
            <span>₹{item.servicePriceSnapshot}</span>
          </div>
        ))}
      </div>

      <hr className="my-4" />

      {/* Price Summary */}
      <div className="text-sm space-y-1">
        <p>Total MRP : ₹{booking.totalAmount}</p>
        {booking.coupon && (
          <p>
            Coupon Discount ({booking.coupon.code}) :
            -₹{booking.coupon.discount}
          </p>
        )}
        <p className="font-semibold">
          Paid : ₹{booking.pricePaid}
        </p>
      </div>
    </ModalWrapper>
  );
}
