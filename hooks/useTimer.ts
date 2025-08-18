import React, { useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import { MIN_SESH_TIME } from "../constants/Timer";
import { SessionService } from "../services/sessionService";
import { StreakService, UserStreak } from "../services/streakService";

export interface UseTimerReturn {
  seconds: number;
  isActive: boolean;
  isPaused: boolean;
  userStreaks: UserStreak | null;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  refreshStreaks: () => Promise<void>;
}

export function useTimer(userId: string | undefined): UseTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userStreaks, setUserStreaks] = useState<UserStreak | null>(null);

  const intervalRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const backgroundTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      // Load user streaks
      const streaks = await StreakService.getUserStreaks(userId);
      setUserStreaks(streaks);
    };

    loadInitialData();
  }, [userId]);

  // Timer interval effect
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
        lastUpdateRef.current = Date.now();
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
  }, [isActive, isPaused]);

  // No need to update session duration since we're not creating sessions until completion

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" && isActive && !isPaused) {
        backgroundTimeRef.current = Date.now();
      } else if (nextAppState === "active" && backgroundTimeRef.current > 0) {
        // Calculate time spent in background
        const backgroundDuration = Date.now() - backgroundTimeRef.current;
        const backgroundSeconds = Math.floor(backgroundDuration / 1000);

        setSeconds((prev) => prev + backgroundSeconds);
        backgroundTimeRef.current = 0;
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [isActive, isPaused]);

  const startTimer = async () => {
    if (!userId) return;

    try {
      // Start studying mode (only updates presence, no database session)
      const success = await SessionService.startStudyingMode(userId);
      if (!success) {
        console.error("Failed to start studying mode");
        return;
      }

      // Record start time for when we complete the session
      sessionStartTimeRef.current = new Date().toISOString();
      setSeconds(0);
      setIsActive(true);
      setIsPaused(false);
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const pauseTimer = async () => {
    if (!isActive) return;

    try {
      // Just pause the timer locally, no database updates needed
      setIsActive(false);
      setIsPaused(true);
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  };

  const resumeTimer = async () => {
    if (!isPaused) return;

    try {
      // Just resume the timer locally, no database updates needed
      setIsActive(true);
      setIsPaused(false);
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.error("Error resuming timer:", error);
    }
  };

  const confirmStopSession = (seconds: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (seconds < MIN_SESH_TIME) {
        Alert.alert(
          "End Session Early?",
          `This session is less than ${
            MIN_SESH_TIME / 60
          } minutes and won't count towards your streaks. Are you sure you want to end it?`,
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

  const stopTimer = async () => {
    if (!userId || !sessionStartTimeRef.current) return;

    try {
      const shouldStop = await confirmStopSession(seconds);
      if (!shouldStop) return;

      console.log("⏹️ Stopping timer - Session duration:", seconds, "seconds");

      // Complete the session
      const success = await SessionService.completeSession(
        userId,
        seconds,
        sessionStartTimeRef.current
      );

      if (success) {
        console.log("✅ Session completed successfully");

        // Refresh streaks to get updated data (streaks are already updated in completeSession)
        await refreshStreaks();

        // Reset timer state
        setIsActive(false);
        setIsPaused(false);
        setSeconds(0);
        sessionStartTimeRef.current = null;
      } else {
        console.log("❌ Failed to complete session");
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const refreshStreaks = React.useCallback(async () => {
    if (!userId) return;

    try {
      const streaks = await StreakService.getUserStreaks(userId);
      setUserStreaks(streaks);
    } catch (error) {
      console.error("Error refreshing streaks:", error);
    }
  }, [userId]);

  return {
    seconds,
    isActive,
    isPaused,
    userStreaks,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    refreshStreaks,
  };
}
