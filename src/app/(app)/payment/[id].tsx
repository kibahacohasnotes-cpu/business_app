import {
  getCustomerById,
  type Customer,
} from "@/lib/customers";
import {
  getPaymentById,
  type Payment,
} from "@/lib/payments";
import {
  getSaleById,
  getSaleItems,
  type Sale,
  type SaleItem,
  getSaleReceiptUrl,
} from "@/lib/sales";
import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";


export default function PaymentDetailsScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptLoading, setReceiptLoading] = useState(false);

  /* =====================================================
     LOAD PAYMENT
  ===================================================== */

  const loadPayment = useCallback(
    async () => {
      try {
        setLoading(true);

        if (!id) {
          throw new Error(
            "Payment ID is missing."
          );
        }

        const paymentData =
          await getPaymentById(id);

        setPayment(paymentData);

        /* ---------------------------------------------
           LOAD SALE
        --------------------------------------------- */

        if (paymentData.sale_id) {
          const saleData =
            await getSaleById(
              paymentData.sale_id
            );

          setSale(saleData);

          /* -------------------------------------------
             SALE ITEMS
          ------------------------------------------- */

          const items =
            await getSaleItems(
              paymentData.sale_id
            );

          setSaleItems(items);

          /* -------------------------------------------
             CUSTOMER
          ------------------------------------------- */

          if (saleData.customer_id) {
            try {
              const customerData =
                await getCustomerById(
                  saleData.customer_id
                );

              setCustomer(
                customerData as Customer
              );
            } catch (error) {
              console.warn(
                "CUSTOMER LOAD ERROR:",
                error
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "LOAD PAYMENT ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  /* =====================================================
     HELPERS
  ===================================================== */

  function formatMoney(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-TZ"
    ).format(value);
  }

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleDateString("en-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatPaymentMethod(
    method: Payment["payment_method"]
  ) {
    return method
      .replace("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  function getPaymentIcon(
    method: Payment["payment_method"]
  ) {
    switch (method) {
      case "cash":
        return "cash-outline";

      case "card":
        return "card-outline";

      case "mobile_money":
        return "phone-portrait-outline";

      case "bank_transfer":
        return "business-outline";

      case "credit":
        return "time-outline";

      default:
        return "wallet-outline";
    }
  }

  /* =====================================================
     VIEW RECEIPT
  ===================================================== */

  async function handleViewReceipt() {
    if (!sale?.receipt_url) {
      return;
    }

    try {
      setReceiptLoading(true);

        const url =
        await getSaleReceiptUrl(
            sale.receipt_url
        );

        await Linking.openURL(url);
    } catch (error) {
      console.error(
        "VIEW RECEIPT ERROR:",
        error
      );
    } finally {
      setReceiptLoading(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">

        <ActivityIndicator
          size="large"
          color="#0f172a"
        />

        <Text className="mt-4 text-sm text-slate-400">
          Loading payment...
        </Text>

      </View>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!payment) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">

        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

          <Ionicons
            name="wallet-outline"
            size={30}
            color="#64748b"
          />

        </View>

        <Text className="mt-5 text-xl font-bold text-slate-900">
          Payment not found
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-2xl bg-slate-950 px-6 py-3"
        >
          <Text className="font-semibold text-white">
            Go back
          </Text>
        </Pressable>

      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">

      {/* =================================================
          STATIC HEADER
      ================================================= */}

      <View className="bg-slate-50 px-5 pb-4 pt-14">

        <View className="flex-row items-center">

          <Pressable
            onPress={() => router.back()}
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0f172a"
            />
          </Pressable>

          <View className="flex-1">

            <Text className="text-3xl font-bold text-slate-950">
              Payment
            </Text>

            <Text className="mt-1 text-sm text-slate-400">
              Payment details
            </Text>

          </View>

        </View>

      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >

        {/* =================================================
            PAYMENT HERO
        ================================================= */}

        <View className="rounded-[32px] bg-slate-950 p-6">

          <View className="flex-row items-center">

            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">

              <Ionicons
                name={getPaymentIcon(
                  payment.payment_method
                )}
                size={27}
                color="white"
              />

            </View>

            <View className="ml-4 flex-1">

              <Text className="text-sm font-medium text-slate-400">
                PAYMENT RECEIVED
              </Text>

              <Text className="mt-1 text-3xl font-bold text-white">
                TZS{" "}
                {formatMoney(
                  Number(payment.amount)
                )}
              </Text>

            </View>

          </View>

          <View className="mt-6 flex-row items-center justify-between">

            <View>

              <Text className="text-xs text-slate-400">
                METHOD
              </Text>

              <Text className="mt-1 text-sm font-semibold text-white">
                {formatPaymentMethod(
                  payment.payment_method
                )}
              </Text>

            </View>

            <View className="items-end">

              <Text className="text-xs text-slate-400">
                DATE
              </Text>

              <Text className="mt-1 text-sm font-semibold text-white">
                {formatDate(
                  payment.payment_date
                )}
              </Text>

            </View>

          </View>

        </View>

        {/* =================================================
            TRANSACTION INFORMATION
        ================================================= */}

        <View className="mt-5 rounded-3xl bg-white p-5">

          <Text className="mb-5 text-lg font-bold text-slate-900">
            Transaction
          </Text>

          <InfoRow
            label="Payment ID"
            value={payment.id.slice(
              0,
              12
            )}
          />

          {payment.sale_id && (
            <InfoRow
              label="Sale"
              value={`#${payment.sale_id.slice(
                0,
                8
              )}`}
            />
          )}

          {payment.reference && (
            <InfoRow
              label="Reference"
              value={payment.reference}
            />
          )}

          <InfoRow
            label="Payment date"
            value={formatDate(
              payment.payment_date
            )}
          />

        </View>

        {/* =================================================
            CUSTOMER
        ================================================= */}

        {customer && (
          <View className="mt-5 rounded-3xl bg-white p-5">

            <View className="mb-5 flex-row items-center justify-between">

              <Text className="text-lg font-bold text-slate-900">
                Customer
              </Text>

              <Pressable
                onPress={() =>
                  router.push({
                    pathname:
                      "/customer/[id]",
                    params: {
                      id: customer.id,
                    },
                  })
                }
              >
                <Text className="text-sm font-semibold text-slate-500">
                  View
                </Text>
              </Pressable>

            </View>

            <View className="flex-row items-center">

              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">

                <Ionicons
                  name="person-outline"
                  size={22}
                  color="#0f172a"
                />

              </View>

              <View className="ml-4 flex-1">

                <Text className="text-base font-bold text-slate-900">
                  {customer.name}
                </Text>

                {customer.phone && (
                  <Text className="mt-1 text-xs text-slate-400">
                    {customer.phone}
                  </Text>
                )}

                {customer.email && (
                  <Text className="mt-1 text-xs text-slate-400">
                    {customer.email}
                  </Text>
                )}

              </View>

            </View>

          </View>
        )}

        {/* =================================================
            PRODUCTS
        ================================================= */}

        {saleItems.length > 0 && (
          <View className="mt-5 rounded-3xl bg-white p-5">

            <Text className="mb-5 text-lg font-bold text-slate-900">
              Products
            </Text>

            {saleItems.map(
              (item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center ${
                    index !==
                    saleItems.length - 1
                      ? "mb-4"
                      : ""
                  }`}
                >

                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                    <Ionicons
                      name="cube-outline"
                      size={19}
                      color="#0f172a"
                    />

                  </View>

                  <View className="ml-3 flex-1">

                    <Text
                      className="text-sm font-semibold text-slate-900"
                      numberOfLines={1}
                    >
                      {item.product_name}
                    </Text>

                    <Text className="mt-1 text-xs text-slate-400">
                      {Number(item.qty)} × TZS{" "}
                      {formatMoney(
                        Number(
                          item.unit_price
                        )
                      )}
                    </Text>

                  </View>

                  <Text className="text-sm font-bold text-slate-900">
                    TZS{" "}
                    {formatMoney(
                      Number(
                        item.subtotal
                      )
                    )}
                  </Text>

                </View>
              )
            )}

          </View>
        )}

        {/* =================================================
            SALE SUMMARY
        ================================================= */}

        {sale && (
          <View className="mt-5 rounded-3xl bg-white p-5">

            <Text className="mb-5 text-lg font-bold text-slate-900">
              Sale summary
            </Text>

            <InfoRow
              label="Subtotal"
              value={`TZS ${formatMoney(
                Number(sale.subtotal)
              )}`}
            />

            {Number(sale.discount) >
              0 && (
              <InfoRow
                label="Discount"
                value={`- TZS ${formatMoney(
                  Number(
                    sale.discount
                  )
                )}`}
              />
            )}

            {Number(sale.tax) > 0 && (
              <InfoRow
                label="Tax"
                value={`TZS ${formatMoney(
                  Number(sale.tax)
                )}`}
              />
            )}

            <View className="my-3 h-px bg-slate-100" />

            <View className="flex-row items-center justify-between">

              <Text className="text-base font-bold text-slate-900">
                Total
              </Text>

              <Text className="text-lg font-bold text-slate-950">
                TZS{" "}
                {formatMoney(
                  Number(sale.total)
                )}
              </Text>

            </View>

          </View>
        )}

        {/* =================================================
            RECEIPT
        ================================================= */}

        {sale?.receipt_url && (
          <View className="mt-5 rounded-3xl bg-white p-5">

            <View className="flex-row items-center">

              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">

                <Ionicons
                  name="document-attach-outline"
                  size={22}
                  color="#0f172a"
                />

              </View>

              <View className="ml-4 flex-1">

                <Text className="text-base font-bold text-slate-900">
                  Receipt
                </Text>

                <Text className="mt-1 text-xs text-slate-400">
                  Attached to this payment
                </Text>

              </View>

            </View>

            <Pressable
              disabled={receiptLoading}
              onPress={
                handleViewReceipt
              }
              className={`mt-4 items-center rounded-2xl py-4 ${
                receiptLoading
                  ? "bg-slate-400"
                  : "bg-slate-950"
              }`}
            >

              {receiptLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">

                  <Ionicons
                    name="eye-outline"
                    size={20}
                    color="white"
                  />

                  <Text className="ml-2 text-sm font-bold text-white">
                    View Receipt
                  </Text>

                </View>
              )}

            </Pressable>

          </View>
        )}

      </ScrollView>

    </View>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between">

      <Text className="text-sm text-slate-400">
        {label}
      </Text>

      <Text
        className="ml-4 flex-1 text-right text-sm font-semibold text-slate-800"
        numberOfLines={1}
      >
        {value}
      </Text>

    </View>
  );
}