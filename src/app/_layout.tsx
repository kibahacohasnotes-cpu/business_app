import "../../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";

import { AuthProvider } from "@/context/AuthContext";

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
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}