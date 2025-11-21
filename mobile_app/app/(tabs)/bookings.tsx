// app/(tabs)/bookings.tsx
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { bookings } from "../../data/dummyData";

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>My Bookings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80 }}
      >
        {bookings.map((b) => (
          <View key={b.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingService}>{b.service}</Text>
              <View
                style={[
                  styles.statusBadge,
                  b.status === "Upcoming" ? styles.statusUpcoming : styles.statusCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    b.status === "Upcoming"
                      ? styles.statusTextUpcoming
                      : styles.statusTextCompleted,
                  ]}
                >
                  {b.status}
                </Text>
              </View>
            </View>

            <View style={styles.bookingDetails}>
              <Text style={styles.detailText}>📅 {b.date}</Text>
              <Text style={styles.detailText}>⏰ {b.time}</Text>
              <Text style={styles.detailText}>👤 {b.stylist}</Text>
            </View>

            {b.status === "Upcoming" && (
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bookingService: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusUpcoming: {
    backgroundColor: "#E3F2FD",
  },
  statusCompleted: {
    backgroundColor: "#E8F5E9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextUpcoming: {
    color: "#1976D2",
  },
  statusTextCompleted: {
    color: "#388E3C",
  },
  bookingDetails: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#666666",
    marginVertical: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#666666",
    fontWeight: "600",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "300",
  },
});
