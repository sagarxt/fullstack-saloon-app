import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, ImageBackground, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { customerApi, publicApi } from '../../api/client';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';

const TIER_COLORS: Record<string, string> = {
  SILVER: Colors.silver,
  GOLD: Colors.gold,
  PLATINUM: Colors.platinumBlue,
  DIAMOND: Colors.coral,
};

const TIER_EMOJI: Record<string, string> = {
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
  DIAMOND: '💫',
};

const QUICK_ACTIONS = [
  { id: 'book', label: 'Book Now', icon: 'calendar-outline', route: '/(tabs)/services', color: Colors.orange },
  { id: 'bookings', label: 'My Bookings', icon: 'receipt-outline', route: '/(tabs)/bookings', color: Colors.blue },
  { id: 'rewards', label: 'Rewards', icon: 'gift-outline', route: '/(tabs)/rewards', color: Colors.green },
  { id: 'vouchers', label: 'Vouchers', icon: 'ticket-outline', route: '/(tabs)/rewards', color: Colors.gold },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [balRes, notifRes, svcRes, unreadRes] = await Promise.allSettled([
        customerApi.getRewardBalance(),
        customerApi.getNotifications(0, 5),
        publicApi.getServices(),
        customerApi.getUnreadCount(),
      ]);
      if (balRes.status === 'fulfilled') setBalance(balRes.value.data);
      if (notifRes.status === 'fulfilled') {
        const d = notifRes.value.data;
        setNotifications(Array.isArray(d) ? d.slice(0, 5) : d?.content?.slice(0, 5) || []);
      }
      if (svcRes.status === 'fulfilled') {
        const d = svcRes.value.data;
        setServices(Array.isArray(d) ? d.slice(0, 6) : d?.content?.slice(0, 6) || []);
      }
      if (unreadRes.status === 'fulfilled') setUnreadCount(unreadRes.value.data?.count || 0);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const tier = balance?.tier || 'SILVER';
  const coins = balance?.points || 0;
  const pendingCoins = balance?.pendingPoints || 0;
  const lifetimeCoins = balance?.lifetimePoints || coins;
  const firstName = user?.name?.split(' ')[0] || 'Guest';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Header ─── */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.slate} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── VIP Coin Card ─── */}
        <View style={styles.coinCard}>
          <View style={styles.coinCardBg}>
            <View style={[styles.coinCardBgCircle, { top: -40, right: -20, opacity: 0.15 }]} />
            <View style={[styles.coinCardBgCircle, { bottom: -30, left: 20, width: 100, height: 100, opacity: 0.10 }]} />
          </View>
          <View style={styles.coinCardContent}>
            <View style={styles.tierBadge}>
              <Text style={styles.tierEmoji}>{TIER_EMOJI[tier] || '🥈'}</Text>
              <Text style={styles.tierText}>{tier} Member</Text>
            </View>
            <View style={styles.coinMainRow}>
              <Text style={styles.coinEmoji}>🪙</Text>
              <Text style={styles.coinBalance}>{coins.toLocaleString()}</Text>
              <Text style={styles.coinLabel}>Groom Coins</Text>
            </View>
            {pendingCoins > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>+{pendingCoins} pending</Text>
              </View>
            )}
            <View style={styles.coinStatsRow}>
              <View style={styles.coinStat}>
                <Text style={styles.coinStatValue}>{lifetimeCoins}</Text>
                <Text style={styles.coinStatLabel}>Lifetime Coins</Text>
              </View>
              <View style={styles.coinStatDivider} />
              <View style={styles.coinStat}>
                <Text style={styles.coinStatValue}>{coins}</Text>
                <Text style={styles.coinStatLabel}>Available</Text>
              </View>
              <View style={styles.coinStatDivider} />
              <TouchableOpacity style={styles.coinStat} onPress={() => router.push('/(tabs)/rewards')}>
                <Text style={[styles.coinStatValue, { color: Colors.gold }]}>Redeem</Text>
                <Text style={styles.coinStatLabel}>Rewards</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── Quick Actions ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickAction, { borderColor: action.color + '30' }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Popular Services ─── */}
        {services.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Services</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {services.map((svc: any) => (
                <TouchableOpacity key={svc.id} style={styles.svcCard} activeOpacity={0.85}>
                  <View style={styles.svcImagePlaceholder}>
                    <Ionicons name="cut-outline" size={32} color={Colors.orange} />
                  </View>
                  <View style={styles.svcCardBody}>
                    <Text style={styles.svcName} numberOfLines={1}>{svc.name || svc.serviceName}</Text>
                    <Text style={styles.svcDuration}>{svc.duration ? `${svc.duration} min` : 'Duration varies'}</Text>
                    <View style={styles.svcPriceRow}>
                      <Text style={styles.svcPrice}>₹{svc.price?.toLocaleString() || 'View price'}</Text>
                      <View style={styles.svcCoinBadge}>
                        <Text style={styles.svcCoinBadgeText}>🪙 Earn Coins</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Recent Notifications ─── */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
            </View>
            {notifications.slice(0, 3).map((notif: any) => (
              <View key={notif.id} style={[styles.notifCard, !notif.seen && styles.notifCardUnread]}>
                <View style={[styles.notifDot, !notif.seen && styles.notifDotActive]} />
                <View style={styles.notifBody}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{notif.title || 'Notification'}</Text>
                  <Text style={styles.notifMsg} numberOfLines={2}>{notif.message || notif.body}</Text>
                  <Text style={styles.notifTime}>
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── Tier Benefits Teaser ─── */}
        <View style={styles.section}>
          <View style={styles.tierBenefitCard}>
            <View style={styles.tierBenefitIcon}>
              <Text style={{ fontSize: 24 }}>{TIER_EMOJI[tier] || '🥈'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierBenefitTitle}>{tier} Tier Benefits</Text>
              <Text style={styles.tierBenefitSub}>
                {tier === 'SILVER' && 'Earn 1 Groom Coin per ₹100 spent. Keep booking to unlock Gold!'}
                {tier === 'GOLD' && 'Earn 1.25x Groom Coins + priority booking slots!'}
                {tier === 'PLATINUM' && 'Earn 1.5x Groom Coins + senior stylist preference!'}
                {tier === 'DIAMOND' && 'Earn 2.0x Groom Coins + concierge service!'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/rewards')}>
              <Ionicons name="chevron-forward" size={20} color={Colors.orange} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: Spacing['3xl'] },

  // Header
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  greeting: { fontSize: Typography.sm, color: Colors.slateLight, fontWeight: '500' },
  userName: { fontSize: Typography.xl, fontWeight: '800', color: Colors.slate },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray100,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.red,
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white },

  // Coin Card
  coinCard: {
    margin: Spacing.xl,
    backgroundColor: Colors.slateDark,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  },
  coinCardBg: { ...StyleSheet.absoluteFill },
  coinCardBgCircle: {
    position: 'absolute',
    width: 150, height: 150,
    borderRadius: 75,
    backgroundColor: Colors.orange,
  },
  coinCardContent: { padding: Spacing['2xl'] },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  tierEmoji: { fontSize: 14 },
  tierText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.white },
  coinMainRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  coinEmoji: { fontSize: 32 },
  coinBalance: {
    fontSize: 42, fontWeight: '900', color: Colors.gold,
    letterSpacing: -1,
  },
  coinLabel: {
    fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)',
    fontWeight: '600', alignSelf: 'flex-end', marginBottom: 6,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,168,67,0.2)',
    borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)',
    paddingHorizontal: Spacing.md, paddingVertical: 3, marginBottom: Spacing.lg,
  },
  pendingText: { fontSize: Typography.xs, color: Colors.gold, fontWeight: '700' },
  coinStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.md, padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  coinStat: { flex: 1, alignItems: 'center' },
  coinStatValue: { fontSize: Typography.base, fontWeight: '800', color: Colors.white },
  coinStatLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: 2 },
  coinStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Sections
  section: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.md, fontWeight: '800', color: Colors.slate, marginBottom: Spacing.md },
  seeAll: { fontSize: Typography.sm, color: Colors.orange, fontWeight: '700' },

  // Quick Actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  quickAction: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  quickIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.slate, textAlign: 'center' },

  // Service Cards
  hScroll: { marginLeft: -Spacing.sm },
  svcCard: {
    width: 160,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginLeft: Spacing.sm,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    ...Shadows.md,
  },
  svcImagePlaceholder: {
    height: 100,
    backgroundColor: Colors.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svcCardBody: { padding: Spacing.md },
  svcName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.slate },
  svcDuration: { fontSize: Typography.xs, color: Colors.slateLight, marginTop: 2 },
  svcPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  svcPrice: { fontSize: Typography.base, fontWeight: '800', color: Colors.orange },
  svcCoinBadge: {
    backgroundColor: Colors.goldLight, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  svcCoinBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.goldDark },

  // Notifications
  notifCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.gray200,
    ...Shadows.sm,
  },
  notifCardUnread: { borderColor: Colors.orange + '40', backgroundColor: Colors.orangeLight },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.gray300,
    marginTop: 6, flexShrink: 0,
  },
  notifDotActive: { backgroundColor: Colors.orange },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.slate },
  notifMsg: { fontSize: Typography.xs, color: Colors.slateLight, marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: Typography.xs, color: Colors.slateXLight, marginTop: 4 },

  // Tier Benefit
  tierBenefitCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.gray200,
    ...Shadows.sm,
  },
  tierBenefitIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center', alignItems: 'center',
  },
  tierBenefitTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.slate },
  tierBenefitSub: { fontSize: Typography.xs, color: Colors.slateLight, marginTop: 2, lineHeight: 18 },
});
