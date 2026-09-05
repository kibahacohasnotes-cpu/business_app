import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  ShoppingCart,
  TrendingDown,
  TrendingUp
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import OfflineBanner from "@/components/ui/OfflineBanner";
import {
  getCachedPerformance,
  savePerformanceCache,
  isPerformanceCacheFresh,
} from "@/lib/performanceCache";
import NetInfo from "@react-native-community/netinfo";
import { useTheme } from "@/context/ThemeContext";
import { getMyBusiness } from "@/lib/business";
import {
  getBusinessPerformance,
  getBusinessPerformanceSummary,
  type BusinessPerformancePoint,
  type BusinessPerformanceSummary,
} from "@/lib/dashboard";
import { supabase } from "@/lib/supabase";
import {
  getCachedBusiness,
  saveBusinessCache,
} from "@/lib/businessCache";
type Period = "7D" | "30D" | "3M" | "6M" | "1Y";

const PERIODS: Period[] = ["7D", "30D", "3M", "6M", "1Y"];

const CHART_WIDTH = Dimensions.get("window").width - 48;
const CHART_HEIGHT = 230;

function formatMoney(value: number, currency: string) {
  return `${currency} ${new Intl.NumberFormat("en-TZ").format(
    Math.round(value)
  )}/=`;
}

