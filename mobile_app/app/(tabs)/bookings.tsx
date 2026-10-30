import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { customerApi } from '../../api/client';
import { Colors, Shadows } from '../../theme/colors';
import TopHeader from '../../components/TopHeader';
import { format12HourDateTime } from '../../utils/dateHelper';

export default function BookingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isStaffOrAdmin } = useAuth();
  const { isDark, colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!isAuthenticated || isStaffOrAdmin) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await customerApi.getBookings();
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setBookings(list);
    } catch (err) {
      console.error('Bookings load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isStaffOrAdmin]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  // Filter bookings according to active tab
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const status = (b.status || '').toUpperCase();
      if (activeTab === 'UPCOMING') {
        return (
          status === 'CONFIRMED' ||
          status === 'PENDING' ||
          status === 'MODIFIED' ||
          status === 'CHECKED_IN' ||
          status === 'IN_PROGRESS'
        );
      }
      if (activeTab === 'COMPLETED') {
        return status === 'COMPLETED';
      }
      if (activeTab === 'CANCELLED') {
        return status === 'CANCELLED';
      }
      return true;
    });
  }, [bookings, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Confirmed', bg: Colors.greenLight, text: Colors.greenDark };
      case 'CHECKED_IN':
        return { label: 'Checked In', bg: '#EDE9FE', text: '#6D28D9' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', bg: '#E0F2FE', text: '#0369A1' };
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} />
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
        </View>

        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="calendar-outline" size={44} color={Colors.orange} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Sign in to View Bookings</Text>
          <Text style={[styles.guestSubtitle, { color: colors.textMuted }]}>
            Track upcoming visits, reschedule booking times, and view salon care history.
          </Text>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.guestLoginText}>Login / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isStaffOrAdmin) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} />
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Staff / Admin Notice</Text>
        </View>

        <View style={styles.guestContainer}>
          <View style={[styles.guestIconWrap, { backgroundColor: '#fff7ed' }]}>
            <Ionicons name="shield-checkmark" size={44} color={Colors.orange} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Staff & Admin Portal Notice</Text>
          <Text style={[styles.guestSubtitle, { color: colors.textMuted }]}>
            The Groomish Now mobile app is designed for customer bookings and retail browsing. Salon bookings and stylist schedules are managed via the Groomish Now Web Portal.
          </Text>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => router.push({ pathname: '/(tabs)/services', params: { tab: 'products' } } as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={16} color={Colors.white} />
            <Text style={styles.guestLoginText}>Browse Retail Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ─── UNIVERSAL TOP HEADER ─── */}
      <TopHeader showBranchSelector={true} />

      {/* ─── HEADER ─── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Manage and view your scheduled salon treatments
          </Text>
        </View>
      </View>

      {/* ─── 3 STATUS TABS (UPCOMING, COMPLETED, CANCELLED) ─── */}
      <View style={[styles.tabsRow, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const count = bookings.filter((b) => {
            const st = (b.status || '').toUpperCase();
            if (tab === 'UPCOMING') return st === 'CONFIRMED' || st === 'PENDING' || st === 'MODIFIED';
            if (tab === 'COMPLETED') return st === 'COMPLETED';
            if (tab === 'CANCELLED') return st === 'CANCELLED';
            return false;
          }).length;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                { backgroundColor: colors.bg },
                isSelected && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: colors.textSecondary },
                  isSelected && styles.tabBtnTextActive,
                ]}
              >
                {tab === 'UPCOMING' ? 'Upcoming' : tab === 'COMPLETED' ? 'Completed' : 'Cancelled'}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: isDark ? '#334155' : '#EAE8E2' },
                  isSelected && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: colors.text },
                    isSelected && styles.tabBadgeTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── BOOKINGS LIST ─── */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => String(item.id || item.bookingCode)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.orange}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === 'UPCOMING'
                  ? 'No upcoming salon bookings'
                  : activeTab === 'COMPLETED'
                  ? 'No completed bookings yet'
                  : 'No cancelled bookings'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {activeTab === 'UPCOMING'
                  ? 'Treat yourself today! Choose signature hair, beard or skin rituals.'
                  : 'Your visit history and styling receipts will show here.'}
              </Text>

              {activeTab === 'UPCOMING' && (
                <TouchableOpacity
                  style={styles.bookNowCta}
                  onPress={() => router.push('/(tabs)/services' as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowCtaText}>Book New Visit</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const serviceList = item.items || item.bookingItems || [];
            const productList = item.products || item.bookingProducts || [];
            const totalCount = serviceList.length + productList.length;

            let primaryName = '';
            if (serviceList.length > 0) {
              const first = serviceList[0];
              primaryName = first?.serviceNameSnapshot || first?.serviceName || first?.name || '';
              if (first?.subServiceName && !primaryName.includes(`(${first.subServiceName})`)) {
                primaryName = `${primaryName} (${first.subServiceName})`;
              }
            }
            if (!primaryName && productList.length > 0) {
              primaryName = productList[0]?.productName || productList[0]?.name || productList[0]?.productNameSnapshot || '';
            }
            if (!primaryName && item.serviceName) {
              primaryName = item.serviceName;
            }
            if (!primaryName) {
              primaryName = 'Salon Visit';
            }

            const extraCount = totalCount > 1 ? totalCount - 1 : 0;

            return (
              <TouchableOpacity
                style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.cardTopRow}>
                  <View style={styles.codeWrap}>
                    <Ionicons name="receipt-outline" size={14} color={Colors.orange} />
                    <Text style={[styles.bookingCode, { color: colors.text }]}>
                      {item.bookingCode || `GN-${String(item.id).slice(0, 8).toUpperCase()}`}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Date & Time (12-hour AM/PM format) */}
                <View style={styles.scheduleRow}>
                  <Ionicons name="time" size={15} color={Colors.orange} />
                  <Text style={[styles.scheduleText, { color: colors.text }]}>
                    {format12HourDateTime(item.scheduledAt)}
                  </Text>
                </View>

                {/* Branch name */}
                <View style={styles.branchRow}>
                  <Ionicons name="storefront-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.branchText, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.storeName || item.store?.name || 'Groomish Salon Studio'}
                  </Text>
                </View>

                {/* Service summary */}
                <View style={[styles.summaryBox, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={1}>
                    {primaryName}
                    {extraCount > 0 && (
                      <Text style={styles.extraItemsText}> +{extraCount}</Text>
                    )}
                  </Text>
                </View>

                {/* Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
                  <View>
                    <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Payable</Text>
                    <Text style={[styles.priceAmount, { color: colors.text }]}>
                      ₹{item.pricePaid ?? item.totalAmount ?? (item.items?.reduce((sum: number, it: any) => sum + (it.price ?? it.servicePriceSnapshot ?? 0), 0) || item.finalAmount || item.totalPrice || item.subtotal || 0)}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/booking/[id]',
                          params: { id: String(item.id || item.bookingCode) },
                        } as any)
                      }
                    >
                      <Text style={styles.detailsBtnText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.orange} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.slate,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slateLight,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F0EC',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: Colors.orange,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  tabBtnTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    backgroundColor: '#EAE8E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.slate,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEAE4',
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bookingCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.slate,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  branchText: {
    fontSize: 11,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  summaryBox: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
  },
  extraItemsText: {
    color: Colors.orange,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F0EC',
  },
  priceLabel: {
    fontSize: 9,
    color: Colors.slateLight,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  priceAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.slate,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orangeLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  detailsBtnText: {
    color: Colors.orange,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.slate,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.slateLight,
    textAlign: 'center',
    lineHeight: 17,
  },
  bookNowCta: {
    marginTop: 10,
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  bookNowCtaText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  guestIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 12,
    color: Colors.slateLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  guestLoginBtn: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  guestLoginText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
