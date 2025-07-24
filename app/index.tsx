import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppBackground } from "@/components/AppBackground";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    if (user) {
      // User is authenticated, redirect to main app
      router.replace("/(main)");
    } else {
      // User is not authenticated, redirect to landing page
      router.replace("/(tabs)");
    }
  }, [user, loading, router]);

  // Show loading screen while determining auth state
  if (loading) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </AppBackground>
    );
  }

  // This should never be reached, but just in case
  return (
    <AppBackground>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
});
