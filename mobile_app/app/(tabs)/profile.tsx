import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { customerApi } from '../../api/client';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';

const MENU_ITEMS = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'notifications-outline',
    color: Colors.blue,
    route: null,
  },
  {
    id: 'payments',
    label: 'Payment History',
    icon: 'card-outline',
    color: Colors.green,
    route: null,
  },
  {
    id: 'reviews',
    label: 'My Reviews',
    icon: 'star-outline',
    color: Colors.gold,
    route: null,
  },
  {
    id: 'referrals',
    label: 'Referral Program',
    icon: 'gift-outline',
    color: Colors.orange,
    route: '/(tabs)/rewards',
  },
  {
    id: 'faq',
    label: 'FAQ & Help',
    icon: 'help-circle-outline',
    color: Colors.platinumBlue,
    route: null,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Password change
  const [changingPwd, setChangingPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [profileRes, balRes] = await Promise.allSettled([
        customerApi.getProfile(),
        customerApi.getRewardBalance(),
      ]);
      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value.data;
        setProfile(p);
        setEditName(p.name || p.fullName || '');
        setEditPhone(p.phone || p.phoneNumber || '');
      }
      if (balRes.status === 'fulfilled') setBalance(balRes.value.data);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [isAuthenticated]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setEditLoading(true);
    try {
      await customerApi.updateProfile({ name: editName.trim(), phone: editPhone.trim() });
      Alert.alert('✅ Saved', 'Profile updated successfully.');
      setEditing(false);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile.');
    } finally { setEditLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmNewPwd) {
      Alert.alert('Required', 'Please fill in all password fields.');
      return;
    }
    if (newPwd !== confirmNewPwd) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setPwdLoading(true);
    try {
      await customerApi.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      Alert.alert('✅ Done', 'Password changed successfully.');
      setChangingPwd(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmNewPwd('');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change password.');
    } finally { setPwdLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const tier = balance?.tier || profile?.tier || 'SILVER';
  const coins = balance?.points || 0;
  const displayName = profile?.name || profile?.fullName || user?.name || 'Guest';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.phone || profile?.phoneNumber || user?.phone || '';

  const TIER_EMOJI: Record<string, string> = { SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎', DIAMOND: '💫' };
  const TIER_COLOR: Record<string, string> = { SILVER: Colors.silver, GOLD: Colors.gold, PLATINUM: Colors.platinumBlue, DIAMOND: Colors.coral };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.guestHero}>
            <View style={styles.guestAvatar}>
              <Ionicons name="person-outline" size={44} color={Colors.white} />
            </View>
            <Text style={styles.guestHeroTitle}>Welcome, Guest!</Text>
            <Text style={styles.guestHeroSub}>
              Sign in to manage appointments, earn Groom Coins on visits, and unlock exclusive VIP tier privileges.
            </Text>
            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestPrimaryBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Info Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App & Support</Text>
            <View style={styles.menuList}>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/services')}>
                <View style={[styles.menuIconWrap, { backgroundColor: Colors.orangeLight }]}>
                  <Ionicons name="cut-outline" size={18} color={Colors.orange} />
                </View>
                <Text style={styles.menuLabel}>Browse Salon Services</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.slateXLight} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/shop')}>
                <View style={[styles.menuIconWrap, { backgroundColor: Colors.goldLight }]}>
                  <Ionicons name="sparkles-outline" size={18} color={Colors.gold} />
                </View>
                <Text style={styles.menuLabel}>Explore Retail Store</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.slateXLight} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.versionText}>Groomish Mobile App • v1.0.0 (Expo SDK 57)</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Profile Hero ── */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.tierBadge, { backgroundColor: TIER_COLOR[tier] + '20', borderColor: TIER_COLOR[tier] + '50' }]}>
              <Text style={styles.tierBadgeText}>{TIER_EMOJI[tier]} {tier}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          {displayPhone && <Text style={styles.profilePhone}>📱 {displayPhone}</Text>}

          {/* Coins Summary */}
          <View style={styles.coinsSummary}>
            <TouchableOpacity style={styles.coinsSummaryItem} onPress={() => router.push('/(tabs)/rewards')}>
              <Text style={styles.coinsSummaryValue}>🪙 {coins}</Text>
              <Text style={styles.coinsSummaryLabel}>Coins</Text>
            </TouchableOpacity>
            <View style={styles.coinsDivider} />
            <View style={styles.coinsSummaryItem}>
              <Text style={styles.coinsSummaryValue}>{TIER_EMOJI[tier]}</Text>
              <Text style={styles.coinsSummaryLabel}>{tier} Tier</Text>
            </View>
            <View style={styles.coinsDivider} />
            <View style={styles.coinsSummaryItem}>
              <Text style={styles.coinsSummaryValue}>{balance?.lifetimePoints || coins}</Text>
              <Text style={styles.coinsSummaryLabel}>Lifetime</Text>
            </View>
          </View>
        </View>

        {/* ── Edit Profile ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <TouchableOpacity
              onPress={() => {
                if (editing) setEditing(false);
                else setEditing(true);
              }}
              style={styles.editBtn}
            >
              <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={16} color={Colors.orange} />
              <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={16} color={Colors.slateLight} style={{ marginRight: Spacing.sm }} />
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Your name"
                    placeholderTextColor={Colors.slateXLight}
                  />
                </View>
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={16} color={Colors.slateLight} style={{ marginRight: Spacing.sm }} />
                  <TextInput
                    style={styles.input}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Your phone number"
                    placeholderTextColor={Colors.slateXLight}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, editLoading && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={Colors.slateLight} />
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{displayName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={16} color={Colors.slateLight} />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{displayEmail}</Text>
              </View>
              {displayPhone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color={Colors.slateLight} />
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{displayPhone}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Change Password ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setChangingPwd((v) => !v)}
          >
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Ionicons name={changingPwd ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.slateLight} />
          </TouchableOpacity>

          {changingPwd && (
            <View style={styles.editForm}>
              {[
                { label: 'Current Password', value: currentPwd, setter: setCurrentPwd },
                { label: 'New Password', value: newPwd, setter: setNewPwd },
                { label: 'Confirm New Password', value: confirmNewPwd, setter: setConfirmNewPwd },
              ].map((field) => (
                <View key={field.label} style={styles.fieldWrap}>
                  <Text style={styles.label}>{field.label}</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={16} color={Colors.slateLight} style={{ marginRight: Spacing.sm }} />
                    <TextInput
                      style={styles.input}
                      value={field.value}
                      onChangeText={field.setter}
                      secureTextEntry
                      placeholder="••••••••"
                      placeholderTextColor={Colors.slateXLight}
                    />
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.saveBtn, pwdLoading && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={pwdLoading}
              >
                {pwdLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Quick Links ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, idx === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => item.route ? router.push(item.route as any) : null}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.slateXLight} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Groomish v1.0.0 • Built with 💈 Love</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: Spacing['5xl'] },

  // Hero
  profileHero: {
    backgroundColor: Colors.slateDark,
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  avatarWrap: { alignItems: 'center', marginBottom: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.orange,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.white,
    ...Shadows.orange,
  },
  avatarText: { fontSize: Typography['3xl'], fontWeight: '900', color: Colors.white },
  tierBadge: {
    marginTop: Spacing.sm, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1,
  },
  tierBadgeText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.white },
  profileName: { fontSize: Typography.xl, fontWeight: '800', color: Colors.white, marginTop: Spacing.sm },
  profileEmail: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  profilePhone: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  coinsSummary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl, padding: Spacing.md,
    marginTop: Spacing.xl,
    width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  coinsSummaryItem: { flex: 1, alignItems: 'center' },
  coinsSummaryValue: { fontSize: Typography.base, fontWeight: '800', color: Colors.white },
  coinsSummaryLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  coinsDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Section
  section: {
    margin: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.md, fontWeight: '800', color: Colors.slate },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.md, backgroundColor: Colors.orangeLight,
  },
  editBtnText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.orange },

  // Info List
  infoList: { gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { fontSize: Typography.sm, color: Colors.slateLight, width: 56 },
  infoValue: { flex: 1, fontSize: Typography.sm, fontWeight: '700', color: Colors.slate },

  // Edit Form
  editForm: { gap: Spacing.md },
  fieldWrap: {},
  label: {
    fontSize: Typography.xs, fontWeight: '700', color: Colors.slate,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.gray200,
    paddingHorizontal: Spacing.md, height: 46,
  },
  input: { flex: 1, fontSize: Typography.base, color: Colors.slate },
  saveBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    height: 48, alignItems: 'center', justifyContent: 'center', ...Shadows.orange,
  },
  saveBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },

  // Menu
  menuList: {
    borderWidth: 1, borderColor: Colors.gray100,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: Typography.base, fontWeight: '600', color: Colors.slate },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl, height: 52,
    borderWidth: 2, borderColor: Colors.red + '50',
    backgroundColor: Colors.redLight,
  },
  logoutText: { fontSize: Typography.base, fontWeight: '700', color: Colors.red },

  versionText: {
    textAlign: 'center', fontSize: Typography.xs,
    color: Colors.slateXLight, marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },

  // Guest Mode
  guestHero: {
    backgroundColor: Colors.slateDark,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
  },
  guestAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.orange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.orange,
  },
  guestHeroTitle: {
    fontSize: Typography['2xl'], fontWeight: '800',
    color: Colors.white, marginBottom: Spacing.xs,
  },
  guestHeroSub: {
    fontSize: Typography.sm, color: Colors.slateLight,
    textAlign: 'center', lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  guestPrimaryBtn: {
    width: '100%', height: 50, borderRadius: Radius.xl,
    backgroundColor: Colors.orange, alignItems: 'center',
    justifyContent: 'center', ...Shadows.orange,
  },
  guestPrimaryBtnText: {
    fontSize: Typography.base, fontWeight: '700',
    color: Colors.white,
  },
});
