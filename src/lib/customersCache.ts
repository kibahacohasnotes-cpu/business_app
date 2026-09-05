import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Customer } from "@/lib/customers";

type CachedCustomers = {
  customers: Customer[];
  cachedAt: number;
};

function getCacheKey(businessId: string) {
  return `@business_manager/customers_cache:${businessId}`;
}

export async function getCachedCustomers(
  businessId: string
): Promise<CachedCustomers | null> {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(businessId));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CachedCustomers;
  } catch (error) {
    console.error("CUSTOMERS CACHE READ ERROR:", error);
    return null;
  }
}

export async function saveCustomersCache(
  businessId: string,
  customers: Customer[]
): Promise<void> {
  try {
    const cache: CachedCustomers = {
      customers,
      cachedAt: Date.now(),
    };

    await AsyncStorage.setItem(
      getCacheKey(businessId),
      JSON.stringify(cache)
    );
  } catch (error) {
    console.error("CUSTOMERS CACHE SAVE ERROR:", error);
  }
}

export async function clearCustomersCache(
  businessId: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(getCacheKey(businessId));
  } catch (error) {
    console.error("CUSTOMERS CACHE CLEAR ERROR:", error);
  }
}