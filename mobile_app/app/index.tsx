import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.replace("/login");
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/salon-logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Luxe Salon</Text>
      <Text style={styles.subtitle}>Elegance. Style. You.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.luxe.black,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: colors.luxe.gold.DEFAULT,
    fontWeight: "700",
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.luxe.gray.light,
    fontSize: 14,
    marginTop: 6,
  }
});
