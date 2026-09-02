import {
  deleteProduct,
  getProductImages,
  updateProduct,
  type Product,
  type ProductImage,
} from "@/lib/products";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import AppAlert from "@/components/ui/AppAlert";


export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =  Dimensions.get("window");
  const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.4;
  const COLLAPSED_IMAGE_HEIGHT = IMAGE_HEIGHT * 0.7;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const scrollY = useSharedValue(0);

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = Math.max(
      0,
      event.contentOffset.y
    );
  },
});

const heroAnimatedStyle = useAnimatedStyle(() => {
  const height = interpolate(
    scrollY.value,
    [0, IMAGE_HEIGHT * 0.5],
    [IMAGE_HEIGHT, COLLAPSED_IMAGE_HEIGHT],
    Extrapolation.CLAMP
  );

  return {
    height,
  };
});

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("pcs");

  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  const [isActive, setIsActive] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("success");
  const [alertAction, setAlertAction] = useState<"close" | "back" | "delete-confirm" >("close");
  const [alertButtonText, setAlertButtonText] = useState("Done");
  const [alertCancelText, setAlertCancelText] = useState("Cancel");

  const [alertConfirmAction, setAlertConfirmAction] = useState<(() => void) | undefined>();

function showAlert(
  title: string,
  message: string,
  type: "success" | "error" | "warning" = "success",
  buttonText = "Done",
  onConfirm?: () => void,
  cancelText = "Cancel"
) {
  setAlertTitle(title);
  setAlertMessage(message);
  setAlertType(type);
  setAlertButtonText(buttonText);
  setAlertCancelText(cancelText);
  setAlertConfirmAction(() => onConfirm);
  setAlertVisible(true);
}

   function handleAlertClose() {
      setAlertVisible(false);

      if (alertAction === "back") {
        router.back();
      }

      if (alertAction === "delete-confirm") {
        confirmDelete();
      }
    }

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);

      if (!id) {
        throw new Error("Product ID is missing");
      }

      // getProducts needs a business ID, so instead we fetch
      // the product directly by its ID.
      const { supabase } = await import("@/lib/supabase");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Product not found");
      }

      const loadedProduct = data as Product;

      setProduct(loadedProduct);

      const images = await getProductImages(loadedProduct.id);

      setProductImages(images);
      setActiveImageIndex(0);

      setName(loadedProduct.name ?? "");
      setSku(loadedProduct.sku ?? "");
      setDescription(loadedProduct.description ?? "");
      setUnit(loadedProduct.unit ?? "pcs");

      setCostPrice(String(loadedProduct.cost_price ?? 0));
      setSalePrice(String(loadedProduct.sale_price ?? 0));
      setStockQty(String(loadedProduct.stock_qty ?? 0));
      setLowStockThreshold(
        String(loadedProduct.low_stock_threshold ?? 5)
      );

      setIsActive(loadedProduct.is_active);
    } catch (error: any) {
      console.error("LOAD PRODUCT ERROR:", error);

      showAlert(
        "Unable to load product",
        error?.message || "Something went wrong.",
        "error",
        "back"
      );
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  async function handleSave() {
    if (!product) {
      return;
    }

    if (!name.trim()) {
      showAlert(
        "Product name required",
        "Enter the product name.",
        "warning"
      );
    }

    const cost = Number(costPrice);
    const sale = Number(salePrice);
    const stock = Number(stockQty);
    const threshold = Number(lowStockThreshold);

    if (Number.isNaN(cost) || cost < 0) {
      showAlert(
  "Invalid cost price",
  "Enter a valid cost price.",
  "warning"
);
    }

    if (Number.isNaN(sale) || sale < 0) {
      showAlert(
  "Invalid selling price",
  "Enter a valid selling price.",
  "warning"
);
    }

    if (Number.isNaN(stock) || stock < 0) {
      showAlert(
  "Invalid stock",
  "Enter a valid stock quantity.",
  "warning"
);
    }

    if (Number.isNaN(threshold) || threshold < 0) {
      showAlert(
  "Invalid threshold",
  "Enter a valid low-stock threshold.",
  "warning"
);
    }

    try {
      setSaving(true);

      await updateProduct(product.id, {
        name: name.trim(),
        sku: sku.trim() || null,
        description: description.trim() || null,
        unit: unit.trim() || "pcs",
        cost_price: cost,
        sale_price: sale,
        stock_qty: stock,
        low_stock_threshold: threshold,
        is_active: isActive,
      });

        showAlert(
      "Product updated",
      `${name.trim()} has been updated successfully.`,
      "success",
      "Done",
      () => router.back()
    );
    } catch (error: any) {
      console.error("UPDATE PRODUCT ERROR:", error);

          showAlert(
        "Unable to update product",
        error?.message ||
          "Something went wrong while updating the product.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

function handleDelete() {
  if (!product) {
    return;
  }

  showAlert(
    "Delete product?",
    `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
    "warning",
    "Delete",
    confirmDelete,
    "Cancel"
  );
}

async function confirmDelete() {
  if (!product) {
    return;
  }

  try {
    setSaving(true);

    await deleteProduct(product.id);

    showAlert(
      "Product deleted",
      "The product has been removed from your inventory.",
      "success",
      "back"
    );
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);

    showAlert(
      "Unable to delete product",
      error?.message ||
        "Something went wrong while deleting the product.",
      "error"
    );
  } finally {
    setSaving(false);
  }
}

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator
          size="large"
          color="#0f172a"
        />

        <Text className="mt-4 text-sm text-slate-400">
          Loading product...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Ionicons
          name="cube-outline"
          size={50}
          color="#94a3b8"
        />

        <Text className="mt-4 text-xl font-bold text-slate-900">
          Product not found
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 rounded-2xl bg-slate-950 px-6 py-3"
        >
          <Text className="font-semibold text-white">
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stock = Number(stockQty);
  const threshold = Number(lowStockThreshold);

  const isLowStock =
    stock <= threshold;


return (
  <KeyboardAvoidingView
    className="flex-1 bg-slate-50"
    behavior={
      Platform.OS === "ios"
        ? "padding"
        : undefined
    }
  >
    {/* =====================================================
        FIXED COLLAPSING HERO
    ===================================================== */}

    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          elevation: 20,
          width: SCREEN_WIDTH,
          overflow: "hidden",
          backgroundColor: "#e2e8f0",
        },
        heroAnimatedStyle,
      ]}
    >
      {productImages.length > 0 ? (
        <FlatList
          data={productImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <View
              style={{
                width: SCREEN_WIDTH,
                height: IMAGE_HEIGHT,
              }}
            >
              <Image
                source={{ uri: item.image_url }}
                style={{
                  width: SCREEN_WIDTH,
                  height: IMAGE_HEIGHT,
                }}
                resizeMode="cover"
              />
            </View>
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x /
                SCREEN_WIDTH
            );

            setActiveImageIndex(index);
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-slate-200">
          <Ionicons
            name="images-outline"
            size={48}
            color="#94a3b8"
          />

          <Text className="mt-3 text-sm font-medium text-slate-500">
            No product images
          </Text>
        </View>
      )}

      {/* DARK OVERLAY */}

      <View className="absolute bottom-0 left-0 right-0 h-28 bg-black/20" />

      {/* =================================================
          FIXED BACK BUTTON
      ================================================= */}

      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        className="absolute left-5 top-14 h-11 w-11 items-center justify-center rounded-2xl bg-white/90"
      >
        <Ionicons
          name="arrow-back"
          size={22}
          color="#0f172a"
        />
      </TouchableOpacity>

      {/* =================================================
          FIXED ACTIVE STATUS
      ================================================= */}

      <View className="absolute right-5 top-14">
        <View
          className={`rounded-full px-3 py-2 ${
            product.is_active
              ? "bg-green-50/95"
              : "bg-white/90"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              product.is_active
                ? "text-green-600"
                : "text-slate-500"
            }`}
          >
            {product.is_active
              ? "ACTIVE"
              : "INACTIVE"}
          </Text>
        </View>
      </View>

      {/* IMAGE COUNTER */}

      {productImages.length > 1 && (
        <View className="absolute bottom-5 right-5 rounded-full bg-black/60 px-3 py-2">
          <Text className="text-xs font-bold text-white">
            {activeImageIndex + 1} /{" "}
            {productImages.length}
          </Text>
        </View>
      )}

      {/* PAGINATION */}

      {productImages.length > 1 && (
        <View className="absolute bottom-5 left-0 right-0 flex-row items-center justify-center">
          {productImages.map((_, index) => (
            <View
              key={index}
              className={`mx-1 h-2 rounded-full ${
                index === activeImageIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/60"
              }`}
            />
          ))}
        </View>
      )}
    </Animated.View>

    {/* =====================================================
        SCROLLING CONTENT
    ===================================================== */}

    <Animated.ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingTop: IMAGE_HEIGHT,
        paddingBottom: 50,
      }}
    >
      {/* PRODUCT TITLE */}

      <View className="px-5 pt-5">
        <Text className="text-2xl font-bold text-slate-950">
          {product.name}
        </Text>

        <Text className="mt-1 text-sm text-slate-400">
          {product.sku
            ? `SKU: ${product.sku}`
            : "No SKU"}
        </Text>

        {isLowStock && (
          <View className="mt-4 flex-row items-center rounded-2xl bg-orange-50 px-4 py-3">
            <Ionicons
              name="warning-outline"
              size={18}
              color="#f97316"
            />

            <Text className="ml-2 text-sm font-semibold text-orange-600">
              This product is low on stock
            </Text>
          </View>
        )}
      </View>

      {/* BASIC INFORMATION */}

      <View className="mx-5 mt-5 rounded-3xl bg-white p-5">
        <Text className="mb-5 text-lg font-bold text-slate-900">
          Product information
        </Text>

        <Field
          label="Product name"
          value={name}
          onChangeText={setName}
          placeholder="Product name"
        />

        <Field
          label="SKU"
          value={sku}
          onChangeText={setSku}
          placeholder="e.g. CC-500"
          autoCapitalize="characters"
        />

        <Field
          label="Unit"
          value={unit}
          onChangeText={setUnit}
          placeholder="e.g. pcs, kg, box"
        />

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-slate-700">
            Description
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Product description"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="min-h-[110px] rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900"
          />
        </View>
      </View>

      {/* PRICING */}

      <View className="mx-5 mt-5 rounded-3xl bg-white p-5">
        <Text className="mb-5 text-lg font-bold text-slate-900">
          Pricing
        </Text>

        <Field
          label="Cost price"
          value={costPrice}
          onChangeText={setCostPrice}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <Field
          label="Selling price"
          value={salePrice}
          onChangeText={setSalePrice}
          placeholder="0"
          keyboardType="decimal-pad"
        />
      </View>

      {/* INVENTORY */}

      <View className="mx-5 mt-5 rounded-3xl bg-white p-5">
        <Text className="mb-5 text-lg font-bold text-slate-900">
          Inventory
        </Text>

        <Field
          label="Stock quantity"
          value={stockQty}
          onChangeText={setStockQty}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <Field
          label="Low-stock threshold"
          value={lowStockThreshold}
          onChangeText={setLowStockThreshold}
          placeholder="5"
          keyboardType="decimal-pad"
        />

        <View className="mt-2 flex-row items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900">
              Product active
            </Text>

            <Text className="mt-1 text-xs text-slate-400">
              Active products can be used in your inventory
            </Text>
          </View>

          <Switch
            value={isActive}
            onValueChange={setIsActive}
          />
        </View>
      </View>

      {/* SAVE / DELETE */}

      <View className="mx-5 mt-5">
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
          className={`mb-3 items-center rounded-2xl py-4 ${
            saving
              ? "bg-slate-400"
              : "bg-slate-950"
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#ffffff"
              />

              <Text className="ml-2 text-base font-bold text-white">
                Save Changes
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={saving}
          onPress={handleDelete}
          className="items-center rounded-2xl bg-red-50 py-4"
        >
          <View className="flex-row items-center">
            <Ionicons
              name="trash-outline"
              size={20}
              color="#dc2626"
            />

            <Text className="ml-2 text-base font-bold text-red-600">
              Delete Product
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.ScrollView>

    <AppAlert
      visible={alertVisible}
      title={alertTitle}
      message={alertMessage}
      type={alertType}
      buttonText={alertButtonText}
      cancelText={alertCancelText}
      onClose={() => setAlertVisible(false)}
      onConfirm={
        alertConfirmAction
          ? () => {
              setAlertVisible(false);
              alertConfirmAction();
            }
          : undefined
      }
    />
  </KeyboardAvoidingView>
);


}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-slate-700">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900"
      />
    </View>
  );
}

function confirmDelete() {
  throw new Error("Function not implemented.");
}
