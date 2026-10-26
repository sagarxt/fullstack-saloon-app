import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBranch } from '../../context/BranchContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { publicApi } from '../../api/client';
import { Colors, Shadows } from '../../theme/colors';
import TopHeader from '../../components/TopHeader';
import { getServicePriceRange, getServiceDurationRange } from '../../utils/serviceHelper';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 20;

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string; tab?: string; brand?: string }>();
  const { selectedBranch, openBranchModal } = useBranch();
  const { itemCount, addItem, getItemCountForId } = useCart();
  const { isStaffOrAdmin } = useAuth();
  const { isDark, colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'SERVICES' | 'PRODUCTS'>(
    params.tab === 'products' ? 'PRODUCTS' : 'SERVICES'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    params.categoryName || 'ALL'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(
    params.brand || 'ALL'
  );

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [displayedItems, setDisplayedItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync params when navigated from home
  useEffect(() => {
    if (params.tab === 'products') {
      setActiveTab('PRODUCTS');
    }
    if (params.categoryName) {
      setSelectedCategory(params.categoryName);
    }
    if (params.brand) {
      setSelectedBrand(params.brand);
    }
  }, [params]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, srvRes, prodRes] = await Promise.allSettled([
        publicApi.getCategories(),
        selectedBranch
          ? publicApi.getStoreServices(selectedBranch.id)
          : publicApi.getServices(),
        selectedBranch
          ? publicApi.getStoreProducts(selectedBranch.id)
          : publicApi.getProducts(),
      ]);

      if (catRes.status === 'fulfilled') {
        const d = catRes.value.data;
        setCategories(Array.isArray(d) ? d : d?.content || []);
      }

      if (srvRes.status === 'fulfilled') {
        const d = srvRes.value.data;
        const list = Array.isArray(d) ? d : d?.content || [];
        const normalized = list.map((s: any) => ({
          ...s,
          id: s.serviceId || s.id,
          serviceId: s.serviceId || s.id,
        }));
        setAllServices(normalized);
      }

      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data;
        const list = Array.isArray(d) ? d : d?.content || [];
        const normalized = list.map((p: any) => ({
          ...p,
          id: p.productId || p.id,
          productId: p.productId || p.id,
        }));
        setAllProducts(normalized);

        // Extract brands
        const brandSet = new Set<string>();
        normalized.forEach((p: any) => {
          if (p.brand) brandSet.add(p.brand);
        });
        setBrands(['ALL', ...Array.from(brandSet)]);
      }
    } catch (err) {
      console.error('Services screen load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadData();
  };

  // Filtered dataset
  const filteredItems = useMemo(() => {
    const isService = activeTab === 'SERVICES';
    const sourceList = isService ? allServices : allProducts;
    const query = searchQuery.trim().toLowerCase();

    return sourceList.filter((item) => {
      // Category match
      if (selectedCategory !== 'ALL') {
        const itemCat = item.categoryName || item.category?.name || '';
        if (itemCat.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Brand match for products
      if (!isService && selectedBrand !== 'ALL') {
        if (item.brand?.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
      }

      // Search match
      if (query) {
        const nameMatch = item.name?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const brandMatch = item.brand?.toLowerCase().includes(query);
        const catMatch = (item.categoryName || '').toLowerCase().includes(query);
        if (!nameMatch && !descMatch && !brandMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, allServices, allProducts, selectedCategory, selectedBrand, searchQuery]);

  // Apply 20 items pagination
  useEffect(() => {
    const end = page * PAGE_SIZE;
    setDisplayedItems(filteredItems.slice(0, end));
  }, [filteredItems, page]);

  const handleLoadMore = () => {
    if (displayedItems.length < filteredItems.length) {
      setPage((prev) => prev + 1);
    }
  };

  const handleAddToCart = (item: any) => {
    if (activeTab === 'SERVICES') {
      if (isStaffOrAdmin) {
        Alert.alert(
          'Staff / Admin Account',
          'Staff and Admin accounts can only browse products on the mobile app. You cannot book salon services here. Please use the Web Portal to manage services.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (item.subServices && item.subServices.length > 0) {
        router.push({
          pathname: '/(tabs)/service/[id]',
          params: { id: String(item.id) },
        } as any);
        return;
      }
      addItem({
        id: item.id,
        serviceId: item.id,
        itemType: 'SERVICE',
        name: item.name,
        price: item.price || 0,
        mrp: item.mrp,
        image: item.image,
        durationMinutes: item.durationMinutes || 30,
      });
    } else {
      addItem({
        id: item.id,
        productId: item.id,
        itemType: 'PRODUCT',
        name: item.name,
        price: item.price || 0,
        mrp: item.mrp,
        image: item.image,
      });
    }
  };

  const categoryPills = useMemo(() => {
    const names = categories.map((c) => c.name).filter(Boolean);
    return ['ALL', ...Array.from(new Set(names))];
  }, [categories]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* ─── UNIVERSAL TOP HEADER ─── */}
      <TopHeader showBranchSelector={true} />

      {/* ─── 2 TABS: SERVICES & PRODUCTS ─── */}
      <View style={[styles.tabToggleRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabToggleBtn,
            activeTab === 'SERVICES' && styles.tabToggleBtnActive,
          ]}
          onPress={() => {
            setActiveTab('SERVICES');
            setPage(1);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cut-outline"
            size={16}
            color={activeTab === 'SERVICES' ? Colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabToggleText,
              { color: colors.textSecondary },
              activeTab === 'SERVICES' && styles.tabToggleTextActive,
            ]}
          >
            Salon Services ({allServices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabToggleBtn,
            activeTab === 'PRODUCTS' && styles.tabToggleBtnActive,
          ]}
          onPress={() => {
            setActiveTab('PRODUCTS');
            setPage(1);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={activeTab === 'PRODUCTS' ? Colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabToggleText,
              { color: colors.textSecondary },
              activeTab === 'PRODUCTS' && styles.tabToggleTextActive,
            ]}
          >
            Retail Products ({allProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── STAFF / ADMIN NOTICE BANNER ─── */}
      {isStaffOrAdmin && (
        <View
          style={[
            styles.staffNoticeBanner,
            { backgroundColor: isDark ? '#1e293b' : '#fff7ed', borderColor: Colors.orange },
          ]}
        >
          <Ionicons name="information-circle" size={18} color={Colors.orange} />
          <Text style={[styles.staffNoticeText, { color: isDark ? '#f8fafc' : '#9a3412' }]}>
            Staff/Admin Mode: Service booking is disabled on mobile app. You can browse retail products.
          </Text>
        </View>
      )}

      {/* ─── SEARCH INPUT ─── */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginLeft: 12 }} />
        <TextInput
          placeholder={`Search ${activeTab === 'SERVICES' ? 'treatments, haircuts, facials...' : 'retail shampoos, oils, serums...'}`}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── CATEGORY PILLS (HORIZONTAL SCROLL) ─── */}
      <View style={[styles.pillsWrap, { borderBottomColor: colors.cardBorder }]}>
        <FlatList
          horizontal
          data={categoryPills}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.pillBtn,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  isSelected && styles.pillBtnActive,
                ]}
                onPress={() => {
                  setSelectedCategory(item);
                  setPage(1);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, { color: colors.textSecondary }, isSelected && styles.pillTextActive]}>
                  {item === 'ALL' ? 'All Treatments' : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ─── SERVICES / PRODUCTS LIST (20 ITEMS PER PAGE) ─── */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Fetching available catalog...</Text>
        </View>
      ) : (
        <FlatList
          key="two-column-services"
          data={displayedItems}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.orange}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            displayedItems.length < filteredItems.length ? (
              <TouchableOpacity
                style={[styles.loadMoreBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={handleLoadMore}
              >
                <Text style={styles.loadMoreText}>
                  Load More ({filteredItems.length - displayedItems.length} remaining)
                </Text>
              </TouchableOpacity>
            ) : displayedItems.length > 0 ? (
              <Text style={[styles.endListText, { color: colors.textMuted }]}>
                ✓ Showing all {displayedItems.length} items
              </Text>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <Ionicons
                name={activeTab === 'SERVICES' ? 'cut-outline' : 'sparkles-outline'}
                size={44}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No items matched your filters</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Try clearing your search query or selecting "All Treatments"
              </Text>
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedBrand('ALL');
                }}
              >
                <Text style={styles.clearFilterText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item }) => {
            const inCartCount = getItemCountForId(
              activeTab === 'SERVICES' ? 'SERVICE' : 'PRODUCT',
              item.id
            );
            const isService = activeTab === 'SERVICES';

            return (
              <View style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={[
                    styles.cardImageContainer,
                    isService ? styles.serviceImageAspectRatio : styles.productImageAspectRatio,
                    { backgroundColor: colors.bg },
                  ]}
                  onPress={() => {
                    if (isService) {
                      router.push({
                        pathname: '/(tabs)/service/[id]',
                        params: { id: String(item.id) },
                      } as any);
                    } else {
                      router.push({
                        pathname: '/(tabs)/product/[id]',
                        params: { id: String(item.id) },
                      } as any);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{
                      uri:
                        item.image ||
                        (isService
                          ? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80'
                          : 'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=300&q=80'),
                    }}
                    style={styles.cardImg}
                  />
                  {isService ? (
                    <View style={styles.durationPill}>
                      <Ionicons name="time" size={9} color={Colors.white} />
                      <Text style={styles.durationPillText}>
                        {getServiceDurationRange(item)}
                      </Text>
                    </View>
                  ) : item.brand ? (
                    <View style={[styles.durationPill, { backgroundColor: Colors.blue }]}>
                      <Text style={styles.durationPillText} numberOfLines={1}>{item.brand}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>

                <View style={styles.cardInfo}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardCategory} numberOfLines={1}>
                      {item.categoryName || (isService ? 'Treatment' : 'Retail')}
                    </Text>
                    {inCartCount > 0 && (
                      <View style={styles.inCartBadge}>
                        <Text style={styles.inCartBadgeText}>{inCartCount}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (isService) {
                        router.push({
                          pathname: '/(tabs)/service/[id]',
                          params: { id: String(item.id) },
                        } as any);
                      } else {
                        router.push({
                          pathname: '/(tabs)/product/[id]',
                          params: { id: String(item.id) },
                        } as any);
                      }
                    }}
                  >
                    <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {item.description || 'Specialized luxury salon treatment.'}
                  </Text>

                  <View style={[styles.priceRow, { borderTopColor: colors.cardBorder }]}>
                    <View>
                      <Text style={[styles.priceText, { color: colors.text }]}>
                        {isService ? getServicePriceRange(item) : `₹${item.price}`}
                      </Text>
                      {(!item.subServices || item.subServices.length === 0) && item.mrp && item.mrp > item.price && (
                        <Text style={[styles.mrpText, { color: colors.textMuted }]}>₹{item.mrp}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.addCartBtn}
                      onPress={() => handleAddToCart(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={14} color={Colors.white} />
                      <Text style={styles.addCartText}>
                        {inCartCount > 0 ? 'Add+' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  staffNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  staffNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 6,
  },
  tabToggleBtnActive: {
    backgroundColor: Colors.orange,
    ...Shadows.orange,
  },
  tabToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabToggleTextActive: {
    color: Colors.white,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  pillsWrap: {
    marginTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillBtnActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  pillTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.sm,
  },
  cardImageContainer: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  serviceImageAspectRatio: {
    aspectRatio: 4 / 3,
  },
  productImageAspectRatio: {
    aspectRatio: 3 / 4,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  durationPill: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  durationPillText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  inCartBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  inCartBadgeText: {
    color: Colors.green,
    fontSize: 9,
    fontWeight: '800',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
    lineHeight: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
  },
  mrpText: {
    fontSize: 10,
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 2,
  },
  addCartText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  loadMoreBtn: {
    marginTop: 10,
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.orange,
  },
  endListText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 16,
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: Colors.orange,
  },
  clearFilterText: {
    color: Colors.orange,
    fontSize: 12,
    fontWeight: '700',
  },
});
