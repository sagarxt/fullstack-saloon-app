import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { customerApi } from '../../api/client';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isStaffOrAdmin } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [profileRes, balRes, unreadRes] = await Promise.allSettled([
        customerApi.getProfile(),
        customerApi.getRewardBalance(),
        customerApi.getUnreadCount(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value.data;
        setProfile(p);
        setName(p.name || p.fullName || '');
        setPhone(p.phone || p.phoneNumber || '');
        setGender(p.gender ? p.gender.toUpperCase() : 'MALE');
        setDob(p.dob || '');
        setEmail(p.email || user?.email || '');
      }

      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data);
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(Number(unreadRes.value.data) || 0);
      }
    } catch (err) {
      console.warn('Failed to load profile data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await customerApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        gender: gender.toUpperCase(),
        dob: dob.trim() || null,
      });
      Alert.alert('Success', 'Your profile details have been updated successfully.');
      loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update profile.';
      Alert.alert('Update Failed', message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Current Password', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation password do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await customerApi.changePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update password. Please check your current password.';
      Alert.alert('Password Change Failed', message);
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of your Groomish account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const tier = balance?.tier || profile?.tier || 'SILVER';
  const points = balance?.points || 0;
  const lifetimePoints = balance?.lifetimePoints || points;

  const TIER_COLORS: Record<string, string> = {
    SILVER: '#94a3b8',
    GOLD: '#f59e0b',
    PLATINUM: '#06b6d4',
    DIAMOND: '#ec4899',
  };

  const TIER_EMOJIS: Record<string, string> = {
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
    DIAMOND: '💫',
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading Profile...</Text>
      </View>
    );
  }

  // Guest view (without branch option)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.topBar, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
            <Text style={[styles.topBarTitle, { color: colors.text }]}>Account</Text>
          </View>

          {/* Guest Card */}
          <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="person" size={40} color={Colors.white} />
            </View>
            <Text style={[styles.guestTitle, { color: colors.text }]}>Welcome to Groomish Luxury</Text>
            <Text style={[styles.guestSubtitle, { color: colors.textMuted }]}>
              Sign in to manage your bookings, track points & vouchers, and enjoy bespoke salon styling.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>Sign In / Register</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Appearance / Dark Mode Toggle */}
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.themeToggleRow}>
              <View style={styles.themeLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#334155' : '#fef3c7' }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? Colors.orange : Colors.gold} />
                </View>
                <View>
                  <Text style={[styles.menuRowTitle, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.menuRowSubtitle, { color: colors.textMuted }]}>
                    {isDark ? 'Midnight dark theme enabled' : 'Light theme enabled (Default)'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#cbd5e1', true: Colors.orange }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* Quick Links for guest (No branch option) */}
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/(tabs)/services')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#fff7ed' }]}>
                <Ionicons name="cut-outline" size={20} color={Colors.orange} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>Explore Salon Services</Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.textMuted }]}>Hair, beard, facials, and grooming packages</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/(tabs)/policy')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.green} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>Salon Policies & FAQs</Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.textMuted }]}>Terms, cancellation policy & answers</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerNote, { color: colors.textMuted }]}>Groomish Salon App • Version 2.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        {/* ── Top Header (No branch pill as requested!) ── */}
        <View style={[styles.topBar, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>My Profile</Text>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.cardBorder }]}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── VIP Member Card (Always luxury dark aesthetic) ── */}
        <View style={styles.vipCard}>
          <View style={styles.vipTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarInitials}>
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.vipInfo}>
              <View style={styles.vipNameRow}>
                <Text style={styles.vipName} numberOfLines={1}>
                  {name || 'Distinguished Guest'}
                </Text>
              </View>
              <Text style={styles.vipEmailText} numberOfLines={1}>
                {email || user?.email}
              </Text>
              <View
                style={[
                  styles.tierTag,
                  { backgroundColor: isStaffOrAdmin ? '#ffedd5' : `${TIER_COLORS[tier] || Colors.orange}25` },
                ]}
              >
                <Text
                  style={[
                    styles.tierTagText,
                    { color: isStaffOrAdmin ? Colors.orange : (TIER_COLORS[tier] || Colors.orange) },
                  ]}
                >
                  {isStaffOrAdmin ? `🛡️ ${user?.role || 'STAFF'} (BROWSE ONLY)` : `${TIER_EMOJIS[tier] || '⭐'} ${tier} MEMBER`}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => router.push('/(tabs)/rewards')}
              activeOpacity={0.8}
            >
              <Text style={styles.statValue}>🪙 {points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Available Coins</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statValue}>{lifetimePoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Lifetime Earned</Text>
            </View>

            <View style={styles.statDivider} />

            <TouchableOpacity
              style={styles.statCol}
              onPress={() => router.push('/(tabs)/bookings')}
              activeOpacity={0.8}
            >
              <Text style={styles.statValue}>Bookings</Text>
              <Text style={styles.statLabel}>View History →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Staff / Admin Notice Box ── */}
        {isStaffOrAdmin && (
          <View style={[styles.staffNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#fff7ed', borderColor: Colors.orange }]}>
            <Ionicons name="information-circle" size={18} color={Colors.orange} />
            <Text style={[styles.staffNoticeBoxText, { color: isDark ? '#f8fafc' : '#9a3412' }]}>
              You are signed in as Staff/Admin. The mobile app is in product browsing mode. Salon bookings and stylist schedules are managed via the Web Portal.
            </Text>
          </View>
        )}

        {/* ── Appearance & Dark Mode Setting ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.themeToggleRow}>
            <View style={styles.themeLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#334155' : '#fef3c7' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? Colors.orange : Colors.gold} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>Dark Mode</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginTop: 0 }]}>
                  {isDark ? 'Midnight theme is active' : 'Light theme is active (Default)'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: Colors.orange }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* ── Personal Info Section (Editable except email) ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.orange} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Update your profile information below
            </Text>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Email Address - READ ONLY */}
          <View style={styles.inputGroup}>
            <View style={styles.labelWithBadge}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <View style={[styles.lockedBadge, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
                <Text style={[styles.lockedBadgeText, { color: colors.textMuted }]}>Non-editable</Text>
              </View>
            </View>
            <View style={[styles.inputBox, styles.inputBoxDisabled, { backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : '#f1f5f9', borderColor: colors.inputBorder }]}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.textMuted }]}
                value={email}
                editable={false}
                selectTextOnFocus={false}
              />
              <Ionicons name="shield-checkmark" size={18} color={Colors.green} />
            </View>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Your email is permanently linked to your loyalty account & security profile.
            </Text>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Gender Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Gender</Text>
            <View style={styles.genderRow}>
              {['MALE', 'FEMALE', 'OTHER'].map((g) => {
                const isSelected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderChip,
                      { backgroundColor: isSelected ? Colors.orange : colors.inputBg, borderColor: isSelected ? Colors.orange : colors.inputBorder },
                    ]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={
                        g === 'MALE'
                          ? 'male-outline'
                          : g === 'FEMALE'
                          ? 'female-outline'
                          : 'transgender-outline'
                      }
                      size={16}
                      color={isSelected ? Colors.white : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.genderChipText,
                        { color: isSelected ? Colors.white : colors.textSecondary },
                      ]}
                    >
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save Profile Button */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, isSavingProfile && { opacity: 0.7 }]}
            onPress={handleSaveProfile}
            disabled={isSavingProfile}
            activeOpacity={0.85}
          >
            {isSavingProfile ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={18} color={Colors.white} />
                <Text style={styles.primaryActionBtnText}>Save Profile Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Security & Change Password ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowPasswordSection((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-half-outline" size={20} color={Colors.orange} />
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.accordionSub, { color: colors.textMuted }]}>
                  {showPasswordSection ? 'Tap to hide form' : 'Update your account password'}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={[styles.passwordForm, { borderTopColor: colors.divider }]}>
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current Password</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <Ionicons name="key-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputField, { color: colors.text }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showCurrentPass}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)}>
                    <Ionicons
                      name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New Password (min 6 characters)</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputField, { color: colors.text }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showNewPass}
                  />
                  <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                    <Ionicons
                      name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm New Password</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputField, { color: colors.text }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showNewPass}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.passwordSubmitBtn, isChangingPass && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={isChangingPass}
                activeOpacity={0.85}
              >
                {isChangingPass ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={16} color={Colors.white} />
                    <Text style={styles.passwordSubmitBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Quick Services & Navigation (Branch Option Removed!) ── */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="grid-outline" size={20} color={Colors.orange} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account & Services</Text>
            </View>
          </View>

          <View style={[styles.menuCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/(tabs)/bookings')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.gold} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>My Bookings</Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.textMuted }]}>Upcoming, completed & reschedule</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/(tabs)/rewards')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="gift-outline" size={20} color="#ec4899" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>My Vouchers & Rewards</Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.textMuted }]}>Redeem coins, view vouchers & VIP perks</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/(tabs)/cart')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="cart-outline" size={20} color="#0284c7" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>My Booking Bag</Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.textMuted }]}>Review selected treatments and products</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push('/(tabs)/policy')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.green} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuRowTitle, { color: colors.text }]}>Salon Policies & FAQs</Text>
                <Text style={[styles.menuRowSubtitle, { color: colors.textMuted }]}>Terms, cancellation policy & answers</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sign Out Button ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.red} />
          <Text style={styles.logoutButtonText}>Sign Out of Groomish</Text>
        </TouchableOpacity>

        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Groomish Luxury Grooming • App Version 2.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sm,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.orange,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
  },

  // VIP Hero Card (Exclusive luxury dark aesthetic)
  vipCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: Radius['2xl'],
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    padding: Spacing.xl,
    ...Shadows.md,
  },
  vipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
    ...Shadows.orange,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
  },
  vipInfo: {
    flex: 1,
  },
  vipNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vipName: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.white,
  },
  vipEmailText: {
    fontSize: Typography.xs,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 6,
  },
  tierTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  tierTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },

  // Section Card
  sectionCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    marginTop: 2,
  },

  // Theme Toggle Row
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },

  // Input styling
  inputGroup: {
    marginBottom: Spacing.md,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  lockedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputBoxDisabled: {
    opacity: 0.9,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  inputField: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Gender Selector
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  genderChipText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },

  // Primary Action Button
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.orange,
    height: 48,
    borderRadius: Radius.xl,
    marginTop: Spacing.sm,
    ...Shadows.orange,
  },
  primaryActionBtnText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.white,
  },

  // Accordion Header
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionSub: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  passwordForm: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
  },
  passwordSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#3b82f6',
    height: 46,
    borderRadius: Radius.xl,
    marginTop: Spacing.sm,
  },
  passwordSubmitBtnText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.white,
  },

  // Menu List
  menuCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  menuRowSubtitle: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginLeft: 54,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    height: 50,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutButtonText: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.red,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: Typography.xs,
    marginTop: Spacing.sm,
  },

  // Guest Card
  guestCard: {
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.xl,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.md,
  },
  guestIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.orange,
  },
  guestTitle: {
    fontSize: Typography.xl,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  guestSubtitle: {
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing['2xl'],
    height: 48,
    borderRadius: Radius.xl,
    width: '100%',
    ...Shadows.orange,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '800',
  },
  staffNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  staffNoticeBoxText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
});
