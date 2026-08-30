import { signUp } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Name, email and password are required."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password too short",
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await signUp(
        email,
        password,
        fullName,
        phone
      );

      if (!data.session) {
        Alert.alert(
          "Check your email",
          "Your account was created. Check your email to verify your account, then sign in."
        );

        router.replace("/login");
        return;
      }

      router.replace("/business");
    } catch (error: any) {
      Alert.alert(
        "Registration failed",
        error?.message ?? "Unable to create your account."
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
        Create account
      </Text>

      <Text
        style={{
          color: "#666",
          marginBottom: 28,
        }}
      >
        Create your account to get started.
      </Text>

      <TextInput
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
        style={inputStyle}
      />

      <TextInput
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={inputStyle}
      />

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={inputStyle}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={inputStyle}
      />

      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={{
          backgroundColor: "#111",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 4,
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
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text>
          Already have an account?{" "}
          <Text style={{ fontWeight: "700" }}>
            Sign in
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
};