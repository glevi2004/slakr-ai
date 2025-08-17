import { useAuth } from "@/contexts/AuthContext";
import { testStorage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef } from "react";

/**
 * Hook to validate session state and handle session-related errors
 * Helps prevent AuthSessionMissingError by proactively checking session validity
 */
export const useSessionValidation = () => {
  const { user, session, signOut, refreshSession, loading } = useAuth();
  const lastSessionCheck = useRef<number>(0);
  const sessionCheckInterval = useRef<number | null>(null);

  // Monitor session persistence
  useEffect(() => {
    if (loading) return;

    // Test storage on first load
    if (lastSessionCheck.current === 0) {
      console.log("🔍 Initial session persistence check...");
      testStorage().then((success) => {
        if (!success) {
          console.warn(
            "⚠️ Storage test failed - this may cause session persistence issues"
          );
        }
      });
    }

    // Set up periodic session health checks (every 5 minutes)
    sessionCheckInterval.current = setInterval(async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.warn("⚠️ Periodic session check found error:", error);
        } else if (currentSession) {
          console.log("✅ Periodic session check - session is valid");
          lastSessionCheck.current = Date.now();
        } else {
          console.warn("⚠️ Periodic session check - no session found");
        }
      } catch (error) {
        console.error("❌ Periodic session check failed:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [loading]);

  useEffect(() => {
    // Only validate if we think we have a user but no session
    if (user && !session && !loading) {
      console.log(
        "⚠️ User exists but session is missing, attempting refresh..."
      );
      handleSessionValidation();
    }
  }, [user, session, loading]);

  const handleSessionValidation = async () => {
    try {
      // Try to get the current session
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error || !currentSession) {
        console.log("🔄 No valid session found, signing out...");
        await signOut();
        return;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (currentSession.expires_at && currentSession.expires_at < now) {
        console.log("⏰ Session expired, attempting refresh...");
        const { error: refreshError } = await refreshSession();

        if (refreshError) {
          console.log("❌ Session refresh failed, signing out...");
          await signOut();
        }
      }
    } catch (error: any) {
      console.error("❌ Session validation error:", error);

      // Only sign out on authentication-specific errors
      const isAuthError =
        error?.message?.includes("JWT expired") ||
        error?.message?.includes("Invalid JWT") ||
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.includes("Auth session missing");

      if (isAuthError) {
        console.log("🔄 Authentication error detected, signing out...");
        await signOut();
      } else {
        console.log("🔄 Non-auth error, continuing without sign out...");
      }
    }
  };

  const validateSessionBeforeAction = async (): Promise<boolean> => {
    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error || !currentSession) {
        console.log("🔄 No valid session for action, signing out...");
        await signOut();
        return false;
      }

      // Check if session is about to expire (within 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = now + 5 * 60;

      if (
        currentSession.expires_at &&
        currentSession.expires_at < fiveMinutesFromNow
      ) {
        console.log("⏰ Session expiring soon, refreshing...");
        const { error: refreshError } = await refreshSession();

        if (refreshError) {
          console.log("❌ Session refresh failed, signing out...");
          await signOut();
          return false;
        }
      }

      return true;
    } catch (error: any) {
      console.error("❌ Session validation error:", error);

      // Only sign out on authentication-specific errors
      const isAuthError =
        error?.message?.includes("JWT expired") ||
        error?.message?.includes("Invalid JWT") ||
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.includes("Auth session missing");

      if (isAuthError) {
        console.log("🔄 Authentication error detected, signing out...");
        await signOut();
        return false;
      } else {
        console.log("🔄 Non-auth error, continuing without sign out...");
        return true; // Continue with action even if there's a non-auth error
      }
    }
  };

  return {
    validateSessionBeforeAction,
    isSessionValid: !!(user && session),
  };
};
