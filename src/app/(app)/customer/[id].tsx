import {
  deleteCustomer,
  getCustomerById,
  getCustomerAccount,
  type Customer,
  type CustomerAccount,
} from "@/lib/customers";
import {
  getSales,
  type Sale,
} from "@/lib/sales";
import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import AppAlert from "@/components/ui/AppAlert";
import payments from "../payments";

export default function CustomerDetailScreen() {


  const router = useRouter();
  const { id } =    useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [account, setAccount] =  useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState< "success" | "error" | "warning">("success");
  const [alertAction, setAlertAction] = useState< "close" | "delete" | "back"  >("close");

  /* =====================================================
     ALERT
  ===================================================== */

  function showAlert(
    title: string,
    message: string,
    type:
      | "success"
      | "error"
      | "warning" = "success",
    action:
      | "close"
      | "delete"
      | "back" = "close"
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertAction(action);
    setAlertVisible(true);
  }

  /* =====================================================
     LOAD CUSTOMER
  ===================================================== */

  const loadCustomer = useCallback(
    async () => {
      try {
        setLoading(true);

        if (!id) {
          throw new Error(
            "Customer ID is missing."
          );
        }

        const [
          customerData,
          salesData,
          accountData,
        ] = await Promise.all([
          getCustomerById(id),
          getSales(),
          getCustomerAccount(id),
        ]);

        setCustomer(customerData);

        const customerSales =
          salesData.filter(
            (sale) =>
              sale.customer_id === id
          );

        setSales(customerSales);

        setAccount(accountData);
      } catch (error: any) {
        console.error(
          "LOAD CUSTOMER ERROR:",
          error
        );

        showAlert(
          "Unable to load customer",
          error?.message ||
            "Something went wrong.",
          "error",
          "back"
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const completedSales = useMemo(
    () =>
      sales.filter(
        (sale) =>
          sale.status === "completed"
      ),
    [sales]
  );

  const totalSpent = useMemo(
    () =>
      completedSales.reduce(
        (sum, sale) =>
          sum + Number(sale.total),
        0
      ),
    [completedSales]
  );

  /* =====================================================
     FORMATTERS
  ===================================================== */

  function formatMoney(value: number) {
    return new Intl.NumberFormat(
      "en-TZ"
    ).format(value);
  }

  function formatDate(date: string) {
    return new Date(
      date
    ).toLocaleDateString("en-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatPaymentMethod(
    method: Sale["payment_method"]
  ) {
    if (!method) {
      return "Not specified";
    }

    return method
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  /* =====================================================
     DELETE
  ===================================================== */

  function handleDelete() {
    if (!customer) {
      return;
    }

    showAlert(
      "Delete customer?",
      `Are you sure you want to delete "${customer.name}"?`,
      "warning",
      "delete"
    );
  }

  async function confirmDelete() {
    if (!customer) {
      return;
    }

    try {
      setDeleting(true);

      await deleteCustomer(
        customer.id
      );

      setAlertVisible(false);

      showAlert(
        "Customer deleted",
        "The customer has been removed successfully.",
        "success",
        "back"
      );
    } catch (error: any) {
      console.error(
        "DELETE CUSTOMER ERROR:",
        error
      );

      setAlertVisible(false);

      showAlert(
        "Unable to delete customer",
        error?.message ||
          "Something went wrong.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleAlertClose() {
    setAlertVisible(false);

    if (alertAction === "back") {
      router.back();
    }

    if (alertAction === "delete") {
      confirmDelete();
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
          Loading customer...
        </Text>

      </View>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!customer) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">

        <Ionicons
          name="person-outline"
          size={50}
          color="#94a3b8"
        />

        <Text className="mt-4 text-xl font-bold text-slate-900">
          Customer not found
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

            <Text
              className="text-3xl font-bold text-slate-950"
              numberOfLines={1}
            >
              {customer.name}
            </Text>

            <Text className="mt-1 text-sm text-slate-400">
              Customer details
            </Text>

          </View>

          {/* EDIT */}

          <Pressable
            onPress={() =>
              router.push({
                pathname:
                  "/edit-customer/[id]",
                params: {
                  id: customer.id,
                },
              })
            }
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white active:opacity-70"
          >
            <Ionicons
              name="create-outline"
              size={21}
              color="#0f172a"
            />
          </Pressable>

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

        {/* CUSTOMER INFO */}

        <View className="rounded-3xl bg-white p-5">

          <View className="flex-row items-center">

            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

              <Ionicons
                name="person-outline"
                size={30}
                color="#0f172a"
              />

            </View>

            <View className="ml-4 flex-1">

              <Text className="text-xl font-bold text-slate-950">
                {customer.name}
              </Text>

              <Text className="mt-1 text-sm text-slate-400">
                Customer
              </Text>

            </View>

          </View>

          {/* CONTACT */}

          <View className="mt-5">

            {customer.phone && (
              <View className="mb-3 flex-row items-center">

                <Ionicons
                  name="call-outline"
                  size={19}
                  color="#64748b"
                />

                <Text className="ml-3 text-sm text-slate-700">
                  {customer.phone}
                </Text>

              </View>
            )}

            {customer.email && (
              <View className="mb-3 flex-row items-center">

                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#64748b"
                />

                <Text
                  className="ml-3 flex-1 text-sm text-slate-700"
                  numberOfLines={1}
                >
                  {customer.email}
                </Text>

              </View>
            )}

            {customer.address && (
              <View className="flex-row items-start">

                <Ionicons
                  name="location-outline"
                  size={19}
                  color="#64748b"
                />

                <Text className="ml-3 flex-1 text-sm leading-5 text-slate-700">
                  {customer.address}
                </Text>

              </View>
            )}

          </View>

        </View>


      {/* =================================================
          ACCOUNT SUMMARY
      ================================================= */}

      {account && (
        <View className="mt-5">

          <Text className="mb-3 text-lg font-bold text-slate-900">
            Account
          </Text>

          {/* PURCHASES + PAID */}

          <View className="flex-row gap-3">

            {/* TOTAL PURCHASES */}

            <View className="flex-1 rounded-3xl bg-slate-950 p-5">

              <Text className="text-xs font-medium text-slate-400">
                TOTAL PURCHASES
              </Text>

              <Text
                className="mt-2 text-lg font-bold text-white"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                TZS{" "}
                {formatMoney(
                  account.totalPurchases
                )}
              </Text>

            </View>

            {/* TOTAL PAID */}

            <View className="flex-1 rounded-3xl bg-white p-5">

              <Text className="text-xs font-medium text-slate-400">
                TOTAL PAID
              </Text>

              <Text
                className="mt-2 text-lg font-bold text-slate-950"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                TZS{" "}
                {formatMoney(
                  account.totalPaid
                )}
              </Text>

            </View>

          </View>

          {/* OUTSTANDING BALANCE */}

          {account &&
          account.outstandingBalance > 0 && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname:
                    "/customer/payment/[id]",
                  params: {
                    id: customer.id,
                  },
                })
              }
              className="mt-3 flex-row items-center justify-center rounded-2xl bg-slate-950 py-4"
            >
              <Ionicons
                name="wallet-outline"
                size={20}
                color="white"
              />

              <Text className="ml-2 text-sm font-bold text-white">
                Make Payment
              </Text>
            </Pressable>
          )}

          <View className="mt-3 rounded-3xl bg-orange-50 p-5">

            <View className="flex-row items-center">

              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">

                <Ionicons
                  name="wallet-outline"
                  size={23}
                  color="#ea580c"
                />

              </View>

              <View className="ml-4 flex-1">

                <Text className="text-xs font-bold text-orange-500">
                  OUTSTANDING BALANCE
                </Text>

                <Text className="mt-1 text-2xl font-bold text-orange-700">
                  TZS{" "}
                  {formatMoney(
                    account.outstandingBalance
                  )}
                </Text>

              </View>

            </View>

          </View>

        </View>
      )}


        {/* =================================================
            PURCHASE HISTORY
        ================================================= */}

        <View className="mt-7">

          <View className="mb-3 flex-row items-center justify-between">

            <Text className="text-lg font-bold text-slate-900">
              Purchase history
            </Text>

            <Text className="text-sm text-slate-400">
              {completedSales.length}{" "}
              {completedSales.length === 1
                ? "sale"
                : "sales"}
            </Text>

          </View>

          {completedSales.length === 0 ? (
            <View className="items-center rounded-3xl bg-white px-6 py-12">

              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                <Ionicons
                  name="receipt-outline"
                  size={30}
                  color="#64748b"
                />

              </View>

              <Text className="mt-5 text-lg font-bold text-slate-900">
                No purchases yet
              </Text>

              <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
                Completed sales for this customer will appear here.
              </Text>

            </View>
          ) : (
            completedSales.map((sale) => (

          <Pressable
                key={sale.id}
                onPress={() =>
                router.push({
                pathname: "/sale/[id]",
                params: {
                id: sale.id,
                },
                })
                }
                className="mb-3 rounded-3xl bg-white p-5 active:opacity-70"
                >
                {/* SALE HEADER */}

                <View className="flex-row items-start">

                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Ionicons
                name="receipt-outline"
                size={22}
                color="#0f172a"
                />
                </View>

                <View className="ml-4 flex-1">

                <Text className="text-base font-bold text-slate-900">
                Sale
                </Text>

                <Text className="mt-1 text-xs text-slate-400">
                {formatDate(sale.sale_date)}
                </Text>

                <Text className="mt-2 text-xs font-medium text-slate-500">
                {formatPaymentMethod(
                sale.payment_method
                )}
                </Text>

                </View>

                <View className="items-end">

                <Text className="text-base font-bold text-slate-950">
                TZS{" "}
                {formatMoney(
                Number(sale.total)
                )}
                </Text>

                <Ionicons
                name="chevron-forward"
                size={18}
                color="#94a3b8"
                style={{
                marginTop: 8,
                }}
                />

                </View>

                </View>

                {/* PRODUCTS */}

                {sale.sale_items &&
                sale.sale_items.length > 0 && (
                <View className="mt-4 rounded-2xl bg-slate-50 p-4">

                <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Products
                </Text>

                {sale.sale_items.map(
                (item, index) => (
                  <View
                    key={`${sale.id}-${index}`}
                    className={`flex-row items-center ${
                      index !==
                      sale.sale_items!.length - 1
                        ? "mb-2"
                        : ""
                    }`}
                  >

                    <View className="h-2 w-2 rounded-full bg-slate-400" />

                    <Text
                      className="ml-3 flex-1 text-sm font-medium text-slate-700"
                      numberOfLines={1}
                    >
                      {item.product_name}
                    </Text>

                    <Text className="ml-3 text-xs font-semibold text-slate-400">
                      × {Number(item.qty)}
                    </Text>

                  </View>
                )
                )}

                </View>
                )}

                {/* DISCOUNT */}

                {Number(sale.discount) > 0 && (
                <View className="mt-3 flex-row items-center">

                <Ionicons
                name="pricetag-outline"
                size={14}
                color="#64748b"
                />

                <Text className="ml-2 text-xs text-slate-500">
                Discount: TZS{" "}
                {formatMoney(
                Number(sale.discount)
                )}
                </Text>

                </View>
                )}

          </Pressable>

            ))
          )}

        </View>


        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        {payments.length > 0 && (
          <View className="mt-6">

            <View className="mb-3 flex-row items-center justify-between">

              <Text className="text-lg font-bold text-slate-900">
                Payment History
              </Text>

              <Text className="text-xs font-medium text-slate-400">
                {payments.length} payment
                {payments.length !== 1
                  ? "s"
                  : ""}
              </Text>

            </View>

            <View className="rounded-3xl bg-white p-5">

              {payments.map(
                (payment: { id: React.Key | null | undefined; payment_method: string; payment_date: string; reference: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; amount: any; }, index: number) => (
                  <Pressable
                    key={payment.id}
                    onPress={() =>
                      router.push({
                        pathname:
                          "/payment/[id]",
                        params: {
                          id: payment.id,
                        },
                      })
                    }
                    className={
                      index !==
                      payments.length - 1
                        ? "mb-5"
                        : ""
                    }
                  >

                    <View className="flex-row items-center">

                      {/* ICON */}

                      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">

                        <Ionicons
                          name={
                            payment.payment_method ===
                            "cash"
                              ? "cash-outline"
                              : payment.payment_method ===
                                "card"
                              ? "card-outline"
                              : payment.payment_method ===
                                "mobile_money"
                              ? "phone-portrait-outline"
                              : "wallet-outline"
                          }
                          size={20}
                          color="#0f172a"
                        />

                      </View>

                      {/* INFO */}

                      <View className="ml-4 flex-1">

                        <Text className="text-sm font-bold text-slate-900">
                          {payment.payment_method
                            .replace("_", " ")
                            .replace(
                              /\b\w/g,
                              (char: string) =>
                                char.toUpperCase()
                            )}
                        </Text>

                        <Text className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            payment.payment_date
                          )}
                        </Text>

                        {payment.reference && (
                          <Text
                            className="mt-1 text-xs text-slate-400"
                            numberOfLines={1}
                          >
                            Ref:{" "}
                            {payment.reference}
                          </Text>
                        )}

                      </View>

                      {/* AMOUNT */}

                      <View className="items-end">

                        <Text className="text-sm font-bold text-green-600">
                          + TZS{" "}
                          {formatMoney(
                            Number(
                              payment.amount
                            )
                          )}
                        </Text>

                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#cbd5e1"
                          style={{
                            marginTop: 4,
                          }}
                        />

                      </View>

                    </View>

                  </Pressable>
                )
              )}

            </View>

          </View>
        )}

        {/* =================================================
            DELETE
        ================================================= */}

        <Pressable
          disabled={deleting}
          onPress={handleDelete}
          className="mt-5 items-center rounded-2xl bg-red-50 py-4"
        >

          <View className="flex-row items-center">

            <Ionicons
              name="trash-outline"
              size={20}
              color="#dc2626"
            />

            <Text className="ml-2 text-base font-bold text-red-600">
              Delete Customer
            </Text>

          </View>

        </Pressable>

      </ScrollView>

      {/* =================================================
          ALERT
      ================================================= */}

      <AppAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttonText={
          alertAction === "delete"
            ? "Delete"
            : "Done"
        }
        cancelText={
          alertAction === "delete"
            ? "Cancel"
            : undefined
        }
        onClose={handleAlertClose}
        onConfirm={
          alertAction === "delete"
            ? confirmDelete
            : undefined
        }
      />

    </View>
  );
}