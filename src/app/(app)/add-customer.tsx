import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";

import AppAlert from "@/components/ui/AppAlert";
import { useTheme } from "@/context/ThemeContext";
import { createCustomer } from "@/lib/customers";

export default function AddCustomerScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const { from } = useLocalSearchParams<{
    from?: string;
  }>();

  const [saving, setSaving] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");

  const iconColor = isDark ? "#ffffff" : "#0f172a";

  function showAlert(
    title: string,
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  }

  /* =====================================================
      SANITIZATION
  ===================================================== */

  function handleNameChange(value: string) {
    // Remove numbers and unusual symbols.
    const sanitized = value.replace(/[^a-zA-ZÀ-ÿ\s.'-]/g, "");
    setName(sanitized);
  }

  function handlePhoneChange(value: string) {
    // Phone numbers: digits only.
    const sanitized = value.replace(/[^0-9]/g, "");
    setPhone(sanitized);
  }

  function handleEmailChange(value: string) {
    // Remove spaces.
    const sanitized = value.replace(/\s/g, "");
    setEmail(sanitized.toLowerCase());
  }

  /* =====================================================
      CREATE CUSTOMER
  ===================================================== */

  async function handleCreateCustomer() {
    const network = await NetInfo.fetch();

    if (!network.isConnected) {
      showAlert(
        "You're offline",
        "You need an internet connection to save a customer.",
        "warning"
      );
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = address.trim();

    /* ---------------------------------------------------
        NAME
    --------------------------------------------------- */

    if (!cleanName) {
      showAlert(
        "Name required",
        "Enter the customer's name.",
        "warning"
      );
      return;
    }

    /* ---------------------------------------------------
        PHONE
    --------------------------------------------------- */

    if (cleanPhone && !/^[0-9]+$/.test(cleanPhone)) {
      showAlert(
        "Invalid phone",
        "Phone number can only contain numbers.",
        "warning"
      );
      return;
    }

    /* ---------------------------------------------------
        EMAIL
    --------------------------------------------------- */

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      showAlert(
        "Invalid email",
        "Enter a valid email address.",
        "warning"
      );
      return;
    }

    try {
      setSaving(true);

      await createCustomer({
        name: cleanName,
        phone: cleanPhone || null,
        email: cleanEmail || null,
        address: cleanAddress || null,
      });

      showAlert(
        "Customer added",
        `${cleanName} has been added successfully.`,
        "success"
      );
    } catch (error: any) {
      console.error("CREATE CUSTOMER ERROR:", error);

      showAlert(
        "Unable to add customer",
        error?.message ||
          "Something went wrong while creating the customer.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleAlertClose() {
    setAlertVisible(false);

    if (
      alertType === "success" &&
      alertTitle === "Customer added"
    ) {
      if (from === "sale") {
        router.replace("/add-sale");
      } else {
        router.back();
      }
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* =================================================
          STATIC HEADER
      ================================================= */}

      <View className="bg-slate-50 px-5 pb-4 pt-14 dark:bg-slate-950">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70 dark:bg-slate-900"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={iconColor}
            />
          </Pressable>

          <View className="flex-1">
            <Text className="text-3xl font-bold text-slate-950 dark:text-white">
              Add Customer
            </Text>

            <Text className="mt-1 text-sm text-slate-400 dark:text-slate-400">
              Add a new customer
            </Text>
          </View>
        </View>
      </View>

      {/* =================================================
          FORM
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        <View className="mt-2 rounded-3xl bg-white p-5 dark:bg-slate-900">
          <Text className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
            Customer information
          </Text>

          {/* NAME */}

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Customer name *
            </Text>

            <TextInput
              value={name}
              onChangeText={handleNameChange}
              placeholder="e.g. John Mwangi"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
              className="rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* PHONE */}

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Phone
            </Text>

            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="e.g. 0712345678"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              maxLength={15}
              className="rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* EMAIL */}

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </Text>

            <TextInput
              value={email}
              onChangeText={handleEmailChange}
              placeholder="customer@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* ADDRESS */}

          <View className="mb-2">
            <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Address
            </Text>

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Customer address"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[100px] rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900 dark:bg-slate-800 dark:text-white"
            />
          </View>
        </View>

        {/* =================================================
            SAVE BUTTON
        ================================================= */}

        <Pressable
          disabled={saving}
          onPress={handleCreateCustomer}
          className={`mt-5 items-center rounded-2xl py-4 ${
            saving
              ? "bg-slate-400 dark:bg-slate-700"
              : "bg-slate-950 dark:bg-white"
          }`}
        >
          {saving ? (
            <ActivityIndicator color={isDark ? "#0f172a" : "#ffffff"} />
          ) : (
            <View className="flex-row items-center">
              <Ionicons
                name="person-add-outline"
                size={21}
                color={isDark ? "#0f172a" : "#ffffff"}
              />

              <Text className="ml-2 text-base font-bold text-white dark:text-slate-950">
                Add Customer
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* =================================================
          ALERT
      ================================================= */}

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttonText="Done"
        onClose={handleAlertClose}
      />
    </KeyboardAvoidingView>
  );
}