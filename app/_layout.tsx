import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { pushNotificationService } from "@/services/pushNotificationService";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Handle password reset URLs before AuthGuard can redirect
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
      const hasResetPasswordInPath = url.includes("reset-password");

      console.log("🔍 RootLayout - Full URL:", url);
      console.log("🔍 RootLayout - URL search params:", window.location.search);
      console.log("🔍 RootLayout - URL hash params:", window.location.hash);
      console.log("🔍 RootLayout - Has access token:", hasAccessToken);
      console.log("🔍 RootLayout - Has recovery type:", hasRecoveryType);
      console.log(
        "🔍 RootLayout - Has reset-password in path:",
        hasResetPasswordInPath
      );

      // Check for password reset tokens (Supabase redirects to base URL with tokens)
      if (hasAccessToken && hasRecoveryType) {
        console.log(
          "🚨 Password reset tokens detected! Navigating to reset page..."
        );
        // Use setTimeout to ensure this happens after the router is ready
        setTimeout(() => {
          console.log("🚀 RootLayout - Executing navigation to reset page");
          router.replace("/(auth)/reset-password");
        }, 50);
      } else if (hasResetPasswordInPath) {
        console.log("🔄 Already on reset password path, staying here");
      }
    }
  }, [router]);

  // Handle notification taps
  useEffect(() => {
    const subscription =
      pushNotificationService.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;

          if (data.type === "friend_online") {
            // Navigate to friends page
            console.log(
              "User tapped friend online notification:",
              data.friendName
            );
            // You can use router.push here if needed
          } else if (data.type === "friend_request_accepted") {
            // Navigate to friends page when friend request is accepted
            console.log(
              "User tapped friend request accepted notification:",
              data.friendName
            );
            // You can use router.push here if needed
          }
        }
      );

    return () => subscription.remove();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      {/* TEMPORARY: Bypass AuthGuard for onboarding testing */}
      <ThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
