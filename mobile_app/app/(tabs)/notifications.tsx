// app/(tabs)/notifications.tsx
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { notifications } from "../../data/dummyData";

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Notifications</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
      >
        {notifications.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[
              styles.notificationCard,
              !n.read && styles.notificationUnread,
            ]}
          >
            <View style={styles.dotContainer}>
              {!n.read && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{n.title}</Text>
              <Text style={styles.notificationMessage}>{n.message}</Text>
              <Text style={styles.notificationTime}>{n.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
  },
  scroll: { flex: 1 },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: "#FFF6F0",
  },
  dotContainer: {
    width: 14,
    alignItems: "flex-start",
    marginRight: 10,
    paddingTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999999",
  },
});
