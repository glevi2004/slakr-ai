import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { presenceService } from "@/services/presenceService";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

    return () => {
      subscription.unsubscribe();
      // Cleanup presence when component unmounts
      presenceService.cleanup();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    avatarUrl?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_url: avatarUrl || null,
        },
      },
    });

    return { error };
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
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Supabase signOut error:", error);

        // If it's a network error, we still want to clear local session
        if (error.message?.includes("Network request failed")) {
          console.log("🔄 Network error detected, clearing local session...");
          // Force clear local state
          setUser(null);
          setSession(null);
          return { error: null }; // Return success since we cleared locally
        }

        return { error };
      }

      console.log("✅ Successfully signed out");
      return { error: null };
    } catch (networkError) {
      console.error("❌ Network error during signOut:", networkError);

      // On network failure, clear local session anyway
      console.log("🔄 Clearing local session due to network error...");
      setUser(null);
      setSession(null);

      // Return success since we cleared the local session
      return { error: null };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
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
