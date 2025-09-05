import dayjs from "dayjs";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
// Account for: marginHorizontal (32) + padding (40) + day cell margins (28 = 4px between 7 cells)
const AVAILABLE_WIDTH = width - 32 - 40 - 28;
const CELL_SIZE = AVAILABLE_WIDTH / 7;

type DayStatus = "earned" | "missed" | "future" | "today";

interface CalendarGridProps {
  currentMonth: dayjs.Dayjs;
  studyData: { [key: string]: number }; // date string -> minutes studied
}

interface DayData {
  date: string;
  day: number | null;
  status: DayStatus;
  isToday: boolean;
  minutesSeshed: number;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarGrid({
  currentMonth,
  studyData,
}: CalendarGridProps) {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Helper function to get minutes seshed for a specific date
  const getMinutesForDate = (dateString: string): number => {
    return studyData[dateString] || 0;
  };

  // Helper function to get heat map intensity based on minutes
  const getHeatMapIntensity = (minutes: number): number => {
    if (minutes === 0) return 0; // None
    if (minutes >= 1 && minutes <= 29) return 1; // Spark
    if (minutes >= 30 && minutes <= 59) return 2; // Ember
    if (minutes >= 60 && minutes <= 119) return 3; // Flame
    if (minutes >= 120 && minutes <= 239) return 4; // Blaze
    return 5; // Inferno (240+)
  };

  const getDayStatus = (dateString: string): DayStatus => {
    const today = dayjs().format("YYYY-MM-DD");
    const targetDate = dayjs(dateString);
    const todayDate = dayjs();

    if (targetDate.isAfter(todayDate, "day")) {
      return "future";
    }

    if (dateString === today) {
      return "today";
    }

    // Check if there's study data for this date
    const minutes = getMinutesForDate(dateString);
    return minutes > 0 ? "earned" : "missed";
  };

  const generateCalendarData = (): DayData[] => {
    const firstDay = currentMonth.startOf("month");
    const daysInMonth = currentMonth.daysInMonth();
    const dayOfWeek = firstDay.day(); // 0 is Sunday
    const today = dayjs();

    const data: DayData[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < dayOfWeek; i++) {
      data.push({
        date: "",
        day: null,
        status: "future",
        isToday: false,
        minutesSeshed: 0,
      });
    }

    // Add the actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentMonth.date(day);
      const dateString = date.format("YYYY-MM-DD");
      const isToday = date.isSame(today, "day");
      const status = getDayStatus(dateString);
      const minutesSeshed = getMinutesForDate(dateString);

      data.push({
        date: dateString,
        day,
        status: isToday ? "today" : status,
        isToday,
        minutesSeshed,
      });
    }

    return data;
  };

  const renderDayCell = ({ item }: { item: DayData }) => {
    if (item.day === null) {
      return <View style={styles.emptyCell} />;
    }

    const heatMapIntensity = getHeatMapIntensity(item.minutesSeshed);

    const cellStyle = [
      styles.dayCell,
      item.status === "earned" && [
        styles.earnedDay,
        getHeatMapStyle(heatMapIntensity),
      ],
      item.status === "missed" && styles.missedDay,
      item.status === "future" && styles.futureDay,
      item.isToday && styles.todayBorder,
      // Apply heat map styling for today if there are minutes studied
      item.isToday &&
        item.minutesSeshed > 0 &&
        getHeatMapStyle(heatMapIntensity),
    ];

    const handleDayPress = () => {
      if (item.minutesSeshed > 0 || item.isToday) {
        setSelectedDay(item);
        setShowModal(true);
      }
    };

    return (
      <TouchableOpacity style={cellStyle} onPress={handleDayPress}>
        <Text
          style={[
            styles.dayText,
            item.status === "earned" && styles.earnedText,
            item.status === "missed" && styles.missedText,
            item.status === "future" && styles.futureText,
            item.isToday && styles.todayText,
          ]}
        >
          {item.day}
        </Text>

        {/* Ash stamp for earned days and today with minutes */}
        {((item.status === "earned" && item.minutesSeshed > 0) ||
          (item.isToday && item.minutesSeshed > 0)) && (
          <View style={styles.ashStamp}>
            <Text style={styles.ashStampEmoji}>🔥</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Helper function to get heat map style based on intensity
  const getHeatMapStyle = (intensity: number) => {
    switch (intensity) {
      case 0:
        return { backgroundColor: "rgba(0, 0, 0, 0.05)" }; // None - grid background
      case 1:
        return { backgroundColor: "rgba(233, 65, 49, 0.2)" }; // Spark (1-29 min)
      case 2:
        return { backgroundColor: "rgba(233, 65, 49, 0.4)" }; // Ember (30-59 min)
      case 3:
        return { backgroundColor: "rgba(233, 65, 49, 0.6)" }; // Flame (60-119 min)
      case 4:
        return { backgroundColor: "rgba(233, 65, 49, 0.8)" }; // Blaze (120-239 min)
      case 5:
        return { backgroundColor: "#E94131" }; // Inferno (240+ min)
      default:
        return { backgroundColor: "rgba(0, 0, 0, 0.05)" };
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.daysOfWeek}>
          {DAYS_OF_WEEK.map((day, index) => (
            <View key={index} style={styles.dayOfWeekCell}>
              <Text style={[styles.dayOfWeekText, { color: "#666666" }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: "rgba(248, 248, 248, 0.8)",
            borderColor: "rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        <View style={styles.content}>
          {renderHeader()}
          <FlatList
            data={generateCalendarData()}
            renderItem={renderDayCell}
            numColumns={7}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.calendarGrid}
          />
        </View>
      </View>

      {/* Day Details Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            {selectedDay && (
              <>
                <Text style={styles.modalTitle}>
                  {dayjs(selectedDay.date).format("MMMM D, YYYY")}
                </Text>
                <Text style={styles.modalMinutes}>
                  {selectedDay.minutesSeshed} minutes studied
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    padding: 20,
  },
  headerContainer: {
    marginBottom: 16,
  },
  daysOfWeek: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayOfWeekCell: {
    width: CELL_SIZE,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  dayOfWeekText: {
    fontSize: 14,
    fontWeight: "600",
  },
  calendarGrid: {
    flexGrow: 1,
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 2,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 2,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  earnedDay: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  missedDay: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  futureDay: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  earnedText: {
    color: "#10B981",
  },
  missedText: {
    color: "#999999",
  },
  futureText: {
    color: "#CCCCCC",
  },
  todayText: {
    color: "#3B82F6",
  },
  ashStamp: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  ashStampEmoji: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(248, 248, 248, 0.95)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  modalMinutes: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 16,
  },
  modalCloseButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
