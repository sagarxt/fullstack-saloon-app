import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../theme/colors';
import TopHeader from '../../components/TopHeader';

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isDark, colors } = useTheme();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await customerApi.getNotifications(0, 30);
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setNotifications(list);
    } catch (err) {
      console.error('Notifications load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await customerApi.markAllSeen();
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
    } catch (_) {}
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to remove all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerApi.clearNotifications();
              setNotifications([]);
            } catch (_) {}
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (item: any) => {
    if (!item.seen) {
      try {
        await customerApi.markNotificationSeen(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, seen: true } : n))
        );
      } catch (_) {}
    }

    if (item.bookingId) {
      router.push({
        pathname: '/booking/[id]',
        params: { id: String(item.bookingId) },
      } as any);
    } else if (item.type === 'REWARD' || item.type === 'POINTS') {
      router.push('/(tabs)/rewards' as any);
    }
  };

  const unreadCount = notifications.filter((n) => !n.seen).length;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Universal Top Header */}
      <TopHeader showBranchSelector={true} />

      {/* Screen Title & Action Bar */}
      <View style={[styles.titleBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.titleLeft}>
          <Text style={[styles.titleText, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadTag}>
              <Text style={styles.unreadTagText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={[styles.actionPill, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
              <Ionicons name="checkmark-done" size={14} color={Colors.orange} />
              <Text style={styles.actionPillText}>Mark read</Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={[styles.actionPill, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
              <Ionicons name="trash-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.actionPillText, { color: colors.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading notifications...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sign in to view notifications</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Stay up to date with booking confirmations, slot reminders, and bonus Groom Coins.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
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
          ListEmptyComponent={() => (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Ionicons name="notifications-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>You're all caught up!</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                New appointment alerts, slot reschedule updates, and VIP reward drops will appear here.
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isUnread = !item.seen;
            const isBooking = item.bookingId || item.type === 'BOOKING';
            const isPoints = item.type === 'POINTS' || item.type === 'REWARD';

            return (
              <TouchableOpacity
                style={[styles.notifCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, isUnread && styles.notifCardUnread]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconBox,
                    isBooking
                      ? styles.bookingIconBox
                      : isPoints
                      ? styles.pointsIconBox
                      : [styles.defaultIconBox, { backgroundColor: colors.bg }],
                  ]}
                >
                  <Ionicons
                    name={
                      isBooking
                        ? 'calendar'
                        : isPoints
                        ? 'gift'
                        : 'notifications'
                    }
                    size={18}
                    color={
                      isBooking
                        ? Colors.orange
                        : isPoints
                        ? Colors.gold
                        : colors.textMuted
                    }
                  />
                </View>

                <View style={styles.notifBody}>
                  <View style={styles.notifHeaderRow}>
                    <Text
                      style={[styles.notifTitle, { color: colors.textSecondary }, isUnread && [styles.notifTitleUnread, { color: colors.text }]]}
                      numberOfLines={1}
                    >
                      {item.title || (isBooking ? 'Appointment Update' : 'Groomish Alert')}
                    </Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={[styles.notifMsg, { color: colors.textSecondary }]} numberOfLines={3}>
                    {item.message || item.content}
                  </Text>

                  <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                      : 'Recently'}
                  </Text>
                </View>

                {isBooking && (
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  unreadTag: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadTagText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.orange,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  notifCardUnread: {
    borderColor: Colors.orange,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingIconBox: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  pointsIconBox: {
    backgroundColor: 'rgba(212, 168, 67, 0.15)',
  },
  defaultIconBox: {
    backgroundColor: '#334155',
  },
  notifBody: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    flex: 1,
  },
  notifTitleUnread: {
    color: Colors.white,
    fontWeight: '900',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
    marginLeft: 6,
  },
  notifMsg: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  signInBtn: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
