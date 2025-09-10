import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function NotificationsScreen() {
  const [currentText, setCurrentText] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);

  // Animation refs
  const ashFadeAnim = useRef(new Animated.Value(0)).current;
  const textBoxFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonsDeclineAnim = useRef(new Animated.Value(0)).current;
  const buttonsAcceptAnim = useRef(new Animated.Value(0)).current;

  // Text phases in sequence
  const textPhases = [
    "I'd love to cheer you on and remind you to study!",
    "Can I send you friendly notifications? I promise I won't be annoying! 😊"
  ];

  useEffect(() => {
    startIntroSequence();
  }, []);

  const startIntroSequence = () => {
    // Start Ash fade in
    Animated.timing(ashFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Then fade in text box
      Animated.timing(textBoxFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
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
          
          // Add haptic feedback every few characters
          if (index % 3 === 0) {
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
              // After second phrase, show buttons
              setTimeout(() => {
                setShowButtons(true);
                // Animate both buttons in sequence
                Animated.timing(buttonsAcceptAnim, {
                  toValue: 1,
                  duration: 600,
                  useNativeDriver: true,
                }).start();
                
                setTimeout(() => {
                  Animated.timing(buttonsDeclineAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                  }).start();
                }, 200);
              }, 800);
            }
          }, 600);
        }
      }, 30); // Same smooth typing speed as demo page
    }
  };

  // Re-trigger typing when phase changes
  useEffect(() => {
    if (currentPhase > 0) {
      startTypingEffect();
    }
  }, [currentPhase]);

  const handleEnableNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Success - show confirmation and proceed
        Alert.alert(
          "Awesome! 🎉",
          "Notifications enabled! I'll send you friendly reminders to help you stay on track.",
          [{ text: "Continue", onPress: () => router.push("/(onboarding)/auth") }]
        );
      } else {
        // Permission denied - still proceed but let user know
        Alert.alert(
          "No worries! 😊",
          "You can always enable notifications later in your device settings if you change your mind.",
          [{ text: "Continue", onPress: () => router.push("/(onboarding)/auth") }]
        );
      }
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      // Fallback - just proceed to next screen
      router.push("/(onboarding)/auth");
    }
  };

  const handleMaybeLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/auth"); // Next screen
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/demo");
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
              style={[styles.progressFill, { width: "90%" }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Main Content - Standardized Ash Layout */}
        <View style={styles.content}>
          {/* Ash Character - Notification Bell Ash */}
          <Animated.View style={[styles.ashContainer, { opacity: ashFadeAnim }]}>
            <Image
              source={require("@/ASH_images/Ash_notificationBell.png")}
              style={styles.ashImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* Text Box with Typing Effect */}
          <Animated.View style={[styles.textBoxContainer, { opacity: textBoxFadeAnim }]}>
            <View style={styles.textBox}>
              <Text style={styles.ashText}>
                {currentText}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Action Buttons */}
        {showButtons && (
          <View style={styles.actionContainer}>
            <Animated.View style={{ opacity: buttonsAcceptAnim }}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleEnableNotifications}>
                <LinearGradient
                  colors={["#FF6B35", "#E94131"]}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryButtonText}>Yes, let's do it! 🔔</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={{ opacity: buttonsDeclineAnim }}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleMaybeLater}>
                <Text style={styles.secondaryButtonText}>Maybe later</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* DEV PASS BUTTON - Remove in production */}
        <View style={styles.devPassContainer}>
          <TouchableOpacity style={styles.devPassButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/(onboarding)/auth");
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
    top: -130,
    left: -90,
    zIndex: 1,
  },
  ashImage: {
    width: 350,
    height: 350,
  },
  textBoxContainer: {
    marginTop: -25,
    marginLeft: 125,
    marginRight: 0,
    height: 140, // Taller for two-line message
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
  // Action Buttons
  actionContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 16,
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
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 25,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  secondaryButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "500",
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
