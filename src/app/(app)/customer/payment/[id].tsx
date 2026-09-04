import AppAlert from "@/components/ui/AppAlert";
import {
  type Customer,
  CustomerAccount,
  getCustomerAccount,
  getCustomerById,
  getCustomerPayments,
  type Payment,
} from "@/lib/customers";
import {
  createPayment,
  type PaymentMethod,
} from "@/lib/payments";
import { getSales, Sale } from "@/lib/sales";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
const PAYMENT_METHODS: {
  label: string;
  value: PaymentMethod;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    label: "Cash",
    value: "cash",
    icon: "cash-outline",
  },
  {
    label: "Card",
    value: "card",
    icon: "card-outline",
  },
  {
    label: "Mobile Money",
    value: "mobile_money",
    icon: "phone-portrait-outline",
  },
  {
    label: "Bank Transfer",
    value: "bank_transfer",
    icon: "business-outline",
  },
  {
    label: "Other",
    value: "other",
    icon: "wallet-outline",
  },
];


export default function CustomerPaymentScreen() {

  
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] =  useState(0);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =  useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] =  useState(new Date());
  const [showDatePicker, setShowDatePicker] =  useState(false);
  const [reference, setReference] =  useState("");
  const [notes, setNotes] =   useState("");
  const [loading, setLoading] =    useState(true);
  const [processing, setProcessing] =   useState(false);
  const [sales, setSales] =  useState<Sale[]>([]);
  const [account, setAccount] =  useState<CustomerAccount | null>(null);
  const [payments, setPayments] =  useState<Payment[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("success");

  /* =====================================================
     LOAD CUSTOMER
  ===================================================== */

  useEffect(() => {
    async function loadCustomer() {
      try {
        if (!id) {
          throw new Error(
            "Customer ID is missing."
          );
        }

       const [
  customerData,
  salesData,
  accountData,
  paymentData,
          ] = await Promise.all([
            getCustomerById(id),
            getSales(),
            getCustomerAccount(id),
            getCustomerPayments(id),
          ]);

          setCustomer(customerData);

          const customerSales = salesData.filter(
              (sale) => sale.customer_id === id
            );

          setSales(customerSales);

          setAccount(accountData);

          setPayments(paymentData);

        setAccount(accountData);

        setCustomer(customerData);

        setBalance(
          accountData.outstandingBalance
        );
      } catch (error) {
        console.error(
          "LOAD CUSTOMER PAYMENT ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id]);

  /* =====================================================
     SANITIZE AMOUNT
  ===================================================== */

  function handleAmountChange(
    value: string
  ) {
    // Numbers only
    const sanitized =
      value.replace(/[^0-9.]/g, "");

    // Allow only one decimal point
    const parts =
      sanitized.split(".");

    if (parts.length > 2) {
      return;
    }

    setAmount(sanitized);
  }
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
  /* =====================================================
     FORMAT MONEY
  ===================================================== */

  function formatMoney(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-TZ"
    ).format(value);
  }

  /* =====================================================
     COMPLETE PAYMENT
  ===================================================== */


async function handlePayment() {
  const network = await NetInfo.fetch();

  if (!network.isConnected) {
    showAlert(
      "You're offline",
      "You need an internet connection to record a payment.",
      "warning"
    );
    return;
  }

  const paymentAmount = Number(amount);
    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return;
    }

    if (paymentAmount > balance) {
      return;
    }

    if (!id) {
      return;
    }

    try {
      setProcessing(true);

      console.log(
        "CREATING CUSTOMER PAYMENT..."
      );

      console.log(
        "CUSTOMER:",
        customer?.name
      );

      console.log(
        "AMOUNT:",
        paymentAmount
      );

      console.log(
        "METHOD:",
        paymentMethod
      );

      /*
       * A customer payment must be attached
       * to an existing sale.
       *
       * For now we use the customer's
       * outstanding balance and find the
       * oldest unpaid completed sale.
       */

      const { data: sales, error: salesError } =
        await supabase
          .from("sales")
          .select(`
            id,
            total,
            status,
            sale_date
          `)
          .eq("customer_id", id)
          .eq("status", "completed")
          .order("sale_date", {
            ascending: true,
          });

      if (salesError) {
        throw salesError;
      }

      if (!sales || sales.length === 0) {
        throw new Error(
          "No completed sales found for this customer."
        );
      }

      let remaining =
        paymentAmount;

      for (const sale of sales) {
        if (remaining <= 0) {
          break;
        }

        const {
          data: existingPayments,
          error: paymentsError,
        } = await supabase
          .from("payments")
          .select("amount")
          .eq("sale_id", sale.id);

        if (paymentsError) {
          throw paymentsError;
        }

        const paid =
          (existingPayments ?? []).reduce(
            (sum, payment) =>
              sum + Number(payment.amount),
            0
          );

        const saleBalance =
          Math.max(
            Number(sale.total) - paid,
            0
          );

        if (saleBalance <= 0) {
          continue;
        }

        const amountForSale =
          Math.min(
            remaining,
            saleBalance
          );

        await createPayment({
          saleId: sale.id,
          amount: amountForSale,
          paymentMethod,
          paymentDate:
            paymentDate.toISOString(),
          reference:
            reference.trim() || null,
          notes:
            notes.trim() || null,
        });

        remaining -=
          amountForSale;
      }

      if (remaining > 0) {
        throw new Error(
          "Unable to allocate the full payment."
        );
      }

      console.log(
        "CUSTOMER PAYMENT CREATED"
      );

      router.back();
    } catch (error) {
      console.error(
        "CREATE CUSTOMER PAYMENT ERROR:",
        error
      );
    } finally {
      setProcessing(false);
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

  return (
    <View className="flex-1 bg-slate-50">

      {/* =================================================
          STATIC HEADER
      ================================================= */}

      <View className="bg-slate-50 px-5 pb-4 pt-14">

        <View className="flex-row items-center">

          <Pressable
            onPress={() =>
              router.back()
            }
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0f172a"
            />
          </Pressable>

          <View className="flex-1">

            <Text className="text-3xl font-bold text-slate-950">
              Make Payment
            </Text>

            <Text className="mt-1 text-sm text-slate-400">
              Record customer payment
            </Text>

          </View>

        </View>

      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 120,
          }}
        >

          {/* CUSTOMER */}

          <View className="rounded-3xl bg-white p-5">

            <Text className="text-xs font-bold text-slate-400">
              CUSTOMER
            </Text>

            <Text className="mt-2 text-xl font-bold text-slate-950">
              {customer?.name}
            </Text>

            {customer?.phone && (
              <Text className="mt-1 text-sm text-slate-400">
                {customer.phone}
              </Text>
            )}

          </View>

          {/* BALANCE */}

          <View className="mt-4 rounded-3xl bg-orange-50 p-5">

            <Text className="text-xs font-bold text-orange-500">
              OUTSTANDING BALANCE
            </Text>

            <Text className="mt-2 text-3xl font-bold text-orange-700">
              TZ{" "}
              {formatMoney(balance)}
            </Text>

          </View>

          {/* AMOUNT */}

          <View className="mt-5">

            <Text className="mb-2 text-sm font-bold text-slate-700">
              Payment Amount
            </Text>

            <View className="flex-row items-center rounded-2xl bg-white px-4">

              <Text className="text-sm font-semibold text-slate-400">
                TZS
              </Text>

              <TextInput
                value={amount}
                onChangeText={
                  handleAmountChange
                }
                placeholder="0"
                placeholderTextColor="#cbd5e1"
                keyboardType="decimal-pad"
                className="ml-3 flex-1 py-4 text-lg font-semibold text-slate-900"
              />

              {balance > 0 && (
                <Pressable
                  onPress={() =>
                    setAmount(
                      String(balance)
                    )
                  }
                >
                  <Text className="text-xs font-bold text-slate-500">
                    FULL
                  </Text>
                </Pressable>
              )}

            </View>

            {Number(amount) >
              balance && (
              <Text className="mt-2 text-xs font-medium text-red-500">
                Payment cannot exceed the outstanding balance.
              </Text>
            )}

          </View>

          {/* PAYMENT METHOD */}

          <View className="mt-5">

            <Text className="mb-3 text-sm font-bold text-slate-700">
              Payment Method
            </Text>

            <View className="flex-row flex-wrap gap-2">

              {PAYMENT_METHODS.map(
                (method) => {
                  const selected =
                    paymentMethod ===
                    method.value;

                  return (
                    <Pressable
                      key={
                        method.value
                      }
                      onPress={() =>
                        setPaymentMethod(
                          method.value
                        )
                      }
                      className={`w-[48%] rounded-2xl p-4 ${
                        selected
                          ? "bg-slate-950"
                          : "bg-white"
                      }`}
                    >

                      <Ionicons
                        name={method.icon}
                        size={21}
                        color={
                          selected
                            ? "white"
                            : "#0f172a"
                        }
                      />

                      <Text
                        className={`mt-2 text-sm font-semibold ${
                          selected
                            ? "text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {method.label}
                      </Text>

                    </Pressable>
                  );
                }
              )}

            </View>

          </View>

          {/* DATE */}

          <View className="mt-5">

            <Text className="mb-2 text-sm font-bold text-slate-700">
              Payment Date
            </Text>

            <Pressable
              onPress={() =>
                setShowDatePicker(true)
              }
              className="flex-row items-center rounded-2xl bg-white px-4 py-4"
            >

              <Ionicons
                name="calendar-outline"
                size={21}
                color="#64748b"
              />

              <Text className="ml-3 flex-1 text-base font-semibold text-slate-800">
                {paymentDate.toLocaleDateString(
                  "en-TZ",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </Text>

              <Ionicons
                name="chevron-down"
                size={18}
                color="#94a3b8"
              />

            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                maximumDate={
                  new Date()
                }
                onChange={(
                  _event,
                  selectedDate
                ) => {
                  setShowDatePicker(
                    false
                  );

                  if (selectedDate) {
                    setPaymentDate(
                      selectedDate
                    );
                  }
                }}
              />
            )}

          </View>

          {/* REFERENCE */}

          <View className="mt-5">

            <Text className="mb-2 text-sm font-bold text-slate-700">
              Reference
            </Text>

            <TextInput
              value={reference}
              onChangeText={(value) =>
                setReference(
                  value.trimStart()
                )
              }
              placeholder="e.g. transaction number"
              placeholderTextColor="#94a3b8"
              className="rounded-2xl bg-white px-4 py-4 text-base text-slate-900"
            />

          </View>

          {/* NOTES */}

          <View className="mt-5">

            <Text className="mb-2 text-sm font-bold text-slate-700">
              Notes
            </Text>

            <TextInput
              value={notes}
              onChangeText={(value) =>
                setNotes(
                  value.trimStart()
                )
              }
              placeholder="Optional notes"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              className="min-h-[100px] rounded-2xl bg-white px-4 py-4 text-base text-slate-900"
            />

          </View>

          {/* BUTTON */}

          <Pressable
            disabled={
              processing ||
              balance <= 0 ||
              Number(amount) <= 0 ||
              Number(amount) >
                balance
            }
            onPress={
              handlePayment
            }
            className={`mt-6 items-center rounded-2xl py-4 ${
              processing ||
              balance <= 0 ||
              Number(amount) <= 0 ||
              Number(amount) >
                balance
                ? "bg-slate-300"
                : "bg-slate-950"
            }`}
          >

            {processing ? (
              <ActivityIndicator
                color="white"
              />
            ) : (
              <View className="flex-row items-center">

                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="white"
                />

                <Text className="ml-2 text-base font-bold text-white">
                  Record Payment
                </Text>

              </View>
            )}

          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
        <AppAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          onClose={() => setAlertVisible(false)}
        />
    </View>
  );
}