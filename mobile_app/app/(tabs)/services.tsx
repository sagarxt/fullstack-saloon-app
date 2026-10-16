import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, FlatList, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { publicApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../theme/colors';

export default function ServicesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [svcRes, catRes, prodRes] = await Promise.allSettled([
        publicApi.getServices(),
        publicApi.getCategories(),
        publicApi.getProducts(),
      ]);
      if (svcRes.status === 'fulfilled') {
        const d = svcRes.value.data;
        setServices(Array.isArray(d) ? d : d?.content || []);
      }
      if (catRes.status === 'fulfilled') {
        const d = catRes.value.data;
        setCategories(Array.isArray(d) ? d : d?.content || []);
      }
      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value.data;
        setProducts(Array.isArray(d) ? d : d?.content || []);
      }
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredServices = services.filter((s: any) => {
    const matchSearch = !search || (s.name || s.serviceName || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === null || s.categoryId === selectedCat || s.category?.id === selectedCat;
    return matchSearch && matchCat;
  });

  const filteredProducts = products.filter((p: any) => {
    return !search || (p.name || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleBook = (svc: any) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        `Please sign in or create an account to book ${svc.name || 'this service'}.`,
        [
          { text: 'Browse More', style: 'cancel' },
          { text: 'Sign In / Register', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    Alert.alert('Booking Selected', `You have selected ${svc.name || 'Service'}.\nPrice: ₹${svc.price || 0}`);
  };

  const renderServiceCard = (svc: any) => (
    <TouchableOpacity key={svc.id} style={styles.svcCard} activeOpacity={0.85}>
      <View style={styles.svcImageWrap}>
        <Ionicons name="cut-outline" size={30} color={Colors.orange} />
      </View>
      <View style={styles.svcBody}>
        <Text style={styles.svcName} numberOfLines={1}>{svc.name || svc.serviceName}</Text>
        {svc.category?.name && (
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{svc.category.name}</Text>
          </View>
        )}
        <Text style={styles.svcDesc} numberOfLines={2}>{svc.description || 'Premium salon service'}</Text>
        <View style={styles.svcFooter}>
          <View>
            <Text style={styles.svcPrice}>₹{svc.price?.toLocaleString() || '–'}</Text>
            {svc.duration && <Text style={styles.svcDuration}>{svc.duration} min</Text>}
          </View>
          <View style={styles.svcActions}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinBadgeText}>🪙 Earn Coins</Text>
            </View>
            <TouchableOpacity style={styles.bookBtn} onPress={() => handleBook(svc)} activeOpacity={0.85}>
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProductCard = (prod: any) => (
    <TouchableOpacity key={prod.id} style={styles.productCard} activeOpacity={0.85}>
      <View style={styles.productImageWrap}>
        <Ionicons name="cube-outline" size={30} color={Colors.blue} />
      </View>
      <View style={styles.productBody}>
        <Text style={styles.svcName} numberOfLines={1}>{prod.name}</Text>
        {prod.brand && <Text style={styles.productBrand}>{prod.brand}</Text>}
        <Text style={styles.svcDesc} numberOfLines={1}>{prod.description || prod.category || ''}</Text>
        <View style={styles.svcFooter}>
          <View>
            <Text style={styles.svcPrice}>₹{prod.price?.toLocaleString() || '–'}</Text>
            {prod.mrp && prod.mrp > prod.price && (
              <Text style={styles.productMrp}>MRP ₹{prod.mrp?.toLocaleString()}</Text>
            )}
          </View>
          <View style={styles.svcActions}>
            <View style={[styles.coinBadge, { backgroundColor: Colors.blueLight }]}>
              <Text style={[styles.coinBadgeText, { color: Colors.blue }]}>🪙 Earn Coins</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Search Header */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.slateLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'services' ? 'Search services...' : 'Search products...'}
            placeholderTextColor={Colors.slateXLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.slateLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Switch */}
      <View style={styles.tabSwitch}>
        {(['services', 'products'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'services' ? 'cut-outline' : 'cube-outline'}
              size={15}
              color={activeTab === tab ? Colors.white : Colors.slateLight}
            />
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'services' ? 'Services' : 'Products'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.orange} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
        >
          {/* Category Filter (Services only) */}
          {activeTab === 'services' && categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
              <TouchableOpacity
                style={[styles.catChip, selectedCat === null && styles.catChipActive]}
                onPress={() => setSelectedCat(null)}
              >
                <Text style={[styles.catChipText, selectedCat === null && styles.catChipTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
                  onPress={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                >
                  <Text style={[styles.catChipText, selectedCat === cat.id && styles.catChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Content */}
          <View style={styles.listWrap}>
            {activeTab === 'services' ? (
              filteredServices.length > 0
                ? filteredServices.map(renderServiceCard)
                : (
                  <View style={styles.empty}>
                    <Ionicons name="cut-outline" size={48} color={Colors.gray300} />
                    <Text style={styles.emptyText}>No services found</Text>
                  </View>
                )
            ) : (
              filteredProducts.length > 0
                ? filteredProducts.map(renderProductCard)
                : (
                  <View style={styles.empty}>
                    <Ionicons name="cube-outline" size={48} color={Colors.gray300} />
                    <Text style={styles.emptyText}>No products found</Text>
                  </View>
                )
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Search
  searchBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1, borderColor: Colors.gray200,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.slate },

  // Tabs
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, backgroundColor: Colors.gray100,
  },
  tabBtnActive: { backgroundColor: Colors.orange },
  tabBtnText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.slateLight },
  tabBtnTextActive: { color: Colors.white, fontWeight: '700' },

  // Category Chips
  catScroll: { paddingVertical: Spacing.md },
  catChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.gray200,
  },
  catChipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  catChipText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.slateLight },
  catChipTextActive: { color: Colors.white },

  // List
  listWrap: { padding: Spacing.xl, gap: Spacing.md },

  // Service Card
  svcCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.md,
  },
  svcImageWrap: {
    width: 80,
    backgroundColor: Colors.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svcBody: { flex: 1, padding: Spacing.md },
  svcName: { fontSize: Typography.base, fontWeight: '800', color: Colors.slate },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.orangeLight, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    marginTop: 4, marginBottom: 4,
  },
  catBadgeText: { fontSize: Typography.xs, color: Colors.orange, fontWeight: '700' },
  svcDesc: { fontSize: Typography.xs, color: Colors.slateLight, lineHeight: 17 },
  svcFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.sm },
  svcPrice: { fontSize: Typography.md, fontWeight: '900', color: Colors.orange },
  svcDuration: { fontSize: Typography.xs, color: Colors.slateXLight },
  svcActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  coinBadge: {
    backgroundColor: Colors.goldLight, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  coinBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.goldDark },
  bookBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  bookBtnText: { fontSize: Typography.xs, fontWeight: '800', color: Colors.white },

  // Product Card
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.md,
  },
  productImageWrap: {
    width: 80,
    backgroundColor: Colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productBody: { flex: 1, padding: Spacing.md },
  productBrand: { fontSize: Typography.xs, color: Colors.blue, fontWeight: '700', marginTop: 2 },
  productMrp: { fontSize: Typography.xs, color: Colors.slateXLight, textDecorationLine: 'line-through' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyText: { fontSize: Typography.base, color: Colors.slateXLight, marginTop: Spacing.md, fontWeight: '500' },
});
