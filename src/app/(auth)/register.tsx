import { useTheme } from "@/context/ThemeContext";
import AppAlert from "@/components/ui/AppAlert";
import OfflineBanner from "@/components/ui/OfflineBanner";
import { signUp } from "@/lib/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("error");

  function showAlert(
    title: string,
    message: string,
    type: "success" | "error" | "warning" = "error"
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  }

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      showAlert(
        "Missing information",
        "Name, email and password are required.",
        "warning"
      );
      return;
    }

    if (password.length < 6) {
      showAlert(
        "Password too short",
        "Password must contain at least 6 characters.",
        "warning"
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
        showAlert(
          "Check your email",
          "Your account was created. Check your email to verify your account, then sign in.",
          "success"
        );

        return;
      }

      router.replace("/business");
    } catch (error: any) {
      showAlert(
        "Registration failed",
        error?.message ??
          "Unable to create your account.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleAlertClose() {
    const shouldGoToLogin =
      alertTitle === "Check your email";

    setAlertVisible(false);

    if (shouldGoToLogin) {
      router.replace("/login");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: isDark ? "#020617" : "#ffffff",
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "700",
          marginBottom: 8,
          color: isDark ? "#ffffff" : "#111111",
        }}
      >
        Create account
      </Text>

      <Text
        style={{
          color: isDark ? "#94a3b8" : "#666666",
          marginBottom: 28,
        }}
      >
        Create your account to get started.
      </Text>

      <OfflineBanner />

      {/* Full name */}

      <TextInput
        placeholder="Full name"
        placeholderTextColor={
          isDark ? "#64748b" : "#888888"
        }
        value={fullName}
        onChangeText={setFullName}
        style={{
          ...inputStyle,
          borderColor: isDark ? "#334155" : "#dddddd",
          color: isDark ? "#ffffff" : "#111111",
          backgroundColor: isDark
            ? "#0f172a"
            : "#ffffff",
        }}
      />

      {/* Phone */}

      <TextInput
        placeholder="Phone number"
        placeholderTextColor={
          isDark ? "#64748b" : "#888888"
        }
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={{
          ...inputStyle,
          borderColor: isDark ? "#334155" : "#dddddd",
          color: isDark ? "#ffffff" : "#111111",
          backgroundColor: isDark
            ? "#0f172a"
            : "#ffffff",
        }}
      />

      {/* Email */}

      <TextInput
        placeholder="Email"
        placeholderTextColor={
          isDark ? "#64748b" : "#888888"
        }
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          ...inputStyle,
          borderColor: isDark ? "#334155" : "#dddddd",
          color: isDark ? "#ffffff" : "#111111",
          backgroundColor: isDark
            ? "#0f172a"
            : "#ffffff",
        }}
      />

      {/* Password */}

      <TextInput
        placeholder="Password"
        placeholderTextColor={
          isDark ? "#64748b" : "#888888"
        }
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          ...inputStyle,
          borderColor: isDark ? "#334155" : "#dddddd",
          color: isDark ? "#ffffff" : "#111111",
          backgroundColor: isDark
            ? "#0f172a"
            : "#ffffff",
        }}
      />

      {/* Create account button */}

      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={{
          backgroundColor: isDark
            ? "#ffffff"
            : "#111111",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 4,
        }}
      >
        {loading ? (
          <ActivityIndicator
            color={isDark ? "#111111" : "#ffffff"}
          />
        ) : (
          <Text
            style={{
              color: isDark ? "#111111" : "#ffffff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      {/* Login */}

      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: isDark ? "#94a3b8" : "#555555",
          }}
        >
          Already have an account?{" "}
          <Text
            style={{
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#111111",
            }}
          >
            Sign in
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Custom alert */}

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttonText="Okay"
        onClose={handleAlertClose}
      />
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
};