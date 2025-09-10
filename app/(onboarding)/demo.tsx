import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SCREEN_CONFIGS, createFadeInAnimation } from "./config";

export default function DemoScreen() {
  const [currentText, setCurrentText] = useState("");
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showPostConfettiMessage, setShowPostConfettiMessage] = useState(false);
  const [postConfettiText, setPostConfettiText] = useState("");
  
  // Get animation config for this screen
  const config = SCREEN_CONFIGS.demo;
  
  // Timer functionality state
  const [timerMode, setTimerMode] = useState<"session" | "pomodoro" | "focus">("session");
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Animation refs
  const ashFadeAnim = useRef(new Animated.Value(0)).current;
  const textBoxFadeAnim = useRef(new Animated.Value(0)).current;
  const timerFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  // Confetti ref
  const confettiRef = useRef<any>(null);

  // Text phases in sequence
  const textPhases = [
    "Perfect! Your apps are now blocked during study time. 💡",
    "Let's start your first study sesh!"
  ];

  useEffect(() => {
    startIntroSequence();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, config.timer.updateInterval);
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

  const startIntroSequence = () => {
    // Start Ash fade in
    Animated.timing(ashFadeAnim, createFadeInAnimation(ashFadeAnim, config.animations.ashFadeIn)).start(() => {
      // Then fade in text box
      Animated.timing(textBoxFadeAnim, createFadeInAnimation(textBoxFadeAnim, config.animations.textBoxFadeIn)).start(() => {
        // Start typing effect
        startTypingEffect();
      });
    });
  };

  const startTypingEffect = () => {
    if (currentPhase < textPhases.length) {
      const currentPhaseText = textPhases[currentPhase];
      let index = 0;

      const typingInterval = setInterval(() => {
        if (index <= currentPhaseText.length) {
          // Build up text from all previous phases plus current progress
          const completedPhases = textPhases.slice(0, currentPhase).join(" ");
          const currentProgress = currentPhaseText.slice(0, index);
          const fullText = currentPhase > 0 ? `${completedPhases} ${currentProgress}` : currentProgress;
          
          setCurrentText(fullText);
          
          // Add haptic feedback every few characters (only for non-instant typing)
          if (config.typingSpeed > 0 && index % 3 === 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          index++;
        } else {
          clearInterval(typingInterval);
          
          // Success haptic when phrase is complete
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Move to next phase after a pause
          setTimeout(() => {
            if (currentPhase === 0) {
              // After first phrase, move to second
              setCurrentPhase(1);
            } else {
              // After second phrase, show timer
              setTimeout(() => {
                setShowTimer(true);
                Animated.timing(timerFadeAnim, createFadeInAnimation(timerFadeAnim, config.animations.textBoxFadeIn)).start();
              }, config.animations.buttonDelay);
            }
          }, config.animations.phraseTransition);
        }
      }, config.typingSpeed); // Typing speed from config
    }
  };

  // Re-trigger typing when phase changes
  useEffect(() => {
    if (currentPhase > 0) {
      startTypingEffect();
    }
  }, [currentPhase]);

  // Timer helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerDisplay = () => {
    if (timerMode === "session") {
      return formatTime(seconds);
    } else if (timerMode === "pomodoro") {
      const remainingTime = 25 * 60 - seconds; // 25 minute pomodoro
      return remainingTime > 0 ? formatTime(remainingTime) : "00:00";
    } else {
      const remainingTime = 25 * 60 - seconds; // 25 minute focus
      return remainingTime > 0 ? formatTime(remainingTime) : "00:00";
    }
  };

  const getProgressWidth = () => {
    if (timerMode === "session") {
      return Math.min((seconds / (60 * 60)) * 100, 100); // Progress over 1 hour
    } else {
      return Math.min((seconds / (25 * 60)) * 100, 100); // Progress over 25 minutes
    }
  };

  const handleStartSesh = () => {
    if (!isActive && !isPaused) {
      // First time starting
      setIsActive(true);
      setSessionStarted(true);
      
      // Trigger confetti on first start
      if (!confettiTriggered) {
        setConfettiTriggered(true);
        if (confettiRef.current) {
          confettiRef.current.start();
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show post-confetti message after confetti
        setTimeout(() => {
          setShowPostConfettiMessage(true);
          startPostConfettiTyping();
        }, config.confettiDelay);
      }
    } else if (isPaused) {
      // Resume
      setIsPaused(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Pause
      setIsPaused(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setSeconds(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleModeChange = (mode: "session" | "pomodoro" | "focus") => {
    setTimerMode(mode);
    setIsActive(false);
    setIsPaused(false);
    setSeconds(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startPostConfettiTyping = () => {
    const message = "Great! You started your first sesh. When you start a sesh, I will lock your apps to enhance your focus. 🔒";
    let index = 0;

    const typingInterval = setInterval(() => {
      if (index <= message.length) {
        setPostConfettiText(message.slice(0, index));
        
        // Add haptic feedback every few characters (only for non-instant typing)
        if (config.typingSpeed > 0 && index % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        index++;
      } else {
        clearInterval(typingInterval);
        
        // Success haptic when phrase is complete
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show continue button after typing is complete
        setTimeout(() => {
          setShowContinueButton(true);
          Animated.timing(buttonFadeAnim, createFadeInAnimation(buttonFadeAnim, config.animations.buttonFadeIn)).start();
        }, config.animations.buttonDelay);
      }
    }, config.typingSpeed); // Typing speed from config
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/notifications"); // Next screen
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/app-blocking");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={["#FF6B35", "#E94131"]}
              style={[styles.progressFill, { width: "85%" }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Main Content - Standardized Ash Layout */}
        <View style={styles.content}>
          {/* Ash Character - Lightbulb Ash */}
          <Animated.View style={[styles.ashContainer, { opacity: ashFadeAnim }]}>
            <Image
              source={require("@/ASH_images/Ash_Lightbulb.png")}
              style={styles.ashImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* Text Box with Typing Effect */}
          <Animated.View style={[styles.textBoxContainer, { opacity: textBoxFadeAnim }]}>
            <View style={styles.textBox}>
              <Text style={styles.ashText}>
                {showPostConfettiMessage ? postConfettiText : currentText}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          </Animated.View>

          {/* Demo Timer Card */}
          {showTimer && (
            <Animated.View style={[styles.timerContainer, { opacity: timerFadeAnim }]}>
              <View style={styles.demoTimerCard}>
                <View style={styles.timerHeader}>
                  <Text style={styles.timerTitle}>Study Session</Text>
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => {
                      setShowSettings(!showSettings);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <MaterialIcons name="settings" size={16} color={showSettings ? "#E94131" : "#9DA4AE"} />
                    <Text style={[styles.settingsText, showSettings && { color: "#E94131" }]}>Settings</Text>
                    <MaterialIcons 
                      name={showSettings ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={16} 
                      color={showSettings ? "#E94131" : "#9DA4AE"} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modeSelector}>
                  <TouchableOpacity 
                    style={[styles.modeButton, timerMode === "session" && styles.modeButtonActive]}
                    onPress={() => handleModeChange("session")}
                  >
                    <MaterialIcons name="trending-up" size={14} color={timerMode === "session" ? "#E94131" : "#9DA4AE"} />
                    <Text style={[styles.modeButtonText, timerMode === "session" && styles.modeButtonTextActive]}>Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modeButton, timerMode === "pomodoro" && styles.modeButtonActive]}
                    onPress={() => handleModeChange("pomodoro")}
                  >
                    <MaterialIcons name="access-time" size={14} color={timerMode === "pomodoro" ? "#E94131" : "#9DA4AE"} />
                    <Text style={[styles.modeButtonText, timerMode === "pomodoro" && styles.modeButtonTextActive]}>Pomodoro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modeButton, timerMode === "focus" && styles.modeButtonActive]}
                    onPress={() => handleModeChange("focus")}
                  >
                    <MaterialIcons name="timer" size={14} color={timerMode === "focus" ? "#E94131" : "#9DA4AE"} />
                    <Text style={[styles.modeButtonText, timerMode === "focus" && styles.modeButtonTextActive]}>Focus</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.timerDisplay}>{getTimerDisplay()}</Text>
                
                <View style={styles.timerProgressContainer}>
                  <View style={styles.timerProgressBar}>
                    <View style={[styles.timerProgressFill, { width: `${getProgressWidth()}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{formatTime(seconds)}</Text>
                </View>

                {showSettings && (
                  <View style={styles.settingsMenu}>
                    <Text style={styles.settingDescription}>
                      {timerMode === "session" && "Study session mode counts up your study time."}
                      {timerMode === "pomodoro" && "25-minute focused work sessions with breaks."}
                      {timerMode === "focus" && "Customizable focus timer for deep work."}
                    </Text>
                  </View>
                )}

                <View style={styles.timerControls}>
                  {isActive || isPaused ? (
                    <TouchableOpacity
                      style={[styles.controlButton, styles.stopButton, styles.fullWidthButton]}
                      onPress={handleStop}
                    >
                      <MaterialIcons name="stop" size={20} color="#FFFFFF" />
                      <Text style={styles.controlButtonText}>End</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.startButton}
                      onPress={handleStartSesh}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#E94131", "#FF7E33"]}
                        style={styles.startButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                        <Text style={styles.startButtonText}>Start Sesh</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Continue Button */}
        {showContinueButton && (
          <Animated.View style={[styles.actionContainer, { opacity: buttonFadeAnim }]}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <LinearGradient
                colors={["#FF6B35", "#E94131"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Amazing! Let's continue 🎉</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Confetti Cannon */}
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: -10, y: 0 }}
          explosionSpeed={350}
          fallSpeed={2500}
          fadeOut={true}
          autoStart={false}
          colors={['#FF6B35', '#E94131', '#FFD700', '#FF4757', '#5DADE2']}
        />

        {/* DEV PASS BUTTON - Remove in production */}
        <View style={styles.devPassContainer}>
          <TouchableOpacity style={styles.devPassButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/(onboarding)/notifications");
          }}>
            <Text style={styles.devPassText}>🚀 DEV PASS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  backButtonText: {
    fontSize: 20,
    color: "#666666",
    fontWeight: "600",
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  // Standardized Ash Layout
  ashContainer: {
    position: "absolute",
    top: -80,
    left: -50,
    zIndex: 1,
  },
  ashImage: {
    width: 250,
    height: 250,
  },
  textBoxContainer: {
    marginTop: -5,
    marginLeft: 125,
    marginRight: 0,
    height: 160, // Taller for longer message
  },
  textBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  ashText: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
    lineHeight: 22,
  },
  cursor: {
    color: "#FF6B35",
    fontWeight: "bold",
  },
  // Demo Timer Card
  timerContainer: {
    position: "absolute",
    top: "35%",
    left: 20,
    right: 20,
  },
  demoTimerCard: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsText: {
    fontSize: 14,
    color: "#9DA4AE",
    fontWeight: "500",
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
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
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9DA4AE",
  },
  modeButtonTextActive: {
    color: "#E94131",
    fontWeight: "600",
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 16,
  },
  timerProgressContainer: {
    marginBottom: 24,
  },
  timerProgressBar: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    marginBottom: 8,
  },
  timerProgressFill: {
    height: "100%",
    backgroundColor: "#E94131",
    borderRadius: 4,
    width: "0%", // Starts at 0
  },
  progressText: {
    fontSize: 14,
    color: "#9DA4AE",
    textAlign: "right",
  },
  startButton: {
    borderRadius: 12,
    overflow: "hidden",
    width: "100%", // Full width like in the picture
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16, // Increased padding for proper height
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  settingsMenu: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
    textAlign: "center",
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#666666",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: "#777777",
  },
  stopButton: {
    backgroundColor: "#E94131",
    borderColor: "#E94131",
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  fullWidthButton: {
    flex: 0, // Override flex: 1 from controlButton
    width: "100%", // Full width
  },
  // Action Button
  actionContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  primaryButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  // DEV PASS BUTTON - Remove in production
  devPassContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  devPassButton: {
    backgroundColor: "#FF4757",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  devPassText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
