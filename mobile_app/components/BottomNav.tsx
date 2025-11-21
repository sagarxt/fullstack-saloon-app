// app/components/BottomNav.tsx
import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNav() {
  const pathname = usePathname();

  // You can keep these with /(tabs) since you're using `as any` on push
  const tabs: { route: string; label: string; icon: string }[] = [
    { route: "/(tabs)/home", label: "Home", icon: "🏠" },
    { route: "/(tabs)/bookings", label: "Bookings", icon: "📅" },
    { route: "/(tabs)/notifications", label: "Notifications", icon: "🔔" },
    { route: "/(tabs)/rewards", label: "Rewards", icon: "🎁" },
    { route: "/(tabs)/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((t) => {
        const active = pathname === t.route;

        return (
          <TouchableOpacity
            key={t.route}
            onPress={() => router.push(t.route as any)}
            style={styles.item}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>
              {t.icon}
            </Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#F0F0F0",
    paddingVertical: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    color: "#999999",
  },
  labelActive: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
});
