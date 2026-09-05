import "../../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import { StatusBar as RNStatusBar } from "react-native";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <RNStatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#020617" : "#f8fafc",
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log("AUTH DEEP LINK:", url);
    };

    const subscription = Linking.addEventListener(
      "url",
      handleDeepLink
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}