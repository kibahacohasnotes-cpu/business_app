import { signIn } from "@/lib/auth";
import { useRouter } from "expo-router";
import React from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await signIn(email, password);

      router.replace("/");
    } catch (error: any) {
      Alert.alert(
        "Login failed",
        error?.message ?? "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        Welcome back
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: "#666",
          marginBottom: 32,
        }}
      >
        Sign in to your business account
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: "#111",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text>
          Don't have an account?{" "}
          <Text style={{ fontWeight: "700" }}>
            Create one
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}