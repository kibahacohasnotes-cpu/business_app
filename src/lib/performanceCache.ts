import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  BusinessPerformancePoint,
  BusinessPerformanceSummary,
} from "@/lib/dashboard";

type Period = "7D" | "30D" | "3M" | "6M" | "1Y";

export type CachedPerformance = {
  performance: BusinessPerformancePoint[];
  previous: BusinessPerformanceSummary;
  cachedAt: string;
};

type PerformanceCache = Record<
  Period,
  CachedPerformance | undefined
>;

const CACHE_KEY_PREFIX = "@business_manager/performance_cache";

// Cache is considered fresh for 5 minutes.
export const PERFORMANCE_CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(businessId: string) {
  return `${CACHE_KEY_PREFIX}:${businessId}`;
}

export async function getCachedPerformance(
  businessId: string,
  period: Period
): Promise<CachedPerformance | null> {
  try {
    const raw = await AsyncStorage.getItem(
      getCacheKey(businessId)
    );

    if (!raw) {
      return null;
    }

    const cache = JSON.parse(raw) as PerformanceCache;

    return cache[period] ?? null;
  } catch (error) {
    console.error(
      "PERFORMANCE CACHE READ ERROR:",
      error
    );

    return null;
  }
}

export function isPerformanceCacheFresh(
  cachedAt: string
): boolean {
  const timestamp = new Date(cachedAt).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp < PERFORMANCE_CACHE_TTL;
}

export function getPerformanceCacheAge(
  cachedAt: string
): number {
  const timestamp = new Date(cachedAt).getTime();

  if (Number.isNaN(timestamp)) {
    return Infinity;
  }

  return Math.max(0, Date.now() - timestamp);
}

export async function savePerformanceCache(
  businessId: string,
  period: Period,
  performance: BusinessPerformancePoint[],
  previous: BusinessPerformanceSummary
): Promise<void> {
  try {
    const key = getCacheKey(businessId);

    const raw = await AsyncStorage.getItem(key);

    const existingCache: PerformanceCache = raw
      ? JSON.parse(raw)
      : {};

    existingCache[period] = {
      performance,
      previous,
      cachedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      key,
      JSON.stringify(existingCache)
    );

    console.log(
      `Performance cache updated: ${period}`
    );
  } catch (error) {
    console.error(
      "PERFORMANCE CACHE WRITE ERROR:",
      error
    );
  }
}

export async function clearPerformanceCache(
  businessId: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      getCacheKey(businessId)
    );
  } catch (error) {
    console.error(
      "PERFORMANCE CACHE CLEAR ERROR:",
      error
    );
  }
}