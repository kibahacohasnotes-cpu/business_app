import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { LucideIcon } from "lucide-react-native";
import React from "react";
type ButtonProps = {
  title: string;
  onPress: () => void;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export default function Button({
  title,
  onPress,
  icon: Icon,
  loading = false,
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  const containerStyles = {
    primary: "bg-slate-900",
    secondary: "bg-slate-100",
    danger: "bg-red-600",
    ghost: "bg-transparent",
  };

  const textStyles = {
    primary: "text-white",
    secondary: "text-slate-900",
    danger: "text-white",
    ghost: "text-slate-900",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-2xl px-5 py-4 ${containerStyles[variant]} ${
        disabled ? "opacity-50" : "active:opacity-80"
      }`}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "secondary" ? "#0f172a" : "#ffffff"}
          />
        ) : (
          <>
            {Icon && (
              <Icon
                size={19}
                color={variant === "secondary" ? "#0f172a" : "#ffffff"}
              />
            )}

            <Text
              className={`text-center text-base font-semibold ${textStyles[variant]}`}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}