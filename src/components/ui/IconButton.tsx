import { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";
import React from "react";
type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  size?: number;
};

export default function IconButton({
  icon: Icon,
  onPress,
  size = 20,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full bg-slate-100 active:opacity-70"
    >
      <Icon size={size} color="#0f172a" />
    </Pressable>
  );
}