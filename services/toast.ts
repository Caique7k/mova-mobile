import { Toast } from "toastify-react-native";

export type AppToastTone = "error" | "info" | "success" | "warn";

const TONE_STYLES: Record<
  AppToastTone,
  {
    backgroundColor: string;
    closeIconColor: string;
    iconColor: string;
    progressBarColor: string;
    textColor: string;
  }
> = {
  error: {
    backgroundColor: "#fef2f2",
    closeIconColor: "#b91c1c",
    iconColor: "#dc2626",
    progressBarColor: "#ef4444",
    textColor: "#7f1d1d",
  },
  info: {
    backgroundColor: "#eff6ff",
    closeIconColor: "#1d4ed8",
    iconColor: "#2563eb",
    progressBarColor: "#60a5fa",
    textColor: "#1e3a8a",
  },
  success: {
    backgroundColor: "#ecfdf5",
    closeIconColor: "#15803d",
    iconColor: "#16a34a",
    progressBarColor: "#4ade80",
    textColor: "#14532d",
  },
  warn: {
    backgroundColor: "#fff7ed",
    closeIconColor: "#c2410c",
    iconColor: "#ea580c",
    progressBarColor: "#fb923c",
    textColor: "#9a3412",
  },
};

export function hideAppToast() {
  Toast.hide();
}

export function showAppToast({
  description,
  message,
  tone,
  useModal = false,
}: {
  description?: string;
  message: string;
  tone: AppToastTone;
  useModal?: boolean;
}) {
  const style = TONE_STYLES[tone];

  Toast.hide();
  Toast.show({
    autoHide: true,
    backgroundColor: style.backgroundColor,
    closeIconColor: style.closeIconColor,
    iconColor: style.iconColor,
    position: "top",
    progressBarColor: style.progressBarColor,
    text1: message,
    text2: description,
    textColor: style.textColor,
    type: tone,
    useModal,
    visibilityTime: tone === "error" ? 4200 : 3200,
  });
}
