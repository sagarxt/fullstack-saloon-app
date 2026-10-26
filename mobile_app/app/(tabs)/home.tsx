import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { publicApi, customerApi } from '../../api/client';
import { Colors, Shadows } from '../../theme/colors';
import TopHeader from '../../components/TopHeader';
import { getServicePriceRange, getServiceDurationRange } from '../../utils/serviceHelper';
import { getBrandInfo } from '../../utils/brandHelper';

const { width } = Dimensions.get('window');

// Curated brand partners matching the web experience
const BRAND_PARTNERS = [
  { id: '1', name: "L'Oréal Pro", image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Olaplex', image: 'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Moroccanoil', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Kérastase', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Schwarzkopf', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=200&q=80' },
  { id: '6', name: 'Groomish Signature', image: 'https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png' },
];

// VIP Loyalty Tier perks
const TIER_BENEFITS = [
  {
    tier: 'Silver',
    color: '#8B9AA8',
    bg: '#F0F4F7',
    icon: 'shield-outline',
    multiplier: '1x Coins',
    perk: 'Earn 1 Groom Coin for every ₹10 spent. Free birthday hair consultation.',
  },
  {
    tier: 'Gold',
    color: '#D4A843',
    bg: '#FFF8E1',
    icon: 'star-outline',
    multiplier: '1.5x Coins',
    perk: '50% faster coin accumulation. Dedicated master stylist priority slots.',
  },
  {
    tier: 'Platinum',
    color: '#3B82F6',
    bg: '#EFF6FF',
    icon: 'ribbon-outline',
    multiplier: '2x Coins',
    perk: 'Double coin earnings, complimentary scalp detox every quarter & zero cancellation fees.',
  },
  {
    tier: 'Diamond',
    color: '#FF6B35',
    bg: '#FFF0EB',
    icon: 'diamond-outline',
    multiplier: '3x Coins',
    perk: 'Triple coins on all services & retail care, VIP private suite access & personal styling concierge.',
  },
];

