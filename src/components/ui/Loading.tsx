import React from "react";
import { ActivityIndicator, View } from "react-native";

export default function Loading() {
  return (
    <View className="flex-1 items-center justify-center ">
      <ActivityIndicator size="large" color="#0f172a" />
    </View>
  );
}