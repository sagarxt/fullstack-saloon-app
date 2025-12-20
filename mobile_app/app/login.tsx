import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { loginApi } from "../api/client";
import { colors } from "../theme/colors";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill all fields");
    }

    try {
      const data = await loginApi(email, password);
      Alert.alert("Success", "Logged in successfully");
      console.log(data);
      // router.push("/home"); // will add later
    } catch (e: any) {
      Alert.alert("Login Failed", e.response?.data || "Server error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.luxe.gray.medium}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.luxe.gray.medium}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.footer}>
          New user? <Text style={styles.link}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.luxe.black,
    padding: 22,
    justifyContent: "center",
  },
  heading: {
    fontSize: 28,
    color: colors.luxe.gold.DEFAULT,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.luxe.gray.dark,
    color: colors.luxe.white,
    marginBottom: 14,
    padding: 14,
    borderRadius: 10,
    borderColor: colors.luxe.gray.medium,
    borderWidth: 1,
  },
  button: {
    backgroundColor: colors.luxe.gold.DEFAULT,
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    textAlign: "center",
    color: colors.luxe.black,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: colors.luxe.gray.light,
    marginTop: 16,
  },
  link: {
    color: colors.luxe.gold.soft,
  }
});
