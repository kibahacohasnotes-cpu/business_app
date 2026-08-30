import { ReactNode } from "react";
import { View } from "react-native";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <View
      className={`rounded-3xl border border-slate-200 bg-white p-5 ${className}`}
    >
      {children}
    </View>
  );
}