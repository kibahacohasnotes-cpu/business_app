import { getMyBusiness } from "@/lib/business";
import { getDashboardStats } from "@/lib/dashboard";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Bell,
  ChevronRight, Eye,
  EyeOff, FileText, Moon, Package,
  Plus, ShoppingCart, Sun, TrendingDown, UserCircle,
  Users,
  Wallet
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";

import { useTheme } from "@/context/ThemeContext";
import {
  getDashboardCache,
  saveDashboardCache,
} from "@/lib/dashboardCache";
import NetInfo from "@react-native-community/netinfo";
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
import { getBusinessImageUrl } from "@/lib/business-images";
export default function Dashboard() {

  const { isDark, toggleTheme } = useTheme();

  const [logoutAlert, setLogoutAlert] =  useState(false);
  const [moneyVisible, setMoneyVisible] = useState(false);
  const [loggingOut, setLoggingOut] =  useState(false);
  const router = useRouter();
  const [logoutError, setTheLogoutError] =  useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [cacheTime, setCacheTime] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageLoading, setProfileImageLoading] = useState(true);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setLogoutAlert(false);

      router.replace("/login");
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      setLoggingOut(false);

      // We'll use the same AppAlert for errors
      setTheLogoutError(true);
    }
  }

  const [businessName, setBusinessName] = useState("My Business");
  const [currency, setCurrency] = useState("TZS");

  const [stats, setStats] = useState<DashboardData>({
    products: 0,
    customers: 0,
    sales: 0,
    revenue: 0,
    lowStock: [],
  });


const loadDashboard = useCallback(async () => {
  try {
    setLoading(true);

    const network = await NetInfo.fetch();
    const connected = network.isConnected ?? false;

    setIsOffline(!connected);

    // -----------------------------------------
    // OFFLINE → LOAD CACHED DASHBOARD
    // -----------------------------------------
    if (!connected) {
      const cached = await getDashboardCache();

      if (cached) {
        setBusinessName(cached.businessName);
        setCurrency(cached.currency);
        setStats(cached.stats);
        setCacheTime(cached.cachedAt);

        console.log("Dashboard loaded from cache");
      } else {
        console.log("No dashboard cache available");
      }

      return;
    }

    // -----------------------------------------
    // ONLINE → LOAD FROM SUPABASE
    // ----------------------------------------
  const business = await getMyBusiness();
    if (!business) {
      console.log("No business found for current user");
      router.replace("/business");
      return;
    }

    if (!business) {
      console.log("No business found for current user");
      router.replace("/business");
      return;
    }

    const businessCurrency = business.currency || "TZS";

    setBusinessName(business.name);
    setCurrency(businessCurrency);

    const dashboardStats = await getDashboardStats(business.id);

    setStats(dashboardStats);

    // -----------------------------------------
    // SAVE LATEST DATA LOCALLY
    // -----------------------------------------
    await saveDashboardCache({
      businessName: business.name,
      currency: businessCurrency,
      stats: dashboardStats,
    });

    setCacheTime(new Date().toISOString());

    console.log("Dashboard cache updated");
  } catch (error) {
    console.error("Dashboard error:", error);

    // -----------------------------------------
    // FALLBACK → CACHE
    // -----------------------------------------
    const cached = await getDashboardCache();

    if (cached) {
      setBusinessName(cached.businessName);
      setCurrency(cached.currency);
      setStats(cached.stats);
      setCacheTime(cached.cachedAt);
      setIsOffline(true);

      console.log("Dashboard fallback to cache");
    }
  } finally {
    setLoading(false);
  }
}, [router]);

  useEffect(() => {
  let mounted = true;

  NetInfo.fetch().then((state) => {
    if (!mounted) return;
    setIsOffline(!(state.isConnected ?? false));
  });

  const unsubscribe = NetInfo.addEventListener((state) => {
    if (!mounted) return;

    setIsOffline(!(state.isConnected ?? false));
  });

  return () => {
    mounted = false;
    unsubscribe();
  };
}, []);

  const refreshDashboard = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );


  function formatMoney(value: number) {
    return `${currency} ${value.toLocaleString()}`;
  }


