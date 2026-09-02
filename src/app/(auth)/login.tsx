import { signIn } from "@/lib/auth";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
    description:
      "Sales Tracking.",
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
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
      Alert.alert(
        "Missing information",
        "Enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      await signIn(email, password);

      router.replace("/");
    } catch (error: any) {
      Alert.alert(
        "Login failed",
        error?.message ?? "Unable to sign in."
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
          backgroundColor: "#fff",
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
            backgroundColor: "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111"
          />
        </TouchableOpacity>

        <View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              marginBottom: 8,
              color: "#111",
            }}
          >
            Welcome back
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#666",
              marginBottom: 32,
            }}
          >
            Sign in to your business account
          </Text>

          {/* Email */}
          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              color: "#111",
              backgroundColor: "#fff",
            }}
          />

          {/* Password */}
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              color: "#111",
              backgroundColor: "#fff",
            }}
          />

          {/* Login button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: "#111",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
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
            <Text style={{ color: "#555" }}>
              Don't have an account?{" "}
              <Text
                style={{
                  fontWeight: "700",
                  color: "#111",
                }}
              >
                Create one
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
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
        backgroundColor: "#fff",
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
            backgroundColor: "#111",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Ionicons
            name="business"
            size={38}
            color="#fff"
          />
        </View>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: "#111",
          }}
        >
          Business Manager
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: "#777",
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
            backgroundColor: "#f3f4f6",
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
                color: "#111",
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
                color: "#777",
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
                index === currentSlide ? "#111" : "#d1d5db",
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
            backgroundColor: "#111",
            padding: 17,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
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
          <Text style={{ color: "#666", fontSize: 15 }}>
            Don't have an account?{" "}
            <Text
              style={{
                fontWeight: "700",
                color: "#111",
              }}
            >
              Create one
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}