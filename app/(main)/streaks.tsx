import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react-native";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import { AppBackground } from "@/components/AppBackground";
import { useAuth } from "@/contexts/AuthContext";
import { StreakService } from "@/services/streakService";
import Hero from "@/components/streaks/Hero";
import StatsChip from "@/components/streaks/StatsChip";
import CalendarGrid from "@/components/streaks/CalendarGrid";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function StreaksPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [streakStats, setStreakStats] = useState({
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [studyData, setStudyData] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // Load streak and calendar data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get current month date range
        const startDate = currentMonth.startOf("month").format("YYYY-MM-DD");
        const endDate = currentMonth.endOf("month").format("YYYY-MM-DD");

        // Load streak stats and daily study data in parallel
        const [userStreaks, dailyData] = await Promise.all([
          StreakService.getUserStreaks(user.id),
          StreakService.getDailyStudyData(user.id, startDate, endDate),
        ]);

        if (userStreaks) {
          setStreakStats({
            totalMinutes: Math.round(userStreaks.total_study_time_seconds / 60),
            currentStreak: userStreaks.current_streak,
            longestStreak: userStreaks.longest_streak,
          });
        }

        setStudyData(dailyData);
      } catch (error) {
        console.error("Error loading streak data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, currentMonth]); // Re-fetch when month changes

  // Refresh data when screen comes into focus (e.g., after completing a session)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        const refreshData = async () => {
          try {
            // Get current month date range
            const startDate = currentMonth
              .startOf("month")
              .format("YYYY-MM-DD");
            const endDate = currentMonth.endOf("month").format("YYYY-MM-DD");

            // Load fresh streak stats and daily study data
            const [userStreaks, dailyData] = await Promise.all([
              StreakService.getUserStreaks(user.id),
              StreakService.getDailyStudyData(user.id, startDate, endDate),
            ]);

            if (userStreaks) {
              setStreakStats({
                totalMinutes: Math.round(
                  userStreaks.total_study_time_seconds / 60
                ),
                currentStreak: userStreaks.current_streak,
                longestStreak: userStreaks.longest_streak,
              });
            }

            setStudyData(dailyData);
          } catch (error) {
            console.error("Error refreshing streak data:", error);
          }
        };

        refreshData();
      }
    }, [user, currentMonth])
  );

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  // Calculate average minutes per day from study data
  const avgMinutesPerDay = useMemo(() => {
    const studyDays = Object.keys(studyData).length;
    if (studyDays === 0) return 0;

    const totalMinutes = Object.values(studyData).reduce(
      (sum, minutes) => sum + minutes,
      0
    );
    return Math.round(totalMinutes / 30); // Average over 30 days
  }, [studyData]);

  return (
    <AppBackground>
      <ScrollView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Streak</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading streaks...</Text>
          </View>
        ) : (
          <>
            {/* Hero Section */}
            <Hero currentStreak={streakStats.currentStreak} />

            {/* Stats Strip */}
            <View style={styles.statsContainer}>
              <StatsChip
                icon={Clock}
                iconColor="#3B82F6"
                label="Total Minutes"
                value={streakStats.totalMinutes}
                suffix="m"
              />
              <StatsChip
                icon={TrendingUp}
                iconColor="#10B981"
                label="Avg/Day"
                value={avgMinutesPerDay}
                suffix="m"
              />
              <StatsChip
                icon={Award}
                iconColor="#F59E0B"
                label="Best Streak"
                value={streakStats.longestStreak}
              />
            </View>

            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.monthArrow}
              >
                <ArrowLeft color="#FFFFFF" size={24} />
              </TouchableOpacity>

              <Text style={[styles.monthText, { color: "#FFFFFF" }]}>
                {months[currentMonth.month()]} {currentMonth.year()}
              </Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthArrow}
              >
                <ArrowRight color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <CalendarGrid currentMonth={currentMonth} studyData={studyData} />
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  roadmapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    marginVertical: 16,
  },
  monthArrow: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 80,
  },
});
