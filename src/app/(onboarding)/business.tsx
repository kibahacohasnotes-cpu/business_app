import AppAlert from "@/components/ui/AppAlert";
import { createBusiness } from "@/lib/business";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const BUSINESS_TYPES = [
  "Retail",
  "Wholesale",
  "Restaurant",
  "Grocery",
  "Pharmacy",
  "Electronics",
  "Clothing & Fashion",
  "Hardware",
  "Beauty & Cosmetics",
  "Services",
  "Other",
];

const CURRENCIES = [
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
];

export default function BusinessSetupScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Tanzania");

  const [currency, setCurrency] = useState("TZS");
  const [registrationNumber, setRegistrationNumber] =
    useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error" as "success" | "error" | "warning",
  });

  function showError(title: string, message: string) {
    setAlert({
      visible: true,
      title,
      message,
      type: "error",
    });
  }

  function validateStepOne() {
    if (!businessName.trim()) {
      showError(
        "Business name required",
        "Enter your business name to continue."
      );
      return false;
    }

    if (!businessType) {
      showError(
        "Business type required",
        "Select the type of business you operate."
      );
      return false;
    }

    return true;
  }

  function validateStepTwo() {
    if (!phone.trim() && !email.trim()) {
      showError(
        "Contact information",
        "Please provide at least a phone number or email address."
      );
      return false;
    }

    return true;
  }

  function nextStep() {
    if (step === 1 && !validateStepOne()) return;

    if (step === 2 && !validateStepTwo()) return;

    setStep((current) => Math.min(current + 1, 3));
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleCreateBusiness() {
    try {
      setLoading(true);

      await createBusiness(
        businessName.trim(),
        currency,
        businessType,
        description,
        phone,
        email,
        address,
        city,
        country,
        registrationNumber,
        website
      );

      router.replace("/dashboard");
    } catch (error: any) {
      console.error(
        "BUSINESS CREATION ERROR:",
        error
      );

      showError(
        "Business setup failed",
        error?.message ??
          "Unable to create your business. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
        }}
      >
        <View className="px-6 pt-16">

          {/* HEADER */}

          <View className="mb-8">

            <Text className="text-sm font-semibold text-slate-400">
              STEP {step} OF 3
            </Text>

            <Text className="mt-2 text-3xl font-bold text-slate-950">
              {step === 1 &&
                "Tell us about your business"}

              {step === 2 &&
                "How can we reach you?"}

              {step === 3 &&
                "A few final details"}
            </Text>

            <Text className="mt-2 text-base leading-6 text-slate-500">
              {step === 1 &&
                "Create the identity of your business."}

              {step === 2 &&
                "Add your contact and business location."}

              {step === 3 &&
                "These details help personalize your business profile."}
            </Text>

          </View>


          {/* PROGRESS */}

          <View className="mb-8 flex-row gap-2">

            {[1, 2, 3].map((item) => (
              <View
                key={item}
                className={`h-1.5 flex-1 rounded-full ${
                  item <= step
                    ? "bg-slate-950"
                    : "bg-slate-200"
                }`}
              />
            ))}

          </View>


          {/* STEP 1 */}

          {step === 1 && (
            <View>

              <FieldLabel
                label="Business name"
                required
              />

              <TextInput
                placeholder="e.g. ARTICLES INC"
                placeholderTextColor="#94a3b8"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
                className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />


              <FieldLabel
                label="Business type"
                required
              />

              <View className="mb-6 flex-row flex-wrap gap-2">

                {BUSINESS_TYPES.map((type) => {
                  const selected =
                    businessType === type;

                  return (
                    <Pressable
                      key={type}
                      onPress={() =>
                        setBusinessType(type)
                      }
                      className={`rounded-full border px-4 py-3 ${
                        selected
                          ? "border-slate-950 bg-slate-950"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected
                            ? "text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}

              </View>


              <FieldLabel
                label="About your business"
                optional
              />

              <TextInput
                placeholder="What does your business do?"
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="mb-6 min-h-[130px] rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />

            </View>
          )}


          {/* STEP 2 */}

          {step === 2 && (
            <View>

              <FieldLabel
                label="Phone number"
                optional
              />

              <TextInput
                placeholder="+255 7XX XXX XXX"
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />


              <FieldLabel
                label="Email address"
                optional
              />

              <TextInput
                placeholder="business@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />


              <FieldLabel
                label="Business address"
                optional
              />

              <TextInput
                placeholder="Street, building or area"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
                className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />


              <FieldLabel
                label="City"
                optional
              />

              <TextInput
                placeholder="e.g. Dar es Salaam"
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={setCity}
                className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />


              <FieldLabel
                label="Country"
                optional
              />

              <TextInput
                placeholder="e.g. Tanzania"
                placeholderTextColor="#94a3b8"
                value={country}
                onChangeText={setCountry}
                className="mb-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />

            </View>
          )}


          {/* STEP 3 */}

          {step === 3 && (
            <View>

              <FieldLabel
                label="Currency"
                required
              />

              <View className="mb-7">

                {CURRENCIES.map((item) => {
                  const selected =
                    currency === item.code;

                  return (
                    <Pressable
                      key={item.code}
                      onPress={() =>
                        setCurrency(item.code)
                      }
                      className={`mb-2 flex-row items-center rounded-2xl border p-4 ${
                        selected
                          ? "border-slate-950 bg-slate-950"
                          : "border-slate-200 bg-white"
                      }`}
                    >

                      <View
                        className={`h-10 w-10 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-white/10"
                            : "bg-slate-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected
                              ? "text-white"
                              : "text-slate-700"
                          }`}
                        >
                          {item.code}
                        </Text>
                      </View>

                      <View className="ml-3 flex-1">

                        <Text
                          className={`font-semibold ${
                            selected
                              ? "text-white"
                              : "text-slate-900"
                          }`}
                        >
                          {item.name}
                        </Text>

                        <Text
                          className={`mt-0.5 text-xs ${
                            selected
                              ? "text-slate-300"
                              : "text-slate-400"
                          }`}
                        >
                          {item.code}
                        </Text>

                      </View>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={23}
                          color="white"
                        />
                      )}

                    </Pressable>
                  );
                })}

              </View>


              <FieldLabel
                label="Registration number"
                optional
              />

              <TextInput
                placeholder="Business registration number"
                placeholderTextColor="#94a3b8"
                value={registrationNumber}
                onChangeText={
                  setRegistrationNumber
                }
                autoCapitalize="characters"
                className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />


              <FieldLabel
                label="Website or social link"
                optional
              />

              <TextInput
                placeholder="https://example.com"
                placeholderTextColor="#94a3b8"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
                className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
              />

              <Text className="mb-2 text-xs leading-5 text-slate-400">
                You can add your website, Instagram,
                Facebook, or another business link.
              </Text>

            </View>
          )}


          {/* NAVIGATION */}

          <View className="mt-8 flex-row gap-3">

            {step > 1 && (
              <Pressable
                onPress={previousStep}
                disabled={loading}
                className="h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              >
                <Ionicons
                  name="arrow-back"
                  size={21}
                  color="#0f172a"
                />
              </Pressable>
            )}

            <Pressable
              onPress={
                step < 3
                  ? nextStep
                  : handleCreateBusiness
              }
              disabled={loading}
              className="h-14 flex-1 flex-row items-center justify-center rounded-2xl bg-slate-950"
            >

              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-base font-bold text-white">
                    {step < 3
                      ? "Continue"
                      : "Create Business"}
                  </Text>

                  <Ionicons
                    name={
                      step < 3
                        ? "arrow-forward"
                        : "checkmark"
                    }
                    size={20}
                    color="white"
                    style={{
                      marginLeft: 8,
                    }}
                  />
                </>
              )}

            </Pressable>

          </View>


          {/* FOOTER */}

          <Text className="mt-6 text-center text-xs leading-5 text-slate-400">
            You can change these details later
            from your business profile.
          </Text>

        </View>
      </ScrollView>


      {/* ALERT */}

      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttonText="Okay"
        onClose={() =>
          setAlert((current) => ({
            ...current,
            visible: false,
          }))
        }
      />

    </KeyboardAvoidingView>
  );
}


function FieldLabel({
  label,
  required = false,
  optional = false,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <View className="mb-2 flex-row items-center">

      <Text className="text-sm font-semibold text-slate-700">
        {label}
      </Text>

      {required && (
        <Text className="ml-1 text-sm font-bold text-red-500">
          *
        </Text>
      )}

      {optional && (
        <Text className="ml-2 text-xs text-slate-400">
          Optional
        </Text>
      )}

    </View>
  );
}