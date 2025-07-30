import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { presenceService } from "@/services/presenceService";
import { StorageService } from "@/services/storageService";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Required for web only
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    avatarUrl?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get the redirect URL
const getRedirectURL = () => {
  const redirectTo = makeRedirectUri();
  console.log("🔗 Redirect URL generated:", redirectTo);
  return redirectTo;
};

// Helper function to create session from URL
const createSessionFromUrl = async (url: string) => {
  console.log("🔗 Processing deep link URL:", url);

  try {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    console.log("📝 URL params:", params);
    console.log("❌ Error code:", errorCode);

    if (errorCode) {
      console.error("❌ URL contained error:", errorCode);
      throw new Error(errorCode);
    }

    const { access_token, refresh_token, type } = params;
    console.log("🔑 Token type:", type);
    console.log("🔑 Access token present:", !!access_token);
    console.log("🔑 Refresh token present:", !!refresh_token);

    if (!access_token) {
      console.log("⚠️ No access token found in URL");
      return;
    }

    console.log("🔄 Setting session with tokens...");
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("❌ Error setting session:", error);
      throw error;
    }

    console.log("✅ Session created successfully from URL");
    return data.session;
  } catch (error) {
    console.error("❌ Failed to create session from URL:", error);
    throw error;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Initialize presence if user is logged in
      if (session?.user?.id) {
        presenceService.initialize(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle presence service based on auth state
      if (session?.user?.id) {
        // User signed in, initialize presence
        await presenceService.initialize(session.user.id);
      } else {
        // User signed out, cleanup presence
        await presenceService.cleanup();
      }
    });

    // Handle deep linking for email verification
    const handleDeepLink = async (event: { url: string }) => {
      console.log("🔗 Deep link received:", event.url);
      try {
        await createSessionFromUrl(event.url);
        console.log("✅ Deep link processed successfully");
      } catch (error) {
        console.error("❌ Failed to process deep link:", error);
      }
    };

    // Listen for deep links
    const linkingSubscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🔗 App opened with initial URL:", url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
      // Cleanup presence when component unmounts
      presenceService.cleanup();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    avatarUri?: string
  ) => {
    try {
      console.log("🚀 Starting user registration...");

      // Get redirect URL for email verification
      const redirectTo = getRedirectURL();
      console.log("📧 Email verification will redirect to:", redirectTo);

      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            avatar_url: null, // Will be updated after upload
          },
        },
      });

      if (authError) {
        console.error("❌ Auth signup error:", authError);
        return { error: authError };
      }

      if (!authData.user) {
        console.error("❌ No user created");
        return { error: new Error("Failed to create user") as AuthError };
      }

      console.log("✅ User account created:", authData.user.id);

      // Check if email confirmation is required
      if (!authData.session) {
        console.log(
          "📧 Email verification required. Check your email for confirmation link."
        );
        console.log("🔗 Verification link will redirect to:", redirectTo);
        return { error: null }; // Success, but user needs to verify email
      }

      // If avatar provided, upload it to storage
      let finalAvatarUrl = null;
      if (avatarUri) {
        console.log("📤 Uploading avatar...");
        const { url: uploadedUrl, error: uploadError } =
          await StorageService.uploadAvatar(authData.user.id, avatarUri);

        if (uploadError) {
          console.error("⚠️ Avatar upload failed:", uploadError);
          // Don't fail registration if avatar upload fails
        } else {
          finalAvatarUrl = uploadedUrl;
          console.log("✅ Avatar uploaded successfully");
        }
      }

      // Update user metadata and profile table with the uploaded avatar URL
      if (finalAvatarUrl) {
        // Update auth metadata
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            avatar_url: finalAvatarUrl,
          },
        });

        if (metadataError) {
          console.error("⚠️ Failed to update user metadata:", metadataError);
          // Don't fail registration if metadata update fails
        }

        // Also update the profiles table (this is where the app reads from)
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ avatar_url: finalAvatarUrl })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("⚠️ Failed to update profile avatar:", profileError);
          // Don't fail registration if profile update fails
        } else {
          console.log("✅ Profile avatar URL updated successfully");
        }
      }

      console.log("🎉 Registration completed successfully");
      return { error: null };
    } catch (error) {
      console.error("❌ Registration failed:", error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      console.log("🚪 Attempting to sign out...");

      // Always cleanup presence first, regardless of session state
      await presenceService.cleanup();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Supabase signOut error:", error);

        // Handle specific error cases where we should still clear local state
        const shouldClearLocalState =
          error.message?.includes("Auth session missing") ||
          error.message?.includes("Network request failed") ||
          error.message?.includes("session_not_found") ||
          error.name === "AuthSessionMissingError";

        if (shouldClearLocalState) {
          console.log("🔄 Session already invalid, clearing local state...");
          // Force clear local state since session is already gone
          setUser(null);
          setSession(null);
          return { error: null }; // Return success since user is effectively logged out
        }

        return { error };
      }

      console.log("✅ Successfully signed out");
      return { error: null };
    } catch (networkError) {
      console.error("❌ Network error during signOut:", networkError);

      // Always cleanup presence on any error
      await presenceService.cleanup();

      // On any failure, clear local session anyway
      console.log("🔄 Clearing local session due to error...");
      setUser(null);
      setSession(null);

      // Return success since we cleared the local session
      return { error: null };
    }
  };

  const refreshSession = async () => {
    try {
      console.log("🔄 Refreshing session...");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("❌ Session refresh error:", error);

        // If session can't be refreshed, clear local state
        if (
          error.message?.includes("Auth session missing") ||
          error.message?.includes("refresh_token_not_found")
        ) {
          console.log("🔄 Invalid session, clearing local state...");
          setUser(null);
          setSession(null);
        }

        return { error };
      }

      console.log("✅ Session refreshed successfully");
      return { error: null };
    } catch (error) {
      console.error("❌ Network error during session refresh:", error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
