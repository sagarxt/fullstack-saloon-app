import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to send reset email. Please try again.';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={36} color={Colors.white} />
          </View>
          <Text style={styles.brandName}>Reset Password</Text>
          <Text style={styles.brandTagline}>We'll send you a reset link via email</Text>
        </View>

        <View style={styles.card}>
          {sent ? (
            <View style={styles.successWrap}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.green} />
              <Text style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successSub}>
                Check your inbox for a password reset link. It may take a few minutes to arrive.
              </Text>
              <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>Enter the email associated with your Groomish account.</Text>

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
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Send Reset Link</Text>
                    <Ionicons name="send-outline" size={18} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink}>
                <Text style={styles.cancelText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateDark },
  scroll: { flexGrow: 1, paddingBottom: Spacing['4xl'] },
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
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.orange,
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.orange,
    marginBottom: Spacing.md,
  },
  brandName: {
    fontSize: Typography['2xl'],
    fontWeight: '800', color: Colors.white,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: Typography.sm, color: Colors.slateXLight,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    ...Shadows.lg,
  },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.slate, marginBottom: 4 },
  subtitle: { fontSize: Typography.sm, color: Colors.slateLight, marginBottom: Spacing['2xl'], lineHeight: 20 },
  fieldWrap: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.xs, fontWeight: '700', color: Colors.slate,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.gray200,
    paddingHorizontal: Spacing.md, height: 50,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: Typography.base, color: Colors.slate, height: '100%' },
  submitBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, ...Shadows.orange,
  },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: Typography.md, fontWeight: '700', color: Colors.white },
  cancelLink: { marginTop: Spacing.xl, alignItems: 'center' },
  cancelText: { fontSize: Typography.sm, color: Colors.orange, fontWeight: '600' },
  successWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  successTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.slate, marginTop: Spacing.lg },
  successSub: {
    fontSize: Typography.sm, color: Colors.slateLight,
    textAlign: 'center', lineHeight: 22, marginTop: Spacing.md,
  },
  backToLoginBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md,
    marginTop: Spacing['2xl'], ...Shadows.orange,
  },
  backToLoginText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
});
