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
      if (!inAuthGroup) {
        // Redirect any unauthenticated route to the auth screens
        router.replace("/(auth)" as any);
      }
      // If already in auth group, stay there
    } else {
      // User is authenticated
      if (inAuthGroup) {
        // Redirect from auth to main app
        router.replace("/(main)" as any);
      } else if (inTabsGroup) {
        // Redirect from old tabs to main app
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
