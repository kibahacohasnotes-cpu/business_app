import AsyncStorage from "@react-native-async-storage/async-storage";

const DASHBOARD_CACHE_KEY = "@business_manager/dashboard_cache";

export type DashboardCache = {
  businessName: string;
  currency: string;
  stats: {
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
  cachedAt: string;
};

export async function saveDashboardCache(
  data: Omit<DashboardCache, "cachedAt">
) {
  try {
    const cache: DashboardCache = {
      ...data,
      cachedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify(cache)
    );
  } catch (error) {
    console.error("Dashboard cache save error:", error);
  }
}

export async function getDashboardCache(): Promise<DashboardCache | null> {
  try {
    const stored = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Dashboard cache read error:", error);
    return null;
  }
}