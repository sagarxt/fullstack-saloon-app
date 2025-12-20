import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { registerApi } from "../api/client";
import { colors } from "../theme/colors";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      return Alert.alert("Error", "All fields are required");
    }

    try {
      await registerApi(name, email, password);
      Alert.alert("Success", "Account created!");
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Registration Failed", e.response?.data || "Server error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor={colors.luxe.gray.medium}
        value={name}
        onChangeText={setName}
      />

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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>REGISTER</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.footer}>
          Already have an account?{" "}
          <Text style={styles.link}>Login</Text>
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
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.luxe.gray.dark,
    borderColor: colors.luxe.gray.medium,
    borderWidth: 1,
    color: colors.luxe.white,
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  button: {
    backgroundColor: colors.luxe.gold.dark,
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: colors.luxe.black,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    color: colors.luxe.gray.light,
    textAlign: "center",
    marginTop: 16,
  },
  link: {
    color: colors.luxe.gold.soft,
  }
});
