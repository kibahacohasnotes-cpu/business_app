import "../../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import { StatusBar as RNStatusBar } from "react-native";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

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
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="#f8fafc"
        translucent={true}
      />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  </ThemeProvider>
);
}