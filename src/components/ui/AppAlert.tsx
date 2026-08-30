import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type AppAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "warning";

  buttonText?: string;
  cancelText?: string;

  onClose: () => void;
  onConfirm?: () => void;
};

export default function AppAlert({
  visible,
  title,
  message,
  type = "success",
  buttonText = "Done",
  cancelText,
  onClose,
  onConfirm,
}: AppAlertProps) {
  const icon =
    type === "success"
      ? "checkmark-circle"
      : type === "error"
      ? "close-circle"
      : "warning";

  const iconColor =
    type === "success"
      ? "#16a34a"
      : type === "error"
      ? "#dc2626"
      : "#d97706";

  const iconBackground =
    type === "success"
      ? "bg-green-50"
      : type === "error"
      ? "bg-red-50"
      : "bg-amber-50";

  const isConfirmation = Boolean(onConfirm);

  function handleConfirm() {
    onConfirm?.();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-3xl bg-white p-6">

          {/* ICON */}

          <View className="items-center">
            <View
              className={`h-16 w-16 items-center justify-center rounded-full ${iconBackground}`}
            >
              <Ionicons
                name={icon as any}
                size={34}
                color={iconColor}
              />
            </View>
          </View>

          {/* TITLE */}

          <Text className="mt-5 text-center text-xl font-bold text-slate-950">
            {title}
          </Text>

          {/* MESSAGE */}

          <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
            {message}
          </Text>

          {/* ACTIONS */}

          {isConfirmation ? (
            <View className="mt-6 flex-row gap-3">

              {/* CANCEL */}

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.85}
                className="flex-1 items-center rounded-2xl bg-slate-100 py-4"
              >
                <Text className="text-base font-bold text-slate-700">
                  {cancelText ?? "Cancel"}
                </Text>
              </TouchableOpacity>

              {/* CONFIRM */}

              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.85}
                className={`flex-1 items-center rounded-2xl py-4 ${
                  type === "error"
                    ? "bg-red-600"
                    : "bg-slate-950"
                }`}
              >
                <Text className="text-base font-bold text-white">
                  {buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* SINGLE BUTTON */

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              className="mt-6 items-center rounded-2xl bg-slate-950 py-4"
            >
              <Text className="text-base font-bold text-white">
                {buttonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}