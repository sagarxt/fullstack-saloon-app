// app/(tabs)/profile.tsx
import { router } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const handleLogout = () => {
    router.push("/login" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Profile</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <Text style={styles.name}>Sarah Johnson</Text>
          <Text style={styles.email}>sarah.j@email.com</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuCard}>
          {[
            { icon: "👤", label: "Personal Information" },
            { icon: "💳", label: "Payment Methods" },
            { icon: "📍", label: "Saved Addresses" },
            { icon: "⭐", label: "Favorites" },
            { icon: "🔔", label: "Notification Settings" },
            { icon: "❓", label: "Help & Support" },
            { icon: "📄", label: "Terms & Privacy" },
          ].map((item, idx, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                idx < arr.length - 1 && styles.menuItemBorder,
              ]}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuText}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  profileHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#777777",
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: "#333333",
  },
  menuArrow: {
    fontSize: 22,
    color: "#CCCCCC",
  },
  logoutButton: {
    backgroundColor: "#FFF0F0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "700",
  },
});
