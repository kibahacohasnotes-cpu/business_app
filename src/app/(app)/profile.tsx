import AppAlert from "@/components/ui/AppAlert";
import { useTheme } from "@/context/ThemeContext";
import { getMyBusiness } from "@/lib/business";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";


type Business = {
  id: string;
  name: string;
  currency: string;

  business_type: string | null;
  description: string | null;

  phone: string | null;
  email: string | null;

  address: string | null;
  city: string | null;
  country: string | null;

  registration_number: string | null;
  website: string | null;

  avatar_url: string | null;
  cover_url: string | null;

  created_at: string;
  updated_at: string;

  role?: string;
};


import * as ImagePicker from "expo-image-picker";
import { getBusinessImageUrl, uploadBusinessAvatar, uploadBusinessCover } from "@/lib/business-images";
export default function ProfileScreen() {

const router = useRouter();
const { isDark } = useTheme();
const [avatarUrl, setAvatarUrl] =  useState<string | null>(null);
const [coverUrl, setCoverUrl] =  useState<string | null>(null);
const [uploadingImage, setUploadingImage] =  useState(false);
const [logoutAlert, setLogoutAlert] =  useState(false);
const [logoutError, setLogoutError] =  useState(false);
const [loggingOut, setLoggingOut] =  useState(false);
const [loading, setLoading] =  useState(true);
const [business, setBusiness] =  useState<Business | null>(null);
const [imageError, setImageError] =  useState(false);

// shared icon color, mirrors the dashboard's isDark ? white : slate-950 pattern
const iconColor = isDark ? "#ffffff" : "#0f172a";

  /* =====================================================
     LOAD BUSINESS
  ===================================================== */

 
useEffect(() => {
  async function loadProfile() {
    try {
      const data = await getMyBusiness();

      console.log("BUSINESS DATA:", data);

      setBusiness(data as Business | null);

      const businessData = data as Business | null;

      if (businessData?.avatar_url) {
        console.log("AVATAR PATH:", businessData.avatar_url);

        const url = await getBusinessImageUrl(
          businessData.avatar_url
        );

        console.log("AVATAR SIGNED URL:", url);

        setAvatarUrl(url);
      } else {
        console.log("NO AVATAR PATH");
      }

      if (businessData?.cover_url) {
        console.log("COVER PATH:", businessData.cover_url);

        const url = await getBusinessImageUrl(
          businessData.cover_url
        );

        console.log("COVER SIGNED URL:", url);

        setCoverUrl(url);
      } else {
        console.log("NO COVER PATH");
      }
    } catch (error) {
      console.error("LOAD PROFILE ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  loadProfile();
}, []);


  /* =====================================================
     LOGOUT
  ===================================================== */

  async function pickBusinessImage(
  type: "avatar" | "cover"
) {
  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setLogoutError(true);
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect:
          type === "avatar"
            ? [1, 1]
            : [16, 9],
        quality: 0.85,
      });

    if (
      result.canceled ||
      !result.assets?.[0]
    ) {
      return;
    }

    if (!business?.id) {
      return;
    }

    const imageUri =
      result.assets[0].uri;

    setUploadingImage(true);

    let filePath: string;

    if (type === "avatar") {
      filePath =
        await uploadBusinessAvatar(
          business.id,
          imageUri
        );
    } else {
      filePath =
        await uploadBusinessCover(
          business.id,
          imageUri
        );
    }

    /* ---------------------------------------------
       SAVE STORAGE PATH TO BUSINESS
    --------------------------------------------- */

    const column =
      type === "avatar"
        ? "avatar_url"
        : "cover_url";

    const { error } =
      await supabase
        .from("businesses")
        .update({
          [column]: filePath,
        })
        .eq(
          "id",
          business.id
        );

    if (error) {
      throw error;
    }

    /* ---------------------------------------------
       GET SIGNED URL
    --------------------------------------------- */

    const signedUrl =
      await getBusinessImageUrl(
        filePath
      );

    if (type === "avatar") {
      setAvatarUrl(signedUrl);
    } else {
      setCoverUrl(signedUrl);
    }

    setBusiness((current) =>
      current
        ? {
            ...current,
            [column]: filePath,
          }
        : current
    );

  } catch (error) {
    console.error(
      "BUSINESS IMAGE ERROR:",
      error
    );

    setImageError(true);
  } finally {
    setUploadingImage(false);
  }
}
async function handleLogout() {
  try {
    setLoggingOut(true);

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setLogoutAlert(false);

    router.replace("/login");
  } catch (error) {
    console.error(
      "LOGOUT ERROR:",
      error
    );

    setLoggingOut(false);
    setLogoutAlert(false);
    setLogoutError(true);
  }
}

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator
          size="large"
          color={iconColor}
        />

        <Text className="mt-4 text-sm text-slate-400 dark:text-slate-500">
          Loading profile...
        </Text>
      </View>
    );
  }



  /* =====================================================
     SCREEN
  ===================================================== */


