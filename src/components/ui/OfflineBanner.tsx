import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    NetInfo.fetch().then((state) => {
      if (!mounted) return;

      setIsConnected(state.isConnected ?? false);
      setChecked(true);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!mounted) return;

      setIsConnected(state.isConnected ?? false);
      setChecked(true);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Don't show anything until the first network check completes
  if (!checked || isConnected) {
    return null;
  }

  return (
    <View className="mx-4 mb-3 flex-row items-center rounded-2xl bg-red-50 px-4 py-3">
      <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-red-100">
        <Ionicons
          name="cloud-offline-outline"
          size={20}
          color="#dc2626"
        />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-bold text-red-700">
          You're offline
        </Text>

        <Text className="mt-0.5 text-xs text-red-600">
          Check your internet connection.
        </Text>
      </View>
    </View>
  );
}