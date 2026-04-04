import { useAuth } from "@/contexts/auth-context";
import { LogisticTabBar } from "@/components/logistic-tab-bar";
import {
  canManageCompany,
  canViewOperations,
  getPrimarySessionRole,
  shouldShowRoleHub,
} from "@/services/auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  const { session } = useAuth();
  const showDashboardTab = canViewOperations(session);
  const showCompanyTab = canManageCompany(session);
  const showRoleHubTab = shouldShowRoleHub(session);
  const primaryRole = getPrimarySessionRole(session);
  const roleHubTitle = primaryRole === "PLATFORM_ADMIN"
    ? "Empresas"
    : primaryRole === "USER"
      ? "Aluno"
      : "Perfil";

  return (
    <Tabs
      tabBar={(props) => <LogisticTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: "#f8fafc",
        },
        tabBarActiveTintColor: "#6d5dfc",
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: "#374151",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: showDashboardTab ? undefined : null,
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              color={color}
              name={focused ? "dashboard" : "dashboard-customize"}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="empresa"
        options={{
          href: showCompanyTab ? undefined : null,
          title: "Empresa",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              color={color}
              name={focused ? "business" : "apartment"}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: showRoleHubTab ? undefined : null,
          title: roleHubTitle,
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              color={color}
              name={
                primaryRole === "PLATFORM_ADMIN"
                  ? focused
                    ? "business"
                    : "apartment"
                  : focused
                    ? "person"
                    : "person-outline"
              }
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