function getStartDate(period: Period) {
  const date = new Date();

  switch (period) {
    case "7D":
      date.setDate(date.getDate() - 6);
      break;

    case "30D":
      date.setDate(date.getDate() - 29);
      break;

    case "3M":
      date.setMonth(date.getMonth() - 3);
      date.setDate(date.getDate() + 1);
      break;

    case "6M":
      date.setMonth(date.getMonth() - 6);
      date.setDate(date.getDate() + 1);
      break;

    case "1Y":
      date.setFullYear(date.getFullYear() - 1);
      date.setDate(date.getDate() + 1);
      break;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatChartDate(date: string, period: Period) {
  if (period === "3M" || period === "6M" || period === "1Y") {
    const [year, month] = date.split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "short",
      year: period === "1Y" ? "numeric" : undefined,
    });
  }

  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function RevenueChart({
  data,
  period,
  currency,
  isDark,
}: {
  data: BusinessPerformancePoint[];
  period: Period;
  currency: string;
  isDark: boolean;
}) {
  if (data.length === 0) {
    return (
      <View className="h-[230px] items-center justify-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <TrendingUp size={25} color={isDark ? "#64748b" : "#94a3b8"} />
        </View>

        <Text className="mt-4 text-base font-bold text-slate-700 dark:text-slate-300">
          No revenue data yet
        </Text>

        <Text className="mt-1 text-center text-sm text-slate-400 dark:text-slate-500">
          Complete your first sale to see your revenue trend.
        </Text>
      </View>
    );
  }

  const chartData = aggregateChartData(data, period);

  const maxRevenue = Math.max(
    ...chartData.map((point) => point.revenue),
    1
  );

  const paddingLeft = 48;
  const paddingRight = 12;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = CHART_WIDTH - paddingLeft - paddingRight;
  const chartHeight = CHART_HEIGHT - paddingTop - paddingBottom;

  const points = chartData.map((point, index) => {
    const x =
      chartData.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (index / (chartData.length - 1)) * chartWidth;

    const y =
      paddingTop + chartHeight - (point.revenue / maxRevenue) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  const labelIndexes =
    chartData.length <= 7
      ? chartData.map((_, index) => index)
      : [0, Math.floor(chartData.length / 2), chartData.length - 1];

  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const lineColor = isDark ? "#f8fafc" : "#0f172a";
  const textColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Horizontal guide lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((value) => {
          const y = paddingTop + chartHeight - value * chartHeight;

          return (
            <Line
              key={value}
              x1={paddingLeft}
              x2={CHART_WIDTH - paddingRight}
              y1={y}
              y2={y}
              stroke={gridColor}
              strokeWidth="1"
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((value) => {
          const y = paddingTop + chartHeight - value * chartHeight;

          return (
            <SvgText key={value} x={4} y={y + 4} fontSize="9" fill={textColor}>
              {value === 0
                ? "0"
                : value === 1
                ? `${currency} ${Math.round(maxRevenue / 1000)}K`
                : `${currency} ${Math.round((maxRevenue * value) / 1000)}K`}
            </SvgText>
          );
        })}

        {/* Revenue line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point) => (
          <Circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={lineColor}
          />
        ))}

        {/* X-axis labels */}
        {labelIndexes.map((index) => {
          const point = points[index];

          return (
            <SvgText
              key={`${point.label}-${index}`}
              x={point.x}
              y={CHART_HEIGHT - 8}
              fontSize="9"
              fill={textColor}
              textAnchor="middle"
            >
              {formatChartDate(point.label, period)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function aggregateChartData(
  data: BusinessPerformancePoint[],
  period: Period
): BusinessPerformancePoint[] {
  if (period === "7D" || period === "30D") {
    return data;
  }

  const months = new Map<string, BusinessPerformancePoint>();

  for (const point of data) {
    const month = point.label.slice(0, 7);

    const existing = months.get(month);

    if (existing) {
      existing.revenue += point.revenue;
      existing.expenses += point.expenses;
      existing.profit += point.profit;
      existing.sales += point.sales;
    } else {
      months.set(month, {
        label: month,
        revenue: point.revenue,
        expenses: point.expenses,
        profit: point.profit,
        sales: point.sales,
      });
    }
  }

  return Array.from(months.values());
}

function PerformanceBarChart({
  data,
  period,
  currency,
  isDark,
}: {
  data: BusinessPerformancePoint[];
  period: Period;
  currency: string;
  isDark: boolean;
}) {
  if (data.length === 0) {
    return null;
  }

  const aggregatedData = aggregateChartData(data, period);

  const chartData =
    aggregatedData.length > 14
      ? aggregatedData.filter(
          (_, index) =>
            index % Math.ceil(aggregatedData.length / 12) === 0 ||
            index === aggregatedData.length - 1
        )
      : aggregatedData;

  const maxValue = Math.max(
    ...chartData.flatMap((point) => [point.revenue, point.expenses]),
    1
  );

  const paddingLeft = 42;
  const paddingRight = 12;
  const paddingTop = 20;
  const paddingBottom = 42;

  const chartWidth = CHART_WIDTH - paddingLeft - paddingRight;
  const chartHeight = CHART_HEIGHT - paddingTop - paddingBottom;

  const groupWidth = chartWidth / Math.max(chartData.length, 1);
  const barWidth = Math.min(groupWidth * 0.28, 14);

  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const revenueBarColor = isDark ? "#f8fafc" : "#0f172a";
  const expenseBarColor = isDark ? "#64748b" : "#94a3b8";
  const textColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Guide lines */}
        {[0, 0.5, 1].map((value) => {
          const y = paddingTop + chartHeight - value * chartHeight;

          return (
            <Line
              key={value}
              x1={paddingLeft}
              x2={CHART_WIDTH - paddingRight}
              y1={y}
              y2={y}
              stroke={gridColor}
              strokeWidth="1"
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((value) => {
          const y = paddingTop + chartHeight - value * chartHeight;

          return (
            <SvgText key={value} x={3} y={y + 4} fontSize="9" fill={textColor}>
              {value === 0
                ? "0"
                : `${currency} ${Math.round((maxValue * value) / 1000)}K`}
            </SvgText>
          );
        })}

        {chartData.map((point, index) => {
          const centerX = paddingLeft + groupWidth * index + groupWidth / 2;

          const revenueHeight = (point.revenue / maxValue) * chartHeight;
          const expenseHeight = (point.expenses / maxValue) * chartHeight;

          const revenueX = centerX - barWidth - 2;
          const expenseX = centerX + 2;

          const revenueY = paddingTop + chartHeight - revenueHeight;
          const expenseY = paddingTop + chartHeight - expenseHeight;

          return (
            <React.Fragment key={point.label}>
              {/* Revenue */}
              <Rect
                x={revenueX}
                y={revenueY}
                width={barWidth}
                height={Math.max(revenueHeight, 2)}
                rx={4}
                fill={revenueBarColor}
              />

              {/* Expenses */}
              <Rect
                x={expenseX}
                y={expenseY}
                width={barWidth}
                height={Math.max(expenseHeight, 2)}
                rx={4}
                fill={expenseBarColor}
              />

              {/* Date */}
              {(chartData.length <= 7 ||
                index === 0 ||
                index === chartData.length - 1 ||
                index === Math.floor(chartData.length / 2)) && (
                <SvgText
                  x={centerX}
                  y={CHART_HEIGHT - 10}
                  fontSize="9"
                  fill={textColor}
                  textAnchor="middle"
                >
                  {formatChartDate(point.label, period)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legend */}
      <View className="mt-2 flex-row items-center justify-center">
        <View className="mr-5 flex-row items-center">
          <View className="h-2.5 w-2.5 rounded-full bg-slate-950 dark:bg-slate-100" />

          <Text className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Revenue
          </Text>
        </View>

        <View className="flex-row items-center">
          <View className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />

          <Text className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Expenses
          </Text>
        </View>
      </View>
    </View>
  );
}

function ProfitChart({
  data,
  period,
  currency,
  isDark,
}: {
  data: BusinessPerformancePoint[];
  period: Period;
  currency: string;
  isDark: boolean;
}) {
  if (data.length === 0) {
    return null;
  }

  const chartData = aggregateChartData(data, period);

  const maxAbsProfit = Math.max(
    ...chartData.map((point) => Math.abs(point.profit)),
    1
  );

  const paddingLeft = 48;
  const paddingRight = 12;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = CHART_WIDTH - paddingLeft - paddingRight;
  const chartHeight = CHART_HEIGHT - paddingTop - paddingBottom;

  const centerY = paddingTop + chartHeight / 2;

  const points = chartData.map((point, index) => {
    const x =
      chartData.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (index / (data.length - 1)) * chartWidth;

    const y = centerY - (point.profit / maxAbsProfit) * (chartHeight / 2);

    return {
      ...point,
      x,
      y,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  const labelIndexes =
    chartData.length <= 7
      ? chartData.map((_, index) => index)
      : [0, Math.floor(chartData.length / 2), chartData.length - 1];

  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const centerLineColor = isDark ? "#475569" : "#cbd5e1";
  const textColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines */}
        <Line
          x1={paddingLeft}
          x2={CHART_WIDTH - paddingRight}
          y1={paddingTop}
          y2={paddingTop}
          stroke={gridColor}
          strokeWidth="1"
        />

        <Line
          x1={paddingLeft}
          x2={CHART_WIDTH - paddingRight}
          y1={centerY}
          y2={centerY}
          stroke={centerLineColor}
          strokeWidth="1"
        />

        <Line
          x1={paddingLeft}
          x2={CHART_WIDTH - paddingRight}
          y1={paddingTop + chartHeight}
          y2={paddingTop + chartHeight}
          stroke={gridColor}
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        <SvgText x={3} y={paddingTop + 4} fontSize="9" fill={textColor}>
          {currency} {Math.round(maxAbsProfit / 1000)}K
        </SvgText>

        <SvgText x={12} y={centerY + 4} fontSize="9" fill={textColor}>
          0
        </SvgText>

        <SvgText
          x={3}
          y={paddingTop + chartHeight + 4}
          fontSize="9"
          fill={textColor}
        >
          -{currency} {Math.round(maxAbsProfit / 1000)}K
        </SvgText>

        {/* Profit line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point) => (
          <Circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#16a34a"
          />
        ))}

        {/* X-axis labels */}
        {labelIndexes.map((index) => {
          const point = points[index];

          return (
            <SvgText
              key={`${point.label}-${index}`}
              x={point.x}
              y={CHART_HEIGHT - 8}
              fontSize="9"
              fill={textColor}
              textAnchor="middle"
            >
              {formatChartDate(point.label, period)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function getPreviousPeriodDates(period: Period) {
  const currentStart = new Date(`${getStartDate(period)}T00:00:00`);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const previousStart = new Date(currentStart);

  switch (period) {
    case "7D":
      previousStart.setDate(previousStart.getDate() - 7);
      break;

    case "30D":
      previousStart.setDate(previousStart.getDate() - 30);
      break;

    case "3M":
      previousStart.setMonth(previousStart.getMonth() - 3);
      break;

    case "6M":
      previousStart.setMonth(previousStart.getMonth() - 6);
      break;

    case "1Y":
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      break;
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(previousStart),
    endDate: formatDate(previousEnd),
  };
}

function calculateGrowth(current: number, previous: number) {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function formatCacheTime(cachedAt: string): string {
  const timestamp = new Date(cachedAt).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const seconds = Math.floor(
    (Date.now() - timestamp) / 1000
  );

  if (seconds < 10) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}



export default function BusinessProgress() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [cacheInfo, setCacheInfo] = useState<{
    cachedAt: string;
    isFresh: boolean;
  } | null>(null);

  const [period, setPeriod] = useState<Period>("30D");
  const [currency, setCurrency] = useState("TZS");
  const [data, setData] = useState<BusinessPerformancePoint[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [previousSummary, setPreviousSummary] =
    useState<BusinessPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setIsOffline(!(state.isConnected ?? false));
  });

  return unsubscribe;
}, []);

const loadPerformance = useCallback(async () => {
  try {
    // Get the locally stored auth session.
    // This does not require a network request.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;

    if (!userId) {
      router.replace("/login");
      return;
    }

    // Try the locally cached business first.
let business = await getCachedBusiness(userId);

if (!business) {
  const freshBusiness = await getMyBusiness();

  if (!freshBusiness) {
    router.replace("/business");
    return;
  }

  await saveBusinessCache(userId, {
    id: freshBusiness.id,
    name: freshBusiness.name,
    currency: freshBusiness.currency || "TZS",
  });

  business = {
    id: freshBusiness.id,
    name: freshBusiness.name,
    currency: freshBusiness.currency || "TZS",
    cachedAt: new Date().toISOString(),
  };
}

setCurrency(business.currency || "TZS");

    const startDate = getStartDate(period);
    const endDate = getToday();
    const previousPeriod = getPreviousPeriodDates(period);

    // 1. Load cached data first
    const cached = await getCachedPerformance(
      business.id,
      period
    );

    if (cached) {
      const fresh = isPerformanceCacheFresh(
        cached.cachedAt
      );

      setData(cached.performance);
      setPreviousSummary(cached.previous);

      setCacheInfo({
        cachedAt: cached.cachedAt,
        isFresh: fresh,
      });

      setLoading(false);

      console.log(
        `Performance cache loaded: ${period}`,
        fresh ? "(fresh)" : "(stale)"
      );

      // Fresh cache is good enough.
      // Do not hit Supabase again.
      if (fresh) {
        return;
      }
    } else {
      setLoading(true);
    }

    // 2. Fetch fresh data from Supabase
    try {
      const [performance, previous] = await Promise.all([
        getBusinessPerformance(
          business.id,
          startDate,
          endDate
        ),
        getBusinessPerformanceSummary(
          business.id,
          previousPeriod.startDate,
          previousPeriod.endDate
        ),
      ]);

      // 3. Update UI with fresh data
      setData(performance);
      setPreviousSummary(previous);

      setCacheInfo({
        cachedAt: new Date().toISOString(),
        isFresh: true,
      });

      // 4. Save fresh data to local cache
      await savePerformanceCache(
        business.id,
        period,
        performance,
        previous
      );
      } catch (refreshError) {
        console.log(
          "PERFORMANCE REFRESH SKIPPED:",
          cached
            ? "Using cached data"
            : "No cached data available"
        );

        // If cached data exists, keep showing it.
        // This is expected when the device is offline.
        if (!cached) {
          throw refreshError;
        }
      }
  } catch (error) {
    console.error(
      "BUSINESS PERFORMANCE ERROR:",
      error
    );
  } finally {
    setLoading(false);
  }
}, [period, router]);

  useFocusEffect(
    useCallback(() => {
      loadPerformance();
    }, [loadPerformance])
  );

const refresh = useCallback(async () => {
  try {
    setRefreshing(true);

    const business = await getMyBusiness();

    if (!business) {
      router.replace("/business");
      return;
    }

    const startDate = getStartDate(period);
    const endDate = getToday();
    const previousPeriod = getPreviousPeriodDates(period);

    // Force fresh data from Supabase
    const [performance, previous] = await Promise.all([
      getBusinessPerformance(
        business.id,
        startDate,
        endDate
      ),
      getBusinessPerformanceSummary(
        business.id,
        previousPeriod.startDate,
        previousPeriod.endDate
      ),
    ]);

    // Update UI
    setData(performance);
    setPreviousSummary(previous);

    // Replace cache with fresh data
    await savePerformanceCache(
      business.id,
      period,
      performance,
      previous
    );

    console.log(
      `Performance manually refreshed: ${period}`
    );
  } catch (error) {
    console.error(
      "BUSINESS PERFORMANCE REFRESH ERROR:",
      error
    );
  } finally {
    setRefreshing(false);
  }
}, [period, router]);

  const summary = useMemo(() => {
    const revenue = data.reduce((total, point) => total + point.revenue, 0);
    const expenses = data.reduce((total, point) => total + point.expenses, 0);
    const sales = data.reduce((total, point) => total + point.sales, 0);

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      sales,
    };
  }, [data]);

  const profitIsPositive = summary.profit >= 0;

  const revenueGrowth = calculateGrowth(
    summary.revenue,
    previousSummary?.revenue ?? 0
  );

  const profitGrowth = calculateGrowth(
    summary.profit,
    previousSummary?.profit ?? 0
  );

  const salesGrowth = calculateGrowth(
    summary.sales,
    previousSummary?.sales ?? 0
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* HEADER */}
      <View className="bg-slate-50 px-6 pb-5 pt-16 dark:bg-slate-950">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70 dark:bg-slate-900"
          >
            <ArrowLeft size={21} color={isDark ? "#ffffff" : "#0f172a"} />
          </Pressable>

          <View className="ml-4">
            <Text className="text-2xl font-bold text-slate-950 dark:text-white">
              Business Progress
            </Text>

            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track your business performance
            </Text>
          </View>
        </View>
        
      </View>
    <OfflineBanner />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={isDark ? "#ffffff" : "#0f172a"}
            colors={[isDark ? "#ffffff" : "#0f172a"]}
          />
        }
      >
        {/* PERIOD SELECTOR */}
        <View className="mt-2 flex-row px-6">
          {PERIODS.map((item) => {
            const active = period === item;

            return (
              <Pressable
                key={item}
                onPress={() => setPeriod(item)}
                className={`mr-2 rounded-full px-4 py-2.5 ${
                  active
                    ? "bg-slate-950 dark:bg-white"
                    : "bg-white dark:bg-slate-900"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active
                      ? "text-white dark:text-slate-950"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {cacheInfo && (
          <View className="mb-3 flex-row items-center justify-end px-1">
            <View
              className={`mr-2 h-2 w-2 rounded-full ${
                isOffline
                  ? "bg-amber-500"
                  : cacheInfo.isFresh
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />

            <Text
              className={`text-xs ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {isOffline
                ? `Offline · Showing saved data · ${formatCacheTime(
                    cacheInfo.cachedAt
                  )}`
                : `Updated ${formatCacheTime(
                    cacheInfo.cachedAt
                  )}`}
            </Text>
          </View>
        )}

        {loading ? (
          <View className="h-[500px] items-center justify-center">
            <ActivityIndicator
              size="large"
              color={isDark ? "#ffffff" : "#0f172a"}
            />

            <Text className="mt-4 text-sm text-slate-400 dark:text-slate-500">
              Loading business performance...
            </Text>
          </View>
        ) : (
          <>
            {/* SUMMARY */}
            <View className="mt-5 px-6">
              <View className="rounded-[28px] bg-slate-950 p-6 dark:bg-slate-900 dark:border dark:border-slate-800">
                <Text className="text-sm font-medium text-slate-400 dark:text-slate-400">
                  Revenue
                </Text>

                <Text className="mt-2 text-3xl font-bold text-white">
                  {formatMoney(summary.revenue, currency)}
                </Text>

                <View className="mt-3 flex-row items-center">
                  {revenueGrowth === null ? (
                    <TrendingUp size={15} color="#86efac" />
                  ) : revenueGrowth >= 0 ? (
                    <TrendingUp size={15} color="#86efac" />
                  ) : (
                    <TrendingDown size={15} color="#fca5a5" />
                  )}

                  <Text
                    className={`ml-1.5 text-xs font-bold ${
                      revenueGrowth === null
                        ? "text-green-300"
                        : revenueGrowth >= 0
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {revenueGrowth === null
                      ? "New activity"
                      : `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(
                          1
                        )}%`}
                  </Text>

                  <Text className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                    vs previous period
                  </Text>
                </View>

                <View className="mt-5 flex-row items-center">
                  {profitIsPositive ? (
                    <TrendingUp size={17} color="#86efac" />
                  ) : (
                    <TrendingDown size={17} color="#fca5a5" />
                  )}

                  <Text className="ml-2 text-sm font-semibold text-slate-300">
                    {profitIsPositive
                      ? "Positive business performance"
                      : "Expenses are above revenue"}
                  </Text>
                </View>
              </View>
            </View>

            {/* FINANCIAL SUMMARY */}
            <View className="mt-4 flex-row gap-3 px-6">
              <View className="flex-1 rounded-3xl bg-white p-5 dark:bg-slate-900">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/40">
                  <TrendingUp size={19} color={isDark ? "#4ade80" : "#16a34a"} />
                </View>

                <Text className="mt-4 text-xs text-slate-400 dark:text-slate-400">
                  Profit
                </Text>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className={`mt-1 text-lg font-bold ${
                    profitIsPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatMoney(summary.profit, currency)}
                </Text>
                <View className="mt-2 flex-row items-center">
                  {profitGrowth === null || profitGrowth >= 0 ? (
                    <TrendingUp size={13} color={isDark ? "#4ade80" : "#16a34a"} />
                  ) : (
                    <TrendingDown size={13} color={isDark ? "#f87171" : "#dc2626"} />
                  )}
                  <Text
                    className={`ml-1 text-xs font-bold ${
                      profitGrowth === null || profitGrowth >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {profitGrowth === null
                      ? "New activity"
                      : `${profitGrowth >= 0 ? "+" : ""}${profitGrowth.toFixed(
                          1
                        )}%`}
                  </Text>

                  <Text className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                    vs previous
                  </Text>
                </View>
              </View>

              <View className="flex-1 rounded-3xl bg-white p-5 dark:bg-slate-900">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
                  <TrendingDown size={19} color={isDark ? "#f87171" : "#dc2626"} />
                </View>

                <Text className="mt-4 text-xs text-slate-400 dark:text-slate-400">
                  Expenses
                </Text>

                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className="mt-1 text-lg font-bold text-slate-950 dark:text-white"
                >
                  {formatMoney(summary.expenses, currency)}
                </Text>
              </View>
            </View>

            {/* SALES */}
            <View className="mx-6 mt-3 rounded-3xl bg-white p-5 dark:bg-slate-900">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <ShoppingCart size={19} color={isDark ? "#ffffff" : "#0f172a"} />
                </View>

                <View className="ml-3">
                  <Text className="text-xs text-slate-400 dark:text-slate-400">
                    Completed sales
                  </Text>

                  <Text className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                    {summary.sales}
                  </Text>
                  <View className="mt-1.5 flex-row items-center">
                    {salesGrowth === null || salesGrowth >= 0 ? (
                      <TrendingUp size={12} color={isDark ? "#4ade80" : "#16a34a"} />
                    ) : (
                      <TrendingDown size={12} color={isDark ? "#f87171" : "#dc2626"} />
                    )}

                    <Text
                      className={`ml-1 text-xs font-bold ${
                        salesGrowth === null || salesGrowth >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {salesGrowth === null
                        ? "New activity"
                        : `${salesGrowth >= 0 ? "+" : ""}${salesGrowth.toFixed(
                            1
                          )}%`}
                    </Text>

                    <Text className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                      vs previous
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* REVENUE CHART */}
            <View className="mx-6 mt-3 rounded-3xl bg-white p-5 dark:bg-slate-900">
              <View className="mb-2">
                <Text className="text-lg font-bold text-slate-950 dark:text-white">
                  Revenue trend
                </Text>

                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                  Completed sales during the selected period
                </Text>
              </View>

              <RevenueChart
                data={data}
                period={period}
                currency={currency}
                isDark={isDark}
              />
            </View>

            {/* REVENUE VS EXPENSES */}
            <View className="mx-6 mt-3 rounded-3xl bg-white p-5 dark:bg-slate-900">
              <View className="mb-2">
                <Text className="text-lg font-bold text-slate-950 dark:text-white">
                  Revenue vs Expenses
                </Text>

                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                  Compare money coming in against money going out
                </Text>
              </View>

              <PerformanceBarChart
                data={data}
                period={period}
                currency={currency}
                isDark={isDark}
              />
            </View>

            {/* PROFIT TREND */}
            <View className="mx-6 mt-3 rounded-3xl bg-white p-5 dark:bg-slate-900">
              <View className="mb-2">
                <Text className="text-lg font-bold text-slate-950 dark:text-white">
                  Profit trend
                </Text>
                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                  See how your profit changes during the selected period
                </Text>
              </View>

              <ProfitChart
                data={data}
                period={period}
                currency={currency}
                isDark={isDark}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}


