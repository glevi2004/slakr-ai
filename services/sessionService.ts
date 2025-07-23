import { supabase } from "../lib/supabase";
import { StreakService } from "./streakService";
import { DailyStatsService } from "./dailyStatsService";
import { presenceService } from "./presenceService";

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

      // Set studying presence status
      await presenceService.setStudyingStatus(true);

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

      // Set presence to online when paused
      await presenceService.setStudyingStatus(false);

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

      // Set presence to studying when resumed
      await presenceService.setStudyingStatus(true);

      return true;
    } catch (error) {
      console.error("Error resuming session:", error);
      return false;
    }
  }

  /**
   * Complete a session and update related stats
   */
  static async completeSession(
    sessionId: string,
    finalDuration: number
  ): Promise<boolean> {
    try {
      console.log(
        "🏁 Completing session:",
        sessionId,
        "Duration:",
        finalDuration
      );

      // First get the session to get user_id and date
      const session = await this.getSession(sessionId);
      if (!session) {
        console.error("❌ Session not found:", sessionId);
        return false;
      }

      // Update the session status
      const { error: sessionError } = await supabase
        .from("study_sessions")
        .update({
          status: "completed",
          duration_seconds: finalDuration,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (sessionError) {
        console.error("❌ Error completing session:", sessionError);
        return false;
      }

      console.log("✅ Session completed successfully");

      // Extract date from session start time
      const sessionDate = session.started_at.split("T")[0]; // YYYY-MM-DD

      // Update daily stats (only if session is meaningful - 30+ seconds)
      if (finalDuration >= 30) {
        console.log("📊 Updating daily stats and streaks...");

        // Update daily stats and streaks in parallel
        const [dailyStatsResult, streakResult] = await Promise.all([
          DailyStatsService.updateDailyStats(
            session.user_id,
            sessionDate,
            finalDuration,
            1
          ),
          StreakService.updateUserStreaks(session.user_id, finalDuration),
        ]);

        if (!dailyStatsResult) {
          console.warn(
            "⚠️ Failed to update daily stats, but session was completed"
          );
        }

        if (!streakResult) {
          console.warn(
            "⚠️ Failed to update streaks, but session was completed"
          );
        }

        console.log("✅ All stats updated successfully");
      } else {
        console.log("⏱️ Session too short (<30s), skipping stats update");
      }

      // Reset presence status to online after completing study session
      await presenceService.setStudyingStatus(false);

      return true;
    } catch (error) {
      console.error("❌ Error completing session:", error);
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
