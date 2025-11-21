// app/index.tsx
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  useEffect(() => {
    setTimeout(() => {
      router.replace("/login" as any);
    }, 10); // allow root to mount
  }, []);

  return <View />;
}
