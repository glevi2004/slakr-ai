import { AppBackground } from "@/components/AppBackground";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Index useFocusEffect - User:", !!user, "Loading:", loading);
      
      // TEMPORARY: Always redirect to onboarding for testing
      console.log("🆕 Forcing redirect to onboarding for testing");
      router.replace("/(onboarding)/welcome");
    }, [router, user, loading])
  );

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
