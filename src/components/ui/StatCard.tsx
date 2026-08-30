import { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBackground?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBackground = "bg-slate-100",
}: StatCardProps) {
  return (
    <View className="flex-1 rounded-3xl bg-white p-5">
      <View className="flex-row items-center justify-between">
        <View
          className={`h-11 w-11 items-center justify-center rounded-2xl ${iconBackground}`}
        >
          <Icon size={21} color="#0f172a" />
        </View>
      </View>

      <Text className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </Text>

      <Text className="mt-1 text-2xl font-bold text-slate-950">
        {value}
      </Text>

      {subtitle && (
        <Text className="mt-1 text-xs text-slate-400">
          {subtitle}
        </Text>
      )}
    </View>
  );
}