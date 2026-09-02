import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Receipt,
  TrendingDown,
} from "lucide-react-native";

import { getMyBusiness } from "@/lib/business";
import { getExpenses, Expense } from "@/lib/expenses";
import { formatMoney } from "@/lib/format";
import {
  createExpense,
  uploadExpenseReceipt,
} from "../../lib/expenses";

type Filter = "all" | "today" | "week" | "month";

export default function Expenses() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [businessName, setBusinessName] = useState("My Business");
  const [currency, setCurrency] = useState("TZS");

  const [filter, setFilter] = useState<Filter>("month");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExpenses = useCallback(async () => {
    try {
      const business = await getMyBusiness();

      if (!business) {
        setExpenses([]);
        return;
      }

      setBusinessName(business.name);
      setCurrency(business.currency || "TZS");

      const data = await getExpenses(business.id);

      setExpenses(data);
    } catch (error) {
      console.error("Expenses error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const refreshExpenses = useCallback(async () => {
    setRefreshing(true);
    await loadExpenses();
  }, [loadExpenses]);

  function formatExpenseMoney(value: number) {
    return `${currency} ${value.toLocaleString("en-TZ")}/=`;
  }

  function getExpenseDate(date: string) {
    return new Date(`${date}T00:00:00`);
  }

  const filteredExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      const date = getExpenseDate(expense.expense_date);

      if (filter === "all") {
        return true;
      }

      if (filter === "today") {
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
      }

      if (filter === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return date >= start && date <= end;
      }

      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });
  }, [expenses, filter]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0
    );
  }, [filteredExpenses]);

  const paidExpenses = useMemo(() => {
    return filteredExpenses
      .filter((expense) => expense.status === "Paid")
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0
      );
  }, [filteredExpenses]);

  const pendingExpenses = useMemo(() => {
    return filteredExpenses
      .filter((expense) => expense.status === "Pending")
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0
      );
  }, [filteredExpenses]);

  function formatDate(date: string) {
    return getExpenseDate(date).toLocaleDateString("en-TZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCategoryIcon(category: string) {
    const value = category.toLowerCase();

    if (value.includes("stock") || value.includes("purchase")) {
      return Receipt;
    }

    if (value.includes("rent")) {
      return CalendarDays;
    }

    if (
      value.includes("bank") ||
      value.includes("payment")
    ) {
      return CreditCard;
    }

    return CircleDollarSign;
  }

  function getCategoryIconBackground(category: string) {
    const value = category.toLowerCase();

    if (value.includes("stock")) {
      return "bg-blue-50";
    }

    if (value.includes("rent")) {
      return "bg-purple-50";
    }

    if (value.includes("utilities")) {
      return "bg-amber-50";
    }

    if (value.includes("transport")) {
      return "bg-orange-50";
    }

    return "bg-slate-100";
  }

  return (
    <View className="flex-1 bg-slate-50">

      {/* HEADER */}

      <Animated.View
        entering={FadeInDown.duration(400)}
        className="px-6 pb-5 pt-14"
      >
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
              {businessName}
            </Text>

            <Text className="mt-1 text-3xl font-bold text-slate-950">
              Expenses
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/add-expense")}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 active:opacity-80"
          >
            <Text className="text-2xl font-light text-white">
              +
            </Text>
          </Pressable>

        </View>
      </Animated.View>


      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshExpenses}
            tintColor="#0f172a"
            colors={["#0f172a"]}
          />
        }
      >

        {/* TOTAL EXPENSES */}

        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="mx-6 rounded-[28px] bg-slate-950 p-6"
        >
          <View className="flex-row items-center">

            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <TrendingDown
                size={21}
                color="white"
              />
            </View>

            <Text className="ml-3 text-sm font-medium text-slate-400">
              Total Expenses
            </Text>

          </View>

          <Text className="mt-5 text-4xl font-bold text-white">
            {loading
              ? "Loading..."
              : formatExpenseMoney(totalExpenses)}
          </Text>

          <Text className="mt-2 text-sm text-slate-400">
            {filteredExpenses.length}{" "}
            {filteredExpenses.length === 1
              ? "expense"
              : "expenses"}
          </Text>
        </Animated.View>


        {/* QUICK STATS */}

        <View className="mt-4 flex-row gap-3 px-6">

          <Animated.View
            entering={FadeInRight.delay(150).duration(400)}
            className="flex-1 rounded-3xl bg-white p-4"
          >
            <Text className="text-xs text-slate-400">
              Paid
            </Text>

            <Text
              className="mt-2 text-base font-bold text-slate-950"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatExpenseMoney(paidExpenses)}
            </Text>
          </Animated.View>


          <Animated.View
            entering={FadeInRight.delay(200).duration(400)}
            className="flex-1 rounded-3xl bg-white p-4"
          >
            <Text className="text-xs text-slate-400">
              Pending
            </Text>

            <Text
              className="mt-2 text-base font-bold text-slate-950"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatExpenseMoney(pendingExpenses)}
            </Text>
          </Animated.View>

        </View>


        {/* FILTERS */}

        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          className="mt-7 px-6"
        >
          <Text className="mb-3 text-xl font-bold text-slate-950">
            Overview
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >

            {[
              { id: "all", label: "All" },
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
            ].map((item) => {
              const active = filter === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    setFilter(item.id as Filter)
                  }
                  className={`mr-2 rounded-full px-5 py-3 ${
                    active
                      ? "bg-slate-950"
                      : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}

          </ScrollView>
        </Animated.View>


        {/* EXPENSE LIST */}

        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          className="mt-7 px-6"
        >

          <View className="mb-4 flex-row items-center justify-between">

            <Text className="text-xl font-bold text-slate-950">
              Recent Expenses
            </Text>

            <Text className="text-sm font-semibold text-slate-400">
              {filteredExpenses.length} items
            </Text>

          </View>


          {loading ? (

            <View className="rounded-3xl bg-white p-8">
              <ActivityIndicator
                size="small"
                color="#0f172a"
              />
            </View>

          ) : filteredExpenses.length === 0 ? (

            <View className="items-center rounded-3xl bg-white px-6 py-10">

              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Receipt
                  size={28}
                  color="#64748b"
                />
              </View>

              <Text className="mt-5 text-lg font-bold text-slate-950">
                No expenses yet
              </Text>

              <Text className="mt-2 text-center text-sm leading-5 text-slate-400">
                Start recording your business expenses
                to keep track of where your money goes.
              </Text>

              <Pressable
                onPress={() =>
                  router.push("/add-expense")
                }
                className="mt-6 rounded-2xl bg-slate-950 px-6 py-3.5 active:opacity-80"
              >
                <Text className="font-semibold text-white">
                  Add Expense
                </Text>
              </Pressable>

            </View>

          ) : (

            filteredExpenses.map((expense) => {
              const Icon = getCategoryIcon(
                expense.category
              );

              return (
                <Pressable
                  key={expense.id}
                  onPress={() =>
                    router.push({
                      pathname: "/expense/[id]",
                      params: {
                        id: expense.id,
                      },
                    })
                  }
                  className="mb-3 rounded-3xl bg-white p-5 active:opacity-70"
                >

                  <View className="flex-row items-center">

                    <View
                      className={`h-12 w-12 items-center justify-center rounded-2xl ${getCategoryIconBackground(
                        expense.category
                      )}`}
                    >
                      <Icon
                        size={21}
                        color="#0f172a"
                      />
                    </View>


                    <View className="ml-4 flex-1">

                      <Text
                        numberOfLines={1}
                        className="font-semibold text-slate-950"
                      >
                        {expense.title}
                      </Text>

                      <Text className="mt-1 text-xs text-slate-400">
                        {expense.category}
                      </Text>

                      <View className="mt-2 flex-row items-center">

                        <CalendarDays
                          size={13}
                          color="#94a3b8"
                        />

                        <Text className="ml-1 text-xs text-slate-400">
                          {formatDate(
                            expense.expense_date
                          )}
                        </Text>

                        {expense.payment_method && (
                          <>
                            <View className="mx-2 h-1 w-1 rounded-full bg-slate-300" />

                            <Text className="text-xs text-slate-400">
                              {expense.payment_method}
                            </Text>
                          </>
                        )}

                      </View>

                    </View>


                    <View className="items-end">

                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        className="max-w-[120px] text-sm font-bold text-slate-950"
                      >
                        {formatExpenseMoney(
                          Number(expense.amount)
                        )}
                      </Text>

                      <View
                        className={`mt-2 rounded-full px-2.5 py-1 ${
                          expense.status === "Paid"
                            ? "bg-emerald-50"
                            : expense.status === "Pending"
                              ? "bg-amber-50"
                              : "bg-red-50"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            expense.status === "Paid"
                              ? "text-emerald-600"
                              : expense.status === "Pending"
                                ? "text-amber-600"
                                : "text-red-500"
                          }`}
                        >
                          {expense.status}
                        </Text>
                      </View>

                    </View>

                    <ChevronRight
                      size={17}
                      color="#cbd5e1"
                      className="ml-2"
                    />

                  </View>

                </Pressable>
              );
            })

          )}

        </Animated.View>

      </ScrollView>


      {/* FLOATING ADD BUTTON */}

      {filteredExpenses.length > 0 && (
        <Pressable
          onPress={() =>
            router.push("/add-expense")
          }
          className="absolute bottom-7 right-6 h-16 w-16 items-center justify-center rounded-full bg-slate-950 active:opacity-80"
          style={{
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 10,
            shadowOffset: {
              width: 0,
              height: 5,
            },
          }}
        >
          <Text className="text-3xl font-light text-white">
            +
          </Text>
        </Pressable>
      )}

    </View>
  );
}