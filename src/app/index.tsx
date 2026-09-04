import React from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { session, loading } = useAuth();

  // Only wait for Supabase to determine whether a session exists.
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // No session → Login immediately.
  if (!session) {
    return <Redirect href="/login" />;
  }

  // Session exists → authenticated area.
  return <Redirect href="/dashboard" />;
}