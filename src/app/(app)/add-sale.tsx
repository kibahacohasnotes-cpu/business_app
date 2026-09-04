import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import NetInfo from "@react-native-community/netinfo";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import AppAlert from "@/components/ui/AppAlert";
import { useTheme } from "@/context/ThemeContext";
import { getCustomers, type Customer } from "@/lib/customers";
import { createPayment } from "@/lib/payments";
import { getProducts, type Product } from "@/lib/products";
import { uploadSaleReceipt } from "@/lib/sales";
import { supabase } from "@/lib/supabase";

type CartItem = {
  product: Product;
  quantity: number;
};

type PaymentMethod = "cash" | "mobile" | "card";

function sanitizeNumberInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return sanitized;
}

export default function AddSaleScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  // State Declarations
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [saleDate, setSaleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState("0");

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("success");

  function showAlert(
    title: string,
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  }

  function formatSaleDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  }

  function formatPrice(value: number) {
    return new Intl.NumberFormat("en-TZ").format(value);
  }

  // Data Fetching
  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const { getMyBusiness } = await import("@/lib/business");
      const business = await getMyBusiness();

      if (!business) {
        setProducts([]);
        return;
      }

      const data = await getProducts(business.id);
      setProducts(data);
    } catch (error) {
      console.error("ADD SALE PRODUCTS ERROR:", error);
      showAlert(
        "Unable to load products",
        "Something went wrong while loading your products.",
        "error"
      );
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("GET CUSTOMERS ERROR:", error);
      showAlert(
        "Unable to load customers",
        "Something went wrong while loading customers.",
        "error"
      );
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, [loadProducts, loadCustomers]);

  // Image Picker Logic
  async function pickReceipt() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert(
          "Permission required",
          "Please allow photo access so you can select the receipt.",
          "warning"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("RECEIPT PICKER ERROR:", error);
      showAlert(
        "Unable to select receipt",
        "Something went wrong while selecting the receipt.",
        "error"
      );
    }
  }

  function removeReceipt() {
    setReceiptUri(null);
  }

  // Filter Computations
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const name = product.name?.toLowerCase() ?? "";
      const sku = product.sku?.toLowerCase() ?? "";
      return name.includes(query) || sku.includes(query);
    });
  }, [products, search]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() ?? "";
      const phone = customer.phone?.toLowerCase() ?? "";
      return name.includes(query) || phone.includes(query);
    });
  }, [customers, customerSearch]);

  // Cart Management
  function addProduct(product: Product) {
    if (product.stock_qty <= 0) {
      showAlert("Out of stock", `${product.name} is currently out of stock.`, "warning");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock_qty) {
          showAlert(
            "Stock limit reached",
            `Only ${product.stock_qty} ${product.unit} available.`,
            "warning"
          );
          return current;
        }

        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }

  function increaseQuantity(productId: string) {
    setCart((current) =>
      current.map((item) => {
        if (item.product.id !== productId) return item;

        if (item.quantity >= item.product.stock_qty) {
          showAlert(
            "Stock limit reached",
            `Only ${item.product.stock_qty} ${item.product.unit} available.`,
            "warning"
          );
          return item;
        }

        return { ...item, quantity: item.quantity + 1 };
      })
    );
  }

  function decreaseQuantity(productId: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function getCartQuantity(productId: string) {
    return cart.find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  // Financial Computations
  const subtotal = cart.reduce(
    (total, item) => total + Number(item.product.sale_price) * item.quantity,
    0
  );
  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountAmount);

  // Form Processing
  async function handleCompleteSale() {
    const network = await NetInfo.fetch();

    if (!network.isConnected) {
      showAlert(
        "You're offline",
        "You need an internet connection to complete and save a sale.",
        "warning"
      );
      return;
    }

    if (cart.length === 0) {
      showAlert(
        "No products selected",
        "Add at least one product before completing the sale.",
        "warning"
      );
      return;
    }

    const discountValue = Number(discount);
    if (Number.isNaN(discountValue) || discountValue < 0) {
      showAlert("Invalid discount", "Enter a valid discount amount.", "warning");
      return;
    }

    if (discountValue > subtotal) {
      showAlert(
        "Invalid discount",
        "Discount cannot be greater than the sale subtotal.",
        "warning"
      );
      return;
    }

    const databasePaymentMethod = paymentMethod === "mobile" ? "mobile_money" : paymentMethod;

    try {
      setProcessing(true);

      const items = cart.map((item) => ({
        product_id: item.product.id,
        qty: item.quantity,
      }));

      const { data: saleId, error } = await supabase.rpc("create_sale", {
        p_customer_id: selectedCustomer?.id ?? null,
        p_sale_date: saleDate.toISOString(),
        p_payment_method: databasePaymentMethod,
        p_discount: discountValue,
        p_tax: 0,
        p_notes: null,
        p_items: items,
      });

      if (error) throw error;
      if (!saleId) throw new Error("Sale was created but no sale ID was returned.");

      const totalAmount = subtotal - discountValue;
      if (totalAmount <= 0) {
        throw new Error("Sale total must be greater than zero.");
      }

      await createPayment({
        saleId,
        amount: totalAmount,
        paymentMethod: databasePaymentMethod,
        paymentDate: saleDate.toISOString(),
        reference: null,
        notes: null,
      });

      if (receiptUri) {
        const receiptPath = await uploadSaleReceipt(saleId, receiptUri);
        const { error: receiptError } = await supabase
          .from("sales")
          .update({ receipt_url: receiptPath })
          .eq("id", saleId);

        if (receiptError) throw receiptError;
      }

      showAlert(
        "Sale completed",
        "The sale has been recorded successfully and inventory has been updated.",
        "success"
      );

      setCart([]);
      setDiscount("0");
      setReceiptUri(null);
      router.back();
    } catch (error: any) {
      console.error("CREATE SALE ERROR:", error);
      showAlert(
        "Unable to complete sale",
        error?.message || "Something went wrong while completing the sale.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  }

  function handleAddCustomer() {
    setShowCustomerSelector(false);
    setCustomerSearch("");
    router.push({
      pathname: "/add-customer",
      params: { from: "sale" },
    });
  }

  const iconColor = isDark ? "#ffffff" : "#0f172a";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* App Alert Component */}
      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />

      {/* STATIC HEADER */}
      <View className="bg-slate-50 px-5 pb-5 pt-12 dark:bg-slate-950">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-900"
          >
            <Ionicons name="arrow-back" size={22} color={iconColor} />
          </TouchableOpacity>

          <View>
            <Text className="text-2xl font-bold text-slate-950 dark:text-white">New Sale</Text>
            <Text className="mt-1 text-sm text-slate-400 dark:text-slate-400">
              Record a new transaction
            </Text>
          </View>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 5, paddingBottom: 120 }}
      >
        {/* CUSTOMER CARD */}
        <View className="mx-5 mb-5 rounded-3xl bg-white p-5 dark:bg-slate-900">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Customer</Text>
              <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                Optional customer information
              </Text>
            </View>

            {selectedCustomer && (
              <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                <Text className="text-xs font-bold text-red-500">Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowCustomerSelector(true)}
            className="flex-row items-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-900">
              <Ionicons
                name={selectedCustomer ? "person" : "person-outline"}
                size={21}
                color={iconColor}
              />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-slate-900 dark:text-white">
                {selectedCustomer ? selectedCustomer.name : "Walk-in customer"}
              </Text>
              <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                {selectedCustomer?.phone || "Tap to select a customer"}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* SALE DETAILS CARD */}
        <View className="mx-5 mb-5 rounded-3xl bg-white p-5 dark:bg-slate-900">
          <View className="mb-5 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Ionicons name="receipt-outline" size={21} color={iconColor} />
            </View>

            <View>
              <Text className="text-lg font-bold text-slate-900 dark:text-white">Sale details</Text>
              <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                Add transaction information
              </Text>
            </View>
          </View>

          {/* DATE SELECTOR */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Sale date
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"
            >
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-white">
                  {formatSaleDate(saleDate)}
                </Text>
                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                  Tap to choose sale date
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color="#94a3b8" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={saleDate}
                mode="date"
                display={Platform.OS === "android" ? "calendar" : "spinner"}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setSaleDate(selectedDate);
                }}
              />
            )}
          </View>

          {/* RECEIPT UPLOAD */}
          <View>
            <Text className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Receipt
            </Text>
            {receiptUri ? (
              <View className="overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
                <View className="relative">
                  <Image
                    source={{ uri: receiptUri }}
                    className="h-56 w-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={removeReceipt}
                    activeOpacity={0.8}
                    className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-black/70"
                  >
                    <Ionicons name="close" size={21} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={pickReceipt}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center py-4"
                >
                  <Ionicons name="images-outline" size={18} color={iconColor} />
                  <Text className="ml-2 text-sm font-bold text-slate-900 dark:text-white">
                    Change receipt
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickReceipt}
                activeOpacity={0.8}
                className="items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 dark:border-slate-800 dark:bg-slate-800"
              >
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
                  <Ionicons name="camera-outline" size={27} color={iconColor} />
                </View>
                <Text className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                  Upload receipt
                </Text>
                <Text className="mt-1 text-center text-xs text-slate-400 dark:text-slate-400">
                  Take a photo or choose a receipt from your phone
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PRODUCTS CARD */}
        <View className="mx-5 mb-5 rounded-3xl bg-white p-5 dark:bg-slate-900">
          <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Products</Text>

          <View className="flex-row items-center rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <Ionicons name="search-outline" size={21} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              className="ml-3 flex-1 text-base text-slate-900 dark:text-white"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* PRODUCT LIST */}
          <View className="mt-4">
            {loadingProducts ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={iconColor} />
                <Text className="mt-3 text-sm text-slate-400 dark:text-slate-400">
                  Loading products...
                </Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="cube-outline" size={34} color="#94a3b8" />
                <Text className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {search ? "No products found" : "No products available"}
                </Text>
              </View>
            ) : (
              filteredProducts.slice(0, 8).map((product) => {
                const quantity = getCartQuantity(product.id);

                return (
                  <Pressable
                    key={product.id}
                    onPress={() => addProduct(product)}
                    className="mb-3 flex-row items-center rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"
                  >
                    <View className="h-14 w-14 overflow-hidden rounded-xl bg-white dark:bg-slate-900">
                      {product.image_url ? (
                        <Image
                          source={{ uri: product.image_url }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <Ionicons name="cube-outline" size={24} color="#94a3b8" />
                        </View>
                      )}
                    </View>

                    <View className="ml-3 flex-1">
                      <Text
                        className="text-sm font-bold text-slate-900 dark:text-white"
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                        {product.sku
                          ? `SKU: ${product.sku}`
                          : `${product.stock_qty} ${product.unit} available`}
                      </Text>
                      <Text className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        TZS {formatPrice(product.sale_price)}
                      </Text>
                    </View>

                    {quantity > 0 ? (
                      <View className="flex-row items-center rounded-xl bg-white dark:bg-slate-900">
                        <TouchableOpacity
                          onPress={() => decreaseQuantity(product.id)}
                          className="h-9 w-9 items-center justify-center"
                        >
                          <Ionicons name="remove" size={18} color={iconColor} />
                        </TouchableOpacity>

                        <Text className="w-7 text-center text-sm font-bold text-slate-900 dark:text-white">
                          {quantity}
                        </Text>

                        <TouchableOpacity
                          onPress={() => increaseQuantity(product.id)}
                          className="h-9 w-9 items-center justify-center"
                        >
                          <Ionicons name="add" size={18} color={iconColor} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-950 dark:bg-white">
                        <Ionicons
                          name="add"
                          size={20}
                          color={isDark ? "#0f172a" : "#ffffff"}
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* SELECTED PRODUCTS / CART SUMMARY */}
        {cart.length > 0 && (
          <View className="mx-5 mb-5 rounded-3xl bg-white p-5 dark:bg-slate-900">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                Selected products
              </Text>
              <Text className="text-sm font-semibold text-slate-400 dark:text-slate-400">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </Text>
            </View>

            {cart.map((item) => {
              const lineTotal = item.product.sale_price * item.quantity;

              return (
                <View
                  key={item.product.id}
                  className="mb-3 flex-row items-center rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <View className="h-12 w-12 overflow-hidden rounded-xl bg-white dark:bg-slate-900">
                    {item.product.image_url ? (
                      <Image
                        source={{ uri: item.product.image_url }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Ionicons name="cube-outline" size={21} color="#94a3b8" />
                      </View>
                    )}
                  </View>

                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-bold text-slate-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {item.product.name}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                      {item.quantity} {item.product.unit}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">
                      TZS {formatPrice(lineTotal)}
                    </Text>

                    <View className="mt-2 flex-row items-center rounded-xl bg-white dark:bg-slate-900">
                      <TouchableOpacity
                        onPress={() => decreaseQuantity(item.product.id)}
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Ionicons name="remove" size={16} color={iconColor} />
                      </TouchableOpacity>

                      <Text className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        onPress={() => increaseQuantity(item.product.id)}
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Ionicons name="add" size={16} color={iconColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* DISCOUNT & SUMMARY */}
            <View className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm text-slate-500 dark:text-slate-400">Subtotal</Text>
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  TZS {formatPrice(subtotal)}
                </Text>
              </View>

              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm text-slate-500 dark:text-slate-400">Discount</Text>
                <TextInput
                  value={discount}
                  onChangeText={(val) => setDiscount(sanitizeNumberInput(val))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  className="min-w-[80px] rounded-xl bg-slate-50 px-3 py-1 text-right text-sm font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                />
              </View>

              <View className="flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <Text className="text-base font-bold text-slate-900 dark:text-white">Total</Text>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  TZS {formatPrice(total)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* COMPLETE SALE BUTTON */}
        <View className="mx-5 mb-5">
          <TouchableOpacity
            onPress={handleCompleteSale}
            disabled={processing || cart.length === 0}
            className={`flex-row items-center justify-center rounded-2xl py-4 ${
              processing || cart.length === 0
                ? "bg-slate-300 dark:bg-slate-800"
                : "bg-slate-950 dark:bg-white"
            }`}
          >
            {processing ? (
              <ActivityIndicator color={isDark ? "#0f172a" : "#ffffff"} />
            ) : (
              <>
                <Text
                  className={`text-base font-bold ${
                    cart.length === 0
                      ? "text-slate-500 dark:text-slate-500"
                      : "text-white dark:text-slate-950"
                  }`}
                >
                  Complete Sale
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={
                    cart.length === 0
                      ? "#94a3b8"
                      : isDark
                      ? "#0f172a"
                      : "#ffffff"
                  }
                  className="ml-2"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CUSTOMER SELECTOR MODAL */}
      <Modal
        visible={showCustomerSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerSelector(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-3xl bg-white p-5 dark:bg-slate-900">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-slate-900 dark:text-white">
                Select Customer
              </Text>
              <TouchableOpacity onPress={() => setShowCustomerSelector(false)}>
                <Ionicons name="close" size={24} color={iconColor} />
              </TouchableOpacity>
            </View>

            <View className="mb-4 flex-row items-center rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
              <TextInput
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search customers..."
                placeholderTextColor="#94a3b8"
                className="ml-3 flex-1 text-base text-slate-900 dark:text-white"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddCustomer}
              className="mb-4 flex-row items-center justify-center rounded-2xl bg-slate-100 py-3 dark:bg-slate-800"
            >
              <Ionicons name="add" size={20} color={iconColor} />
              <Text className="ml-2 text-sm font-bold text-slate-900 dark:text-white">
                Add New Customer
              </Text>
            </TouchableOpacity>

            <ScrollView className="mb-6">
              {loadingCustomers ? (
                <ActivityIndicator size="small" color={iconColor} className="my-4" />
              ) : filteredCustomers.length === 0 ? (
                <Text className="my-4 text-center text-sm text-slate-400 dark:text-slate-400">
                  No customers found
                </Text>
              ) : (
                filteredCustomers.map((cust) => (
                  <TouchableOpacity
                    key={cust.id}
                    onPress={() => {
                      setSelectedCustomer(cust);
                      setShowCustomerSelector(false);
                    }}
                    className="mb-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"
                  >
                    <Text className="font-bold text-slate-900 dark:text-white">
                      {cust.name}
                    </Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-400">
                      {cust.phone || "No phone number"}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}