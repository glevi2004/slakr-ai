import { supabase } from "../lib/supabase";

export interface DailyStats {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  total_study_time_seconds: number;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export class DailyStatsService {
  /**
   * Update daily stats for a user on a specific date
   * This uses a manual approach to handle upsert operations reliably
   */
  static async updateDailyStats(
    userId: string,
    date: string, // YYYY-MM-DD format
    additionalSeconds: number,
    additionalSessions: number = 1
  ): Promise<DailyStats | null> {
    try {
      console.log(
        `📊 Updating daily stats for ${userId} on ${date}: +${additionalSeconds}s, +${additionalSessions} sessions`
      );

      // Use manual upsert approach with retry logic for race conditions
      return await this.manualUpsertWithRetry(
        userId,
        date,
        additionalSeconds,
        additionalSessions
      );
    } catch (error) {
      console.error("❌ Error updating daily stats:", error);
      return null;
    }
  }

  /**
   * Manual upsert with retry logic to handle race conditions
   */
  private static async manualUpsertWithRetry(
    userId: string,
    date: string,
    additionalSeconds: number,
    additionalSessions: number,
    retryCount: number = 0
  ): Promise<DailyStats | null> {
    const maxRetries = 3;

    try {
      // First, try to get existing record
      const { data: existing } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from("daily_stats")
          .update({
            total_study_time_seconds:
              existing.total_study_time_seconds + additionalSeconds,
            session_count: existing.session_count + additionalSessions,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          console.error("❌ Error updating existing daily stats:", error);
          // If this is a race condition and we haven't exceeded max retries, try again
          if (error.code === "23505" && retryCount < maxRetries) {
            // Unique constraint violation
            console.log(
              `🔄 Retrying due to race condition (attempt ${retryCount + 1})`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 100 * (retryCount + 1))
            ); // Exponential backoff
            return this.manualUpsertWithRetry(
              userId,
              date,
              additionalSeconds,
              additionalSessions,
              retryCount + 1
            );
          }
          return null;
        }

        console.log("✅ Daily stats updated successfully:", data);
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("daily_stats")
          .insert({
            user_id: userId,
            date: date,
            total_study_time_seconds: additionalSeconds,
            session_count: additionalSessions,
          })
          .select()
          .single();

        if (error) {
          console.error("❌ Error creating new daily stats:", error);
          // If this is a race condition (another session created the record), try updating
          if (error.code === "23505" && retryCount < maxRetries) {
            // Unique constraint violation
            console.log(
              `🔄 Record was created by another session, retrying update (attempt ${
                retryCount + 1
              })`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 100 * (retryCount + 1))
            ); // Exponential backoff
            return this.manualUpsertWithRetry(
              userId,
              date,
              additionalSeconds,
              additionalSessions,
              retryCount + 1
            );
          }
          return null;
        }

        console.log("✅ Daily stats created successfully:", data);
        return data;
      }
    } catch (error) {
      console.error("❌ Error in manual upsert with retry:", error);
      return null;
    }
  }

  /**
   * Get daily stats for a date range
   */
  static async getDailyStats(
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
        console.error("Error getting daily stats:", error);
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
      console.error("Error getting daily stats:", error);
      return {};
    }
  }

  /**
   * Get total study time for a specific date
   */
  static async getDailyTotal(userId: string, date: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("daily_stats")
        .select("total_study_time_seconds")
        .eq("user_id", userId)
        .eq("date", date)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error getting daily total:", error);
        return 0;
      }

      return data?.total_study_time_seconds || 0;
    } catch (error) {
      console.error("Error getting daily total:", error);
      return 0;
    }
  }

  /**
   * Recalculate daily stats for a user (useful for data migration/repair)
   */
  static async recalculateDailyStats(userId: string): Promise<boolean> {
    try {
      console.log("🔄 Recalculating daily stats for user:", userId);

      // Get all completed sessions for the user
      const { data: sessions, error } = await supabase
        .from("study_sessions")
        .select("started_at, duration_seconds")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("started_at", { ascending: true });

      if (error) {
        console.error("Error fetching sessions for recalculation:", error);
        return false;
      }

      // Group sessions by date
      const dailyTotals: {
        [date: string]: { seconds: number; count: number };
      } = {};

      sessions.forEach((session) => {
        const date = session.started_at.split("T")[0]; // Extract YYYY-MM-DD

        if (!dailyTotals[date]) {
          dailyTotals[date] = { seconds: 0, count: 0 };
        }

        dailyTotals[date].seconds += session.duration_seconds;
        dailyTotals[date].count += 1;
      });

      // Clear existing daily stats for this user
      await supabase.from("daily_stats").delete().eq("user_id", userId);

      // Insert new daily stats
      const statsToInsert = Object.entries(dailyTotals).map(
        ([date, totals]) => ({
          user_id: userId,
          date: date,
          total_study_time_seconds: totals.seconds,
          session_count: totals.count,
        })
      );

      if (statsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("daily_stats")
          .insert(statsToInsert);

        if (insertError) {
          console.error("Error inserting recalculated stats:", insertError);
          return false;
        }
      }

      console.log("✅ Daily stats recalculated successfully");
      return true;
    } catch (error) {
      console.error("Error recalculating daily stats:", error);
      return false;
    }
  }
}
