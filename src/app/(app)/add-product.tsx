import AppAlert from "@/components/ui/AppAlert";
import { createProduct, uploadProductImages } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.4;
const COLLAPSED_HEIGHT = 100;

const AnimatedFlatList =
  Animated.createAnimatedComponent(FlatList<string>);

export default function AddProductScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("pcs");

  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  function showAlert(
    title: string,
    message: string,
    type: "success" | "error" | "warning"
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  }

  async function pickProductImages() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert(
          "Permission required",
          "Please allow photo access so you can choose product images.",
          "warning"
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          quality: 0.8,
          selectionLimit: 10,
        });

      if (!result.canceled && result.assets.length > 0) {
        const selectedUris = result.assets.map(
          (asset) => asset.uri
        );

        setImageUris((current) => [
          ...current,
          ...selectedUris,
        ]);

        setActiveImageIndex(imageUris.length);
      }
    } catch (error) {
      console.error("IMAGE PICKER ERROR:", error);

      showAlert(
        "Unable to select images",
        "Something went wrong while selecting the images.",
        "error"
      );
    }
  }

  function removeProductImage(index: number) {
    setImageUris((current) =>
      current.filter(
        (_, imageIndex) => imageIndex !== index
      )
    );

    setActiveImageIndex((current) => {
      if (current > 0 && current >= imageUris.length - 1) {
        return current - 1;
      }

      return Math.min(
        current,
        Math.max(imageUris.length - 2, 0)
      );
    });
  }

  function handleSuccessClose() {
    setAlertVisible(false);
    router.back();
  }

  async function handleCreateProduct() {
    const network = await NetInfo.fetch();

    if (!network.isConnected) {
      showAlert(
        "You're offline",
        "You need an internet connection to create and save a product.",
        "warning"
      );
      return;
    }

    if (sku.trim()) {
      const { data: existingProduct, error: skuCheckError } =
        await supabase
          .from("products")
          .select("id")
          .eq("sku", sku.trim())
          .maybeSingle();

      if (skuCheckError) {
        throw skuCheckError;
      }

      if (existingProduct) {
        showAlert(
          "SKU already exists",
          `The SKU "${sku.trim()}" is already being used by another product. Please enter a different SKU.`,
          "warning"
        );
        return;
      }
    }

    if (!name.trim()) {
      showAlert(
        "Product name required",
        "Enter the product name.",
        "warning"
      );
      return;
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
      return;
    }

    if (Number.isNaN(sale) || sale < 0) {
      showAlert(
        "Invalid selling price",
        "Enter a valid selling price.",
        "warning"
      );
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      showAlert(
        "Invalid stock",
        "Enter a valid stock quantity.",
        "warning"
      );
      return;
    }

    if (Number.isNaN(threshold) || threshold < 0) {
      showAlert(
        "Invalid threshold",
        "Enter a valid low-stock threshold.",
        "warning"
      );
      return;
    }

    try {
      setLoading(true);

      const productId = await createProduct({
        name: name.trim(),
        sku: sku.trim() || null,
        category_id: null,
        unit: unit.trim() || "pcs",
        cost_price: cost,
        sale_price: sale,
        stock_qty: stock,
        low_stock_threshold: threshold,
        image_url: null,
        description: null,
        is_active: true,
        category: "",
      });

      if (!productId) {
        throw new Error(
          "Product was created but no product ID was returned."
        );
      }

      if (imageUris.length > 0) {
        await uploadProductImages(productId, imageUris);
      }

      showAlert(
        "Product created",
        `${name.trim()} has been added successfully.`,
        "success"
      );
    } catch (error: any) {
      console.error("CREATE PRODUCT ERROR:", error);

      showAlert(
        "Unable to create product",
        error?.message ||
          "Something went wrong while creating the product.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * COLLAPSING HEADER
   */

  const headerHeight = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - COLLAPSED_HEIGHT],
    outputRange: [IMAGE_HEIGHT, COLLAPSED_HEIGHT],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [
      -(IMAGE_HEIGHT * 0.5),
      0,
      IMAGE_HEIGHT - COLLAPSED_HEIGHT,
    ],
    outputRange: [1.08, 1, 1],
    extrapolate: "clamp",
  });

  const overlayOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - COLLAPSED_HEIGHT],
    outputRange: [0, 0.55],
    extrapolate: "clamp",
  });

  const expandedControlsOpacity =
    scrollY.interpolate({
      inputRange: [0, IMAGE_HEIGHT * 0.55],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

  const collapsedTitleOpacity =
    scrollY.interpolate({
      inputRange: [
        IMAGE_HEIGHT - COLLAPSED_HEIGHT - 30,
        IMAGE_HEIGHT - COLLAPSED_HEIGHT,
      ],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1">
        {/* ================================================= */}
        {/* COLLAPSING STICKY IMAGE HEADER */}
        {/* ================================================= */}

        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: headerHeight,
            zIndex: 20,
            elevation: 20,
            overflow: "hidden",
          }}
        >
          {imageUris.length > 0 ? (
            <Animated.View
              style={{
                flex: 1,
                transform: [{ scale: imageScale }],
              }}
            >
              <FlatList
                data={imageUris}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(uri, index) => `${uri}-${index}`}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setActiveImageIndex(index);
                }}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      width: SCREEN_WIDTH,
                      height: IMAGE_HEIGHT,
                    }}
                  >
                    <Image
                      source={{ uri: item }}
                      style={{
                        width: SCREEN_WIDTH,
                        height: IMAGE_HEIGHT,
                      }}
                      resizeMode="cover"
                    />

                    {/* REMOVE IMAGE */}
                    <Animated.View
                      style={{
                        opacity: expandedControlsOpacity,
                        position: "absolute",
                        right: 20,
                        top: 55,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => removeProductImage(index)}
                        activeOpacity={0.8}
                        className="h-11 w-11 items-center justify-center rounded-full bg-black/60"
                      >
                        <Ionicons
                          name="close"
                          size={23}
                          color="#ffffff"
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                )}
              />
            </Animated.View>
          ) : (
            <TouchableOpacity
              onPress={pickProductImages}
              activeOpacity={0.9}
              className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-900"
            >
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800">
                <Ionicons
                  name="images-outline"
                  size={30}
                  color={isDark ? "#f8fafc" : "#0f172a"}
                />
              </View>

              <Text className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                Add product images
              </Text>

              <Text className="mt-1 text-center text-sm text-slate-400 dark:text-slate-500">
                Select one or more photos
              </Text>
            </TouchableOpacity>
          )}

          {/* DARK OVERLAY */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#000000",
              opacity: overlayOpacity,
            }}
          />

          {/* BACK BUTTON */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            className="absolute left-5 top-14 h-11 w-11 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-900/90"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#ffffff" : "#0f172a"}
            />
          </TouchableOpacity>

          {/* COLLAPSED TITLE */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 75,
              right: 70,
              top: 48,
              opacity: collapsedTitleOpacity,
            }}
          >
            <Text
              numberOfLines={1}
              className="text-lg font-bold text-white"
            >
              {name || "Add Product"}
            </Text>
          </Animated.View>

          {/* IMAGE COUNTER */}
          {imageUris.length > 0 && (
            <Animated.View
              style={{
                position: "absolute",
                right: 20,
                bottom: 18,
                opacity: expandedControlsOpacity,
              }}
              pointerEvents="none"
            >
              <View className="rounded-full bg-black/60 px-3 py-2">
                <Text className="text-xs font-bold text-white">
                  {activeImageIndex + 1} / {imageUris.length}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* PAGINATION */}
          {imageUris.length > 1 && (
            <Animated.View
              style={{
                position: "absolute",
                bottom: 20,
                left: 0,
                right: 0,
                opacity: expandedControlsOpacity,
              }}
              pointerEvents="none"
            >
              <View className="flex-row items-center justify-center">
                {imageUris.map((_, index) => (
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
            </Animated.View>
          )}

          {/* ADD IMAGES BUTTON */}
          <Animated.View
            style={{
              position: "absolute",
              left: 20,
              bottom: 18,
              opacity: expandedControlsOpacity,
            }}
          >
            {imageUris.length > 0 && (
              <TouchableOpacity
                onPress={pickProductImages}
                activeOpacity={0.85}
                className="flex-row items-center rounded-full bg-white/90 px-4 py-3 dark:bg-slate-900/90"
              >
                <Ionicons
                  name="add"
                  size={19}
                  color={isDark ? "#ffffff" : "#0f172a"}
                />

                <Text className="ml-2 text-xs font-bold text-slate-900 dark:text-white">
                  Add images
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>

        {/* ================================================= */}
        {/* SCROLLING CONTENT */}
        {/* ================================================= */}

        <AnimatedFlatList
          data={["0"]}
          keyExtractor={() => "content"}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: IMAGE_HEIGHT,
            paddingHorizontal: 20,
            paddingBottom: 50,
          }}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    y: scrollY,
                  },
                },
              },
            ],
            {
              useNativeDriver: false,
            }
          )}
          renderItem={() => (
            <View>
              {/* HEADER */}
              <View className="mb-8 flex-row items-center pt-6">
                <View>
                  <Text className="text-2xl font-bold text-slate-950 dark:text-white">
                    Add Product
                  </Text>

                  <Text className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    Add a product to your inventory
                  </Text>
                </View>
              </View>

              {/* BASIC INFORMATION */}
              <View className="mb-5 rounded-3xl bg-white p-5 dark:bg-slate-900 dark:border dark:border-slate-800">
                <View className="mb-5 flex-row items-center">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Ionicons
                      name="cube-outline"
                      size={21}
                      color={isDark ? "#f8fafc" : "#0f172a"}
                    />
                  </View>

                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    Product information
                  </Text>
                </View>

                <Field
                  label="Product name"
                  placeholder="e.g. Coca Cola 500ml"
                  value={name}
                  onChangeText={setName}
                />

                <View className="mb-4">
                  <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    SKU (Stock Keeping Unit)
                  </Text>

                  <View className="flex-row gap-2">
                    <TextInput
                      value={sku}
                      onChangeText={setSku}
                      placeholder="e.g. CC-500"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="characters"
                      className="flex-1 rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900 dark:bg-slate-800/60 dark:text-white"
                    />

                    <TouchableOpacity
                      onPress={() => router.push("/scanner")}
                      activeOpacity={0.8}
                      className="h-[54px] w-[54px] items-center justify-center rounded-2xl bg-slate-950 dark:bg-slate-800"
                    >
                      <Ionicons
                        name="qr-code-outline"
                        size={23}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push("/scanner")}
                    activeOpacity={0.7}
                    className="mt-2 flex-row items-center"
                  >
                    <Ionicons
                      name="scan-outline"
                      size={16}
                      color="#64748b"
                    />

                    <Text className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Scan QR code or barcode
                    </Text>
                  </TouchableOpacity>
                </View>

                <Field
                  label="Category"
                  placeholder="e.g. Drinks"
                  value={category}
                  onChangeText={setCategory}
                />

                <Field
                  label="Unit"
                  placeholder="e.g. pcs, kg, box"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>

              {/* PRICING */}
              <View className="mb-5 rounded-3xl bg-white p-5 dark:bg-slate-900 dark:border dark:border-slate-800">
                <View className="mb-5 flex-row items-center">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Ionicons
                      name="cash-outline"
                      size={21}
                      color={isDark ? "#f8fafc" : "#0f172a"}
                    />
                  </View>

                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    Pricing
                  </Text>
                </View>

                <Field
                  label="Cost price"
                  placeholder="0"
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="decimal-pad"
                />

                <Field
                  label="Selling price"
                  placeholder="0"
                  value={salePrice}
                  onChangeText={setSalePrice}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* INVENTORY */}
              <View className="mb-5 rounded-3xl bg-white p-5 dark:bg-slate-900 dark:border dark:border-slate-800">
                <View className="mb-5 flex-row items-center">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Ionicons
                      name="layers-outline"
                      size={21}
                      color={isDark ? "#f8fafc" : "#0f172a"}
                    />
                  </View>

                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    Inventory
                  </Text>
                </View>

                <Field
                  label="Initial stock"
                  placeholder="0"
                  value={stockQty}
                  onChangeText={setStockQty}
                  keyboardType="decimal-pad"
                />

                <Field
                  label="Low-stock threshold"
                  placeholder="5"
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* CREATE BUTTON */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleCreateProduct}
                className={`items-center rounded-2xl py-4 ${
                  loading
                    ? "bg-slate-400 dark:bg-slate-700"
                    : "bg-slate-950 dark:bg-white"
                }`}
              >
                {loading ? (
                  <ActivityIndicator
                    color={isDark ? "#0f172a" : "#ffffff"}
                  />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={21}
                      color={isDark ? "#0f172a" : "#ffffff"}
                    />

                    <Text className="ml-2 text-base font-bold text-white dark:text-slate-950">
                      Create Product
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        />

        {/* ALERT */}
        <AppAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          buttonText="Done"
          onClose={
            alertType === "success"
              ? handleSuccessClose
              : () => setAlertVisible(false)
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="rounded-2xl bg-slate-50 px-4 py-4 text-base text-slate-900 dark:bg-slate-800/60 dark:text-white"
      />
    </View>
  );
}