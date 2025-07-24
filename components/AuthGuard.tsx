import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppBackground } from "@/components/AppBackground";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!user) {
      // User is not authenticated
      if (!inAuthGroup && !inTabsGroup) {
        // Redirect unauthenticated users to landing page
        router.replace("/(tabs)" as any);
      }
      // If already in auth or tabs group, stay there
    } else {
      // User is authenticated
      if (inAuthGroup || inTabsGroup) {
        // Redirect from auth or landing to main app
        router.replace("/(main)" as any);
      }
      // If already in main group, stay there
    }
  }, [user, loading, segments, router]);

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

  return <>{children}</>;
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
