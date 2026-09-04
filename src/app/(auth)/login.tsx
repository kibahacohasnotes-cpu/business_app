import { useTheme } from "@/context/ThemeContext";
import { signIn } from "@/lib/auth";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import React, { useRef, useState } from "react";
import AppAlert from "@/components/ui/AppAlert";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import OfflineBanner from "@/components/ui/OfflineBanner";

const { width } = Dimensions.get("window");

type Slide = {
  id: string;
  image: any;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    id: "1",
    image: require("../../../assets/apps/1.jpg"),
    title: "Manage your business",
    description:
      "Keep your products, customers, sales and business information organized in one place.",
  },
  {
    id: "2",
    image: require("../../../assets/apps/2.jpg"),
    title: "Track your products",
    description:
      "Monitor your stock, prices and low-stock products so you always know what's happening.",
  },
  {
    id: "3",
    image: require("../../../assets/apps/3.jpg"),
    title: "Understand your business",
    description:
      "Get a clear overview of your business performance from your dashboard.",
  },
  {
    id: "4",
    image: require("../../../assets/apps/4.jpg"),
    title: "Understand your business",
    description: "Sales Tracking.",
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { isDark } = useTheme();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning"
  >("error");

  function showAlert(
    title: string,
    message: string,
    type: "success" | "error" | "warning" = "error"
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  }

  function handleScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);

    if (index !== currentSlide) {
      setCurrentSlide(index);
    }
  }

  function nextSlide() {
    if (currentSlide < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentSlide + 1,
        animated: true,
      });
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      showAlert(
        "Missing information",
        "Enter your email and password.",
        "warning"
      );
      return;
    }

    try {
      const network = await NetInfo.fetch();

      if (!network.isConnected) {
        showAlert(
          "You're offline",
          "Please connect to the internet before signing in.",
          "warning"
        );
        return;
      }

      setLoading(true);

      await signIn(email, password);

      router.replace("/");
    } catch (error: any) {
      showAlert(
        "Login failed",
        error?.message ?? "Unable to sign in.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------
  // LOGIN FORM
  // -----------------------------------------

  if (showLogin) {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          justifyContent: "center",
          backgroundColor: isDark ? "#020617" : "#ffffff",
        }}
      >
        {/* Back button */}

        <TouchableOpacity
          onPress={() => setShowLogin(false)}
          style={{
            position: "absolute",
            top: 55,
            left: 24,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#ffffff" : "#111111"}
          />
        </TouchableOpacity>

        <View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              marginBottom: 8,
              color: isDark ? "#ffffff" : "#111111",
            }}
          >
            Welcome back
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: isDark ? "#94a3b8" : "#666666",
              marginBottom: 32,
            }}
          >
            Sign in to your business account
          </Text>

          <OfflineBanner />

          {/* Email */}

          <TextInput
            placeholder="Email"
            placeholderTextColor={
              isDark ? "#64748b" : "#888888"
            }
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#dddddd",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              color: isDark ? "#ffffff" : "#111111",
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
            }}
          />

          {/* Password */}

          <TextInput
            placeholder="Password"
            placeholderTextColor={
              isDark ? "#64748b" : "#888888"
            }
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#dddddd",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              color: isDark ? "#ffffff" : "#111111",
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
            }}
          />

          {/* Login button */}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: isDark ? "#ffffff" : "#111111",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator
                color={isDark ? "#111111" : "#ffffff"}
              />
            ) : (
              <Text
                style={{
                  color: isDark ? "#111111" : "#ffffff",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Register */}

          <TouchableOpacity
            onPress={() => router.push("/register")}
            style={{
              marginTop: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: isDark ? "#94a3b8" : "#555555",
              }}
            >
              Don't have an account?{" "}
              <Text
                style={{
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#111111",
                }}
              >
                Create one
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <AppAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  }

  // -----------------------------------------
  // CAROUSEL
  // -----------------------------------------

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? "#020617" : "#ffffff",
      }}
    >
      {/* Logo / brand */}

      <View
        style={{
          alignItems: "center",
          marginTop: 80,
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: isDark ? "#ffffff" : "#111111",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Ionicons
            name="business"
            size={38}
            color={isDark ? "#111111" : "#ffffff"}
          />
        </View>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: isDark ? "#ffffff" : "#111111",
          }}
        >
          Business Manager
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: isDark ? "#94a3b8" : "#777777",
            marginTop: 6,
            textAlign: "center",
          }}
        >
          Everything your business needs, in one place.
        </Text>
      </View>

      {/* Carousel */}

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 45,
            }}
          >
            <View
              style={{
                width: 280,
                height: 190,
                borderRadius: 24,
                overflow: "hidden",
                marginBottom: 30,
                backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
              }}
            >
              <Image
                source={item.image}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>

            <Text
              style={{
                fontSize: 25,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#111111",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {item.title}
            </Text>

            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: isDark ? "#94a3b8" : "#777777",
                textAlign: "center",
              }}
            >
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Dots */}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 25,
        }}
      >
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            style={{
              width: index === currentSlide ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                index === currentSlide
                  ? isDark
                    ? "#ffffff"
                    : "#111111"
                  : isDark
                    ? "#475569"
                    : "#d1d5db",
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>

      {/* Login button */}

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 25,
        }}
      >
        <TouchableOpacity
          onPress={() => setShowLogin(true)}
          style={{
            backgroundColor: isDark ? "#ffffff" : "#111111",
            padding: 17,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: isDark ? "#111111" : "#ffffff",
              fontSize: 17,
              fontWeight: "700",
            }}
          >
            Login
          </Text>
        </TouchableOpacity>

        {/* Register */}

        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={{
            marginTop: 18,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: isDark ? "#94a3b8" : "#666666",
              fontSize: 15,
            }}
          >
            Don't have an account?{" "}
            <Text
              style={{
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#111111",
              }}
            >
              Create one
            </Text>
          </Text>
        </TouchableOpacity>

        <AppAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    </View>
  );
}