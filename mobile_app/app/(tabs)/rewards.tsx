// app/(tabs)/rewards.tsx
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RewardsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Rewards</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
      >
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>1,250</Text>
          <Text style={styles.pointsSubtext}>🎉 Keep going! Amazing progress.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Redeem Rewards</Text>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardIcon}>🎁</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Free Haircut</Text>
              <Text style={styles.rewardPoints}>500 points</Text>
            </View>
            <TouchableOpacity style={styles.redeemButton}>
              <Text style={styles.redeemText}>Redeem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardIcon}>💆</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Spa Day Package</Text>
              <Text style={styles.rewardPoints}>1,000 points</Text>
            </View>
            <TouchableOpacity style={styles.redeemButton}>
              <Text style={styles.redeemText}>Redeem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardIcon}>✨</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Premium Facial</Text>
              <Text style={styles.rewardPoints}>750 points</Text>
            </View>
            <TouchableOpacity style={styles.redeemButton}>
              <Text style={styles.redeemText}>Redeem</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
          <View style={styles.earnCard}>
            <Text style={styles.earnText}>• Book a service: 50 points</Text>
            <Text style={styles.earnText}>• Refer a friend: 100 points</Text>
            <Text style={styles.earnText}>• Leave a review: 25 points</Text>
            <Text style={styles.earnText}>• Complete your profile: 50 points</Text>
          </View>
        </View>
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
  pointsCard: {
    backgroundColor: "#FF6B6B",
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 6,
  },
  pointsValue: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  pointsSubtext: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
  },
  rewardCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  rewardIcon: {
    fontSize: 30,
    marginRight: 14,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 2,
  },
  rewardPoints: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  redeemButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  redeemText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  earnCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
  },
  earnText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 6,
  },
});
