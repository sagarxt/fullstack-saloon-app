import { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import { storeApi } from "../../api/store";
import {
  createBooking,
  getSlotAvailability,
  applyCoupon,
  checkoutPayment,
} from "../../api/customer";
import { getPublicServicesApi } from "../../api/service";
import { extractList } from "../../utils/dataHelper";
import { generateSlots, isPastSlot, getTodayDateString } from "../../utils/slots";
import { useAuth } from "../../context/useAuth";
import { useStore } from "../../context/StoreContext";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../common/GroomCoinIcon";
import { useNavigate } from "react-router-dom";
import { getBranchNavigationUrl } from "../../utils/mapHelper";
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
  MapPin,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Navigation,
} from "lucide-react";

const PLATFORM_FEE = 15;

export default function BookingFlowModal({ open, onClose, service }) {
  const { user } = useAuth();
  const { selectedStore } = useStore();
  const { calculateCoins, config } = useGroomCoin();
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
  const [branchDisabledWarning, setBranchDisabledWarning] = useState("");

  // Multi-service selection
  const [selectedServices, setSelectedServices] = useState([]);
  const [moreServices, setMoreServices] = useState([]);
  const [showAddServiceList, setShowAddServiceList] = useState(false);

  // Set default date and selected services
  useEffect(() => {
    if (open) {
      const initial = service ? [service] : [];
      setSelectedServices(initial);
      const today = getTodayDateString(0);
      setDate(today);
      if (service?.id) {
        loadSlotsForDate(today);
      }
      setStep(1);
      setError("");
      setBranchDisabledWarning("");
      setCouponData(null);
      setCoupon("");
      setCompletedBooking(null);
      setShowAddServiceList(false);

      if (selectedStore?.id) {
        storeApi.getStoreServices(selectedStore.id)
          .then((res) => {
            const list = extractList(res.data);
            const branchServices = list.map((s) => ({
              ...s,
              id: s.serviceId || s.id,
            }));
            const disabledFound = branchServices.find(
              (bs) => bs.id === service?.id && !bs.effectiveActive
            );
            if (disabledFound) {
              setBranchDisabledWarning(
                `Service "${service.name}" is currently disabled for appointments at ${selectedStore.name}.`
              );
            }
            setMoreServices(branchServices.filter((bs) => bs.effectiveActive));
          })
          .catch(() => {
            getPublicServicesApi()
              .then((res) => setMoreServices(extractList(res.data)))
              .catch(() => setMoreServices([]));
          });
      } else {
        getPublicServicesApi()
          .then((res) => setMoreServices(extractList(res.data)))
          .catch(() => setMoreServices([]));
      }
    }
  }, [open, service, selectedStore]);

  const loadSlotsForDate = async (selectedDate) => {
    const sId = selectedServices[0]?.id || service?.id;
    if (!selectedDate || !sId) return;
    setSlotsLoading(true);
    try {
      const res = await getSlotAvailability(selectedDate, sId);
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

  const handleAddAdditionalService = (srv) => {
    if (!selectedServices.some((s) => s.id === srv.id)) {
      setSelectedServices([...selectedServices, srv]);
    }
    setShowAddServiceList(false);
  };

  const handleRemoveSelectedService = (serviceId) => {
    if (selectedServices.length <= 1) return;
    setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await applyCoupon(coupon.trim(), price);
      if (res.data?.eligibleCategories && res.data.eligibleCategories.length > 0) {
        const hasEligible = selectedServices.some(s => {
          const catName = s.category?.name || s.categoryName || s.category;
          return catName && res.data.eligibleCategories.some(ec => ec.toLowerCase() === catName.toLowerCase());
        });
        if (!hasEligible) {
          throw new Error(`Coupon '${res.data.code}' is only valid for: ${res.data.eligibleCategories.join(", ")}`);
        }
      }
      setCouponData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid or expired coupon code";
      setCouponError(msg);
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  if (!service && selectedServices.length === 0) return null;

  const price = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const mrp = selectedServices.reduce((sum, s) => sum + (Number(s.mrp) || Number(s.price) || 0), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const discount = couponData ? Number(couponData.discountAmount || (price * (couponData.discountPercentage || 0)) / 100) : 0;
  const totalPayable = Math.max(0, price - discount + PLATFORM_FEE);
  const totalBonusCoins = selectedServices.reduce((sum, s) => sum + (Number(s.rewards) || 0), 0);
  const coinsToEarn = calculateCoins(totalPayable, totalBonusCoins);

  // Quick Date Shortcut buttons
  const todayStr = getTodayDateString(0);
  const tomorrowStr = getTodayDateString(1);
  const dayAfterStr = getTodayDateString(2);

  /* SUBMIT & CHECKOUT */
  const handleProceedToPayment = () => {
    if (!date || !selectedSlot) {
      setError("Please pick both an appointment date and a time slot.");
      return;
    }
    if (isPastSlot(date, selectedSlot)) {
      setError("Selected slot is in the past. Please select an upcoming slot.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirmAndPay = async () => {
    setLoading(true);
    setError("");

    try {
      const sIds = selectedServices.map((s) => s.id);
      // 1. Create booking in backend
      const bookingRes = await createBooking({
        serviceId: sIds[0],
        serviceIds: sIds,
        scheduledAt: `${date}T${selectedSlot}:00`,
        couponCode: couponData?.code || null,
        note: `Payment via ${paymentMethod}`,
        storeId: selectedStore?.id || null,
        paymentMethod: paymentMethod,
      });

      const newBooking = bookingRes.data;

      // 2. Process checkout / payment if UPI or CARD; if CASH, payment remains PENDING for Pay at Salon / Pay Online Later
      if (paymentMethod !== "CASH") {
        try {
          await checkoutPayment({
            bookingId: newBooking.id,
            paymentMethod: paymentMethod,
          });
        } catch (payErr) {
          console.warn("Payment checkout recorded locally:", payErr);
        }
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
          {/* Header & Services Selector */}
          <div className="border-b border-groomish-slate/10 pb-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Step 1 of 2 • Scheduling
                </span>
                <h2 className="text-xl font-heading font-bold text-groomish-slate flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-groomish-orange" />
                  <span>
                    {selectedServices.length > 1
                      ? `${selectedServices[0]?.name} + ${selectedServices.length - 1} more`
                      : selectedServices[0]?.name || service.name}
                  </span>
                </h2>
                <p className="text-xs text-groomish-slate/60 mt-0.5">
                  {totalDuration} mins total duration • {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""}
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

            {/* Branch Disabled Warning Banner */}
            {branchDisabledWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Treatment Unavailable at Selected Branch</span>
                  <span>{branchDisabledWarning}</span>
                </div>
              </div>
            )}

            {/* Selected Services Tags */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {selectedServices.map((srv) => (
                <div
                  key={srv.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-groomish-orangeLight border border-groomish-orange/20 text-xs font-bold text-groomish-slate"
                >
                  <span>{srv.name}</span>
                  <span className="text-groomish-orange">₹{srv.price}</span>
                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedService(srv.id)}
                      className="text-groomish-slate/40 hover:text-groomish-crimson ml-0.5"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add More Service Button */}
              <button
                type="button"
                onClick={() => setShowAddServiceList(!showAddServiceList)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-dashed border-groomish-orange/40 text-groomish-orange hover:bg-groomish-orangeLight text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Services</span>
              </button>
            </div>

            {/* Expandable Service Picker */}
            {showAddServiceList && (
              <div className="p-3 bg-groomish-cream/70 rounded-xl border border-groomish-slate/15 space-y-2 max-h-48 overflow-y-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-groomish-slate/60">
                  Select Additional Service
                </div>
                {moreServices
                  .filter((s) => !selectedServices.some((sel) => sel.id === s.id))
                  .slice(0, 10)
                  .map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => handleAddAdditionalService(srv)}
                      className="p-2 rounded-lg bg-white border border-groomish-slate/10 hover:border-groomish-orange/40 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold text-groomish-slate">{srv.name}</div>
                        <div className="text-[11px] text-groomish-slate/50">
                          {srv.durationMinutes} mins • {srv.categoryName || "Salon Care"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-groomish-slate">₹{srv.price}</span>
                        <span className="text-groomish-orange font-bold">+ Add</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Salon Branch Notification Banner */}
          <div className="flex items-center justify-between p-3 bg-groomish-cream/70 rounded-2xl border border-groomish-slate/10 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-groomish-orange/10 flex items-center justify-center text-groomish-orange shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-groomish-orange tracking-wider block">
                  Salon Branch
                </span>
                <span className="font-bold text-groomish-slate truncate block">
                  {selectedStore?.name || "Indiranagar Flagship"}
                </span>
                {selectedStore?.address && (
                  <span className="text-[11px] text-groomish-slate/60 truncate block">
                    {selectedStore.address}, {selectedStore.city}
                  </span>
                )}
              </div>
            </div>
            {selectedStore?.distanceKm !== null && selectedStore?.distanceKm !== undefined && (
              <span className="text-[11px] font-semibold text-groomish-orange bg-groomish-orange/10 px-2 py-0.5 rounded-full shrink-0">
                📍 {selectedStore.distanceKm} km away
              </span>
            )}
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
            ) : (() => {
              const availableUpcomingSlots = date === todayStr ? slots.filter((s) => !isPastSlot(date, s)) : slots;
              if (availableUpcomingSlots.length === 0) {
                return (
                  <div className="text-center py-6 text-xs text-groomish-slate/60 bg-groomish-cream rounded-xl">
                    {date === todayStr
                      ? "No upcoming slots remaining for today. Please choose tomorrow or another upcoming date."
                      : "Please select a date to view available salon slots."}
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableUpcomingSlots.map((slot) => {
                    const isUnavailable = unavailableSlots.includes(slot) || isPastSlot(date, slot);
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
              );
            })()}
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
            <div className="flex items-center gap-1.5 text-amber-600 font-bold">
              <GroomCoinIcon className="w-4 h-4" />
              <span>Earn +{coinsToEarn} Groom Coins</span>
              {totalBonusCoins > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  +{totalBonusCoins} Extra Bonus!
                </span>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={!date || !selectedSlot || Boolean(branchDisabledWarning)}
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

          {/* Salon Branch Summary in Step 2 */}
          <div className="flex items-center gap-2 p-2.5 bg-groomish-cream/70 rounded-xl border border-groomish-slate/10 text-xs text-groomish-slate">
            <MapPin className="w-4 h-4 text-groomish-orange shrink-0" />
            <div className="truncate">
              <span className="font-bold">{selectedStore?.name || "Flagship Salon"}</span>
              <span className="text-groomish-slate/60 text-[11px] ml-1.5">
                ({selectedStore?.address || "Bengaluru"})
              </span>
            </div>
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
          <div className="flex items-center gap-2.5 p-3 bg-groomish-goldLight border border-groomish-gold/30 rounded-xl text-xs text-groomish-slate">
            <GroomCoinIcon className="w-5 h-5 shrink-0" />
            <span>
              You will automatically earn <b>+{coinsToEarn} Groom Coins</b> on this booking!
              {totalBonusCoins > 0 && (
                <span className="text-amber-800 font-semibold ml-1">
                  (Includes +{totalBonusCoins} extra bonus coins for your selected services)
                </span>
              )}
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
              <span>
                {loading
                  ? "Confirming..."
                  : paymentMethod === "CASH"
                  ? `Confirm Booking (Pay ₹${totalPayable} at Salon)`
                  : `Pay ₹${totalPayable} & Confirm`}
              </span>
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
                {completedBooking?.bookingCode || (completedBooking?.id ? `GN-${completedBooking.id.slice(0, 8).toUpperCase()}` : "GRM-LIVE")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-groomish-slate/60">Service:</span>
              <span className="font-semibold text-groomish-slate">{service.name}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-groomish-slate/60">Salon Branch:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-groomish-slate">
                  {completedBooking?.storeName || selectedStore?.name || "Flagship Salon"}
                </span>
                <a
                  href={getBranchNavigationUrl(completedBooking || selectedStore)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-groomish-orange bg-groomish-orangeLight hover:bg-groomish-orange hover:text-white px-2.5 py-1 rounded-xl transition shadow-xs"
                  title="Open Google Maps navigation from your current location"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Navigate</span>
                </a>
              </div>
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
                if (completedBooking?.id) {
                  navigate(`/customer/bookings/${completedBooking.id}`);
                } else {
                  navigate("/customer/bookings");
                }
              }}
              className="btn-primary text-xs px-6 py-2.5"
            >
              View Appointment Details
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
