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
import * as Print from "expo-print";

import { getMyBusiness } from "@/lib/business";
import { useTheme } from "@/context/ThemeContext";
import { Image } from "expo-image";
export default function PaymentDetailsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [payment, setPayment] =
    useState<Payment | null>(null);

  const [sale, setSale] =
    useState<Sale | null>(null);

  const [saleItems, setSaleItems] =
    useState<SaleItem[]>([]);

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [business, setBusiness] = useState<{
    name: string;
    currency: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [receiptLoading, setReceiptLoading] =
    useState(false);

  const [printingReceipt, setPrintingReceipt] =
    useState(false);

  const iconColor = isDark
    ? "#ffffff"
    : "#0f172a";

  const secondaryIconColor = isDark
    ? "#94a3b8"
    : "#64748b";

  /* =====================================================
     LOAD PAYMENT
  ===================================================== */

  const loadPayment = useCallback(
    async () => {
      try {
        setLoading(true);

        const businessData =
          await getMyBusiness();

        if (businessData) {
          setBusiness({
            name: businessData.name,
            currency:
              businessData.currency || "TZS",
            phone: businessData.phone,
            email: businessData.email,
            address: businessData.address,
          });
        }

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
     PRINT RECEIPT
  ===================================================== */

  function escapeHtml(value: unknown) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function getReceiptImageDataUrl(
    url: string
  ): Promise<string | null> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Receipt image request failed: ${response.status}`
        );
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || "image/jpeg";

      const arrayBuffer =
        await response.arrayBuffer();

      const bytes =
        new Uint8Array(arrayBuffer);

      let binary = "";

      const chunkSize = 8192;

      for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
      ) {
        const chunk =
          bytes.subarray(
            i,
            Math.min(
              i + chunkSize,
              bytes.length
            )
          );

        binary += String.fromCharCode(
          ...chunk
        );
      }

      const base64 = btoa(binary);

      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      console.warn(
        "RECEIPT IMAGE EMBED ERROR:",
        error
      );

      return null;
    }
  }

  function buildReceiptHtml(
    receiptImage: string | null
  ) {
    if (!payment || !sale) {
      throw new Error(
        "Payment information is incomplete."
      );
    }

    const currency =
      business?.currency || "TZS";

    const businessName =
      business?.name ||
      "Business Manager";

    const paymentMethod =
      formatPaymentMethod(
        payment.payment_method
      );

    const productsHtml =
      saleItems
        .map(
          (item) => `
          <tr>
            <td>
              ${escapeHtml(
                item.product_name
              )}
            </td>

            <td class="center">
              ${Number(item.qty)}
            </td>

            <td class="right">
              ${currency}
              ${formatMoney(
                Number(item.unit_price)
              )}
            </td>

            <td class="right bold">
              ${currency}
              ${formatMoney(
                Number(item.subtotal)
              )}
            </td>
          </tr>
        `
        )
        .join("");

    const uploadedReceiptHtml =
      receiptImage
        ? `
        <section class="section">
          <div class="section-title">
            Original Receipt
          </div>

          <p class="muted">
            Receipt image attached during sale
          </p>

          <div class="image-wrapper">
            <img
              src="${receiptImage}"
              class="receipt-image"
            />
          </div>
        </section>
      `
        : "";

    return `
<!DOCTYPE html>

<html>
<head>

<meta charset="UTF-8" />

<style>

@page {
  size: A4;
  margin: 28px;
}

* {
  box-sizing: border-box;
}

body {
  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color: #0f172a;
  margin: 0;
  background: white;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  padding-bottom: 22px;
  border-bottom: 1px solid #e2e8f0;
}

.business-name {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 6px;
}

.document-title {
  font-size: 13px;
  color: #64748b;
}

.receipt-label {
  text-align: right;
}

.receipt-label strong {
  display: block;
  font-size: 18px;
}

.receipt-label span {
  color: #64748b;
  font-size: 12px;
}

.info-grid {
  display: flex;
  gap: 14px;
  margin-top: 22px;
}

.info-card {
  flex: 1;
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px;
}

.label {
  color: #94a3b8;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
}

.value {
  font-size: 12px;
  font-weight: 600;
}

.section {
  margin-top: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

.customer-box {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 15px;
}

.customer-name {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 5px;
}

.muted {
  color: #64748b;
  font-size: 11px;
  margin: 4px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  font-size: 10px;
  color: #64748b;
  padding: 10px 8px;
  border-bottom: 1px solid #cbd5e1;
}

td {
  font-size: 11px;
  padding: 11px 8px;
  border-bottom: 1px solid #e2e8f0;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.bold {
  font-weight: 700;
}

.summary {
  margin-left: auto;
  width: 320px;
  margin-top: 18px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  font-size: 12px;
}

.summary-total {
  border-top: 2px solid #0f172a;
  margin-top: 5px;
  padding-top: 14px;

  display: flex;
  justify-content: space-between;

  font-size: 17px;
  font-weight: 800;
}

.payment-box {
  background: #020617;
  color: white;
  border-radius: 16px;
  padding: 18px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.payment-label {
  color: #94a3b8;
  font-size: 10px;
}

.payment-value {
  font-size: 12px;
  font-weight: 700;
}

.image-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.receipt-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.footer {
  margin-top: 35px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;

  display: flex;
  justify-content: space-between;

  color: #94a3b8;
  font-size: 10px;
}

.thank-you {
  text-align: center;
  margin-top: 28px;

  font-size: 13px;
  font-weight: 700;
}

</style>

</head>

<body>

<div class="header">

  <div>
    <div class="business-name">
      ${escapeHtml(businessName)}
    </div>

    <div class="document-title">
      Sales Receipt
    </div>

    ${
      business?.phone
        ? `<div class="muted">
             ${escapeHtml(
               business.phone
             )}
           </div>`
        : ""
    }

    ${
      business?.email
        ? `<div class="muted">
             ${escapeHtml(
               business.email
             )}
           </div>`
        : ""
    }

    ${
      business?.address
        ? `<div class="muted">
             ${escapeHtml(
               business.address
             )}
           </div>`
        : ""
    }
  </div>

  <div class="receipt-label">
    <strong>RECEIPT</strong>

    <span>
      ${escapeHtml(
        formatDate(
          payment.payment_date
        )
      )}
    </span>
  </div>

</div>

<div class="info-grid">

  <div class="info-card">
    <div class="label">
      Payment ID
    </div>

    <div class="value">
      ${escapeHtml(payment.id)}
    </div>
  </div>

  <div class="info-card">
    <div class="label">
      Sale ID
    </div>

    <div class="value">
      ${
        payment.sale_id
          ? `#${escapeHtml(
              payment.sale_id
            )}`
          : "-"
      }
    </div>
  </div>

  <div class="info-card">
    <div class="label">
      Date
    </div>

    <div class="value">
      ${escapeHtml(
        formatDate(
          payment.payment_date
        )
      )}
    </div>
  </div>

</div>

${
  customer
    ? `
<section class="section">

  <div class="section-title">
    Customer
  </div>

  <div class="customer-box">

    <div class="customer-name">
      ${escapeHtml(customer.name)}
    </div>

    ${
      customer.phone
        ? `<div class="muted">
             ${escapeHtml(
               customer.phone
             )}
           </div>`
        : ""
    }

    ${
      customer.email
        ? `<div class="muted">
             ${escapeHtml(
               customer.email
             )}
           </div>`
        : ""
    }

    ${
      customer.address
        ? `<div class="muted">
             ${escapeHtml(
               customer.address
             )}
           </div>`
        : ""
    }

  </div>

</section>
`
    : ""
}

<section class="section">

  <div class="section-title">
    Products
  </div>

  <table>

    <thead>
      <tr>
        <th>Product</th>
        <th class="center">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>

    <tbody>
      ${productsHtml}
    </tbody>

  </table>

</section>

<section class="section">

  <div class="section-title">
    Sale Summary
  </div>

  <div class="summary">

    <div class="summary-row">
      <span>Subtotal</span>

      <strong>
        ${currency}
        ${formatMoney(
          Number(sale.subtotal)
        )}
      </strong>
    </div>

    ${
      Number(sale.discount) > 0
        ? `
        <div class="summary-row">
          <span>Discount</span>

          <strong>
            - ${currency}
            ${formatMoney(
              Number(sale.discount)
            )}
          </strong>
        </div>
      `
        : ""
    }

    ${
      Number(sale.tax) > 0
        ? `
        <div class="summary-row">
          <span>Tax</span>

          <strong>
            ${currency}
            ${formatMoney(
              Number(sale.tax)
            )}
          </strong>
        </div>
      `
        : ""
    }

    <div class="summary-total">
      <span>TOTAL</span>

      <span>
        ${currency}
        ${formatMoney(
          Number(sale.total)
        )}
      </span>
    </div>

  </div>

</section>

<section class="section">

  <div class="section-title">
    Payment
  </div>

  <div class="payment-box">

    <div class="payment-row">
      <span class="payment-label">
        PAYMENT METHOD
      </span>

      <span class="payment-value">
        ${escapeHtml(paymentMethod)}
      </span>
    </div>

    ${
      payment.reference
        ? `
        <div class="payment-row">
          <span class="payment-label">
            REFERENCE
          </span>

          <span class="payment-value">
            ${escapeHtml(
              payment.reference
            )}
          </span>
        </div>
      `
        : ""
    }

    <div class="payment-row">
      <span class="payment-label">
        AMOUNT RECEIVED
      </span>

      <span class="payment-value">
        ${currency}
        ${formatMoney(
          Number(payment.amount)
        )}
      </span>
    </div>

  </div>

</section>

${uploadedReceiptHtml}

<div class="thank-you">
  Thank you for your business!
</div>

<div class="footer">

  <span>
    Generated by Business Manager
  </span>

  <span>
    ${escapeHtml(
      new Date().toLocaleDateString(
        "en-TZ"
      )
    )}
  </span>

</div>

</body>
</html>
`;
  }

  async function handlePrintReceipt() {
    if (!payment || !sale) {
      return;
    }

    try {
      setPrintingReceipt(true);

      let receiptImage:
        | string
        | null = null;

      if (sale.receipt_url) {
        const signedUrl =
          await getSaleReceiptUrl(
            sale.receipt_url
          );

        receiptImage =
          await getReceiptImageDataUrl(
            signedUrl
          );
      }

      const html =
        buildReceiptHtml(
          receiptImage
        );

      await Print.printAsync({
        html,
      });
    } catch (error) {
      console.error(
        "PRINT RECEIPT ERROR:",
        error
      );
    } finally {
      setPrintingReceipt(false);
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">

        <ActivityIndicator
          size="large"
          color={
            isDark
              ? "#ffffff"
              : "#0f172a"
          }
        />

        <Text className="mt-4 text-sm text-slate-400 dark:text-slate-500">
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
      <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">

        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">

          <Ionicons
            name="wallet-outline"
            size={30}
            color={secondaryIconColor}
          />

        </View>

        <Text className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
          Payment not found
        </Text>

        <Pressable
          onPress={() =>
            router.back()
          }
          className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 dark:bg-white"
        >
          <Text className="font-semibold text-white dark:text-slate-950">
            Go back
          </Text>
        </Pressable>

      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">

      {/* =================================================
          STATIC HEADER
      ================================================= */}

      <View className="bg-slate-50 px-5 pb-4 pt-14 dark:bg-slate-950">

        <View className="flex-row items-center">

          <Pressable
            onPress={() =>
              router.back()
            }
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70 dark:bg-slate-900"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={iconColor}
            />
          </Pressable>

          <View className="flex-1">

            <Text className="text-3xl font-bold text-slate-950 dark:text-white">
              Payment
            </Text>

            <Text className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Payment details
            </Text>

          </View>

        </View>

      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >

        {/* =================================================
            PAYMENT HERO
        ================================================= */}

        <View className="rounded-[32px] bg-slate-950 p-6 dark:bg-slate-900">

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

        <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

          <Text className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
            Transaction
          </Text>

          <InfoRow
            label="Payment ID"
            value={payment.id.slice(
              0,
              12
            )}
            isDark={isDark}
          />

          {payment.sale_id && (
            <InfoRow
              label="Sale"
              value={`#${payment.sale_id.slice(
                0,
                8
              )}`}
              isDark={isDark}
            />
          )}

          {payment.reference && (
            <InfoRow
              label="Reference"
              value={payment.reference}
              isDark={isDark}
            />
          )}

          <InfoRow
            label="Payment date"
            value={formatDate(
              payment.payment_date
            )}
            isDark={isDark}
          />

        </View>

        {/* =================================================
            CUSTOMER
        ================================================= */}

        {customer && (
          <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

            <View className="mb-5 flex-row items-center justify-between">

              <Text className="text-lg font-bold text-slate-900 dark:text-white">
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
                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  View
                </Text>
              </Pressable>

            </View>

            <View className="flex-row items-center">

              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">

                <Ionicons
                  name="person-outline"
                  size={22}
                  color={iconColor}
                />

              </View>

              <View className="ml-4 flex-1">

                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {customer.name}
                </Text>

                {customer.phone && (
                  <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {customer.phone}
                  </Text>
                )}

                {customer.email && (
                  <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
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
          <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

            <Text className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
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

                <View className="h-12 w-12 overflow-hidden items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  {item.product?.image_url ? (
                    <Image
                      source={{ uri: item.product.image_url }}
                      className="h-full w-full"
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <Ionicons
                      name="cube-outline"
                      size={19}
                      color={iconColor}
                    />
                  )}
                </View>

                  <View className="ml-3 flex-1">

                    <Text
                      className="text-sm font-semibold text-slate-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {item.product_name}
                    </Text>

                    <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {Number(item.qty)} × TZS{" "}
                      {formatMoney(
                        Number(
                          item.unit_price
                        )
                      )}
                    </Text>

                  </View>

                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
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
          <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

            <Text className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
              Sale summary
            </Text>

            <InfoRow
              label="Subtotal"
              value={`TZS ${formatMoney(
                Number(sale.subtotal)
              )}`}
              isDark={isDark}
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
                isDark={isDark}
              />
            )}

            {Number(sale.tax) > 0 && (
              <InfoRow
                label="Tax"
                value={`TZS ${formatMoney(
                  Number(sale.tax)
                )}`}
                isDark={isDark}
              />
            )}

            <View className="my-3 h-px bg-slate-100 dark:bg-slate-800" />

            <View className="flex-row items-center justify-between">

              <Text className="text-base font-bold text-slate-900 dark:text-white">
                Total
              </Text>

              <Text className="text-lg font-bold text-slate-950 dark:text-white">
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

        {sale && (
          <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-slate-900">

            <View className="flex-row items-center">

              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">

                <Ionicons
                  name="document-attach-outline"
                  size={22}
                  color={iconColor}
                />

              </View>

              <View className="ml-4 flex-1">

                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  Receipt
                </Text>

                <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
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
                  : "bg-slate-950 dark:bg-white"
              }`}
            >

              {receiptLoading ? (
                <ActivityIndicator
                  color="white"
                />
              ) : (
                <View className="flex-row items-center">

                  <Ionicons
                    name="eye-outline"
                    size={20}
                    color={
                      isDark
                        ? "#0f172a"
                        : "#ffffff"
                    }
                  />

                  <Text
                    className={`ml-2 text-sm font-bold ${
                      isDark
                        ? "text-slate-950"
                        : "text-white"
                    }`}
                  >
                    View Receipt
                  </Text>

                </View>
              )}

            </Pressable>

            <Pressable
              disabled={printingReceipt}
              onPress={
                handlePrintReceipt
              }
              className={`mt-3 items-center rounded-2xl py-4 ${
                printingReceipt
                  ? "bg-slate-400"
                  : "bg-slate-950 dark:bg-white"
              }`}
            >

              {printingReceipt ? (
                <View className="flex-row items-center">

                  <ActivityIndicator
                    color={
                      isDark
                        ? "#0f172a"
                        : "#ffffff"
                    }
                  />

                  <Text
                    className={`ml-2 text-sm font-bold ${
                      isDark
                        ? "text-slate-950"
                        : "text-white"
                    }`}
                  >
                    Preparing Receipt...
                  </Text>

                </View>
              ) : (
                <View className="flex-row items-center">

                  <Ionicons
                    name="print-outline"
                    size={20}
                    color={
                      isDark
                        ? "#0f172a"
                        : "#ffffff"
                    }
                  />

                  <Text
                    className={`ml-2 text-sm font-bold ${
                      isDark
                        ? "text-slate-950"
                        : "text-white"
                    }`}
                  >
                    Print Receipt
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
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between">

      <Text className="text-sm text-slate-400 dark:text-slate-500">
        {label}
      </Text>

      <Text
        className="ml-4 flex-1 text-right text-sm font-semibold text-slate-800 dark:text-slate-200"
        numberOfLines={1}
      >
        {value}
      </Text>

    </View>
  );
}