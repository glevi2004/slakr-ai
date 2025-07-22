import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBackground } from "@/components/AppBackground";

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <View style={styles.card}>
    <Text style={styles.cardIcon}>{icon}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>
  </View>
);

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AppBackground style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Text style={styles.title}>About Slakr AI</Text>
            <Text style={styles.subtitle}>
              Your intelligent productivity companion
            </Text>
          </View>

          <View style={styles.cardsContainer}>
            <FeatureCard
              icon="🤖"
              title="AI-Powered Assistant"
              description="Get intelligent suggestions and automated workflows to boost your productivity"
            />

            <FeatureCard
              icon="⚡"
              title="Smart Automation"
              description="Streamline your daily tasks with intelligent automation and smart scheduling"
            />

            <FeatureCard
              icon="📊"
              title="Analytics & Insights"
              description="Track your productivity patterns and get personalized insights to improve"
            />

            <FeatureCard
              icon="🎯"
              title="Goal Tracking"
              description="Set and achieve your goals with AI-powered recommendations and progress tracking"
            />

            <FeatureCard
              icon="🔒"
              title="Privacy First"
              description="Your data stays secure with end-to-end encryption and local processing"
            />

            <FeatureCard
              icon="🌟"
              title="Personalized Experience"
              description="Adaptive interface that learns your preferences and optimizes your workflow"
            />
          </View>
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120, // Extra padding for tab bar
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9DA4AE",
    textAlign: "center",
    lineHeight: 22,
  },
  cardsContainer: {
    width: "100%",
    gap: 16,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 14,
    color: "#9DA4AE",
    textAlign: "center",
    lineHeight: 20,
  },
});
