import { supabase } from "../lib/supabase";

export interface StudySession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  status: "active" | "paused" | "completed";
  created_at: string;
  updated_at: string;
}

export class SessionService {
  /**
   * Create a new study session
   */
  static async createSession(userId: string): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: userId,
          status: "active",
          duration_seconds: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating session:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  }

  /**
   * Update session duration
   */
  static async updateSessionDuration(
    sessionId: string,
    durationSeconds: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("study_sessions")
        .update({
          duration_seconds: durationSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Error updating session duration:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating session duration:", error);
      return false;
    }
  }

  /**
   * Pause a session
   */
  static async pauseSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("study_sessions")
        .update({
          status: "paused",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Error pausing session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error pausing session:", error);
      return false;
    }
  }

  /**
   * Resume a session
   */
  static async resumeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("study_sessions")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Error resuming session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error resuming session:", error);
      return false;
    }
  }

  /**
   * Complete a session
   */
  static async completeSession(
    sessionId: string,
    finalDuration: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("study_sessions")
        .update({
          status: "completed",
          duration_seconds: finalDuration,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Error completing session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error completing session:", error);
      return false;
    }
  }

  /**
   * Get active session for user
   */
  static async getActiveSession(userId: string): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error getting active session:", error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error("Error getting active session:", error);
      return null;
    }
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) {
        console.error("Error getting session:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }
}
