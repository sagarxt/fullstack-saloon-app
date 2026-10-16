import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '../theme/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    badge: 'LUXURY SALON EXPERIENCE',
    title: 'Precision Styling & Spa Treatments',
    description:
      'Book top-rated stylists, customized hair & beard care, and rejuvenating salon treatments across our premium branches.',
    iconName: 'cut-outline' as const,
    accentColor: Colors.orange,
    highlights: ['Verified Top Stylists', 'Live Slot Availability', 'Branch Geolocation'],
    emoji: '✂️',
  },
  {
    id: '2',
    badge: 'CURATED BEAUTY & CARE',
    title: 'Salon-Grade Retail Products',
    description:
      'Explore premium haircare serums, beard oils, styling clays, and skincare essentials directly from our official catalog.',
    iconName: 'sparkles-outline' as const,
    accentColor: Colors.gold,
    highlights: ['100% Authentic Products', 'In-Store Pickup & Delivery', 'Exclusive Member Discounts'],
    emoji: '✨',
  },
  {
    id: '3',
    badge: 'GROOM COINS & PERKS',
    title: 'Earn Coins on Every Visit',
    description:
      'Earn 1 Groom Coin for every ₹100 spent. Level up from Silver to Diamond tier and redeem free haircuts, spa days, and VIP gifts.',
    iconName: 'gift-outline' as const,
    accentColor: Colors.coral,
    highlights: ['Instant Referral Bonuses', 'Tier Milestone Upgrades', '100% Redeemable Vouchers'],
    emoji: '🪙',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('groomish_has_seen_onboarding');
        if (hasSeen === 'true') {
          router.replace('/(tabs)/home');
          return;
        }
      } catch (_) {}
      if (isMounted) setChecking(false);
    })();
    return () => { isMounted = false; };
  }, [router]);

  const handleFinishOnboarding = async (targetRoute: '/(tabs)/home' | '/(auth)/login' = '/(tabs)/home') => {
    try {
      await AsyncStorage.setItem('groomish_has_seen_onboarding', 'true');
    } catch (_) {}
    router.replace(targetRoute as any);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIdx * width, animated: true });
      setCurrentIndex(nextIdx);
    } else {
      handleFinishOnboarding('/(tabs)/home');
    }
  };

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    if (idx !== currentIndex && idx >= 0 && idx < SLIDES.length) {
      setCurrentIndex(idx);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Top Bar with Logo & Skip */}
      <View style={styles.topBar}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => handleFinishOnboarding('/(tabs)/home')}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides Horizontal Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.slider}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            {/* Visual Hero Card */}
            <View style={styles.heroCard}>
              <View style={[styles.heroGlow, { backgroundColor: slide.accentColor }]} />
              <View style={[styles.iconCircle, { backgroundColor: slide.accentColor }]}>
                <Text style={styles.heroEmoji}>{slide.emoji}</Text>
              </View>
              <View style={styles.badgeWrap}>
                <Text style={[styles.badgeText, { color: slide.accentColor }]}>
                  {slide.badge}
                </Text>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.textSection}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>

              {/* Highlights Pill List */}
              <View style={styles.highlightsContainer}>
                {slide.highlights.map((h, i) => (
                  <View key={i} style={styles.highlightPill}>
                    <Ionicons name="checkmark-circle" size={16} color={slide.accentColor} />
                    <Text style={styles.highlightText}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? 'Explore Groomish →' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        {/* Existing Account Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => handleFinishOnboarding('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slateDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.slateDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    height: 60,
  },
  headerLogo: {
    width: 150,
    height: 44,
  },
  skipBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: {
    fontSize: Typography.sm,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  slider: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  heroCard: {
    width: width * 0.76,
    height: width * 0.62,
    borderRadius: Radius['3xl'],
    backgroundColor: '#353545',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadows.lg,
  },
  heroGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.18,
    top: -20,
    right: -20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.orange,
  },
  heroEmoji: {
    fontSize: 44,
  },
  badgeWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  textSection: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 32,
  },
  description: {
    fontSize: Typography.base,
    color: Colors.slateLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  highlightsContainer: {
    width: '100%',
    gap: Spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  highlightText: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 28,
    backgroundColor: Colors.orange,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: Radius.xl,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.orange,
    marginBottom: Spacing.md,
  },
  primaryBtnText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  loginLink: {
    paddingVertical: Spacing.xs,
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
