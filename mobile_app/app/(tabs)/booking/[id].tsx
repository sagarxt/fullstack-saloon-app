import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi, publicApi } from '../../../api/client';
import { Colors } from '../../../theme/colors';
import { useTheme } from '../../../context/ThemeContext';
import TopHeader from '../../../components/TopHeader';
import { format12HourDateTime, formatSlot12Hour, getLocalDateStr } from '../../../utils/dateHelper';
import * as Clipboard from 'expo-clipboard';

// Salon slots in 30-min intervals
const SALON_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Refund Live Checking State
  const [checkingRefund, setCheckingRefund] = useState(false);
  const [copiedRefundId, setCopiedRefundId] = useState(false);
  const [copiedArn, setCopiedArn] = useState(false);

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleUnavailableSlots, setRescheduleUnavailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Add Service Modal State
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [addingServiceId, setAddingServiceId] = useState<any>(null);

  const loadBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await customerApi.getBookingDetail(id);
      setBooking(res.data);
    } catch (err) {
      console.error('Booking detail load error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  /* ─── RESCHEDULE LOGIC ─── */
  const handleOpenReschedule = () => {
    if ((booking?.rescheduleCount ?? 0) >= 2) {
      Alert.alert(
        'Reschedule Limit Reached',
        'You have reached the maximum allowed limit of 2 reschedules for this booking per salon policy. To choose another time, please contact salon reception or book a new appointment.'
      );
      return;
    }

    const today = getLocalDateStr();
    let initialDate = today;
    let initialTime = '';

    if (booking?.scheduledAt) {
      const d = new Date(booking.scheduledAt);
      const bookingDate = getLocalDateStr(d);
      if (bookingDate >= today) {
        initialDate = bookingDate;
      }
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      initialTime = `${hh}:${min}`;
    }

    setRescheduleDate(initialDate);
    setRescheduleTime(initialTime);
    setRescheduleModalOpen(true);
    fetchSlotsForDate(initialDate);
  };

  const fetchSlotsForDate = async (dateStr: string) => {
    setLoadingSlots(true);
    try {
      const primaryServiceId =
        booking?.items?.find((i: any) => i.serviceId || i.service?.id)?.serviceId ||
        booking?.items?.find((i: any) => i.serviceId || i.service?.id)?.service?.id;
      const res = await customerApi.getSlotAvailability(dateStr, primaryServiceId);
      setRescheduleUnavailableSlots(res.data?.unavailableSlots || []);
    } catch (err) {
      console.error('Slots error:', err);
      setRescheduleUnavailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isSlotPast = (slotStr: string) => {
    const today = getLocalDateStr();
    if (rescheduleDate !== today) return false;
    const [h, m] = slotStr.split(':').map(Number);
    const now = new Date();
    const slotD = new Date();
    slotD.setHours(h, m, 0, 0);
    return slotD <= now;
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      Alert.alert('Select Time Slot', 'Please choose a valid salon time slot.');
      return;
    }
    setSubmittingReschedule(true);
    try {
      const iso = `${rescheduleDate}T${rescheduleTime}:00`;
      await customerApi.rescheduleBooking(id, iso);
      setRescheduleModalOpen(false);
      Alert.alert('Rescheduled', 'Your booking schedule has been successfully updated.');
      loadBooking();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reschedule.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const [switchingToSalon, setSwitchingToSalon] = useState(false);

  const handleSwitchToSalon = async () => {
    setSwitchingToSalon(true);
    try {
      await customerApi.switchToPayAtSalon(id);
      Alert.alert('Payment Mode Updated', 'You can now settle the remaining balance at the salon reception desk upon arrival.');
      loadBooking();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update payment mode.');
    } finally {
      setSwitchingToSalon(false);
    }
  };

  /* ─── LIVE RAZORPAY REFUND LOGIC ─── */
  const handleCheckLiveRefund = async () => {
    if (!booking?.id) return;
    setCheckingRefund(true);
    try {
      const res = await customerApi.getRefundStatus(booking.id);
      const data = res.data;
      setBooking((prev: any) => ({
        ...prev,
        refundStatus: data.refundStatus || prev?.refundStatus,
        refundAmount: data.refundAmount !== undefined ? data.refundAmount : prev?.refundAmount,
        razorpayRefundId: data.razorpayRefundId || data.refundId || prev?.razorpayRefundId,
        refundArn: data.refundArn || data.bankArn || prev?.refundArn,
        refundReason: data.refundReason || data.message || prev?.refundReason,
      }));
      Alert.alert(
        'Razorpay Live Sync',
        `Status: ${data.refundStatus || 'ACTIVE'}\nRefund Amount: ₹${data.refundAmount || 0}${data.bankArn ? `\nBank ARN: ${data.bankArn}` : ''}\n${data.message || 'Direct sync from Razorpay API.'}`
      );
    } catch (err: any) {
      Alert.alert('Refund Status Check', err.response?.data?.message || 'Could not check live refund status with Razorpay at this moment.');
    } finally {
      setCheckingRefund(false);
    }
  };

  const handleCopyRefundId = async (rId: string) => {
    if (!rId) return;
    await Clipboard.setStringAsync(rId);
    setCopiedRefundId(true);
    setTimeout(() => setCopiedRefundId(false), 2000);
  };

  const handleCopyArn = async (arn: string) => {
    if (!arn) return;
    await Clipboard.setStringAsync(arn);
    setCopiedArn(true);
    setTimeout(() => setCopiedArn(false), 2000);
  };

  /* ─── CANCEL LOGIC ─── */
  const handleCancelBooking = () => {
    const isWithin2Hours = booking?.scheduledAt
      ? (new Date(booking.scheduledAt).getTime() - Date.now()) <= 2 * 60 * 60 * 1000
      : false;

    const paidOnline = (booking?.pricePaid > 0.01) ||
      (booking?.payment?.status === 'COMPLETED' && booking?.payment?.paymentMethod !== 'CASH');

    const alertTitle = isWithin2Hours ? 'Late Cancellation Notice' : 'Cancel Salon Booking';
    const alertMessage = isWithin2Hours
      ? '⚠️ Your appointment is in less than 2 hours. In accordance with salon policy, a ₹200 advance deposit is retained. Any excess prepaid amount is refunded automatically to your original payment method via Razorpay within 5–7 business days. Proceed?'
      : paidOnline
      ? `Are you sure you want to cancel? Free cancellation is active (> 2h before slot). 100% of your advance payment (₹${booking.pricePaid}) will be refunded via Razorpay within 5–7 business days.`
      : 'Are you sure you want to cancel this booking? Free cancellation is active (> 2h before slot).';

    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerApi.cancelBooking(id);
              Alert.alert(
                'Cancelled',
                paidOnline
                  ? 'Your booking has been cancelled and an automated Razorpay refund has been initiated. View refund details below.'
                  : 'Your booking has been cancelled.'
              );
              loadBooking();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel booking.');
            }
          },
        },
      ]
    );
  };

  /* ─── ADD SERVICE MODAL LOGIC ─── */
  const handleOpenAddService = async () => {
    setAddServiceModalOpen(true);
    setLoadingServices(true);
    try {
      const storeId = booking?.store?.id || booking?.storeId;
      const res = storeId
        ? await publicApi.getStoreServices(storeId)
        : await publicApi.getServices();
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      const normalized = list.map((s: any) => ({
        ...s,
        id: s.serviceId || s.id,
      }));
      setAvailableServices(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleAddService = async (serviceId: any) => {
    setAddingServiceId(serviceId);
    try {
      await customerApi.addServiceToBooking(id, serviceId);
      setAddServiceModalOpen(false);
      Alert.alert('Service Added', 'Service successfully appended to your salon visit.');
      loadBooking();
    } catch (err: any) {
      Alert.alert('Unable to Add', err.response?.data?.message || 'Could not add service.');
    } finally {
      setAddingServiceId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Confirmed', bg: Colors.greenLight, text: Colors.greenDark };
      case 'COMPLETED':
        return { label: 'Completed', bg: Colors.blueLight, text: Colors.blue };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: Colors.redLight, text: Colors.red };
      case 'NO_SHOW':
        return { label: 'No-Show', bg: '#FEE2E2', text: '#B91C1C' };
      case 'MODIFIED':
        return { label: 'Rescheduled', bg: '#F3E8FF', text: '#7E22CE' };
      default:
        return { label: 'Pending', bg: Colors.amberLight, text: Colors.amber };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} showBack={true} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading booking details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} showBack={true} />
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.red} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Booking Not Found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to Bookings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = getStatusBadge(booking.status);
  const serviceItems = (booking.items || booking.bookingItems || []).map((s: any) => ({
    ...s,
    isProduct: false,
  }));
  const productItems = (booking.products || []).map((p: any) => ({
    ...p,
    isProduct: true,
  }));
  const items = [...serviceItems, ...productItems];
  const isModifiable = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.status !== 'NO_SHOW';

  // Bill calculations
  const servicesMrp = (booking.items || booking.bookingItems || []).reduce(
    (sum: number, it: any) => {
      const price = Number(it.price ?? it.servicePriceSnapshot ?? it.service?.price ?? 0);
      const rawMrp = Number(it.subServiceMrp ?? it.mrp ?? it.serviceMrp ?? it.service?.mrp ?? price);
      const mrp = Math.max(rawMrp, price);
      return sum + mrp;
    },
    0
  );
  const productsMrp = (booking.products || []).reduce(
    (sum: number, it: any) => {
      const price = Number(it.unitPrice ?? 0);
      const rawMrp = Number(it.mrp ?? it.productMrp ?? it.product?.mrp ?? price);
      const mrp = Math.max(rawMrp, price);
      const qty = Number(it.quantity || 1);
      return sum + (mrp * qty);
    },
    0
  );
  const calculatedTotalMrp = servicesMrp + productsMrp;
  const servicesCatalogSum = (booking.items || []).reduce((sum: number, it: any) => sum + Number(it.servicePriceSnapshot ?? it.price ?? 0), 0);
  const productsCatalogSum = (booking.products || []).reduce((sum: number, it: any) => sum + Number(it.unitPrice ?? 0) * (it.quantity || 1), 0);
  const catalogSum = servicesCatalogSum + productsCatalogSum;
  const totalAmount = Number(booking.totalAmount ?? catalogSum);
  const subtotal = calculatedTotalMrp > catalogSum ? calculatedTotalMrp : (catalogSum > 0 ? catalogSum : totalAmount);
  const mrpDiscount = Math.max(0, subtotal - (catalogSum > 0 ? catalogSum : totalAmount));

  const couponOrVoucherCode = booking.couponApplied || booking.coupon?.code || null;
  const isVoucher = Boolean(
    couponOrVoucherCode &&
    (couponOrVoucherCode.toUpperCase().includes('VOUCH') || couponOrVoucherCode.toUpperCase().includes('VIP'))
  );

  const finalPayable = totalAmount > 0 ? totalAmount : (catalogSum > 0 ? catalogSum : Number(booking.pricePaid) || 0);
  let codeDiscount = 0;
  if (couponOrVoucherCode && catalogSum > 0 && totalAmount < catalogSum) {
    codeDiscount = Math.max(0, catalogSum - totalAmount);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ─── TOP LUXURY NAVBAR ─── */}
      <TopHeader showBranchSelector={true} showBack={true} />

      {/* ─── SUB HEADER (Booking Code & Status) ─── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.backIconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {booking.bookingCode || `GN-${String(booking.id).slice(0, 8).toUpperCase()}`}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 95 }]}>
        {/* ─── BOOKING SCHEDULE CARD (12-HOUR FORMAT) ─── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="calendar" size={16} color={Colors.orange} />
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Booking Schedule</Text>
            </View>
            {isModifiable && (
              <TouchableOpacity
                style={styles.rescheduleHeaderBtn}
                onPress={handleOpenReschedule}
              >
                <Ionicons name="refresh" size={13} color={Colors.orange} />
                <Text style={styles.rescheduleHeaderText}>Reschedule</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.scheduleBigText, { color: colors.text }]}>
            {format12HourDateTime(booking.scheduledAt)}
          </Text>

          {/* Branch info */}
          <View style={[styles.branchBox, { backgroundColor: colors.bg }]}>
            <Ionicons name="storefront" size={16} color={Colors.slate} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.branchBoxName, { color: colors.text }]}>
                {booking.storeName || booking.store?.name || 'Groomish Salon'}
              </Text>
              <Text style={[styles.branchBoxAddress, { color: colors.textMuted }]}>
                {booking.storeAddress || booking.store?.address || 'Flagship Branch'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── NO-SHOW & DEPOSIT POLICY ─── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderLeftWidth: 4, borderLeftColor: Colors.orange }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.orange} />
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>No-Show & Cancellation Policy</Text>
            </View>
          </View>
          <View style={{ gap: 6, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.greenDark} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>Free Cancellation:</Text> Reschedule or cancel free up to 2 hours before your slot.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Ionicons name="alert-circle" size={14} color={Colors.orange} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>Within 2 Hours / No-Show:</Text> Cancellations within 2h or failure to arrive forfeit the advance deposit.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Ionicons name="time-outline" size={14} color={Colors.slate} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>Grace Period:</Text> Appointments are held for 30 minutes after scheduled time.
              </Text>
            </View>
          </View>
        </View>

        {/* ─── SERVICES & PRODUCTS IN VISIT ─── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="cut" size={16} color={Colors.orange} />
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Services & Products ({items.length})</Text>
            </View>

            {isModifiable && (
              <TouchableOpacity
                style={styles.rescheduleHeaderBtn}
                onPress={handleOpenAddService}
              >
                <Ionicons name="add-circle-outline" size={14} color={Colors.orange} />
                <Text style={styles.rescheduleHeaderText}>Add Service</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.itemsList}>
            {items.map((item: any, idx: number) => {
              let itemName = item.serviceNameSnapshot || item.serviceName || item.service?.name || item.productName || item.name || 'Salon Item';
              if (item.subServiceName && !itemName.includes(`(${item.subServiceName})`)) {
                itemName = `${itemName} (${item.subServiceName})`;
              }
              const unitPrice = item.price ?? item.servicePriceSnapshot ?? item.priceSnapshot ?? item.unitPrice ?? item.service?.price ?? 0;
              const unitMrp = item.mrp ?? item.serviceMrp ?? item.productMrp ?? item.service?.mrp ?? item.product?.mrp ?? unitPrice;
              const qty = item.quantity || 1;
              const totalPrice = item.totalPrice ?? (unitPrice * qty);
              const totalMrp = unitMrp * qty;
              const metaText = item.durationMinutes ? `${item.durationMinutes} mins` : item.isProduct ? 'Retail Product' : 'Salon Service';
              const qtyText = qty > 1 ? ` • Qty: ${qty}` : '';
              const mrpMeta = (unitMrp > unitPrice) ? ` (MRP: ₹${unitMrp})` : '';

              return (
                <View key={item.id || idx} style={[styles.itemRow, { borderBottomColor: colors.cardBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemRowName, { color: colors.text }]}>{itemName}</Text>
                    <Text style={[styles.itemRowMeta, { color: colors.textMuted }]}>
                      {metaText}{qtyText}{mrpMeta}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.itemRowPrice, { color: colors.text }]}>
                      ₹{totalPrice}
                    </Text>
                    {totalMrp > totalPrice && (
                      <Text style={[styles.itemRowMrp, { color: colors.textMuted }]}>
                        ₹{totalMrp}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── RAZORPAY REFUND DETAILS CARD ─── */}
        {Boolean(
          (booking.refundStatus && booking.refundStatus !== 'NONE') ||
          booking.razorpayRefundId ||
          (booking.status === 'CANCELLED' && Number(booking.pricePaid) > 0)
        ) && (
          <View style={[styles.card, styles.refundCard, { backgroundColor: colors.card, borderColor: '#38BDF8' }]}>
            <View style={styles.refundHeaderRow}>
              <View style={styles.refundHeaderLeft}>
                <View style={styles.shieldIconWrap}>
                  <Ionicons name="shield-checkmark" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refundCardTitle, { color: colors.text }]}>Razorpay Refund Details</Text>
                  <Text style={[styles.refundCardSub, { color: colors.textMuted }]}>
                    Automated refund to original payment source
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.liveRefreshBtn}
                onPress={handleCheckLiveRefund}
                disabled={checkingRefund}
                activeOpacity={0.8}
              >
                {checkingRefund ? (
                  <ActivityIndicator size="small" color="#0284C7" />
                ) : (
                  <>
                    <Ionicons name="sync-outline" size={13} color="#0284C7" />
                    <Text style={styles.liveRefreshText}>Check Live Status</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Status & Amounts */}
            <View style={styles.refundStatsRow}>
              <View style={[styles.refundStatBox, { backgroundColor: colors.bg }]}>
                <Text style={[styles.refundStatLabel, { color: colors.textMuted }]}>Status</Text>
                <View style={[
                  styles.refundStatusBadge,
                  booking.refundStatus === 'PROCESSED' ? styles.refundBadgeProcessed :
                  booking.refundStatus === 'FORFEITED' ? styles.refundBadgeForfeited :
                  styles.refundBadgeInitiated
                ]}>
                  <Text style={[
                    styles.refundStatusText,
                    booking.refundStatus === 'PROCESSED' ? styles.refundTextProcessed :
                    booking.refundStatus === 'FORFEITED' ? styles.refundTextForfeited :
                    styles.refundTextInitiated
                  ]}>
                    {booking.refundStatus || 'INITIATED'}
                  </Text>
                </View>
              </View>

              <View style={[styles.refundStatBox, { backgroundColor: colors.bg }]}>
                <Text style={[styles.refundStatLabel, { color: colors.textMuted }]}>Refunded</Text>
                <Text style={styles.refundAmountVal}>
                  ₹{booking.refundAmount !== undefined && booking.refundAmount !== null ? booking.refundAmount : (booking.pricePaid || 0)}
                </Text>
              </View>

              <View style={[styles.refundStatBox, { backgroundColor: colors.bg }]}>
                <Text style={[styles.refundStatLabel, { color: colors.textMuted }]}>Paid</Text>
                <Text style={[styles.refundPaidVal, { color: colors.text }]}>
                  ₹{booking.pricePaid || booking.totalAmount || 0}
                </Text>
              </View>
            </View>

            {/* Reference IDs with Copy */}
            {booking.razorpayRefundId && (
              <View style={[styles.refIdBox, { backgroundColor: colors.bg }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refIdLabel, { color: colors.textMuted }]}>Razorpay Refund ID:</Text>
                  <Text style={[styles.refIdCode, { color: '#0369A1' }]} selectable={true}>
                    {booking.razorpayRefundId}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyIdBtn}
                  onPress={() => handleCopyRefundId(booking.razorpayRefundId)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={copiedRefundId ? "checkmark" : "copy-outline"} size={13} color={copiedRefundId ? Colors.green : "#0284C7"} />
                  <Text style={[styles.copyIdText, copiedRefundId && { color: Colors.green }]}>
                    {copiedRefundId ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {booking.refundArn ? (
              <View style={[styles.refIdBox, { backgroundColor: colors.bg }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refIdLabel, { color: colors.textMuted }]}>Bank ARN (Reference No):</Text>
                  <Text style={[styles.refIdCode, { color: colors.text }]} selectable={true}>
                    {booking.refundArn}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyIdBtn}
                  onPress={() => handleCopyArn(booking.refundArn)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={copiedArn ? "checkmark" : "copy-outline"} size={13} color={copiedArn ? Colors.green : "#0284C7"} />
                  <Text style={[styles.copyIdText, copiedArn && { color: Colors.green }]}>
                    {copiedArn ? 'Copied' : 'Copy ARN'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.refIdBox, { backgroundColor: colors.bg }]}>
                <Ionicons name="time-outline" size={14} color="#0284C7" />
                <Text style={[styles.arnNotice, { color: colors.textMuted }]}>
                  Bank ARN will appear here once settled by your bank. Tap "Check Live Status" anytime.
                </Text>
              </View>
            )}

            {booking.refundReason && (
              <View style={styles.refundReasonBox}>
                <Text style={styles.refundReasonText}>
                  <Text style={{ fontWeight: '700' }}>Reason: </Text>
                  {booking.refundReason}
                </Text>
              </View>
            )}

            <View style={styles.refundTimelineRow}>
              <Ionicons name="information-circle-outline" size={14} color="#0284C7" />
              <Text style={[styles.refundTimelineText, { color: colors.textMuted }]}>
                Refunds typically credit within <Text style={{ fontWeight: '700' }}>5–7 business days</Text> to original account.
              </Text>
            </View>
          </View>
        )}

        {/* ─── BILL BREAKDOWN & REMAINING PAYABLE AMOUNT ─── */}
        {(() => {
          const totalAmount = Number(booking.totalAmount ?? booking.pricePaid ?? 0);
          const pricePaid = Number(booking.pricePaid ?? 0);
          const remainingAmount = Number(
            booking.remainingAmount !== undefined && booking.remainingAmount !== null
              ? booking.remainingAmount
              : Math.max(0, totalAmount - pricePaid)
          );
          const isPartiallyPaid = pricePaid > 0.01 && remainingAmount > 0.01;
          const isFullyPaid = remainingAmount <= 0.01 && (pricePaid > 0 || booking.status === 'COMPLETED' || booking.paymentStatus === 'COMPLETED');
          const hasRemainingBalance = remainingAmount > 0.01 && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Invoice & Payment Summary</Text>

              <View style={styles.billRowsWrap}>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textMuted }]}>Subtotal</Text>
                  <Text style={[styles.billValue, { color: colors.text }]}>
                    ₹{subtotal}
                  </Text>
                </View>

                {mrpDiscount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: Colors.greenDark }]}>
                      Discount on MRP
                    </Text>
                    <Text style={[styles.billValue, { color: Colors.greenDark }]}>
                      - ₹{mrpDiscount}
                    </Text>
                  </View>
                )}

                {couponOrVoucherCode && !isVoucher && codeDiscount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: Colors.greenDark }]}>
                      Coupon ({couponOrVoucherCode})
                    </Text>
                    <Text style={[styles.billValue, { color: Colors.greenDark }]}>
                      - ₹{codeDiscount}
                    </Text>
                  </View>
                )}

                {couponOrVoucherCode && isVoucher && codeDiscount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: Colors.greenDark }]}>
                      Voucher ({couponOrVoucherCode})
                    </Text>
                    <Text style={[styles.billValue, { color: Colors.greenDark }]}>
                      - ₹{codeDiscount}
                    </Text>
                  </View>
                )}

                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textMuted }]}>Salon Hygiene & Disposable Kit</Text>
                  <Text style={[styles.billValue, { color: Colors.greenDark }]}>FREE</Text>
                </View>

                {/* Total Bill */}
                <View style={[styles.billRow, styles.billRowTotal, { borderTopColor: colors.cardBorder }]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total Bill</Text>
                  <Text style={styles.totalValue}>
                    ₹{totalAmount}
                  </Text>
                </View>

                {/* Already Paid Online (Partial) */}
                {isPartiallyPaid && (
                  <View style={styles.partialPaidBanner}>
                    <View style={styles.partialPaidLeft}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                      <Text style={styles.partialPaidText}>Already Paid Online</Text>
                    </View>
                    <Text style={styles.partialPaidAmount}>- ₹{pricePaid}</Text>
                  </View>
                )}

                {/* Remaining Balance to Pay */}
                {isPartiallyPaid && (
                  <View style={styles.remainingBalanceCard}>
                    <View style={styles.remainingBalanceLeft}>
                      <Ionicons name="alert-circle" size={16} color="#B45309" />
                      <Text style={styles.remainingBalanceTitle}>Remaining Balance to Pay:</Text>
                    </View>
                    <Text style={styles.remainingBalanceAmount}>₹{remainingAmount}</Text>
                  </View>
                )}

                {/* Payment Status Info Box */}
                <View style={[styles.paymentMethodBadge, { backgroundColor: colors.bg }]}>
                  <Ionicons
                    name={
                      booking.status === 'CANCELLED'
                        ? 'close-circle-outline'
                        : isFullyPaid
                        ? 'checkmark-circle-outline'
                        : 'time-outline'
                    }
                    size={16}
                    color={
                      booking.status === 'CANCELLED'
                        ? Colors.red
                        : isFullyPaid
                        ? Colors.green
                        : '#B45309'
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paymentMethodStatusTitle, { color: colors.text }]}>
                      {booking.status === 'CANCELLED'
                        ? booking.refundStatus && booking.refundStatus !== 'NONE'
                          ? `Refund ${booking.refundStatus} (₹${booking.refundAmount || 0})`
                          : 'Cancelled • No Online Payment'
                        : isFullyPaid
                        ? booking.paymentMethod === 'CASH'
                          ? 'Paid at Salon Reception'
                          : 'Paid Online via Razorpay'
                        : isPartiallyPaid
                        ? `Partially Paid (₹${pricePaid} Paid • ₹${remainingAmount} Due)`
                        : booking.paymentMethod === 'ONLINE'
                        ? 'Payment Pending (Online)'
                        : 'Payment Pending (Pay at Salon)'}
                    </Text>
                    <Text style={[styles.paymentMethodText, { color: colors.textMuted }]}>
                      {booking.invoiceNumber
                        ? `Invoice Ref: ${booking.invoiceNumber}`
                        : `Payment Mode: ${booking.paymentMethod === 'ONLINE' ? 'Razorpay' : 'Pay at Salon Counter'}`}
                    </Text>
                  </View>
                </View>

                {/* Outstanding Balance Callout (if remaining balance active) */}
                {hasRemainingBalance && (
                  <View style={styles.balanceCallout}>
                    <View style={styles.balanceCalloutHeader}>
                      <Ionicons name="flash" size={15} color={Colors.orange} />
                      <Text style={styles.balanceCalloutTitle}>
                        {isPartiallyPaid ? 'Outstanding Balance Notice' : 'Pay at Salon Option Active'}
                      </Text>
                    </View>
                    <Text style={[styles.balanceCalloutDesc, { color: colors.textSecondary }]}>
                      {isPartiallyPaid
                        ? `Additional services or products were added. You have paid ₹${pricePaid}. Settle remaining ₹${remainingAmount} at the salon counter.`
                        : `Chose Pay at Salon? Settle your bill upon arrival at salon desk via Cash, UPI, or Card.`}
                    </Text>
                    {booking.paymentMethod === 'ONLINE' && !isFullyPaid && (
                      <TouchableOpacity
                        style={[styles.switchSalonBtn, switchingToSalon && { opacity: 0.6 }]}
                        onPress={handleSwitchToSalon}
                        disabled={switchingToSalon}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="storefront-outline" size={14} color={Colors.orange} />
                        <Text style={styles.switchSalonBtnText}>Switch to Pay at Salon Counter</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })()}

        {/* ─── CANCEL BOOKING ─── */}
        {isModifiable && (
          <TouchableOpacity
            style={styles.cancelBookingBtn}
            onPress={handleCancelBooking}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.red} />
            <Text style={styles.cancelBookingText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ─── RESCHEDULE MODAL (12-HOUR FORMAT) ─── */}
      <Modal
        visible={rescheduleModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setRescheduleModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Reschedule Booking</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Choose from live available branch time slots (12-hour AM/PM).
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRescheduleModalOpen(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Reschedule Rules & Counter */}
            <View style={[styles.reschedulePolicyBanner, { backgroundColor: colors.bg }]}>
              <View style={styles.reschedulePolicyLeft}>
                <Ionicons name="sparkles" size={14} color={Colors.orange} />
                <Text style={[styles.reschedulePolicyText, { color: colors.text }]}>
                  Max 2 reschedules permitted per booking.
                </Text>
              </View>
              <View style={styles.reschedulePolicyBadge}>
                <Text style={styles.reschedulePolicyBadgeText}>
                  {booking?.rescheduleCount ?? 0} / 2 used
                </Text>
              </View>
            </View>

            {/* Date Quick Selector */}
            <View style={styles.dateSelectorRow}>
              {[0, 1, 2, 3, 4].map((offset) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const dateStr = getLocalDateStr(d);
                const isSelected = rescheduleDate === dateStr;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = offset === 0 ? 'Today' : offset === 1 ? 'Tmrw' : days[d.getDay()];

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[
                      styles.dateBtn,
                      { backgroundColor: colors.bg, borderColor: colors.cardBorder },
                      isSelected && styles.dateBtnSelected,
                    ]}
                    onPress={() => {
                      setRescheduleDate(dateStr);
                      setRescheduleTime('');
                      fetchSlotsForDate(dateStr);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateBtnDay,
                        { color: colors.textMuted },
                        isSelected && styles.dateBtnDaySelected,
                      ]}
                    >
                      {dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dateBtnNum,
                        { color: colors.text },
                        isSelected && styles.dateBtnNumSelected,
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Slots Grid */}
            {loadingSlots ? (
              <View style={styles.centerLoadingSmall}>
                <ActivityIndicator size="small" color={Colors.orange} />
                <Text style={[styles.loadingSmallText, { color: colors.textMuted }]}>
                  Checking salon capacity...
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                <View style={styles.slotsGrid}>
                  {SALON_SLOTS.map((slot) => {
                    const isSelected = rescheduleTime === slot;
                    const isUnavailable =
                      rescheduleUnavailableSlots.includes(slot) || isSlotPast(slot);

                    return (
                      <TouchableOpacity
                        key={slot}
                        disabled={isUnavailable}
                        style={[
                          styles.slotBtn,
                          { backgroundColor: colors.bg, borderColor: colors.cardBorder },
                          isSelected && styles.slotBtnSelected,
                          isUnavailable && styles.slotBtnDisabled,
                        ]}
                        onPress={() => !isUnavailable && setRescheduleTime(slot)}
                      >
                        <Text
                          style={[
                            styles.slotBtnText,
                            { color: colors.text },
                            isSelected && styles.slotBtnTextSelected,
                            isUnavailable && styles.slotBtnTextDisabled,
                          ]}
                        >
                          {formatSlot12Hour(slot)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={[
                styles.confirmRescheduleBtn,
                (!rescheduleTime || submittingReschedule) && { opacity: 0.5 },
              ]}
              disabled={!rescheduleTime || submittingReschedule}
              onPress={handleSubmitReschedule}
            >
              {submittingReschedule ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.confirmRescheduleText}>Confirm Reschedule</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── ADD SERVICE MODAL ─── */}
      <Modal
        visible={addServiceModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAddServiceModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Service to Visit</Text>
              <TouchableOpacity onPress={() => setAddServiceModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loadingServices ? (
              <View style={styles.centerLoadingSmall}>
                <ActivityIndicator size="small" color={Colors.orange} />
              </View>
            ) : (
              <FlatList
                data={availableServices}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <View style={[styles.addServiceItem, { borderBottomColor: colors.cardBorder }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.addServiceName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={styles.addServicePrice}>₹{item.price}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addServiceBtn}
                      disabled={addingServiceId === item.id}
                      onPress={() => handleAddService(item.id)}
                    >
                      {addingServiceId === item.id ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text style={styles.addServiceBtnText}>Add</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginHorizontal: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scroll: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  rescheduleHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rescheduleHeaderText: {
    color: Colors.orange,
    fontSize: 11,
    fontWeight: '700',
  },
  scheduleBigText: {
    fontSize: 18,
    fontWeight: '800',
  },
  schedule24hNote: {
    fontSize: 11,
    marginTop: -4,
  },
  branchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  branchBoxName: {
    fontSize: 13,
    fontWeight: '700',
  },
  branchBoxAddress: {
    fontSize: 11,
    marginTop: 1,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  itemRowName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemRowMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  itemRowPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  itemRowMrp: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  billRowsWrap: {
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 12,
  },
  billValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  billRowTotal: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.orange,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  paymentMethodStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  partialPaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  partialPaidLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partialPaidText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  partialPaidAmount: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
  },
  remainingBalanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  remainingBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  remainingBalanceTitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },
  remainingBalanceAmount: {
    color: '#B45309',
    fontSize: 17,
    fontWeight: '900',
  },
  balanceCallout: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    gap: 6,
  },
  balanceCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceCalloutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  balanceCalloutDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  switchSalonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: Colors.orange,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  switchSalonBtnText: {
    color: Colors.orange,
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
  },
  cancelBookingText: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  dateBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateBtnSelected: {
    borderColor: Colors.orange,
    backgroundColor: '#FFF7ED',
  },
  dateBtnDay: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateBtnDaySelected: {
    color: Colors.orange,
  },
  dateBtnNum: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  dateBtnNumSelected: {
    color: Colors.orange,
  },
  centerLoadingSmall: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingSmallText: {
    fontSize: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotBtnSelected: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  slotBtnDisabled: {
    opacity: 0.35,
  },
  slotBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slotBtnTextSelected: {
    color: Colors.white,
  },
  slotBtnTextDisabled: {
    textDecorationLine: 'line-through',
  },
  confirmRescheduleBtn: {
    backgroundColor: Colors.orange,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmRescheduleText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  addServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  addServiceName: {
    fontSize: 12,
    fontWeight: '700',
  },
  addServicePrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.orange,
    marginTop: 2,
  },
  addServiceBtn: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addServiceBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  backBtn: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  refundCard: {
    borderWidth: 1.5,
  },
  refundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
    paddingBottom: 10,
    marginBottom: 10,
  },
  refundHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  refundCardSub: {
    fontSize: 10,
    marginTop: 1,
  },
  liveRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  liveRefreshText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  refundStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  refundStatBox: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 3,
  },
  refundAmountVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.greenDark,
  },
  refundPaidVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  refundStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  refundBadgeProcessed: {
    backgroundColor: '#DCFCE7',
  },
  refundBadgeForfeited: {
    backgroundColor: '#FEF3C7',
  },
  refundBadgeInitiated: {
    backgroundColor: '#E0F2FE',
  },
  refundStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  refundTextProcessed: {
    color: '#15803D',
  },
  refundTextForfeited: {
    color: '#B45309',
  },
  refundTextInitiated: {
    color: '#0369A1',
  },
  refIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
    gap: 6,
  },
  refIdLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  refIdCode: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  copyIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  copyIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  arnNotice: {
    fontSize: 10,
    flex: 1,
  },
  refundReasonBox: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: 6,
  },
  refundReasonText: {
    fontSize: 10,
    color: '#0369A1',
    lineHeight: 14,
  },
  refundTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  refundTimelineText: {
    fontSize: 10,
    flex: 1,
  },
  reschedulePolicyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  reschedulePolicyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  reschedulePolicyText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  reschedulePolicyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reschedulePolicyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
});
