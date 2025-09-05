import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface HeroProps {
  currentStreak: number;
}

export default function Hero({ currentStreak }: HeroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Ash Character Placeholder */}
        <View style={styles.ashContainer}>
          <LinearGradient
            colors={["#E94131", "#FF7E33"]}
            style={styles.ashPlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ashEmoji}>🔥</Text>
          </LinearGradient>
        </View>

        {/* Streak Counter */}
        <View style={styles.counterContainer}>
          <Text style={[styles.streakNumber, { color: "#333333" }]}>
            {currentStreak}
          </Text>
          <Text style={[styles.streakLabel, { color: "#666666" }]}>
            day streak!
          </Text>
        </View>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View
          style={[
            styles.floatingElement,
            styles.element1,
            { backgroundColor: "rgba(0, 0, 0, 0.05)" },
          ]}
        />
        <View
          style={[
            styles.floatingElement,
            styles.element2,
            { backgroundColor: "rgba(0, 0, 0, 0.05)" },
          ]}
        />
        <View
          style={[
            styles.floatingElement,
            styles.element3,
            { backgroundColor: "rgba(0, 0, 0, 0.05)" },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(248, 248, 248, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  ashContainer: {
    alignItems: "center",
  },
  ashPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E94131",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ashEmoji: {
    fontSize: 36,
  },
  counterContainer: {
    alignItems: "center",
    flex: 1,
    marginLeft: 20,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  floatingElement: {
    position: "absolute",
    borderRadius: 50,
  },
  element1: {
    width: 20,
    height: 20,
    top: 30,
    right: 40,
  },
  element2: {
    width: 12,
    height: 12,
    top: 60,
    right: 80,
  },
  element3: {
    width: 16,
    height: 16,
    bottom: 40,
    left: 30,
  },
});
