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
import Loading from "@/components/ui/Loading";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Receipt,
} from "lucide-react-native";
import { getMyBusiness } from "@/lib/business";
import { EXPENSE_CATEGORIES } from "../../lib/expenseCategories";

import DateTimePicker from "@expo/ui/community/datetime-picker";
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
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import {
  createExpense,
  uploadExpenseReceipt,
} from "@/lib/expenses";
export default function AddExpense() {

  function formatAmountInput(value: string) {
  const cleaned = value.replace(/[^0-9]/g, "");

  if (!cleaned) {
    return "";
  }

  return Number(cleaned).toLocaleString("en-TZ");
}
  const router = useRouter();
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState<   "success" | "error" | "warning"    >("success");  
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
    useState<(typeof EXPENSE_STATUSES)[number]>("Paid");

  const [showCategories, setShowCategories] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] =useState(false);
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

    // Get the current business
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

    // Upload receipt if one was selected
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
      setAlert({
        visible: true,
        title: "Permission required",
        message: "Please allow photo library access to attach a receipt.",
        type: "warning",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={
        Platform.OS === "ios" ? "padding" : undefined
      }
    >
      {/* HEADER */}

      <View className="bg-slate-50 px-6 pb-5 pt-14">
        <View className="flex-row items-center">

          <Pressable
            onPress={() => router.back()}
            className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-white active:opacity-70"
          >
            <ArrowLeft
              size={22}
              color="#0f172a"
            />
          </Pressable>

          <View className="flex-1">
            <Text className="text-sm font-medium text-slate-500">
              Business Manager
            </Text>

            <Text className="mt-1 text-3xl font-bold text-slate-950">
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

          <Text className="mb-3 text-xl font-bold text-slate-950">
            Expense Information
          </Text>

          {/* TITLE */}

          <View className="mb-4 rounded-3xl bg-white p-5">

            <Text className="mb-2 text-sm font-semibold text-slate-700">
              Expense Title
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Electricity Bill"
              placeholderTextColor="#94a3b8"
              className="text-base text-slate-950"
            />

          </View>


          {/* CATEGORY */}

          <View className="mb-4">

            <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700">
              Category
            </Text>

            <Pressable
              onPress={() =>
                setShowCategories((value) => !value)
              }
              className="flex-row items-center rounded-3xl bg-white p-5"
            >

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <Receipt
                  size={21}
                  color="#0f172a"
                />
              </View>

              <Text className="ml-4 flex-1 text-base font-semibold text-slate-950">
                {category}
              </Text>

              <ChevronDown
                size={20}
                color="#64748b"
              />

            </Pressable>


          {showCategories && (
            <View className="mt-2 rounded-3xl bg-white p-3">

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
                      selected ? "bg-slate-100" : ""
                    }`}
                  >
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-xl ${
                        selected ? "bg-slate-950" : "bg-slate-100"
                      }`}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={selected ? "white" : "#334155"}
                      />
                    </View>

                    <Text
                      className={`ml-3 flex-1 text-sm ${
                        selected
                          ? "font-bold text-slate-950"
                          : "font-medium text-slate-700"
                      }`}
                    >
                      {item.name}
                    </Text>

                    {selected && (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-950">
                        <Text className="text-xs font-bold text-white">
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

          <View className="mb-4 rounded-3xl bg-white p-5">

            <Text className="mb-2 text-sm font-semibold text-slate-700">
              Amount
            </Text>

            <View className="flex-row items-center">

              <Text className="mr-2 text-base font-bold text-slate-500">
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
              className="flex-1 text-2xl font-bold text-slate-950"
            />

            </View>

          </View>


 {/* DATE */}

<View className="mb-4">

  <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700">
    Expense Date
  </Text>

  <Pressable
    onPress={() => setShowDatePicker(true)}
    className="flex-row items-center rounded-3xl bg-white p-5 active:opacity-80"
  >
    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
      <CalendarDays
        size={21}
        color="#0f172a"
      />
    </View>

    <View className="ml-4 flex-1">
      <Text className="text-xs text-slate-400">
        Date
      </Text>

      <Text className="mt-1 text-base font-semibold text-slate-950">
        {formatExpenseDate(expenseDate)}
      </Text>
    </View>

    <ChevronDown
      size={20}
      color="#64748b"
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

          <Text className="mb-3 text-xl font-bold text-slate-950">
            Payment Details
          </Text>


          {/* PAYMENT METHOD */}

          <View className="mb-4">

            <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700">
              Payment Method
            </Text>

            <Pressable
              onPress={() =>
                setShowPaymentMethods(
                  (value) => !value
                )
              }
              className="flex-row items-center rounded-3xl bg-white p-5"
            >

              <Text className="flex-1 text-base font-semibold text-slate-950">
                {paymentMethod}
              </Text>

              <ChevronDown
                size={20}
                color="#64748b"
              />

            </Pressable>

{showPaymentMethods && (
  <View className="mt-2 rounded-3xl bg-white p-3">

    {PAYMENT_METHODS.map((method) => {
      const selected = paymentMethod === method;

      return (
        <Pressable
          key={method}
          onPress={() => {
            setPaymentMethod(method);
            setShowPaymentMethods(false);
          }}
          className={`mb-1 flex-row items-center rounded-2xl px-3 py-3.5 ${
            selected ? "bg-slate-100" : ""
          }`}
        >
          <View
            className={`h-10 w-10 items-center justify-center rounded-xl ${
              selected
                ? "bg-slate-950"
                : "bg-slate-100"
            }`}
          >
            <Ionicons
              name={getPaymentIcon(method) as any}
              size={20}
              color={selected ? "white" : "#334155"}
            />
          </View>

          <Text
            className={`ml-3 flex-1 text-sm ${
              selected
                ? "font-bold text-slate-950"
                : "font-medium text-slate-700"
            }`}
          >
            {method}
          </Text>

          {selected && (
            <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-950">
              <Text className="text-xs font-bold text-white">
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

          <View className="mb-4 rounded-3xl bg-white p-5">

            <Text className="mb-2 text-sm font-semibold text-slate-700">
              Vendor / Supplier
            </Text>

            <TextInput
              value={vendor}
              onChangeText={setVendor}
              placeholder="e.g. TANESCO"
              placeholderTextColor="#94a3b8"
              className="text-base text-slate-950"
            />

          </View>


          {/* REFERENCE */}

          <View className="mb-4 rounded-3xl bg-white p-5">

            <Text className="mb-2 text-sm font-semibold text-slate-700">
              Reference Number
            </Text>

            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Optional"
              placeholderTextColor="#94a3b8"
              className="text-base text-slate-950"
            />

          </View>

        </View>


        {/* ADDITIONAL INFORMATION */}

        <View className="mt-4">

          <Text className="mb-3 text-xl font-bold text-slate-950">
            Additional Information
          </Text>


          {/* DESCRIPTION */}

          <View className="mb-4 rounded-3xl bg-white p-5">

            <Text className="mb-2 text-sm font-semibold text-slate-700">
              Description / Notes
            </Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add any additional information..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              className="min-h-[100px] text-base text-slate-950"
            />

          </View>


          {/* STATUS */}

          <View className="mb-4">

            <Text className="mb-2 ml-1 text-sm font-semibold text-slate-700">
              Status
            </Text>

            <Pressable
              onPress={() =>
                setShowStatuses((value) => !value)
              }
              className="flex-row items-center rounded-3xl bg-white p-5"
            >

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                <CircleCheck
                  size={21}
                  color="#059669"
                />
              </View>

              <Text className="ml-4 flex-1 text-base font-semibold text-slate-950">
                {status}
              </Text>

              <ChevronDown
                size={20}
                color="#64748b"
              />

            </Pressable>


            {showStatuses && (
              <View className="mt-2 rounded-3xl bg-white p-2">

                {EXPENSE_STATUSES.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setStatus(item);
                      setShowStatuses(false);
                    }}
                    className={`rounded-2xl px-4 py-4 ${
                      status === item
                        ? "bg-slate-100"
                        : ""
                    }`}
                  >
                    <Text className="font-medium text-slate-900">
                      {item}
                    </Text>
                  </Pressable>
                ))}

              </View>
            )}

          </View>


          {/* RECURRING */}

          <View className="mb-4 rounded-3xl bg-white p-5">

            <View className="flex-row items-center">

              <View className="flex-1">

                <Text className="text-base font-semibold text-slate-950">
                  Recurring Expense
                </Text>

                <Text className="mt-1 text-xs leading-5 text-slate-400">
                  Mark this if the expense repeats regularly.
                </Text>

              </View>

              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{
                  false: "#e2e8f0",
                  true: "#94a3b8",
                }}
                thumbColor={
                  isRecurring
                    ? "#0f172a"
                    : "#f8fafc"
                }
              />

            </View>


            {isRecurring && (
              <View className="mt-5 border-t border-slate-100 pt-4">

                <Text className="mb-3 text-sm font-semibold text-slate-700">
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
                          ? "bg-slate-950"
                          : "bg-slate-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          recurrencePeriod === period
                            ? "text-white"
                            : "text-slate-600"
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
        {/* Receipt */}
        <View className="mt-5">
          <Text className="mb-2 text-sm font-semibold text-slate-700">
            Receipt
          </Text>

          {receiptUri ? (
            <View className="overflow-hidden rounded-3xl bg-white">
              <Image
                source={{ uri: receiptUri }}
                className="h-52 w-full"
                contentFit="cover"
              />

              <View className="flex-row items-center justify-between p-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-950">
                    Receipt attached
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    Ready to upload
                  </Text>
                </View>

                <Pressable
                  onPress={() => setReceiptUri(null)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-red-50"
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
              className="flex-row items-center rounded-3xl bg-white p-4 active:opacity-70"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Ionicons
                  name="receipt-outline"
                  size={23}
                  color="#0f172a"
                />
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-base font-bold text-slate-950">
                  Attach Receipt
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
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
        className={`mt-5 items-center rounded-3xl bg-slate-950 py-5 ${
          saving ? "opacity-60" : "active:opacity-80"
        }`}
      >
        {saving ? (
          <View className="flex-row items-center">
            <View className="mr-3 h-5 w-5 rounded-full border-2 border-white border-t-transparent" />

            <Text className="text-base font-bold text-white">
              {uploadingReceipt
                ? "Uploading receipt..."
                : "Saving expense..."}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Receipt size={20} color="white" />

            <Text className="ml-2 text-base font-bold text-white">
              Save Expense
            </Text>
          </View>
        )}
      </Pressable>

      </ScrollView>
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