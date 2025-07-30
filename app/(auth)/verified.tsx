import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useEffect } from "react";

export default function VerifiedScreen() {
  const { user, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is verified and logged in, redirect to main app
    if (user && session) {
      console.log("✅ User verified and logged in, redirecting to main app");
      setTimeout(() => {
        router.replace("/(main)");
      }, 2000); // Show success message for 2 seconds
    }
  }, [user, session, router]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>✅</Text>
        <ThemedText type="title" style={styles.title}>
          Email Verified!
        </ThemedText>
        <ThemedText style={styles.message}>
          Your email has been successfully verified.
        </ThemedText>
        {user && session ? (
          <ThemedText style={styles.redirectMessage}>
            Redirecting you to the app...
          </ThemedText>
        ) : (
          <ThemedText style={styles.loginMessage}>
            Please return to the app to continue.
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
  },
  redirectMessage: {
    textAlign: "center",
    color: "#4CAF50",
    fontWeight: "500",
  },
  loginMessage: {
    textAlign: "center",
    opacity: 0.6,
  },
});
