import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { publicApi, customerApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';
import TopHeader from '../../components/TopHeader';

// ─── Cart State (simple in-memory for demo; replace with CartContext for full app) ───
type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  brand?: string;
  imageUrl?: string;
};

const SORT_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'name_asc', label: 'Name: A–Z' },
];

export default function ShopScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [groomCoinConfig, setGroomCoinConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartAnim] = useState(new Animated.Value(1));

  // Product Detail
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const totalCartItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const loadData = useCallback(async () => {
    try {
      const [prodRes, catRes, brandRes, coinRes] = await Promise.allSettled([
        publicApi.getProducts(),
        publicApi.getProductCategories(),
        publicApi.getProductBrands?.() ?? Promise.resolve({ data: [] }),
        publicApi.getGroomCoinConfig(),
      ]);
      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data;
        setProducts(Array.isArray(d) ? d : d?.content || []);
      }
      if (catRes.status === 'fulfilled') {
        const d = catRes.value.data;
        setCategories(Array.isArray(d) ? d : []);
      }
      if (brandRes.status === 'fulfilled') {
        const d = brandRes.value.data;
        setBrands(Array.isArray(d) ? d : []);
      }
      if (coinRes.status === 'fulfilled') {
        setGroomCoinConfig(coinRes.value.data);
      }
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ─── Cart Actions ───
  const animateBounce = () => {
    Animated.sequence([
      Animated.spring(cartAnim, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
      Animated.spring(cartAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        brand: product.brand,
        imageUrl: product.imageUrl,
      }];
    });
    animateBounce();
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => i.productId === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const getCartQty = (productId: number) => {
    return cart.find((i) => i.productId === productId)?.quantity || 0;
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to proceed with checkout and earn Groom Coins.',
        [
          { text: 'Continue Browsing', style: 'cancel' },
          {
            text: 'Sign In / Register',
            onPress: () => {
              setShowCart(false);
              router.push('/(auth)/login');
            },
          },
        ]
      );
      return;
    }
    Alert.alert(
      '🛒 Checkout',
      `Total: ₹${totalCartAmount.toLocaleString()}\n\nProceed to checkout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            Alert.alert('✅ Order Placed', 'Your order has been submitted. Check your bookings for confirmation!');
            setCart([]);
            setShowCart(false);
          },
        },
      ]
    );
  };

  // ─── Filter & Sort ───
  const filteredProducts = products
    .filter((p: any) => {
      const matchSearch = !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
        || (p.brand || '').toLowerCase().includes(search.toLowerCase())
        || (p.description || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || p.category === selectedCategory;
      const matchBrand = !selectedBrand || p.brand === selectedBrand;
      return matchSearch && matchCategory && matchBrand;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  const spendPerCoin = 100;
  const calculateCoins = (price: number) => {
    if (!price || price <= 0) return 0;
    return Math.max(1, Math.round(price / spendPerCoin));
  };

  const activeFilterCount = [selectedCategory, selectedBrand, sortBy !== 'default'].filter(Boolean).length;

  // ─── Render Product Card ───
  const renderProductCard = ({ item: product }: { item: any }) => {
    const qty = getCartQty(product.id);
    const coins = calculateCoins(product.price || 0);
    const discount = product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/product/[id]',
            params: { id: String(product.id) },
          } as any)
        }
      >
        {/* Image Area */}
        <View style={styles.productImageWrap}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="cube-outline" size={36} color={Colors.orange} />
            </View>
          )}
          {discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
            </View>
          )}
          {product.inStock === false && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.productContent}>
          {product.brand && (
            <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
          )}
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

          {product.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{product.category}</Text>
            </View>
          )}

          {/* Price Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>₹{product.price?.toLocaleString() || '–'}</Text>
              {product.mrp && product.mrp > product.price && (
                <Text style={styles.mrpPrice}>₹{product.mrp?.toLocaleString()}</Text>
              )}
            </View>
            {coins > 0 && (
              <View style={styles.coinEarnBadge}>
                <Text style={styles.coinEarnText}>🪙 +{coins}</Text>
              </View>
            )}
          </View>

          {/* Cart Controls */}
          {product.inStock !== false && (
            qty > 0 ? (
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQty(product.id, -1)}
                >
                  <Ionicons name="remove" size={16} color={Colors.orange} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnAdd]}
                  onPress={() => updateQty(product.id, 1)}
                >
                  <Ionicons name="add" size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addToCartBtn}
                onPress={() => addToCart(product)}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={14} color={Colors.white} />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ─── Universal Top Navbar ─── */}
      <TopHeader showBranchSelector={true} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Groomish Shop</Text>
          <Text style={styles.headerSub}>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available</Text>
        </View>
        {/* Cart Button */}
        <Animated.View style={{ transform: [{ scale: cartAnim }] }}>
          <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
            <Ionicons name="cart-outline" size={22} color={Colors.slate} />
            {totalCartItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ─── Search Bar ─── */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={17} color={Colors.slateLight} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands..."
            placeholderTextColor={Colors.slateXLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={Colors.slateLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? Colors.white : Colors.slate} />
          {activeFilterCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Category Pills ─── */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catScrollContent}
        >
          <TouchableOpacity
            style={[styles.catPill, !selectedCategory && styles.catPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.catPillText, !selectedCategory && styles.catPillTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ─── Sort Bar ─── */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>
          {filteredProducts.length} results
        </Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortModal(true)}>
          <Ionicons name="swap-vertical-outline" size={15} color={Colors.orange} />
          <Text style={styles.sortBtnText}>
            {SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Sort'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={Colors.orange} />
        </TouchableOpacity>
      </View>

      {/* ─── Product Grid ─── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />
          }
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={64} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptyText}>
            {search ? `No results for "${search}"` : 'No products match your filters.'}
          </Text>
          {(search || selectedCategory || selectedBrand) && (
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => { setSearch(''); setSelectedCategory(null); setSelectedBrand(null); setSortBy('default'); }}
            >
              <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── Sticky Cart Summary ─── */}
      {totalCartItems > 0 && !showCart && (
        <TouchableOpacity style={styles.cartSummaryBar} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          <View style={styles.cartSummaryLeft}>
            <View style={styles.cartSummaryCount}>
              <Text style={styles.cartSummaryCountText}>{totalCartItems}</Text>
            </View>
            <Text style={styles.cartSummaryLabel}>View Cart</Text>
          </View>
          <Text style={styles.cartSummaryAmount}>₹{totalCartAmount.toLocaleString()}</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* ─── Product Detail Modal ─── */}
      <Modal
        visible={!!selectedProduct}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProduct(null)}
      >
        {selectedProduct && (
          <SafeAreaView style={styles.detailRoot} edges={['top', 'bottom']}>
            {/* Close */}
            <View style={styles.detailHeader}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={22} color={Colors.slate} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image */}
              <View style={styles.detailImageWrap}>
                {selectedProduct.imageUrl ? (
                  <Image source={{ uri: selectedProduct.imageUrl }} style={styles.detailImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.detailImageWrap, styles.detailImagePlaceholder]}>
                    <Ionicons name="cube-outline" size={64} color={Colors.orange} />
                  </View>
                )}
                {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                  <View style={[styles.discountBadge, { position: 'absolute', top: 16, left: 16, borderRadius: Radius.md }]}>
                    <Text style={styles.discountBadgeText}>
                      {Math.round(((selectedProduct.mrp - selectedProduct.price) / selectedProduct.mrp) * 100)}% OFF
                    </Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.detailContent}>
                {selectedProduct.brand && (
                  <Text style={styles.detailBrand}>{selectedProduct.brand}</Text>
                )}
                <Text style={styles.detailName}>{selectedProduct.name}</Text>
                {selectedProduct.category && (
                  <View style={[styles.categoryTag, { alignSelf: 'flex-start', marginTop: 8 }]}>
                    <Text style={styles.categoryTagText}>{selectedProduct.category}</Text>
                  </View>
                )}

                {/* Price */}
                <View style={styles.detailPriceRow}>
                  <View>
                    <Text style={styles.detailPrice}>₹{selectedProduct.price?.toLocaleString() || '–'}</Text>
                    {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                      <Text style={styles.detailMrp}>MRP ₹{selectedProduct.mrp?.toLocaleString()}</Text>
                    )}
                  </View>
                  {calculateCoins(selectedProduct.price || 0) > 0 && (
                    <View style={styles.detailCoinBadge}>
                      <Text style={styles.detailCoinEmoji}>🪙</Text>
                      <View>
                        <Text style={styles.detailCoinTitle}>Earn {calculateCoins(selectedProduct.price || 0)} Groom Coins</Text>
                        <Text style={styles.detailCoinSub}>1 coin per ₹{spendPerCoin} spent</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Description */}
                {selectedProduct.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Description</Text>
                    <Text style={styles.detailDesc}>{selectedProduct.description}</Text>
                  </View>
                )}

                {/* Volume / Weight */}
                {(selectedProduct.volume || selectedProduct.weight || selectedProduct.size) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Details</Text>
                    {selectedProduct.volume && (
                      <Text style={styles.detailSpec}>Volume: {selectedProduct.volume}</Text>
                    )}
                    {selectedProduct.weight && (
                      <Text style={styles.detailSpec}>Weight: {selectedProduct.weight}</Text>
                    )}
                    {selectedProduct.size && (
                      <Text style={styles.detailSpec}>Size: {selectedProduct.size}</Text>
                    )}
                  </View>
                )}

                {/* Spacer for bottom bar */}
                <View style={{ height: 100 }} />
              </View>
            </ScrollView>

            {/* Bottom Action */}
            {selectedProduct.inStock !== false ? (
              <View style={styles.detailFooter}>
                {getCartQty(selectedProduct.id) > 0 ? (
                  <View style={styles.detailQtyControls}>
                    <TouchableOpacity
                      style={styles.detailQtyBtn}
                      onPress={() => updateQty(selectedProduct.id, -1)}
                    >
                      <Ionicons name="remove" size={20} color={Colors.orange} />
                    </TouchableOpacity>
                    <Text style={styles.detailQtyText}>{getCartQty(selectedProduct.id)}</Text>
                    <TouchableOpacity
                      style={[styles.detailQtyBtn, styles.detailQtyBtnAdd]}
                      onPress={() => updateQty(selectedProduct.id, 1)}
                    >
                      <Ionicons name="add" size={20} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.detailAddBtn}
                    onPress={() => addToCart(selectedProduct)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="cart-outline" size={20} color={Colors.white} />
                    <Text style={styles.detailAddBtnText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.detailFooter}>
                <View style={[styles.detailAddBtn, { backgroundColor: Colors.gray300 }]}>
                  <Text style={[styles.detailAddBtnText, { color: Colors.gray600 }]}>Out of Stock</Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        )}
      </Modal>

      {/* ─── Cart Modal ─── */}
      <Modal
        visible={showCart}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCart(false)}
      >
        <SafeAreaView style={styles.cartRoot} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.cartModalHeader}>
            <Text style={styles.cartModalTitle}>🛒 Your Cart</Text>
            <TouchableOpacity onPress={() => setShowCart(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.slate} />
            </TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={64} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
              <Text style={styles.emptyText}>Add products from the shop to get started!</Text>
              <TouchableOpacity style={styles.shopNowBtn} onPress={() => setShowCart(false)}>
                <Text style={styles.shopNowBtnText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
                {cart.map((item) => (
                  <View key={item.productId} style={styles.cartItem}>
                    <View style={styles.cartItemImage}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="cube-outline" size={24} color={Colors.orange} />
                      )}
                    </View>
                    <View style={styles.cartItemInfo}>
                      {item.brand && <Text style={styles.cartItemBrand}>{item.brand}</Text>}
                      <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>₹{(item.price * item.quantity).toLocaleString()}</Text>
                      {calculateCoins(item.price * item.quantity) > 0 && (
                        <Text style={styles.cartItemCoins}>🪙 +{calculateCoins(item.price * item.quantity)} coins</Text>
                      )}
                    </View>
                    <View style={styles.cartItemControls}>
                      <TouchableOpacity
                        style={styles.cartQtyBtn}
                        onPress={() => updateQty(item.productId, -1)}
                      >
                        <Ionicons name="remove" size={14} color={Colors.slate} />
                      </TouchableOpacity>
                      <Text style={styles.cartQtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.cartQtyBtn, styles.cartQtyBtnAdd]}
                        onPress={() => updateQty(item.productId, 1)}
                      >
                        <Ionicons name="add" size={14} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Groom Coins Earn Summary */}
                {calculateCoins(totalCartAmount) > 0 && (
                  <View style={styles.cartCoinSummary}>
                    <Text style={styles.cartCoinSummaryEmoji}>🪙</Text>
                    <Text style={styles.cartCoinSummaryText}>
                      You'll earn <Text style={styles.cartCoinSummaryBold}>{calculateCoins(totalCartAmount)} Groom Coins</Text> on this order!
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Cart Footer */}
              <View style={styles.cartFooter}>
                <View style={styles.cartTotalRow}>
                  <Text style={styles.cartTotalLabel}>Subtotal ({totalCartItems} item{totalCartItems !== 1 ? 's' : ''})</Text>
                  <Text style={styles.cartTotalAmount}>₹{totalCartAmount.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
                  <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearCartBtn}
                  onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => setCart([]) },
                  ])}
                >
                  <Text style={styles.clearCartBtnText}>Clear Cart</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* ─── Filter Bottom Sheet ─── */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable style={styles.filterOverlay} onPress={() => setShowFilters(false)}>
          <Pressable style={styles.filterSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.filterSheetHandle} />
            <Text style={styles.filterSheetTitle}>Filters</Text>

            {/* Category */}
            {categories.length > 0 && (
              <>
                <Text style={styles.filterGroupTitle}>Category</Text>
                <View style={styles.filterChips}>
                  <TouchableOpacity
                    style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(null)}
                  >
                    <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                      onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    >
                      <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Brand */}
            {brands.length > 0 && (
              <>
                <Text style={styles.filterGroupTitle}>Brand</Text>
                <View style={styles.filterChips}>
                  <TouchableOpacity
                    style={[styles.filterChip, !selectedBrand && styles.filterChipActive]}
                    onPress={() => setSelectedBrand(null)}
                  >
                    <Text style={[styles.filterChipText, !selectedBrand && styles.filterChipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[styles.filterChip, selectedBrand === brand && styles.filterChipActive]}
                      onPress={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                    >
                      <Text style={[styles.filterChipText, selectedBrand === brand && styles.filterChipTextActive]}>{brand}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.filterClearBtn}
                onPress={() => { setSelectedCategory(null); setSelectedBrand(null); setSortBy('default'); setShowFilters(false); }}
              >
                <Text style={styles.filterClearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterApplyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Sort Modal ─── */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={styles.filterOverlay} onPress={() => setShowSortModal(false)}>
          <Pressable style={[styles.filterSheet, { paddingBottom: 32 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.filterSheetHandle} />
            <Text style={styles.filterSheetTitle}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.sortOption}
                onPress={() => { setSortBy(opt.id); setShowSortModal(false); }}
              >
                <Text style={[styles.sortOptionText, sortBy === opt.id && { color: Colors.orange, fontWeight: '700' }]}>
                  {opt.label}
                </Text>
                {sortBy === opt.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.orange} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Colors reference for gray600
const gray600 = '#757575';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  loadingText: { fontSize: Typography.sm, color: Colors.slateLight },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.slate },
  headerSub: { fontSize: Typography.xs, color: Colors.slateLight, marginTop: 2 },
  cartBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gray100,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: Colors.orange, borderRadius: 10,
    minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: Colors.white,
  },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },

  // Search
  searchRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, height: 44,
    borderWidth: 1.5, borderColor: Colors.gray200,
  },
  searchInput: { flex: 1, fontSize: Typography.sm, color: Colors.slate },
  filterBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.gray100,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.gray200,
    position: 'relative',
  },
  filterBtnActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  filterCountBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.red, borderRadius: 8,
    width: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  filterCountText: { fontSize: 9, fontWeight: '800', color: Colors.white },

  // Category Pills
  catScroll: { maxHeight: 50, backgroundColor: Colors.white },
  catScrollContent: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  catPill: {
    paddingHorizontal: Spacing.lg, paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: Colors.gray200,
  },
  catPillActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  catPillText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.slateLight },
  catPillTextActive: { color: Colors.white, fontWeight: '700' },

  // Sort Bar
  sortBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1, borderBottomColor: Colors.gray200,
  },
  sortLabel: { fontSize: Typography.xs, color: Colors.slateLight, fontWeight: '500' },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.orangeLight,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.orange + '30',
  },
  sortBtnText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.orange },

  // Product Grid
  gridRow: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  gridContent: { paddingVertical: Spacing.md, paddingBottom: Spacing['5xl'] },

  // Product Card
  productCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.md,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  productImageWrap: {
    height: 140,
    backgroundColor: Colors.bg,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: Colors.orangeLight,
    justifyContent: 'center', alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.red,
    borderRadius: Radius.sm,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  discountBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  outOfStockText: { fontSize: Typography.sm, fontWeight: '800', color: Colors.white },

  productContent: { padding: Spacing.md },
  productBrand: { fontSize: 10, fontWeight: '700', color: Colors.orange, textTransform: 'uppercase', letterSpacing: 0.5 },
  productName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.slate, marginTop: 2, lineHeight: 18 },
  categoryTag: {
    backgroundColor: Colors.orangeLight,
    borderRadius: Radius.full, alignSelf: 'flex-start',
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 4,
  },
  categoryTagText: { fontSize: 10, fontWeight: '700', color: Colors.orange },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.sm },
  price: { fontSize: Typography.md, fontWeight: '900', color: Colors.orange },
  mrpPrice: { fontSize: 10, color: Colors.slateXLight, textDecorationLine: 'line-through' },
  coinEarnBadge: {
    backgroundColor: Colors.goldLight, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  coinEarnText: { fontSize: 10, fontWeight: '700', color: Colors.goldDark },

  // Cart Controls on card
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm,
    backgroundColor: Colors.orangeLight,
    borderRadius: Radius.md, padding: 2,
    borderWidth: 1, borderColor: Colors.orange + '30',
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.orange + '40',
  },
  qtyBtnAdd: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  qtyText: { fontSize: Typography.base, fontWeight: '800', color: Colors.orange },
  addToCartBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.orange,
    borderRadius: Radius.md, height: 34,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5,
  },
  addToCartText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  // Sticky Cart Bar
  cartSummaryBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.orange,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    gap: Spacing.md,
    ...Shadows.orange,
  },
  cartSummaryLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  cartSummaryCount: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  cartSummaryCountText: { fontSize: Typography.sm, fontWeight: '800', color: Colors.white },
  cartSummaryLabel: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
  cartSummaryAmount: { fontSize: Typography.base, fontWeight: '900', color: Colors.white },

  // Empty State
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['5xl'] },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.slate, marginTop: Spacing.lg },
  emptyText: { fontSize: Typography.sm, color: Colors.slateLight, marginTop: 6, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
  clearFiltersBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, marginTop: Spacing.xl, ...Shadows.orange,
  },
  clearFiltersBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },

  // ─── Product Detail Modal ───
  detailRoot: { flex: 1, backgroundColor: Colors.white },
  detailHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: 'center', alignItems: 'center',
  },
  detailImageWrap: { height: 280, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  detailImage: { width: '100%', height: '100%' },
  detailImagePlaceholder: { backgroundColor: Colors.orangeLight },
  detailContent: { padding: Spacing.xl },
  detailBrand: { fontSize: Typography.sm, fontWeight: '700', color: Colors.orange, textTransform: 'uppercase', letterSpacing: 1 },
  detailName: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.slate, marginTop: 4, lineHeight: 32 },
  detailPriceRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: Spacing.lg },
  detailPrice: { fontSize: Typography['3xl'], fontWeight: '900', color: Colors.orange },
  detailMrp: { fontSize: Typography.sm, color: Colors.slateXLight, textDecorationLine: 'line-through', marginTop: 2 },
  detailCoinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.goldLight, borderRadius: Radius.lg,
    padding: Spacing.md, maxWidth: 150,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  detailCoinEmoji: { fontSize: 24 },
  detailCoinTitle: { fontSize: Typography.sm, fontWeight: '800', color: Colors.goldDark },
  detailCoinSub: { fontSize: Typography.xs, color: Colors.slateLight, marginTop: 1 },
  detailSection: { marginTop: Spacing.xl },
  detailSectionTitle: { fontSize: Typography.sm, fontWeight: '800', color: Colors.slate, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  detailDesc: { fontSize: Typography.base, color: Colors.slateLight, lineHeight: 24 },
  detailSpec: { fontSize: Typography.sm, color: Colors.slateLight, marginBottom: 4 },
  detailFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
    ...Shadows.md,
  },
  detailQtyControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xl, height: 52,
    backgroundColor: Colors.orangeLight,
    borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.orange + '40',
  },
  detailQtyBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.orange + '50',
  },
  detailQtyBtnAdd: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  detailQtyText: { fontSize: Typography.xl, fontWeight: '900', color: Colors.orange },
  detailAddBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    ...Shadows.orange,
  },
  detailAddBtnText: { fontSize: Typography.md, fontWeight: '700', color: Colors.white },

  // ─── Cart Modal ───
  cartRoot: { flex: 1, backgroundColor: Colors.bg },
  cartModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  cartModalTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.slate },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  shopNowBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, marginTop: Spacing.xl, ...Shadows.orange,
  },
  shopNowBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },
  cartList: { flex: 1 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, margin: Spacing.xl, marginBottom: 0,
    borderRadius: Radius.xl, padding: Spacing.md,
    ...Shadows.sm, borderWidth: 1, borderColor: Colors.gray100,
  },
  cartItemImage: {
    width: 60, height: 60, borderRadius: Radius.md,
    backgroundColor: Colors.orangeLight, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  cartItemInfo: { flex: 1 },
  cartItemBrand: { fontSize: 10, fontWeight: '700', color: Colors.orange, textTransform: 'uppercase' },
  cartItemName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.slate },
  cartItemPrice: { fontSize: Typography.base, fontWeight: '900', color: Colors.orange, marginTop: 2 },
  cartItemCoins: { fontSize: 10, color: Colors.goldDark, fontWeight: '600' },
  cartItemControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cartQtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.gray200,
  },
  cartQtyBtnAdd: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  cartQtyText: { fontSize: Typography.sm, fontWeight: '800', color: Colors.slate, width: 24, textAlign: 'center' },
  cartCoinSummary: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    margin: Spacing.xl, marginTop: Spacing.md,
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  cartCoinSummaryEmoji: { fontSize: 22 },
  cartCoinSummaryText: { flex: 1, fontSize: Typography.sm, color: Colors.goldDark, lineHeight: 20 },
  cartCoinSummaryBold: { fontWeight: '800' },
  cartFooter: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.gray100,
    gap: Spacing.md, ...Shadows.md,
  },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartTotalLabel: { fontSize: Typography.base, color: Colors.slateLight, fontWeight: '500' },
  cartTotalAmount: { fontSize: Typography.xl, fontWeight: '900', color: Colors.slate },
  checkoutBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    ...Shadows.orange,
  },
  checkoutBtnText: { fontSize: Typography.md, fontWeight: '700', color: Colors.white },
  clearCartBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  clearCartBtnText: { fontSize: Typography.sm, color: Colors.red, fontWeight: '600' },

  // ─── Filter Sheet ───
  filterOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl, paddingBottom: 48,
    gap: Spacing.md,
  },
  filterSheetHandle: {
    width: 40, height: 4, backgroundColor: Colors.gray300,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },
  filterSheetTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.slate, marginBottom: Spacing.sm },
  filterGroupTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.slateLight, textTransform: 'uppercase', letterSpacing: 0.8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray100, borderWidth: 1.5, borderColor: Colors.gray200,
  },
  filterChipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  filterChipText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.slateLight },
  filterChipTextActive: { color: Colors.white, fontWeight: '700' },
  filterActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  filterClearBtn: {
    flex: 1, height: 48, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.gray200,
    justifyContent: 'center', alignItems: 'center',
  },
  filterClearBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.slateLight },
  filterApplyBtn: {
    flex: 2, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.orange, justifyContent: 'center', alignItems: 'center',
    ...Shadows.orange,
  },
  filterApplyBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.white },

  // Sort Options
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  sortOptionText: { fontSize: Typography.base, color: Colors.slate, fontWeight: '500' },
});
