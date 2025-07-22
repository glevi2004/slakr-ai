import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export function AppBackground({ children, style }: AppBackgroundProps) {
  return (
    <LinearGradient
      colors={["#000000", "#080808", "#2d0d0d"]}
      style={[styles.background, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

export const APP_GRADIENT_COLORS = ["#000000", "#1a1a1a", "#2a2a2a"];
