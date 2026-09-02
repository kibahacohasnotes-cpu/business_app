import { getMyBusiness } from "@/lib/business";
import { getProducts, type Product } from "@/lib/products";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Package } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function ProductsScreen() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const business = await getMyBusiness();

      if (!business) {
        setProducts([]);
        return;
      }

      const data = await getProducts(business.id);
      setProducts(data);
    } catch (error) {
      console.error("PRODUCTS ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

const filteredProducts = useMemo(() => {
  const query = search.trim().toLowerCase();

  if (!query) {
    return products;
  }

  return products.filter((product) => {
    const name =
      product.name?.toLowerCase() ?? "";

    const sku =
      product.sku?.toLowerCase() ?? "";

    return (
      name.includes(query) ||
      sku.includes(query)
    );
  });
}, [products, search]);


  const lowStockCount = products.filter(
    (product) =>
      product.stock_qty <= product.low_stock_threshold
  ).length;


  function formatPrice(value: number) {
    return new Intl.NumberFormat("en-TZ").format(value);
  }


  function renderProduct({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) {
    const isLowStock =
      item.stock_qty <= item.low_stock_threshold;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className="mb-3 rounded-3xl bg-white p-4 shadow-sm"
        onPress={() =>
          router.push({
            pathname: "/product/[id]",
            params: { id: item.id },
          })
        }
      >
        <View className="flex-row items-center">
  {/* PRODUCT IMAGE */}

  <View className="mr-4 h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
    {item.image_url ? (
      <Image
        source={{ uri: item.image_url }}
        className="h-full w-full"
        resizeMode="cover"
      />
    ) : (
      <View className="h-full w-full items-center justify-center bg-slate-100">
        <Ionicons
          name="image-outline"
          size={24}
          color="#94a3b8"
        />
      </View>
    )}
  </View>

  {/* PRODUCT INFORMATION */}

  <View className="flex-1">
    <Text
      className="text-base font-bold text-slate-900"
      numberOfLines={1}
    >
      {item.name}
    </Text>

    <Text className="mt-1 text-xs text-slate-400">
      {item.sku
        ? `SKU: ${item.sku}`
        : "No SKU"}
    </Text>
  </View>
</View>
        <View className="mt-4 flex-row items-end justify-between">
          <View>
            <Text className="text-xs font-medium text-slate-400">
              STOCK
            </Text>

            <Text
              className={`mt-1 text-base font-bold ${
                isLowStock
                  ? "text-orange-500"
                  : "text-slate-900"
              }`}
            >
              {formatPrice(item.stock_qty)} {item.unit}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-xs font-medium text-slate-400">
              SELLING PRICE
            </Text>

            <Text className="mt-1 text-base font-bold text-slate-900">
              TZS {formatPrice(item.sale_price)}
            </Text>
          </View>
        </View>

        {isLowStock && (
          <View className="mt-3 flex-row items-center rounded-xl bg-orange-50 px-3 py-2">
            <Ionicons
              name="warning-outline"
              size={15}
              color="#f97316"
            />

            <Text className="ml-2 text-xs font-semibold text-orange-600">
              Low stock
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-1 pt-8 bg-slate-50">
      <View className="px-5 pb-4 pt-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
             <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/add-product")}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-950"
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color="white"
            />
          </TouchableOpacity>
            <Text className="text-3xl font-bold text-slate-950">
              Products
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/add-product")}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-950"
          >
            <Ionicons
              name="add"
              size={26}
              color="white"
            />
          </TouchableOpacity>
        </View>

      <View className="mt-5 flex-row items-center rounded-2xl bg-white px-4 py-3">
        <Ionicons
          name="search-outline"
          size={21}
          color="#94a3b8"
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or SKU..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="ml-3 flex-1 text-base text-slate-900"
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            activeOpacity={0.7}
            className="ml-2"
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        )}
      </View>
      </View>

      <View className="px-5">
        <View className="flex-row gap-3">
          <View className="flex-1">
  <View className="rounded-3xl bg-white p-5">
    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
      <Package size={20} color="#0f172a" />
    </View>

    <Text className="mt-5 text-sm text-slate-500">
      Products
    </Text>

    <Text className="mt-1 text-2xl font-bold text-slate-950">
      {loading ? "..." : products.length}
    </Text>
  </View>
</View>

          <View className="flex-1 rounded-3xl bg-orange-50 p-4">
            <Text className="text-xs font-semibold text-orange-500">
              LOW STOCK
            </Text>

            <Text className="mt-2 text-2xl font-bold text-orange-600">
              {lowStockCount}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-6 flex-1">
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 120,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadProducts();
              }}
            />
          }
          ListHeaderComponent={
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900">
                {search.trim()
                  ? "Search results"
                  : "All products"}
              </Text>

              {search.trim() && (
                <Text className="text-sm font-medium text-slate-400">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "result"
                    : "results"}
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <View className="items-center py-16">
                <ActivityIndicator
                  size="large"
                  color="#0f172a"
                />

                <Text className="mt-4 text-sm text-slate-400">
                  Loading products...
                </Text>
              </View>
            ) : (
              <View className="items-center rounded-3xl bg-white px-6 py-12">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Ionicons
                    name="cube-outline"
                    size={30}
                    color="#64748b"
                  />
                </View>

                <Text className="mt-5 text-lg font-bold text-slate-900">
                  {search
                    ? "No products found"
                    : "No products yet"}
                </Text>

                <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
                  {search
                    ? "Try searching for another product."
                    : "Add your first product to start managing your inventory."}
                </Text>

                {!search && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push("/add-product")
                    }
                    className="mt-5 rounded-2xl bg-slate-950 px-6 py-3"
                  >
                    <Text className="font-semibold text-white">
                      Add Product
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </View>
    </View>
  );
}