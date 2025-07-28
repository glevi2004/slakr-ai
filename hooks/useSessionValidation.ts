import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

/**
 * Hook to validate session state and handle session-related errors
 * Helps prevent AuthSessionMissingError by proactively checking session validity
 */
export const useSessionValidation = () => {
  const { user, session, signOut, refreshSession } = useAuth();

  useEffect(() => {
    // Only validate if we think we have a user but no session
    if (user && !session) {
      console.log(
        "⚠️ User exists but session is missing, attempting refresh..."
      );
      handleSessionValidation();
    }
  }, [user, session]);

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
    } catch (error) {
      console.error("❌ Session validation error:", error);
      // On any error, sign out to clear invalid state
      await signOut();
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
    } catch (error) {
      console.error("❌ Session validation error:", error);
      await signOut();
      return false;
    }
  };

  return {
    validateSessionBeforeAction,
    isSessionValid: !!(user && session),
  };
};
