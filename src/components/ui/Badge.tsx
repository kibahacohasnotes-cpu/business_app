import { Text, View } from "react-native";

type BadgeProps = {
  text: string;
  variant?: "success" | "warning" | "danger" | "neutral";
};

export default function Badge({
  text,
  variant = "neutral",
}: BadgeProps) {
  const styles = {
    success: {
      container: "bg-emerald-100",
      text: "text-emerald-700",
    },
    warning: {
      container: "bg-amber-100",
      text: "text-amber-700",
    },
    danger: {
      container: "bg-red-100",
      text: "text-red-700",
    },
    neutral: {
      container: "bg-slate-100",
      text: "text-slate-600",
    },
  };

  return (
    <View
      className={`rounded-full px-3 py-1.5 ${styles[variant].container}`}
    >
      <Text
        className={`text-xs font-semibold ${styles[variant].text}`}
      >
        {text}
      </Text>
    </View>
  );
}