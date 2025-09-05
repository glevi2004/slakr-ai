import React from "react";
import { StyleSheet, View } from "react-native";

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export function AppBackground({ children, style }: AppBackgroundProps) {
  return <View style={[styles.background, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});

export const APP_GRADIENT_COLORS = ["#000000", "#1a1a1a", "#2a2a2a"];
