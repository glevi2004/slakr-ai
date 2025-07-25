import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pause,
  Play,
  CircleStop as StopCircle,
  Clock,
  Timer as TimerIcon,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTimer } from "../hooks/useTimer";
import { MIN_SESH_TIME } from "../constants/Timer";
import { StreakService } from "../services/streakService";

type TimerMode = "session" | "pomodoro" | "focus";

export default function Timer() {
  // Auth context
  const { user } = useAuth();
  const userId = user?.id;

  // Timer hook for Study Session mode
  const {
    seconds: sessionSeconds,
    isActive: sessionIsActive,
    isPaused: sessionIsPaused,
    startTimer: startSession,
    pauseTimer: pauseSession,
    resumeTimer: resumeSession,
    stopTimer: stopSession,
  } = useTimer(user?.id);

  // UI state
  const [timerMode, setTimerMode] = useState<TimerMode>("session");
  const [showSettings, setShowSettings] = useState(false);

  // Non-session timer states (for pomodoro and focus modes)
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Pomodoro specific state
  const [pomodoroType] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [pomodoroRound] = useState(1);

  // Focus timer specific state
  const [focusTimeMinutes, setFocusTimeMinutes] = useState(25);

  // Timer effect for non-session modes
  useEffect(() => {
    if (timerMode !== "session" && isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerMode, isActive]);

  // Settings for different modes
  const pomodoroSettings = {
    work: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60, // 15 minutes
    cyclesBeforeLongBreak: 4, // 4 work sessions before long break
  };

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getCurrentSeconds = () => {
    return timerMode === "session" ? sessionSeconds : seconds;
  };

  const getCurrentIsActive = () => {
    return timerMode === "session" ? sessionIsActive : isActive;
  };

  const getCurrentIsPaused = () => {
    return timerMode === "session" ? sessionIsPaused : false;
  };

  const getTimerDisplay = () => {
    const currentSeconds = getCurrentSeconds();

    switch (timerMode) {
      case "session":
        return formatTime(currentSeconds);
      case "pomodoro":
        const targetTime = pomodoroSettings[pomodoroType];
        const remaining = Math.max(targetTime - currentSeconds, 0);
        return formatTime(remaining);
      case "focus":
        const focusSeconds = focusTimeMinutes * 60;
        const focusRemaining = Math.max(focusSeconds - currentSeconds, 0);
        return formatTime(focusRemaining);
      default:
        return formatTime(currentSeconds);
    }
  };

  const getProgress = () => {
    const currentSeconds = getCurrentSeconds();

    switch (timerMode) {
      case "session":
        // Show progress as a visual indicator, capped at 60 minutes (1 hour)
        return Math.min(currentSeconds / 3600, 1) * 100;
      case "pomodoro":
        const targetTime = pomodoroSettings[pomodoroType];
        return Math.min(currentSeconds / targetTime, 1) * 100;
      case "focus":
        const focusSeconds = focusTimeMinutes * 60;
        return Math.min(currentSeconds / focusSeconds, 1) * 100;
      default:
        return 0;
    }
  };

  const getProgressText = () => {
    const currentSeconds = getCurrentSeconds();

    switch (timerMode) {
      case "session":
        const minutes = Math.floor(currentSeconds / 60);
        const seconds = currentSeconds % 60;
        if (minutes === 0) {
          return `${seconds} seconds`;
        } else if (seconds === 0) {
          return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
        } else {
          return `${minutes}m ${seconds}s`;
        }
      case "pomodoro":
        return `Round ${pomodoroRound} • ${
          pomodoroType === "work" ? "Focus time" : "Break time"
        }`;
      case "focus":
        const focusSeconds = focusTimeMinutes * 60;
        const remaining = Math.max(focusSeconds - currentSeconds, 0);
        if (remaining === 0) return "Focus session complete! 🎯";
        return `${Math.ceil(remaining / 60)} min remaining`;
      default:
        return "";
    }
  };

  const getProgressColor = () => {
    switch (timerMode) {
      case "session":
        return "#E94131";
      case "pomodoro":
        return pomodoroType !== "work" ? "#4CAF50" : "#E94131";
      case "focus":
        return "#FF7E33";
      default:
        return "#E94131";
    }
  };

  // Timer action handlers
  const handleStart = async () => {
    if (timerMode === "session") {
      await startSession();
    } else {
      setIsActive(true);
      // TODO: Implement pomodoro and focus timer logic
    }
  };

  const handlePause = async () => {
    if (timerMode === "session") {
      if (sessionIsPaused) {
        await resumeSession();
      } else {
        await pauseSession();
      }
    } else {
      setIsActive(false);
      // TODO: Implement pomodoro and focus timer logic
    }
  };

  const confirmStopTimer = (seconds: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (seconds < MIN_SESH_TIME) {
        Alert.alert(
          "End Session Early?",
          "This session is less than 5 minutes and won't count towards your streaks. Are you sure you want to end it?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "End Session",
              style: "destructive",
              onPress: () => resolve(true),
            },
          ]
        );
      } else {
        resolve(true);
      }
    });
  };

  const handleStop = async () => {
    const currentSeconds = getCurrentSeconds();
    const shouldStop = await confirmStopTimer(currentSeconds);

    if (!shouldStop) return;

    if (timerMode === "session") {
      await stopSession();
    } else {
      setIsActive(false);
      setSeconds(0);

      // Only update streaks if session meets minimum time
      if (currentSeconds >= MIN_SESH_TIME && userId) {
        await StreakService.updateUserStreaks(userId, currentSeconds);
      }
    }
  };

  const getSessionTitle = () => {
    switch (timerMode) {
      case "session":
        return "Study Session";
      case "pomodoro":
        return `Pomodoro - ${
          pomodoroType === "work"
            ? "Work"
            : pomodoroType === "shortBreak"
            ? "Short Break"
            : "Long Break"
        }`;
      case "focus":
        return "Focus Timer";
      default:
        return "Timer";
    }
  };

  const TimerModeSelector = () => (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          timerMode === "session" && styles.modeButtonActive,
        ]}
        onPress={() => {
          setTimerMode("session");
          if (timerMode !== "session") {
            setIsActive(false);
            setSeconds(0);
          }
        }}
      >
        <TrendingUp
          size={14}
          color={timerMode === "session" ? "#E94131" : "#9DA4AE"}
        />
        <Text
          style={[
            styles.modeButtonText,
            timerMode === "session" && styles.modeButtonTextActive,
          ]}
        >
          Session
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          timerMode === "pomodoro" && styles.modeButtonActive,
        ]}
        onPress={() => {
          setTimerMode("pomodoro");
          if (timerMode !== "pomodoro") {
            setIsActive(false);
            setSeconds(0);
          }
        }}
      >
        <Clock
          size={14}
          color={timerMode === "pomodoro" ? "#E94131" : "#9DA4AE"}
        />
        <Text
          style={[
            styles.modeButtonText,
            timerMode === "pomodoro" && styles.modeButtonTextActive,
          ]}
        >
          Pomodoro
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          timerMode === "focus" && styles.modeButtonActive,
        ]}
        onPress={() => {
          setTimerMode("focus");
          if (timerMode !== "focus") {
            setIsActive(false);
            setSeconds(0);
          }
        }}
      >
        <TimerIcon
          size={14}
          color={timerMode === "focus" ? "#E94131" : "#9DA4AE"}
        />
        <Text
          style={[
            styles.modeButtonText,
            timerMode === "focus" && styles.modeButtonTextActive,
          ]}
        >
          Focus
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[styles.sessionCard, showSettings && styles.sessionCardExpanded]}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{getSessionTitle()}</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Clock size={16} color={showSettings ? "#E94131" : "#9DA4AE"} />
          <Text
            style={[
              styles.settingsButtonText,
              showSettings && styles.settingsButtonTextActive,
            ]}
          >
            Settings
          </Text>
          {showSettings ? (
            <ChevronUp size={16} color="#E94131" />
          ) : (
            <ChevronDown size={16} color="#9DA4AE" />
          )}
        </TouchableOpacity>
      </View>

      {/* Timer Mode Selector */}
      <TimerModeSelector />

      <Text style={styles.timerDisplay}>{getTimerDisplay()}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${getProgress()}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{getProgressText()}</Text>
      </View>

      {showSettings && (
        <View style={styles.settingsOptions}>
          <Text style={styles.settingsTitle}>
            {timerMode === "session" && "Session Settings"}
            {timerMode === "pomodoro" && "Pomodoro Settings"}
            {timerMode === "focus" && "Focus Timer Settings"}
          </Text>

          {timerMode === "pomodoro" && (
            <View style={styles.settingsContainer}>
              <View style={styles.setting}>
                <Text style={styles.settingLabel}>Work</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>
                    {pomodoroSettings.work / 60}m
                  </Text>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.setting}>
                <Text style={styles.settingLabel}>Short Break</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>
                    {pomodoroSettings.shortBreak / 60}m
                  </Text>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.setting}>
                <Text style={styles.settingLabel}>Long Break</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>
                    {pomodoroSettings.longBreak / 60}m
                  </Text>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.setting}>
                <Text style={styles.settingLabel}>
                  Cycles Before Long Break
                </Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>
                    {pomodoroSettings.cyclesBeforeLongBreak}
                  </Text>
                  <TouchableOpacity style={styles.controlButton}>
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {timerMode === "focus" && (
            <View style={styles.settingsContainer}>
              <View style={styles.setting}>
                <Text style={styles.settingLabel}>Focus Duration</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() =>
                      setFocusTimeMinutes(Math.max(5, focusTimeMinutes - 5))
                    }
                  >
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>{focusTimeMinutes}m</Text>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() =>
                      setFocusTimeMinutes(Math.min(180, focusTimeMinutes + 5))
                    }
                  >
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {timerMode === "session" && (
            <View style={styles.settingsContainer}>
              <Text style={styles.settingDescription}>
                Study session mode counts up your study time. Each completed
                session contributes to your daily streak!
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.sessionControls}>
        {getCurrentIsActive() || getCurrentIsPaused() ? (
          <>
            <TouchableOpacity
              style={[styles.sessionButton, styles.sessionEndButton]}
              onPress={handleStop}
            >
              <StopCircle size={20} color="#FFFFFF" />
              <Text style={styles.sessionButtonText}>End</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sessionButton}
              onPress={handlePause}
            >
              {getCurrentIsPaused() ? (
                <Play size={20} color="#FFFFFF" />
              ) : (
                <Pause size={20} color="#FFFFFF" />
              )}
              <Text style={styles.sessionButtonText}>
                {getCurrentIsPaused() ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.sessionButton, styles.sessionStartButton]}
            onPress={handleStart}
          >
            <LinearGradient
              colors={["#E94131", "#FF7E33"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.sessionButtonText}>Start Sesh</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2D2D2D",
  },
  sessionCardExpanded: {
    paddingBottom: 30,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#2D2D2D",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E94131",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#9DA4AE",
    textAlign: "right",
  },
  sessionControls: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  sessionStartButton: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  sessionEndButton: {
    backgroundColor: "#E94131",
    borderColor: "#E94131",
  },
  sessionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
  },
  // Mode Selector Styles
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: "#1A1A1A",
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9DA4AE",
    marginLeft: 4,
  },
  modeButtonTextActive: {
    color: "#E94131",
  },
  // Settings Styles
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#2D2D2D",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9DA4AE",
    marginLeft: 6,
    marginRight: 4,
  },
  settingsButtonTextActive: {
    color: "#E94131",
  },
  settingsOptions: {
    marginTop: 20,
    marginBottom: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2D2D2D",
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  settingsContainer: {
    marginBottom: 20,
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    flex: 1,
  },
  settingControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2D2D2D",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  settingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: "center",
  },
  settingDescription: {
    fontSize: 14,
    color: "#9DA4AE",
    lineHeight: 20,
    textAlign: "center",
  },
});
