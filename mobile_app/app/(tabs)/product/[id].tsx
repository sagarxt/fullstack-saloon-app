import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../../context/CartContext';
import { useBranch } from '../../../context/BranchContext';
import { useTheme } from '../../../context/ThemeContext';
import { publicApi } from '../../../api/client';
import { Colors } from '../../../theme/colors';
import TopHeader from '../../../components/TopHeader';
import { calculateGroomCoins } from '../../../utils/serviceHelper';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { addItem, getItemCountForId, updateQuantity } = useCart();
  const { selectedBranch } = useBranch();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      if (id) {
        // Try direct or search in branch catalog
        const res = selectedBranch
          ? await publicApi.getStoreProducts(selectedBranch.id)
          : await publicApi.getProducts();
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        const found = list.find((p: any) => String(p.productId || p.id) === String(id));
        if (found) {
          setProduct({
            ...found,
            id: found.productId || found.id,
          });
        } else {
          // Fallback global products
          const allRes = await publicApi.getProducts();
          const allList = Array.isArray(allRes.data) ? allRes.data : allRes.data?.content || [];
          const allFound = allList.find((p: any) => String(p.productId || p.id) === String(id));
          if (allFound) {
            setProduct({
              ...allFound,
              id: allFound.productId || allFound.id,
            });
          }
        }
      }
    } catch (err) {
      console.error('Product detail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} by ${product.brand || 'Groomish'} at Groomish Luxury Salon! Only ₹${product.price}.`,
      });
    } catch (_) {}
  };

  const inCartCount = product ? getItemCountForId('PRODUCT', product.id) : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      productId: product.id,
      itemType: 'PRODUCT',
      name: product.name,
      price: product.price || 0,
      mrp: product.mrp,
      image: product.image || product.imageUrl,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} showBack={true} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading Product Details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} showBack={true} />
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.red} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Product Not Found</Text>
          <Text style={[styles.errorSub, { color: colors.textMuted }]}>
            The product may currently be out of catalog or discontinued.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to Catalog</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const coinsEarned = product.rewardCoins || calculateGroomCoins(product.price);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ─── TOP LUXURY NAVBAR ─── */}
      <TopHeader showBranchSelector={true} showBack={true} />

      {/* ─── SUB BREADCRUMB / ACTION HEADER ─── */}
      <View style={[styles.subBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.subBarBack} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={16} color={Colors.orange} />
          <Text style={styles.subBarBackText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.subBarTitle, { color: colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity style={styles.subBarShare} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={17} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ─── PRODUCT HERO PHOTO ─── */}
        <View style={[styles.heroWrap, { backgroundColor: colors.card }]}>
          <Image
            source={{
              uri:
                product.image ||
                product.imageUrl ||
                'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=600&q=80',
            }}
            style={styles.heroImg}
          />
          <View style={styles.heroTopBadges}>
            {product.brand && (
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>{product.brand}</Text>
              </View>
            )}
            {discountPercent > 0 && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentWrap}>
          {/* ─── TITLE & BRAND ─── */}
          <View style={styles.titleSection}>
            <Text style={styles.categorySubText}>
              {product.categoryName || 'Salon Grade Retail Care'}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>{product.name}</Text>
            {product.volumeOrSize && (
              <View style={[styles.volumePill, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                <Ionicons name="flask-outline" size={12} color={Colors.orange} />
                <Text style={[styles.volumePillText, { color: colors.textMuted }]}>{product.volumeOrSize}</Text>
              </View>
            )}
          </View>

          {/* ─── BADGES ─── */}
          <View style={styles.metaRow}>
            <View style={[styles.metaBadge, { backgroundColor: Colors.greenLight }]}>
              <Ionicons name="sparkles" size={13} color={Colors.greenDark} />
              <Text style={[styles.metaBadgeText, { color: Colors.greenDark }]}>
                Earn +{coinsEarned} Groom Coins
              </Text>
            </View>

            <View style={[styles.metaBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="shield-checkmark" size={13} color={Colors.blue} />
              <Text style={[styles.metaBadgeText, { color: Colors.blue }]}>
                100% Authentic Guaranteed
              </Text>
            </View>
          </View>

          {/* ─── PRICING ─── */}
          <View style={[styles.priceContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.priceLeft}>
              <Text style={[styles.mainPrice, { color: colors.text }]}>₹{product.price}</Text>
              {product.mrp && product.mrp > product.price && (
                <View style={styles.mrpRow}>
                  <Text style={[styles.mainMrp, { color: colors.textMuted }]}>₹{product.mrp}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      Save ₹{product.mrp - product.price}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <Text style={[styles.taxNote, { color: colors.textMuted }]}>
              * Inclusive of all applicable taxes. In-store salon pickup or priority delivery available.
            </Text>
          </View>

          {/* ─── DESCRIPTION ─── */}
          <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Product Details & Ritual</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {product.description ||
                'Professional salon-grade formulation recommended by Groomish stylists. Designed to protect hair health, preserve scalp balance, and deliver salon-fresh styling at home.'}
            </Text>
          </View>

          {/* ─── SALON AUTHENTICITY PROMISE ─── */}
          <View style={[styles.promiseBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.promiseHeading, { color: colors.text }]}>The Groomish Salon Guarantee</Text>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Directly sourced from verified salon distributors (L'Oréal, Kérastase, Olaplex)
              </Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Can be applied by your stylist during your next salon visit
              </Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Earns loyalty reward coins on every single retail purchase
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── STICKY BOTTOM CART BAR (ABOVE TAB BAR) ─── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
        <View>
          <Text style={[styles.bottomBarLabel, { color: colors.textMuted }]}>Price</Text>
          <Text style={[styles.bottomBarPrice, { color: colors.text }]}>₹{product.price}</Text>
        </View>

        <View style={styles.bottomBarActions}>
          {inCartCount > 0 ? (
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(product.id, inCartCount - 1)}
              >
                <Ionicons name="remove" size={16} color={Colors.orange} />
              </TouchableOpacity>
              <Text style={[styles.stepperText, { color: colors.text }]}>{inCartCount}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(product.id, inCartCount + 1)}
              >
                <Ionicons name="add" size={16} color={Colors.orange} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addCartBottomBtn}
              onPress={handleAddToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-handle-outline" size={16} color={Colors.orange} />
              <Text style={styles.addCartBottomText}>Add to Cart</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.buyNowBottomBtn}
            onPress={() => {
              if (inCartCount === 0) {
                handleAddToCart();
              }
              router.push('/(tabs)/cart' as any);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.buyNowBottomText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={15} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  subBarBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subBarBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.orange,
  },
  subBarTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  subBarShare: {
    padding: 4,
  },
  scroll: {
    paddingBottom: 95,
  },
  heroWrap: {
    position: 'relative',
    height: 250,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  heroTopBadges: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  savingsBadge: {
    backgroundColor: Colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  contentWrap: {
    padding: 16,
    gap: 14,
  },
  titleSection: {
    gap: 4,
  },
  categorySubText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  volumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  volumePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  mainPrice: {
    fontSize: 22,
    fontWeight: '900',
  },
  mrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainMrp: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: Colors.greenDark,
    fontSize: 11,
    fontWeight: '800',
  },
  taxNote: {
    fontSize: 11,
  },
  infoSection: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  promiseBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  promiseHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  promiseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  promiseText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  bottomBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBarPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  bottomBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperBtn: {
    padding: 2,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '800',
  },
  addCartBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.orange,
  },
  addCartBottomText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.orange,
  },
  buyNowBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyNowBottomText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: Colors.orange,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
