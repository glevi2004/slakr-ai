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
import { SCREEN_CONFIGS, createFadeInAnimation } from "./config";

export default function StudyStruggleScreen() {
  const [currentText, setCurrentText] = useState("");
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0); // Track which text phase we're in
  
  // Get animation config for this screen
  const config = SCREEN_CONFIGS.studyStruggle;
  
  // Animation refs
  const ashFadeAnim = useRef(new Animated.Value(0)).current;
  const textBoxFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  // Text phases in sequence
  const textPhases = [
    "Let me guess?",
    "Studying feels like this sometimes.",
    "Phone distractions, lost focus, feeling overwhelmed... 😔"
  ];
  
  useEffect(() => {
    startIntroSequence();
  }, []);

  const startIntroSequence = () => {
    // Step 1: Ash appears
    Animated.timing(ashFadeAnim, createFadeInAnimation(ashFadeAnim, config.animations.ashFadeIn)).start(() => {
      // Step 2: Text box appears
      Animated.timing(textBoxFadeAnim, createFadeInAnimation(textBoxFadeAnim, config.animations.textBoxFadeIn)).start(() => {
        // Step 3: Start typing effect with first phase
        startTypingPhase(0);
      });
    });
  };

  const startTypingPhase = (phaseIndex: number) => {
    if (phaseIndex >= textPhases.length) {
      // All phases complete, show button
      setTimeout(() => {
        setShowContinueButton(true);
        Animated.timing(buttonFadeAnim, createFadeInAnimation(buttonFadeAnim, config.animations.buttonFadeIn)).start();
      }, config.animations.buttonDelay);
      return;
    }

    const currentPhaseText = textPhases[phaseIndex];
    let index = 0;
    
    const typingInterval = setInterval(() => {
      if (index <= currentPhaseText.length) {
        // Build up text from all previous phases plus current progress
        const completedPhases = textPhases.slice(0, phaseIndex).join(" ");
        const currentProgress = currentPhaseText.slice(0, index);
        const fullText = phaseIndex > 0 ? `${completedPhases} ${currentProgress}` : currentProgress;
        
        setCurrentText(fullText);
        
        // Add haptic feedback every few characters for typing feel
        if (index % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        index++;
      } else {
        clearInterval(typingInterval);
        // Phase complete, pause then start next phase
        setTimeout(() => {
          startTypingPhase(phaseIndex + 1);
        }, config.animations.phraseTransition); // Brief pause between phrases
      }
    }, config.typingSpeed); // Typing speed from config
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/solution");
  };

  const goBack = () => {
    router.back();
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
              style={[styles.progressFill, { width: "25%" }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Main Content - Exact same layout as ash-intro */}
        <View style={styles.content}>
          {/* Ash Character - Same sizing and positioning */}
          <Animated.View style={[styles.ashContainer, { opacity: ashFadeAnim }]}>
            <Image
              source={require("@/ASH_images/Ash_crying.png")}
              style={styles.ashImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* Text Box with Typing Effect - Same layout */}
          <Animated.View style={[styles.textBoxContainer, { opacity: textBoxFadeAnim }]}>
            <View style={styles.textBox}>
              <Text style={styles.ashText}>
                {currentText}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Continue Button - Only appears after all typing is complete */}
        {showContinueButton && (
          <Animated.View style={[styles.actionContainer, { opacity: buttonFadeAnim }]}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <LinearGradient
                colors={["#FF6B35", "#E94131"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Yeah, exactly! 😔</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* DEV PASS BUTTON - Remove in production */}
        <View style={styles.devPassContainer}>
          <TouchableOpacity style={styles.devPassButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/(onboarding)/solution");
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
  // Exact same sizing and positioning as established in ash-intro
  ashContainer: {
    position: "absolute",
    top: -80,
    left: -80,
    zIndex: 1,
  },
  ashImage: {
    width: 325,
    height: 325,
  },
  textBoxContainer: {
    marginTop: -5,
    marginLeft: 125,
    marginRight: -10,
    flex: 1,
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
    lineHeight: 22,
    fontWeight: "500",
  },
  cursor: {
    opacity: 1,
    color: "#FF6B35",
    fontWeight: "bold",
  },
  actionContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  primaryButton: {
    width: "100%",
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
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
