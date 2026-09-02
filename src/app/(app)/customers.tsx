import {
  getCustomers,
  type Customer,
} from "@/lib/customers";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CustomersScreen() {
  const router = useRouter();

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* =====================================================
     LOAD CUSTOMERS
  ===================================================== */

  const loadCustomers = useCallback(async () => {
    try {
      const data = await getCustomers();

      setCustomers(data);
    } catch (error) {
      console.error(
        "GET CUSTOMERS ERROR:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredCustomers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const name =
        customer.name?.toLowerCase() ?? "";

      const phone =
        customer.phone?.toLowerCase() ?? "";

      const email =
        customer.email?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    });
  }, [customers, search]);

  /* =====================================================
     CUSTOMER CARD
  ===================================================== */

  function renderCustomer({
    item,
  }: {
    item: Customer;
  }) {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/customer/[id]",
            params: {
              id: item.id,
            },
          })
        }
        className="mb-3 rounded-3xl bg-white p-5 active:opacity-70"
      >
        <View className="flex-row items-center">

          {/* AVATAR */}

          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Ionicons
              name="person-outline"
              size={26}
              color="#0f172a"
            />
          </View>

          {/* CUSTOMER INFO */}

          <View className="ml-4 flex-1">

            <Text
              className="text-base font-bold text-slate-900"
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <Text
              className="mt-1 text-sm text-slate-400"
              numberOfLines={1}
            >
              {item.phone ||
                item.email ||
                "No contact information"}
            </Text>

            {item.email &&
              item.phone && (
                <Text
                  className="mt-1 text-xs text-slate-400"
                  numberOfLines={1}
                >
                  {item.email}
                </Text>
              )}

          </View>

          {/* CHEVRON */}

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#94a3b8"
          />

        </View>
      </Pressable>
    );
  }

  /* =====================================================
     SCREEN
  ===================================================== */

  return (
    <View className="flex-1 bg-slate-50">

      {/* =================================================
          STATIC HEADER
      ================================================= */}

      <View className="bg-slate-50 px-5 pb-4 pt-14">

        <View className="flex-row items-center">

          {/* BACK */}

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

          {/* TITLE */}

          <View className="flex-1">

            <Text className="text-3xl font-bold text-slate-950">
              Customers
            </Text>

            <Text className="mt-1 text-sm text-slate-400">
              Manage your customers
            </Text>

          </View>

          {/* ADD */}

          <Pressable
            onPress={() =>
              router.push("/add-customer")
            }
            className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 active:opacity-80"
          >
            <Ionicons
              name="add"
              size={25}
              color="white"
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
            value={search}
            onChangeText={setSearch}
            placeholder="Search customers..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            className="ml-3 flex-1 text-base text-slate-900"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() =>
                setSearch("")
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

      {/* =================================================
          CUSTOMER LIST
      ================================================= */}

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderCustomer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCustomers();
            }}
          />
        }
        ListHeaderComponent={
          <Text className="mb-3 mt-2 text-lg font-bold text-slate-900">
            {search
              ? "Search results"
              : "All customers"}
          </Text>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-16">

              <ActivityIndicator
                size="large"
                color="#0f172a"
              />

              <Text className="mt-4 text-sm text-slate-400">
                Loading customers...
              </Text>

            </View>
          ) : (
            <View className="items-center rounded-3xl bg-white px-6 py-12">

              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                <Ionicons
                  name="people-outline"
                  size={30}
                  color="#64748b"
                />

              </View>

              <Text className="mt-5 text-lg font-bold text-slate-900">
                {search
                  ? "No customers found"
                  : "No customers yet"}
              </Text>

              <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
                {search
                  ? "Try searching for another customer."
                  : "Add your first customer to start tracking their purchases."}
              </Text>

              {!search && (
                <Pressable
                  onPress={() =>
                    router.push("/add-customer")
                  }
                  className="mt-5 rounded-2xl bg-slate-950 px-6 py-3"
                >
                  <Text className="font-semibold text-white">
                    Add Customer
                  </Text>
                </Pressable>
              )}

            </View>
          )
        }
      />

    </View>
  );
}