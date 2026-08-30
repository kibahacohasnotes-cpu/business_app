
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import {
  Bell,
  ChevronRight,
  Package,
  Plus,
  ShoppingCart,
  Users,
} from "lucide-react-native";

import { getMyBusiness } from "@/lib/business";
import { getDashboardStats } from "@/lib/dashboard";

type DashboardData = {
  products: number;
  customers: number;
  sales: number;
  revenue: number;
  lowStock: {
    id: string;
    name: string;
    stock_qty: number;
    low_stock_threshold: number;
  }[];
};

export default function Dashboard() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("My Business");
  const [currency, setCurrency] = useState("TZS");

  const [stats, setStats] = useState<DashboardData>({
    products: 0,
    customers: 0,
    sales: 0,
    revenue: 0,
    lowStock: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const business = await getMyBusiness();

      if (!business) {
        console.log("No business found for current user");
        return;
      }

      setBusinessName(business.name);
      setCurrency(business.currency || "TZS");

      const dashboardStats = await getDashboardStats(business.id);

      setStats(dashboardStats);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(value: number) {
    return `${currency} ${value.toLocaleString()}`;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32"
      >
        {/* HEADER */}

        <Animated.View
          entering={FadeInDown.duration(500)}
          className="px-6 pb-6 pt-16"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm font-medium text-slate-500">
                Welcome back 👋
              </Text>

              <Text
                numberOfLines={1}
                className="mt-1 text-3xl font-bold text-slate-950"
              >
                {businessName}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                console.log("Notifications pressed");
              }}
              className="ml-4 h-12 w-12 items-center justify-center rounded-2xl bg-white active:opacity-70"
            >
              <Bell size={21} color="#0f172a" />
            </Pressable>
          </View>
        </Animated.View>

        {/* REVENUE */}

        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="mx-6 rounded-[28px] bg-slate-950 p-6"
        >
          <Text className="text-sm font-medium text-slate-400">
            Total Revenue
          </Text>

          <Text className="mt-2 text-4xl font-bold text-white">
            {loading ? "Loading..." : formatMoney(stats.revenue)}
          </Text>

          <View className="mt-5 flex-row items-center">
            <View className="rounded-full bg-white/10 px-3 py-1.5">
              <Text className="text-xs font-semibold text-white">
                Completed sales
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* STATS */}

        <View className="mt-5 flex-row gap-3 px-6">
          {/* SALES */}

          <Animated.View
            entering={FadeInRight.delay(200).duration(500)}
            className="flex-1"
          >
            <Pressable
              onPress={() => {
                console.log("Sales pressed");
              }}
              className="rounded-3xl bg-white p-5 active:opacity-70"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <ShoppingCart size={20} color="#0f172a" />
              </View>

              <Text className="mt-5 text-sm text-slate-500">
                Sales
              </Text>

              <Text className="mt-1 text-2xl font-bold text-slate-950">
                {loading ? "..." : stats.sales}
              </Text>
            </Pressable>
          </Animated.View>

          {/* PRODUCTS */}

          <Animated.View
            entering={FadeInRight.delay(300).duration(500)}
            className="flex-1"
          >
            <Pressable
              onPress={() => router.push("/products")}
              className="rounded-3xl bg-white p-5 active:opacity-70"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <Package size={20} color="#0f172a" />
              </View>

              <Text className="mt-5 text-sm text-slate-500">
                Products
              </Text>

              <Text className="mt-1 text-2xl font-bold text-slate-950">
                {loading ? "..." : stats.products}
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* CUSTOMERS */}

        <Animated.View
          entering={FadeInDown.delay(350).duration(500)}
          className="mx-6 mt-3"
        >
          <Pressable
            onPress={() => {
              console.log("Customers pressed");
            }}
            className="rounded-3xl bg-white p-5 active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <Users size={20} color="#0f172a" />
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-sm text-slate-500">
                  Customers
                </Text>

                <Text className="mt-1 text-2xl font-bold text-slate-950">
                  {loading ? "..." : stats.customers}
                </Text>
              </View>

              <ChevronRight size={20} color="#94a3b8" />
            </View>
          </Pressable>
        </Animated.View>

        {/* QUICK ACTIONS */}

        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          className="mt-8 px-6"
        >
          <Text className="mb-4 text-xl font-bold text-slate-950">
            Quick Actions
          </Text>

          <View className="flex-row gap-3">
            {/* NEW SALE */}

            <Pressable
              onPress={() => {
                console.log("New Sale pressed");
              }}
              className="flex-1 rounded-3xl bg-slate-950 p-5 active:opacity-80"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Plus size={21} color="white" />
              </View>

              <Text className="mt-4 font-semibold text-white">
                New Sale
              </Text>

              <Text className="mt-1 text-xs text-slate-400">
                Record a transaction
              </Text>
            </Pressable>

            {/* ADD PRODUCT */}

            <Pressable
              onPress={() => router.push("/add-product")}
              className="flex-1 rounded-3xl bg-white p-5 active:opacity-80"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                <Package size={21} color="#0f172a" />
              </View>

              <Text className="mt-4 font-semibold text-slate-950">
                Add Product
              </Text>

              <Text className="mt-1 text-xs text-slate-400">
                Add inventory
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* LOW STOCK */}

        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          className="mt-8 px-6"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-950">
              Low Stock
            </Text>

            <Text className="text-sm font-semibold text-slate-400">
              {stats.lowStock.length} items
            </Text>
          </View>

          {stats.lowStock.length === 0 ? (
            <View className="rounded-3xl bg-white p-5">
              <Text className="text-center text-sm text-slate-400">
                No low-stock products 🎉
              </Text>
            </View>
          ) : (
            stats.lowStock.slice(0, 5).map((product) => (
              <Pressable
                key={product.id}
                onPress={() =>
                  router.push({
                    pathname: "/product/[id]",
                    params: {
                      id: product.id,
                    },
                  })
                }
                className="mb-3 rounded-3xl bg-white p-5 active:opacity-70"
              >
                <View className="flex-row items-center">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                    <Package size={19} color="#dc2626" />
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="font-semibold text-slate-900">
                      {product.name}
                    </Text>

                    <Text className="mt-1 text-xs text-slate-400">
                      Stock: {product.stock_qty}
                    </Text>
                  </View>

                  <Text className="text-xs font-semibold text-red-500">
                    Low stock
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
