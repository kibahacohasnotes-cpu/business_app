import React from "react";
import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/context/AuthContext";

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Wait until Supabase restores the session.
  if (loading) {
    return null;
  }

  // Already logged in → don't show login/signup screens.
  if (session) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}