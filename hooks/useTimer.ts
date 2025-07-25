import { useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus, Alert } from "react-native";
import { SessionService, StudySession } from "../services/sessionService";
import { StreakService, UserStreak } from "../services/streakService";
import { MIN_SESH_TIME } from "../constants/Timer";

export interface UseTimerReturn {
  seconds: number;
  isActive: boolean;
  isPaused: boolean;
  currentSession: StudySession | null;
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
  const [currentSession, setCurrentSession] = useState<StudySession | null>(
    null
  );
  const [userStreaks, setUserStreaks] = useState<UserStreak | null>(null);

  const intervalRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const backgroundTimeRef = useRef<number>(0);

  // Load initial data and check for existing sessions
  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      // Load user streaks
      const streaks = await StreakService.getUserStreaks(userId);
      setUserStreaks(streaks);

      // Check for existing active session
      const activeSession = await SessionService.getActiveSession(userId);
      if (activeSession) {
        setCurrentSession(activeSession);

        // Calculate elapsed time since session started
        const startTime = new Date(activeSession.started_at).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);

        setSeconds(elapsedSeconds);

        if (activeSession.status === "active") {
          setIsActive(true);
          setIsPaused(false);
        } else if (activeSession.status === "paused") {
          setIsActive(false);
          setIsPaused(true);
        }
      }
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

  // Update session duration every 30 seconds
  useEffect(() => {
    if (!currentSession || !isActive || isPaused) return;

    const updateInterval = setInterval(async () => {
      await SessionService.updateSessionDuration(currentSession.id, seconds);
    }, 30000); // 30 seconds

    return () => clearInterval(updateInterval);
  }, [currentSession, isActive, isPaused, seconds]);

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
      // Create new session
      const session = await SessionService.createSession(userId);
      if (!session) {
        console.error("Failed to create session");
        return;
      }

      setCurrentSession(session);
      setSeconds(0);
      setIsActive(true);
      setIsPaused(false);
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const pauseTimer = async () => {
    if (!currentSession) return;

    try {
      // Update session duration before pausing
      await SessionService.updateSessionDuration(currentSession.id, seconds);

      // Pause session
      const success = await SessionService.pauseSession(currentSession.id);
      if (success) {
        setIsActive(false);
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  };

  const resumeTimer = async () => {
    if (!currentSession) return;

    try {
      const success = await SessionService.resumeSession(currentSession.id);
      if (success) {
        setIsActive(true);
        setIsPaused(false);
        lastUpdateRef.current = Date.now();
      }
    } catch (error) {
      console.error("Error resuming timer:", error);
    }
  };

  const confirmStopSession = (seconds: number): Promise<boolean> => {
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

  const stopTimer = async () => {
    if (!currentSession || !userId) return;

    try {
      const shouldStop = await confirmStopSession(seconds);
      if (!shouldStop) return;

      console.log("⏹️ Stopping timer - Session duration:", seconds, "seconds");

      // Complete the session only if it meets minimum time
      const success = await SessionService.completeSession(
        currentSession.id,
        seconds
      );

      if (success) {
        console.log("✅ Session completed successfully");

        // Update streaks only if session meets minimum time
        if (seconds >= MIN_SESH_TIME) {
          console.log("🚀 Updating streaks for session duration:", seconds);
          const updatedStreaks = await StreakService.updateUserStreaks(
            userId,
            seconds
          );
          if (updatedStreaks) {
            console.log("📈 Streaks updated:", updatedStreaks);
            setUserStreaks(updatedStreaks);
          } else {
            console.log("❌ Failed to update streaks");
          }
        } else {
          console.log(
            "⏰ Session too short for streak update:",
            seconds,
            "seconds"
          );
        }

        // Reset timer state
        setIsActive(false);
        setIsPaused(false);
        setSeconds(0);
        setCurrentSession(null);
      } else {
        console.log("❌ Failed to complete session");
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const refreshStreaks = async () => {
    if (!userId) return;

    try {
      const streaks = await StreakService.getUserStreaks(userId);
      setUserStreaks(streaks);
    } catch (error) {
      console.error("Error refreshing streaks:", error);
    }
  };

  return {
    seconds,
    isActive,
    isPaused,
    currentSession,
    userStreaks,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    refreshStreaks,
  };
}
