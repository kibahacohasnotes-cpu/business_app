import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";

export default function Loading() {
  const { isDark } = useTheme();

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
      <ActivityIndicator
        size="large"
        color={isDark ? "#ffffff" : "#0f172a"}
      />
    </View>
  );
}