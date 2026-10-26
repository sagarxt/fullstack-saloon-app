import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(cleanEmail, cleanPassword);
    } catch (e: any) {
      const isStaffRestricted =
        e.code === 'STAFF_ADMIN_RESTRICTED' ||
        e.message === 'STAFF_ADMIN_RESTRICTED' ||
        (typeof e.message === 'string' && e.message.includes('STAFF_ADMIN_RESTRICTED'));

      const isStaffOrAdminEmail =
        cleanEmail.toLowerCase().includes('admin') ||
        cleanEmail.toLowerCase().includes('staff');

      const is401OrForbidden =
        e.response?.status === 401 ||
        e.response?.status === 403;

      if (isStaffRestricted || (is401OrForbidden && isStaffOrAdminEmail)) {
        setShowStaffModal(true);
        return;
      }

      if (is401OrForbidden) {
        const errorMsg = e.response?.data?.message || 'Invalid email or password. Please verify your credentials.';
        Alert.alert('Login Failed', errorMsg);
        return;
      }

      const msg = e.response?.data?.message || e.response?.data || e.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTagline}>Your Premium Salon Experience</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to access your bookings and rewards</Text>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.slateLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.slateXLight}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.slateLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.slateXLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.slateLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.registerBtnText}>Create New Account</Text>
          </TouchableOpacity>

          {/* Browse as Guest */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>Explore Groomish as Guest →</Text>
          </TouchableOpacity>
        </View>

        {/* Groom Coin teaser */}
        <View style={styles.groomCoinTeaser}>
          <Text style={styles.groomCoinEmoji}>🪙</Text>
          <Text style={styles.groomCoinText}>Earn Groom Coins on every visit!</Text>
        </View>
      </ScrollView>

      {/* ─── CUSTOM STAFF / ADMIN RESTRICTED ALERT MODAL ─── */}
      <Modal
        visible={showStaffModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Top Badge Icon */}
            <View style={styles.modalIconCircle}>
              <Ionicons name="desktop-outline" size={32} color={Colors.orange} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Staff & Admin Notice</Text>

            {/* Custom Alert Message */}
            <Text style={styles.modalMessage}>
              Please visit website to access dashboard. Application is made for Customers only.
            </Text>

            <View style={styles.modalInfoPill}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.slateLight} />
              <Text style={styles.modalInfoPillText}>
                Mobile app features and bookings are dedicated for client accounts.
              </Text>
            </View>

            {/* Action 1: Login with Customer */}
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowStaffModal(false);
                setEmail('');
                setPassword('');
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="person-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.modalPrimaryBtnText}>Login with Customer</Text>
            </TouchableOpacity>

            {/* Action 2: Home Page */}
            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => {
                setShowStaffModal(false);
                router.replace('/(tabs)/home');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="home-outline" size={18} color={Colors.slate} />
              <Text style={styles.modalSecondaryBtnText}>Home Page</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.slateDark,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  logoImage: {
    width: 220,
    height: 60,
    marginBottom: Spacing.xs,
  },
  brandTagline: {
    fontSize: Typography.sm,
    color: Colors.slateXLight,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    ...Shadows.lg,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.slate,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.slateLight,
    marginBottom: Spacing['2xl'],
    lineHeight: 20,
  },
  fieldWrap: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.slate,
    height: '100%',
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    fontSize: Typography.sm,
    color: Colors.orange,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.orange,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray200,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.xs,
    color: Colors.slateXLight,
    fontWeight: '500',
  },
  registerBtn: {
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.orange,
  },
  guestBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  guestBtnText: {
    fontSize: Typography.sm,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  groomCoinTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
    gap: Spacing.sm,
  },
  groomCoinEmoji: {
    fontSize: 16,
  },
  groomCoinText: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
  },

  // Staff / Admin Restricted Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.lg,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.slate,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: Typography.base,
    color: Colors.slate,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  modalInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    marginBottom: Spacing.xl,
  },
  modalInfoPillText: {
    fontSize: Typography.xs,
    color: Colors.slateLight,
    flex: 1,
    lineHeight: 16,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: Colors.orange,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  modalPrimaryBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  modalSecondaryBtn: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalSecondaryBtnText: {
    color: Colors.slate,
    fontSize: Typography.base,
    fontWeight: '600',
  },
});
