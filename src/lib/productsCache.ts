import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "@/lib/products";

type CachedProducts = {
  products: Product[];
  cachedAt: number;
};

function getCacheKey(businessId: string) {
  return `@business_manager/products_cache:${businessId}`;
}

export async function getCachedProducts(
  businessId: string
): Promise<CachedProducts | null> {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(businessId));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CachedProducts;
  } catch (error) {
    console.error("PRODUCTS CACHE READ ERROR:", error);
    return null;
  }
}

export async function saveProductsCache(
  businessId: string,
  products: Product[]
): Promise<void> {
  try {
    const cache: CachedProducts = {
      products,
      cachedAt: Date.now(),
    };

    await AsyncStorage.setItem(
      getCacheKey(businessId),
      JSON.stringify(cache)
    );
  } catch (error) {
    console.error("PRODUCTS CACHE SAVE ERROR:", error);
  }
}

export async function clearProductsCache(
  businessId: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(getCacheKey(businessId));
  } catch (error) {
    console.error("PRODUCTS CACHE CLEAR ERROR:", error);
  }
}