import { getSales, type Sale } from "@/lib/sales";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

type Filter = "all" | "completed" | "cancelled" | "draft";
type SortOption =
  | "date_desc"
  | "date_asc"
  | "price_desc"
  | "price_asc"
  | "name_asc"
  | "name_desc";

export default function SalesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =====================================================
     LOAD SALES
  ===================================================== */

  const loadSales = useCallback(async () => {
    try {
      const data = await getSales();
      setSales(data ?? []);
    } catch (error) {
      console.error("GET SALES ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  /* =====================================================
     FILTER & SORT SALES
  ===================================================== */

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = sales.filter((sale) => {
      const productNames =
        sale.sale_items
          ?.map((item) => item.product_name?.toLowerCase() ?? "")
          .join(" ") ?? "";

      const paymentMethod = sale.payment_method?.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        productNames.includes(query) ||
        paymentMethod.includes(query);

      const matchesFilter = filter === "all" || sale.status === filter;

      return matchesSearch && matchesFilter;
    });

    return [...result].sort((a, b) => {
      switch (sortOption) {
        case "date_desc":
          return (
            new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
          );

        case "date_asc":
          return (
            new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
          );

        case "price_desc":
          return Number(b.total) - Number(a.total);

        case "price_asc":
          return Number(a.total) - Number(b.total);

        case "name_asc": {
          const aName = a.sale_items?.[0]?.product_name?.toLowerCase() ?? "";
          const bName = b.sale_items?.[0]?.product_name?.toLowerCase() ?? "";
          return aName.localeCompare(bName);
        }

        case "name_desc": {
          const aName = a.sale_items?.[0]?.product_name?.toLowerCase() ?? "";
          const bName = b.sale_items?.[0]?.product_name?.toLowerCase() ?? "";
          return bName.localeCompare(aName);
        }

        default:
          return 0;
      }
    });
  }, [sales, search, filter, sortOption]);

  /* =====================================================
     FORMATTERS & CALCULATIONS
  ===================================================== */

  const completedSales = useMemo(() => {
    return sales.filter((sale) => sale.status === "completed");
  }, [sales]);

  const totalRevenue = useMemo(() => {
    return completedSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  }, [completedSales]);

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-TZ").format(value);
  }

  function formatPaymentMethod(method?: Sale["payment_method"]) {
    if (!method) return "Not specified";
    return method
      .replace("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /* =====================================================
     SALE CARD
  ===================================================== */

  const renderSale = useCallback(({ item }: { item: Sale }) => {
    const productItems = item.sale_items ?? [];
    const firstProduct = productItems[0]?.product_name ?? "Unknown product";
    const additionalProducts = productItems.length - 1;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/sale/[id]",
            params: { id: item.id },
          })
        }
        className="mb-3 rounded-3xl bg-white p-5 active:opacity-70 dark:bg-slate-900"
      >
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Ionicons
              name="receipt-outline"
              size={22}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
          </View>

          <View className="ml-4 flex-1">
            <Text
              className="text-base font-bold text-slate-900 dark:text-white"
              numberOfLines={1}
            >
              {firstProduct}
            </Text>

            {additionalProducts > 0 && (
              <Text className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                +{additionalProducts} more product
                {additionalProducts > 1 ? "s" : ""}
              </Text>
            )}
          </View>

          <View
            className={`rounded-full px-3 py-1.5 ${
              item.status === "completed"
                ? "bg-green-50 dark:bg-green-950/40"
                : item.status === "cancelled"
                ? "bg-red-50 dark:bg-red-950/40"
                : "bg-orange-50 dark:bg-orange-950/40"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                item.status === "completed"
                  ? "text-green-600 dark:text-green-400"
                  : item.status === "cancelled"
                  ? "text-red-600 dark:text-red-400"
                  : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {(item.status ?? "DRAFT").toUpperCase()}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-end justify-between">
          <View>
            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
              PAYMENT
            </Text>
            <Text className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {formatPaymentMethod(item.payment_method)}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
              TOTAL
            </Text>
            <Text className="mt-1 text-base font-bold text-slate-950 dark:text-white">
              TZS {formatMoney(Number(item.total || 0))}
            </Text>
          </View>
        </View>

        {Number(item.discount) > 0 && (
          <View className="mt-3 flex-row items-center">
            <Ionicons
              name="pricetag-outline"
              size={14}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
            <Text className="ml-2 text-xs text-slate-500 dark:text-slate-400">
              Discount: TZS {formatMoney(Number(item.discount))}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }, [router, isDark]);

  /* =====================================================
     SCREEN RENDER
  ===================================================== */

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* STATIC TOP HEADER */}
      <View className="bg-slate-50 px-5 pb-2 pt-14 dark:bg-slate-950">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.replace("/dashboard")}
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70 dark:bg-slate-900"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
          </Pressable>

          <View className="flex-1">
            <Text className="text-3xl font-bold text-slate-950 dark:text-white">
              Sales
            </Text>
            <Text className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Track your transactions
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/add-sale")}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 active:opacity-80 dark:bg-white"
          >
            <Ionicons
              name="add"
              size={25}
              color={isDark ? "#0f172a" : "white"}
            />
          </Pressable>
        </View>

        {/* SEARCH BAR */}
        <View className="mt-4 flex-row items-center rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
          <Ionicons name="search-outline" size={21} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search sales..."
            placeholderTextColor="#94a3b8"
            className="ml-3 flex-1 text-base text-slate-900 dark:text-white"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        {/* SORT SWITCHER */}
        <View className="mt-3 flex-row items-center justify-between pb-2">
          <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Sort sales
          </Text>

          <Pressable
            onPress={() => {
              const options: SortOption[] = [
                "date_desc",
                "date_asc",
                "price_desc",
                "price_asc",
                "name_asc",
                "name_desc",
              ];
              const currentIndex = options.indexOf(sortOption);
              const nextIndex = (currentIndex + 1) % options.length;
              setSortOption(options[nextIndex]);
            }}
            className="flex-row items-center rounded-full bg-white px-4 py-2 active:opacity-70 dark:bg-slate-900"
          >
            <Ionicons
              name="swap-vertical-outline"
              size={17}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
            <Text className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              {sortOption === "date_desc"
                ? "Newest"
                : sortOption === "date_asc"
                ? "Oldest"
                : sortOption === "price_desc"
                ? "Highest price"
                : sortOption === "price_asc"
                ? "Lowest price"
                : sortOption === "name_asc"
                ? "Product A-Z"
                : "Product Z-A"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* SCROLLABLE LIST */}
      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        renderItem={renderSale}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={isDark ? "#ffffff" : "#000000"}
            onRefresh={() => {
              setRefreshing(true);
              loadSales();
            }}
          />
        }
        ListHeaderComponent={
          <View className="mb-2">
            {/* SUMMARY METRICS */}
            <View className="mb-4 flex-row gap-3">
              <View className="flex-1 rounded-3xl bg-slate-950 p-5 dark:bg-slate-900 dark:border dark:border-slate-800">
                <Text className="text-xs font-medium text-slate-400">
                  REVENUE
                </Text>
                <Text className="mt-2 text-xl font-bold text-white">
                  TZS {formatMoney(totalRevenue)}
                </Text>
              </View>

              <View className="flex-1 rounded-3xl bg-white p-5 dark:bg-slate-900">
                <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  SALES
                </Text>
                <Text className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                  {completedSales.length}
                </Text>
              </View>
            </View>

            {/* FILTER PILLS */}
            <View className="mb-4 flex-row gap-2">
              {(["all", "completed", "cancelled", "draft"] as Filter[]).map(
                (item) => (
                  <Pressable
                    key={item}
                    onPress={() => setFilter(item)}
                    className={`rounded-full px-4 py-2.5 ${
                      filter === item
                        ? "bg-slate-950 dark:bg-white"
                        : "bg-white dark:bg-slate-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        filter === item
                          ? "text-white dark:text-slate-950"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Text className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
              {search ? "Search results" : "Recent sales"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-16">
              <ActivityIndicator
                size="large"
                color={isDark ? "#ffffff" : "#0f172a"}
              />
              <Text className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                Loading sales...
              </Text>
            </View>
          ) : (
            <View className="items-center rounded-3xl bg-white px-6 py-12 dark:bg-slate-900">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Ionicons
                  name="receipt-outline"
                  size={30}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
              </View>

              <Text className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                {search ? "No sales found" : "No sales yet"}
              </Text>

              <Text className="mt-2 text-center text-sm leading-6 text-slate-400 dark:text-slate-500">
                {search
                  ? "Try another search."
                  : "Completed sales will appear here."}
              </Text>

              {!search && (
                <Pressable
                  onPress={() => router.push("/add-sale")}
                  className="mt-5 rounded-2xl bg-slate-950 px-6 py-3 dark:bg-white"
                >
                  <Text className="font-semibold text-white dark:text-slate-950">
                    New Sale
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
      />
    </View>
  );
}