import { AppBackground } from "@/components/AppBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import LoadingIndicator from "./LoadingIndicator";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isProcessingPasswordReset, setIsProcessingPasswordReset] =
    useState(false);

  // Check if we're handling a password reset URL
  useEffect(() => {
    if (typeof window !== "undefined" && window.location) {
      const url = window.location.href;

      // Parse both search params (?param=value) and hash params (#param=value)
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Remove the # character

      // Check both locations for tokens
      const hasAccessToken =
        searchParams.has("access_token") || hashParams.has("access_token");
      const hasRecoveryType =
        searchParams.get("type") === "recovery" ||
        hashParams.get("type") === "recovery";
      const isPasswordResetUrl =
        (hasAccessToken && hasRecoveryType) || url.includes("reset-password");

      console.log("🔍 AuthGuard - Current URL:", url);
      console.log("🔍 AuthGuard - URL hash params:", window.location.hash);
      console.log("🔍 AuthGuard - Has access token:", hasAccessToken);
      console.log("🔍 AuthGuard - Has recovery type:", hasRecoveryType);
      console.log("🔍 AuthGuard - Is password reset URL:", isPasswordResetUrl);

      setIsProcessingPasswordReset(isPasswordResetUrl);

      if (isPasswordResetUrl) {
        console.log(
          "🔒 AuthGuard - Password reset URL detected, disabling redirects temporarily"
        );
        // Give some time for the URL to be processed and session to be established
        setTimeout(() => {
          console.log(
            "🔓 AuthGuard - Re-enabling redirects after password reset processing"
          );
          setIsProcessingPasswordReset(false);
        }, 4000); // Longer timeout to allow Supabase to process the session
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined
    if (isProcessingPasswordReset) {
      console.log(
        "🔒 AuthGuard - Skipping redirects while processing password reset"
      );
      return; // Don't redirect while processing password reset
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const onResetPasswordPage = segments.some(
      (segment) => segment === "reset-password"
    );

    console.log("🔍 AuthGuard - Current segments:", JSON.stringify(segments));
    console.log("🔍 AuthGuard - Segments length:", segments.length);
    console.log("🔍 AuthGuard - First segment:", segments[0]);
    console.log("🔍 AuthGuard - In auth group:", inAuthGroup);
    console.log("🔍 AuthGuard - On reset password page:", onResetPasswordPage);
    console.log("🔍 AuthGuard - User authenticated:", !!user);
    console.log(
      "🔍 AuthGuard - Processing password reset:",
      isProcessingPasswordReset
    );

    if (!user) {
      // User is not authenticated
      if (!inAuthGroup && !inTabsGroup) {
        console.log("🔄 Redirecting unauthenticated user to landing page");
        router.replace("/(tabs)" as any);
      }
      // If already in auth or tabs group, stay there
    } else {
      // User is authenticated
      if (inAuthGroup && !onResetPasswordPage) {
        console.log("🔄 Redirecting authenticated user from auth to main app");
        router.replace("/(main)" as any);
      } else if (inTabsGroup) {
        console.log(
          "🔄 Redirecting authenticated user from landing to main app"
        );
        router.replace("/(main)" as any);
      } else if (onResetPasswordPage) {
        console.log("✅ Allowing access to reset password page");
      }
      // If already in main group or on reset password page, stay there
    }
  }, [user, loading, segments, router, isProcessingPasswordReset]);

  // Show loading screen while determining auth state
  if (loading) {
    return (
      <AppBackground>
        <LoadingIndicator text="Loading..." />
      </AppBackground>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({});
