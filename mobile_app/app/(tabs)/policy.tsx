import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { publicApi } from '../../api/client';
import { Colors, Shadows } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import TopHeader from '../../components/TopHeader';

// Fallback high-end Salon Policies
const DEFAULT_POLICIES = [
  {
    id: 'p1',
    type: 'POLICY',
    category: 'ORDER',
    heading: 'Salon Booking & Time Slots',
    description:
      'We recommend booking your slot in advance through the Groomish app. Walk-ins are welcomed subject to master stylist availability. Please arrive 10 minutes prior to your scheduled time so we can prepare your dedicated styling station.',
  },
  {
    id: 'p2',
    type: 'POLICY',
    category: 'CANCELLATION',
    heading: 'Free Cancellation & Grace Window',
    description:
      'You can reschedule or cancel your salon booking free of charge up to 2 hours before the scheduled time. In case of unexpected delay, our stylists hold your reserved slot for up to 15 minutes grace period before releasing it.',
  },
  {
    id: 'p3',
    type: 'POLICY',
    category: 'PAYMENT',
    heading: 'Payment Options & Billing Transparency',
    description:
      'We accept online UPI, Debit/Credit cards, and Pay at Salon counter cash. All service prices displayed are inclusive of taxes and sanitized disposable hygiene kit. Zero hidden charges or forced tips.',
  },
  {
    id: 'p4',
    type: 'POLICY',
    category: 'REFUND',
    heading: 'Refunds & GroomCoin Credits',
    description:
      'If you paid online and cancel within the eligible window, full refunds are processed immediately back to your original payment mode or credited instantly as 100% value Groom Coins for seamless future booking.',
  },
  {
    id: 'p5',
    type: 'POLICY',
    category: 'SAFETY',
    heading: 'Hygiene & Product Authenticity Guarantee',
    description:
      'Every styling kit, scissors, clipper blade, and towel undergoes UV sterilization and autoclaving before every client visit. We strictly use 100% genuine salon products directly sourced from L\'Oréal, Kérastase, and Olaplex.',
  },
];

// Fallback FAQs
const DEFAULT_FAQS = [
  {
    id: 'f1',
    type: 'QA',
    category: 'BOOKINGS',
    heading: 'How do I book a salon treatment or service?',
    description:
      'Select your preferred branch from the top header, pick your desired services or treatment rituals from the Services catalog, choose a convenient date and time slot, and confirm your booking. You can opt to Pay Online or Pay at Salon.',
  },
  {
    id: 'f2',
    type: 'QA',
    category: 'SERVICES',
    heading: 'Can I add extra services or retail products during my visit?',
    description:
      'Yes! You can tap "Add Service" in your active Booking Details screen anytime before completion. Your stylist can also attach recommended aftercare retail products to your booking bill.',
  },
  {
    id: 'f3',
    type: 'QA',
    category: 'LOYALTY',
    heading: 'How do Groom Coins and VIP Tiers work?',
    description:
      'You earn Groom Coins on every service and retail product purchased. Higher VIP tiers (Silver, Gold, Platinum, Diamond) unlock up to 3x coin multipliers, priority master stylist slots, and complimentary scalp detox sessions.',
  },
  {
    id: 'f4',
    type: 'QA',
    category: 'PAYMENT',
    heading: 'What if I want to pay online after choosing Pay at Salon?',
    description:
      'You can open your Booking Details screen anytime and tap "Pay Online" to settle your total or remaining bill via UPI, Card, or NetBanking to skip counter queues.',
  },
  {
    id: 'f5',
    type: 'QA',
    category: 'CANCELLATION',
    heading: 'How do I reschedule an existing booking?',
    description:
      'Go to the Bookings tab, tap your active booking, and press "Reschedule". You can choose any available date and 12-hour AM/PM slot across the next 5 days with zero fee.',
  },
];

const extractList = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

