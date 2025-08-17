import { MIN_SESH_TIME } from "../constants/Timer";
import { supabase } from "../lib/supabase";

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
    // Only sign out if it's specifically an authentication error
    const isAuthError =
      error?.message?.includes("JWT expired") ||
      error?.message?.includes("Invalid JWT") ||
      error?.status === 401 ||
      error?.status === 403;

    if (isAuthError) {
      console.log("🔄 Authentication error detected, signing out...");
      supabase.auth.signOut();
    } else {
      console.log("🔄 Network error detected, will retry later...");
      // Just log and continue - don't sign out for general network issues
    }
  }
  /**
   * Get user streak data
   */
  static async getUserStreaks(userId: string): Promise<UserStreak | null> {
    try {
      console.log("🔄 Getting user streaks for:", userId);

      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("❌ Error getting user streaks:", error);
        this.handleNetworkError(error);
        return null;
      }

      // If no streak record exists, create one
      if (!data) {
        console.log("📝 No streak record found, creating new one");
        return await this.createUserStreaks(userId);
      }

      console.log("✅ Retrieved user streaks:", data);
      return data;
    } catch (error) {
      console.error("❌ Exception getting user streaks:", error);
      this.handleNetworkError(error);
      return null;
    }
  }

  /**
   * Create initial user streak record
   */
  static async createUserStreaks(userId: string): Promise<UserStreak | null> {
    try {
      console.log("🔄 Creating new streak record for user:", userId);

      // Try to insert new streak record with ON CONFLICT DO NOTHING
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
        console.error("❌ Error creating user streaks:", error);
        this.handleNetworkError(error);
        return null;
      }

      console.log("✅ New streak record created successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Exception creating user streaks:", error);
      this.handleNetworkError(error);
      return null;
    }
  }

  /**
   * Update user streaks after session completion with retry logic
   */
  static async updateUserStreaks(
    userId: string,
    sessionDuration: number,
    retryCount: number = 0
  ): Promise<UserStreak | null> {
    const maxRetries = 3;

    try {
      // Only update streaks if session meets minimum time
      if (sessionDuration < MIN_SESH_TIME) {
        console.log("⏰ Session too short for streak update:", sessionDuration);
        return null;
      }

      console.log(
        `🔥 Starting streak update for user: ${userId}, duration: ${sessionDuration}${
          retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : ""
        }`
      );

      // Get current streak data with retry logic
      let currentStreaks = await this.getUserStreaks(userId);
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

      // Update the record with optimistic locking
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
        .eq("updated_at", currentStreaks.updated_at) // Optimistic locking
        .select()
        .single();

      if (error) {
        // Handle optimistic locking conflicts
        if (error.code === "PGRST116" && retryCount < maxRetries) {
          console.log(
            `🔄 Optimistic locking conflict, retrying... (${
              retryCount + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * (retryCount + 1))
          ); // Exponential backoff
          return this.updateUserStreaks(
            userId,
            sessionDuration,
            retryCount + 1
          );
        }

        console.error("❌ Error updating user streaks:", error);
        console.error("❌ Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        this.handleNetworkError(error);
        return null;
      }

      console.log("✅ Streak updated successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Exception updating user streaks:", error);
      this.handleNetworkError(error);
      return null;
    }
  }

  /**
   * Check if two dates are consecutive days
   */
  private static isConsecutiveDay(lastDate: string, today: string): boolean {
    try {
      const last = new Date(lastDate + "T00:00:00Z");
      const current = new Date(today + "T00:00:00Z");

      // Validate dates
      if (isNaN(last.getTime()) || isNaN(current.getTime())) {
        console.error("❌ Invalid dates in isConsecutiveDay:", {
          lastDate,
          today,
        });
        return false;
      }

      const diffTime = current.getTime() - last.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log("📅 Date comparison:", {
        lastDate,
        today,
        last: last.toISOString(),
        current: current.toISOString(),
        diffTime,
        diffDays,
        isConsecutive: diffDays === 1,
      });

      return diffDays === 1;
    } catch (error) {
      console.error("❌ Error in isConsecutiveDay:", error);
      return false;
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
      currentStreak,
      "Longest:",
      longestStreak
    );

    // Validate input parameters
    if (typeof currentStreak !== "number" || currentStreak < 0) {
      console.warn(
        "⚠️ Invalid currentStreak value:",
        currentStreak,
        "defaulting to 0"
      );
      currentStreak = 0;
    }

    if (typeof longestStreak !== "number" || longestStreak < 0) {
      console.warn(
        "⚠️ Invalid longestStreak value:",
        longestStreak,
        "defaulting to 0"
      );
      longestStreak = 0;
    }

    let newCurrentStreak = currentStreak;

    if (!lastSessionDate) {
      // First session ever
      console.log("🎉 First session ever!");
      newCurrentStreak = 1;
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(lastSessionDate) || !dateRegex.test(today)) {
        console.error("❌ Invalid date format:", { lastSessionDate, today });
        return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1) };
      }

      // Use direct string comparison for same day check
      if (lastSessionDate === today) {
        // Same day - maintain current streak
        console.log("📅 Same day - streak continues");
        newCurrentStreak = currentStreak;
      } else if (this.isConsecutiveDay(lastSessionDate, today)) {
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
        const minutes = Math.round(stat.total_study_time_seconds / 60);
        result[stat.date] = minutes;
      });

      return result;
    } catch (error) {
      console.error("Error getting daily study data:", error);
      return {};
    }
  }

  /**
   * Validate and repair streak data integrity
   */
  static async validateStreakData(userId: string): Promise<boolean> {
    try {
      console.log("🔍 Validating streak data for user:", userId);

      const streaks = await this.getUserStreaks(userId);
      if (!streaks) {
        console.log("❌ No streak data found for validation");
        return false;
      }

      // Validate streak values
      const issues = [];

      if (streaks.current_streak < 0) {
        issues.push("current_streak is negative");
      }

      if (streaks.longest_streak < 0) {
        issues.push("longest_streak is negative");
      }

      if (streaks.current_streak > streaks.longest_streak) {
        issues.push("current_streak exceeds longest_streak");
      }

      if (streaks.total_study_time_seconds < 0) {
        issues.push("total_study_time_seconds is negative");
      }

      if (issues.length > 0) {
        console.warn("⚠️ Streak data validation issues found:", issues);

        // Attempt to repair the data
        const { error } = await supabase
          .from("user_streaks")
          .update({
            current_streak: Math.max(0, streaks.current_streak),
            longest_streak: Math.max(
              streaks.current_streak,
              streaks.longest_streak
            ),
            total_study_time_seconds: Math.max(
              0,
              streaks.total_study_time_seconds
            ),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) {
          console.error("❌ Failed to repair streak data:", error);
          return false;
        }

        console.log("✅ Streak data repaired successfully");
        return true;
      }

      console.log("✅ Streak data validation passed");
      return true;
    } catch (error) {
      console.error("❌ Error validating streak data:", error);
      return false;
    }
  }

  /**
   * Force refresh and recalculate streaks from study sessions
   */
  static async forceRefreshStreaks(userId: string): Promise<UserStreak | null> {
    try {
      console.log("🔄 Force refreshing streaks for user:", userId);

      // Get all completed study sessions
      const { data: sessions, error } = await supabase
        .from("study_sessions")
        .select("started_at, duration_seconds")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("duration_seconds", MIN_SESH_TIME)
        .order("started_at", { ascending: true });

      if (error) {
        console.error("❌ Error fetching study sessions:", error);
        return null;
      }

      if (!sessions || sessions.length === 0) {
        console.log("📝 No study sessions found, resetting streaks");
        const { data, error: updateError } = await supabase
          .from("user_streaks")
          .update({
            current_streak: 0,
            longest_streak: 0,
            last_session_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error resetting streaks:", updateError);
          return null;
        }

        return data;
      }

      // Calculate streaks from scratch
      let currentStreak = 0;
      let longestStreak = 0;
      let lastSessionDate: string | null = null;
      let totalStudyTime = 0;

      for (const session of sessions) {
        const sessionDate = session.started_at.split("T")[0];
        totalStudyTime += session.duration_seconds;

        if (!lastSessionDate) {
          // First session
          currentStreak = 1;
          longestStreak = 1;
        } else if (lastSessionDate === sessionDate) {
          // Same day, maintain streak
          // Do nothing - streak continues
        } else if (this.isConsecutiveDay(lastSessionDate, sessionDate)) {
          // Consecutive day, increase streak
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          // Gap in days, reset streak
          currentStreak = 1;
        }

        lastSessionDate = sessionDate;
      }

      console.log("📊 Recalculated streaks:", {
        currentStreak,
        longestStreak,
        lastSessionDate,
        totalStudyTime,
      });

      // Update the streak record
      const { data, error: updateError } = await supabase
        .from("user_streaks")
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_session_date: lastSessionDate,
          total_study_time_seconds: totalStudyTime,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating recalculated streaks:", updateError);
        return null;
      }

      console.log("✅ Streaks force refreshed successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error force refreshing streaks:", error);
      return null;
    }
  }
}
