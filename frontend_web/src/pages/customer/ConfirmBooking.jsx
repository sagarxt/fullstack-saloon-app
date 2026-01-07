import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import UserNavbar from "../../components/user/UserNavbar";
import {
  createBooking,
  previewBooking,
} from "../../api/customer";

export default function ConfirmBooking() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!state) {
    navigate("/customer/home");
    return null;
  }

  const { service, date, time, note } = state;

  /* ===============================
     Apply coupon preview
     =============================== */
  const applyCoupon = async () => {
    try {
      const res = await previewBooking({
        serviceId: service.id,
        couponCode: coupon,
      });
      setPreview(res.data);
    } catch {
      alert("Invalid coupon");
      setPreview(null);
    }
  };

  /* ===============================
     Confirm booking
     =============================== */
  const confirmBooking = async () => {
    setLoading(true);
    try {
      await createBooking({
        serviceId: service.id,
        scheduledAt: `${date}T${time}`,
        couponCode: coupon || null,
        note,
      });

      navigate("/customer/bookings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">

          <h1 className="text-xl font-semibold">
            Confirm Booking
          </h1>

          {/* Summary */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Service</span>
              <span>{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{date}</span>
            </div>
            <div className="flex justify-between">
              <span>Time</span>
              <span>{time}</span>
            </div>
          </div>

          {/* Coupon */}
          <div className="border rounded-md p-4 space-y-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="border px-3 py-2 rounded-md w-full"
            />
            <button
              onClick={applyCoupon}
              className="w-full bg-gray-100 py-2 rounded-md hover:bg-gray-200"
            >
              Apply Coupon
            </button>
          </div>

          {/* Price Preview */}
          <div className="border rounded-md p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Original Price</span>
              <span>₹{service.price}</span>
            </div>

            {preview && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{preview.discount}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Final Price</span>
                  <span>₹{preview.finalPrice}</span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>Rewards Earned</span>
                  <span>{preview.rewardsEarned} pts</span>
                </div>
              </>
            )}
          </div>

          {/* Note */}
          {note && (
            <div className="text-sm bg-gray-50 border rounded-md p-3">
              <strong>Note:</strong> {note}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 border rounded-md py-2"
            >
              Back
            </button>

            <button
              onClick={confirmBooking}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
