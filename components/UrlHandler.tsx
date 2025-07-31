import { router } from "expo-router";
import { useEffect } from "react";

export function UrlHandler() {
  useEffect(() => {
    // Only run in web environment
    if (typeof window !== "undefined" && window.location) {
      const url = window.location.href;
      console.log("🔍 UrlHandler checking URL:", url);

      // Check if this is a password reset link
      if (url.includes("type=recovery")) {
        console.log("🔄 Password reset link detected, redirecting...");
        router.replace("/(auth)/reset-password");
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}
