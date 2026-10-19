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

const format24HourDateTime = (isoString?: string) => {
  if (!isoString) return 'Date & Time Pending';
  try {
    const d = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hh}:${min}`;
  } catch (_) {
    return isoString;
  }
};

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 24-hour slots without AM-PM
const SALON_24H_SLOTS = [
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
      Alert.alert('Rescheduled', 'Your appointment schedule has been successfully updated.');
      loadBooking();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reschedule.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  /* ─── CANCEL LOGIC ─── */
  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this salon visit? Any Groom Coins spent will be refunded to your ledger.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerApi.cancelBooking(id);
              Alert.alert('Cancelled', 'Your appointment has been cancelled.');
              loadBooking();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel appointment.');
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
            Loading appointment details...
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
          <Text style={[styles.errorTitle, { color: colors.text }]}>Appointment Not Found</Text>
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
  const isModifiable = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';

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
  const baseBookingAmount = booking.totalAmount ?? 0;
  const subtotal = calculatedTotalMrp > baseBookingAmount ? calculatedTotalMrp : (baseBookingAmount > 0 ? baseBookingAmount : (booking.pricePaid ?? 0));
  const mrpDiscount = Math.max(0, subtotal - (baseBookingAmount > 0 ? baseBookingAmount : (booking.pricePaid ?? subtotal)));

  const finalPayable = booking.pricePaid ?? baseBookingAmount;
  const codeDiscount = baseBookingAmount > finalPayable ? Math.max(0, baseBookingAmount - finalPayable) : 0;

  const couponOrVoucherCode = booking.couponApplied || booking.coupon?.code || null;
  const isVoucher = Boolean(
    couponOrVoucherCode &&
    (couponOrVoucherCode.toUpperCase().includes('VOUCH') || couponOrVoucherCode.toUpperCase().includes('VIP'))
  );

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
        {/* ─── APPOINTMENT SCHEDULE CARD (24-HOUR FORMAT) ─── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="calendar" size={16} color={Colors.orange} />
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Appointment Schedule</Text>
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
            {format24HourDateTime(booking.scheduledAt)}
          </Text>
          <Text style={[styles.schedule24hNote, { color: colors.textMuted }]}>
            * Scheduled in 24-hour branch format without AM/PM.
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

        {/* ─── BILL BREAKDOWN ─── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Payment Summary</Text>

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

            <View style={[styles.billRow, styles.billRowTotal, { borderTopColor: colors.cardBorder }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Final Payable</Text>
              <Text style={styles.totalValue}>
                ₹{finalPayable}
              </Text>
            </View>

            <View style={[styles.paymentMethodBadge, { backgroundColor: colors.bg }]}>
              <Ionicons
                name={booking.paymentMethod === 'ONLINE' ? 'card-outline' : 'cash-outline'}
                size={14}
                color={Colors.slate}
              />
              <Text style={[styles.paymentMethodText, { color: colors.textSecondary }]}>
                Mode: {booking.paymentMethod === 'ONLINE' ? 'Paid via Razorpay' : 'Pay at Salon Counter'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── CANCEL APPOINTMENT ─── */}
        {isModifiable && (
          <TouchableOpacity
            style={styles.cancelAppointmentBtn}
            onPress={handleCancelBooking}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.red} />
            <Text style={styles.cancelAppointmentText}>Cancel Appointment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ─── RESCHEDULE MODAL (STRICT 24-HOUR FORMAT) ─── */}
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>Reschedule Appointment</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Choose from live 24-hour branch time slots (no AM/PM).
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRescheduleModalOpen(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
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
                  {SALON_24H_SLOTS.map((slot) => {
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
                          {slot}
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
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cancelAppointmentBtn: {
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
  cancelAppointmentText: {
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
});
