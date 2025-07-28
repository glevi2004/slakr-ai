import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface LoadingIndicatorProps {
  text?: string;
  size?: "small" | "large";
  color?: string;
  containerStyle?: any;
  textStyle?: any;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  text = "Loading...",
  size = "large",
  color = "#E94131",
  containerStyle,
  textStyle,
}) => {
  return (
    <View style={[styles.loadingContainer, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      <Text style={[styles.loadingText, textStyle]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 12,
  },
});

export default LoadingIndicator;
