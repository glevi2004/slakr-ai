import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { StreakService, UserStreak } from "../services/streakService";

export default function StreakCard() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [todaysStudyTime, setTodaysStudyTime] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const loadStreakData = async () => {
      try {
        const [streaks, todayTime] = await Promise.all([
          StreakService.getUserStreaks(user.id),
          StreakService.getTodaysStudyTime(user.id),
        ]);

        setStreakData(streaks);
        setTodaysStudyTime(todayTime);
      } catch (error) {
        console.error("Error loading streak data:", error);
      }
    };

    loadStreakData();

    // Refresh every 30 seconds when user is viewing the page
    const interval = setInterval(loadStreakData, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const formatTotalTime = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);

    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  const formatTodaysTime = (seconds: number) => {
    return formatTotalTime(seconds);
  };

  const getCurrentStreakDisplay = () => {
    if (!streakData) return "0 day streak";

    if (streakData.current_streak === 0) {
      return "Start your streak!";
    } else if (streakData.current_streak === 1) {
      return "1 day streak";
    } else {
      return `${streakData.current_streak} day streak`;
    }
  };

  const getTodaysTimeText = () => {
    if (todaysStudyTime > 0) {
      return `Today: ${formatTodaysTime(todaysStudyTime)}`;
    } else {
      return "No study time today";
    }
  };

  if (!user) {
    return null; // Don't show streak card if not authenticated
  }

  return (
    <View style={styles.streakCard}>
      <LinearGradient
        colors={["rgba(233, 65, 49, 0.15)", "rgba(233, 65, 49, 0.05)"]}
        style={styles.streakGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.streakIconContainer}>
          <LinearGradient
            colors={["#E94131", "#FF7E33"]}
            style={styles.streakIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        <View style={styles.streakInfo}>
          <Text style={styles.streakCount}>{getCurrentStreakDisplay()}</Text>
          <Text style={styles.streakTime}>{getTodaysTimeText()}</Text>
        </View>

        <View style={styles.streakStats}>
          <Text style={styles.totalTimeText}>
            Total: {formatTotalTime(streakData?.total_study_time_seconds || 0)}
          </Text>
          {streakData && streakData.longest_streak > 0 && (
            <Text style={styles.longestStreakText}>
              Best: {streakData.longest_streak} days
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  streakCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  streakGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(233, 65, 49, 0.2)",
    borderRadius: 16,
  },
  streakIconContainer: {
    marginRight: 12,
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  streakTime: {
    fontSize: 13,
    color: "#9DA4AE",
    marginBottom: 8,
  },
  streakStats: {
    alignItems: "flex-end",
  },
  totalTimeText: {
    fontSize: 12,
    color: "#9DA4AE",
    marginBottom: 2,
  },
  longestStreakText: {
    fontSize: 11,
    color: "#707070",
  },
});
