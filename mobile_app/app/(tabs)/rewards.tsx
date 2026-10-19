import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { customerApi } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';
import TopHeader from '../../components/TopHeader';

const TIER_MILESTONES = [
  { name: 'SILVER', target: 0, color: Colors.silver, emoji: '🥈', multiplier: '1.0x', perks: 'Standard bookings & OTP receipts' },
  { name: 'GOLD', target: 50, color: Colors.gold, emoji: '🥇', multiplier: '1.25x', perks: 'Complimentary scalp analysis & priority slots' },
  { name: 'PLATINUM', target: 150, color: Colors.platinumBlue, emoji: '💎', multiplier: '1.5x', perks: 'Senior stylist preference & birthday gift' },
  { name: 'DIAMOND', target: 300, color: Colors.diamondCoral, emoji: '💫', multiplier: '2.0x', perks: 'Complimentary head massage & concierge service' },
];

export default function RewardsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isDark, colors } = useTheme();
  const [balance, setBalance] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'redeem' | 'ledger' | 'vouchers'>('overview');

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [balRes, ledgerRes, rewardRes, voucherRes] = await Promise.allSettled([
        customerApi.getRewardBalance(),
        customerApi.getRewardLedger(),
        customerApi.getAvailableRewards(),
        customerApi.getMyVouchers(),
      ]);
      let userRefCode = '';
      if (balRes.status === 'fulfilled') {
        const d = balRes.value.data;
        setBalance(d);
        if (d?.referralCode) {
          userRefCode = d.referralCode;
          setReferralCode(d.referralCode);
        }
      }
      if (ledgerRes.status === 'fulfilled') {
        const d = ledgerRes.value.data;
        setLedger(Array.isArray(d) ? d : d?.content || []);
      }
      if (rewardRes.status === 'fulfilled') {
        const d = rewardRes.value.data;
        setRewards(Array.isArray(d) ? d : d?.content || []);
      }
      if (voucherRes.status === 'fulfilled') {
        const d = voucherRes.value.data;
        setVouchers(Array.isArray(d) ? d : d?.content || []);
      }
      // Fallback referral only after sign in
      if (!userRefCode) {
        try {
          const refRes = await customerApi.getReferralCode();
          if (refRes.data?.referralCode) setReferralCode(refRes.data.referralCode);
        } catch (_) {}
      }
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [isAuthenticated]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleRedeem = async (rewardId: any, cost: number) => {
    const coins = balance?.points || 0;
    if (coins < cost) {
      Alert.alert('Insufficient Coins', `You need ${cost} Groom Coins. You have ${coins}.`);
      return;
    }
    Alert.alert('Confirm Redemption', `Redeem this reward for ${cost} Groom Coins?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Redeem', style: 'default',
        onPress: async () => {
          setRedeemLoading(rewardId);
          try {
            await customerApi.redeemReward(rewardId);
            Alert.alert('🎉 Redeemed!', 'Reward redeemed! Check your notifications for voucher details.');
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to redeem reward.');
          } finally { setRedeemLoading(null); }
        },
      },
    ]);
  };

  const shareReferral = async () => {
    if (!referralCode) return;
    await Share.share({
      message: `Use my Groomish referral code ${referralCode} to sign up and get bonus Groom Coins on your first visit! 💈`,
      title: 'Join Groomish & Earn Coins!',
    });
  };

  const tier = balance?.tier || 'SILVER';
  const coins = balance?.points || 0;
  const pendingCoins = balance?.pendingPoints || 0;
  const lifetimeCoins = balance?.lifetimePoints || coins;
  const currentTierInfo = TIER_MILESTONES.find(t => t.name === tier) || TIER_MILESTONES[0];
  const nextTierInfo = TIER_MILESTONES[TIER_MILESTONES.findIndex(t => t.name === tier) + 1];
  const progressPercent = nextTierInfo ? Math.min(100, Math.round((lifetimeCoins / nextTierInfo.target) * 100)) : 100;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'redeem', label: 'Redeem', icon: 'gift-outline' },
    { id: 'ledger', label: 'History', icon: 'receipt-outline' },
    { id: 'vouchers', label: 'Vouchers', icon: 'ticket-outline' },
  ] as const;

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
        {/* ─── UNIVERSAL TOP HEADER ─── */}
        <TopHeader showBranchSelector={true} />

        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="gift-outline" size={48} color={Colors.orange} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Sign in for Rewards & Referral Code</Text>
          <Text style={[styles.guestSubtitle, { color: colors.textMuted }]}>
            Earn Groom Coins with every salon visit, level up through VIP tiers, and share your personal referral code to earn reward coins!
          </Text>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.88}
          >
            <Ionicons name="log-in-outline" size={18} color={Colors.white} />
            <Text style={styles.guestLoginText}>Login / Register to Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ─── UNIVERSAL TOP HEADER ─── */}
      <TopHeader showBranchSelector={true} />

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.id ? Colors.orange : colors.textMuted} />
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            {/* Coin Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceBgCircle1} />
              <View style={styles.balanceBgCircle2} />
              <View style={styles.balanceContent}>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>{currentTierInfo.emoji} {tier} Member</Text>
                </View>
                <View style={styles.coinsRow}>
                  <Text style={styles.coinEmoji}>🪙</Text>
                  <Text style={styles.coinAmount}>{coins.toLocaleString()}</Text>
                </View>
                <Text style={styles.coinsLabel}>Groom Coins Available</Text>
                {pendingCoins > 0 && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>+{pendingCoins} coins pending confirmation</Text>
                  </View>
                )}
                <View style={styles.lifetimeRow}>
                  <Text style={styles.lifetimeLabel}>🏆 Lifetime Coins: </Text>
                  <Text style={styles.lifetimeValue}>{lifetimeCoins.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Progress to Next Tier */}
            {nextTierInfo && (
              <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>Progress to {nextTierInfo.emoji} {nextTierInfo.name}</Text>
                  <Text style={styles.progressPercent}>{progressPercent}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={[styles.progressSub, { color: colors.textMuted }]}>
                  {Math.max(0, nextTierInfo.target - lifetimeCoins)} more lifetime coins needed
                </Text>
              </View>
            )}

            {/* Tier Benefits Grid */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tier Benefits</Text>
            <View style={styles.tierGrid}>
              {TIER_MILESTONES.map((t) => (
                <View key={t.name} style={[styles.tierCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, tier === t.name && styles.tierCardActive]}>
                  <Text style={styles.tierCardEmoji}>{t.emoji}</Text>
                  <Text style={[styles.tierCardName, { color: t.color }]}>{t.name}</Text>
                  <Text style={[styles.tierCardMultiplier, { color: colors.text }]}>{t.multiplier} Coins</Text>
                  <Text style={[styles.tierCardPerks, { color: colors.textMuted }]}>{t.perks}</Text>
                  {t.target > 0 && <Text style={styles.tierCardTarget}>{t.target}+ coins</Text>}
                </View>
              ))}
            </View>

            {/* Referral Banner */}
            <View style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.referralContent}>
                <View style={styles.referralLeft}>
                  <Text style={[styles.referralTitle, { color: colors.text }]}>🎁 Refer & Earn</Text>
                  <Text style={[styles.referralSub, { color: colors.textMuted }]}>
                    Share your code and earn <Text style={styles.referralHighlight}>10 Groom Coins</Text> for each friend who joins!
                  </Text>
                  {referralCode ? (
                    <View style={[styles.referralCodeWrap, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.referralCodeLabel, { color: colors.textMuted }]}>Your code:</Text>
                      <Text style={styles.referralCode}>{referralCode}</Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={shareReferral}>
                  <Ionicons name="share-social-outline" size={20} color={Colors.white} />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ── REDEEM ── */}
        {activeTab === 'redeem' && (
          <>
            <View style={styles.redeemHeader}>
              <Text style={styles.redeemBalance}>🪙 {coins} Coins Available</Text>
            </View>
            {rewards.length > 0 ? rewards.map((r: any) => {
              const cost = r.pointsRequired ?? r.costPoints ?? 0;
              const canAfford = coins >= cost;
              return (
                <View key={r.id} style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, !canAfford && styles.rewardCardDisabled]}>
                  <View style={styles.rewardCardTop}>
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardBadgeText}>
                        {r.discountPercent ? `${r.discountPercent}% OFF` : (r.type || 'VOUCHER')}
                      </Text>
                    </View>
                    <View style={styles.rewardCostBadge}>
                      <Text style={styles.rewardCostText}>🪙 {cost} Coins</Text>
                    </View>
                  </View>
                  <Text style={[styles.rewardTitle, { color: colors.text }]}>{r.title}</Text>
                  {r.serviceName && (
                    <View style={styles.rewardServiceBadge}>
                      <Ionicons name="cut-outline" size={12} color={Colors.orange} />
                      <Text style={styles.rewardServiceText}>For: {r.serviceName}</Text>
                    </View>
                  )}
                  <Text style={[styles.rewardDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {r.description || `Get ${r.title} on your next visit.`}
                  </Text>
                  {r.validityDays && (
                    <Text style={[styles.rewardValidity, { color: colors.textMuted }]}>
                      <Ionicons name="time-outline" size={11} color={colors.textMuted} /> Valid {r.validityDays} days after redeem
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.redeemBtn, !canAfford && styles.redeemBtnDisabled]}
                    onPress={() => handleRedeem(r.id, cost)}
                    disabled={!canAfford || redeemLoading === r.id}
                  >
                    {redeemLoading === r.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.redeemBtnText}>
                        {canAfford ? `🪙 Redeem for ${cost} Coins` : `Need ${cost - coins} more coins`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }) : (
              <View style={styles.empty}>
                <Ionicons name="gift-outline" size={56} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Rewards Available</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Check back soon for exclusive reward vouchers!</Text>
              </View>
            )}
          </>
        )}

        {/* ── LEDGER ── */}
        {activeTab === 'ledger' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Groom Coins History</Text>
            {ledger.length > 0 ? ledger.map((item: any, idx: number) => {
              const isEarn = item.type === 'EARN' || item.amount > 0;
              return (
                <View key={item.id || idx} style={[styles.ledgerItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.ledgerIcon, { backgroundColor: isEarn ? Colors.greenLight : Colors.redLight }]}>
                    <Ionicons
                      name={isEarn ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={16}
                      color={isEarn ? Colors.green : Colors.red}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ledgerDesc, { color: colors.text }]}>{item.description || item.reason || (isEarn ? 'Coins Earned' : 'Coins Redeemed')}</Text>
                    <Text style={[styles.ledgerDate, { color: colors.textMuted }]}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </Text>
                  </View>
                  <Text style={[styles.ledgerAmount, { color: isEarn ? Colors.green : Colors.red }]}>
                    {isEarn ? '+' : '-'}{Math.abs(item.amount || item.points || 0)} 🪙
                  </Text>
                </View>
              );
            }) : (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No History Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Coins are credited after your bookings are confirmed.</Text>
              </View>
            )}
          </>
        )}

        {/* ── VOUCHERS ── */}
        {activeTab === 'vouchers' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Vouchers</Text>
            {vouchers.length > 0 ? vouchers.map((v: any, idx: number) => {
              const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
              const isUsed = v.status === 'USED' || v.used;
              return (
                <View key={v.id || idx} style={[styles.voucherCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, (isExpired || isUsed) && styles.voucherCardDim]}>
                  <View style={styles.voucherTop}>
                    <View style={styles.voucherCodeWrap}>
                      <Text style={[styles.voucherCodeLabel, { color: colors.textMuted }]}>Code</Text>
                      <Text style={styles.voucherCode}>{v.code || v.voucherCode || '––'}</Text>
                    </View>
                    <View style={[styles.voucherStatusBadge, isUsed ? styles.voucherUsed : isExpired ? styles.voucherExpired : styles.voucherActive]}>
                      <Text style={styles.voucherStatusText}>{isUsed ? 'Used' : isExpired ? 'Expired' : 'Active'}</Text>
                    </View>
                  </View>
                  <Text style={[styles.voucherTitle, { color: colors.text }]}>{v.title || v.rewardTitle || 'Voucher'}</Text>
                  {v.discountPercent && (
                    <Text style={styles.voucherDiscount}>{v.discountPercent}% OFF</Text>
                  )}
                  {v.expiresAt && (
                    <Text style={[styles.voucherExpiry, { color: colors.textMuted }]}>
                      Expires: {new Date(v.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  )}
                </View>
              );
            }) : (
              <View style={styles.empty}>
                <Ionicons name="ticket-outline" size={56} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Vouchers Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Redeem your Groom Coins for exclusive vouchers!</Text>
                <TouchableOpacity style={styles.bookNowBtn} onPress={() => setActiveTab('redeem')}>
                  <Text style={styles.bookNowBtnText}>Browse Rewards</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.lg },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: Colors.orangeLight },
  tabText: { fontSize: 11, fontWeight: '600', color: Colors.slateXLight },
  tabTextActive: { color: Colors.orange, fontWeight: '700' },

  // Balance Card
  balanceCard: {
    backgroundColor: Colors.slateDark,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Shadows.lg,
    position: 'relative',
  },
  balanceBgCircle1: {
    position: 'absolute', top: -30, right: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.orange, opacity: 0.15,
  },
  balanceBgCircle2: {
    position: 'absolute', bottom: -20, left: 10,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.gold, opacity: 0.10,
  },
  balanceContent: { padding: Spacing['2xl'] },
  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  tierPillText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.white },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  coinEmoji: { fontSize: 28 },
  coinAmount: { fontSize: 40, fontWeight: '900', color: Colors.gold, letterSpacing: -1 },
  coinsLabel: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginBottom: Spacing.md },
  pendingBadge: {
    backgroundColor: 'rgba(212,168,67,0.2)', borderRadius: Radius.full,
    alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)', marginBottom: Spacing.sm,
  },
  pendingText: { fontSize: Typography.xs, color: Colors.gold, fontWeight: '700' },
  lifetimeRow: { flexDirection: 'row', alignItems: 'center' },
  lifetimeLabel: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.5)' },
  lifetimeValue: { fontSize: Typography.sm, fontWeight: '800', color: Colors.white },

  // Progress
  progressCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadows.sm,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  progressTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.slate },
  progressPercent: { fontSize: Typography.sm, fontWeight: '800', color: Colors.orange },
  progressBar: { height: 10, backgroundColor: Colors.gray100, borderRadius: Radius.full, overflow: 'hidden', marginBottom: 6 },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.orange,
    borderRadius: Radius.full,
    minWidth: 10,
  },
  progressSub: { fontSize: Typography.xs, color: Colors.slateLight },

  // Tier Grid
  sectionTitle: { fontSize: Typography.md, fontWeight: '800', color: Colors.slate, marginBottom: Spacing.sm },
  tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tierCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 2, borderColor: Colors.gray200,
    ...Shadows.sm,
  },
  tierCardActive: { borderColor: Colors.orange, backgroundColor: Colors.orangeLight },
  tierCardEmoji: { fontSize: 22, marginBottom: 4 },
  tierCardName: { fontSize: Typography.sm, fontWeight: '800', textTransform: 'uppercase' },
  tierCardMultiplier: { fontSize: Typography.base, fontWeight: '900', color: Colors.slate, marginBottom: 2 },
  tierCardPerks: { fontSize: Typography.xs, color: Colors.slateLight, lineHeight: 16 },
  tierCardTarget: { fontSize: Typography.xs, color: Colors.slateXLight, marginTop: 4, fontWeight: '600' },

  // Referral
  referralCard: {
    backgroundColor: Colors.orange, borderRadius: Radius['2xl'],
    ...Shadows.orange, overflow: 'hidden',
  },
  referralContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.xl, gap: Spacing.md,
  },
  referralLeft: { flex: 1 },
  referralTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  referralSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  referralHighlight: { fontWeight: '800', color: Colors.gold },
  referralCodeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  referralCodeLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  referralCode: {
    fontFamily: 'monospace', fontSize: Typography.lg,
    fontWeight: '900', color: Colors.gold, letterSpacing: 2,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  shareBtnText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.white },

  // Redeem
  redeemHeader: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.gray100, ...Shadows.sm,
  },
  redeemBalance: { fontSize: Typography.lg, fontWeight: '800', color: Colors.slate },
  rewardCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadows.md,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  rewardCardDisabled: { opacity: 0.65 },
  rewardCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  rewardBadge: {
    backgroundColor: Colors.orangeLight, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  rewardBadgeText: { fontSize: Typography.xs, fontWeight: '800', color: Colors.orange, textTransform: 'uppercase' },
  rewardCostBadge: {
    backgroundColor: Colors.goldLight, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  rewardCostText: { fontSize: Typography.xs, fontWeight: '800', color: Colors.goldDark },
  rewardTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.slate, marginBottom: 4 },
  rewardServiceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.orangeLight,
    borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.orange + '30',
  },
  rewardServiceText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.orange },
  rewardDesc: { fontSize: Typography.sm, color: Colors.slateLight, lineHeight: 18, marginBottom: Spacing.sm },
  rewardValidity: { fontSize: Typography.xs, color: Colors.slateXLight, marginBottom: Spacing.sm },
  redeemBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', ...Shadows.orange,
  },
  redeemBtnDisabled: { backgroundColor: Colors.gray200, ...Shadows.sm },
  redeemBtnText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.white },

  // Ledger
  ledgerItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadows.sm,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  ledgerIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  ledgerDesc: { fontSize: Typography.sm, fontWeight: '600', color: Colors.slate },
  ledgerDate: { fontSize: Typography.xs, color: Colors.slateXLight, marginTop: 2 },
  ledgerAmount: { fontSize: Typography.base, fontWeight: '800' },

  // Vouchers
  voucherCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadows.md,
    borderWidth: 1, borderColor: Colors.gray100,
    borderStyle: 'dashed',
  },
  voucherCardDim: { opacity: 0.6 },
  voucherTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  voucherCodeWrap: {},
  voucherCodeLabel: { fontSize: Typography.xs, color: Colors.slateXLight, fontWeight: '600' },
  voucherCode: { fontFamily: 'monospace', fontSize: Typography.lg, fontWeight: '900', color: Colors.slate, letterSpacing: 2 },
  voucherStatusBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  voucherActive: { backgroundColor: Colors.greenLight },
  voucherUsed: { backgroundColor: Colors.gray200 },
  voucherExpired: { backgroundColor: Colors.redLight },
  voucherStatusText: { fontSize: Typography.xs, fontWeight: '700' },
  voucherTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.slate },
  voucherDiscount: { fontSize: Typography.xl, fontWeight: '900', color: Colors.orange, marginTop: 2 },
  voucherExpiry: { fontSize: Typography.xs, color: Colors.slateLight, marginTop: 6 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: Spacing['5xl'] },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.slate, marginTop: Spacing.lg },
  emptyText: { fontSize: Typography.sm, color: Colors.slateLight, marginTop: 6, textAlign: 'center' },
  bookNowBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, marginTop: Spacing.xl, ...Shadows.orange,
  },
  bookNowBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  guestIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Shadows.sm,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.slate,
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: Colors.slateLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    ...Shadows.orange,
  },
  guestLoginText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
