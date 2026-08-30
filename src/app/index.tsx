import { useAuth } from "./../context/AuthContext";
import { getUserBusiness } from "@/lib/business";
import { supabase } from "@/lib/supabase";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useEffect, useState } from "react";import React from "react";
;

export default function Index() {
  const { session, loading: authLoading } = useAuth();

  const [businessLoading, setBusinessLoading] = useState(false);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setHasBusiness(null);
      return;
    }

    let mounted = true;

    async function checkBusiness() {
      try {
        setBusinessLoading(true);

        const business = await getUserBusiness();

        if (mounted) {
          setHasBusiness(!!business);
        }
      } catch (error) {
        console.error("BUSINESS CHECK ERROR:", error);

        // If the session is invalid, sign out.
        if (mounted) {
          await supabase.auth.signOut();
          setHasBusiness(null);
        }
      } finally {
        if (mounted) {
          setBusinessLoading(false);
        }
      }
    }

    checkBusiness();

    return () => {
      mounted = false;
    };
  }, [session]);

  if (authLoading || (session && businessLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!hasBusiness) {
    return <Redirect href="/business" />;
  }

  return <Redirect href="/dashboard" />;
}