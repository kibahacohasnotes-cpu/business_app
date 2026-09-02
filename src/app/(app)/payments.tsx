import {
  getPayments,
  type Payment,
} from "@/lib/payments";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

type Filter =
  | "all"
  | "cash"
  | "card"
  | "mobile_money"
  | "bank_transfer"
  | "credit"
  | "other";

type Sort =
  | "date"
  | "amount";

export default function PaymentsScreen() {
  const router = useRouter();

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("all");

  const [sort, setSort] =
    useState<Sort>("date");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* =====================================================
     LOAD PAYMENTS
  ===================================================== */

  const loadPayments = useCallback(
    async () => {
      try {
        const data =
          await getPayments();

        setPayments(data);
      } catch (error) {
        console.error(
          "GET PAYMENTS ERROR:",
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments])
  );

  /* =====================================================
     HELPERS
  ===================================================== */

  function formatMoney(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-TZ"
    ).format(value);
  }

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleDateString("en-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatPaymentMethod(
    method: Payment["payment_method"]
  ) {
    return method
      .replace("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  /* =====================================================
     FILTER + SEARCH + SORT
  ===================================================== */

  const filteredPayments =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const result =
        payments.filter((payment) => {
          const matchesSearch =
            !query ||
            payment.id
              .toLowerCase()
              .includes(query) ||
            payment.sale_id
              ?.toLowerCase()
              .includes(query) ||
            payment.reference
              ?.toLowerCase()
              .includes(query) ||
            payment.payment_method
              .toLowerCase()
              .includes(query);

          const matchesFilter =
            filter === "all" ||
            payment.payment_method ===
              filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        });

      return [...result].sort(
        (a, b) => {
          if (sort === "amount") {
            return (
              Number(b.amount) -
              Number(a.amount)
            );
          }

          return (
            new Date(
              b.payment_date
            ).getTime() -
            new Date(
              a.payment_date
            ).getTime()
          );
        }
      );
    }, [
      payments,
      search,
      filter,
      sort,
    ]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalPayments =
    payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );

  const todayPayments =
    payments.filter((payment) => {
      const today =
        new Date();

      const paymentDate =
        new Date(
          payment.payment_date
        );

      return (
        today.toDateString() ===
        paymentDate.toDateString()
      );
    });

  const todayTotal =
    todayPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount),
      0
    );

  /* =====================================================
     PAYMENT CARD
  ===================================================== */

  function renderPayment({
    item,
  }: {
    item: Payment;
  }) {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/payment/[id]",
            params: {
              id: item.id,
            },
          })
        }
  className="mb-3 rounded-3xl bg-white p-5 active:opacity-70"
