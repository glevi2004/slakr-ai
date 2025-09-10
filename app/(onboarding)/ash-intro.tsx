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

export default function AshIntroScreen() {
  const [currentText, setCurrentText] = useState("");
  const [showContinueButton, setShowContinueButton] = useState(false);
  
  // Get animation config for this screen
  const config = SCREEN_CONFIGS.ashIntro;
  
  // Animation refs
  const ashFadeAnim = useRef(new Animated.Value(0)).current;
  const textBoxFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  const fullText = "Hey, I am Ash, your study buddy! 👋 I'm here to help you build amazing study habits and achieve your goals.";
  
  useEffect(() => {
    startIntroSequence();
  }, []);

  const startIntroSequence = () => {
    // Step 1: Ash appears
    Animated.timing(ashFadeAnim, createFadeInAnimation(ashFadeAnim, config.animations.ashFadeIn)).start(() => {
      // Step 2: Text box appears
      Animated.timing(textBoxFadeAnim, createFadeInAnimation(textBoxFadeAnim, config.animations.textBoxFadeIn)).start(() => {
        // Step 3: Start typing effect
        startTypingEffect();
      });
    });
  };

  const startTypingEffect = () => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setCurrentText(fullText.slice(0, index));
        // Add haptic feedback every few characters for typing feel
        if (index % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        index++;
      } else {
        clearInterval(typingInterval);
        // Final haptic when typing completes
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Show continue button after typing is done
        setTimeout(() => {
          setShowContinueButton(true);
          Animated.timing(buttonFadeAnim, createFadeInAnimation(buttonFadeAnim, config.animations.buttonFadeIn)).start();
        }, config.animations.buttonDelay);
      }
    }, config.typingSpeed); // Typing speed
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/study-struggle");
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
              style={[styles.progressFill, { width: "12.5%" }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Main Content - Top Left Layout like Blurt */}
        <View style={styles.content}>
          {/* Ash Character - Top Left under progress bar */}
          <Animated.View style={[styles.ashContainer, { opacity: ashFadeAnim }]}>
            <Image
              source={require("@/ASH_images/Ash_default.png")}
              style={styles.ashImage}
              contentFit="contain"
            />
          </Animated.View>

          {/* Text Box with Typing Effect - Wide box next to Ash */}
          <Animated.View style={[styles.textBoxContainer, { opacity: textBoxFadeAnim }]}>
            <View style={styles.textBox}>
              <Text style={styles.ashText}>
                {currentText}
                <Text style={styles.cursor}>|</Text>
              </Text>
            </View>
          </Animated.View>
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
                <Text style={styles.primaryButtonText}>Nice to meet you, Ash!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* DEV PASS BUTTON - Remove in production */}
        <View style={styles.devPassContainer}>
          <TouchableOpacity style={styles.devPassButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/(onboarding)/study-struggle");
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
  ashContainer: {
    position: "absolute",
    top: -80,
    left: -80, // Move further left
    zIndex: 1,
  },
  ashImage: {
    width: 325, // Much bigger like Blurt
    height: 325,
  },
  textBoxContainer: {
    marginTop: -5,
    marginLeft: 125, // Adjust for bigger Ash + wider text box
    marginRight: -10, // Reduce right margin for wider box
    flex: 1,
  },
  textBox: {
    backgroundColor: "#F8F9FA", // Light gray background like Blurt
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
