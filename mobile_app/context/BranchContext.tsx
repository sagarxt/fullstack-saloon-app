import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { publicApi } from '../api/client';
import { Colors, Shadows } from '../theme/colors';

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface Branch {
  id: string | number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  image?: string;
  images?: string[];
  active?: boolean;
  rating?: number;
  latitude?: number;
  longitude?: number;
}

interface BranchContextType {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => Promise<void>;
  branches: Branch[];
  loadingBranches: boolean;
  isModalOpen: boolean;
  openBranchModal: () => void;
  closeBranchModal: () => void;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const BRANCH_STORAGE_KEY = '@groomish_selected_branch';

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    initBranches();
  }, []);

  const initBranches = async () => {
    setLoadingBranches(true);
    try {
      // 1. Fetch active salon branches
      const res = await publicApi.getStores();
      const list: Branch[] = Array.isArray(res.data)
        ? res.data
        : res.data?.content || [];
      const activeList = list.filter((b) => b.active !== false);
      setBranches(activeList);

      // 2. Request Notification Permission on boot (native Android 13+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        } catch (notifErr) {
          console.log('Notification permission error/skipped:', notifErr);
        }
      }

      // 3. Check if user already has a saved branch preference
      let chosenBranch: Branch | null = null;
      const savedBranchStr = await AsyncStorage.getItem(BRANCH_STORAGE_KEY);
      if (savedBranchStr) {
        try {
          const parsed = JSON.parse(savedBranchStr);
          const found = activeList.find((b) => String(b.id) === String(parsed.id));
          if (found) {
            chosenBranch = found;
          }
        } catch (_) {}
      }

      // 4. If no branch chosen yet, request location permission
      if (!chosenBranch && activeList.length > 0) {
        try {
          const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
          if (locStatus === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (loc?.coords) {
              const uLat = loc.coords.latitude;
              const uLng = loc.coords.longitude;
              let nearest = activeList[0];
              let minDistance = Infinity;

              activeList.forEach((b) => {
                if (b.latitude && b.longitude) {
                  const d = getDistanceInKm(uLat, uLng, Number(b.latitude), Number(b.longitude));
                  if (d < minDistance) {
                    minDistance = d;
                    nearest = b;
                  }
                }
              });
              chosenBranch = nearest;
            } else {
              // Location coords unavailable, fallback to default branch
              chosenBranch = activeList[0];
            }
          } else {
            // Location permission denied -> directly choose default branch
            chosenBranch = activeList[0];
          }
        } catch (locErr) {
          // If denied location or error -> directly choose default branch
          console.log('Location permission denied or error, choosing default branch:', locErr);
          chosenBranch = activeList[0];
        }

        if (chosenBranch) {
          await setSelectedBranch(chosenBranch);
        }
      } else if (chosenBranch) {
        setSelectedBranchState(chosenBranch);
      } else if (activeList.length > 0) {
        // Fallback default branch
        await setSelectedBranch(activeList[0]);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const setSelectedBranch = async (branch: Branch) => {
    setSelectedBranchState(branch);
    try {
      await AsyncStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(branch));
    } catch (_) {}
  };

  const refreshBranches = async () => {
    await initBranches();
  };

  const openBranchModal = () => setIsModalOpen(true);
  const closeBranchModal = () => setIsModalOpen(false);

  return (
    <BranchContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch,
        branches,
        loadingBranches,
        isModalOpen,
        openBranchModal,
        closeBranchModal,
        refreshBranches,
      }}
    >
      {children}
      {/* Universal Branch Selector Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeBranchModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <Ionicons name="location" size={20} color={Colors.orange} />
                <Text style={styles.modalHeaderTitle}>Select Salon Branch</Text>
              </View>
              <TouchableOpacity onPress={closeBranchModal} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.slate} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose your preferred Groomish salon branch to browse available treatments,
              stylists, and retail products.
            </Text>

            {loadingBranches ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color={Colors.orange} />
                <Text style={styles.loadingText}>Loading branches...</Text>
              </View>
            ) : branches.length === 0 ? (
              <View style={styles.centerBox}>
                <Ionicons name="storefront-outline" size={36} color={Colors.slateXLight} />
                <Text style={styles.loadingText}>No salon branches found.</Text>
              </View>
            ) : (
              <FlatList
                data={branches}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => {
                  const isSelected =
                    selectedBranch && String(selectedBranch.id) === String(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.branchCard,
                        isSelected && styles.branchCardSelected,
                      ]}
                      onPress={async () => {
                        await setSelectedBranch(item);
                        closeBranchModal();
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.branchCardHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={styles.badgeRow}>
                            <Text style={styles.branchName}>{item.name}</Text>
                            {isSelected && (
                              <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>Active</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.branchAddress} numberOfLines={2}>
                            {[item.address, item.city, item.pincode]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                          {item.openingTime && item.closingTime && (
                            <View style={styles.timingRow}>
                              <Ionicons
                                name="time-outline"
                                size={12}
                                color={Colors.slateLight}
                              />
                              <Text style={styles.timingText}>
                                {item.openingTime} - {item.closingTime}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color={Colors.white} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 36, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.slate,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: Colors.bg,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.slateLight,
    lineHeight: 18,
    marginBottom: 16,
  },
  centerBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  branchCard: {
    backgroundColor: Colors.bg,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  branchCardSelected: {
    backgroundColor: Colors.orangeLight,
    borderColor: Colors.orange,
  },
  branchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  branchName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.slate,
  },
  selectedBadge: {
    backgroundColor: Colors.green,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selectedBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  branchAddress: {
    fontSize: 12,
    color: Colors.slateLight,
    marginTop: 3,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  timingText: {
    fontSize: 11,
    color: Colors.slateLight,
    fontWeight: '600',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.slateXLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
});
