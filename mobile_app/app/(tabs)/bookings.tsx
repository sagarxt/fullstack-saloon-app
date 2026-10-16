import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING: { color: Colors.amber, bg: Colors.amberLight, icon: 'time-outline', label: 'Pending' },
  CONFIRMED: { color: Colors.blue, bg: Colors.blueLight, icon: 'checkmark-circle-outline', label: 'Confirmed' },
  COMPLETED: { color: Colors.green, bg: Colors.greenLight, icon: 'checkmark-done-circle-outline', label: 'Completed' },
  CANCELLED: { color: Colors.red, bg: Colors.redLight, icon: 'close-circle-outline', label: 'Cancelled' },
  RESCHEDULED: { color: Colors.orange, bg: Colors.orangeLight, icon: 'refresh-circle-outline', label: 'Rescheduled' },
  IN_PROGRESS: { color: Colors.platinumBlue, bg: Colors.blueLight, icon: 'ellipsis-horizontal-circle-outline', label: 'In Progress' },
};

const REWARD_STATUS: Record<string, { color: string; label: string }> = {
  PENDING: { color: Colors.amber, label: 'Pending' },
  CONFIRMED: { color: Colors.green, label: 'Confirmed' },
  CANCELLED: { color: Colors.red, label: 'Cancelled' },
};

const FILTER_TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

