import { useState, useEffect, useMemo, useCallback } from "react";
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
  createRazorpayOrder,
  verifyRazorpayPayment,
  checkoutPayment,
  switchToPayAtSalon,
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
  RefreshCw,
  RotateCcw,
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

  // Local calendar date helper avoiding UTC timezone offset shifts
  const getLocalDateStr = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Real-time clock tick every 15s to automatically invalidate passed slots
  const [currentNow, setCurrentNow] = useState(() => new Date());
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentNow(new Date());
    }, 15000);
    return () => clearInterval(clockTimer);
  }, []);

  // Format "13:30" -> "01:30 PM", "09:30" -> "09:30 AM"
  const formatSlot12Hour = (timeStr) => {
    if (!timeStr) return "";
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  };

  // Booking states
  const todayStr = useMemo(() => getLocalDateStr(), []);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateStr());
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

  // Payment Modal States (Retry / Pay at salon / Success)
  const [paymentFailureModal, setPaymentFailureModal] = useState({
    isOpen: false,
    reason: "",
    bookingId: null,
    bookingCode: "",
    amount: 0,
    storeName: "",
    scheduledAt: "",
    retryCount: 0, // max 2 retries
  });

  const [paymentSuccessModal, setPaymentSuccessModal] = useState({
    isOpen: false,
    bookingId: null,
    bookingCode: "",
    amount: 0,
    storeName: "",
    scheduledAt: "",
    paymentMethod: "ONLINE", // ONLINE | CASH
  });

  const [successCountdown, setSuccessCountdown] = useState(4);
  const [pendingCountdown, setPendingCountdown] = useState(8);
  const [switchingToSalon, setSwitchingToSalon] = useState(false);

  const scheduledDateTimeStr = useMemo(() => {
    if (selectedDate && selectedTime) {
      return `${selectedDate}T${selectedTime}:00`;
    }
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${getLocalDateStr(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }, [selectedDate, selectedTime]);

  // Auto-redirect to booking details after payment confirmation
  useEffect(() => {
    if (!paymentSuccessModal.isOpen || !paymentSuccessModal.bookingId) return;

    setSuccessCountdown(4);
    const interval = setInterval(() => {
      setSuccessCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const targetId = paymentSuccessModal.bookingId;
          setPaymentSuccessModal((m) => ({ ...m, isOpen: false }));
          navigate(`/customer/bookings/${targetId}`, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentSuccessModal.isOpen, paymentSuccessModal.bookingId, navigate]);

  // Auto-redirect to booking details if payment pending modal remains open
  useEffect(() => {
    if (!paymentFailureModal.isOpen || !paymentFailureModal.bookingId) {
      setPendingCountdown(8);
      return;
    }

    setPendingCountdown(8);
    const interval = setInterval(() => {
      setPendingCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const targetId = paymentFailureModal.bookingId;
          setPaymentFailureModal((m) => ({ ...m, isOpen: false }));
          navigate(`/customer/bookings/${targetId}`, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentFailureModal.isOpen, paymentFailureModal.bookingId, navigate]);

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

  const hasServices = serviceItems.length > 0;
  const isSlotSelected = !hasServices || Boolean(selectedDate && selectedTime);

  const primaryServiceId = useMemo(() => {
    return serviceItems[0]?.serviceId || null;
  }, [serviceItems]);

  // Load slot availability with real-time support
  const fetchSlotAvailability = useCallback(async (isManual = false) => {
    if (!selectedDate || !primaryServiceId) {
      setUnavailableSlots([]);
      setLoadingSlots(false);
      return;
    }

    setLoadingSlots(true);
    try {
      const res = await getSlotAvailability(selectedDate, primaryServiceId);
      setUnavailableSlots(res.data?.unavailableSlots || []);
      if (isManual) {
        showToast("Stylist slot availability refreshed in real-time", "info");
      }
    } catch (err) {
      console.error("Failed to load slot availability:", err);
      setUnavailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, primaryServiceId, showToast]);

  // Initial fetch and real-time polling every 30 seconds
  useEffect(() => {
    fetchSlotAvailability();
    const pollInterval = setInterval(() => {
      fetchSlotAvailability();
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchSlotAvailability]);

  // Check if slot has already passed for today in real-time
  const isSlotPast = useCallback((timeStr) => {
    const currentToday = getLocalDateStr(currentNow);
    if (selectedDate !== currentToday) return false;
    const [h, m] = timeStr.split(":").map(Number);
    const slotDate = new Date(currentNow);
    slotDate.setHours(h, m, 0, 0);
    return slotDate <= currentNow;
  }, [selectedDate, currentNow]);

  // Reset selected time if it becomes past in real-time
  useEffect(() => {
    if (selectedTime && isSlotPast(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, selectedTime, isSlotPast]);

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

  // Handle launching Razorpay with retry tracking
  const launchRazorpayPayment = async (bookingId, currentRetryCount = 0, initialScheduledAt = null) => {
    try {
      setSubmitting(true);
      const orderRes = await createRazorpayOrder({ bookingId });
      const orderData = orderRes.data;

      if (typeof window !== "undefined" && window.Razorpay && orderData?.keyId) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Groomish Now",
          description: `Appointment Payment (${orderData.bookingCode || bookingId})`,
          image: "https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png",
          order_id: orderData.orderId?.startsWith("order_sim_") ? undefined : orderData.orderId,
          prefill: {
            name: orderData.customerName || user?.name || "",
            email: orderData.customerEmail || user?.email || "",
            contact: orderData.customerPhone || user?.phone || "",
          },
          notes: {
            bookingId: bookingId,
            bookingCode: orderData.bookingCode || "",
          },
          theme: {
            color: "#FA7B47",
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
              setPaymentFailureModal({
                isOpen: true,
                bookingId,
                bookingCode: orderData.bookingCode || "",
                amount: finalPayable,
                storeName: selectedStore?.name || "Groomish Now Salon",
                scheduledAt: initialScheduledAt || scheduledDateTimeStr,
                reason: "Payment window was dismissed before completing transaction.",
                retryCount: currentRetryCount + 1,
              });
            },
          },
          handler: async (response) => {
            try {
              setSubmitting(true);
              showToast("Verifying payment...", "info");
              await verifyRazorpayPayment({
                bookingId: bookingId,
                razorpayOrderId: response.razorpay_order_id || orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setPaymentFailureModal({ isOpen: false, bookingId: null, bookingCode: "", reason: "", retryCount: 0 });
              showToast("Payment verified! Booking confirmed.", "success");
              setPaymentSuccessModal({
                isOpen: true,
                bookingId,
                bookingCode: orderData.bookingCode || bookingId,
                amount: finalPayable,
                storeName: selectedStore?.name || "Groomish Now Salon",
                scheduledAt: initialScheduledAt || scheduledDateTimeStr,
                paymentMethod: "ONLINE",
              });
            } catch (vErr) {
              console.error("Verification failed", vErr);
              setPaymentFailureModal({
                isOpen: true,
                bookingId,
                bookingCode: orderData.bookingCode || "",
                amount: finalPayable,
                storeName: selectedStore?.name || "Groomish Now Salon",
                scheduledAt: initialScheduledAt || scheduledDateTimeStr,
                reason: "Payment verification failed. You may retry online or switch to Pay at Salon.",
                retryCount: currentRetryCount + 1,
              });
            } finally {
              setSubmitting(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          setSubmitting(false);
          setPaymentFailureModal({
            isOpen: true,
            bookingId,
            bookingCode: orderData.bookingCode || "",
            amount: finalPayable,
            storeName: selectedStore?.name || "Groomish Now Salon",
            scheduledAt: initialScheduledAt || scheduledDateTimeStr,
            reason: resp.error?.description || "Payment failed from Razorpay gateway.",
            retryCount: currentRetryCount + 1,
          });
        });
        rzp.open();
      } else {
        // Direct simulation payment
        await checkoutPayment({
          bookingId: bookingId,
          paymentMethod: "ONLINE",
        });
        showToast("Payment completed! Booking confirmed.", "success");
        setPaymentSuccessModal({
          isOpen: true,
          bookingId,
          bookingCode: bookingId,
          amount: finalPayable,
          storeName: selectedStore?.name || "Groomish Now Salon",
          scheduledAt: initialScheduledAt || scheduledDateTimeStr,
          paymentMethod: "ONLINE",
        });
      }
    } catch (rzpErr) {
      console.error("Failed to initiate online payment", rzpErr);
      setPaymentFailureModal({
        isOpen: true,
        bookingId,
        bookingCode: "",
        amount: finalPayable,
        storeName: selectedStore?.name || "Groomish Now Salon",
        scheduledAt: initialScheduledAt || scheduledDateTimeStr,
        reason: rzpErr.response?.data?.message || "Failed to initiate online payment gateway.",
        retryCount: currentRetryCount + 1,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryOnlinePayment = () => {
    const { bookingId, retryCount, scheduledAt } = paymentFailureModal;
    if (!bookingId) return;
    setPaymentFailureModal((prev) => ({ ...prev, isOpen: false }));
    launchRazorpayPayment(bookingId, retryCount, scheduledAt || scheduledDateTimeStr);
  };

  const handleSwitchToSalon = async () => {
    const { bookingId, bookingCode, amount, storeName, scheduledAt } = paymentFailureModal;
    if (!bookingId) return;
    try {
      setSwitchingToSalon(true);
      await switchToPayAtSalon(bookingId);
      setPaymentFailureModal({ isOpen: false, bookingId: null, bookingCode: "", reason: "", retryCount: 0 });
      showToast("Appointment confirmed! Settle payment upon arrival at the salon.", "success");
      setPaymentSuccessModal({
        isOpen: true,
        bookingId,
        bookingCode: bookingCode || bookingId,
        amount: amount || finalPayable,
        storeName: storeName || selectedStore?.name || "Groomish Now Salon",
        scheduledAt: scheduledAt || scheduledDateTimeStr,
        paymentMethod: "CASH",
      });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to switch payment mode", "error");
    } finally {
      setSwitchingToSalon(false);
    }
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

    let scheduledAtStr = null;
    if (selectedDate && selectedTime) {
      scheduledAtStr = `${selectedDate}T${selectedTime}:00`;
    } else {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      scheduledAtStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    setSubmitting(true);
    try {
      const checkoutData = {
        scheduledAt: scheduledAtStr,
        storeId: selectedStoreId || (stores[0] ? stores[0].id : null),
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        voucherCode: appliedVoucher ? appliedVoucher.voucherCode : null,
        paymentMethod,
        note,
      };

      const bookingRes = await checkout(checkoutData);
      if (bookingRes?.id) {
        if (paymentMethod === "ONLINE") {
          await launchRazorpayPayment(bookingRes.id, 0, scheduledAtStr);
        } else {
          // Pay at Salon: Open Booking Confirmed modal before redirecting
          showToast("Appointment booked successfully! Settle payment upon arrival at the salon.", "success");
          setPaymentSuccessModal({
            isOpen: true,
            bookingId: bookingRes.id,
            bookingCode: bookingRes.bookingCode || bookingRes.id,
            amount: bookingRes.pricePaid ?? finalPayable,
            storeName: selectedStore?.name || "Groomish Now Salon",
            scheduledAt: scheduledAtStr,
            paymentMethod: "CASH",
          });
        }
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

      <main className="flex-1 pb-8">
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-groomish-slate/10 py-2.5">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-groomish-slate tracking-tight">
            Checkout & Appointment Scheduling
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Choose your salon appointment slot, redeem promotional offers or vouchers, and confirm booking
          </p>
        </div>

        {/* CHECKOUT FORM & SUMMARY */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <form onSubmit={handleSubmitCheckout} className="grid lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: SCHEDULING, REDEMPTION & PAYMENT */}
            <div className="lg:col-span-8 space-y-4">
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

              {/* 2. DATE & SLOT SELECTION */}
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-groomish-orange" />
                    <h2 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate">
                      {hasServices ? "2. Appointment Date & Stylist Slot" : "2. Preferred Pickup / Delivery Schedule"}
                    </h2>
                  </div>
                  {hasServices ? (
                    <span className="text-[11px] font-bold text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full">
                      Required for treatments
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full">
                      Retail Products
                    </span>
                  )}
                </div>

                {/* Date Picker - Groomish Themed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-groomish-slate">
                      {hasServices ? "Select Appointment Date" : "Select Preferred Pickup Date"}
                    </label>
                    <span className="text-[11px] text-groomish-slate/50 font-medium">
                      Today: {new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={(e, val) => {
                      const nextVal = val || e?.target?.value || "";
                      setSelectedDate(nextVal);
                      setSelectedTime("");
                    }}
                    minDate={todayStr}
                    placeholder="Select Date"
                    className="w-full"
                    triggerClassName="w-full bg-groomish-cream hover:bg-white border-groomish-slate/15 py-3 px-4 rounded-2xl text-xs font-bold transition"
                  />
                </div>

                {/* Slots Grid */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-groomish-slate flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span>{hasServices ? "Available Stylist Slots" : "Preferred Pickup Time Slot"}</span>
                      {selectedTime && (
                        <span className="text-[11px] font-bold text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-groomish-green/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Selected: {formatSlot12Hour(selectedTime)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {loadingSlots && (
                        <span className="text-[11px] text-groomish-orange font-semibold flex items-center gap-1.5 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          Checking live availability...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => fetchSlotAvailability(true)}
                        disabled={loadingSlots}
                        className="py-1 px-2.5 rounded-xl text-[11px] font-bold text-groomish-slate/70 hover:text-groomish-orange bg-groomish-cream hover:bg-white border border-groomish-slate/15 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        title="Refresh live stylist slot availability"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingSlots ? "animate-spin text-groomish-orange" : ""}`} />
                        <span>Refresh Slots</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
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
                              ? "Fully booked slot across stylists"
                              : `Book slot at ${formatSlot12Hour(time)}`
                          }
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? "bg-groomish-orange text-white shadow-glowOrange scale-102"
                              : isUnavailable
                              ? "bg-groomish-slate/5 text-groomish-slate/30 cursor-not-allowed line-through"
                              : "bg-groomish-cream text-groomish-slate hover:bg-groomish-creamDark"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="font-mono text-[11px] font-extrabold">{formatSlot12Hour(time)}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[9px] uppercase tracking-wider font-black text-white/90">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-groomish-orange shrink-0" />
                    <span>Real-time 5-stylist salon capacity check ensures personal attention. Slots refresh every 30s.</span>
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

              {/* 4. NOTES */}
              <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-2">
                <label className="text-xs font-bold text-groomish-slate">
                  4. Special Instructions / Styling Preferences (Optional)
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
                        {paymentMethod === "CASH" ? "Pay at salon counter" : "Online payment (Razorpay)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PAYMENT MODE - ONE ROW, NO DESCRIPTION */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-groomish-slate">
                    <span>Payment Mode</span>
                    {!isSlotSelected ? (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Select slot first
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-groomish-orange">
                        {paymentMethod === "CASH" ? "Pay at Salon" : "Razorpay Online"}
                      </span>
                    )}
                  </div>
                  <div className={`grid grid-cols-2 gap-2 transition-opacity ${!isSlotSelected ? "opacity-50" : ""}`}>
                    {/* Pay at Salon */}
                    <button
                      type="button"
                      disabled={!isSlotSelected}
                      onClick={() => setPaymentMethod("CASH")}
                      className={`p-2.5 rounded-xl border-2 transition flex items-center justify-between gap-1 text-left ${
                        !isSlotSelected
                          ? "cursor-not-allowed border-groomish-slate/15 bg-groomish-slate/5"
                          : paymentMethod === "CASH"
                          ? "border-groomish-orange bg-groomish-orangeLight/60 shadow-2xs cursor-pointer"
                          : "border-groomish-slate/15 bg-white hover:border-groomish-slate/30 cursor-pointer"
                      }`}
                      title={!isSlotSelected ? "Please select an appointment time slot first" : undefined}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Store
                          className={`w-4 h-4 shrink-0 ${
                            !isSlotSelected
                              ? "text-groomish-slate/40"
                              : paymentMethod === "CASH"
                              ? "text-groomish-orange"
                              : "text-groomish-slate/60"
                          }`}
                        />
                        <span
                          className={`text-xs truncate ${
                            !isSlotSelected
                              ? "font-medium text-groomish-slate/50"
                              : paymentMethod === "CASH"
                              ? "font-extrabold text-groomish-slate"
                              : "font-semibold text-groomish-slate/80"
                          }`}
                        >
                          Pay at Salon
                        </span>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          !isSlotSelected
                            ? "border-groomish-slate/20 bg-transparent"
                            : paymentMethod === "CASH"
                            ? "border-groomish-orange bg-groomish-orange"
                            : "border-groomish-slate/30"
                        }`}
                      >
                        {isSlotSelected && paymentMethod === "CASH" && (
                          <Check className="w-2 h-2 text-white stroke-[3]" />
                        )}
                      </div>
                    </button>

                    {/* Online Payment */}
                    <button
                      type="button"
                      disabled={!isSlotSelected}
                      onClick={() => setPaymentMethod("ONLINE")}
                      className={`p-2.5 rounded-xl border-2 transition flex items-center justify-between gap-1 text-left ${
                        !isSlotSelected
                          ? "cursor-not-allowed border-groomish-slate/15 bg-groomish-slate/5"
                          : paymentMethod === "ONLINE"
                          ? "border-groomish-orange bg-groomish-orangeLight/60 shadow-2xs cursor-pointer"
                          : "border-groomish-slate/15 bg-white hover:border-groomish-slate/30 cursor-pointer"
                      }`}
                      title={!isSlotSelected ? "Please select an appointment time slot first" : undefined}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CreditCard
                          className={`w-4 h-4 shrink-0 ${
                            !isSlotSelected
                              ? "text-groomish-slate/40"
                              : paymentMethod === "ONLINE"
                              ? "text-emerald-600"
                              : "text-groomish-slate/60"
                          }`}
                        />
                        <span
                          className={`text-xs truncate ${
                            !isSlotSelected
                              ? "font-medium text-groomish-slate/50"
                              : paymentMethod === "ONLINE"
                              ? "font-extrabold text-groomish-slate"
                              : "font-semibold text-groomish-slate/80"
                          }`}
                        >
                          Online Payment
                        </span>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          !isSlotSelected
                            ? "border-groomish-slate/20 bg-transparent"
                            : paymentMethod === "ONLINE"
                            ? "border-groomish-orange bg-groomish-orange"
                            : "border-groomish-slate/30"
                        }`}
                      >
                        {isSlotSelected && paymentMethod === "ONLINE" && (
                          <Check className="w-2 h-2 text-white stroke-[3]" />
                        )}
                      </div>
                    </button>
                  </div>
                  {!isSlotSelected && (
                    <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      Select an appointment time slot above to enable payment options
                    </p>
                  )}
                </div>

                {/* Confirm Button */}
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    checkingBranch ||
                    Object.keys(unavailableItemsMap).length > 0 ||
                    !isSlotSelected
                  }
                  className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {paymentMethod === "ONLINE" ? "Opening Payment Gateway..." : "Confirming Appointment..."}
                    </span>
                  ) : checkingBranch ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking Branch Availability...
                    </span>
                  ) : Object.keys(unavailableItemsMap).length > 0 ? (
                    <span>Resolve Unavailable Items</span>
                  ) : !isSlotSelected ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Select Appointment Slot to Proceed
                    </span>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === "ONLINE"
                          ? `Pay Online & Confirm (₹${finalPayable})`
                          : `Confirm Appointment (Pay at Salon)`}
                      </span>
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

        {/* PAYMENT FAILURE / PENDING MODAL */}
        {paymentFailureModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-groomish-slate/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 space-y-4 animate-scaleUp text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span>Payment Pending</span>
                  {paymentFailureModal.bookingCode && (
                    <span className="font-mono text-groomish-orange">• #{paymentFailureModal.bookingCode}</span>
                  )}
                </div>
                <h3 className="text-xl font-heading font-extrabold text-groomish-slate">
                  Booking Reserved (Payment Pending)
                </h3>
                <p className="text-xs text-groomish-slate/70">
                  Your appointment slot is held, but online payment was not completed.
                </p>
              </div>

              {/* Booking Summary */}
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-3.5 text-left space-y-1.5 text-xs text-groomish-slate">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-groomish-slate/60">Payable Amount</span>
                  <span className="font-bold text-groomish-slate">₹{paymentFailureModal.amount}</span>
                </div>
                {paymentFailureModal.storeName && (
                  <div className="flex items-center justify-between">
                    <span className="text-groomish-slate/60">Branch</span>
                    <span className="font-semibold truncate max-w-[200px]">{paymentFailureModal.storeName}</span>
                  </div>
                )}
                {paymentFailureModal.reason && (
                  <div className="pt-1 border-t border-amber-200/50 text-[11px] text-amber-900 leading-snug">
                    <span className="font-semibold">Note: </span>
                    {paymentFailureModal.reason}
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Option 1: Try Again (Max 2 times) */}
                {paymentFailureModal.retryCount < 2 && (
                  <button
                    type="button"
                    onClick={handleRetryOnlinePayment}
                    disabled={submitting}
                    className="btn-auth w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-glowOrange"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-reverse" />
                    <span>Try Online Payment Again ({2 - paymentFailureModal.retryCount} left)</span>
                  </button>
                )}

                {/* Option 2: Pay at Salon */}
                <button
                  type="button"
                  onClick={handleSwitchToSalon}
                  disabled={switchingToSalon}
                  className="w-full py-3.5 px-4 rounded-xl border-2 border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {switchingToSalon ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Switching to Pay at Salon...</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4 text-emerald-700" />
                      <span>Switch to Pay at Salon (Cash / UPI)</span>
                    </>
                  )}
                </button>

                {/* Option 3: Review later with auto-redirect */}
                {paymentFailureModal.bookingId && (
                  <div className="pt-2 border-t border-groomish-slate/10 space-y-1.5">
                    <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${(pendingCountdown / 8) * 100}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const id = paymentFailureModal.bookingId;
                        setPaymentFailureModal({ isOpen: false, reason: "", bookingId: null, bookingCode: "", amount: 0, storeName: "", scheduledAt: "", retryCount: 0 });
                        navigate(`/customer/bookings/${id}`, { replace: true });
                      }}
                      className="w-full py-1 text-xs text-groomish-slate/60 hover:text-groomish-slate font-semibold flex items-center justify-center gap-1.5 transition underline cursor-pointer"
                    >
                      <span>View Booking Details ({pendingCountdown}s)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT SUCCESS / CONFIRMATION MODAL */}
        {paymentSuccessModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-groomish-slate/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 text-center space-y-5 animate-scaleUp">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-600">
                  {paymentSuccessModal.paymentMethod === "ONLINE" ? "Transaction Complete" : "Booking Confirmed"}
                </span>
                <h3 className="text-2xl font-heading font-black text-groomish-slate">
                  {paymentSuccessModal.paymentMethod === "ONLINE" ? "Booking & Payment Confirmed!" : "Booking Confirmed!"}
                </h3>
                <p className="text-xs text-groomish-slate/70">
                  {paymentSuccessModal.paymentMethod === "ONLINE"
                    ? "Your appointment is confirmed and payment has been verified."
                    : "Your appointment is confirmed! Settle payment upon arrival at the salon."}
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-groomish-slate/5 border border-groomish-slate/10 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-groomish-slate/10">
                  <span className="text-groomish-slate/60">Booking Code</span>
                  <span className="font-mono font-bold text-groomish-orange text-sm">
                    {paymentSuccessModal.bookingCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-groomish-slate/60">
                    {paymentSuccessModal.paymentMethod === "ONLINE" ? "Amount Paid" : "Amount to Pay at Salon"}
                  </span>
                  <span className="font-bold text-groomish-slate text-sm">
                    ₹{paymentSuccessModal.amount}
                  </span>
                </div>
                {paymentSuccessModal.storeName && (
                  <div className="flex items-center justify-between">
                    <span className="text-groomish-slate/60">Branch</span>
                    <span className="font-semibold text-groomish-slate truncate max-w-[180px]">
                      {paymentSuccessModal.storeName}
                    </span>
                  </div>
                )}
                {paymentSuccessModal.scheduledAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-groomish-slate/60">Slot Time</span>
                    <span className="font-semibold text-groomish-slate">
                      {paymentSuccessModal.scheduledAt.replace("T", " ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-groomish-slate/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Confirmation sent to {user?.email || "your registered email"}</span>
              </div>

              {/* Progress bar countdown */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(successCountdown / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Redirecting to booking details in {successCountdown}s...
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const id = paymentSuccessModal.bookingId;
                  setPaymentSuccessModal({ isOpen: false, bookingId: null, bookingCode: "", amount: 0, storeName: "", scheduledAt: "", paymentMethod: "ONLINE" });
                  if (id) navigate(`/customer/bookings/${id}`, { replace: true });
                }}
                className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-glowOrange"
              >
                <span>View Booking Details Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
