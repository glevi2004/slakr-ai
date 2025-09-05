import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTimer } from "../hooks/useTimer";
import { eventService, STREAK_EVENTS } from "../services/eventService";
import { StreakService } from "../services/streakService";

export default function StreakCard() {
  const { user } = useAuth();
  const { userStreaks, refreshStreaks } = useTimer(user?.id);
  const [todaysStudyTime, setTodaysStudyTime] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const loadStudyTime = async () => {
      try {
        const todayTime = await StreakService.getTodaysStudyTime(user.id);
        setTodaysStudyTime(todayTime);
      } catch (error) {
        console.error("Error loading study time:", error);
      }
    };

    const refreshAllData = async () => {
      await loadStudyTime();
      refreshStreaks();
    };

    // Load initial data
    refreshAllData();

    // Subscribe to streak update events
    const unsubscribeStreak = eventService.subscribe(
      STREAK_EVENTS.STREAK_UPDATED,
      refreshAllData
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribeStreak();
    };
  }, [user?.id]);

  const formatTotalTime = (seconds: number) => {
    const totalMinutes = Math.round(seconds / 60);

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
    if (!userStreaks) return "0 day streak";

    if (userStreaks.current_streak === 0) {
      return "Start your streak!";
    } else if (userStreaks.current_streak === 1) {
      return "1 day streak";
    } else {
      return `${userStreaks.current_streak} day streak`;
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
      <View style={styles.streakGradient}>
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
            Total: {formatTotalTime(userStreaks?.total_study_time_seconds || 0)}
          </Text>
          {userStreaks && userStreaks.longest_streak > 0 && (
            <Text style={styles.longestStreakText}>
              Best: {userStreaks.longest_streak} days
            </Text>
          )}
        </View>
      </View>
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
    borderColor: "#E0E0E0",
    borderRadius: 16,
    backgroundColor: "#F9F9F9",
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
    color: "#333333",
    marginBottom: 2,
  },
  streakTime: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 8,
  },
  streakStats: {
    alignItems: "flex-end",
  },
  totalTimeText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 2,
  },
  longestStreakText: {
    fontSize: 11,
    color: "#888888",
  },
});
