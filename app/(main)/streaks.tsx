import { useState, useEffect, useMemo } from "react";
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
import { AppBackground } from "@/components/AppBackground";
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
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [streakStats, setStreakStats] = useState({
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [studyData, setStudyData] = useState<{ [key: string]: number }>({});

  // Mock data for now - replace with actual data fetching
  useEffect(() => {
    const mockData = () => {
      setStreakStats({
        totalMinutes: 1250,
        currentStreak: 5,
        longestStreak: 12,
      });

      // Mock study data for calendar
      const mockStudyData: { [key: string]: number } = {};
      // Add some random study sessions for demo
      for (let i = 1; i <= 30; i++) {
        const date = dayjs().date(i).format("YYYY-MM-DD");
        if (Math.random() > 0.3) {
          // 70% chance of study session
          mockStudyData[date] = Math.floor(Math.random() * 120) + 30; // 30-150 minutes
        }
      }
      setStudyData(mockStudyData);
    };

    mockData();
  }, []);

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
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>

          <Text style={[styles.monthText, { color: "#FFFFFF" }]}>
            {months[currentMonth.month()]} {currentMonth.year()}
          </Text>

          <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
            <ArrowRight color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <CalendarGrid currentMonth={currentMonth} studyData={studyData} />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