return (
  <View className="flex-1 bg-slate-50 dark:bg-slate-950">

    {/* =====================================================
        STATIC HEADER
        THIS MUST BE OUTSIDE THE SCROLLVIEW
    ===================================================== */}

<Animated.View
  entering={FadeInDown.duration(500)}
  className="bg-slate-50 px-6 pb-5 pt-16 dark:bg-slate-950">
  <View className="flex-row items-center">

    {/* =================================================        PROFILE
    ================================================= */}

    <Pressable
      onPress={() =>
        router.push("/profile")
      }
      className="flex-1 flex-row items-center active:opacity-70"
    >
      <View className="h-12 w-12 overflow-hidden items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800">
        {profileImageUrl ? (
          <Image
            source={{ uri: profileImageUrl }}
            className="h-full w-full"
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-800">
            <Text className="text-lg font-bold text-slate-500 dark:text-slate-400">
              {businessName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View className="ml-3 flex-1">

        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 ">
          Welcome back
        </Text>

        <Text
          numberOfLines={1}
          className="mt-1 text-2xl font-bold text-slate-950 dark:text-white"
        >
          {businessName}
        </Text>

      </View>

    </Pressable>

    {/* =================================================
        NOTIFICATION
    ================================================= */}
    <Pressable
      onPress={toggleTheme}
      className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 active:opacity-70 dark:bg-white"
    >
      {isDark ? (
        <Sun size={21} color="#0f172a" />
      ) : (
        <Moon size={21} color="#ffffff" />
      )}
    </Pressable>
    <Pressable
      onPress={() => {
        console.log(
          "Notifications pressed"
        );
      }}
      className="ml-3 h-12 w-12 items-center justify-center rounded-2xl bg-white active:opacity-70 dark:bg-slate-900"
    >
      <Bell
        size={21}
        color={isDark ? "#ffffff" : "#0f172a"}
      />
    </Pressable>


  </View>
</Animated.View>


    {/* =====================================================
        SCROLLABLE CONTENT
    ===================================================== */}
<ScrollView
  className="flex-1"
  showsVerticalScrollIndicator={false}
  contentContainerClassName="pb-32"
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refreshDashboard}
      tintColor={isDark ? "#ffffff" : "#0f172a"}
      colors={[isDark ? "#ffffff" : "#0f172a"]}
    />
  }
>

  {isOffline && (
    <View  className="mx-6 mb-4 rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-950/40">
      <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">
        You're offline
      </Text>

      <Text className="mt-1 text-xs text-amber-600 dark:text-amber-400">
        Showing your last saved dashboard data.
        {cacheTime
          ? ` Last updated ${new Date(cacheTime).toLocaleString()}.`
          : ""}
      </Text>
    </View>
  )}

  {/* REVENUE */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        className="mx-6"
      >
        <Pressable
          onPress={() => router.push("/business-progress")}
          className="rounded-[28px] bg-slate-950 p-6 active:opacity-90"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-slate-400">
              Total Revenue
            </Text>

            <Pressable
              onPress={() =>
                setMoneyVisible((current) => !current)
              }
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            >
              {moneyVisible ? (
                <Eye size={19} color="white" />
              ) : (
                <EyeOff size={19} color="white" />
              )}
            </Pressable>
          </View>

          <Text className="mt-2 text-4xl font-bold text-white">
            {loading
              ? "Loading..."
              : moneyVisible
                ? formatMoney(stats.revenue)
                : "••••••••"}
          </Text>

          <View className="mt-5 flex-row items-center">
            <View className="rounded-full bg-white/10 px-3 py-1.5">
              <Text className="text-xs font-semibold text-white">
                Completed sales
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* =================================================
          STATS
      ================================================= */}

      <View className="mt-5 flex-row gap-3 px-6">

        {/* SALES */}

        <Animated.View
          entering={FadeInRight.delay(200).duration(500)}
          className="flex-1"
        >
          <Pressable
              onPress={() => router.push("/sales")           }
            className="rounded-3xl bg-white p-5 active:opacity-70 dark:bg-slate-900"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <ShoppingCart
                size={20}
                color={isDark ? "#ffffff" : "#0f172a"}
              />
            </View>

            <Text className="mt-5 text-sm text-slate-500 dark:text-slate-400">
              Sales
            </Text>

            <Text className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
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
            className="rounded-3xl bg-white p-5 active:opacity-70 dark:bg-slate-900"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Package
                size={20}
                color={isDark ? "#ffffff" : "#0f172a"}
              />
            </View>

            <Text className="mt-5 text-sm text-slate-500 dark:text-slate-400">
              Products
            </Text>

            <Text className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {loading ? "..." : stats.products}
            </Text>
          </Pressable>
        </Animated.View>

      </View>


      {/* =================================================
          CUSTOMERS
      ================================================= */}

      <Animated.View
        entering={FadeInDown.delay(350).duration(500)}
        className="mx-6 mt-3"
      >
        <Pressable
          onPress={() => {
            console.log("Customers pressed");
            router.push("/customers");
          }}
          className="rounded-3xl bg-white p-5 active:opacity-70 dark:bg-slate-900"
        >
          <View className="flex-row items-center">

            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Users
                size={20}
                color={isDark ? "#ffffff" : "#0f172a"}
              />
            </View>

            <View className="ml-4 flex-1">

              <Text className="text-sm text-slate-500 dark:text-slate-200">
                Customer
              </Text>

              <Text className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                {loading ? "..." : stats.customers}
              </Text>

            </View>

            <ChevronRight
              size={20}
              color="#94a3b8"
            />

          </View>
        </Pressable>
      </Animated.View>

        {/* =================================================
            EXPENSES
        ================================================= */}

        <Animated.View
          entering={FadeInDown.delay(370).duration(500)}
          className="mx-6 mt-3"
        >
          <Pressable
            onPress={() => router.push("/expenses")}
            className="rounded-3xl bg-white p-5 active:opacity-70 dark:bg-slate-900"
          >
            <View className="flex-row items-center">

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <TrendingDown
                  size={20}
                  color={isDark ? "#ffffff" : "#0f172a"}
                />
              </View>

              <View className="ml-4 flex-1">

                <Text className="text-sm text-slate-500 dark:text-slate-200">
                  Expenses
                </Text>

                <Text className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                  Track business expenses
                </Text>

              </View>

              <ChevronRight
                size={20}
                color="#94a3b8"
              />

            </View>
          </Pressable>
        </Animated.View>
        {/* =================================================
            PAYMENTS
        ================================================= */}

        <Animated.View
          entering={FadeInDown.delay(380).duration(500)}
          className="mx-6 mt-3"
        >
          <Pressable
            onPress={() => router.push("/payments")}
            className="rounded-3xl bg-white p-5 active:opacity-70 dark:bg-slate-900"
          >
            <View className="flex-row items-center">

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Wallet
                  size={20}
                  color={isDark ? "#ffffff" : "#0f172a"}
                />
              </View>

              <View className="ml-4 flex-1">

                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  Payments
                </Text>

                <Text className="mt-1 text-base font-bold text-slate-950 dark:text-white">
                  Payment history
                </Text>

              </View>

              <ChevronRight
                size={20}
                color="#94a3b8"
              />

            </View>
          </Pressable>
        </Animated.View>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        className="mt-8 px-6"
      >
        <Text className="mb-4 text-xl font-bold text-slate-950 dark:text-white">
          Quick Actions
        </Text>

        <View className="flex-row gap-3">

          {/* NEW SALE */}

          <Pressable
            onPress={() => router.push("/add-sale")}
            className="flex-1 m-1 rounded-3xl bg-white p-5 active:opacity-80 dark:bg-slate-900"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Plus
                size={21}
                color="white"
              />
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
            className="flex-1 m-1 rounded-3xl bg-white p-5 active:opacity-80 dark:bg-slate-900"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Package
                size={21}
                color={isDark ? "#ffffff" : "#0f172a"}
              />
            </View>

            <Text className="mt-4 font-semibold text-slate-950 dark:text-white">
              Add Product
            </Text>

            <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
              Add inventory
            </Text>
          </Pressable>

        </View>
      </Animated.View>
<View className="mt-1 px-1">
      <Pressable
        onPress={() => router.push("/reports")}
        className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900"
      >
        <View className="mb-3 h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
          <FileText size={22} color="#208AEF" />
        </View>

        <Text className="text-base font-bold text-slate-900 dark:text-white">
          Reports
        </Text>

        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Generate business reports
        </Text>
      </Pressable>
</View>
      {/* =================================================
          LOW STOCK
      ================================================= */}

      <Animated.View
        entering={FadeInDown.delay(500).duration(500)}
        className="mt-8 px-6"
      >
        <View className="mb-4 flex-row items-center justify-between">

          <Text className="text-xl font-bold text-slate-950 dark:text-white">
            Low Stock
          </Text>

          <Text className="text-sm font-semibold text-slate-400">
            {stats.lowStock.length} items
          </Text>

        </View>

        {stats.lowStock.length === 0 ? (

          <View className="rounded-3xl bg-white p-5 dark:bg-slate-900">
            <Text className="text-center text-sm text-slate-400 dark:text-slate-400">
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
              className="mb-3 rounded-3xl bg-white p-5 active:opacity-70 dark:bg-slate-900"
            >

              <View className="flex-row items-center">

                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                  <Package
                    size={19}
                    color="#dc2626"
                  />
                </View>

                <View className="ml-4 flex-1">

                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {product.name}
                  </Text>

                  <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
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

