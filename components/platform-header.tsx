import { LucideIcon } from "@/components/ui/lucide-icon";
import { Image } from "expo-image";
import { LogOut } from "lucide";
import { Pressable, Text, View } from "react-native";

const logoUnipass = require("../assets/images/logo_unipass.png");

type PlatformHeaderProps = {
  detail?: string;
  onSignOut?: () => void | Promise<void>;
  subtitle: string;
  title: string;
};

export function PlatformHeader({
  detail,
  onSignOut,
  subtitle,
  title,
}: PlatformHeaderProps) {
  return (
    <View
      className="overflow-hidden rounded-[32px] px-5 py-5"
      style={{ backgroundColor: "#0f172a" }}
    >
      <View
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full"
        style={{ backgroundColor: "rgba(245, 158, 11, 0.16)" }}
      />
      <View
        className="absolute -left-6 bottom-0 h-24 w-24 rounded-full"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.06)" }}
      />

      <View className="flex-row items-start gap-4">
        <View className="flex-1 gap-4">
          <View className="flex-row items-center gap-3">
            <View
              className="rounded-2xl px-3 py-3"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            >
              <Image
                source={logoUnipass}
                contentFit="contain"
                style={{ width: 108, height: 28 }}
              />
            </View>

            {onSignOut ? (
              <Pressable
                accessibilityLabel="Sair"
                className="ml-auto h-11 w-11 items-center justify-center rounded-2xl"
                onPress={() => {
                  void onSignOut();
                }}
                style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              >
                <LucideIcon icon={LogOut} size={18} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>

          <View>
            <Text
              className="text-xs font-semibold uppercase tracking-[1.5px]"
              style={{ color: "#fde68a" }}
            >
              Plataforma Unipass
            </Text>
            <Text className="mt-2 text-[26px] font-bold leading-8 text-typography-0">
              {title}
            </Text>
            <Text
              className="mt-2 text-sm leading-6"
              style={{ color: "rgba(226, 232, 240, 0.92)" }}
            >
              {subtitle}
            </Text>
          </View>

          {detail ? (
            <View
              className="self-start rounded-full px-4 py-2"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: "rgba(248, 250, 252, 0.92)" }}
              >
                {detail}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
