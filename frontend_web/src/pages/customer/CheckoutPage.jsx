import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CustomDatePicker from "../../components/common/CustomDatePicker";
import CustomSelect from "../../components/common/CustomSelect";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/useAuth";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastProvider";
import { useConfirm } from "../../context/ConfirmContext";
import { storeApi } from "../../api/store";
import {
  getMyVouchers,
  applyCoupon,
  getSlotAvailability,
} from "../../api/customer";
import { extractList } from "../../utils/dataHelper";
import {
  Calendar,
  Clock,
  Tag,
  Ticket,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Package,
  Store,
  ChevronRight,
  Home,
  Sparkles,
  ArrowRight,
  X,
  Check,
  Loader2,
  Plus,
} from "lucide-react";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stores, selectedStore, selectStore } = useStore();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const {
    cart,
    items,
    servicesCount,
    productsCount,
    totalAmount,
    checkout,
    updateStore,
    removeItem,
  } = useCart();

  // Booking states
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState("");
  // Default branch matches navbar selectedStore, fallback to cart, then first store
  const [selectedStoreId, setSelectedStoreId] = useState(
    () => selectedStore?.id || cart?.storeId || (stores && stores[0]?.id) || ""
  );
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // CASH | UPI | CARD
  const [submitting, setSubmitting] = useState(false);

  // Branch checking & unavailable items state
  const [checkingBranch, setCheckingBranch] = useState(false);
  const [unavailableItemsMap, setUnavailableItemsMap] = useState({});

  // Slots
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Discount / Offers
  const [discountType, setDiscountType] = useState("COUPON"); // COUPON | VOUCHER
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Sync default branch to navbar's selectedStore, fallback to cart, then first store
  useEffect(() => {
    if (!selectedStoreId) {
      if (selectedStore?.id) {
        setSelectedStoreId(selectedStore.id);
      } else if (cart?.storeId) {
        setSelectedStoreId(cart.storeId);
      } else if (stores && stores.length > 0) {
        setSelectedStoreId(stores[0].id);
      }
    }
  }, [selectedStore, cart?.storeId, stores, selectedStoreId]);

  useEffect(() => {
    if (user) {
      setLoadingVouchers(true);
      getMyVouchers()
        .then((res) => {
          const list = extractList(res.data);
          // Only show active vouchers
          const activeList = list.filter((v) => v.status === "ACTIVE");
          setMyVouchers(activeList);
        })
        .catch(() => setMyVouchers([]))
        .finally(() => setLoadingVouchers(false));
    }
  }, [user]);

  // Generate Slots
  const timeSlots = useMemo(() => {
    const slots = [];
    let startMinutes = 9 * 60 + 30; // 09:30 AM
    const endMinutes = 20 * 60 + 30; // 08:30 PM
    while (startMinutes <= endMinutes) {
      const h = Math.floor(startMinutes / 60);
      const m = startMinutes % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      slots.push(timeStr);
      startMinutes += 30;
    }
    return slots;
  }, []);

  const serviceItems = useMemo(() => items.filter((i) => i.itemType === "SERVICE"), [items]);
  const productItems = useMemo(() => items.filter((i) => i.itemType === "PRODUCT"), [items]);

  const primaryServiceId = useMemo(() => {
    return serviceItems[0]?.serviceId || null;
  }, [serviceItems]);

  // Load slot availability if date or primary service changes (no infinite loop)
  useEffect(() => {
    if (!selectedDate || !primaryServiceId) {
      setUnavailableSlots([]);
      setLoadingSlots(false);
      return;
    }

    let isMounted = true;
    setLoadingSlots(true);
    getSlotAvailability(selectedDate, primaryServiceId)
      .then((res) => {
        if (isMounted) {
          setUnavailableSlots(res.data?.unavailableSlots || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load slot availability:", err);
        if (isMounted) setUnavailableSlots([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, primaryServiceId]);

  // Check if slot has already passed for today
  const isSlotPast = (timeStr) => {
    if (selectedDate !== todayStr) return false;
    const [h, m] = timeStr.split(":").map(Number);
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate <= new Date();
  };

  // Reset selected time if it becomes past
  useEffect(() => {
    if (selectedTime && isSlotPast(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, selectedTime]);

  // Validate branch switch against current cart items
  const handleStoreBranchChange = async (newStoreId) => {
    if (!newStoreId || newStoreId === selectedStoreId) return;

    const targetStore = stores.find((s) => s.id === newStoreId);

    // If cart is empty, simply change store directly
    if (items.length === 0) {
      setSelectedStoreId(newStoreId);
      if (targetStore) selectStore(targetStore);
      await updateStore(newStoreId);
      return;
    }

    setCheckingBranch(true);
    try {
      const [servicesRes, productsRes] = await Promise.all([
        storeApi.getStoreServices(newStoreId).catch(() => ({ data: [] })),
        storeApi.getStoreProducts(newStoreId).catch(() => ({ data: [] })),
      ]);

      const branchServices = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      const branchProducts = Array.isArray(productsRes.data) ? productsRes.data : [];

      const unavailable = [];
      const newUnavailableMap = {};

      for (const item of items) {
        if (item.itemType === "SERVICE") {
          const s = branchServices.find((b) => b.serviceId === item.serviceId);
          const isAvailable = s && s.effectiveActive !== false && s.storeActive !== false && s.globalActive !== false;
          if (!isAvailable) {
            const reason = "Not offered at this branch";
            unavailable.push({ ...item, reason });
            newUnavailableMap[item.id] = { reason, isOutOfStock: false };
          }
        } else if (item.itemType === "PRODUCT") {
          const p = branchProducts.find((b) => b.productId === item.productId);
          const isOutOfStock = !p || p.outOfStock || (p.stockQuantity !== null && p.stockQuantity <= 0);
          const isInsufficient = p && p.stockQuantity !== null && p.stockQuantity < (item.quantity || 1);
          const isAvailable = p && p.effectiveActive !== false && !isOutOfStock && !isInsufficient;
          if (!isAvailable) {
            const reason = isOutOfStock
              ? "Out of stock at this branch"
              : isInsufficient
              ? `Only ${p.stockQuantity} in stock at this branch`
              : "Not carried at this branch";
            unavailable.push({ ...item, reason });
            newUnavailableMap[item.id] = { reason, isOutOfStock: true };
          }
        }
      }

      if (unavailable.length > 0) {
        // Mark unavailable items so UI displays out of stock / unavailable status
        setUnavailableItemsMap(newUnavailableMap);

        const itemsListText = unavailable
          .map((i) => `• ${i.serviceName || i.productName} (${i.reason})`)
          .join("\n");

        const targetStoreName = targetStore?.name || "the selected branch";

        const confirmed = await confirm({
          title: "Unavailable Items at Selected Branch",
          message: `The following item(s) in your cart are not available at ${targetStoreName}:\n\n${itemsListText}\n\nWould you like to remove these unavailable items from your cart and switch to ${targetStoreName}?`,
          confirmText: "Remove Items & Switch Branch",
          cancelText: "Keep Current Branch",
          variant: "warning",
        });

        if (confirmed) {
          for (const item of unavailable) {
            await removeItem(item.id, item.serviceName || item.productName);
          }
          await updateStore(newStoreId);
          if (targetStore) selectStore(targetStore);
          setSelectedStoreId(newStoreId);
          setUnavailableItemsMap({});
          showToast(`Switched to ${targetStoreName}. Unavailable items removed.`, "success");
        } else {
          // Keep current branch and clear temporary unavailable map
          setUnavailableItemsMap({});
          showToast(`Kept current branch. Cart items retained.`, "info");
        }
      } else {
        // All items are available
        setUnavailableItemsMap({});
        await updateStore(newStoreId);
        if (targetStore) selectStore(targetStore);
        setSelectedStoreId(newStoreId);
        showToast(`Switched salon branch to ${targetStore?.name || "selected branch"}`, "success");
      }
    } catch (err) {
      console.error("Failed to check branch catalog availability:", err);
      showToast("Unable to verify branch catalog availability", "error");
    } finally {
      setCheckingBranch(false);
    }
  };

  // Calculate discount
  const discountAmount = useMemo(() => {
    if (appliedCoupon) {
      let disc = appliedCoupon.discount || 0;
      if (appliedCoupon.maxDiscount && disc > appliedCoupon.maxDiscount) {
        disc = appliedCoupon.maxDiscount;
      }
      return Math.min(disc, totalAmount);
    }
    if (appliedVoucher) {
      if (appliedVoucher.discountPercent) {
        const disc = (totalAmount * appliedVoucher.discountPercent) / 100;
        return Math.min(disc, totalAmount);
      }
    }
    return 0;
  }, [appliedCoupon, appliedVoucher, totalAmount]);

  const finalPayable = Math.max(totalAmount - discountAmount, 0);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      showToast("Please enter a coupon code", "warning");
      return;
    }
    setValidatingDiscount(true);
    try {
      const res = await applyCoupon(couponCodeInput.trim().toUpperCase(), totalAmount);
      const coupon = res.data;
      if (!coupon || !coupon.active) {
        throw new Error("Coupon is invalid or inactive");
      }
      if (coupon.minAmount && totalAmount < coupon.minAmount) {
        throw new Error(`Order total ₹${totalAmount} does not meet coupon minimum of ₹${coupon.minAmount}`);
      }
      if (coupon.eligibleCategories && coupon.eligibleCategories.length > 0) {
        const hasEligible = cartItems.some(item => {
          const catName = item.service?.category?.name || item.product?.category || item.category;
          return catName && coupon.eligibleCategories.some(ec => ec.toLowerCase() === catName.toLowerCase());
        });
        if (!hasEligible) {
          throw new Error(`Coupon '${coupon.code}' is only valid for: ${coupon.eligibleCategories.join(", ")}`);
        }
      }
      setAppliedCoupon(coupon);
      setAppliedVoucher(null);
      showToast(`Coupon '${coupon.code}' applied! Saved ₹${coupon.discount}`, "success");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid coupon code";
      showToast(msg, "error");
    } finally {
      setValidatingDiscount(false);
    }
  };

  // Apply Voucher
  const handleSelectVoucher = (voucher) => {
    setAppliedVoucher(voucher);
    setAppliedCoupon(null);
    showToast(`Voucher '${voucher.title || voucher.voucherCode}' selected!`, "success");
  };

  const handleRemoveDiscount = () => {
    setAppliedCoupon(null);
    setAppliedVoucher(null);
    setCouponCodeInput("");
    showToast("Discount removed", "info");
  };

  // Checkout submission
  const handleSubmitCheckout = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast("Your cart is empty", "warning");
      navigate("/cart");
      return;
    }

    if (Object.keys(unavailableItemsMap).length > 0) {
      showToast("Please remove unavailable items before proceeding with checkout", "warning");
      return;
    }

    if (serviceItems.length > 0 && !selectedTime) {
      showToast("Please select an appointment time slot for your services", "warning");
      return;
    }

    let scheduledAt = null;
    if (selectedDate && selectedTime) {
      scheduledAt = `${selectedDate}T${selectedTime}:00`;
    } else {
      scheduledAt = new Date().toISOString().slice(0, 19);
    }

    setSubmitting(true);
    try {
      const checkoutData = {
        scheduledAt,
        storeId: selectedStoreId || (stores[0] ? stores[0].id : null),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        voucherCode: appliedVoucher ? appliedVoucher.voucherCode : null,
        paymentMethod,
        note,
      };

      const bookingRes = await checkout(checkoutData);
      if (bookingRes?.id) {
        navigate(`/customer/bookings/${bookingRes.id}`, { replace: true });
      } else {
        navigate("/customer/bookings", { replace: true });
      }
    } catch (err) {
      // Error toast already handled by checkout context
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto py-24 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-groomish-creamDark flex items-center justify-center mx-auto mb-4 text-groomish-slate/40">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-groomish-slate">
            No items in checkout
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-1 mb-6">
            Please add treatments or retail beauty products to your cart before proceeding to checkout.
          </p>
          <button
            onClick={() => navigate("/cart")}
            className="btn-primary text-xs px-6 py-2.5"
          >
            Go to Cart
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-groomish-slate/10 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-groomish-slate/60">
            <Link to="/" className="hover:text-groomish-orange flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <Link to="/cart" className="hover:text-groomish-orange">
              Cart
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <span className="font-bold text-groomish-slate">Checkout & Booking</span>
          </div>
        </div>

        {/* HEADER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-groomish-slate tracking-tight">
            Checkout & Appointment Scheduling
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Choose your salon appointment slot, redeem promotional offers or vouchers, and confirm booking
          </p>
        </div>

        {/* CHECKOUT FORM & SUMMARY */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <form onSubmit={handleSubmitCheckout} className="grid lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: SCHEDULING, REDEMPTION & PAYMENT */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. SALON LOCATION */}
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-groomish-slate/10 pb-3">
                  <Store className="w-4 h-4 text-groomish-orange" />
                  <h2 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate">
                    1. Salon Location & Branch
                  </h2>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-groomish-slate">
                      Choose Salon Branch
                    </label>
                    {checkingBranch && (
                      <span className="text-[11px] font-bold text-groomish-orange flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking branch catalog...
                      </span>
                    )}
                  </div>
                  <CustomSelect
                    value={selectedStoreId}
                    onChange={(e) => handleStoreBranchChange(e.target.value)}
                    disabled={checkingBranch}
                    className="py-2.5 text-xs bg-groomish-cream rounded-xl"
                    options={(stores || []).map((s) => ({
                      value: s.id,
                      label: `${s.name} — ${s.city} (${s.openingTime || "09:00"} - ${s.closingTime || "21:30"})`,
                    }))}
                  />
                  {selectedStore && (
                    <p className="text-[11px] text-groomish-slate/60 flex items-center gap-1.5">
                      <span>Default branch synced with Navbar:</span>
                      <strong className="text-groomish-slate">
                        {stores.find((s) => s.id === selectedStoreId)?.name || selectedStore.name}
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. DATE & SLOT SELECTION (if services present) */}
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-groomish-orange" />
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate">
                      2. Appointment Date & Stylist Slot
                    </h2>
                  </div>
                  {serviceItems.length > 0 && (
                    <span className="text-[11px] font-bold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-full">
                      Required for treatments
                    </span>
                  )}
                </div>

                {/* Date Picker - Groomish Themed */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-groomish-slate">
                    Select Appointment Date
                  </label>
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={(e, val) => {
                      const nextVal = val || e?.target?.value || "";
                      setSelectedDate(nextVal);
                      setSelectedTime("");
                    }}
                    minDate={todayStr}
                    placeholder="Select Appointment Date"
                    className="w-full"
                    triggerClassName="w-full bg-groomish-cream hover:bg-white border-groomish-slate/15 py-3 px-4 rounded-2xl text-xs font-bold transition"
                  />
                </div>

                {/* Slots Grid */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-groomish-slate">
                    <span>Available Time Slot</span>
                    {loadingSlots ? (
                      <span className="text-[11px] text-groomish-orange font-semibold flex items-center gap-1.5 animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        Checking stylist availability...
                      </span>
                    ) : (
                      selectedTime && (
                        <span className="text-[11px] font-bold text-groomish-green flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Selected: {selectedTime}
                        </span>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                    {timeSlots.map((time) => {
                      const isPast = isSlotPast(time);
                      const isUnavailable = unavailableSlots.includes(time) || isPast;
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => !isUnavailable && setSelectedTime(time)}
                          title={
                            isPast
                              ? "Slot has already passed for today"
                              : isUnavailable
                              ? "Fully booked slot"
                              : `Book ${time}`
                          }
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-groomish-orange text-white shadow-glowOrange scale-102"
                              : isUnavailable
                              ? "bg-groomish-slate/5 text-groomish-slate/30 cursor-not-allowed line-through"
                              : "bg-groomish-cream text-groomish-slate hover:bg-groomish-creamDark"
                          }`}
                        >
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{time}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1">
                    Live 5-stylist salon capacity check ensures you receive dedicated personal attention.
                  </p>
                </div>
              </div>

              {/* 3. REDEEM COUPONS & VOUCHERS */}
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-groomish-orange" />
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate">
                      3. Redeem Coupon / Loyalty Voucher
                    </h2>
                  </div>

                  {/* Tabs: Coupon vs Voucher */}
                  <div className="flex bg-groomish-cream p-1 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscountType("COUPON")}
                      className={`px-3 py-1 rounded-lg transition ${
                        discountType === "COUPON"
                          ? "bg-white text-groomish-orange shadow-sm"
                          : "text-groomish-slate/60 hover:text-groomish-slate"
                      }`}
                    >
                      Promo Coupon
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("VOUCHER")}
                      className={`px-3 py-1 rounded-lg transition ${
                        discountType === "VOUCHER"
                          ? "bg-white text-groomish-orange shadow-sm"
                          : "text-groomish-slate/60 hover:text-groomish-slate"
                      }`}
                    >
                      My Vouchers ({myVouchers.length})
                    </button>
                  </div>
                </div>

                {/* Applied Badge if any */}
                {(appliedCoupon || appliedVoucher) && (
                  <div className="p-3.5 rounded-2xl bg-groomish-greenLight border border-groomish-green/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green" />
                      <div>
                        <span className="text-xs font-bold text-groomish-green">
                          {appliedCoupon ? `Coupon Applied: ${appliedCoupon.code}` : `Voucher Applied: ${appliedVoucher.title || appliedVoucher.voucherCode}`}
                        </span>
                        <span className="text-[11px] text-groomish-slate/70 block">
                          You save ₹{discountAmount} on this appointment!
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="p-1.5 rounded-full hover:bg-white text-groomish-slate/60 hover:text-groomish-crimson transition"
                      title="Remove discount"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Coupon Tab */}
                {discountType === "COUPON" && !appliedCoupon && !appliedVoucher && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter promo coupon code (e.g. GROOM100)"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-2.5 rounded-2xl bg-groomish-cream text-xs text-groomish-slate font-mono uppercase tracking-wider border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingDiscount}
                        className="btn-primary text-xs px-5 py-2.5 shadow-sm whitespace-nowrap"
                      >
                        {validatingDiscount ? "Applying..." : "Apply"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-groomish-slate/50">
                      <Sparkles className="w-3.5 h-3.5 text-groomish-gold" />
                      <span>Popular codes: <b>GROOM100</b>, <b>GLOW50</b>, <b>ROYAL250</b></span>
                    </div>
                  </div>
                )}

                {/* Vouchers Tab */}
                {discountType === "VOUCHER" && !appliedCoupon && !appliedVoucher && (
                  <div className="space-y-3">
                    {loadingVouchers ? (
                      <p className="text-xs text-groomish-slate/50">Loading your vouchers...</p>
                    ) : myVouchers.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-groomish-cream text-center text-xs text-groomish-slate/60">
                        <Ticket className="w-6 h-6 text-groomish-slate/30 mx-auto mb-1.5" />
                        <p className="font-semibold">No active redeemed vouchers found</p>
                        <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                          You can unlock exclusive reward vouchers in the{" "}
                          <Link to="/customer/rewards" className="text-groomish-orange underline">
                            Loyalty Rewards page
                          </Link>{" "}
                          using your earned points.
                        </p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {myVouchers.map((voucher) => (
                          <div
                            key={voucher.id}
                            onClick={() => handleSelectVoucher(voucher)}
                            className="p-3 rounded-2xl border border-groomish-slate/15 hover:border-groomish-orange bg-groomish-cream/50 hover:bg-white transition cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] font-mono font-bold text-groomish-orange block">
                                {voucher.voucherCode}
                              </span>
                              <span className="font-heading font-bold text-xs text-groomish-slate truncate block">
                                {voucher.title}
                              </span>
                              <span className="text-[10px] text-groomish-slate/60 block">
                                {voucher.discountPercent}% Discount
                              </span>
                            </div>
                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-groomish-orange text-white group-hover:scale-105 transition"
                            >
                              Redeem
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. PAYMENT METHOD */}
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-groomish-slate/10 pb-3">
                  <CreditCard className="w-4 h-4 text-groomish-orange" />
                  <h2 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate">
                    4. Payment Mode
                  </h2>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {/* CASH / AT SALON */}
                  <label
                    onClick={() => setPaymentMethod("CASH")}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col items-start justify-between gap-3 ${
                      paymentMethod === "CASH"
                        ? "border-groomish-orange bg-groomish-orangeLight/40"
                        : "border-groomish-slate/10 bg-white hover:border-groomish-slate/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Banknote className="w-5 h-5 text-groomish-orange" />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "CASH" ? "border-groomish-orange bg-groomish-orange" : "border-groomish-slate/30"}`}>
                        {paymentMethod === "CASH" && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-groomish-slate block">
                        Pay at Salon
                      </span>
                      <span className="text-[10px] text-groomish-slate/60">
                        Cash or Card at desk upon service completion.
                      </span>
                    </div>
                  </label>

                  {/* UPI */}
                  <label
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col items-start justify-between gap-3 ${
                      paymentMethod === "UPI"
                        ? "border-groomish-orange bg-groomish-orangeLight/40"
                        : "border-groomish-slate/10 bg-white hover:border-groomish-slate/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Smartphone className="w-5 h-5 text-groomish-blue" />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "UPI" ? "border-groomish-orange bg-groomish-orange" : "border-groomish-slate/30"}`}>
                        {paymentMethod === "UPI" && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-groomish-slate block">
                        UPI Online
                      </span>
                      <span className="text-[10px] text-groomish-slate/60">
                        Google Pay, PhonePe, Paytm, or BHIM.
                      </span>
                    </div>
                  </label>

                  {/* CARD */}
                  <label
                    onClick={() => setPaymentMethod("CARD")}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col items-start justify-between gap-3 ${
                      paymentMethod === "CARD"
                        ? "border-groomish-orange bg-groomish-orangeLight/40"
                        : "border-groomish-slate/10 bg-white hover:border-groomish-slate/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <CreditCard className="w-5 h-5 text-groomish-green" />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "CARD" ? "border-groomish-orange bg-groomish-orange" : "border-groomish-slate/30"}`}>
                        {paymentMethod === "CARD" && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-groomish-slate block">
                        Credit / Debit Card
                      </span>
                      <span className="text-[10px] text-groomish-slate/60">
                        Visa, Mastercard, RuPay & Amex.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 5. NOTES */}
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-2">
                <label className="text-xs font-semibold text-groomish-slate">
                  Special Instructions / Styling Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="E.g. Extra focus on beard lining, sensitive scalp, allergies..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition resize-none"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: ITEMS SUMMARY & CTA */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-card space-y-5">
                <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
                  <h3 className="font-heading font-extrabold text-base text-groomish-slate">
                    Appointment & Order Summary
                  </h3>
                  <Link
                    to="/cart"
                    className="text-xs font-bold text-groomish-orange hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service / Items</span>
                  </Link>
                </div>

                {/* Items Compact Preview */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                  {items.map((item) => {
                    const unavailableInfo = unavailableItemsMap[item.id];
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between text-groomish-slate rounded-xl p-2 transition ${
                          unavailableInfo
                            ? "bg-red-50 border border-red-200"
                            : "hover:bg-groomish-cream/40"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span
                            className={`font-bold truncate block ${
                              unavailableInfo ? "line-through text-groomish-crimson" : ""
                            }`}
                          >
                            {item.serviceName || item.productName}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] text-groomish-slate/60">
                              {item.itemType === "SERVICE" ? "Service" : "Retail Product"} • Qty:{" "}
                              {unavailableInfo ? (
                                <strong className="text-groomish-crimson">
                                  0 (Unavailable)
                                </strong>
                              ) : (
                                item.quantity
                              )}
                            </span>
                            {unavailableInfo && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-100 text-groomish-crimson border border-red-200">
                                {unavailableInfo.reason}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`font-extrabold shrink-0 ${
                            unavailableInfo ? "text-groomish-crimson text-[11px]" : ""
                          }`}
                        >
                          {unavailableInfo ? "Unavailable" : `₹${item.totalPrice}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-groomish-slate/10 space-y-2 text-xs text-groomish-slate">
                  <div className="flex items-center justify-between">
                    <span className="text-groomish-slate/70">Subtotal</span>
                    <span className="font-bold">₹{totalAmount}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-groomish-green font-bold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Discount Applied</span>
                      </span>
                      <span>- ₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-groomish-slate/70">Salon Hygiene & Taxes</span>
                    <span className="text-groomish-green font-bold text-[11px]">FREE</span>
                  </div>

                  <div className="pt-3 border-t border-groomish-slate/10 flex items-baseline justify-between">
                    <span className="font-heading font-extrabold text-base text-groomish-slate">
                      Final Payable
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-groomish-slate">
                        ₹{finalPayable}
                      </span>
                      <span className="text-[10px] text-groomish-slate/50 block">
                        {paymentMethod === "CASH" ? "Pay at salon" : "Online payment"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  type="submit"
                  disabled={submitting || checkingBranch || Object.keys(unavailableItemsMap).length > 0}
                  className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span>Confirming Appointment...</span>
                  ) : checkingBranch ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking Branch Availability...
                    </span>
                  ) : Object.keys(unavailableItemsMap).length > 0 ? (
                    <span>Resolve Unavailable Items</span>
                  ) : (
                    <>
                      <span>Confirm & Book Appointment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Trust Points */}
                <div className="space-y-2 pt-2 border-t border-groomish-slate/10 text-[11px] text-groomish-slate/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-groomish-green shrink-0" />
                    <span>Instant Gmail & In-App confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-groomish-blue shrink-0" />
                    <span>Free rescheduling anytime prior to slot</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
