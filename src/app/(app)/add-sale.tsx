import { getProducts, type Product } from "@/lib/products";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useMemo, useState } from "react";
import {
  uploadSaleReceipt,
} from "@/lib/sales";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppAlert from "@/components/ui/AppAlert";
import { supabase } from "@/lib/supabase";
import {
  getCustomers,
  type Customer,
} from "@/lib/customers";
type CartItem = {
  product: Product;
  quantity: number;
};
import { createPayment } from "@/lib/payments";
type PaymentMethod = "cash" | "mobile" | "card";

function sanitizeNumberInput(value: string) {
  // Allow only digits and one decimal point
  const sanitized = value.replace(/[^0-9.]/g, "");

  const parts = sanitized.split(".");

  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join("")}`;
  }

  return sanitized;
}

function sanitizeDateInput(value: string) {
  // Only numbers
  const numbers = value.replace(/[^0-9]/g, "").slice(0, 8);

  if (numbers.length <= 4) {
    return numbers;
  }

  if (numbers.length <= 6) {
    return `${numbers.slice(0, 4)}/${numbers.slice(4)}`;
  }

  return `${numbers.slice(0, 4)}/${numbers.slice(
    4,
    6
  )}/${numbers.slice(6, 8)}`;
}


export default function AddSaleScreen() {

      const [customers, setCustomers] = useState<Customer[]>([]);
      const [selectedCustomer, setSelectedCustomer] =  useState<Customer | null>(null);
      const [customerSearch, setCustomerSearch] =  useState("");
      const [showCustomerSelector, setShowCustomerSelector] =    useState(false);
      const [loadingCustomers, setLoadingCustomers] =   useState(false);
      
      const router = useRouter();
      const [products, setProducts] = useState<Product[]>([]);
      const [cart, setCart] = useState<CartItem[]>([]);
      const [search, setSearch] = useState("");
      const [loadingProducts, setLoadingProducts] = useState(true);
      const [processing, setProcessing] = useState(false);
      
      function formatSaleDate(date: Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

    const [receiptUri, setReceiptUri] =
    useState<string | null>(null);

    const [saleDate, setSaleDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

    const [discount, setDiscount] = useState("0");


    
  async function pickReceipt() {
  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert(
        "Permission required",
        "Please allow photo access so you can select the receipt.",
        "warning"
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

    if (
      !result.canceled &&
      result.assets.length > 0
    ) {
      setReceiptUri(result.assets[0].uri);
    }
  } catch (error) {
    console.error(
      "RECEIPT PICKER ERROR:",
      error
    );

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

  // CUSTOM ALERT

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");

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

  // LOAD PRODUCTS

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);

      const { getMyBusiness } =
        await import("@/lib/business");

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
    console.error(
      "GET CUSTOMERS ERROR:",
      error
    );

    showAlert(
      "Unable to load customers",
      "Something went wrong while loading customers.",
      "error"
    );
  } finally {
    setLoadingCustomers(false);
  }
}, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  React.useEffect(() => {
  loadCustomers();
}, [loadCustomers]);

  // SEARCH

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

  // CART

  function addProduct(product: Product) {
    if (product.stock_qty <= 0) {
      showAlert(
        "Out of stock",
        `${product.name} is currently out of stock.`,
        "warning"
      );
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        if (
          existing.quantity >=
          product.stock_qty
        ) {
          showAlert(
            "Stock limit reached",
            `Only ${product.stock_qty} ${product.unit} available.`,
            "warning"
          );

          return current;
        }

        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(productId: string) {
    setCart((current) =>
      current.map((item) => {
        if (item.product.id !== productId) {
          return item;
        }

        if (
          item.quantity >=
          item.product.stock_qty
        ) {
          showAlert(
            "Stock limit reached",
            `Only ${item.product.stock_qty} ${item.product.unit} available.`,
            "warning"
          );

          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  }

  function decreaseQuantity(productId: string) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: item.quantity - 1,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function getCartQuantity(productId: string) {
    return (
      cart.find(
        (item) => item.product.id === productId
      )?.quantity ?? 0
    );
  }

  // TOTALS

  const subtotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.product.sale_price) *
        item.quantity,
    0
  );

  const discountAmount = Math.max(
    0,
    Number(discount) || 0
  );

  const total = Math.max(
    0,
    subtotal - discountAmount
  );

  function formatPrice(value: number) {
    return new Intl.NumberFormat("en-TZ").format(
      value
    );
  }

  // COMPLETE SALE

async function handleCompleteSale() {
  // -----------------------------
  // VALIDATE CART
  // -----------------------------

  if (cart.length === 0) {
    showAlert(
      "No products selected",
      "Add at least one product before completing the sale.",
      "warning"
    );
    return;
  }

  // -----------------------------
  // SANITIZE DISCOUNT
  // -----------------------------

  const discountValue = Number(discount);

  if (
    Number.isNaN(discountValue) ||
    discountValue < 0
  ) {
    showAlert(
      "Invalid discount",
      "Enter a valid discount amount.",
      "warning"
    );
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

  // -----------------------------
  // MAP PAYMENT METHOD
  // -----------------------------

  const databasePaymentMethod =
    paymentMethod === "mobile"
      ? "mobile_money"
      : paymentMethod;

  try {
    setProcessing(true);

    // -----------------------------
    // PREPARE SALE ITEMS
    // -----------------------------

    const items = cart.map((item) => ({
      product_id: item.product.id,
      qty: item.quantity,
    }));

    console.log("CREATING SALE...");
    console.log("ITEMS:", items);
    console.log("DISCOUNT:", discountValue);
    console.log("SALE DATE:", saleDate);
    console.log(
      "PAYMENT METHOD:",
      databasePaymentMethod
    );

    // -----------------------------
    // CREATE SALE
    // -----------------------------

    const { data: saleId, error } =
      await supabase.rpc(
        "create_sale",
        {
          p_customer_id:  selectedCustomer?.id ?? null,

          p_sale_date:
            saleDate.toISOString(),

          p_payment_method:
            databasePaymentMethod,

          p_discount:
            discountValue,

          p_tax: 0,

          p_notes: null,

          p_items: items,
        }
      );

    if (error) {
      throw error;
    }

    if (!saleId) {
      throw new Error(
        "Sale was created but no sale ID was returned."
      );
    }

    console.log(
      "SALE CREATED:",
      saleId
    );

    // -----------------------------
    // UPLOAD RECEIPT
    // -----------------------------


    // -----------------------------
    // CREATE PAYMENT RECORD
    // -----------------------------

    const totalAmount =
      subtotal - discountValue;

    if (totalAmount <= 0) {
      throw new Error(
        "Sale total must be greater than zero."
      );
    }

    console.log(
      "CREATING PAYMENT...",
      totalAmount
    );

    const payment =
      await createPayment({
        saleId,
        amount: totalAmount,
        paymentMethod:
          databasePaymentMethod,
        paymentDate:
          saleDate.toISOString(),
        reference: null,
        notes: null,
      });

    console.log(
      "PAYMENT CREATED:",
      payment.id
    );

    if (receiptUri) {
      console.log(
        "UPLOADING SALE RECEIPT..."
      );

      const receiptPath =
        await uploadSaleReceipt(
          saleId,
          receiptUri
        );

      console.log(
        "RECEIPT UPLOADED:",
        receiptPath
      );

      // -----------------------------
      // SAVE RECEIPT PATH
      // -----------------------------

      const { error: receiptError } =
        await supabase
          .from("sales")
          .update({
            receipt_url: receiptPath,
          })
          .eq("id", saleId);

      if (receiptError) {
        throw receiptError;
      }

      console.log(
        "RECEIPT PATH SAVED"
      );
    }

    // -----------------------------
    // SUCCESS
    // -----------------------------

    showAlert(
      "Sale completed",
      "The sale has been recorded successfully and inventory has been updated.",
      "success"
    );

    // -----------------------------
    // CLEAR FORM
    // -----------------------------

    setCart([]);
    setDiscount("0");
    setReceiptUri(null);
    router.back()

  } catch (error: any) {
    console.error(
      "CREATE SALE ERROR:",
      error
    );

    showAlert(
      "Unable to complete sale",
      error?.message ||
        "Something went wrong while completing the sale.",
      "error"
    );

  } finally {
    setProcessing(false);
  }
}

const filteredCustomers = useMemo(() => {
  const query = customerSearch
    .trim()
    .toLowerCase();

  if (!query) {
    return customers;
  }

  return customers.filter((customer) => {
    const name =
      customer.name?.toLowerCase() ?? "";

    const phone =
      customer.phone?.toLowerCase() ?? "";

    return (
      name.includes(query) ||
      phone.includes(query)
    );
  });
}, [customers, customerSearch]);

function handleAddCustomer() {
  setShowCustomerSelector(false);
  setCustomerSearch("");
  router.push({
      pathname: "/add-customer",
      params: {
        from: "sale",
      },
    });
}


  return (
        <KeyboardAvoidingView
          className="flex-1 bg-slate-50"
          behavior={
              Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          >
        {/* STATIC HEADER */}
        <View className="bg-slate-50 px-5 pb-5 pt-12">
            <View className="flex-row items-center">
            <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
                className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white"
            >
                <Ionicons
                name="arrow-back"
                size={22}
                color="#0f172a"
                />
            </TouchableOpacity>

            <View>
                <Text className="text-2xl font-bold text-slate-950">
                New Sale
                </Text>

                <Text className="mt-1 text-sm text-slate-400">
                Record a new transaction
                </Text>
            </View>
            </View>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
            paddingTop: 5,
            paddingBottom: 50,
            }}
        >

        {/* CUSTOMER */}

          <View className="mx-5 mb-5 rounded-3xl bg-white p-5">

            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-slate-900">
                  Customer
                </Text>

                <Text className="mt-1 text-xs text-slate-400">
                  Optional customer information
                </Text>
              </View>

              {selectedCustomer && (
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCustomer(null)
                  }
                >
                  <Text className="text-xs font-bold text-red-500">
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setShowCustomerSelector(true)
              }
              className="flex-row items-center rounded-2xl bg-slate-50 px-4 py-4"
            >

              <View className="h-11 w-11 items-center justify-center rounded-xl bg-white">
                <Ionicons
                  name={
                    selectedCustomer
                      ? "person"
                      : "person-outline"
                  }
                  size={21}
                  color="#0f172a"
                />
              </View>

              <View className="ml-3 flex-1">

                <Text className="text-base font-semibold text-slate-900">
                  {selectedCustomer
                    ? selectedCustomer.name
                    : "Walk-in customer"}
                </Text>

                <Text className="mt-1 text-xs text-slate-400">
                  {selectedCustomer?.phone ||
                    "Tap to select a customer"}
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#94a3b8"
              />

            </TouchableOpacity>

          </View>

        {/* SALE DETAILS */}

        <View className="mx-5 mb-5 rounded-3xl bg-white p-5">
        <View className="mb-5 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Ionicons
                name="receipt-outline"
                size={21}
                color="#0f172a"
            />
            </View>

            <View>
            <Text className="text-lg font-bold text-slate-900">
                Sale details
            </Text>

            <Text className="mt-1 text-xs text-slate-400">
                Add transaction information
            </Text>
            </View>
        </View>

        {/* DATE */}

        <View className="mb-5">
        <Text className="mb-2 text-sm font-semibold text-slate-700">
            Sale date
        </Text>

        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center rounded-2xl bg-slate-50 px-4 py-4"
        >
            <Ionicons
            name="calendar-outline"
            size={20}
            color="#64748b"
            />

            <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-slate-900">
                {formatSaleDate(saleDate)}
            </Text>

            <Text className="mt-1 text-xs text-slate-400">
                Tap to choose sale date
            </Text>
            </View>

            <Ionicons
            name="chevron-forward"
            size={19}
            color="#94a3b8"
            />
        </TouchableOpacity>

        {showDatePicker && (
            <DateTimePicker
            value={saleDate}
            mode="date"
            display={Platform.OS === "android" ? "calendar" : "spinner"}
            onChange={(event, selectedDate) => {
                setShowDatePicker(false);

                if (selectedDate) {
                setSaleDate(selectedDate);
                }
            }}
            />
        )}
        </View>

        {/* RECEIPT */}
            <View>
                <Text className="mb-2 text-sm font-semibold text-slate-700">
                Receipt
                </Text>

                {receiptUri ? (
                <View className="overflow-hidden rounded-2xl bg-slate-50">
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
                        <Ionicons
                        name="close"
                        size={21}
                        color="#ffffff"
                        />
                    </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                    onPress={pickReceipt}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-center py-4"
                    >
                    <Ionicons
                        name="images-outline"
                        size={18}
                        color="#0f172a"
                    />

                    <Text className="ml-2 text-sm font-bold text-slate-900">
                        Change receipt
                    </Text>
                    </TouchableOpacity>
                </View>
                ) : (
                <TouchableOpacity
                    onPress={pickReceipt}
                    activeOpacity={0.8}
                    className="items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8"
                >
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
                    <Ionicons
                        name="camera-outline"
                        size={27}
                        color="#0f172a"
                    />
                    </View>

                    <Text className="mt-4 text-sm font-bold text-slate-900">
                    Upload receipt
                    </Text>

                    <Text className="mt-1 text-center text-xs text-slate-400">
                    Take a photo or choose a receipt from your phone
                    </Text>
                </TouchableOpacity>
                )}
            </View>
        </View>

        {/* PRODUCT SEARCH */}

        <View className="mx-5 mb-5 rounded-3xl bg-white p-5">
          <Text className="mb-4 text-lg font-bold text-slate-900">
            Products
          </Text>

          <View className="flex-row items-center rounded-2xl bg-slate-50 px-4 py-3">
            <Ionicons
              name="search-outline"
              size={21}
              color="#94a3b8"
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              className="ml-3 flex-1 text-base text-slate-900"
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* PRODUCT LIST */}

          <View className="mt-4">
            {loadingProducts ? (
              <View className="items-center py-8">
                <ActivityIndicator
                  size="small"
                  color="#0f172a"
                />

                <Text className="mt-3 text-sm text-slate-400">
                  Loading products...
                </Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons
                  name="cube-outline"
                  size={34}
                  color="#94a3b8"
                />

                <Text className="mt-3 text-sm font-semibold text-slate-500">
                  {search
                    ? "No products found"
                    : "No products available"}
                </Text>
              </View>
            ) : (
              filteredProducts
                .slice(0, 8)
                .map((product) => {
                  const quantity =
                    getCartQuantity(product.id);

                  return (
                    <Pressable
                      key={product.id}
                      onPress={() =>
                        addProduct(product)
                      }
                      className="mb-3 flex-row items-center rounded-2xl bg-slate-50 p-3"
                    >
                      {/* IMAGE */}

                      <View className="h-14 w-14 overflow-hidden rounded-xl bg-white">
                        {product.image_url ? (
                          <Image
                            source={{
                              uri: product.image_url,
                            }}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="h-full w-full items-center justify-center">
                            <Ionicons
                              name="cube-outline"
                              size={24}
                              color="#94a3b8"
                            />
                          </View>
                        )}
                      </View>

                      {/* INFO */}

                      <View className="ml-3 flex-1">
                        <Text
                          className="text-sm font-bold text-slate-900"
                          numberOfLines={1}
                        >
                          {product.name}
                        </Text>

                        <Text className="mt-1 text-xs text-slate-400">
                          {product.sku
                            ? `SKU: ${product.sku}`
                            : `${product.stock_qty} ${product.unit} available`}
                        </Text>

                        <Text className="mt-1 text-sm font-bold text-slate-900">
                          TZS{" "}
                          {formatPrice(
                            product.sale_price
                          )}
                        </Text>
                      </View>

                      {/* ADD / QUANTITY */}

                      {quantity > 0 ? (
                        <View className="flex-row items-center rounded-xl bg-white">
                          <TouchableOpacity
                            onPress={() =>
                              decreaseQuantity(
                                product.id
                              )
                            }
                            className="h-9 w-9 items-center justify-center"
                          >
                            <Ionicons
                              name="remove"
                              size={18}
                              color="#0f172a"
                            />
                          </TouchableOpacity>

                          <Text className="w-7 text-center text-sm font-bold text-slate-900">
                            {quantity}
                          </Text>

                          <TouchableOpacity
                            onPress={() =>
                              increaseQuantity(
                                product.id
                              )
                            }
                            className="h-9 w-9 items-center justify-center"
                          >
                            <Ionicons
                              name="add"
                              size={18}
                              color="#0f172a"
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-950">
                          <Ionicons
                            name="add"
                            size={20}
                            color="#ffffff"
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })
            )}
          </View>
        </View>

        {/* SELECTED PRODUCTS */}

        {cart.length > 0 && (
          <View className="mx-5 mb-5 rounded-3xl bg-white p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900">
                Selected products
              </Text>

              <Text className="text-sm font-semibold text-slate-400">
                {cart.length}{" "}
                {cart.length === 1
                  ? "item"
                  : "items"}
              </Text>
            </View>

            {cart.map((item) => {
              const lineTotal =
                item.product.sale_price *
                item.quantity;

              return (
                <View
                  key={item.product.id}
                  className="mb-3 flex-row items-center rounded-2xl bg-slate-50 p-3"
                >
                  <View className="h-12 w-12 overflow-hidden rounded-xl bg-white">
                    {item.product.image_url ? (
                      <Image
                        source={{
                          uri: item.product.image_url,
                        }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Ionicons
                          name="cube-outline"
                          size={21}
                          color="#94a3b8"
                        />
                      </View>
                    )}
                  </View>

                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-bold text-slate-900"
                      numberOfLines={1}
                    >
                      {item.product.name}
                    </Text>

                    <Text className="mt-1 text-xs text-slate-400">
                      {item.quantity}{" "}
                      {item.product.unit}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-bold text-slate-900">
                      TZS{" "}
                      {formatPrice(lineTotal)}
                    </Text>

                    <View className="mt-2 flex-row items-center rounded-xl bg-white">
                      <TouchableOpacity
                        onPress={() =>
                          decreaseQuantity(
                            item.product.id
                          )
                        }
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Ionicons
                          name="remove"
                          size={16}
                          color="#0f172a"
                        />
                      </TouchableOpacity>

                      <Text className="w-6 text-center text-xs font-bold">
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          increaseQuantity(
                            item.product.id
                          )
                        }
                        className="h-8 w-8 items-center justify-center"
                      >
                        <Ionicons
                          name="add"
                          size={16}
                          color="#0f172a"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* SALE SUMMARY */}

        <View className="mx-5 mb-5 rounded-3xl bg-white p-5">
          <Text className="mb-5 text-lg font-bold text-slate-900">
            Sale Summary
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">
              Subtotal
            </Text>

            <Text className="text-sm font-semibold text-slate-900">
              TZS {formatPrice(subtotal)}
            </Text>
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">
              Discount
            </Text>

            <View className="flex-row items-center rounded-xl bg-slate-50 px-3">
              <Text className="text-xs font-semibold text-slate-400">
                TZS
              </Text>

              <TextInput
                value={discount}
                onChangeText={setDiscount}
                keyboardType="decimal-pad"
                className="ml-2 w-20 py-2 text-right text-sm font-semibold text-slate-900"
              />
            </View>
          </View>

          <View className="my-5 h-px bg-slate-100" />

          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">
              Total
            </Text>

            <Text className="text-xl font-bold text-slate-950">
              TZS {formatPrice(total)}
            </Text>
          </View>
        </View>

        {/* PAYMENT */}

        <View className="mx-5 mb-5 rounded-3xl bg-white p-5">
          <Text className="mb-5 text-lg font-bold text-slate-900">
            Payment method
          </Text>

          <View className="flex-row gap-3">
            <PaymentButton
              icon="cash-outline"
              label="Cash"
              active={paymentMethod === "cash"}
              onPress={() =>
                setPaymentMethod("cash")
              }
            />

            <PaymentButton
              icon="phone-portrait-outline"
              label="Mobile"
              active={paymentMethod === "mobile"}
              onPress={() =>
                setPaymentMethod("mobile")
              }
            />

            <PaymentButton
              icon="card-outline"
              label="Card"
              active={paymentMethod === "card"}
              onPress={() =>
                setPaymentMethod("card")
              }
            />
          </View>
        </View>

        {/* COMPLETE SALE */}

        <View className="mx-5">
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={processing}
            onPress={handleCompleteSale}
            className={`items-center rounded-2xl py-4 ${
              processing
                ? "bg-slate-400"
                : "bg-slate-950"
            }`}
          >
            {processing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="#ffffff"
                />

                <Text className="ml-2 text-base font-bold text-white">
                  Complete Sale
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CUSTOM ALERT */}

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttonText="Done"
        onClose={() =>
          setAlertVisible(false)
        }
      />
      {/* =================================================
          CUSTOMER SELECTOR
      ================================================= */}

      <Modal
        visible={showCustomerSelector}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowCustomerSelector(false)
        }
      >
        <View className="flex-1 justify-end bg-black/40">

          <View className="max-h-[85%] rounded-t-[32px] bg-slate-50">

            {/* HEADER */}

            <View className="px-5 pb-4 pt-5">

              <View className="flex-row items-center justify-between">

                <View>
                  <Text className="text-2xl font-bold text-slate-950">
                    Select Customer
                  </Text>

                  <Text className="mt-1 text-sm text-slate-400">
                    Choose a customer for this sale
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowCustomerSelector(false)
                  }
                  className="h-10 w-10 items-center justify-center rounded-xl bg-white"
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="#0f172a"
                  />
                </Pressable>

              </View>

              {/* SEARCH */}

              <View className="mt-5 flex-row items-center rounded-2xl bg-white px-4 py-3">

                <Ionicons
                  name="search-outline"
                  size={21}
                  color="#94a3b8"
                />

                <TextInput
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  placeholder="Search name or phone..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  className="ml-3 flex-1 text-base text-slate-900"
                />

                {customerSearch.length > 0 && (
                  <Pressable
                    onPress={() =>
                      setCustomerSearch("")
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color="#94a3b8"
                    />
                  </Pressable>
                )}

              </View>

            </View>

            {/* CUSTOMER LIST */}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 40,
              }}
            >

              {/* WALK-IN */}

              <Pressable
                onPress={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                  setShowCustomerSelector(false);
                }}
                className="mb-3 flex-row items-center rounded-2xl bg-white p-4 active:opacity-70"
              >

                <View className="h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

                  <Ionicons
                    name="walk-outline"
                    size={23}
                    color="#0f172a"
                  />

                </View>

                <View className="ml-4 flex-1">

                  <Text className="text-base font-bold text-slate-900">
                    Walk-in customer
                  </Text>

                  <Text className="mt-1 text-xs text-slate-400">
                    No customer information
                  </Text>

                </View>

                {!selectedCustomer && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#0f172a"
                  />
                )}

              </Pressable>

              {/* LOADING */}

              {loadingCustomers ? (
                <View className="items-center py-10">

                  <ActivityIndicator
                    size="large"
                    color="#0f172a"
                  />

                  <Text className="mt-3 text-sm text-slate-400">
                    Loading customers...
                  </Text>

                </View>
              ) : filteredCustomers.length === 0 ? (

                /* EMPTY */

                <View className="items-center rounded-3xl bg-white px-6 py-12">

                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                    <Ionicons
                      name="person-outline"
                      size={30}
                      color="#64748b"
                    />

                  </View>

                  <Text className="mt-5 text-lg font-bold text-slate-900">
                    {customerSearch
                      ? "No customers found"
                      : "No customers yet"}
                  </Text>

                  <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
                    {customerSearch
                      ? "Try searching by another name or phone number."
                      : "Add a customer first to assign them to this sale."}
                  </Text>

                </View>

              ) : (

                /* CUSTOMERS */

                filteredCustomers.map(
                  (customer) => {
                    const isSelected =
                      selectedCustomer?.id ===
                      customer.id;

                    return (
                      <Pressable
                        key={customer.id}
                        onPress={() => {
                          setSelectedCustomer(
                            customer
                          );

                          setCustomerSearch("");

                          setShowCustomerSelector(
                            false
                          );
                        }}
                        className={`mb-3 flex-row items-center rounded-2xl p-4 ${
                          isSelected
                            ? "bg-slate-950"
                            : "bg-white"
                        }`}
                      >

                        {/* AVATAR */}

                        <View
                          className={`h-12 w-12 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-white/10"
                              : "bg-slate-100"
                          }`}
                        >

                          <Ionicons
                            name="person-outline"
                            size={23}
                            color={
                              isSelected
                                ? "#ffffff"
                                : "#0f172a"
                            }
                          />

                        </View>

                        {/* INFO */}

                        <View className="ml-4 flex-1">

                          <Text
                            className={`text-base font-bold ${
                              isSelected
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                          >
                            {customer.name}
                          </Text>

                          <Text
                            className={`mt-1 text-xs ${
                              isSelected
                                ? "text-slate-300"
                                : "text-slate-400"
                            }`}
                          >
                            {customer.phone ||
                              customer.email ||
                              "No contact information"}
                          </Text>

                        </View>

                        {/* SELECTED */}

                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#ffffff"
                          />
                        )}

                      </Pressable>
                    );
                  }
                )
                  
              )
              }
            <Pressable
              onPress={handleAddCustomer}
              className="mt-2 flex-row items-center justify-center rounded-2xl bg-slate-950 py-4 active:opacity-80"
            >
              <Ionicons
                name="person-add-outline"
                size={20}
                color="white"
              />

              <Text className="ml-2 text-sm font-bold text-white">
                Add New Customer
              </Text>
            </Pressable>
            </ScrollView>

          </View>

        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function PaymentButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={`flex-1 items-center rounded-2xl border py-4 ${
        active
          ? "border-slate-950 bg-slate-950"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? "#ffffff" : "#0f172a"}
      />

      <Text
        className={`mt-2 text-xs font-bold ${
          active
            ? "text-white"
            : "text-slate-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function setLoading(arg0: boolean) {
    throw new Error("Function not implemented.");
}
