import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useBranch } from '../../context/BranchContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { customerApi } from '../../api/client';
import { Colors, Shadows } from '../../theme/colors';
import TopHeader from '../../components/TopHeader';
import RazorpayCheckoutModal, {
  RazorpayOrderData,
  RazorpaySuccessResult,
} from '../../components/RazorpayCheckoutModal';
import { format12HourDateTime } from '../../utils/dateHelper';

type CheckoutStep = 'CART' | 'SLOT' | 'PAYMENT';

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CartScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  const { selectedBranch, openBranchModal } = useBranch();
  const { isAuthenticated, user, isStaffOrAdmin } = useAuth();

  // Navigation step: CART -> SLOT -> PAYMENT
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('CART');

  // Slot Selection states
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateStr());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // Discount & Offers
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH'>('ONLINE');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [switchingToSalon, setSwitchingToSalon] = useState(false);

  // Razorpay Gateway
  const [isRazorpayVisible, setIsRazorpayVisible] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<RazorpayOrderData | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [currentBookingCode, setCurrentBookingCode] = useState<string | null>(null);

  // Modals
  const [successModalData, setSuccessModalData] = useState<{
    bookingId: string;
    bookingCode: string;
    amount: number;
    storeName: string;
    scheduledAt: string;
    paymentMethod: 'ONLINE' | 'CASH';
  } | null>(null);

  const [failureModalData, setFailureModalData] = useState<{
    bookingId: string;
    bookingCode: string;
    amount: number;
    storeName: string;
    scheduledAt: string;
    reason: string;
  } | null>(null);

  // Service count & primary service
  const serviceItems = useMemo(() => items.filter((i) => i.itemType === 'SERVICE'), [items]);
  const productItems = useMemo(() => items.filter((i) => i.itemType === 'PRODUCT'), [items]);
  const hasServices = serviceItems.length > 0;

  const primaryServiceId = useMemo(() => {
    return serviceItems[0]?.serviceId || serviceItems[0]?.id || undefined;
  }, [serviceItems]);

  // Generate 7-day date options
  const dateOptions = useMemo(() => {
    const list = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateStr(d);
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : daysOfWeek[d.getDay()];
      const dateFormatted = `${d.getDate()} ${months[d.getMonth()]}`;
      list.push({ dateStr, dayLabel, dateFormatted, isToday: i === 0 });
    }
    return list;
  }, []);

  // Time slots from 09:30 to 20:30 (identical to web app)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    let startMinutes = 9 * 60 + 30; // 09:30 AM
    const endMinutes = 20 * 60 + 30; // 08:30 PM
    while (startMinutes <= endMinutes) {
      const h = Math.floor(startMinutes / 60);
      const m = startMinutes % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      startMinutes += 30;
    }
    return slots;
  }, []);

  // Format 12-hour: "13:30" -> "01:30 PM"
  const formatSlot12Hour = (timeStr: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  // Check if slot has already passed for today
  const isSlotPast = useCallback((timeStr: string) => {
    const todayStr = getLocalDateStr(new Date());
    if (selectedDate !== todayStr) return false;
    const [h, m] = timeStr.split(':').map(Number);
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate <= new Date();
  }, [selectedDate]);

  // Load slot availability from backend
  const fetchSlotAvailability = useCallback(async () => {
    if (!selectedDate || !primaryServiceId) {
      setUnavailableSlots([]);
      setLoadingSlots(false);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await customerApi.getSlotAvailability(selectedDate, primaryServiceId);
      setUnavailableSlots(res.data?.unavailableSlots || []);
    } catch (err) {
      console.warn('Error fetching slot availability:', err);
      setUnavailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, primaryServiceId]);

  useEffect(() => {
    if (currentStep === 'SLOT') {
      fetchSlotAvailability();
    }
  }, [currentStep, fetchSlotAvailability]);

  // Auto-deselect if slot becomes past
  useEffect(() => {
    if (selectedTime && isSlotPast(selectedTime)) {
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime, isSlotPast]);

  // Pricing calculations
  const totalMrp = useMemo(() => {
    return (items || []).reduce((sum, item) => {
      const unit = Number(item.price || item.unitPrice || 0);
      const rawMrp = Number(item.subServiceMrp || item.mrp || item.serviceMrp || item.productMrp || 0);
      const mrp = Math.max(rawMrp, unit);
      return sum + (mrp * (item.quantity || 1));
    }, 0);
  }, [items]);

  const mrpDiscount = Math.max(0, totalMrp - totalAmount);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountAmount) return appliedCoupon.discountAmount;
    if (appliedCoupon.discountPercent) {
      return Math.round((totalAmount * appliedCoupon.discountPercent) / 100);
    }
    return Math.min(appliedCoupon.discount || 0, totalAmount);
  }, [appliedCoupon, totalAmount]);

  const finalPayable = Math.max(0, totalAmount - discountAmount);

  const isVoucher = useMemo(() => {
    if (!appliedCoupon?.code) return false;
    const c = appliedCoupon.code.toUpperCase();
    return c.includes('VOUCH') || c.includes('VIP');
  }, [appliedCoupon]);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await customerApi.applyCoupon(couponCode.trim(), totalAmount);
      if (res.data?.valid || res.data?.active) {
        const coupon = res.data;
        const eligibleCats: string[] = coupon.eligibleCategories || [];
        const hasSpecificCategories = eligibleCats.length > 0 && !eligibleCats.some(ec => ec.trim().toUpperCase() === 'ALL');

        if (hasSpecificCategories) {
          const eligibleItems = items.filter(it => {
            const cat = (it as any).category || (it as any).serviceCategoryName || '';
            return eligibleCats.some(ec => {
              const clean = ec.trim().toLowerCase();
              return clean === cat.toLowerCase() ||
                     (cat && (cat.toLowerCase().includes(clean) || clean.includes(cat.toLowerCase())));
            });
          });

          if (eligibleItems.length === 0) {
            Alert.alert('Ineligible Categories', `Coupon '${coupon.code}' is only valid for categories: ${eligibleCats.join(', ')}`);
            return;
          }

          const eligibleTotal = eligibleItems.reduce((sum, it) => sum + (Number(it.price || 0) * (it.quantity || 1)), 0);
          if (coupon.minAmount && eligibleTotal < coupon.minAmount) {
            Alert.alert('Minimum Order Required', `Combined total for eligible categories (${eligibleCats.join(', ')}) is ₹${eligibleTotal}, which does not meet coupon minimum of ₹${coupon.minAmount}`);
            return;
          }
        } else if (coupon.minAmount && totalAmount < coupon.minAmount) {
          Alert.alert('Minimum Order Required', `Order total ₹${totalAmount} does not meet coupon minimum of ₹${coupon.minAmount}`);
          return;
        }

        setAppliedCoupon(res.data);
        Alert.alert('Coupon Applied', `Code ${couponCode.toUpperCase()} applied successfully!`);
      } else {
        Alert.alert('Invalid Coupon', res.data?.message || 'Code is not valid for this order.');
      }
    } catch {
      const code = couponCode.trim().toUpperCase();
      if (code === 'GROOM100' || code === 'GLOW50' || code === 'ROYAL250') {
        const disc = code === 'GROOM100' ? 100 : code === 'GLOW50' ? 50 : 250;
        setAppliedCoupon({ code, discountAmount: disc, valid: true });
        Alert.alert('Special Offer Applied', `You saved ₹${disc} with code ${code}!`);
      } else {
        Alert.alert('Invalid Code', 'Please enter a valid promotion code (try GROOM100 or GLOW50)');
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Step 1 -> Step 2 validation
  const handleProceedToSlot = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to proceed with your booking reservation.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login' as any) },
      ]);
      return;
    }

    if (isStaffOrAdmin && hasServices) {
      Alert.alert(
        'Service Booking Restricted',
        'Staff and Admin accounts cannot book salon services on the mobile app. Please remove services from your bag. Bookings and salon schedules are managed via the Web Portal.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert('Bag is Empty', 'Please add services or products to proceed.');
      return;
    }

    if (!selectedBranch) {
      Alert.alert('Select Branch', 'Please select your preferred salon branch.');
      openBranchModal();
      return;
    }

    setCurrentStep('SLOT');
  };

  // Step 2 -> Step 3 validation
  const handleProceedToPayment = () => {
    if (isStaffOrAdmin && hasServices) {
      Alert.alert(
        'Service Booking Restricted',
        'Staff and Admin accounts cannot book salon services on the mobile app.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (hasServices && !selectedTime) {
      Alert.alert('Select Slot', 'Please pick a preferred booking time slot to proceed.');
      return;
    }
    setCurrentStep('PAYMENT');
  };

  // Step 3: Trigger Checkout
  const handleInitiatePayment = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login' as any);
      return;
    }

    if (isStaffOrAdmin && hasServices) {
      Alert.alert(
        'Service Booking Restricted',
        'Staff and Admin accounts cannot book salon services on the mobile app. Bookings and salon schedules are managed via the Web Portal.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (hasServices && !selectedTime) {
      Alert.alert('Booking Slot Required', 'Please choose a booking slot before payment.');
      setCurrentStep('SLOT');
      return;
    }

    setBookingLoading(true);

    try {
      const scheduledIso = `${selectedDate}T${selectedTime || '11:00'}:00`;

      // Sync backend cart first for consistency
      try {
        await customerApi.clearCart();
        for (const item of items) {
          await customerApi.addToCart({
            itemType: item.itemType,
            serviceId: item.serviceId || (item.itemType === 'SERVICE' ? item.id : undefined),
            productId: item.productId || (item.itemType === 'PRODUCT' ? item.id : undefined),
            quantity: item.quantity,
            subServiceName: item.subServiceName,
            subServicePrice: item.subServicePrice,
          });
        }
        if (selectedBranch?.id) {
          await customerApi.setCartStore(selectedBranch.id);
        }
      } catch (syncErr) {
        console.warn('Cart sync note:', syncErr);
      }

      // Checkout payload
      const checkoutPayload = {
        scheduledAt: scheduledIso,
        storeId: selectedBranch?.id,
        couponCode: appliedCoupon?.code || null,
        paymentMethod,
        note: appointmentNotes.trim() || 'Booked via Groomish Luxury Mobile App',
      };

      let bookingRes: any;
      try {
        bookingRes = await customerApi.checkoutCart(checkoutPayload);
      } catch {
        // Fallback to direct createBooking
        const fallbackPayload = {
          ...checkoutPayload,
          serviceIds: serviceItems.map((s) => s.serviceId || s.id),
        };
        bookingRes = await customerApi.createBooking(fallbackPayload);
      }

      const bookingData = bookingRes?.data;
      const bId = bookingData?.id;
      const bCode = bookingData?.bookingCode || String(bId);

      setCurrentBookingId(bId);
      setCurrentBookingCode(bCode);

      if (paymentMethod === 'ONLINE') {
        // Create Razorpay Order
        const orderRes = await customerApi.createRazorpayOrder({ bookingId: bId });
        const orderData = orderRes.data;

        setRazorpayOrderData({
          keyId: orderData.keyId,
          orderId: orderData.orderId,
          amount: orderData.amount, // in paise
          currency: orderData.currency || 'INR',
          bookingId: bId,
          bookingCode: bCode,
          customerName: orderData.customerName || user?.name || '',
          customerEmail: orderData.customerEmail || user?.email || '',
          customerPhone: orderData.customerPhone || user?.phone || '',
        });

        // Launch Razorpay Modal
        setIsRazorpayVisible(true);
      } else {
        // Pay at Salon Counter
        await clearCart();
        setSuccessModalData({
          bookingId: bId,
          bookingCode: bCode,
          amount: finalPayable,
          storeName: selectedBranch?.name || 'Groomish Salon',
          scheduledAt: scheduledIso,
          paymentMethod: 'CASH',
        });
      }
    } catch (err: any) {
      console.error('Booking checkout error:', err);
      Alert.alert(
        'Checkout Error',
        err.response?.data?.message || 'Unable to place booking request. Please try again.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // Razorpay Success Handler
  const handleRazorpaySuccess = async (result: RazorpaySuccessResult) => {
    setIsRazorpayVisible(false);
    setBookingLoading(true);
    try {
      if (!currentBookingId) throw new Error('Missing booking ID');

      await customerApi.verifyRazorpayPayment({
        bookingId: currentBookingId,
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });

      // ONLY THEN CLEAR CART AFTER SUCCESSFUL VERIFICATION!
      await clearCart();

      setSuccessModalData({
        bookingId: currentBookingId,
        bookingCode: currentBookingCode || currentBookingId,
        amount: finalPayable,
        storeName: selectedBranch?.name || 'Groomish Salon',
        scheduledAt: `${selectedDate}T${selectedTime || '11:00'}:00`,
        paymentMethod: 'ONLINE',
      });
    } catch (verifyErr: any) {
      console.error('Payment verification failed:', verifyErr);
      setFailureModalData({
        bookingId: currentBookingId || '',
        bookingCode: currentBookingCode || '',
        amount: finalPayable,
        storeName: selectedBranch?.name || 'Groomish Salon',
        scheduledAt: `${selectedDate}T${selectedTime || '11:00'}:00`,
        reason:
          verifyErr.response?.data?.message ||
          'Payment verification failed. You may retry or switch to Pay at Salon Counter.',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Razorpay Dismiss / Failure Handler
  const handleRazorpayFailure = (errData: any) => {
    setIsRazorpayVisible(false);
    if (!currentBookingId) return;

    setFailureModalData({
      bookingId: currentBookingId,
      bookingCode: currentBookingCode || '',
      amount: finalPayable,
      storeName: selectedBranch?.name || 'Groomish Salon',
      scheduledAt: `${selectedDate}T${selectedTime || '11:00'}:00`,
      reason:
        errData?.description ||
        'Payment window was closed or interrupted before completing transaction.',
    });
  };

  // Retry Online Razorpay
  const handleRetryOnline = async () => {
    if (!failureModalData?.bookingId) return;
    const bId = failureModalData.bookingId;
    setFailureModalData(null);
    setBookingLoading(true);
    try {
      const orderRes = await customerApi.createRazorpayOrder({ bookingId: bId });
      const orderData = orderRes.data;
      setRazorpayOrderData({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        bookingId: bId,
        bookingCode: failureModalData.bookingCode,
        customerName: orderData.customerName || user?.name || '',
        customerEmail: orderData.customerEmail || user?.email || '',
        customerPhone: orderData.customerPhone || user?.phone || '',
      });
      setIsRazorpayVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to re-initialize Razorpay');
    } finally {
      setBookingLoading(false);
    }
  };

  // Switch to Salon Counter
  const handleSwitchToSalon = async () => {
    if (!failureModalData?.bookingId) return;
    setSwitchingToSalon(true);
    try {
      await customerApi.switchToPayAtSalon(failureModalData.bookingId);
      await clearCart();
      const saved = { ...failureModalData };
      setFailureModalData(null);
      setSuccessModalData({
        bookingId: saved.bookingId,
        bookingCode: saved.bookingCode,
        amount: saved.amount,
        storeName: saved.storeName,
        scheduledAt: saved.scheduledAt,
        paymentMethod: 'CASH',
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to switch payment mode');
    } finally {
      setSwitchingToSalon(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Universal Top Header */}
      <TopHeader showBranchSelector={true} />

      {/* Checkout Stepper Progress */}
      <View style={[styles.stepperContainer, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.stepTab, currentStep === 'CART' && styles.stepTabActive]}
          onPress={() => setCurrentStep('CART')}
          activeOpacity={0.7}
        >
          <View style={[styles.stepNumCircle, currentStep === 'CART' ? styles.stepNumActive : styles.stepNumDone]}>
            {currentStep !== 'CART' ? (
              <Ionicons name="checkmark" size={12} color={Colors.white} />
            ) : (
              <Text style={styles.stepNumText}>1</Text>
            )}
          </View>
          <Text style={[styles.stepTabText, currentStep === 'CART' && styles.stepTabTextActive]}>
            Bag Items
          </Text>
        </TouchableOpacity>

        <Ionicons name="chevron-forward" size={14} color="#64748b" />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 'SLOT' && styles.stepTabActive]}
          onPress={() => {
            if (items.length > 0) setCurrentStep('SLOT');
          }}
          disabled={items.length === 0}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.stepNumCircle,
              currentStep === 'SLOT'
                ? styles.stepNumActive
                : currentStep === 'PAYMENT'
                ? styles.stepNumDone
                : styles.stepNumPending,
            ]}
          >
            {currentStep === 'PAYMENT' ? (
              <Ionicons name="checkmark" size={12} color={Colors.white} />
            ) : (
              <Text style={styles.stepNumText}>2</Text>
            )}
          </View>
          <Text style={[styles.stepTabText, currentStep === 'SLOT' && styles.stepTabTextActive]}>
            Booking Slot
          </Text>
        </TouchableOpacity>

        <Ionicons name="chevron-forward" size={14} color="#64748b" />

        <TouchableOpacity
          style={[styles.stepTab, currentStep === 'PAYMENT' && styles.stepTabActive]}
          disabled={items.length === 0 || (hasServices && !selectedTime)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.stepNumCircle,
              currentStep === 'PAYMENT' ? styles.stepNumActive : styles.stepNumPending,
            ]}
          >
            <Text style={styles.stepNumText}>3</Text>
          </View>
          <Text style={[styles.stepTabText, currentStep === 'PAYMENT' && styles.stepTabTextActive]}>
            Payment
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Salon Branch Bar */}
        <TouchableOpacity
          style={[styles.branchCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={openBranchModal}
          activeOpacity={0.8}
        >
          <View style={styles.branchIconWrap}>
            <Ionicons name="location" size={18} color={Colors.orange} />
          </View>
          <View style={styles.branchTextWrap}>
            <Text style={[styles.branchLabel, { color: colors.textMuted }]}>Selected Salon Branch</Text>
            <Text style={[styles.branchName, { color: colors.text }]} numberOfLines={1}>
              {selectedBranch ? `${selectedBranch.name} (${selectedBranch.city || 'Flagship'})` : 'Select Salon Branch'}
            </Text>
          </View>
          <Text style={styles.branchChangeLink}>Change</Text>
        </TouchableOpacity>

        {/* Staff / Admin Notice */}
        {isStaffOrAdmin && (
          <View style={[styles.staffAlertCard, { backgroundColor: '#fff7ed', borderColor: Colors.orange }]}>
            <Ionicons name="information-circle" size={18} color={Colors.orange} />
            <Text style={styles.staffAlertText}>
              Staff / Admin Account: Service booking is disabled on the mobile app. You can browse retail products.
            </Text>
          </View>
        )}

        {/* ----------------- STEP 1: CART BAG ----------------- */}
        {currentStep === 'CART' && (
          <>
            {items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Ionicons name="bag-outline" size={48} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Bag is Empty</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Discover bespoke haircuts, beard styling, soothing spa treatments, and luxury hair care retail products.
                </Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => router.push('/(tabs)/services' as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cut-outline" size={18} color={Colors.white} />
                  <Text style={styles.browseButtonText}>Explore Treatments</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.itemsSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                      Bag Review ({items.length} {items.length === 1 ? 'Item' : 'Items'})
                    </Text>
                    <TouchableOpacity onPress={clearCart}>
                      <Text style={styles.clearCartText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>

                  {items.map((item) => {
                    const isService = item.itemType === 'SERVICE';
                    return (
                      <View
                        key={`${item.itemType}-${item.id}`}
                        style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                      >
                        <Image
                          source={{
                            uri:
                              item.image ||
                              (isService
                                ? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80'
                                : 'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=200&q=80'),
                          }}
                          style={[styles.itemImage, { backgroundColor: colors.bg }]}
                        />

                        <View style={styles.itemDetails}>
                          <View style={styles.itemHeader}>
                            <View
                              style={[
                                styles.typeBadge,
                                isService ? styles.serviceBadge : styles.productBadge,
                              ]}
                            >
                              <Text style={styles.typeBadgeText}>
                                {isService ? 'SERVICE' : 'PRODUCT'}
                              </Text>
                            </View>
                            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                              <Ionicons name="trash-outline" size={16} color={Colors.red} />
                            </TouchableOpacity>
                          </View>

                          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                            {item.subServiceName && !item.name.includes(`(${item.subServiceName})`)
                              ? `${item.name} (${item.subServiceName})`
                              : item.name}
                          </Text>

                          {item.subServiceName ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4 }}>
                              <View style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.2)' }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.orange }}>
                                  Option: {item.subServiceName}
                                </Text>
                              </View>
                            </View>
                          ) : null}

                          <View style={styles.itemBottomRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.itemPrice, { color: colors.text }]}>₹{item.price}</Text>
                              {(() => {
                                const effectiveMrp = Number(item.subServiceMrp || item.mrp || item.serviceMrp || item.productMrp || 0);
                                return effectiveMrp > item.price ? (
                                  <Text style={[styles.itemMrp, { color: colors.textMuted }]}>₹{effectiveMrp}</Text>
                                ) : null;
                              })()}
                            </View>

                            <View style={[styles.stepperWrap, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                              <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: colors.card }]}
                                onPress={() => updateQuantity(item.id, -1)}
                              >
                                <Ionicons name="remove" size={14} color={colors.text} />
                              </TouchableOpacity>
                              <Text style={[styles.stepperCount, { color: colors.text }]}>{item.quantity}</Text>
                              <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: colors.card }]}
                                onPress={() => updateQuantity(item.id, 1)}
                              >
                                <Ionicons name="add" size={14} color={colors.text} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Subtotal Mini Card */}
                <View style={[styles.miniSummaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.miniSummaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal ({items.length} items)</Text>
                    <Text style={[styles.summaryVal, { color: colors.text }]}>₹{totalMrp > totalAmount ? totalMrp : totalAmount}</Text>
                  </View>
                  {mrpDiscount > 0 && (
                    <View style={[styles.miniSummaryRow, { marginTop: 6 }]}>
                      <Text style={[styles.summaryLabel, { color: Colors.greenDark }]}>Discount on MRP</Text>
                      <Text style={[styles.summaryVal, { color: Colors.greenDark, fontWeight: '700' }]}>-₹{mrpDiscount}</Text>
                    </View>
                  )}
                  <View style={[styles.miniSummaryRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.cardBorder }]}>
                    <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '800' }]}>Cart Total</Text>
                    <Text style={[styles.summaryVal, { color: Colors.orange, fontWeight: '900' }]}>₹{totalAmount}</Text>
                  </View>
                  <Text style={styles.taxNote}>• Taxes and salon charges are complimentary on all online reservations</Text>
                </View>

                {/* Button to Choose Booking Slot */}
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleProceedToSlot}
                  activeOpacity={0.85}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.white} />
                  <Text style={styles.primaryActionText}>Choose Booking Slot</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ----------------- STEP 2: CHOOSE BOOKING SLOT ----------------- */}
        {currentStep === 'SLOT' && (
          <>
            <TouchableOpacity style={styles.stepBackLink} onPress={() => setCurrentStep('CART')}>
              <Ionicons name="arrow-back" size={16} color={Colors.orange} />
              <Text style={styles.stepBackText}>Back to Bag Items</Text>
            </TouchableOpacity>

            {/* Date Selector */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar" size={18} color={Colors.orange} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Select Date</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
                {dateOptions.map((opt) => {
                  const isSelected = selectedDate === opt.dateStr;
                  return (
                    <TouchableOpacity
                      key={opt.dateStr}
                      style={[
                        styles.datePill,
                        { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                        isSelected && styles.datePillActive,
                      ]}
                      onPress={() => setSelectedDate(opt.dateStr)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateDayLabel, isSelected && styles.dateTextActive]}>
                        {opt.dayLabel}
                      </Text>
                      <Text style={[styles.dateFormatted, isSelected && styles.dateTextActive]}>
                        {opt.dateFormatted}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Time Slot Grid */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.slotHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="time" size={18} color={Colors.orange} />
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                    Select Booking Time
                  </Text>
                </View>
                {loadingSlots && <ActivityIndicator size="small" color={Colors.orange} />}
              </View>

              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Operating Hours: 09:30 AM to 08:30 PM • 30-min stylist intervals
              </Text>

              {/* Slot Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.orange }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Selected</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#334155' }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#ef4444' }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Full / Past</Text>
                </View>
              </View>

              {/* Slots Grid */}
              <View style={styles.slotGrid}>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  const isPast = isSlotPast(slot);
                  const isFull = unavailableSlots.includes(slot);
                  const isDisabled = isPast || isFull;

                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotCard,
                        { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                        isSelected && styles.slotCardActive,
                        isDisabled && styles.slotCardDisabled,
                      ]}
                      onPress={() => {
                        if (!isDisabled) setSelectedTime(slot);
                      }}
                      disabled={isDisabled}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.slotTimeText,
                          { color: colors.text },
                          isSelected && styles.slotTimeTextActive,
                          isDisabled && styles.slotTimeTextDisabled,
                        ]}
                      >
                        {formatSlot12Hour(slot)}
                      </Text>
                      {isPast ? (
                        <Text style={styles.slotBadgeDisabled}>Past</Text>
                      ) : isFull ? (
                        <Text style={styles.slotBadgeDisabled}>Full</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Special Instructions / Notes */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Styling Preferences & Notes</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
                ]}
                placeholder="e.g. Preferred hair length, skin sensitivity, specific stylist preference..."
                placeholderTextColor={colors.textMuted}
                value={appointmentNotes}
                onChangeText={setAppointmentNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Proceed to Payment CTA */}
            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                hasServices && !selectedTime && { opacity: 0.5 },
              ]}
              onPress={handleProceedToPayment}
              disabled={hasServices && !selectedTime}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>
                {hasServices && !selectedTime
                  ? 'Pick a Time Slot to Continue'
                  : `Proceed to Payment (₹${finalPayable})`}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </>
        )}

        {/* ----------------- STEP 3: PAYMENT SECTION ----------------- */}
        {currentStep === 'PAYMENT' && (
          <>
            <TouchableOpacity style={styles.stepBackLink} onPress={() => setCurrentStep('SLOT')}>
              <Ionicons name="arrow-back" size={16} color={Colors.orange} />
              <Text style={styles.stepBackText}>Change Booking Slot</Text>
            </TouchableOpacity>

            {/* Appointment Recap Card */}
            <View style={[styles.recapCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.recapRow}>
                <Ionicons name="calendar-sharp" size={18} color={Colors.orange} />
                <View style={styles.recapTextWrap}>
                  <Text style={[styles.recapLabel, { color: colors.textMuted }]}>Scheduled Slot</Text>
                  <Text style={[styles.recapValue, { color: colors.text }]}>
                    {selectedDate} at {formatSlot12Hour(selectedTime)}
                  </Text>
                </View>
              </View>
              <View style={[styles.recapDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.recapRow}>
                <Ionicons name="storefront-sharp" size={18} color={Colors.orange} />
                <View style={styles.recapTextWrap}>
                  <Text style={[styles.recapLabel, { color: colors.textMuted }]}>Salon Branch</Text>
                  <Text style={[styles.recapValue, { color: colors.text }]}>
                    {selectedBranch?.name || 'Groomish Salon Flagship'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Promo Code Section */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Apply Promo Voucher</Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={[
                    styles.couponInput,
                    { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
                  ]}
                  placeholder="e.g. GROOM100, GLOW50"
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.couponApplyBtn}
                  onPress={handleApplyCoupon}
                  disabled={applyingCoupon}
                >
                  {applyingCoupon ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.couponApplyText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {appliedCoupon && (
                <View style={styles.appliedPill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                  <Text style={styles.appliedText}>
                    Code {appliedCoupon.code} applied (-₹{discountAmount})
                  </Text>
                  <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Payment Method Selection */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Payment Mode</Text>

              {/* Online Razorpay */}
              <TouchableOpacity
                style={[
                  styles.paymentModeCard,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
                  paymentMethod === 'ONLINE' && styles.paymentModeCardActive,
                ]}
                onPress={() => setPaymentMethod('ONLINE')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentRadioCircle}>
                  {paymentMethod === 'ONLINE' && <View style={styles.paymentRadioInner} />}
                </View>
                <View style={styles.paymentModeInfo}>
                  <View style={styles.paymentBadgeRow}>
                    <Text style={[styles.paymentModeTitle, { color: colors.text }]}>
                      Pay Online with Razorpay
                    </Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                    </View>
                  </View>
                  <Text style={[styles.paymentModeSub, { color: colors.textMuted }]}>
                    Instant confirmation via UPI (GPay, PhonePe, Paytm), Cards & NetBanking
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pay at Salon */}
              <TouchableOpacity
                style={[
                  styles.paymentModeCard,
                  { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, marginTop: 10 },
                  paymentMethod === 'CASH' && styles.paymentModeCardActive,
                ]}
                onPress={() => setPaymentMethod('CASH')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentRadioCircle}>
                  {paymentMethod === 'CASH' && <View style={styles.paymentRadioInner} />}
                </View>
                <View style={styles.paymentModeInfo}>
                  <Text style={[styles.paymentModeTitle, { color: colors.text }]}>
                    Pay at Salon Counter
                  </Text>
                  <Text style={[styles.paymentModeSub, { color: colors.textMuted }]}>
                    Pay directly at reception desk upon your salon arrival (Cash / Card)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Final Bill Summary */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Breakdown</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>₹{totalMrp > totalAmount ? totalMrp : totalAmount}</Text>
              </View>
              {mrpDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: Colors.greenDark }]}>Discount on MRP</Text>
                  <Text style={[styles.summaryVal, { color: Colors.greenDark, fontWeight: '700' }]}>-₹{mrpDiscount}</Text>
                </View>
              )}
              {appliedCoupon && !isVoucher && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: Colors.greenDark }]}>Coupon ({appliedCoupon.code})</Text>
                  <Text style={[styles.summaryVal, { color: Colors.greenDark, fontWeight: '700' }]}>-₹{discountAmount}</Text>
                </View>
              )}
              {appliedCoupon && isVoucher && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: Colors.greenDark }]}>Voucher ({appliedCoupon.code})</Text>
                  <Text style={[styles.summaryVal, { color: Colors.greenDark, fontWeight: '700' }]}>-₹{discountAmount}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Salon Hygiene & Safety Fee</Text>
                <Text style={[styles.summaryVal, { color: Colors.greenDark, fontWeight: '700' }]}>FREE</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Final Payable</Text>
                <Text style={styles.totalVal}>₹{finalPayable}</Text>
              </View>
              {(mrpDiscount > 0 || discountAmount > 0) && (
                <View style={{ marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#ecfdf5', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#a7f3d0' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.greenDark }}>
                    🎉 Total Savings
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.greenDark }}>
                    ₹{mrpDiscount + discountAmount} OFF
                  </Text>
                </View>
              )}
              <View style={styles.groomCoinsBanner}>
                <Ionicons name="sparkles" size={14} color="#eab308" />
                <Text style={styles.groomCoinsText}>
                  Earn ~{Math.round(finalPayable * 0.05)} Groom Loyalty Coins on this booking!
                </Text>
              </View>
            </View>

            {/* Complete Payment Button */}
            <TouchableOpacity
              style={[styles.primaryActionButton, bookingLoading && { opacity: 0.7 }]}
              onPress={handleInitiatePayment}
              disabled={bookingLoading}
              activeOpacity={0.85}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons
                    name={paymentMethod === 'ONLINE' ? 'shield-checkmark' : 'checkmark-circle'}
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={styles.primaryActionText}>
                    {paymentMethod === 'ONLINE'
                      ? `Pay ₹${finalPayable} with Razorpay ⚡`
                      : `Confirm & Pay at Salon (₹${finalPayable}) ➔`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Razorpay WebView Modal */}
      <RazorpayCheckoutModal
        visible={isRazorpayVisible}
        orderData={razorpayOrderData}
        onSuccess={handleRazorpaySuccess}
        onFailure={handleRazorpayFailure}
        onDismiss={() => {
          setIsRazorpayVisible(false);
          if (currentBookingId) {
            setFailureModalData({
              bookingId: currentBookingId,
              bookingCode: currentBookingCode || '',
              amount: finalPayable,
              storeName: selectedBranch?.name || 'Groomish Salon',
              scheduledAt: `${selectedDate}T${selectedTime || '11:00'}:00`,
              reason: 'Payment window was closed or dismissed.',
            });
          }
        }}
      />

      {/* Confirmation Success Modal */}
      <Modal
        visible={!!successModalData}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalData(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={40} color={Colors.white} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reservation Confirmed!</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {successModalData?.paymentMethod === 'ONLINE'
                ? 'Your payment was successfully verified via Razorpay.'
                : 'Your booking is confirmed. Settle bill upon arrival at salon desk.'}
            </Text>

            <View style={[styles.modalInfoBox, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textMuted }]}>Booking Reference</Text>
                <Text style={styles.modalInfoCode}>#{successModalData?.bookingCode}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textMuted }]}>Salon Branch</Text>
                <Text style={[styles.modalInfoVal, { color: colors.text }]}>{successModalData?.storeName}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textMuted }]}>Scheduled Time</Text>
                <Text style={[styles.modalInfoVal, { color: colors.text }]}>
                  {successModalData?.scheduledAt ? format12HourDateTime(successModalData.scheduledAt) : ''}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textMuted }]}>Amount</Text>
                <Text style={styles.modalInfoTotal}>₹{successModalData?.amount}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                const targetId = successModalData?.bookingId;
                setSuccessModalData(null);
                if (targetId) {
                  router.push(`/booking/${targetId}` as any);
                } else {
                  router.push('/(tabs)/bookings' as any);
                }
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>View Booking Details</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => {
                setSuccessModalData(null);
                router.push('/(tabs)/home' as any);
              }}
            >
              <Text style={[styles.modalSecondaryBtnText, { color: colors.textMuted }]}>Done & Back Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Incomplete / Failure Modal with Retry & Switch to Salon options */}
      <Modal
        visible={!!failureModalData}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFailureModalData(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.failureIconCircle}>
              <Ionicons name="alert-circle" size={40} color={Colors.white} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Payment Incomplete</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {failureModalData?.reason || 'The transaction could not be completed.'}
            </Text>

            <Text style={[styles.failureHint, { color: colors.textMuted }]}>
              Your booking reservation #{failureModalData?.bookingCode} is saved. You can retry Razorpay or switch to Pay at Salon.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleRetryOnline}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="refresh" size={16} color={Colors.white} />
                  <Text style={styles.modalPrimaryBtnText}>Retry Online Payment (Razorpay)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSalonBtn, switchingToSalon && { opacity: 0.7 }]}
              onPress={handleSwitchToSalon}
              disabled={switchingToSalon}
            >
              {switchingToSalon ? (
                <ActivityIndicator size="small" color={Colors.orange} />
              ) : (
                <>
                  <Ionicons name="cash-outline" size={16} color={Colors.orange} />
                  <Text style={styles.modalSalonBtnText}>Switch to Pay at Salon Counter</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => setFailureModalData(null)}
            >
              <Text style={[styles.modalSecondaryBtnText, { color: colors.textMuted }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  stepTabActive: {
    opacity: 1,
  },
  stepNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumActive: {
    backgroundColor: Colors.orange,
  },
  stepNumDone: {
    backgroundColor: Colors.green,
  },
  stepNumPending: {
    backgroundColor: '#334155',
  },
  stepNumText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  stepTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  stepTabTextActive: {
    color: Colors.orange,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepBackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  stepBackText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '800',
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  branchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  branchTextWrap: {
    flex: 1,
  },
  branchLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  branchName: {
    fontSize: 13,
    fontWeight: '800',
  },
  branchChangeLink: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.orange,
    paddingLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    ...Shadows.orange,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  itemsSection: {
    gap: 12,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clearCartText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  productBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.white,
  },
  deleteBtn: {
    padding: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.orange,
  },
  itemMrp: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCount: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
  },
  miniSummaryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  miniSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taxNote: {
    fontSize: 11,
    color: Colors.green,
    marginTop: 6,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  dateList: {
    gap: 10,
    paddingVertical: 4,
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 90,
  },
  datePillActive: {
    borderColor: Colors.orange,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  dateDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 2,
  },
  dateFormatted: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  dateTextActive: {
    color: Colors.orange,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  slotCardActive: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orange,
  },
  slotCardDisabled: {
    opacity: 0.35,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  slotTimeTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  slotTimeTextDisabled: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  slotBadgeDisabled: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.red,
    textTransform: 'uppercase',
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 72,
  },
  recapCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recapTextWrap: {
    flex: 1,
  },
  recapLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recapValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  recapDivider: {
    height: 1,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    fontWeight: '700',
    fontSize: 13,
  },
  couponApplyBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponApplyText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  appliedText: {
    flex: 1,
    color: Colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  paymentModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  paymentModeCardActive: {
    borderColor: Colors.orange,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  paymentRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange,
  },
  paymentModeInfo: {
    flex: 1,
  },
  paymentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  paymentModeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    color: Colors.orange,
    fontSize: 9,
    fontWeight: '900',
  },
  paymentModeSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.orange,
  },
  groomCoinsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    padding: 10,
    borderRadius: 10,
  },
  groomCoinsText: {
    color: '#eab308',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.orange,
    height: 52,
    borderRadius: 16,
    marginBottom: 20,
    ...Shadows.orange,
  },
  primaryActionText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  failureIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  failureHint: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  modalInfoBox: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalInfoCode: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.orange,
  },
  modalInfoVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalInfoTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.orange,
  },
  modalPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    height: 48,
    borderRadius: 14,
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  modalSalonBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.orange,
    marginBottom: 10,
  },
  modalSalonBtnText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    paddingVertical: 6,
  },
  modalSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  staffAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  staffAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9a3412',
    flex: 1,
  },
});