// Verified Salon Testimonials
const BRANCH_REVIEWS = [
  {
    id: '1',
    customerName: 'Aarav Sharma',
    rating: 5,
    service: 'Signature Fade & Beard Spa',
    review: 'World class salon ambiance and hygiene. The stylist understood exactly the taper fade I wanted. Seamless coin redemption too!',
    date: '2 days ago',
  },
  {
    id: '2',
    customerName: 'Priya Mehta',
    rating: 5,
    service: 'Keratin Hair Spa & Treatment',
    review: 'Best salon experience in town. They use authentic Olaplex and Kérastase products. Highly recommended!',
    date: '1 week ago',
  },
  {
    id: '3',
    customerName: 'Rohan Verma',
    rating: 5,
    service: 'Charcoal Deep Facial',
    review: 'Extremely professional staff and refreshing treatment. Booking through the app took less than 30 seconds.',
    date: '2 weeks ago',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { selectedBranch, openBranchModal } = useBranch();
  const { itemCount, addItem } = useCart();
  const { isDark, colors } = useTheme();

  const [categories, setCategories] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>(BRAND_PARTNERS);
  const [balance, setBalance] = useState<any>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branchReviews, setBranchReviews] = useState<any[]>(BRANCH_REVIEWS);

  // Extract all photos of the selected branch
  const branchImages = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(selectedBranch?.images) && selectedBranch.images.length > 0) {
      selectedBranch.images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img?.imageUrl;
        if (url && typeof url === 'string' && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    if (selectedBranch?.image && !list.includes(selectedBranch.image)) {
      list.unshift(selectedBranch.image);
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80');
    }
    return list;
  }, [selectedBranch]);

  const [currentBranchImgIdx, setCurrentBranchImgIdx] = useState(0);
  const heroScrollRef = React.useRef<ScrollView>(null);
  const heroCardWidth = width - 32;

  // Auto-slide branch photos to next in loop
  useEffect(() => {
    if (branchImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBranchImgIdx((prev) => {
        const next = (prev + 1) % branchImages.length;
        heroScrollRef.current?.scrollTo({ x: next * heroCardWidth, animated: true });
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [branchImages, heroCardWidth]);

  const loadHomeData = useCallback(async () => {
    try {
      const [catRes, srvRes, prodRes, notifRes, balRes, brandRes] = await Promise.allSettled([
        publicApi.getCategories(),
        selectedBranch
          ? publicApi.getStoreServices(selectedBranch.id)
          : publicApi.getServices(),
        selectedBranch
          ? publicApi.getStoreProducts(selectedBranch.id)
          : publicApi.getProducts(),
        isAuthenticated ? customerApi.getUnreadCount() : Promise.reject(),
        isAuthenticated ? customerApi.getRewardBalance() : Promise.reject(),
        publicApi.getBrands ? publicApi.getBrands() : publicApi.getProductBrands(),
      ]);

      if (brandRes.status === 'fulfilled' && brandRes.value?.data) {
        const rawBrands = brandRes.value.data;
        const list = Array.isArray(rawBrands) ? rawBrands : rawBrands?.content || [];
        if (list.length > 0) {
          const mapped = list.map((b: any, idx: number) => {
            const rawName = typeof b === 'string' ? b : b.name || `Brand ${idx + 1}`;
            const info = getBrandInfo(rawName, list);
            return {
              id: b.id ? String(b.id) : String(idx + 1),
              name: rawName,
              image:
                (typeof b === 'object' && b.logo) ||
                info.logo ||
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
              shortDescription: (typeof b === 'object' && b.shortDescription) || info.tagline,
            };
          });
          setBrands(mapped);
        }
      }

      if (catRes.status === 'fulfilled') {
        const d = catRes.value.data;
        setCategories(Array.isArray(d) ? d : d?.content || []);
      }

      if (srvRes.status === 'fulfilled') {
        const d = srvRes.value.data;
        const list = Array.isArray(d) ? d : d?.content || [];
        // Normalize IDs and take top 10
        const normalized = list.map((s: any) => ({
          ...s,
          id: s.serviceId || s.id,
          serviceId: s.serviceId || s.id,
        }));
        setTopServices(normalized.slice(0, 10));
      }

      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data;
        const list = Array.isArray(d) ? d : d?.content || [];
        const normalized = list.map((p: any) => ({
          ...p,
          id: p.productId || p.id,
          productId: p.productId || p.id,
        }));
        setFeaturedProducts(normalized.slice(0, 8));
      }

      if (notifRes.status === 'fulfilled') {
        setUnreadNotifs(notifRes.value.data?.count || 0);
      }

      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data);
      }

      // Load branch reviews if available
      if (selectedBranch?.id) {
        try {
          const revRes = await publicApi.getStoreReviews(selectedBranch.id);
          const revList = Array.isArray(revRes.data)
            ? revRes.data
            : revRes.data?.content || [];
          if (revList.length > 0) {
            setBranchReviews(revList.slice(0, 5));
          }
        } catch (_) { }
      }
    } catch (err) {
      console.error('Home load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch, isAuthenticated]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleAddToCartService = (srv: any) => {
    if (srv.subServices && srv.subServices.length > 0) {
      router.push({
        pathname: '/service/[id]',
        params: { id: String(srv.id) },
      } as any);
      return;
    }
    addItem({
      id: srv.id,
      serviceId: srv.id,
      itemType: 'SERVICE',
      name: srv.name,
      price: srv.price || 0,
      mrp: srv.mrp,
      image: srv.image,
      durationMinutes: srv.durationMinutes || 30,
    });
  };

  const handleAddToCartProduct = (prod: any) => {
    addItem({
      id: prod.id,
      productId: prod.id,
      itemType: 'PRODUCT',
      name: prod.name,
      price: prod.price || 0,
      mrp: prod.mrp,
      image: prod.image,
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Colors.orange} />
        <Text style={styles.loadingText}>Loading Groomish Luxury Salon...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ─── UNIVERSAL LUXURY APP HEADER ─── */}
      <TopHeader showBranchSelector={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.orange}
          />
        }
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.bg }]}
      >
        {/* ─── BRANCH HERO PHOTO & SALON BANNER (AUTO-SLIDES IN LOOP) ─── */}
        <TouchableOpacity
          activeOpacity={0.96}
          onPress={openBranchModal}
          style={styles.heroSection}
        >
          {/* Photos Carousel */}
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.round(offsetX / heroCardWidth);
              setCurrentBranchImgIdx(idx);
            }}
            style={{ width: heroCardWidth, height: 215 }}
          >
            {branchImages.map((imgUri, idx) => (
              <Image
                key={idx}
                source={{ uri: imgUri }}
                style={{ width: heroCardWidth, height: 215 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Top Pagination Dots when branch has multiple photos */}
          {branchImages.length > 1 && (
            <View style={styles.carouselDotsContainer}>
              {branchImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.carouselDot,
                    currentBranchImgIdx === i && styles.carouselDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Overlay with Branch Details on Left & Review + Time on Bottom Right */}
          <View style={styles.heroOverlay} pointerEvents="box-none">
            <View style={styles.heroBottomRow}>
              {/* Left Column: Branch Title and Address */}
              <View style={styles.heroBottomLeft}>
                <View style={styles.heroBranchTag}>
                  <Ionicons name="location" size={11} color={Colors.orange} />
                  <Text style={styles.heroBranchTagText}>Salon Branch</Text>
                  <Ionicons name="chevron-forward" size={10} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {selectedBranch ? selectedBranch.name : 'Groomish Flagship Studio'}
                </Text>
                <Text style={styles.heroSubtitle} numberOfLines={1}>
                  {selectedBranch?.address || 'Luxury grooming, styling & wellness treatments'}
                </Text>
              </View>

              {/* Right Column: Review and Time aligned to bottom right */}
              <View style={styles.heroBottomRight}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFB800" />
                  <Text style={styles.ratingText}>
                    {selectedBranch?.rating ? Number(selectedBranch.rating).toFixed(1) : '4.9'} (1.2k+)
                  </Text>
                </View>
                <View style={styles.hoursBadge}>
                  <Ionicons name="time-outline" size={12} color={Colors.white} />
                  <Text style={styles.hoursText}>
                    {selectedBranch?.openingTime || '09:00'} - {selectedBranch?.closingTime || '21:00'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* ─── CATEGORY CIRCULAR ICONS (SAME AS BRAND ICONS) ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Treatments</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Select a category to view specialized salon care
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/services' as any)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={String(cat.id)}
                style={styles.circularCategoryItem}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/services',
                    params: { categoryId: String(cat.id), categoryName: cat.name },
                  } as any)
                }
                activeOpacity={0.8}
              >
                <View style={[styles.circularImageWrap, styles.brandImageWrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Image
                    source={{
                      uri:
                        cat.image ||
                        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
                    }}
                    style={styles.circularCategoryImg}
                  />
                </View>
                {/* Circular image below name, NO description */}
                <Text style={[styles.circularCategoryName, { color: colors.text }]} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── TOP 10 SERVICES SECTION (2 IN EACH ROW, UP TO 5 ROWS) ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
              {/* <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                2 per row • Up to 5 rows of signature treatments
              </Text> */}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/services' as any)}
            >
              <Text style={styles.viewAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            {topServices.slice(0, 10).map((srv) => (
              <View key={String(srv.id)} style={[styles.gridCardItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: '/service/[id]',
                      params: { id: String(srv.id) },
                    } as any)
                  }
                >
                  <View style={[styles.serviceGridImageWrap, { backgroundColor: colors.bg }]}>
                    <Image
                      source={{
                        uri:
                          srv.image ||
                          'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
                      }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                    <View style={styles.durationBadge}>
                      <Ionicons name="time" size={10} color={Colors.white} />
                      <Text style={styles.durationText}>
                        {getServiceDurationRange(srv)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.gridCardBody}>
                  <Text style={styles.cardCategory} numberOfLines={1}>
                    {srv.categoryName || 'Salon Service'}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/service/[id]',
                        params: { id: String(srv.id) },
                      } as any)
                    }
                  >
                    <Text style={[styles.gridCardName, { color: colors.text }]} numberOfLines={1}>
                      {srv.name}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {srv.description ||
                      'Expert personalized care by certified master stylists.'}
                  </Text>

                  <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
                    <View>
                      <Text style={[styles.cardPrice, { color: colors.text }]}>
                        {getServicePriceRange(srv)}
                      </Text>
                      {(!srv.subServices || srv.subServices.length === 0) && srv.mrp && srv.mrp > srv.price && (
                        <Text style={[styles.cardMrp, { color: colors.textMuted }]}>₹{srv.mrp}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddToCartService(srv)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={15} color={Colors.white} />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── BRANDS ICONS (SAME CIRCULAR STYLE AS CATEGORY) ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Curated Luxury Brands</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Only authentic, professional salon products used
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {brands.map((brand) => (
              <TouchableOpacity
                key={brand.id}
                style={styles.circularCategoryItem}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/services',
                    params: { tab: 'products', brand: brand.name },
                  } as any)
                }
                activeOpacity={0.8}
              >
                <View style={[styles.circularImageWrap, styles.brandImageWrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Image
                    source={{ uri: brand.image }}
                    style={styles.circularCategoryImg}
                    resizeMode="cover"
                  />
                </View>
                {/* Brand icon below name */}
                <Text style={[styles.circularCategoryName, { color: colors.text }]} numberOfLines={1}>
                  {brand.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── PRODUCTS SECTION (2 IN EACH ROW) ─── */}
        {featuredProducts.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Salon Retail Care</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  Bring salon-grade hair & skin rituals home
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/services',
                    params: { tab: 'products' },
                  } as any)
                }
              >
                <Text style={styles.viewAllText}>Shop All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
              {featuredProducts.slice(0, 6).map((prod) => (
                <View key={String(prod.id)} style={[styles.gridCardItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    style={[styles.productGridImageWrap, { backgroundColor: colors.bg }]}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/product/[id]',
                        params: { id: String(prod.id) },
                      } as any)
                    }
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{
                        uri:
                          prod.image ||
                          'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=400&q=80',
                      }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                    <View style={[styles.durationBadge, { backgroundColor: Colors.blue }]}>
                      <Text style={styles.durationText}>Retail</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.gridCardBody}>
                    <Text style={styles.cardCategory} numberOfLines={1}>
                      {prod.brand || prod.categoryName || 'Authentic Care'}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/product/[id]',
                          params: { id: String(prod.id) },
                        } as any)
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.gridCardName, { color: colors.text }]} numberOfLines={1}>
                        {prod.name}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>
                      {prod.description || 'Authentic professional salon product.'}
                    </Text>

                    <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
                      <View>
                        <Text style={[styles.cardPrice, { color: colors.text }]}>₹{prod.price}</Text>
                        {prod.mrp && prod.mrp > prod.price && (
                          <Text style={[styles.cardMrp, { color: colors.textMuted }]}>₹{prod.mrp}</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: Colors.blue }]}
                        onPress={() => handleAddToCartProduct(prod)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cart-outline" size={15} color={Colors.white} />
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── ALL REWARDS & TIER BENEFITS ("WHY JOIN US") ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>VIP Loyalty & Tier Privileges</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Why Join Us: Earn Groom Coins with every cut and treatment
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rewards' as any)}
            >
              <Text style={styles.viewAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tiersGrid}>
            {TIER_BENEFITS.map((tb) => (
              <View
                key={tb.tier}
                style={[styles.tierCard, { backgroundColor: isDark ? colors.card : tb.bg, borderColor: tb.color + '40' }]}
              >
                <View style={styles.tierHeader}>
                  <View style={[styles.tierIconBadge, { backgroundColor: tb.color }]}>
                    <Ionicons name={tb.icon as any} size={16} color={Colors.white} />
                  </View>
                  <View>
                    <Text style={[styles.tierTitle, { color: tb.color }]}>
                      {tb.tier} Tier
                    </Text>
                    <Text style={[styles.tierMultiplier, { color: colors.text }]}>{tb.multiplier}</Text>
                  </View>
                </View>
                <Text style={[styles.tierDesc, { color: colors.textSecondary }]}>{tb.perk}</Text>
              </View>
            ))}
          </View>

          {/* Loyalty CTA Banner */}
          <TouchableOpacity
            style={styles.rewardsCtaBanner}
            onPress={() => router.push('/(tabs)/rewards' as any)}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardsCtaTitle}>Ready to Unlock Free Treatments?</Text>
              <Text style={styles.rewardsCtaDesc}>
                {isAuthenticated
                  ? `You have ${balance?.points || 0} Groom Coins available to redeem!`
                  : 'Sign up today and get 100 Welcome Coins on your first salon visit.'}
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ─── BRANCH FEEDBACK & CUSTOMER REVIEWS ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Client Love & Feedback</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Verified experiences from our salon visitors
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            {branchReviews.map((rev) => (
              <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {(rev.customerName || 'Client')[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: colors.text }]}>{rev.customerName || 'Verified Guest'}</Text>
                    <Text style={[styles.reviewService, { color: colors.textMuted }]}>{rev.service || rev.serviceName || 'Salon Visit'}</Text>
                  </View>
                  <View style={styles.starRow}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={12}
                        color={i < (rev.rating || 5) ? '#FFB800' : Colors.slateXLight}
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewBody, { color: colors.text }]} numberOfLines={4}>
                  "{rev.review || rev.comment || 'Amazing service and hospitable salon staff!'}"
                </Text>
                <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{rev.date || 'Recently'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ─── SALON FOOTER ─── */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
          <View style={styles.footerBrand}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={[styles.footerTagline, { color: colors.textMuted }]}>
              Premium Salon & Grooming Experience
            </Text>
          </View>

          <View style={[styles.footerBadges, { borderColor: colors.cardBorder }]}>
            <View style={styles.footerBadgeItem}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.orange} />
              <Text style={[styles.footerBadgeText, { color: colors.text }]}>100% Sanitized Tools</Text>
            </View>
            <View style={styles.footerBadgeItem}>
              <Ionicons name="sparkles" size={16} color={Colors.orange} />
              <Text style={[styles.footerBadgeText, { color: colors.text }]}>Authentic Products</Text>
            </View>
            <View style={styles.footerBadgeItem}>
              <Ionicons name="ribbon" size={16} color={Colors.orange} />
              <Text style={[styles.footerBadgeText, { color: colors.text }]}>Master Stylists</Text>
            </View>
          </View>

          <View style={styles.footerPolicyRow}>
            <TouchableOpacity
              style={[styles.footerPolicyBtn, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/(tabs)/policy')}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={13} color={Colors.orange} />
              <Text style={[styles.footerPolicyText, { color: colors.text }]}>Salon Policies</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerPolicyBtn, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/(tabs)/policy')}
              activeOpacity={0.8}
            >
              <Ionicons name="help-circle-outline" size={13} color={Colors.orange} />
              <Text style={[styles.footerPolicyText, { color: colors.text }]}>Policy & FAQs</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContactRow}>
            <TouchableOpacity
              style={[styles.footerContactBtn, { backgroundColor: colors.bg }]}
              onPress={() => Linking.openURL('tel:+919876543210')}
            >
              <Ionicons name="call" size={14} color={colors.text} />
              <Text style={[styles.footerContactText, { color: colors.text }]}>Call Helpline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerContactBtn, { backgroundColor: colors.bg }]}
              onPress={() => Linking.openURL('https://wa.me/919876543210')}
            >
              <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
              <Text style={[styles.footerContactText, { color: colors.text }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerCopyright, { color: colors.textMuted }]}>
            © 2026 Groomish Now Technologies Inc. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.slateDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  branchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    marginHorizontal: 4,
  },
  branchPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBtn: {
    backgroundColor: Colors.orange,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.red,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.slateDark,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: '#FAF8F5',
  },
  heroSection: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    overflow: 'hidden',
    height: 215,
    position: 'relative',
    ...Shadows.md,
  },
  carouselDotsContainer: {
    position: 'absolute',
    top: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  carouselDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  carouselDotActive: {
    width: 14,
    backgroundColor: Colors.orange,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  heroBottomLeft: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  heroBranchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroBranchTagText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  heroBottomRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 4,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 4,
  },
  hoursText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  sectionWrap: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.slate,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.slateLight,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.orange,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    gap: 14,
  },
  circularCategoryItem: {
    alignItems: 'center',
    width: 76,
  },
  circularImageWrap: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    ...Shadows.sm,
  },
  brandImageWrap: {
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  circularCategoryImg: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  circularCategoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 6,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    rowGap: 14,
  },
  gridCardItem: {
    width: (width - 44) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.sm,
  },
  gridImageWrap: {
    width: '100%',
    height: 110,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  serviceGridImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  productGridImageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridCardBody: {
    padding: 10,
  },
  gridCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  cardsScroll: {
    paddingHorizontal: 14,
    gap: 12,
  },
  cardItem: {
    width: width * 0.54,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.sm,
  },
  cardImageWrap: {
    width: '100%',
    height: 125,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  durationText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: 12,
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
  },
  cardMrp: {
    fontSize: 10,
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 2,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  tiersGrid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tierCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  tierIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  tierMultiplier: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  tierDesc: {
    fontSize: 12,
    color: Colors.slate,
    lineHeight: 17,
  },
  rewardsCtaBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.slateDark,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.md,
  },
  rewardsCtaTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  rewardsCtaDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 3,
  },
  reviewCard: {
    width: width * 0.72,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECEAE5',
    ...Shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.orange,
  },
  reviewName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.slate,
  },
  reviewService: {
    fontSize: 10,
    color: Colors.slateLight,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontSize: 11,
    color: Colors.slate,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  reviewDate: {
    fontSize: 10,
    color: Colors.slateXLight,
    marginTop: 8,
  },
  footer: {
    marginTop: 30,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#EEECE8',
    alignItems: 'center',
  },
  footerBrand: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLogo: {
    width: 44,
    height: 44,
    marginBottom: 6,
  },
  footerTagline: {
    fontSize: 12,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  footerBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0EEEA',
    marginBottom: 16,
  },
  footerBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate,
  },
  footerContactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  footerContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  footerContactText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  footerPolicyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  footerPolicyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  footerPolicyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerCopyright: {
    fontSize: 10,
    color: Colors.slateXLight,
    textAlign: 'center',
  },
});
