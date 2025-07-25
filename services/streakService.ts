import { supabase } from "../lib/supabase";
import { router } from "expo-router";
import { MIN_SESH_TIME } from "../constants/Timer";

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  total_study_time_seconds: number;
  created_at: string;
  updated_at: string;
}

export class StreakService {
  /**
   * Handle network errors by clearing session and redirecting
   */
  private static handleNetworkError(error: any) {
    const isNetworkError =
      error?.message?.includes("Network request failed") ||
      error?.message?.includes("fetch") ||
      error?.code === "NETWORK_ERROR" ||
      error?.name === "NetworkError";

    if (isNetworkError) {
      console.log(
        "🔄 StreakService: Network error detected, clearing session and redirecting..."
      );

      // Clear the user session
      supabase.auth.signOut();

      // Redirect to index (which will route to landing page)
      try {
        router.replace("/");
      } catch (redirectError) {
        console.error("Error redirecting:", redirectError);
      }
    }
  }
  /**
   * Get user streak data
   */
  static async getUserStreaks(userId: string): Promise<UserStreak | null> {
    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error getting user streaks:", error);
        this.handleNetworkError(error);
        return null;
      }

      // If no streak record exists, create one
      if (!data) {
        return await this.createUserStreaks(userId);
      }

      return data;
    } catch (error) {
      console.error("Error getting user streaks:", error);
      this.handleNetworkError(error);
      return null;
    }
  }

  /**
   * Create initial user streak record
   */
  static async createUserStreaks(userId: string): Promise<UserStreak | null> {
    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_session_date: null,
          total_study_time_seconds: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user streaks:", error);
        this.handleNetworkError(error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating user streaks:", error);
      this.handleNetworkError(error);
      return null;
    }
  }

  /**
   * Update user streaks after session completion
   */
  static async updateUserStreaks(
    userId: string,
    sessionDuration: number
  ): Promise<UserStreak | null> {
    try {
      // Only update streaks if session meets minimum time
      if (sessionDuration < MIN_SESH_TIME) {
        console.log("⏰ Session too short for streak update:", sessionDuration);
        return null;
      }

      console.log(
        "🔥 Starting streak update for user:",
        userId,
        "duration:",
        sessionDuration
      );

      // Get current streak data
      const currentStreaks = await this.getUserStreaks(userId);
      if (!currentStreaks) {
        console.log("❌ No current streaks found");
        return null;
      }

      console.log("📊 Current streak data:", currentStreaks);

      const today = new Date().toISOString().split("T")[0];
      const lastSessionDate = currentStreaks.last_session_date;

      console.log("📅 Today:", today, "Last session:", lastSessionDate);

      // Calculate new streak values
      const streakUpdate = this.calculateStreakUpdate(
        lastSessionDate,
        today,
        currentStreaks.current_streak,
        currentStreaks.longest_streak
      );

      console.log("🎯 Calculated streak update:", streakUpdate);

      // Update the record
      const { data, error } = await supabase
        .from("user_streaks")
        .update({
          current_streak: streakUpdate.currentStreak,
          longest_streak: streakUpdate.longestStreak,
          last_session_date: today,
          total_study_time_seconds:
            currentStreaks.total_study_time_seconds + sessionDuration,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating user streaks:", error);
        return null;
      }

      console.log("✅ Streak updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error updating user streaks:", error);
      return null;
    }
  }

  /**
   * Calculate streak updates based on session dates
   */
  static calculateStreakUpdate(
    lastSessionDate: string | null,
    today: string,
    currentStreak: number,
    longestStreak: number
  ): {
    currentStreak: number;
    longestStreak: number;
  } {
    console.log(
      "🧮 Calculating streak - Today:",
      today,
      "Last:",
      lastSessionDate,
      "Current:",
      currentStreak
    );

    let newCurrentStreak = currentStreak;

    if (!lastSessionDate) {
      // First session ever
      console.log("🎉 First session ever!");
      newCurrentStreak = 1;
    } else {
      const lastDate = new Date(lastSessionDate);
      const todayDate = new Date(today);
      const daysDifference = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log("📆 Days difference:", daysDifference);

      if (daysDifference === 0) {
        // Same day - maintain current streak
        console.log("📅 Same day - streak continues");
        newCurrentStreak = currentStreak;
      } else if (daysDifference === 1) {
        // Next day, streak continues
        console.log("➡️ Next day - streak increases!");
        newCurrentStreak = currentStreak + 1;
      } else {
        // Gap in days, streak resets
        console.log("💔 Gap in days - streak resets");
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(longestStreak, newCurrentStreak);
    console.log(
      "📈 New streak values - Current:",
      newCurrentStreak,
      "Longest:",
      newLongestStreak
    );

    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
    };
  }

  /**
   * Get today's total study time
   */
  static async getTodaysStudyTime(userId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("study_sessions")
        .select("duration_seconds")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("started_at", `${today}T00:00:00.000Z`)
        .lt("started_at", `${today}T23:59:59.999Z`);

      if (error) {
        console.error("Error getting today's study time:", error);
        return 0;
      }

      return data.reduce((sum, session) => sum + session.duration_seconds, 0);
    } catch (error) {
      console.error("Error getting today's study time:", error);
      return 0;
    }
  }

  /**
   * Get daily study data for calendar display using daily_stats table
   */
  static async getDailyStudyData(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ [key: string]: number }> {
    try {
      const { data, error } = await supabase
        .from("daily_stats")
        .select("date, total_study_time_seconds")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error getting daily study data:", error);
        return {};
      }

      // Convert to the format expected by the calendar (date -> minutes)
      const result: { [key: string]: number } = {};
      data.forEach((stat) => {
        const minutes = Math.floor(stat.total_study_time_seconds / 60);
        result[stat.date] = minutes;
      });

      return result;
    } catch (error) {
      console.error("Error getting daily study data:", error);
      return {};
    }
  }
}