>
        <View className="flex-row items-center">

          {/* ICON */}

          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">

            <Ionicons
              name={
                item.payment_method ===
                "cash"
                  ? "cash-outline"
                  : item.payment_method ===
                    "card"
                  ? "card-outline"
                  : item.payment_method ===
                    "mobile_money"
                  ? "phone-portrait-outline"
                  : item.payment_method ===
                    "bank_transfer"
                  ? "business-outline"
                  : "wallet-outline"
              }
              size={22}
              color="#0f172a"
            />

          </View>

          {/* INFO */}

          <View className="ml-4 flex-1">

            <Text className="text-base font-bold text-slate-900">
              {formatPaymentMethod(
                item.payment_method
              )}
            </Text>

            <Text className="mt-1 text-xs text-slate-400">
              {formatDate(
                item.payment_date
              )}
            </Text>

            {item.reference && (
              <Text
                className="mt-1 text-xs text-slate-500"
                numberOfLines={1}
              >
                Ref: {item.reference}
              </Text>
            )}

          </View>

          {/* AMOUNT */}

          <View className="items-end">

            <Text className="text-base font-bold text-slate-950">
              TZS{" "}
              {formatMoney(
                Number(item.amount)
              )}
            </Text>

            {item.sale_id && (
              <Text className="mt-1 text-xs text-slate-400">
                Sale #
                {item.sale_id.slice(
                  0,
                  8
                )}
              </Text>
            )}

          </View>

        </View>

      </Pressable>
    );
  }

  /* =====================================================
     SCREEN
  ===================================================== */

  return (
    <View className="flex-1 bg-slate-50">

      {/* =================================================
          STATIC HEADER
      ================================================= */}

      <View className="bg-slate-50 px-5 pb-4 pt-14">

        <View className="flex-row items-center">

          <Pressable
            onPress={() =>
              router.back()
            }
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0f172a"
            />
          </Pressable>

          <View className="flex-1">

            <Text className="text-3xl font-bold text-slate-950">
              Payments
            </Text>

            <Text className="mt-1 text-sm text-slate-400">
              Track money received
            </Text>

          </View>

        </View>

        {/* SEARCH */}

        <View className="mt-5 flex-row items-center rounded-2xl bg-white px-4 py-3">

          <Ionicons
            name="search-outline"
            size={21}
            color="#94a3b8"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search payments..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            className="ml-3 flex-1 text-base text-slate-900"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() =>
                setSearch("")
              }
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#94a3b8"
              />
            </Pressable>
          )}

        </View>

      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <FlatList
        data={filteredPayments}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderPayment}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPayments();
            }}
          />
        }
        ListHeaderComponent={
          <>

            {/* SUMMARY */}

            <View className="mb-5 flex-row gap-3">

              <View className="flex-1 rounded-3xl bg-slate-950 p-5">

                <Text className="text-xs font-medium text-slate-400">
                  TOTAL RECEIVED
                </Text>

                <Text className="mt-2 text-xl font-bold text-white">
                  TZS{" "}
                  {formatMoney(
                    totalPayments
                  )}
                </Text>

              </View>

              <View className="flex-1 rounded-3xl bg-white p-5">

                <Text className="text-xs font-medium text-slate-400">
                  TODAY
                </Text>

                <Text className="mt-2 text-xl font-bold text-slate-950">
                  TZS{" "}
                  {formatMoney(
                    todayTotal
                  )}
                </Text>

              </View>

            </View>

            {/* SORT */}

            <View className="mb-3 flex-row items-center justify-between">

              <Text className="text-lg font-bold text-slate-900">
                Payment history
              </Text>

              <View className="flex-row rounded-xl bg-white p-1">

                <Pressable
                  onPress={() =>
                    setSort("date")
                  }
                  className={`rounded-lg px-3 py-2 ${
                    sort === "date"
                      ? "bg-slate-950"
                      : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      sort === "date"
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    Date
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setSort("amount")
                  }
                  className={`rounded-lg px-3 py-2 ${
                    sort === "amount"
                      ? "bg-slate-950"
                      : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      sort === "amount"
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    Amount
                  </Text>
                </Pressable>

              </View>

            </View>

            {/* FILTERS */}

            <FlatList
              horizontal
              data={[
                "all",
                "cash",
                "card",
                "mobile_money",
                "bank_transfer",
                "credit",
                "other",
              ] as Filter[]}
              keyExtractor={(item) =>
                item
              }
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={{
                paddingBottom: 18,
              }}
              renderItem={({
                item,
              }) => (
                <Pressable
                  onPress={() =>
                    setFilter(item)
                  }
                  className={`mr-2 rounded-full px-4 py-2.5 ${
                    filter === item
                      ? "bg-slate-950"
                      : "bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      filter === item
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {item ===
                    "mobile_money"
                      ? "Mobile Money"
                      : item ===
                        "bank_transfer"
                      ? "Bank Transfer"
                      : item
                          .charAt(0)
                          .toUpperCase() +
                        item.slice(1)}
                  </Text>
                </Pressable>
              )}
            />

          </>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-16">

              <ActivityIndicator
                size="large"
                color="#0f172a"
              />

              <Text className="mt-4 text-sm text-slate-400">
                Loading payments...
              </Text>

            </View>
          ) : (
            <View className="items-center rounded-3xl bg-white px-6 py-12">

              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                <Ionicons
                  name="wallet-outline"
                  size={30}
                  color="#64748b"
                />

              </View>

              <Text className="mt-5 text-lg font-bold text-slate-900">
                No payments found
              </Text>

              <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
                Payments recorded from sales will appear here.
              </Text>

            </View>
          )
        }
      />

    </View>
  );
}