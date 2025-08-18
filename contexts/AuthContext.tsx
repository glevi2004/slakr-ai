import { supabase } from "@/lib/supabase";
import { presenceService } from "@/services/presenceService";
import { pushNotificationService } from "@/services/pushNotificationService";
import { StorageService } from "@/services/storageService";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";

// Required for web only
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
    avatarUrl?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("🔄 Initializing auth state...");
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error getting initial session:", error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Initialize presence and push notifications if user is logged in
          if (session?.user?.id) {
            console.log(
              "✅ User found, initializing presence and push notifications..."
            );
            presenceService.initialize(session.user.id);

            // Initialize push notifications
            const pushToken =
              await pushNotificationService.registerForPushNotifications();
            if (pushToken) {
              await pushNotificationService.savePushToken(
                session.user.id,
                pushToken
              );
            }
          } else {
            console.log("ℹ️ No user found in initial session");
          }
        }
      } catch (error) {
        console.error("❌ Error during auth initialization:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        console.log(
          "🔄 Auth state changed:",
          _event,
          session?.user?.id ? "user logged in" : "user logged out"
        );
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle presence service and push notifications based on auth state
        if (session?.user?.id) {
          // User signed in, initialize presence and push notifications
          console.log("✅ User signed in, initializing services...");
          presenceService.initialize(session.user.id);

          // Initialize push notifications
          const pushToken =
            await pushNotificationService.registerForPushNotifications();
          if (pushToken) {
            await pushNotificationService.savePushToken(
              session.user.id,
              pushToken
            );
          }
        } else {
          // User signed out, cleanup services
          console.log("ℹ️ User signed out, cleaning up services...");
          presenceService.cleanup();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      // Cleanup presence when component unmounts
      presenceService.cleanup();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    avatarUri?: string
  ) => {
    try {
      console.log("🚀 Starting user registration...");

      // Get redirect URL for email verification
      // Force custom scheme even in development for email verification
      const redirectTo = "com.glevi.slakr-ai://";

      console.log("📧 Email verification will redirect to:", redirectTo);

      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            username: username,
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

        // Create initial profile record with username and full_name
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          username: username,
          full_name: fullName,
          avatar_url: null,
          school: null,
          grade: null,
          major: null,
          bio: null,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("⚠️ Failed to create initial profile:", profileError);
          // Don't fail registration if profile creation fails
        } else {
          console.log("✅ Initial profile created successfully");
        }

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
            username: username,
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
          .update({
            username: username,
            full_name: fullName,
            avatar_url: finalAvatarUrl,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("⚠️ Failed to update profile:", profileError);
          // Don't fail registration if profile update fails
        } else {
          console.log("✅ Profile updated successfully");
        }
      } else {
        // No avatar, but still need to create/update profile with username and full_name
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          username: username,
          full_name: fullName,
          avatar_url: null,
          school: null,
          grade: null,
          major: null,
          bio: null,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("⚠️ Failed to create/update profile:", profileError);
          // Don't fail registration if profile update fails
        } else {
          console.log("✅ Profile created/updated successfully");
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

  const resetPassword = async (email: string) => {
    try {
      console.log("🔄 Starting password reset...");

      // Use the base URL that Supabase expects
      // Supabase will append the tokens automatically
      let redirectTo;
      if (typeof window !== "undefined" && window.location) {
        // Web environment - use current origin
        redirectTo = `${window.location.protocol}//${window.location.host}`;
      } else {
        // Mobile environment - use Expo deep link
        redirectTo = makeRedirectUri();
      }

      console.log("📧 Password reset will redirect to:", redirectTo);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("❌ Password reset error:", error);
        return { error };
      }

      console.log("✅ Password reset initiated. Check your email.");
      return { error: null };
    } catch (error) {
      console.error("❌ Network error during password reset:", error);
      return { error: error as AuthError };
    }
  };

  const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token } = params;
    if (!access_token) return;
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return data.session;
  };

  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      createSessionFromUrl(url).then((session) => {
        if (session) {
          setSession(session);
          setUser(session.user ?? null);
          setLoading(false);
          console.log("✅ Session created from deep link");
        }
      });
    }
  }, [url]);

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshSession,
    resetPassword,
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
