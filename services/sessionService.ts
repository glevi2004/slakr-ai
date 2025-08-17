import { MIN_SESH_TIME } from "../constants/Timer";
import { supabase } from "../lib/supabase";
import { DailyStatsService } from "./dailyStatsService";
import { presenceService } from "./presenceService";
import { StreakService } from "./streakService";

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
   * Create a new study session (only for completed sessions)
   */
  static async createCompletedSession(
    userId: string,
    durationSeconds: number,
    startedAt: string
  ): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: userId,
          status: "completed",
          duration_seconds: durationSeconds,
          started_at: startedAt,
          ended_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating completed session:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating completed session:", error);
      return null;
    }
  }

  /**
   * Start studying mode (only updates presence, no database session)
   */
  static async startStudyingMode(userId: string): Promise<boolean> {
    try {
      // Only set studying presence status
      await presenceService.setStudyingStatus(true);
      return true;
    } catch (error) {
      console.error("Error starting studying mode:", error);
      return false;
    }
  }

  // These methods are no longer needed since we don't create sessions until completion

  /**
   * Complete a session and update related stats
   */
  static async completeSession(
    userId: string,
    finalDuration: number,
    sessionStartTime: string
  ): Promise<boolean> {
    try {
      console.log(
        "🏁 Completing session - Duration:",
        finalDuration,
        "seconds"
      );

      // Only create session in database if it meets minimum time
      if (finalDuration >= MIN_SESH_TIME) {
        console.log(
          "📊 Session meets minimum time, creating database record..."
        );

        // Create the completed session
        const session = await this.createCompletedSession(
          userId,
          finalDuration,
          sessionStartTime
        );

        if (!session) {
          console.error("❌ Failed to create completed session");
          return false;
        }

        console.log("✅ Session created successfully");

        // Extract date from session start time
        const sessionDate = sessionStartTime.split("T")[0]; // YYYY-MM-DD

        // Update daily stats first
        const dailyStatsResult = await DailyStatsService.updateDailyStats(
          userId,
          sessionDate,
          finalDuration,
          1
        );

        if (!dailyStatsResult) {
          console.warn(
            "⚠️ Failed to update daily stats, but session was completed"
          );
        }

        // Update streaks after daily stats to avoid race conditions
        const streakResult = await StreakService.updateUserStreaks(
          userId,
          finalDuration
        );

        if (!streakResult) {
          console.warn(
            "⚠️ Failed to update streaks, but session was completed"
          );
        } else {
          // Validate streak data integrity after update
          await StreakService.validateStreakData(userId);
        }

        console.log("✅ All stats updated successfully");
      } else {
        console.log(
          `⏱️ Session too short (<${
            MIN_SESH_TIME / 60
          } minutes), skipping database creation and stats update`
        );
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