export default function BookingsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadBookings = useCallback(async (pg = 0) => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await customerApi.getBookings();
      const d = res.data;
      const list = Array.isArray(d) ? d : d?.content || [];
      setBookings(list);
      setTotalPages(d?.totalPages || 1);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [isAuthenticated]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings(0);
  }, [loadBookings]);

  const handleCancel = async (id: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(id);
            try {
              await customerApi.cancelBooking(id);
              Alert.alert('Cancelled', 'Your booking has been cancelled.');
              loadBookings();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to cancel booking.');
            } finally {
              setCancelling(null);
            }
          },
        },
      ]
    );
  };

  const filteredBookings = bookings.filter((b: any) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Upcoming') return ['CONFIRMED', 'PENDING', 'RESCHEDULED'].includes(b.status);
    if (activeFilter === 'Completed') return b.status === 'COMPLETED';
    if (activeFilter === 'Cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const getServiceNames = (booking: any): string => {
    const items = booking.bookingItems || booking.items || [];
    if (items.length === 0) return booking.serviceName || 'Service';
    const names = items.map((i: any) => i.serviceName || i.service?.name || 'Service');
    const unique = [...new Set(names)];
    if (unique.length === 1) return unique[0] as string;
    return `${unique[0]} + ${unique.length - 1} more`;
  };

  const renderBookingCard = (booking: any) => {
    const status = booking.status || 'PENDING';
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    const rewardStatus = booking.rewardCoinStatus || booking.coinStatus;
    const coins = booking.rewardCoins || booking.earnedCoins || 0;
    const canCancel = ['PENDING', 'CONFIRMED'].includes(status);
    const serviceNames = getServiceNames(booking);
    const scheduledDate = booking.scheduledAt || booking.appointmentDate;

    return (
      <View key={booking.id} style={styles.bookingCard}>
        {/* Card Header */}
        <View style={styles.bookingCardHeader}>
          <View style={styles.bookingIdWrap}>
            <Text style={styles.bookingIdLabel}>Booking</Text>
            <Text style={styles.bookingId}>#{booking.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Service */}
        <View style={styles.bookingServiceRow}>
          <View style={styles.serviceIconWrap}>
            <Ionicons name="cut-outline" size={20} color={Colors.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName} numberOfLines={1}>{serviceNames}</Text>
            {booking.storeName && (
              <Text style={styles.storeName}>📍 {booking.storeName}</Text>
            )}
          </View>
        </View>

        {/* Date & Time */}
        {scheduledDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.slateLight} />
            <Text style={styles.infoText}>
              {new Date(scheduledDate).toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })}
              {' '}•{' '}
              {new Date(scheduledDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {/* Amount */}
        {booking.totalAmount !== undefined && (
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={14} color={Colors.slateLight} />
            <Text style={styles.infoText}>₹{booking.totalAmount?.toLocaleString()}</Text>
            {booking.paymentStatus && (
              <View style={[styles.payBadge, { backgroundColor: booking.paymentStatus === 'PAID' ? Colors.greenLight : Colors.amberLight }]}>
                <Text style={[styles.payBadgeText, { color: booking.paymentStatus === 'PAID' ? Colors.green : Colors.amber }]}>
                  {booking.paymentStatus}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Groom Coins */}
        {coins > 0 && rewardStatus && (
          <View style={styles.coinRow}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinText}>
              <Text style={styles.coinAmount}>{coins} Groom Coins</Text>
              {' '}
              <Text style={[styles.coinStatus, { color: REWARD_STATUS[rewardStatus]?.color || Colors.amber }]}>
                {REWARD_STATUS[rewardStatus]?.label || rewardStatus}
              </Text>
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => router.push(`/(tabs)/booking-detail?id=${booking.id}` as any)}
          >
            <Ionicons name="eye-outline" size={14} color={Colors.orange} />
            <Text style={styles.viewBtnText}>View Details</Text>
          </TouchableOpacity>

          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling === booking.id && { opacity: 0.6 }]}
              onPress={() => handleCancel(booking.id)}
              disabled={cancelling === booking.id}
            >
              {cancelling === booking.id ? (
                <ActivityIndicator size="small" color={Colors.red} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={14} color={Colors.red} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="calendar-outline" size={48} color={Colors.orange} />
          </View>
          <Text style={styles.guestTitle}>Sign in to view bookings</Text>
          <Text style={styles.guestSubtitle}>
            Track scheduled appointments, stylist details, and service status in real-time.
          </Text>
          <TouchableOpacity
            style={styles.guestSignInBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestSignInBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.guestBrowseBtn}
            onPress={() => router.push('/(tabs)/services')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBrowseBtnText}>Browse Salon Services</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSub}>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.orange} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
          contentContainerStyle={styles.listContent}
        >
          {filteredBookings.length > 0 ? (
            filteredBookings.map(renderBookingCard)
          ) : (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={56} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptyText}>
                {activeFilter === 'All'
                  ? "You haven't made any bookings yet."
                  : `No ${activeFilter.toLowerCase()} bookings found.`}
              </Text>
              <TouchableOpacity style={styles.bookNowBtn} onPress={() => router.push('/(tabs)/services')}>
                <Text style={styles.bookNowBtnText}>Book a Service</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.slate },
  headerSub: { fontSize: Typography.sm, color: Colors.slateLight, marginTop: 2 },

  // Filter
  filterScroll: { backgroundColor: Colors.white, maxHeight: 52 },
  filterContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  filterTab: {
    paddingHorizontal: Spacing.lg, paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: Colors.gray200,
  },
  filterTabActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  filterTabText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.slateLight },
  filterTabTextActive: { color: Colors.white, fontWeight: '700' },

  // List
  listContent: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['3xl'] },

  // Booking Card
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  bookingCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  bookingIdWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  bookingIdLabel: { fontSize: Typography.xs, color: Colors.slateLight, fontWeight: '500' },
  bookingId: { fontSize: Typography.md, fontWeight: '800', color: Colors.slate },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: Typography.xs, fontWeight: '700' },

  // Service Row
  bookingServiceRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  serviceIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.orangeLight,
    justifyContent: 'center', alignItems: 'center',
  },
  serviceName: { fontSize: Typography.base, fontWeight: '700', color: Colors.slate },
  storeName: { fontSize: Typography.xs, color: Colors.slateLight, marginTop: 2 },

  // Info Row
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  infoText: { fontSize: Typography.sm, color: Colors.slateLight },
  payBadge: {
    borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2,
    marginLeft: Spacing.xs,
  },
  payBadgeText: { fontSize: Typography.xs, fontWeight: '700' },

  // Coin Row
  coinRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.md, padding: Spacing.sm,
    marginTop: Spacing.sm, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  coinEmoji: { fontSize: 16 },
  coinText: { fontSize: Typography.sm },
  coinAmount: { fontWeight: '800', color: Colors.goldDark },
  coinStatus: { fontWeight: '600' },

  // Actions
  cardActions: {
    flexDirection: 'row', gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
  },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.orange,
  },
  viewBtnText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.orange },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.red + '60',
  },
  cancelBtnText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.red },

  // Empty
  empty: { alignItems: 'center', paddingVertical: Spacing['5xl'] },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.slate, marginTop: Spacing.lg },
  emptyText: { fontSize: Typography.sm, color: Colors.slateLight, marginTop: Spacing.sm, textAlign: 'center' },
  bookNowBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md,
    marginTop: Spacing.xl, ...Shadows.orange,
  },
  bookNowBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },

  // Guest State
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  guestIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  guestTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.slate,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  guestSubtitle: {
    fontSize: Typography.sm,
    color: Colors.slateLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
  },
  guestSignInBtn: {
    width: '100%',
    height: 50,
    borderRadius: Radius.xl,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.orange,
  },
  guestSignInBtnText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.white,
  },
  guestBrowseBtn: {
    width: '100%',
    height: 50,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBrowseBtnText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.slate,
  },
});
