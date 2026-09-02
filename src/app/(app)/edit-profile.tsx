import AppAlert from "@/components/ui/AppAlert";
import { getMyBusiness, updateBusiness } from "@/lib/business";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function EditProfileScreen() {
  const router = useRouter();

  const [businessId, setBusinessId] =
    useState<string | null>(null);

  const [businessName, setBusinessName] =
    useState("");

  const [businessType, setBusinessType] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] =
    useState("Tanzania");

  const [currency, setCurrency] =
    useState("TZS");

  const [registrationNumber, setRegistrationNumber] =
    useState("");

  const [website, setWebsite] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error" as
      | "success"
      | "error"
      | "warning",
  });

  function showAlert(
    title: string,
    message: string,
    type:
      | "success"
      | "error"
      | "warning" = "error"
  ) {
    setAlert({
      visible: true,
      title,
      message,
      type,
    });
  }

  useEffect(() => {
    async function loadBusiness() {
      try {
        const data = await getMyBusiness();

        if (!data) {
          showAlert(
            "Business not found",
            "We couldn't find your business."
          );
          return;
        }

        setBusinessId(data.id);

        setBusinessName(data.name ?? "");
        setBusinessType(
          data.business_type ?? ""
        );
        setDescription(
          data.description ?? ""
        );

        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setAddress(data.address ?? "");
        setCity(data.city ?? "");
        setCountry(
          data.country ?? "Tanzania"
        );

        setCurrency(
          data.currency ?? "TZS"
        );

        setRegistrationNumber(
          data.registration_number ?? ""
        );

        setWebsite(data.website ?? "");
      } catch (error) {
        console.error(
          "LOAD BUSINESS ERROR:",
          error
        );

        showAlert(
          "Unable to load profile",
          "We couldn't load your business information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, []);

  async function handleSave() {
    if (!businessId) {
      showAlert(
        "Business not found",
        "Unable to identify your business."
      );
      return;
    }

    if (!businessName.trim()) {
      showAlert(
        "Business name required",
        "Please enter your business name."
      );
      return;
    }

    if (!businessType) {
      showAlert(
        "Business type required",
        "Please select your business type."
      );
      return;
    }

    try {
      setSaving(true);

      await updateBusiness(
        businessId,
        {
          name: businessName,
          business_type:
            businessType || null,
          description:
            description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address:
            address.trim() || null,
          city: city.trim() || null,
          country:
            country.trim() || null,
          currency,
          registration_number:
            registrationNumber.trim() ||
            null,
          website:
            website.trim() || null,
        }
      );

      showAlert(
        "Profile updated",
        "Your business information has been saved.",
        "success"
      );
    } catch (error: any) {
      console.error(
        "UPDATE BUSINESS ERROR:",
        error
      );

      showAlert(
        "Update failed",
        error?.message ??
          "Unable to save your changes."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator
          size="large"
          color="#0f172a"
        />

        <Text className="mt-4 text-sm text-slate-400">
          Loading business profile...
        </Text>
      </View>
    );
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
      {/* HEADER */}

      <View className="flex-row items-center px-5 pb-4 pt-14">

        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#0f172a"
          />
        </Pressable>

        <View className="ml-4 flex-1">
          <Text className="text-xl font-bold text-slate-950">
            Edit Business
          </Text>

          <Text className="mt-0.5 text-xs text-slate-400">
            Update your business information
          </Text>
        </View>

      </View>


      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 120,
        }}
      >

        {/* BUSINESS INFORMATION */}

        <Section
          title="Business Information"
          subtitle="Tell customers what your business is about."
        >

          <FieldLabel label="Business name" required />

          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Business name"
            placeholderTextColor="#94a3b8"
            className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

          <FieldLabel
            label="Business type"
            required
          />

          <View className="mb-5 flex-row flex-wrap gap-2">

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

          <FieldLabel label="Description" optional />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what your business does..."
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

        </Section>


        {/* CONTACT */}

        <Section
          title="Contact"
          subtitle="How customers can reach your business."
        >

          <FieldLabel label="Phone number" optional />

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+255 7XX XXX XXX"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

          <FieldLabel label="Email address" optional />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="business@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

        </Section>


        {/* LOCATION */}

        <Section
          title="Location"
          subtitle="Where your business operates."
        >

          <FieldLabel label="Address" optional />

          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Street, building or area"
            placeholderTextColor="#94a3b8"
            className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

          <FieldLabel label="City" optional />

          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Dar es Salaam"
            placeholderTextColor="#94a3b8"
            className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

          <FieldLabel label="Country" optional />

          <TextInput
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. Tanzania"
            placeholderTextColor="#94a3b8"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

        </Section>


        {/* BUSINESS DETAILS */}

        <Section
          title="Business Details"
          subtitle="Additional information for your profile."
        >

          <FieldLabel label="Currency" required />

          <View className="mb-5">

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

                  <Text
                    className={`ml-3 flex-1 font-semibold ${
                      selected
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {item.name}
                  </Text>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
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
            value={registrationNumber}
            onChangeText={
              setRegistrationNumber
            }
            placeholder="Business registration number"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />


          <FieldLabel
            label="Website or social link"
            optional
          />

          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="url"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-950"
          />

        </Section>


        {/* SAVE */}

        <View className="px-5">

          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="flex-row items-center justify-center rounded-2xl bg-slate-950 py-4 active:opacity-80"
          >

            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="white"
                />

                <Text className="ml-2 text-base font-bold text-white">
                  Save Changes
                </Text>
              </>
            )}

          </Pressable>

        </View>

      </ScrollView>


      {/* ALERT */}

      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttonText="Okay"
        onClose={() => {
          const wasSuccess =
            alert.type === "success";

          setAlert((current) => ({
            ...current,
            visible: false,
          }));

          if (wasSuccess) {
            router.back();
          }
        }}
      />

    </KeyboardAvoidingView>
  );
}


function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-8 px-5">

      <Text className="text-lg font-bold text-slate-950">
        {title}
      </Text>

      <Text className="mb-4 mt-1 text-sm text-slate-400">
        {subtitle}
      </Text>

      <View className="rounded-[28px] bg-slate-100/60 p-4">
        {children}
      </View>

    </View>
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