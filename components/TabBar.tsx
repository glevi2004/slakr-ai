import React from "react";
import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { HapticTab } from "@/components/HapticTab";

const ACTIVE_COLOR = "#FFFFFF";
const INACTIVE_COLOR = "#666666";
const BACKGROUND_COLOR = "#000000";

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: BACKGROUND_COLOR,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderTopColor: "#444444",
    borderLeftColor: "#444444",
    borderRightColor: "#444444",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 95,
    paddingBottom: 30,
    paddingTop: 8,
    paddingHorizontal: 5,
    shadowColor: "#E94131",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});

interface TabBarProps {
  children: React.ReactNode;
}

function TabBarComponent({ children }: TabBarProps) {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: styles.tabBar,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {children}
    </Tabs>
  );
}

// Attach Screen component to TabBar
export const TabBar = Object.assign(TabBarComponent, {
  Screen: Tabs.Screen,
});

export const tabBarScreenOptions = {
  tabBarActiveTintColor: ACTIVE_COLOR,
  tabBarInactiveTintColor: INACTIVE_COLOR,
  tabBarStyle: styles.tabBar,
  headerShown: false,
  tabBarButton: HapticTab,
};

export { ACTIVE_COLOR, INACTIVE_COLOR, BACKGROUND_COLOR };