export default function PolicyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'POLICY' | 'QA'>('POLICY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [policyItems, setPolicyItems] = useState<any[]>([]);
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch policy and FAQ items directly from backend API
      const res = await publicApi.getPolicyFaq();
      const allItems = extractList(res?.data);

      let pols = allItems.filter(
        (i) => (i.type || '').toUpperCase() === 'POLICY' && i.active !== false
      );
      let faqs = allItems.filter(
        (i) => (i.type || '').toUpperCase() === 'QA' && i.active !== false
      );

      // If combined response didn't return both types, query with individual type filters
      if (pols.length === 0 || faqs.length === 0) {
        const [polRes, faqRes] = await Promise.allSettled([
          publicApi.getPolicyFaq('POLICY'),
          publicApi.getPolicyFaq('QA'),
        ]);

        if (polRes.status === 'fulfilled') {
          const list = extractList(polRes.value.data).filter((i) => i.active !== false);
          if (list.length > 0) pols = list;
        }
        if (faqRes.status === 'fulfilled') {
          const list = extractList(faqRes.value.data).filter((i) => i.active !== false);
          if (list.length > 0) faqs = list;
        }
      }

      // Sort by displayOrder
      pols.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      faqs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      setPolicyItems(pols.length > 0 ? pols : DEFAULT_POLICIES);
      setFaqItems(faqs.length > 0 ? faqs : DEFAULT_FAQS);

      // Auto-expand the first FAQ
      const firstFaq = faqs[0] || DEFAULT_FAQS[0];
      if (firstFaq?.id) {
        setExpandedFaqIds({ [firstFaq.id]: true });
      }
    } catch (err) {
      console.warn('Failed to fetch policy/faq from backend, using curated fallback:', err);
      setPolicyItems(DEFAULT_POLICIES);
      setFaqItems(DEFAULT_FAQS);
      if (DEFAULT_FAQS[0]?.id) {
        setExpandedFaqIds({ [DEFAULT_FAQS[0].id]: true });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const currentItems = activeTab === 'POLICY' ? policyItems : faqItems;

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    currentItems.forEach((i) => {
      if (i.category) set.add(i.category.toUpperCase());
    });
    return ['ALL', ...Array.from(set)];
  }, [currentItems]);

  // Filter items based on active tab, search, and category
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentItems.filter((item) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        item.category?.toUpperCase() === selectedCategory;
      const matchSearch =
        !q ||
        item.heading?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [currentItems, searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toUpperCase()) {
      case 'ORDER':
      case 'BOOKINGS':
        return 'calendar-outline';
      case 'PAYMENT':
      case 'PAYMENTS':
        return 'card-outline';
      case 'CANCELLATION':
        return 'time-outline';
      case 'REFUND':
        return 'cash-outline';
      case 'SAFETY':
      case 'HYGIENE':
        return 'shield-checkmark-outline';
      case 'LOYALTY':
        return 'gift-outline';
      case 'SERVICES':
        return 'cut-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <TopHeader showBranchSelector={false} showBack={true} />

      {/* ─── Breadcrumb / Sub-bar ─── */}
      <View style={[styles.subBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.subBarBack} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={Colors.orange} />
        </TouchableOpacity>
        <Text style={[styles.subBarTitle, { color: colors.text }]}>Policies & FAQs</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      >
        {/* ─── Hero Banner ─── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.gold} />
            <Text style={styles.heroBadgeText}>Customer Transparency & Trust</Text>
          </View>
          <Text style={styles.heroTitle}>Salon Policies & Q&A</Text>
          <Text style={styles.heroSubtitle}>
            Transparent guidelines covering bookings, cancellation, payment methods, and hygiene standards.
          </Text>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search policies, cancellations, refunds..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Main Tabs Switcher ─── */}
        <View style={[styles.tabsWrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'POLICY' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('POLICY');
              setSelectedCategory('ALL');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text-outline"
              size={16}
              color={activeTab === 'POLICY' ? Colors.white : colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === 'POLICY' && styles.tabBtnTextActive]}>
              Salon Policies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'QA' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('QA');
              setSelectedCategory('ALL');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="help-circle-outline"
              size={16}
              color={activeTab === 'QA' ? Colors.white : colors.textMuted}
            />
            <Text style={[styles.tabBtnText, activeTab === 'QA' && styles.tabBtnTextActive]}>
              Questions & Answers
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Category Filter Pills ─── */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    isSelected && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryPillText, { color: colors.text }, isSelected && styles.categoryPillTextActive]}>
                    {cat === 'ALL' ? 'All Topics' : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ─── Content List ─── */}
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.orange} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading guidelines...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="search-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Try searching with different keywords or switch categories.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
            >
              <Text style={styles.resetBtnText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'POLICY' ? (
          /* Policies List */
          <View style={styles.itemsList}>
            {filteredItems.map((item) => (
              <View
                key={item.id}
                style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={styles.policyHeader}>
                  <View style={styles.policyIconBox}>
                    <Ionicons name={getCategoryIcon(item.category) as any} size={18} color={Colors.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {item.category && (
                      <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
                    )}
                    <Text style={[styles.policyTitle, { color: colors.text }]}>{item.heading}</Text>
                  </View>
                </View>
                <Text style={[styles.policyDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          /* Accordion FAQs List */
          <View style={styles.itemsList}>
            {filteredItems.map((item) => {
              const isExpanded = !!expandedFaqIds[item.id];
              return (
                <View
                  key={item.id}
                  style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleFaq(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqIconBox}>
                      <Ionicons
                        name={getCategoryIcon(item.category) as any}
                        size={17}
                        color={isExpanded ? Colors.orange : colors.textMuted}
                      />
                    </View>
                    <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.heading}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isExpanded ? Colors.orange : colors.textMuted}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.faqBody, { borderTopColor: colors.cardBorder }]}>
                      <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ─── Support Helpdesk Callout ─── */}
        <View style={[styles.supportBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.supportTitle, { color: colors.text }]}>Still have questions?</Text>
          <Text style={[styles.supportSubtitle, { color: colors.textMuted }]}>
            Our salon concierge team is available 7 days a week (9 AM - 9 PM) to assist with bookings and care questions.
          </Text>

          <View style={styles.supportBtnRow}>
            <TouchableOpacity
              style={[styles.supportBtn, { backgroundColor: Colors.orange }]}
              onPress={() => Linking.openURL('tel:+919876543210')}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={15} color={Colors.white} />
              <Text style={styles.supportBtnText}>Call Salon</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.supportBtn, { backgroundColor: '#25D366' }]}
              onPress={() => Linking.openURL('https://wa.me/919876543210')}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={15} color={Colors.white} />
              <Text style={styles.supportBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  subBarBack: {
    padding: 4,
  },
  subBarTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    ...Shadows.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.orange,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  categoryScroll: {
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  resetBtn: {
    marginTop: 8,
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  itemsList: {
    gap: 12,
  },
  policyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    ...Shadows.sm,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  policyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(243, 106, 34, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  categoryBadge: {
    color: Colors.orange,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  policyDescription: {
    fontSize: 12,
    lineHeight: 19,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  faqIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(243, 106, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  faqBody: {
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 19,
  },
  supportBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    marginTop: 10,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  supportSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  supportBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  supportBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
