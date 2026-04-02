import { HapticTab } from "@/components/haptic-tab";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: "#f8fafc",
        },
        tabBarActiveTintColor: "#f59e0b",
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: "rgba(248, 250, 252, 0.72)",
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 4,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginBottom: 6,
        },
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopWidth: 0,
          bottom: 16,
          elevation: 0,
          height: 72,
          left: 16,
          paddingBottom: 8,
          paddingTop: 8,
          position: "absolute",
          right: 16,
          shadowOpacity: 0,
          borderRadius: 24,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
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
          href: null,
        }}
      />
    </Tabs>
  );
}
