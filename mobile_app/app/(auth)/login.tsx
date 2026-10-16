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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Oops!', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
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
});
