import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Sale } from "@/lib/sales";

type CachedSales = {
  sales: Sale[];
  cachedAt: string;
};

const CACHE_KEY_PREFIX =
  "@business_manager/sales_cache";

function getCacheKey(businessId: string) {
  return `${CACHE_KEY_PREFIX}:${businessId}`;
}

export async function getCachedSales(
  businessId: string
): Promise<CachedSales | null> {
  try {
    const raw = await AsyncStorage.getItem(
      getCacheKey(businessId)
    );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CachedSales;
  } catch (error) {
    console.error(
      "SALES CACHE READ ERROR:",
      error
    );

    return null;
  }
}

export async function saveSalesCache(
  businessId: string,
  sales: Sale[]
): Promise<void> {
  try {
    const cachedSales: CachedSales = {
      sales,
      cachedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      getCacheKey(businessId),
      JSON.stringify(cachedSales)
    );

    console.log("Sales cache updated");
  } catch (error) {
    console.error(
      "SALES CACHE WRITE ERROR:",
      error
    );
  }
}

export async function clearSalesCache(
  businessId: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      getCacheKey(businessId)
    );
  } catch (error) {
    console.error(
      "SALES CACHE CLEAR ERROR:",
      error
    );
  }
}