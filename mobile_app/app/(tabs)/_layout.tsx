// app/(tabs)/_layout.tsx
import { Slot } from "expo-router";
import { StyleSheet, View } from "react-native";
import BottomNav from "../../components/BottomNav";

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
  },
});
