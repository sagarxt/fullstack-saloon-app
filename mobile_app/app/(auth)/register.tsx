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
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPwd) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data || e.message || 'Registration failed.';
      Alert.alert('Registration Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </TouchableOpacity>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTagline}>Create your account & start earning Groom Coins</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in the details below to get started</Text>

          {/* Full Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={Colors.slateLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={Colors.slateXLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email Address *</Text>
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
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.slateLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.slateXLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.slateLight} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={[styles.inputRow, confirmPwd && password !== confirmPwd && styles.inputError]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.slateLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Re-enter password"
                placeholderTextColor={Colors.slateXLight}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry={!showConfirmPwd}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowConfirmPwd((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.slateLight} />
              </TouchableOpacity>
            </View>
            {confirmPwd && password !== confirmPwd && (
              <Text style={styles.errorText}>Passwords don't match</Text>
            )}
          </View>

          {/* Referral Code (optional) */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Referral Code <Text style={styles.optional}>(Optional)</Text></Text>
            <View style={styles.inputRow}>
              <Ionicons name="gift-outline" size={18} color={Colors.slateLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter a friend's code to get bonus coins"
                placeholderTextColor={Colors.slateXLight}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.registerBtnText}>Create Account</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          {/* Groom Coin bonus teaser */}
          <View style={styles.bonusTeaser}>
            <Text style={styles.bonusEmoji}>🪙</Text>
            <Text style={styles.bonusText}>
              Earn <Text style={styles.bonusHighlight}>bonus Groom Coins</Text> with a valid referral code!
            </Text>
          </View>

          {/* Login Link */}
          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 60,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: Spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 220,
    height: 60,
    marginBottom: Spacing.xs,
  },
  brandTagline: {
    fontSize: Typography.sm,
    color: Colors.slateXLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    ...Shadows.lg,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.slate,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.slateLight,
    marginBottom: Spacing['2xl'],
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
  optional: {
    color: Colors.slateXLight,
    fontWeight: '400',
    textTransform: 'none',
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
  inputError: {
    borderColor: Colors.red,
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
  errorText: {
    fontSize: Typography.xs,
    color: Colors.red,
    marginTop: 4,
    marginLeft: 4,
  },
  registerBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    ...Shadows.orange,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  registerBtnText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.white,
  },
  bonusTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  bonusEmoji: {
    fontSize: 16,
  },
  bonusText: {
    fontSize: Typography.sm,
    color: Colors.goldDark,
    fontWeight: '500',
    flexShrink: 1,
  },
  bonusHighlight: {
    fontWeight: '700',
    color: Colors.gold,
  },
  loginLink: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: Typography.sm,
    color: Colors.slateLight,
  },
  loginLinkHighlight: {
    color: Colors.orange,
    fontWeight: '700',
  },
});
