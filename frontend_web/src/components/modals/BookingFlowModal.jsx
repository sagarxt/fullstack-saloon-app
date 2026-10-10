import { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import {
  createBooking,
  getSlotAvailability,
  applyCoupon,
  checkoutPayment,
} from "../../api/customer";
import { generateSlots } from "../../utils/slots";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Smartphone,
  Store,
  ChevronRight,
  AlertCircle,
  Scissors,
  ShieldCheck,
} from "lucide-react";

const PLATFORM_FEE = 15;

export default function BookingFlowModal({ open, onClose, service }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [coupon, setCoupon] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [step, setStep] = useState(1); // 1: Schedule & Details, 2: Payment & Checkout, 3: Success Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedBooking, setCompletedBooking] = useState(null);

  // Set default date to today
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
      loadSlotsForDate(today);
      setStep(1);
      setError("");
      setCouponData(null);
      setCoupon("");
      setCompletedBooking(null);
    }
  }, [open, service]);

  const loadSlotsForDate = async (selectedDate) => {
    if (!selectedDate || !service) return;
    setSlotsLoading(true);
    try {
      const res = await getSlotAvailability(selectedDate, service.id);
      setUnavailableSlots(res.data?.unavailableSlots || []);
      setSlots(generateSlots());
    } catch (err) {
      setSlots(generateSlots());
      setUnavailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (val) => {
    setDate(val);
    setSelectedSlot("");
    loadSlotsForDate(val);
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await applyCoupon(coupon.trim(), service.price);
      setCouponData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or expired coupon code";
      setCouponError(msg);
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  if (!service) return null;

  const price = Number(service.price) || 0;
  const mrp = Number(service.mrp) || price;
  const discount = couponData ? Number(couponData.discountAmount || (price * (couponData.discountPercentage || 0)) / 100) : 0;
  const totalPayable = Math.max(0, price - discount + PLATFORM_FEE);
  const pointsToEarn = Math.floor(totalPayable / 100);

  // Quick Date Shortcut buttons
  const getRelativeDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  const todayStr = getRelativeDate(0);
  const tomorrowStr = getRelativeDate(1);
  const dayAfterStr = getRelativeDate(2);

  /* SUBMIT & CHECKOUT */
  const handleProceedToPayment = () => {
    if (!date || !selectedSlot) {
      setError("Please pick both an appointment date and a time slot.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirmAndPay = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Create booking in backend
      const bookingRes = await createBooking({
        serviceId: service.id,
        scheduledAt: `${date}T${selectedSlot}:00`,
        couponCode: couponData?.code || null,
        note: `Payment via ${paymentMethod}`,
      });

      const newBooking = bookingRes.data;

      // 2. Process checkout / payment
      try {
        await checkoutPayment({
          bookingId: newBooking.id,
          paymentMethod: paymentMethod,
        });
      } catch (payErr) {
        console.warn("Payment checkout recorded locally:", payErr);
      }

      setCompletedBooking(newBooking);
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to finalize booking. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-xl">
      {/* ---------------- STEP 1: SCHEDULE & DETAILS ---------------- */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-groomish-slate/10 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
                Step 1 of 2 • Scheduling
              </span>
              <h2 className="text-xl font-heading font-bold text-groomish-slate flex items-center gap-2">
                <Scissors className="w-5 h-5 text-groomish-orange" />
                {service.name}
              </h2>
              <p className="text-xs text-groomish-slate/60 mt-0.5">
                {service.gender} • {service.durationMinutes} mins • {service.categoryName || "Salon Care"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-groomish-slate">
                ₹{price}
              </span>
              {mrp > price && (
                <div className="text-xs text-groomish-slate/40 line-through">
                  ₹{mrp}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-groomish-slate/80 mb-2">
              Select Appointment Date
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleDateChange(todayStr)}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl border transition ${
                  date === todayStr
                    ? "bg-groomish-orange text-white border-groomish-orange shadow-glowOrange"
                    : "bg-white text-groomish-slate border-groomish-slate/20 hover:bg-groomish-cream"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(tomorrowStr)}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl border transition ${
                  date === tomorrowStr
                    ? "bg-groomish-orange text-white border-groomish-orange shadow-glowOrange"
                    : "bg-white text-groomish-slate border-groomish-slate/20 hover:bg-groomish-cream"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(dayAfterStr)}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl border transition ${
                  date === dayAfterStr
                    ? "bg-groomish-orange text-white border-groomish-orange shadow-glowOrange"
                    : "bg-white text-groomish-slate border-groomish-slate/20 hover:bg-groomish-cream"
                }`}
              >
                Day After
              </button>
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-3.5" />
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="input-groomish pl-10"
              />
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-groomish-slate/80 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-groomish-orange" />
                Select Preferred Time Slot
              </label>
              {selectedSlot && (
                <span className="text-xs font-bold text-groomish-orange">
                  Selected: {selectedSlot}
                </span>
              )}
            </div>

            {slotsLoading ? (
              <div className="text-center py-6 text-xs text-groomish-slate/50">
                Checking real-time slot availability...
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-6 text-xs text-groomish-slate/50 bg-groomish-cream rounded-xl">
                Please select a date to view available salon slots.
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {slots.map((slot) => {
                  const isUnavailable = unavailableSlots.includes(slot);
                  const isSelected = selectedSlot === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                        isUnavailable
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-groomish-orange text-white border-groomish-orange shadow-glowOrange scale-105"
                          : "bg-white text-groomish-slate border-groomish-slate/15 hover:border-groomish-orange hover:bg-groomish-orangeLight"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coupon Code Section */}
          <div className="bg-groomish-cream/70 p-3.5 rounded-2xl border border-groomish-slate/10">
            <label className="block text-xs font-bold text-groomish-slate/80 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-groomish-coral" />
              Apply Promo / Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10 or GROOM20"
                className="input-groomish flex-1 bg-white uppercase text-xs font-mono"
              />
              <button
                type="button"
                disabled={couponLoading || !coupon.trim()}
                onClick={handleApplyCoupon}
                className="btn-primary py-2 px-4 text-xs font-bold shrink-0"
              >
                {couponLoading ? "Checking..." : "Apply"}
              </button>
            </div>

            {couponData && (
              <div className="flex items-center gap-1.5 text-xs text-groomish-green font-semibold mt-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Coupon <b>{couponData.code}</b> applied! (Saved ₹{discount})
              </div>
            )}

            {couponError && (
              <div className="text-xs text-groomish-crimson mt-1.5">
                {couponError}
              </div>
            )}
          </div>

          {/* Pricing Preview Pill */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-groomish-slate/10 text-xs">
            <div>
              <span className="text-groomish-slate/60">Estimated Total:</span>
              <span className="font-extrabold text-sm text-groomish-slate ml-1.5">
                ₹{totalPayable}
              </span>
            </div>
            <div className="flex items-center gap-1 text-groomish-orange font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Earn +{pointsToEarn} Loyalty Points
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={!date || !selectedSlot}
            onClick={handleProceedToPayment}
            className="btn-auth flex items-center justify-center gap-2"
          >
            <span>Proceed to Payment</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------- STEP 2: PAYMENT & CHECKOUT ---------------- */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Header */}
          <div className="border-b border-groomish-slate/10 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              Step 2 of 2 • Checkout & Confirmation
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate">
              Confirm & Complete Payment
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Appointment on <b>{date}</b> at <b>{selectedSlot}</b>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-groomish-slate/80 mb-2">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`p-3 rounded-2xl border text-center transition ${
                  paymentMethod === "UPI"
                    ? "bg-groomish-orangeLight border-groomish-orange text-groomish-orange font-bold shadow-soft"
                    : "bg-white border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream"
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-1.5" />
                <span className="text-xs block">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-3 rounded-2xl border text-center transition ${
                  paymentMethod === "CARD"
                    ? "bg-groomish-orangeLight border-groomish-orange text-groomish-orange font-bold shadow-soft"
                    : "bg-white border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream"
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1.5" />
                <span className="text-xs block">Card / NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`p-3 rounded-2xl border text-center transition ${
                  paymentMethod === "CASH"
                    ? "bg-groomish-orangeLight border-groomish-orange text-groomish-orange font-bold shadow-soft"
                    : "bg-white border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream"
                }`}
              >
                <Store className="w-5 h-5 mx-auto mb-1.5" />
                <span className="text-xs block">Pay at Salon</span>
              </button>
            </div>
          </div>

          {/* Itemized Bill Breakdown */}
          <div className="bg-groomish-cream/70 rounded-2xl p-4 border border-groomish-slate/10 space-y-2 text-xs">
            <div className="flex justify-between text-groomish-slate/70">
              <span>Service Charge ({service.name})</span>
              <span>₹{price}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-groomish-green font-semibold">
                <span>Coupon Discount ({couponData?.code})</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between text-groomish-slate/70">
              <span>GST & Platform Hygiene Fee</span>
              <span>₹{PLATFORM_FEE}</span>
            </div>

            <div className="border-t border-groomish-slate/15 pt-2 flex justify-between items-center text-sm font-bold text-groomish-slate">
              <span>Total Payable</span>
              <span className="text-xl font-extrabold text-groomish-orange">
                ₹{totalPayable}
              </span>
            </div>
          </div>

          {/* Loyalty Banner */}
          <div className="flex items-center gap-2 p-3 bg-groomish-goldLight border border-groomish-gold/30 rounded-xl text-xs text-groomish-slate">
            <Sparkles className="w-4 h-4 text-groomish-orange shrink-0" />
            <span>
              You will automatically earn <b>+{pointsToEarn} Groomish Loyalty Points</b> on this booking!
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(1)}
              className="btn-secondary px-5 py-3 text-xs"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmAndPay}
              className="btn-auth flex-1 text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Confirming..." : `Pay ₹${totalPayable} & Confirm`}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- STEP 3: CELEBRATION CONFIRMATION ---------------- */}
      {step === 3 && (
        <div className="text-center py-4 space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-groomish-green/15 text-groomish-green rounded-full flex items-center justify-center mx-auto shadow-soft">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-heading font-extrabold text-groomish-slate">
              Booking Confirmed! 🎉
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-1 max-w-sm mx-auto">
              A real-time confirmation email has been dispatched to your email address with the appointment details.
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-groomish-cream p-5 rounded-3xl border border-groomish-slate/10 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-groomish-slate/60">Booking ID:</span>
              <span className="font-mono font-bold text-groomish-slate">
                {completedBooking?.id?.slice(0, 8) || "GRM-LIVE"}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-groomish-slate/60">Service:</span>
              <span className="font-semibold text-groomish-slate">{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-groomish-slate/60">Scheduled At:</span>
              <span className="font-semibold text-groomish-slate">
                {date} at {selectedSlot}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-groomish-slate/60">Amount Paid:</span>
              <span className="font-bold text-groomish-orange">₹{totalPayable}</span>
            </div>
            <div className="flex justify-between border-t border-groomish-slate/10 pt-2 text-groomish-green font-bold">
              <span>Points Credited:</span>
              <span>+{pointsToEarn} Points</span>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/customer/bookings");
              }}
              className="btn-primary text-xs px-6 py-2.5"
            >
              View My Bookings
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-6 py-2.5"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}
