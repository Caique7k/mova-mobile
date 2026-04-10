import { LogisticTabBar } from "@/components/logistic-tab-bar";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import {
  canViewCompanyProfileTab,
  canViewCompanyTab,
  canViewDashboardTab,
  canViewLiveLocation,
  getCompanyTabTitle,
  getPrimarySessionRole,
  shouldShowRoleHub,
} from "@/services/auth";
import { Tabs } from "expo-router";
import {
  Building,
  Building2,
  CircleUser,
  Compass,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPinned,
  NotebookPen,
  UserRound,
} from "lucide";
import React from "react";

const TAB_ACCENT_COLOR = "#FC7C3A";

export default function TabLayout() {
  const { session } = useAuth();
  const showCompanyProfileTab = canViewCompanyProfileTab(session);
  const showDashboardTab = canViewDashboardTab(session);
  const showLocationTab = canViewLiveLocation(session);
  const showCompanyTab = canViewCompanyTab(session);
  const showRoleHubTab = shouldShowRoleHub(session);
  const primaryRole = getPrimarySessionRole(session);
  const roleHubTitle = primaryRole === "PLATFORM_ADMIN" ? "Empresas" : "Perfil";
  const companyTabTitle = getCompanyTabTitle(session);
  const isCoordinator = primaryRole === "COORDINATOR";

  return (
    <Tabs
      tabBar={(props) => <LogisticTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: "#f8fafc",
        },
        tabBarActiveTintColor: TAB_ACCENT_COLOR,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: "#374151",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: showDashboardTab ? undefined : null,
          title: "Dashboard",
          tabBarIcon: ({ color, focused, size }) => (
            <LucideIcon
              color={color}
              icon={focused ? LayoutDashboard : LayoutDashboard}
              size={size}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          href: showLocationTab ? undefined : null,
          title: "Localizacao",
          tabBarIcon: ({ color, focused, size }) => (
            <LucideIcon
              color={color}
              icon={focused ? MapPinned : Compass}
              size={size}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="company"
        options={{
          href: showCompanyProfileTab ? undefined : null,
          title: "Empresa",
          tabBarIcon: ({ color, focused, size }) => (
            <LucideIcon
              color={color}
              icon={focused ? Building2 : Building}
              size={size}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="empresa"
        options={{
          href: showCompanyTab ? undefined : null,
          title: companyTabTitle,
          tabBarIcon: ({ color, focused, size }) => (
            <LucideIcon
              color={color}
              icon={
                isCoordinator
                  ? GraduationCap
                  : focused
                    ? FolderKanban
                    : NotebookPen
              }
              size={size}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: showRoleHubTab ? undefined : null,
          title: roleHubTitle,
          tabBarIcon: ({ color, focused, size }) => (
            <LucideIcon
              color={color}
              icon={
                primaryRole === "PLATFORM_ADMIN"
                  ? focused
                    ? Building2
                    : Building
                  : focused
                    ? UserRound
                    : CircleUser
              }
              size={size}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: "Sair",
          tabBarIcon: ({ color, focused, size }) => (
            <LucideIcon
              color={focused ? color : "#dc2626"}
              icon={LogOut}
              size={size}
              strokeWidth={focused ? 2.4 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
