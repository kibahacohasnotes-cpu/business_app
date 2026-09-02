import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Pencil,
  Receipt,
  Repeat2,
  Store,
  Trash2,
  Wallet,
} from "lucide-react-native";

import AppAlert from "@/components/ui/AppAlert";
import Loading from "@/components/ui/Loading";
import {
  deleteExpense,
  getExpense,
  Expense,
} from "@/lib/expenses";

function formatMoney(value: number) {
  return `TZS ${new Intl.NumberFormat("en-TZ").format(value)}/=`;
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("en-TZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: Expense["status"]) {
  switch (status) {
    case "Paid":
      return {
        background: "bg-emerald-50",
        text: "text-emerald-700",
        icon: "#059669",
      };

    case "Pending":
      return {
        background: "bg-amber-50",
        text: "text-amber-700",
        icon: "#d97706",
      };

    case "Cancelled":
      return {
        background: "bg-red-50",
        text: "text-red-700",
        icon: "#dc2626",
      };
  }
}

export default function ExpenseDetailScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [deleting, setDeleting] = useState(false);

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

  const loadExpense = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const data = await getExpense(id);

      if (!data) {
        showAlert(
          "error",
          "Expense not found",
          "This expense could not be found."
        );
        return;
      }

      setExpense(data);
    } catch (error: any) {
      console.error("GET EXPENSE ERROR:", error);

      showAlert(
        "error",
        "Unable to load expense",
        error?.message ||
          "Something went wrong while loading the expense."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadExpense();
    }, [loadExpense])
  );

  function handleDeletePress() {
    if (!expense) return;

    showAlert(
      "warning",
      "Delete expense?",
      `Are you sure you want to delete "${expense.title}"? This action cannot be undone.`
    );
  }

  async function handleDelete() {
    if (!expense) return;

    try {
      setDeleting(true);
      setAlertVisible(false);

      await deleteExpense(expense.id);

      showAlert(
        "success",
        "Expense deleted",
        "The expense has been removed successfully."
      );
    } catch (error: any) {
      console.error("DELETE EXPENSE ERROR:", error);

      showAlert(
        "error",
        "Delete failed",
        error?.message ||
          "Something went wrong while deleting the expense."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleAlertClose() {
    setAlertVisible(false);

    if (
      alertType === "success" &&
      alertTitle === "Expense deleted"
    ) {
      router.back();
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (!expense) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Receipt size={30} color="#dc2626" />
        </View>

        <Text className="mt-5 text-xl font-bold text-slate-950">
          Expense not found
        </Text>

        <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
          The expense you're looking for doesn't exist or may
          have been removed.
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-2xl bg-slate-950 px-6 py-4"
        >
          <Text className="font-bold text-white">
            Go Back
          </Text>
        </Pressable>

        <AppAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          buttonText="OK"
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  }

  const statusStyle = getStatusStyle(expense.status);

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}
      <View className="bg-slate-50 px-6 pb-4 pt-14">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70"
          >
            <ArrowLeft
              size={22}
              color="#0f172a"
            />
          </Pressable>

          <View className="ml-4 flex-1">
            <Text className="text-sm font-medium text-slate-500">
              Expense
            </Text>

            <Text
              numberOfLines={1}
              className="mt-1 text-2xl font-bold text-slate-950"
            >
              {expense.title}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push(`/expense/edit/${expense.id}`)
            }
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70"
          >
            <Pencil
              size={19}
              color="#0f172a"
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-32"
      >
        {/* AMOUNT CARD */}
        <View className="mt-3 overflow-hidden rounded-3xl bg-slate-950 p-6">
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Wallet
                size={21}
                color="white"
              />
            </View>

            <Text className="ml-3 text-sm font-medium text-slate-300">
              Expense Amount
            </Text>
          </View>

          <Text className="mt-5 text-4xl font-bold text-white">
            {formatMoney(Number(expense.amount))}
          </Text>

          <View className="mt-5 flex-row items-center">
            <View
              className={`flex-row items-center rounded-full px-3 py-2 ${statusStyle.background}`}
            >
              <CheckCircle2
                size={15}
                color={statusStyle.icon}
              />

              <Text
                className={`ml-1.5 text-xs font-bold ${statusStyle.text}`}
              >
                {expense.status}
              </Text>
            </View>

            <Text className="ml-3 text-xs text-slate-400">
              {formatDate(expense.expense_date)}
            </Text>
          </View>
        </View>

        {/* RECEIPT */}
        {expense.receipt_url && (
          <View className="mt-5">
            <Text className="mb-3 text-xl font-bold text-slate-950">
              Receipt
            </Text>

            <View className="overflow-hidden rounded-3xl bg-white">
              <Image
                source={{ uri: expense.receipt_url }}
                className="h-80 w-full"
                contentFit="contain"
                transition={200}
              />
            </View>
          </View>
        )}

        {/* EXPENSE DETAILS */}
        <View className="mt-6">
          <Text className="mb-3 text-xl font-bold text-slate-950">
            Expense Details
          </Text>

          <View className="overflow-hidden rounded-3xl bg-white">
            {/* CATEGORY */}
            <View className="flex-row items-center border-b border-slate-100 p-5">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <Receipt
                  size={20}
                  color="#0f172a"
                />
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-xs text-slate-400">
                  Category
                </Text>

                <Text className="mt-1 text-base font-semibold text-slate-950">
                  {expense.category}
                </Text>
              </View>
            </View>

            {/* DATE */}
            <View className="flex-row items-center border-b border-slate-100 p-5">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <CalendarDays
                  size={20}
                  color="#0f172a"
                />
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-xs text-slate-400">
                  Expense Date
                </Text>

                <Text className="mt-1 text-base font-semibold text-slate-950">
                  {formatDate(expense.expense_date)}
                </Text>
              </View>
            </View>

            {/* PAYMENT METHOD */}
            <View className="flex-row items-center border-b border-slate-100 p-5">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <CreditCard
                  size={20}
                  color="#0f172a"
                />
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-xs text-slate-400">
                  Payment Method
                </Text>

                <Text className="mt-1 text-base font-semibold text-slate-950">
                  {expense.payment_method || "Not specified"}
                </Text>
              </View>
            </View>

            {/* VENDOR */}
            {expense.vendor && (
              <View className="flex-row items-center border-b border-slate-100 p-5">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Store
                    size={20}
                    color="#0f172a"
                  />
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-xs text-slate-400">
                    Vendor / Supplier
                  </Text>

                  <Text className="mt-1 text-base font-semibold text-slate-950">
                    {expense.vendor}
                  </Text>
                </View>
              </View>
            )}

            {/* REFERENCE */}
            {expense.reference && (
              <View className="flex-row items-center border-b border-slate-100 p-5">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <FileText
                    size={20}
                    color="#0f172a"
                  />
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-xs text-slate-400">
                    Reference
                  </Text>

                  <Text className="mt-1 text-base font-semibold text-slate-950">
                    {expense.reference}
                  </Text>
                </View>
              </View>
            )}

            {/* RECURRING */}
            {expense.is_recurring && (
              <View className="flex-row items-center p-5">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                  <Repeat2
                    size={20}
                    color="#0f172a"
                  />
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-xs text-slate-400">
                    Recurring Expense
                  </Text>

                  <Text className="mt-1 text-base font-semibold text-slate-950">
                    {expense.recurrence_period || "Recurring"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* DESCRIPTION */}
        {expense.description && (
          <View className="mt-6">
            <Text className="mb-3 text-xl font-bold text-slate-950">
              Notes
            </Text>

            <View className="rounded-3xl bg-white p-5">
              <Text className="text-sm leading-6 text-slate-600">
                {expense.description}
              </Text>
            </View>
          </View>
        )}

        {/* ACTIONS */}
        <View className="mt-6">
          <Text className="mb-3 text-xl font-bold text-slate-950">
            Actions
          </Text>

          <Pressable
            onPress={() =>
              router.push(`/expense/edit/${expense.id}`)
            }
            className="flex-row items-center rounded-3xl bg-white p-5 active:opacity-70"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
              <Pencil
                size={20}
                color="#0f172a"
              />
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-base font-bold text-slate-950">
                Edit Expense
              </Text>

              <Text className="mt-1 text-xs text-slate-500">
                Update expense information
              </Text>
            </View>

            <ChevronRight
              size={20}
              color="#94a3b8"
            />
          </Pressable>

          <Pressable
            onPress={handleDeletePress}
            disabled={deleting}
            className="mt-3 flex-row items-center rounded-3xl bg-red-50 p-5 active:opacity-70"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-100">
              <Trash2
                size={20}
                color="#dc2626"
              />
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-base font-bold text-red-700">
                Delete Expense
              </Text>

              <Text className="mt-1 text-xs text-red-500">
                Permanently remove this expense
              </Text>
            </View>

            <ChevronRight
              size={20}
              color="#f87171"
            />
          </Pressable>
        </View>
      </ScrollView>

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttonText={
          alertTitle === "Delete expense?"
            ? "Delete"
            : "OK"
        }
        cancelText="Cancel"
        onClose={handleAlertClose}
        onConfirm={
          alertTitle === "Delete expense?"
            ? handleDelete
            : undefined
        }
      />
    </View>
  );
}