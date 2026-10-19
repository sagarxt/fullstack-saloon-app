import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBranch } from '../context/BranchContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { publicApi, customerApi } from '../api/client';
import { Colors, Radius, Shadows, Typography, Spacing } from '../theme/colors';

interface TopHeaderProps {
  showBranchSelector?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopHeader({
  showBranchSelector = true,
  showBack = false,
  onBack,
}: TopHeaderProps) {
  const router = useRouter();
  const { selectedBranch, openBranchModal } = useBranch();
  const { itemCount, addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { isDark, colors } = useTheme();

  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'ALL' | 'SERVICES' | 'PRODUCTS'>('ALL');
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Fetch unread notification count
  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadNotifs(0);
      return;
    }
    try {
      const res = await customerApi.getUnreadCount();
      const count = typeof res.data === 'number' ? res.data : res.data?.count || 0;
      setUnreadNotifs(count);
    } catch (_) {
      setUnreadNotifs(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Load catalog for global search
  const loadSearchCatalog = useCallback(async () => {
    if (allServices.length > 0 && allProducts.length > 0) return;
    setLoadingCatalog(true);
    try {
      const [srvRes, prodRes] = await Promise.allSettled([
        selectedBranch ? publicApi.getStoreServices(selectedBranch.id) : publicApi.getServices(),
        selectedBranch ? publicApi.getStoreProducts(selectedBranch.id) : publicApi.getProducts(),
      ]);

      if (srvRes.status === 'fulfilled') {
        const d = srvRes.value.data;
        const list = Array.isArray(d) ? d : d?.content || [];
        setAllServices(
          list.map((s: any) => ({
            ...s,
            id: s.serviceId || s.id,
            serviceId: s.serviceId || s.id,
            type: 'SERVICE',
          }))
        );
      }

      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data;
        const list = Array.isArray(d) ? d : d?.content || [];
        setAllProducts(
          list.map((p: any) => ({
            ...p,
            id: p.productId || p.id,
            productId: p.productId || p.id,
            type: 'PRODUCT',
          }))
        );
      }
    } catch (err) {
      console.warn('Search catalog load error:', err);
    } finally {
      setLoadingCatalog(false);
    }
  }, [selectedBranch, allServices.length, allProducts.length]);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    loadSearchCatalog();
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Filtered search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    let pool: any[] = [];
    if (searchFilter === 'ALL' || searchFilter === 'SERVICES') {
      pool = pool.concat(allServices);
    }
    if (searchFilter === 'ALL' || searchFilter === 'PRODUCTS') {
      pool = pool.concat(allProducts);
    }

    return pool.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const cat = (item.categoryName || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q) || brand.includes(q);
    });
  }, [searchQuery, searchFilter, allServices, allProducts]);

  const handleSelectSearchResult = (item: any) => {
    handleCloseSearch();
    if (item.type === 'SERVICE') {
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
  };

  const dynamicIconColor = isDark ? Colors.white : '#1E293B';
  const dynamicPillBg = isDark ? '#1E293B' : '#F8FAFC';
  const dynamicBorder = isDark ? '#334155' : '#E2E8F0';

  return (
    <>
      {/* ─── MAIN TOP HEADER BAR ─── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.headerBorder,
          },
        ]}
      >
        {/* Left Side: Logo & Branch Selector */}
        <View style={styles.leftGroup}>
          {showBack && (
            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: dynamicPillBg, borderColor: dynamicBorder, marginRight: 6 },
              ]}
              onPress={onBack || (() => router.back())}
              activeOpacity={0.75}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={18} color={dynamicIconColor} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.logoWrap,
              { backgroundColor: dynamicPillBg, borderColor: dynamicBorder },
            ]}
            onPress={() => router.push('/(tabs)/home' as any)}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {showBranchSelector && (
            <TouchableOpacity
              style={[
                styles.branchPill,
                { backgroundColor: dynamicPillBg, borderColor: dynamicBorder },
              ]}
              onPress={openBranchModal}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={13} color={Colors.orange} />
              <Text
                style={[
                  styles.branchPillText,
                  { color: isDark ? Colors.white : '#1E293B' },
                ]}
                numberOfLines={1}
              >
                {selectedBranch ? selectedBranch.name : 'Select Branch'}
              </Text>
              <Ionicons name="chevron-down" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Side: Global Search + Notifications + Cart */}
        <View style={styles.rightGroup}>
          {/* Global Search Button */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: dynamicPillBg, borderColor: dynamicBorder },
            ]}
            onPress={handleOpenSearch}
            activeOpacity={0.75}
            accessibilityLabel="Search treatments and products"
          >
            <Ionicons name="search-outline" size={19} color={dynamicIconColor} />
          </TouchableOpacity>

          {/* Notifications Button */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: dynamicPillBg, borderColor: dynamicBorder },
            ]}
            onPress={() => router.push('/(tabs)/notifications' as any)}
            activeOpacity={0.75}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={19} color={dynamicIconColor} />
            {unreadNotifs > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart / Bag Button */}
          <TouchableOpacity
            style={[styles.iconBtn, styles.cartBtn]}
            onPress={() => router.push('/(tabs)/cart' as any)}
            activeOpacity={0.8}
            accessibilityLabel="Shopping Cart"
          >
            <Ionicons name="bag-handle-outline" size={19} color={Colors.white} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── GLOBAL SEARCH MODAL ─── */}
      <Modal
        visible={isSearchOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseSearch}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.searchModalRoot, { backgroundColor: colors.bg }]}
        >
          {/* Search Header */}
          <View style={[styles.searchModalHeader, { borderBottomColor: colors.cardBorder }]}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search services, haircuts, oils, creams..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.cancelSearchBtn} onPress={handleCloseSearch}>
              <Text style={styles.cancelSearchText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Pills: ALL / SERVICES / PRODUCTS */}
          <View style={[styles.filterPillsRow, { borderBottomColor: colors.cardBorder }]}>
            {(['ALL', 'SERVICES', 'PRODUCTS'] as const).map((filter) => {
              const active = searchFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterPill,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    active && styles.filterPillActive,
                  ]}
                  onPress={() => setSearchFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: colors.textMuted },
                      active && styles.filterPillTextActive,
                    ]}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter === 'SERVICES'
                      ? `Services (${allServices.length})`
                      : `Products (${allProducts.length})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search Content */}
          {loadingCatalog ? (
            <View style={styles.searchCenterWrap}>
              <ActivityIndicator size="large" color={Colors.orange} />
              <Text style={[styles.searchCenterText, { color: colors.textMuted }]}>Loading salon catalog...</Text>
            </View>
          ) : searchQuery.trim().length === 0 ? (
            <View style={styles.searchEmptyPrompt}>
              <Ionicons name="search" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[styles.searchPromptTitle, { color: colors.text }]}>Global Salon Search</Text>
              <Text style={[styles.searchPromptSub, { color: colors.textMuted }]}>
                Type keywords like "Haircut", "Beard Trim", "Shampoo", or "Facial" to find exactly what you need.
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.searchEmptyPrompt}>
              <Ionicons name="sad-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[styles.searchPromptTitle, { color: colors.text }]}>No Results Found</Text>
              <Text style={[styles.searchPromptSub, { color: colors.textMuted }]}>
                No treatments or products matched "{searchQuery}". Try a different keyword or check spelling.
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              contentContainerStyle={styles.resultsListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isService = item.type === 'SERVICE';
                return (
                  <TouchableOpacity
                    style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => handleSelectSearchResult(item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{
                        uri:
                          item.image ||
                          (isService
                            ? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80'
                            : 'https://images.unsplash.com/photo-1608248597359-52e805562d7c?auto=format&fit=crop&w=200&q=80'),
                      }}
                      style={styles.resultImage}
                    />

                    <View style={styles.resultInfo}>
                      <View style={styles.resultBadgeRow}>
                        <View
                          style={[
                            styles.typeBadge,
                            isService ? styles.serviceTypeBadge : styles.productTypeBadge,
                          ]}
                        >
                          <Text style={styles.typeBadgeText}>
                            {isService ? 'SERVICE' : 'PRODUCT'}
                          </Text>
                        </View>
                        {item.categoryName ? (
                          <Text style={[styles.resultCategory, { color: colors.textMuted }]} numberOfLines={1}>
                            • {item.categoryName}
                          </Text>
                        ) : null}
                      </View>

                      <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <View style={styles.resultMetaRow}>
                        <Text style={styles.resultPrice}>₹{item.price}</Text>
                        {item.mrp && item.mrp > item.price && (
                          <Text style={[styles.resultMrp, { color: colors.textMuted }]}>₹{item.mrp}</Text>
                        )}
                        {isService && item.durationMinutes && (
                          <Text style={[styles.resultDuration, { color: colors.textMuted }]}>⏱ {item.durationMinutes}m</Text>
                        )}
                        {!isService && item.brand && (
                          <Text style={[styles.resultDuration, { color: colors.textMuted }]}>🏷 {item.brand}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.actionArrow}>
                      <Ionicons
                        name={isService ? 'chevron-forward' : 'add-circle'}
                        size={22}
                        color={isService ? colors.textMuted : Colors.orange}
                      />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  logoWrap: {
    height: 34,
    width: 34,
    borderRadius: Radius.lg,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
    maxWidth: 160,
  },
  branchPillText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: '700',
    flexShrink: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  cartBtn: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
    ...Shadows.orange,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.slateDark,
    borderWidth: 1.5,
    borderColor: Colors.white,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '900',
  },

  // Search Modal
  searchModalRoot: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  cancelSearchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  cancelSearchText: {
    color: Colors.orange,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  searchCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  searchCenterText: {
    color: '#94a3b8',
    fontSize: Typography.sm,
  },
  searchEmptyPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  searchPromptTitle: {
    color: Colors.white,
    fontSize: Typography.lg,
    fontWeight: '800',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  searchPromptSub: {
    color: '#64748b',
    fontSize: Typography.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsListContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    gap: Spacing.md,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: '#334155',
  },
  resultInfo: {
    flex: 1,
  },
  resultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  serviceTypeBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  productTypeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  resultCategory: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    flexShrink: 1,
  },
  resultName: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultPrice: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.orange,
  },
  resultMrp: {
    fontSize: Typography.xs,
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  resultDuration: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  actionArrow: {
    paddingLeft: Spacing.xs,
  },
});
