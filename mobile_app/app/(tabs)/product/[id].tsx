import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  FlatList,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../../context/CartContext';
import { useBranch } from '../../../context/BranchContext';
import { useTheme } from '../../../context/ThemeContext';
import { publicApi } from '../../../api/client';
import { Colors, Shadows } from '../../../theme/colors';
import TopHeader from '../../../components/TopHeader';
import { calculateGroomCoins } from '../../../utils/serviceHelper';
import { getBrandInfo } from '../../../utils/brandHelper';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { addItem, getItemCountForId, updateQuantity } = useCart();
  const { selectedBranch } = useBranch();

  const [product, setProduct] = useState<any>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [serverBrands, setServerBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id, selectedBranch]);

  const loadProduct = async () => {
    setLoading(true);
    setActiveImageIndex(0);
    try {
      if (id) {
        // Fetch products and brands concurrently
        const [prodListRes, brandRes] = await Promise.allSettled([
          selectedBranch
            ? publicApi.getStoreProducts(selectedBranch.id)
            : publicApi.getProducts(),
          publicApi.getBrands ? publicApi.getBrands() : publicApi.getProductBrands(),
        ]);

        let catalog: any[] = [];
        if (prodListRes.status === 'fulfilled') {
          const d = prodListRes.value.data;
          catalog = Array.isArray(d) ? d : d?.content || [];
        }

        if (brandRes.status === 'fulfilled' && brandRes.value?.data) {
          const bd = brandRes.value.data;
          setServerBrands(Array.isArray(bd) ? bd : bd?.content || []);
        }

        // Find current product
        let found = catalog.find((p: any) => String(p.productId || p.id) === String(id));

        // If not found in branch, fallback to global catalog
        if (!found) {
          try {
            const allRes = await publicApi.getProducts();
            const allCatalog = Array.isArray(allRes.data) ? allRes.data : allRes.data?.content || [];
            found = allCatalog.find((p: any) => String(p.productId || p.id) === String(id));
            if (found && catalog.length === 0) {
              catalog = allCatalog;
            }
          } catch (_) {}
        }

        if (found) {
          const normalized = {
            ...found,
            id: found.productId || found.id,
          };
          setProduct(normalized);

          // Find suggested companion products (same category or brand, excluding current)
          const companions = catalog
            .filter((p: any) => String(p.productId || p.id) !== String(id))
            .sort((a: any, b: any) => {
              if (a.categoryName === normalized.categoryName && b.categoryName !== normalized.categoryName) return -1;
              if (b.categoryName === normalized.categoryName && a.categoryName !== normalized.categoryName) return 1;
              if (a.brand === normalized.brand && b.brand !== normalized.brand) return -1;
              return 0;
            })
            .slice(0, 6)
            .map((p: any) => ({
              ...p,
              id: p.productId || p.id,
            }));
          setSuggestedProducts(companions);
        }
      }
    } catch (err) {
      console.error('Product detail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract multiple images for carousel
  const productImages = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];

    // Check images array
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img?.url || img?.imageUrl;
        if (url && typeof url === 'string' && !list.includes(url)) list.push(url);
      });
    } else if (typeof product.images === 'string' && product.images.trim()) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) {
          parsed.forEach((img: any) => {
            const url = typeof img === 'string' ? img : img?.url || img?.imageUrl;
            if (url && typeof url === 'string' && !list.includes(url)) list.push(url);
          });
        }
      } catch (_) {
        product.images.split(',').forEach((s: string) => {
          const url = s.trim();
          if (url && !list.includes(url)) list.push(url);
        });
      }
    }

    // Add main image if not present
    const single = product.image || product.imageUrl;
    if (single && !list.includes(single)) {
      list.unshift(single);
    }

    // Fallback if no images found
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=600&q=80');
    }
    return list;
  }, [product]);

  const brandInfo = useMemo(() => {
    return getBrandInfo(product?.brand, serverBrands);
  }, [product?.brand, serverBrands]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} by ${brandInfo.name} at Groomish Luxury Salon! Only ₹${product.price}.`,
      });
    } catch (_) {}
  };

  const inCartCount = product ? getItemCountForId('PRODUCT', product.id) : 0;

  const handleAddToCart = (targetProd = product) => {
    if (!targetProd) return;
    addItem({
      id: targetProd.id,
      productId: targetProd.id,
      itemType: 'PRODUCT',
      name: targetProd.name,
      price: targetProd.price || 0,
      mrp: targetProd.mrp,
      image: targetProd.image || targetProd.imageUrl,
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
        {/* ─── SLIDABLE MULTI-IMAGE CAROUSEL (3:4 ASPECT RATIO) ─── */}
        <View style={[styles.carouselContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={productImages}
            keyExtractor={(img, idx) => `${img}_${idx}`}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.slideWrap}>
                <Image
                  source={{ uri: item }}
                  style={styles.carouselImg}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {/* Floating Badges */}
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

          {/* Counter Badge if multiple images */}
          {productImages.length > 1 && (
            <View style={styles.imageCounterBadge}>
              <Ionicons name="images-outline" size={12} color={Colors.white} />
              <Text style={styles.imageCounterText}>
                {activeImageIndex + 1} / {productImages.length}
              </Text>
            </View>
          )}

          {/* Dot Pagination */}
          {productImages.length > 1 && (
            <View style={styles.dotsRow}>
              {productImages.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeImageIndex === idx ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.contentWrap}>
          {/* ─── TITLE & CATEGORY ─── */}
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
                Verified Salon Product
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
              * Inclusive of all applicable taxes. In-store salon application or home delivery available.
            </Text>
          </View>

          {/* ─── DESCRIPTION & DETAILS ─── */}
          <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Product Details & Ritual</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {product.description ||
                'Professional salon-grade formulation recommended by Groomish stylists. Designed to protect hair health, preserve scalp balance, and deliver salon-fresh styling at home.'}
            </Text>
          </View>

          {/* ─── BRAND LOGO, NAME, SHORT DESCRIPTION & VERIFIED PRODUCT BADGE ─── */}
          <View style={[styles.brandCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.brandCardHeader}>
              <View style={[styles.brandLogoBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                {brandInfo.logo ? (
                  <Image source={{ uri: brandInfo.logo }} style={styles.brandLogoImg} resizeMode="contain" />
                ) : (
                  <View style={[styles.brandInitialsBox, { backgroundColor: brandInfo.accentColor }]}>
                    <Text style={styles.brandInitialsText}>{brandInfo.initials}</Text>
                  </View>
                )}
              </View>

              <View style={styles.brandInfoWrap}>
                <View style={styles.brandTitleRow}>
                  <Text style={[styles.brandNameText, { color: colors.text }]}>{brandInfo.name}</Text>
                  {/* Badge of Verified Product */}
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={Colors.green} />
                    <Text style={styles.verifiedBadgeText}>Verified Product</Text>
                  </View>
                </View>

                <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
                  {brandInfo.tagline}
                </Text>
                <Text style={[styles.brandOrigin, { color: Colors.orange }]}>
                  {brandInfo.origin} • 100% Genuine Salon Distribution
                </Text>
              </View>
            </View>
          </View>

          {/* ─── SALON AUTHENTICITY PROMISE ─── */}
          <View style={[styles.promiseBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.promiseHeading, { color: colors.text }]}>The Groomish Salon Guarantee</Text>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Directly sourced from authorized manufacturers & distributors
              </Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Can be applied by your master stylist during your salon visit
              </Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Earns loyalty reward coins on every single retail purchase
              </Text>
            </View>
          </View>

          {/* ─── SUGGESTION IMAGES / COMPANION PRODUCTS (3:4 HORIZONTAL/PORTRAIT RATIO) ─── */}
          {suggestedProducts.length > 0 && (
            <View style={styles.suggestedSection}>
              <View style={styles.suggestedHeader}>
                <View>
                  <Text style={[styles.suggestedTitle, { color: colors.text }]}>Suggested Products</Text>
                  <Text style={[styles.suggestedSubtitle, { color: colors.textMuted }]}>
                    Companion haircare & styling rituals for optimal results
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedScroll}
              >
                {suggestedProducts.map((sp) => (
                  <TouchableOpacity
                    key={String(sp.id)}
                    style={[styles.suggestedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/product/[id]',
                        params: { id: String(sp.id) },
                      } as any);
                    }}
                    activeOpacity={0.85}
                  >
                    {/* 3:4 Aspect Ratio Image */}
                    <View style={[styles.suggestedImgWrap, { backgroundColor: colors.bg }]}>
                      <Image
                        source={{
                          uri:
                            sp.image ||
                            sp.imageUrl ||
                            'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=400&q=80',
                        }}
                        style={styles.suggestedImg}
                        resizeMode="cover"
                      />
                      <View style={styles.suggestedBadge}>
                        <Text style={styles.suggestedBadgeText}>Suggested</Text>
                      </View>
                    </View>

                    <View style={styles.suggestedBody}>
                      <Text style={styles.suggestedBrand} numberOfLines={1}>
                        {sp.brand || 'Groomish Pro'}
                      </Text>
                      <Text style={[styles.suggestedName, { color: colors.text }]} numberOfLines={1}>
                        {sp.name}
                      </Text>
                      <View style={styles.suggestedPriceRow}>
                        <Text style={[styles.suggestedPrice, { color: colors.text }]}>₹{sp.price}</Text>
                        <TouchableOpacity
                          style={styles.suggestedAddBtn}
                          onPress={() => handleAddToCart(sp)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="cart-outline" size={13} color={Colors.white} />
                          <Text style={styles.suggestedAddBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
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
              onPress={() => handleAddToCart(product)}
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
                handleAddToCart(product);
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
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
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
    gap: 2,
    padding: 4,
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

  // 3:4 Product Multi-Image Carousel
  carouselContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  slideWrap: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImg: {
    width: '100%',
    height: '100%',
  },
  heroTopBadges: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  brandBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    ...Shadows.sm,
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
    paddingVertical: 5,
    borderRadius: 8,
    ...Shadows.sm,
  },
  savingsBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  imageCounterBadge: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  imageCounterText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.orange,
  },
  dotInactive: {
    width: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
    fontSize: 15,
    fontWeight: '800',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Brand Card with Verified Product Badge
  brandCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    ...Shadows.sm,
  },
  brandCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  brandLogoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
  },
  brandInitialsBox: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInitialsText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  brandInfoWrap: {
    flex: 1,
    gap: 4,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  brandNameText: {
    fontSize: 15,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  verifiedBadgeText: {
    color: Colors.greenDark,
    fontSize: 10,
    fontWeight: '800',
  },
  brandTagline: {
    fontSize: 12,
    lineHeight: 17,
  },
  brandOrigin: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
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
    alignItems: 'center',
    gap: 8,
  },
  promiseText: {
    fontSize: 12,
    flex: 1,
  },

  // Suggested Products Section (3:4 ratio)
  suggestedSection: {
    marginTop: 6,
    gap: 12,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  suggestedSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  suggestedScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  suggestedCard: {
    width: 150,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  suggestedImgWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  suggestedImg: {
    width: '100%',
    height: '100%',
  },
  suggestedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  suggestedBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  suggestedBody: {
    padding: 8,
    gap: 2,
  },
  suggestedBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.orange,
    textTransform: 'uppercase',
  },
  suggestedName: {
    fontSize: 12,
    fontWeight: '800',
  },
  suggestedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  suggestedPrice: {
    fontSize: 13,
    fontWeight: '900',
  },
  suggestedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  suggestedAddBtnText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },

  // Bottom Sticky Bar
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
    gap: 8,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  stepperBtn: {
    padding: 2,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  addCartBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: Colors.orange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  addCartBottomText: {
    color: Colors.orange,
    fontSize: 12,
    fontWeight: '800',
  },
  buyNowBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
    ...Shadows.sm,
  },
  buyNowBottomText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
