import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import ToastManager from "toastify-react-native";
import "@/global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <GluestackUIProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <RootNavigator />
          <ToastManager
            animationStyle="slide"
            closeIcon="close-outline"
            closeIconFamily="Ionicons"
            closeIconSize={18}
            duration={3200}
            iconFamily="Ionicons"
            icons={{
              default: "notifications",
              error: "close-circle",
              info: "information-circle",
              success: "checkmark-circle",
              warn: "warning",
            }}
            minHeight={64}
            position="top"
            showCloseIcon
            showProgressBar
            topOffset={56}
            useModal={false}
            width="92%"
          />
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );
}
