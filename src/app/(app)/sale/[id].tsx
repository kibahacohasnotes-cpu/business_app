import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import AppAlert from "@/components/ui/AppAlert";
import { useTheme } from "@/context/ThemeContext";
import {
  getSaleById,
  getSaleItems,
  getSaleReceiptUrl,
  type Sale,
  type SaleItem,
} from "@/lib/sales";

export default function SaleDetailScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");

  const iconColor = isDark ? "#ffffff" : "#0f172a";

  /* =====================================================
     LOAD SALE
  ===================================================== */

  const loadSale = useCallback(async () => {
    try {
      setLoading(true);

      if (!id) {
        throw new Error("Sale ID is missing.");
      }

      const [saleData, itemsData] = await Promise.all([
        getSaleById(id),
        getSaleItems(id),
      ]);

      setSale(saleData);
      setItems(itemsData);

      /* -----------------------------------------------
         LOAD RECEIPT
      ----------------------------------------------- */

      if (saleData.receipt_url) {
        try {
          const signedUrl = await getSaleReceiptUrl(
            saleData.receipt_url
          );

          setReceiptUrl(signedUrl);
        } catch (receiptError) {
          console.error(
            "GET RECEIPT ERROR:",
            receiptError
          );

          setReceiptUrl(null);
        }
      } else {
        setReceiptUrl(null);
      }
    } catch (error: any) {
      console.error(
        "GET SALE DETAILS ERROR:",
        error
      );

      setAlertTitle("Unable to load sale");
      setAlertMessage(
        error?.message ||
          "Something went wrong while loading this sale."
      );
      setAlertType("error");
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  /* =====================================================
     FORMATTERS
  ===================================================== */

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-TZ").format(
      value
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-TZ",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString(
      "en-TZ",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  function formatPaymentMethod(
    method: Sale["payment_method"]
  ) {
    if (!method) {
      return "Not specified";
    }

    return method
      .replace("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator
          size="large"
          color={iconColor}
        />

        <Text className="mt-4 text-sm text-slate-400 dark:text-slate-400">
          Loading sale...
        </Text>
      </View>
    );
  }

  /* =====================================================
     SALE NOT FOUND
  ===================================================== */

  if (!sale) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
          <Ionicons
            name="receipt-outline"
            size={30}
            color="#64748b"
          />
        </View>

        <Text className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
          Sale not found
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 dark:bg-white"
        >
          <Text className="font-semibold text-white dark:text-slate-950">
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* =====================================================
     SCREEN
  ===================================================== */

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">

      {/* =================================================
          STATIC HEADER
      ================================================= */}

      <View className="bg-slate-50 px-5 pb-4 pt-14 dark:bg-slate-950">
        <View className="flex-row items-center">

          <TouchableOpacity
            onPress={() => router.replace("../dashboard")}
            activeOpacity={0.7}
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-900"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={iconColor}
            />
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950 dark:text-white">
              Sale Details
            </Text>

            <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
              Sale #{sale.id.slice(0, 8)}
            </Text>
          </View>

          <View
            className={`rounded-full px-3 py-2 ${
              sale.status === "completed"
                ? "bg-green-50 dark:bg-green-950/40"
                : sale.status === "cancelled"
                ? "bg-red-50 dark:bg-red-950/40"
                : "bg-orange-50 dark:bg-orange-950/40"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                sale.status === "completed"
                  ? "text-green-600 dark:text-green-400"
                  : sale.status === "cancelled"
                  ? "text-red-600 dark:text-red-400"
                  : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {sale.status.toUpperCase()}
            </Text>
          </View>

        </View>
      </View>

      {/* =================================================
          SCROLL CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 60,
        }}
      >

        {/* =================================================
            DATE + PAYMENT
        ================================================= */}

        <View className="mt-3 rounded-3xl bg-white p-5 dark:bg-slate-900">

          <View className="flex-row">

            <View className="flex-1">
              <Text className="text-xs font-medium text-slate-400 dark:text-slate-400">
                SALE DATE
              </Text>

              <Text className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                {formatDate(sale.sale_date)}
              </Text>

              <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                {formatTime(sale.sale_date)}
              </Text>
            </View>

            <View className="flex-1 items-end">
              <Text className="text-xs font-medium text-slate-400 dark:text-slate-400">
                PAYMENT
              </Text>

              <Text className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                {formatPaymentMethod(
                  sale.payment_method
                )}
              </Text>
            </View>

          </View>

        </View>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

          <View className="mb-5 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <Ionicons
                name="cart-outline"
                size={21}
                color={iconColor}
              />
            </View>

            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Products
            </Text>
          </View>

          {items.map((item, index) => (
            <View
              key={item.id}
              className={`flex-row ${
                index > 0
                  ? "mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"
                  : ""
              }`}
            >

              <View className="h-11 w-11 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {item.product?.image_url ? (
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
                      size={20}
                      color="#64748b"
                    />
                  </View>
                )}
              </View>

              <View className="ml-3 flex-1">

                <Text
                  className="text-sm font-bold text-slate-900 dark:text-white"
                  numberOfLines={2}
                >
                  {item.product_name}
                </Text>

                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                  {item.qty} × TZS{" "}
                  {formatMoney(
                    Number(item.unit_price)
                  )}
                </Text>

              </View>

              <View className="items-end">
                <Text className="text-sm font-bold text-slate-950 dark:text-white">
                  TZS{" "}
                  {formatMoney(
                    Number(item.subtotal)
                  )}
                </Text>
              </View>

            </View>
          ))}

        </View>

        {/* =================================================
            PAYMENT SUMMARY
        ================================================= */}

        <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

          <Text className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
            Payment Summary
          </Text>

          <SummaryRow
            label="Subtotal"
            value={Number(sale.subtotal)}
          />

          <SummaryRow
            label="Tax"
            value={Number(sale.tax)}
          />

          <SummaryRow
            label="Discount"
            value={Number(sale.discount)}
            negative
          />

          <View className="my-4 h-px bg-slate-100 dark:bg-slate-800" />

          <View className="flex-row items-center justify-between">

            <Text className="text-base font-bold text-slate-900 dark:text-white">
              Total
            </Text>

            <Text className="text-xl font-bold text-slate-950 dark:text-white">
              TZS{" "}
              {formatMoney(
                Number(sale.total)
              )}
            </Text>

          </View>

        </View>

        {/* =================================================
            RECEIPT
        ================================================= */}

        {receiptUrl && (
          <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

            <View className="mb-5 flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Ionicons
                  name="image-outline"
                  size={21}
                  color={iconColor}
                />
              </View>

              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                Receipt
              </Text>
            </View>

            <Image
              source={{ uri: receiptUrl }}
              className="w-full rounded-2xl"
              style={{
                height: 420,
              }}
              resizeMode="contain"
            />

          </View>
        )}

        {/* =================================================
            NOTES
        ================================================= */}

        {sale.notes && (
          <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

            <Text className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
              Notes
            </Text>

            <Text className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              {sale.notes}
            </Text>

          </View>
        )}

      </ScrollView>

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttonText="Done"
        onClose={() => {
          setAlertVisible(false);

          if (alertType === "error") {
            router.back();
          }
        }}
      />

    </View>
  );
}


/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between">

      <Text className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </Text>

      <Text
        className={`text-sm font-semibold ${
          negative
            ? "text-orange-500 dark:text-orange-400"
            : "text-slate-900 dark:text-white"
        }`}
      >
        {negative && value > 0
          ? "- "
          : ""}
        TZS{" "}
        {new Intl.NumberFormat("en-TZ").format(
          value
        )}
      </Text>

    </View>
  );
}