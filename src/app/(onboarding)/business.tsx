import { createBusiness } from "@/lib/business";
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

export default function BusinessSetupScreen() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [taxRate, setTaxRate] = useState("0");

  const [loading, setLoading] = useState(false);

  async function handleCreateBusiness() {
    if (!businessName.trim()) {
      Alert.alert(
        "Business name required",
        "Enter your business name."
      );
      return;
    }

    const tax = Number(taxRate);

    if (Number.isNaN(tax) || tax < 0 || tax > 100) {
      Alert.alert(
        "Invalid tax rate",
        "Tax rate must be between 0 and 100."
      );
      return;
    }

    try {
      setLoading(true);

      await createBusiness(
        businessName,
        currency,
        tax
      );

      router.replace("/dashboard");
    } catch (error: any) {
      Alert.alert(
        "Business setup failed",
        error?.message ?? "Unable to create business."
      );
      console.log(error?.message ?? "Unable to create business.")
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
        Set up your business
      </Text>

      <Text
        style={{
          color: "#666",
          marginBottom: 28,
        }}
      >
        Tell us a few details about your business.
      </Text>

      <TextInput
        placeholder="Business name"
        value={businessName}
        onChangeText={setBusinessName}
        style={inputStyle}
      />

      <TextInput
        placeholder="Estimated Monthly Income"
        value={currency}
        autoCapitalize="characters"
        onChangeText={setCurrency}
        style={inputStyle}
      />

      <TextInput
        placeholder="Tax rate (%)"
        keyboardType="decimal-pad"
        value={taxRate}
        onChangeText={setTaxRate}
        style={inputStyle}
      />

      <TouchableOpacity
        onPress={handleCreateBusiness}
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
            Create Business
          </Text>
        )}
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