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
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../../context/CartContext';
import { useBranch } from '../../../context/BranchContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { publicApi } from '../../../api/client';
import { Colors } from '../../../theme/colors';
import TopHeader from '../../../components/TopHeader';
import { calculateGroomCoins } from '../../../utils/serviceHelper';

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const { addItem, getItemCountForId } = useCart();
  const { isStaffOrAdmin } = useAuth();
  const { selectedBranch } = useBranch();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubService, setSelectedSubService] = useState<any>(null);

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    setLoading(true);
    try {
      if (id) {
        try {
          const res = await publicApi.getService(id);
          const data = res.data;
          setService(data);
          if (data?.subServices?.length > 0) {
            setSelectedSubService(data.subServices[0]);
          }
          setLoading(false);
          return;
        } catch (_) {}

        // Fallback: search in list
        const listRes = selectedBranch
          ? await publicApi.getStoreServices(selectedBranch.id)
          : await publicApi.getServices();
        const list = Array.isArray(listRes.data) ? listRes.data : listRes.data?.content || [];
        const found = list.find((s: any) => String(s.serviceId || s.id) === String(id));
        if (found) {
          const normalized = {
            ...found,
            id: found.serviceId || found.id,
          };
          setService(normalized);
          if (normalized?.subServices?.length > 0) {
            setSelectedSubService(normalized.subServices[0]);
          }
        }
      }
    } catch (err) {
      console.error('Service details load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!service) return;
    try {
      await Share.share({
        message: `Check out ${service.name} at Groomish Luxury Salon! Book now for just ₹${service.price}.`,
      });
    } catch (_) {}
  };

  const handleAddToCart = () => {
    if (!service) return;
    if (isStaffOrAdmin) {
      Alert.alert(
        'Staff / Admin Account',
        'Staff and Admin accounts can only browse products on the mobile app. You cannot book salon services here. Please use the Web Portal to manage services.',
        [{ text: 'OK' }]
      );
      return;
    }
    const displayName = selectedSubService
      ? `${service.name} (${selectedSubService.name})`
      : service.name;

    addItem({
      id: service.id,
      serviceId: service.id,
      itemType: 'SERVICE',
      name: displayName,
      price: selectedSubService ? selectedSubService.price : service.price || 0,
      mrp: selectedSubService?.mrp || service.mrp,
      image: service.image,
      durationMinutes: selectedSubService
        ? selectedSubService.durationMinutes
        : service.durationMinutes || 30,
      subServiceName: selectedSubService ? selectedSubService.name : undefined,
      subServicePrice: selectedSubService ? selectedSubService.price : undefined,
    });
  };

  const currentPrice = selectedSubService ? selectedSubService.price : service?.price || 0;
  const inCartCount = service ? getItemCountForId('SERVICE', service.id) : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} showBack={true} />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading Treatment Details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
        <TopHeader showBranchSelector={true} showBack={true} />
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.red} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Treatment Not Found</Text>
          <Text style={[styles.errorSub, { color: colors.textMuted }]}>
            The salon service may have been moved or updated.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Return to Services</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          {service.name}
        </Text>
        <TouchableOpacity style={styles.subBarShare} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={17} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ─── HERO PHOTO ─── */}
        <View style={styles.heroWrap}>
          <Image
            source={{
              uri:
                service.image ||
                'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.heroImg}
          />
          <View style={styles.heroCategoryBadge}>
            <Text style={styles.heroCategoryText}>
              {service.categoryName || 'Salon Care'}
            </Text>
          </View>
        </View>

        <View style={styles.contentWrap}>
          {/* ─── TITLE & BADGES ─── */}
          <Text style={[styles.title, { color: colors.text }]}>{service.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={13} color={Colors.orange} />
              <Text style={styles.metaBadgeText}>
                {selectedSubService
                  ? `${selectedSubService.durationMinutes} mins`
                  : `${service.durationMinutes || 30} mins`}
              </Text>
            </View>

            <View style={[styles.metaBadge, { backgroundColor: Colors.greenLight }]}>
              <Ionicons name="sparkles" size={13} color={Colors.greenDark} />
              <Text style={[styles.metaBadgeText, { color: Colors.greenDark }]}>
                Earn {calculateGroomCoins(currentPrice, service.rewards)} Groom Coins
              </Text>
            </View>
          </View>

          {/* ─── PRICING ─── */}
          <View style={[styles.priceContainer, { borderColor: colors.cardBorder }]}>
            <View style={styles.priceLeft}>
              <Text style={[styles.mainPrice, { color: colors.text }]}>₹{currentPrice}</Text>
              {service.mrp && service.mrp > currentPrice && (
                <View style={styles.mrpRow}>
                  <Text style={[styles.mainMrp, { color: colors.textMuted }]}>₹{service.mrp}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      Save ₹{service.mrp - currentPrice}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <Text style={[styles.taxNote, { color: colors.textMuted }]}>* Inclusive of all salon hygiene taxes</Text>
          </View>

          {/* ─── SUB SERVICES / VARIANTS (IF ANY) ─── */}
          {service.subServices && service.subServices.length > 0 && (
            <View style={styles.variantsSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>Select Option (Only One)</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.orange }}>
                  {service.subServices.length} Options
                </Text>
              </View>
              <View style={styles.variantPillsWrap}>
                {service.subServices.map((sub: any) => {
                  const isSelected = selectedSubService?.name === sub.name;
                  return (
                    <TouchableOpacity
                      key={sub.name || sub.id}
                      style={[
                        styles.variantCard,
                        { backgroundColor: colors.card, borderColor: colors.cardBorder },
                        isSelected && styles.variantCardSelected,
                      ]}
                      onPress={() => setSelectedSubService(sub)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              borderWidth: 1.5,
                              borderColor: isSelected ? Colors.orange : colors.cardBorder,
                              backgroundColor: isSelected ? Colors.orange : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && <Ionicons name="checkmark" size={11} color={Colors.white} />}
                          </View>
                          <Text
                            style={[
                              styles.variantName,
                              { color: colors.text },
                              isSelected && styles.variantNameSelected,
                            ]}
                          >
                            {sub.name}
                          </Text>
                        </View>

                        {sub.description ? (
                          <Text
                            style={{
                              fontSize: 11,
                              color: colors.textMuted,
                              marginTop: 4,
                              marginLeft: 22,
                              lineHeight: 15,
                            }}
                            numberOfLines={2}
                          >
                            {sub.description}
                          </Text>
                        ) : null}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 22 }}>
                          <Ionicons name="time-outline" size={11} color={Colors.orange} />
                          <Text style={[styles.variantDuration, { color: colors.textMuted, marginTop: 0 }]}>
                            {sub.durationMinutes} mins
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text
                          style={[
                            styles.variantPrice,
                            { color: colors.text },
                            isSelected && styles.variantPriceSelected,
                          ]}
                        >
                          ₹{sub.price}
                        </Text>
                        {sub.mrp && Number(sub.mrp) > Number(sub.price) && (
                          <Text style={{ fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' }}>
                            ₹{sub.mrp}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── DESCRIPTION ─── */}
          <View style={styles.infoSection}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>About This Treatment</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {service.description ||
                'Personalized salon treatment crafted to restore, style, and rejuvenate. Performed using professional sterilized salon tools and genuine salon-grade cosmetics.'}
            </Text>
          </View>

          {/* ─── SALON PROMISE CHECKLIST ─── */}
          <View style={[styles.promiseBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.promiseHeading, { color: colors.text }]}>The Groomish Luxury Promise</Text>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Master certified stylists with 5+ years precision experience
              </Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                Authentic branded cosmetics (L'Oréal, Kérastase, Olaplex)
              </Text>
            </View>
            <View style={styles.promiseItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
              <Text style={[styles.promiseText, { color: colors.textSecondary }]}>
                100% sterilized instruments & disposable hygiene packs
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── STICKY BOTTOM BOOK / CART BAR (ABOVE TAB BAR) ─── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
        <View>
          <Text style={[styles.bottomBarLabel, { color: colors.textMuted }]}>Total Price</Text>
          <Text style={[styles.bottomBarPrice, { color: colors.text }]}>₹{currentPrice}</Text>
        </View>

        {isStaffOrAdmin ? (
          <View style={styles.staffNoticeBar}>
            <Ionicons name="information-circle" size={16} color={Colors.orange} />
            <Text style={styles.staffNoticeBarText}>
              Staff/Admin: Service booking disabled on mobile
            </Text>
          </View>
        ) : (
          <View style={styles.bottomBarActions}>
            <TouchableOpacity
              style={styles.addCartBottomBtn}
              onPress={handleAddToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-handle-outline" size={16} color={Colors.orange} />
              <Text style={styles.addCartBottomText}>
                {inCartCount > 0 ? `In Cart (${inCartCount})` : 'Add to Cart'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookNowBottomBtn}
              onPress={() => {
                handleAddToCart();
                router.push('/(tabs)/cart' as any);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.bookNowBottomText}>Book Visit</Text>
              <Ionicons name="arrow-forward" size={15} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
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
    fontSize: 14,
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
    width: '100%',
    aspectRatio: 4 / 3,
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroCategoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroCategoryText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentWrap: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
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
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.orange,
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
  variantsSection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  variantPillsWrap: {
    gap: 8,
  },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  variantCardSelected: {
    borderColor: Colors.orange,
    backgroundColor: '#FFF7ED',
  },
  variantName: {
    fontSize: 13,
    fontWeight: '700',
  },
  variantNameSelected: {
    color: Colors.orange,
  },
  variantDuration: {
    fontSize: 11,
    marginTop: 2,
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  variantPriceSelected: {
    color: Colors.orange,
  },
  infoSection: {
    gap: 8,
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
    alignItems: 'center',
    gap: 8,
  },
  promiseText: {
    fontSize: 12,
    flex: 1,
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
  staffNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: Colors.orange,
    maxWidth: 240,
  },
  staffNoticeBarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a3412',
    flexShrink: 1,
  },
  addCartBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
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
  bookNowBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookNowBottomText: {
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