return (
<View className="flex-1 bg-slate-50 dark:bg-slate-950">

  {/* STATIC COVER */}
  <View className="relative overflow-hidden rounded-b-[32px]">

    {/* Back button */}
    <Pressable
      onPress={() => router.back()}
      className="absolute left-5 top-14 z-20 h-11 w-11 items-center justify-center rounded-full bg-black/45"
    >
      <Ionicons
        name="arrow-back"
        size={22}
        color="white"
      />
    </Pressable>

    {/* Cover image */}
    <Pressable
      onPress={() => pickBusinessImage("cover")}
      disabled={uploadingImage}
      className="relative"
    >
      <View className="h-[20rem] w-full bg-gray-200 dark:bg-slate-800">

        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{
              width: "100%",
              height: "100%",
            }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full bg-gray-200 dark:bg-slate-800" />
        )}

      </View>

      {/* Camera */}
      <View className="absolute bottom-4 right-4 h-10 w-10 items-center justify-center rounded-full bg-black/60">
        <Ionicons
          name="camera-outline"
          size={20}
          color="white"
        />
      </View>

    </Pressable>

  </View>

  {/* SCROLLABLE CONTENT */}
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{
      paddingBottom: 100,
    }}
  >
{/* =================================================
    PROFILE HEADER
================================================= */}

<View>
  {/* PROFILE IMAGE */}
  <View className="items-center">




    {/* BUSINESS NAME */}

    <View className="items-center px-6 pb-7 pt-3">

      <Text
        numberOfLines={1}
        className="text-2xl font-bold text-slate-950 dark:text-white"
      >
        {business?.name || "My Business"}
      </Text>

      {business?.business_type && (
        <View className="mt-2 flex-row items-center">

          <View className="h-2 w-2 rounded-full bg-emerald-500" />

          <Text className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {business.business_type}
          </Text>

        </View>
      )}

      <Pressable
        onPress={() => router.push("/edit-profile")}
        className="mt-5 flex-row items-center rounded-2xl bg-slate-950 px-6 py-3 active:opacity-80 dark:bg-white"
      >
        <Ionicons
          name="create-outline"
          size={18}
          color={isDark ? "#0f172a" : "white"}
        />

        <Text className="ml-2 text-sm font-bold text-white dark:text-slate-950">
          Edit Profile
        </Text>
      </Pressable>

    </View>

  </View>

</View>

{/* =================================================
    BUSINESS INFORMATION
================================================= */}

<View className="px-5">

  <Text className="mb-3 text-lg font-bold text-slate-950 dark:text-white">
    Business Information
  </Text>

  <View className="overflow-hidden rounded-[28px] bg-white p-5 dark:bg-slate-900">

    {/* BUSINESS TYPE */}

    {business?.business_type && (
      <View className="flex-row items-center">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="briefcase-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            BUSINESS TYPE
          </Text>

          <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {business.business_type}
          </Text>

        </View>

      </View>
    )}


    {/* DESCRIPTION */}

    {business?.description && (
      <View className="mt-6">

        <View className="flex-row items-start">

          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Ionicons
              name="document-text-outline"
              size={21}
              color={iconColor}
            />
          </View>

          <View className="ml-4 flex-1">

            <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
              ABOUT THE BUSINESS
            </Text>

            <Text className="mt-1 text-base leading-6 text-slate-700 dark:text-slate-300">
              {business.description}
            </Text>

          </View>

        </View>

      </View>
    )}


    {/* DIVIDER */}

    {(business?.business_type ||
      business?.description) &&
      (business?.phone ||
        business?.email) && (
        <View className="my-6 h-px bg-slate-100 dark:bg-slate-800" />
      )}


    {/* PHONE */}

    {business?.phone && (
      <View className="flex-row items-center">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="call-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            PHONE
          </Text>

          <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {business.phone}
          </Text>

        </View>

      </View>
    )}


    {/* EMAIL */}

    {business?.email && (
      <View className="mt-5 flex-row items-center">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="mail-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            EMAIL
          </Text>

          <Text
            numberOfLines={1}
            className="mt-1 text-base font-semibold text-slate-900 dark:text-white"
          >
            {business.email}
          </Text>

        </View>

      </View>
    )}


    {/* LOCATION DIVIDER */}

    {(business?.phone ||
      business?.email) &&
      (business?.address ||
        business?.city ||
        business?.country) && (
        <View className="my-6 h-px bg-slate-100 dark:bg-slate-800" />
      )}


    {/* ADDRESS */}

    {business?.address && (
      <View className="flex-row items-start">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="location-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            ADDRESS
          </Text>

          <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {business.address}
          </Text>

        </View>

      </View>
    )}


    {/* CITY */}

    {business?.city && (
      <View className="mt-5 flex-row items-center">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="navigate-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            CITY
          </Text>

          <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {business.city}
          </Text>

        </View>

      </View>
    )}


    {/* COUNTRY */}

    {business?.country && (
      <View className="mt-5 flex-row items-center">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="globe-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            COUNTRY
          </Text>

          <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {business.country}
          </Text>

        </View>

      </View>
    )}

  </View>

