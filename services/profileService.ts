import { supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  school: string | null;
  grade: string | null;
  major: string | null;
  bio: string | null;
  updated_at: string | null;
}

export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error getting user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  /**
   * Create initial user profile
   */
  static async createUserProfile(
    userId: string,
    email: string
  ): Promise<UserProfile | null> {
    try {
      const username = email.split("@")[0]; // Default username from email

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          username: username,
          full_name: null,
          avatar_url: null,
          school: null,
          grade: null,
          major: null,
          bio: null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, "id" | "updated_at">>
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return null;
    }
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(
    username: string,
    currentUserId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from("profiles")
        .select("id")
        .eq("username", username);

      // If checking for current user, exclude their current record
      if (currentUserId) {
        query = query.neq("id", currentUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error checking username availability:", error);
        return false;
      }

      return data.length === 0;
    } catch (error) {
      console.error("Error checking username availability:", error);
      return false;
    }
  }

  /**
   * Get or create user profile
   */
  static async getOrCreateUserProfile(
    userId: string,
    email: string
  ): Promise<UserProfile | null> {
    try {
      // Try to get existing profile
      let profile = await this.getUserProfile(userId);

      // If no profile exists, create one
      if (!profile) {
        profile = await this.createUserProfile(userId, email);
      }

      return profile;
    } catch (error) {
      console.error("Error getting or creating user profile:", error);
      return null;
    }
  }
}
