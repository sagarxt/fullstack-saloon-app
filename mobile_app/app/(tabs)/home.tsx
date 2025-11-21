// app/(tabs)/home.tsx
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { offers, reviews, services } from "../../data/dummyData";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Sarah 👋</Text>
          <Text style={styles.subtitle}>Discover your beauty</Text>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Offers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Offers</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersRow}
        >
          {offers.map((offer) => (
            <View
              key={offer.id}
              style={[styles.offerCard, { backgroundColor: offer.color }]}
            >
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDescription}>{offer.description}</Text>
              <View style={styles.offerCodeContainer}>
                <Text style={styles.offerCode}>{offer.code}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <View style={styles.servicesGrid}>
          {services.map((s) => (
            <TouchableOpacity key={s.id} style={styles.serviceCard}>
              <Text style={styles.serviceIcon}>{s.icon}</Text>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.servicePrice}>{s.price}</Text>
              <Text style={styles.serviceDuration}>{s.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        {reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>{r.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewName}>{r.name}</Text>
                <View style={styles.reviewRating}>
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Text key={i}>⭐</Text>
                  ))}
                </View>
              </View>
              <Text style={styles.reviewDate}>{r.date}</Text>
            </View>
            <Text style={styles.reviewComment}>{r.comment}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
  },
  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 4,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    fontSize: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 14,
  },
  offersRow: {
    paddingRight: 10,
  },
  offerCard: {
    width: 260,
    borderRadius: 18,
    padding: 18,
    marginRight: 12,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  offerDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 10,
  },
  offerCodeContainer: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  offerCode: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
    textAlign: "center",
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 11,
    color: "#999999",
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  reviewName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  reviewRating: {
    flexDirection: "row",
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999999",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
});