</View>

{/* =================================================
    BUSINESS DETAILS
================================================= */}

<View className="px-5">

  <Text className="mb-3 mt-7 text-lg font-bold text-slate-950 dark:text-white">
    Business Details
  </Text>

  <View className="overflow-hidden rounded-[28px] bg-white dark:bg-slate-900">

    {/* CURRENCY */}

    <View className="flex-row items-center px-5 py-5">

      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
        <Ionicons
          name="cash-outline"
          size={21}
          color={iconColor}
        />
      </View>

      <View className="ml-4 flex-1">

        <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
          CURRENCY
        </Text>

        <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
          {business?.currency || "TZS"}
        </Text>

      </View>

    </View>


    {/* DIVIDER */}

    {(business?.registration_number ||
      business?.website) && (
      <View className="mx-5 h-px bg-slate-100 dark:bg-slate-800" />
    )}


    {/* REGISTRATION NUMBER */}

    {business?.registration_number && (
      <View className="flex-row items-center px-5 py-5">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="card-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            REGISTRATION NUMBER
          </Text>

          <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {business.registration_number}
          </Text>

        </View>

      </View>
    )}


    {/* WEBSITE */}

    {business?.website && (
      <View className="flex-row items-center px-5 py-5">

        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Ionicons
            name="link-outline"
            size={21}
            color={iconColor}
          />
        </View>

        <View className="ml-4 flex-1">

          <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
            WEBSITE / SOCIAL LINK
          </Text>

          <Text
            numberOfLines={1}
            className="mt-1 text-base font-semibold text-slate-900 dark:text-white"
          >
            {business.website}
          </Text>

        </View>

      </View>
    )}

  </View>

</View>

      {/* =================================================
          LOGOUT
      ================================================= */}

      <View className="px-5">

        <Pressable
          disabled={loggingOut}
          onPress={() =>
            setLogoutAlert(true)
          }
          className="mt-7 flex-row items-center justify-center rounded-2xl bg-red-50 py-4 active:opacity-70 dark:bg-red-950/40"
        >

          {loggingOut ? (
            <ActivityIndicator
              color="#dc2626"
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={21}
                color="#dc2626"
              />

              <Text className="ml-2 text-base font-bold text-red-600 dark:text-red-400">
                Logout
              </Text>
            </>
          )}

        </Pressable>

      </View>

    </ScrollView>

    {/* =================================================
        LOGOUT CONFIRMATION
    ================================================= */}

    <AppAlert
      visible={logoutAlert}
      title="Logout"
      message="Are you sure you want to logout of your account?"
      type="warning"
      buttonText="Logout"
      cancelText="Cancel"
      onClose={() =>
        setLogoutAlert(false)
      }
      onConfirm={handleLogout}
    />

    <AppAlert
      visible={logoutError}
      title="Logout failed"
      message="Unable to logout. Please try again."
      type="error"
      buttonText="Try Again"
      onClose={() =>
        setLogoutError(false)
      }
    />
    <AppAlert
      visible={imageError}
      title="Image upload failed"
      message="Unable to update the business image. Please try again."
      type="error"
      buttonText="Try Again"
      onClose={() =>
        setImageError(false)
      }
    />

  </View>
);
}
