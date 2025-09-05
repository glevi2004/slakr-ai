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
          backgroundColor: "rgba(248, 248, 248, 0.8)",
          borderColor: "rgba(0, 0, 0, 0.1)",
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
          <Text style={[styles.value, { color: "#333333" }]}>
            {suffix === "TODO" ? "TODO" : `${value}${suffix}`}
          </Text>
          <Text style={[styles.label, { color: "#666666" }]}>{label}</Text>
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
