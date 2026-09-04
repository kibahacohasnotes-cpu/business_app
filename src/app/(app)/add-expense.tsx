import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import AppAlert from "@/components/ui/AppAlert";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";

import {
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Receipt,
} from "lucide-react-native";

import DateTimePicker from "@expo/ui/community/datetime-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useTheme } from "@/context/ThemeContext";
import { getMyBusiness } from "@/lib/business";
import {
  createExpense,
  uploadExpenseReceipt,
} from "@/lib/expenses";
import { EXPENSE_CATEGORIES } from "../../lib/expenseCategories";

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Mobile Money",
  "Card",
  "Cheque",
];

const EXPENSE_STATUSES = [
  "Paid",
  "Pending",
  "Cancelled",
] as const;

type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export default function AddExpense() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState("");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [vendor, setVendor] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] =
    useState("Monthly");

  const [status, setStatus] =
    useState<ExpenseStatus>("Paid");

  const [showCategories, setShowCategories] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] =
    useState(false);
  const [showStatuses, setShowStatuses] = useState(false);
  const [saving, setSaving] = useState(false);

  function showAlert(
    type: "success" | "error" | "warning",
    title: string,
    message: string
  ) {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }

  function formatAmountInput(value: string) {
    const cleaned = value.replace(/[^0-9]/g, "");

    if (!cleaned) {
      return "";
    }

    return Number(cleaned).toLocaleString("en-TZ");
  }

  function formatExpenseDate(date: Date) {
    return date.toLocaleDateString("en-TZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getPaymentIcon(method: string) {
    switch (method) {
      case "Cash":
        return "cash-outline";

      case "Bank Transfer":
        return "business-outline";

      case "Mobile Money":
        return "phone-portrait-outline";

      case "Card":
        return "card-outline";

      case "Cheque":
        return "document-text-outline";

      default:
        return "wallet-outline";
    }
  }

  async function handleSave() {
    const network = await NetInfo.fetch();

    if (!network.isConnected) {
      showAlert(
        "warning",
        "You're offline",
        "You need an internet connection to save an expense."
      );
      return;
    }

    if (!title.trim()) {
      showAlert(
        "warning",
        "Missing title",
        "Please enter an expense title."
      );
      return;
    }

    const numericAmount = Number(
      amount.replace(/,/g, "").trim()
    );

    if (!numericAmount || numericAmount <= 0) {
      showAlert(
        "warning",
        "Invalid amount",
        "Please enter a valid expense amount."
      );
      return;
    }

    try {
      setSaving(true);

      const business = await getMyBusiness();

      if (!business) {
        showAlert(
          "error",
          "Business unavailable",
          "We couldn't find your business information."
        );
        return;
      }

      let receiptUrl: string | undefined;

      if (receiptUri) {
        setUploadingReceipt(true);

        receiptUrl = await uploadExpenseReceipt(
          business.id,
          receiptUri
        );

        setUploadingReceipt(false);
      }

      await createExpense({
        business_id: business.id,
        title: title.trim(),
        category,
        amount: numericAmount,
        expense_date: expenseDate
          .toISOString()
          .split("T")[0],
        payment_method: paymentMethod,
        vendor: vendor.trim(),
        reference: reference.trim(),
        description: description.trim(),
        status,
        is_recurring: isRecurring,
        recurrence_period: isRecurring
          ? recurrencePeriod
          : undefined,
        receipt_url: receiptUrl,
      });

      showAlert(
        "success",
        "Expense saved",
        "Your expense has been successfully recorded."
      );
    } catch (error: any) {
      console.error("CREATE EXPENSE ERROR:", error);

      setUploadingReceipt(false);

      showAlert(
        "error",
        "Save failed",
        error?.message ||
          "Something went wrong while saving the expense."
      );
    } finally {
      setSaving(false);
      setUploadingReceipt(false);
    }
  }

  async function pickReceipt() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert(
        "warning",
        "Permission required",
        "Please allow photo library access to attach a receipt."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

    if (!result.canceled && result.assets.length > 0) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  const cardClass =
    "rounded-3xl bg-white p-5 dark:bg-slate-900";

  const inputTextClass =
    "text-base text-slate-950 dark:text-white";

  const labelClass =
    "mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300";

  const sectionTitleClass =
    "mb-3 text-xl font-bold text-slate-950 dark:text-white";

  const iconBackgroundClass =
    "bg-slate-100 dark:bg-slate-800";

  const primaryIconColor =
    isDark ? "#ffffff" : "#0f172a";

  const secondaryIconColor =
    isDark ? "#94a3b8" : "#64748b";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      behavior={
        Platform.OS === "ios" ? "padding" : undefined
      }
    >

      {/* HEADER */}

      <View className="bg-slate-50 px-6 pb-5 pt-14 dark:bg-slate-950">
        <View className="flex-row items-center">

          <Pressable
            onPress={() => router.back()}
            className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-white active:opacity-70 dark:bg-slate-900"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={primaryIconColor}
            />
          </Pressable>

          <View className="flex-1">

            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Business Manager
            </Text>

            <Text className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
              Add Expense
            </Text>

          </View>

        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-6 pb-32"
      >

        {/* BASIC INFORMATION */}

        <View className="mt-2">

          <Text className={sectionTitleClass}>
            Expense Information
          </Text>

          {/* TITLE */}

          <View className={`mb-4 ${cardClass}`}>

            <Text className={labelClass}>
              Expense Title
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Electricity Bill"
              placeholderTextColor="#94a3b8"
              className={inputTextClass}
            />

          </View>

          {/* CATEGORY */}

          <View className="mb-4">

            <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Category
            </Text>

            <Pressable
              onPress={() =>
                setShowCategories((value) => !value)
              }
              className="flex-row items-center rounded-3xl bg-white p-5 dark:bg-slate-900"
            >

              <View
                className={`h-11 w-11 items-center justify-center rounded-2xl ${iconBackgroundClass}`}
              >
                <Receipt
                  size={21}
                  color={primaryIconColor}
                />
              </View>

              <Text className="ml-4 flex-1 text-base font-semibold text-slate-950 dark:text-white">
                {category}
              </Text>

              <ChevronDown
                size={20}
                color={secondaryIconColor}
              />

            </Pressable>

            {showCategories && (
              <View className="mt-2 rounded-3xl bg-white p-3 dark:bg-slate-900">

                {EXPENSE_CATEGORIES.map((item) => {
                  const selected = category === item.name;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setCategory(item.name);
                        setShowCategories(false);
                      }}
                      className={`mb-1 flex-row items-center rounded-2xl px-3 py-3.5 ${
                        selected
                          ? "bg-slate-100 dark:bg-slate-800"
                          : ""
                      }`}
                    >

                      <View
                        className={`h-10 w-10 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-slate-950 dark:bg-white"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={
                            selected
                              ? isDark
                                ? "#0f172a"
                                : "white"
                              : secondaryIconColor
                          }
                        />
                      </View>

                      <Text
                        className={`ml-3 flex-1 text-sm ${
                          selected
                            ? "font-bold text-slate-950 dark:text-white"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.name}
                      </Text>

                      {selected && (
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-950 dark:bg-white">
                          <Text className="text-xs font-bold text-white dark:text-slate-950">
                            ✓
                          </Text>
                        </View>
                      )}

                    </Pressable>
                  );
                })}

              </View>
            )}

          </View>

          {/* AMOUNT */}

          <View className={`mb-4 ${cardClass}`}>

            <Text className={labelClass}>
              Amount
            </Text>

            <View className="flex-row items-center">

              <Text className="mr-2 text-base font-bold text-slate-500 dark:text-slate-400">
                TZS
              </Text>

              <TextInput
                value={amount}
                onChangeText={(value) => {
                  setAmount(formatAmountInput(value));
                }}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                inputMode="numeric"
                className="flex-1 text-2xl font-bold text-slate-950 dark:text-white"
              />

            </View>

          </View>

          {/* DATE */}

          <View className="mb-4">

            <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Expense Date
            </Text>

            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center rounded-3xl bg-white p-5 active:opacity-80 dark:bg-slate-900"
            >

              <View
                className={`h-11 w-11 items-center justify-center rounded-2xl ${iconBackgroundClass}`}
              >
                <CalendarDays
                  size={21}
                  color={primaryIconColor}
                />
              </View>

              <View className="ml-4 flex-1">

                <Text className="text-xs text-slate-400 dark:text-slate-500">
                  Date
                </Text>

                <Text className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                  {formatExpenseDate(expenseDate)}
                </Text>

              </View>

              <ChevronDown
                size={20}
                color={secondaryIconColor}
              />

            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={expenseDate}
                mode="date"
                presentation="dialog"
                onValueChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setExpenseDate(selectedDate);
                  }

                  setShowDatePicker(false);
                }}
                onDismiss={() => {
                  setShowDatePicker(false);
                }}
              />
            )}

          </View>

        </View>

        {/* PAYMENT */}

        <View className="mt-4">

          <Text className={sectionTitleClass}>
            Payment Details
          </Text>

          {/* PAYMENT METHOD */}

          <View className="mb-4">

            <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Payment Method
            </Text>

            <Pressable
              onPress={() =>
                setShowPaymentMethods(
                  (value) => !value
                )
              }
              className="flex-row items-center rounded-3xl bg-white p-5 dark:bg-slate-900"
            >

              <Text className="flex-1 text-base font-semibold text-slate-950 dark:text-white">
                {paymentMethod}
              </Text>

              <ChevronDown
                size={20}
                color={secondaryIconColor}
              />

            </Pressable>

            {showPaymentMethods && (
              <View className="mt-2 rounded-3xl bg-white p-3 dark:bg-slate-900">

                {PAYMENT_METHODS.map((method) => {
                  const selected =
                    paymentMethod === method;

                  return (
                    <Pressable
                      key={method}
                      onPress={() => {
                        setPaymentMethod(method);
                        setShowPaymentMethods(false);
                      }}
                      className={`mb-1 flex-row items-center rounded-2xl px-3 py-3.5 ${
                        selected
                          ? "bg-slate-100 dark:bg-slate-800"
                          : ""
                      }`}
                    >

                      <View
                        className={`h-10 w-10 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-slate-950 dark:bg-white"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <Ionicons
                          name={getPaymentIcon(method) as any}
                          size={20}
                          color={
                            selected
                              ? isDark
                                ? "#0f172a"
                                : "white"
                              : secondaryIconColor
                          }
                        />
                      </View>

                      <Text
                        className={`ml-3 flex-1 text-sm ${
                          selected
                            ? "font-bold text-slate-950 dark:text-white"
                            : "font-medium text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {method}
                      </Text>

                      {selected && (
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-950 dark:bg-white">
                          <Text className="text-xs font-bold text-white dark:text-slate-950">
                            ✓
                          </Text>
                        </View>
                      )}

                    </Pressable>
                  );
                })}

              </View>
            )}

          </View>

          {/* VENDOR */}

          <View className={`mb-4 ${cardClass}`}>

            <Text className={labelClass}>
              Vendor / Supplier
            </Text>

            <TextInput
              value={vendor}
              onChangeText={setVendor}
              placeholder="e.g. TANESCO"
              placeholderTextColor="#94a3b8"
              className={inputTextClass}
            />

          </View>

          {/* REFERENCE */}

          <View className={`mb-4 ${cardClass}`}>

            <Text className={labelClass}>
              Reference Number
            </Text>

            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Optional"
              placeholderTextColor="#94a3b8"
              className={inputTextClass}
            />

          </View>

        </View>

        {/* ADDITIONAL INFORMATION */}

        <View className="mt-4">

          <Text className={sectionTitleClass}>
            Additional Information
          </Text>

          {/* DESCRIPTION */}

          <View className={`mb-4 ${cardClass}`}>

            <Text className={labelClass}>
              Description / Notes
            </Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add any additional information..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              className="min-h-[100px] text-base text-slate-950 dark:text-white"
            />

          </View>

          {/* STATUS */}

          <View className="mb-4">

            <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status
            </Text>

            <Pressable
              onPress={() =>
                setShowStatuses((value) => !value)
              }
              className="flex-row items-center rounded-3xl bg-white p-5 dark:bg-slate-900"
            >

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                <CircleCheck
                  size={21}
                  color="#059669"
                />
              </View>

              <Text className="ml-4 flex-1 text-base font-semibold text-slate-950 dark:text-white">
                {status}
              </Text>

              <ChevronDown
                size={20}
                color={secondaryIconColor}
              />

            </Pressable>

            {showStatuses && (
              <View className="mt-2 rounded-3xl bg-white p-2 dark:bg-slate-900">

                {EXPENSE_STATUSES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setStatus(item);
                      setShowStatuses(false);
                    }}
                    className={`rounded-2xl px-4 py-4 ${
                      status === item
                        ? "bg-slate-100 dark:bg-slate-800"
                        : ""
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        status === item
                          ? "text-slate-950 dark:text-white"
                          : "text-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}

              </View>
            )}

          </View>

          {/* RECURRING */}

          <View className={`mb-4 ${cardClass}`}>

            <View className="flex-row items-center">

              <View className="flex-1">

                <Text className="text-base font-semibold text-slate-950 dark:text-white">
                  Recurring Expense
                </Text>

                <Text className="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                  Mark this if the expense repeats regularly.
                </Text>

              </View>

              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{
                  false: isDark ? "#334155" : "#e2e8f0",
                  true: isDark ? "#64748b" : "#94a3b8",
                }}
                thumbColor={
                  isRecurring
                    ? isDark
                      ? "#ffffff"
                      : "#0f172a"
                    : isDark
                      ? "#94a3b8"
                      : "#f8fafc"
                }
              />

            </View>

            {isRecurring && (
              <View className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">

                <Text className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Repeat Every
                </Text>

                <View className="flex-row gap-2">

                  {[
                    "Daily",
                    "Weekly",
                    "Monthly",
                    "Yearly",
                  ].map((period) => (
                    <Pressable
                      key={period}
                      onPress={() =>
                        setRecurrencePeriod(period)
                      }
                      className={`flex-1 items-center rounded-2xl px-2 py-3 ${
                        recurrencePeriod === period
                          ? "bg-slate-950 dark:bg-white"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          recurrencePeriod === period
                            ? "text-white dark:text-slate-950"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {period}
                      </Text>
                    </Pressable>
                  ))}

                </View>

              </View>
            )}

          </View>

        </View>

        {/* RECEIPT */}

        <View className="mt-5">

          <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Receipt
          </Text>

          {receiptUri ? (

            <View className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900">

              <Image
                source={{ uri: receiptUri }}
                className="h-52 w-full"
                contentFit="cover"
              />

              <View className="flex-row items-center justify-between p-3">

                <View className="flex-1">

                  <Text className="text-sm font-semibold text-slate-950 dark:text-white">
                    Receipt attached
                  </Text>

                  <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Ready to upload
                  </Text>

                </View>

                <Pressable
                  onPress={() => setReceiptUri(null)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950"
                >
                  <Ionicons
                    name="trash-outline"
                    size={19}
                    color="#dc2626"
                  />
                </Pressable>

              </View>

            </View>

          ) : (

            <Pressable
              onPress={pickReceipt}
              className="flex-row items-center rounded-3xl bg-white p-4 active:opacity-70 dark:bg-slate-900"
            >

              <View
                className={`h-12 w-12 items-center justify-center rounded-2xl ${iconBackgroundClass}`}
              >
                <Ionicons
                  name="receipt-outline"
                  size={23}
                  color={primaryIconColor}
                />
              </View>

              <View className="ml-4 flex-1">

                <Text className="text-base font-bold text-slate-950 dark:text-white">
                  Attach Receipt
                </Text>

                <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Choose a receipt photo from your gallery
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#94a3b8"
              />

            </Pressable>

          )}

        </View>

        {/* SAVE BUTTON */}

        <Pressable
          disabled={saving}
          onPress={handleSave}
          className={`mt-5 items-center rounded-3xl bg-slate-950 py-5 active:opacity-80 dark:bg-white ${
            saving ? "opacity-60" : ""
          }`}
        >

          {saving ? (

            <View className="flex-row items-center">

              <View className="mr-3 h-5 w-5 rounded-full border-2 border-white border-t-transparent dark:border-slate-950 dark:border-t-transparent" />

              <Text className="text-base font-bold text-white dark:text-slate-950">
                {uploadingReceipt
                  ? "Uploading receipt..."
                  : "Saving expense..."}
              </Text>

            </View>

          ) : (

            <View className="flex-row items-center">

              <Receipt
                size={20}
                color={isDark ? "#0f172a" : "#ffffff"}
              />

              <Text className="ml-2 text-base font-bold text-white dark:text-slate-950">
                Save Expense
              </Text>

            </View>

          )}

        </Pressable>

      </ScrollView>

      {/* ALERT */}

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
        onClose={() => {
          setAlertVisible(false);

          if (
            alertType === "success" &&
            alertTitle === "Expense saved"
          ) {
            router.back();
          }
        }}
      />

    </KeyboardAvoidingView>
  );
}