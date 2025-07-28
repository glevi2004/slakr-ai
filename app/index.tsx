import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import LoadingIndicator from "@/components/LoadingIndicator";
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
        <LoadingIndicator text="Loading..." />
      </AppBackground>
    );
  }

  // This should never be reached, but just in case
  return (
    <AppBackground>
      <LoadingIndicator text="Redirecting..." />
    </AppBackground>
  );
}

const styles = StyleSheet.create({});
