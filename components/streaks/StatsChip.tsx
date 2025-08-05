import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatsChipProps {
  icon: React.ComponentType<any>; // Expo vector icon component
  iconName: string;
  iconColor: string;
  label: string;
  value: number;
  suffix?: string;
}

export default function StatsChip({
  icon: Icon,
  iconName,
  iconColor,
  label,
  value,
  suffix = "",
}: StatsChipProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: "#1A1A1A",
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}
        >
          <Icon name={iconName} size={20} color={iconColor} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.value, { color: "#FFFFFF" }]}>
            {suffix === "TODO" ? "TODO" : `${value}${suffix}`}
          </Text>
          <Text style={[styles.label, { color: "rgba(255, 255, 255, 0.7)" }]}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    marginHorizontal: 4,
    overflow: "hidden",
    borderWidth: 1,
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  textContainer: {
    alignItems: "center",
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
});
