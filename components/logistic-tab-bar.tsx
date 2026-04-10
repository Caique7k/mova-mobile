import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import TabBar from "@/components/logistic-fluid-bottom-navigation";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import {
  canViewCompanyProfileTab,
  canViewCompanyTab,
  canViewDashboardTab,
  canViewLiveLocation,
  shouldShowRoleHub,
} from "@/services/auth";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LogOut } from "lucide";
import { useMemo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FluidTabOption = BottomTabBarProps["descriptors"][string]["options"] & {
  href?: string | null;
};

const DEFAULT_TINT_COLOR = "#FC7C3A";

function getTabLabel(options: FluidTabOption, routeName: string) {
  if (typeof options.tabBarLabel === "string") {
    return options.tabBarLabel;
  }

  if (typeof options.title === "string") {
    return options.title;
  }

  return routeName;
}

export function LogisticTabBar({
  descriptors,
  navigation,
  state,
}: BottomTabBarProps) {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const visibleRoutes = useMemo(
    () =>
      state.routes.filter((route) => {
        const options = descriptors[route.key]?.options as FluidTabOption;

        if (options?.href === null) {
          return false;
        }

        switch (route.name) {
          case "index":
            return canViewDashboardTab(session);
          case "location":
            return canViewLiveLocation(session);
          case "company":
            return canViewCompanyProfileTab(session);
          case "empresa":
            return canViewCompanyTab(session);
          case "explore":
            return shouldShowRoleHub(session);
          default:
            return true;
        }
      }),
    [descriptors, session, state.routes],
  );

  const selectedVisibleIndex = Math.max(
    visibleRoutes.findIndex((route) => route.key === state.routes[state.index]?.key),
    0,
  );
  const selectedRoute = visibleRoutes[selectedVisibleIndex];
  const selectedOptions = selectedRoute
    ? (descriptors[selectedRoute.key]?.options as FluidTabOption | undefined)
    : undefined;
  const tintColor = selectedOptions?.tabBarActiveTintColor ?? DEFAULT_TINT_COLOR;

  const values = useMemo(() => {
    return visibleRoutes.map((route) => {
      const options = descriptors[route.key].options as FluidTabOption;
      const iconRenderer = options.tabBarIcon;

      return {
        renderIcon: ({ active, color }: { active: boolean; color: string }) => (
          iconRenderer?.({
            color,
            focused: active,
            size: 24,
          }) ?? null
        ),
        title: getTabLabel(options, route.name),
      };
    });
  }, [descriptors, visibleRoutes]);

  async function handlePress(tabIndex: number) {
    const targetRoute = visibleRoutes[tabIndex];

    if (!targetRoute) {
      return;
    }

    const targetIndex = state.routes.findIndex(
      (route) => route.key === targetRoute.key,
    );

    if (targetIndex === state.index) {
      return;
    }

    const event = navigation.emit({
      canPreventDefault: true,
      target: targetRoute.key,
      type: "tabPress",
    });

    if (event.defaultPrevented) {
      return;
    }

    if (Platform.OS === "ios" || Platform.OS === "android") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    navigation.dispatch(
      CommonActions.navigate({
        name: targetRoute.name,
        params: targetRoute.params,
      }),
    );
  }

  async function handleSignOut() {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await signOut();
    router.replace("/login");
  }

  if (values.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          paddingBottom: 0,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            paddingBottom: Math.max(insets.bottom - 2, 0),
          },
        ]}
      >
        <TabBar
          onPress={(tabIndex: number) => {
            void handlePress(tabIndex);
          }}
          selectedTab={selectedVisibleIndex}
          tintColor={tintColor}
          values={values}
        />
      </View>

      <Pressable
        accessibilityLabel="Sair da conta"
        onPress={() => {
          void handleSignOut();
        }}
        style={[
          styles.logoutButton,
          {
            bottom: Math.max(insets.bottom + 14, 14),
          },
        ]}
      >
        <LucideIcon color="#dc2626" icon={LogOut} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 10,
    marginHorizontal: 0,
    paddingTop: 0,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#fecaca",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    shadowColor: "#7f1d1d",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: 44,
  },
  wrapper: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
});
