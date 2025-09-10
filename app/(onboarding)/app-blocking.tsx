import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { SCREEN_CONFIGS } from "./config";

export default function AppBlockingScreen() {
  const [currentText, setCurrentText] = useState("");
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showAppLimitBox, setShowAppLimitBox] = useState(false);
  const [appsSelected, setAppsSelected] = useState(false);

  // Get animation config for this screen
  const config = SCREEN_CONFIGS.appBlocking;

  // Animation refs
  const ashFadeAnim = useRef(new Animated.Value(0)).current;
  const textBoxFadeAnim = useRef(new Animated.Value(0)).current;
  const appLimitBoxFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  // Text phases in sequence
  const textPhases = [
    "I want to fight to get back your time for studying! 🥊",
    "Choose the apps you want to block while you're in a study sesh."
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
          setCurrentText(currentPhaseText.slice(0, index));
          
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
              setCurrentText(""); // Reset for next phrase
            } else {
              // After second phrase, show app limit box
              setTimeout(() => {
                setShowAppLimitBox(true);
                Animated.timing(appLimitBoxFadeAnim, {
                  toValue: 1,
                  duration: 600,
                  useNativeDriver: true,
                }).start();
              }, 800);
            }
          }, 600);
        }
      }, 0); // Instant typing speed as established
    }
  };

  // Re-trigger typing when phase changes
  useEffect(() => {
    if (currentPhase > 0) {
      startTypingEffect();
    }
  }, [currentPhase]);

  const handleAppLimitSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Placeholder for Screen Time API - show mockup selection
    Alert.alert(
      "App Blocking Setup",
      "This will connect to Screen Time API to let you select apps to block during study sessions.\n\n📱 Social Media\n🎮 Games\n📺 Entertainment\n📰 News Apps\n\n(Pending Apple approval)",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Select Apps",
          onPress: () => {
            setAppsSelected(true);
            // Show continue button after "selection"
            setTimeout(() => {
              setShowContinueButton(true);
              Animated.timing(buttonFadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }).start();
            }, 500);
          }
        }
      ]
    );
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/app-blocking-clone"); // Next screen
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/solution");
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
              style={[styles.progressFill, { width: "75%" }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Main Content - Standardized Ash Layout */}
        <View style={styles.content}>
          {/* Ash Character - Boxing Ash */}
          <Animated.View style={[styles.ashContainer, { opacity: ashFadeAnim }]}>
            <Image
              source={require("@/ASH_images/Ash_Boxing.png")}
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

          {/* App Limit Selection Box */}
          {showAppLimitBox && (
            <Animated.View style={[styles.appLimitContainer, { opacity: appLimitBoxFadeAnim }]}>
              <Text style={styles.sectionLabel}>Select App Limits</Text>
              <TouchableOpacity 
                style={styles.appLimitBox}
                onPress={handleAppLimitSelection}
                activeOpacity={0.8}
              >
                <Image
                  source={require("@/ASH_images/app-limit.png")}
                  style={styles.appLimitImage}
                  contentFit="contain"
                />
                {appsSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedText}>✓ Apps Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
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
                <Text style={styles.primaryButtonText}>Let's do this! 🔥</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* DEV PASS BUTTON - Remove in production */}
        <View style={styles.devPassContainer}>
          <TouchableOpacity style={styles.devPassButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/(onboarding)/app-blocking-clone");
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
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  backButtonText: {
    fontSize: 20,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  content: {
    flex: 1,
    position: "relative",
  },
  // Standardized Ash Layout (Same as previous screens)
  ashContainer: {
    position: "absolute",
    top: -110,
    left: -90,
    zIndex: 1,
  },
  ashImage: {
    width: 325,
    height: 325,
  },
  textBoxContainer: {
    marginTop: -5,
    marginLeft: 125,
    marginRight: 15,
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
  // App Limit Selection UI
  appLimitContainer: {
    position: "absolute",
    top: "35%",
    left: 32,
    right: 32,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  appLimitBox: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    width: "100%",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appLimitImage: {
    width: 200,
    height: 120,
  },
  selectedIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#34D399",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
