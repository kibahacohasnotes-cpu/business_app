import AsyncStorage from "@react-native-async-storage/async-storage";

type CachedBusiness = {
  id: string;
  name: string;
  currency: string;
  cachedAt: string;
};

const CACHE_KEY_PREFIX =
  "@business_manager/business_cache";

function getCacheKey(userId: string) {
  return `${CACHE_KEY_PREFIX}:${userId}`;
}

export async function getCachedBusiness(
  userId: string
): Promise<CachedBusiness | null> {
  try {
    const raw = await AsyncStorage.getItem(
      getCacheKey(userId)
    );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CachedBusiness;
  } catch (error) {
    console.error(
      "BUSINESS CACHE READ ERROR:",
      error
    );

    return null;
  }
}

export async function saveBusinessCache(
  userId: string,
  business: {
    id: string;
    name: string;
    currency: string;
  }
): Promise<void> {
  try {
    const cachedBusiness: CachedBusiness = {
      id: business.id,
      name: business.name,
      currency: business.currency,
      cachedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      getCacheKey(userId),
      JSON.stringify(cachedBusiness)
    );

    console.log("Business cache updated");
  } catch (error) {
    console.error(
      "BUSINESS CACHE WRITE ERROR:",
      error
    );
  }
}