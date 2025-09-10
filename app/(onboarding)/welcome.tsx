import * as Haptics from "expo-haptics";
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
import { SCREEN_CONFIGS, createFadeInAnimation, createSlideInAnimation } from "./config";

export default function WelcomeScreen() {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // Get animation config for this screen
  const config = SCREEN_CONFIGS.welcome;
  
  // Animation refs
  const slakrFadeAnim = useRef(new Animated.Value(0)).current;
  const slakrSlideAnim = useRef(new Animated.Value(config.slides.slakrDropDistance)).current;
  const studyFadeAnim = useRef(new Animated.Value(0)).current;
  const studySlideAnim = useRef(new Animated.Value(config.slides.studySlideDistance)).current;
  const streakFadeAnim = useRef(new Animated.Value(0)).current;
  const streakSlideAnim = useRef(new Animated.Value(config.slides.streakSlideDistance)).current;
  const succeedFadeAnim = useRef(new Animated.Value(0)).current;
  const succeedSlideAnim = useRef(new Animated.Value(config.slides.succeedSlideDistance)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the animation sequence
    startAnimationSequence();
  }, []);

  const startAnimationSequence = () => {
    // Step 1: SLAKR drops down
    Animated.parallel([
      Animated.timing(slakrFadeAnim, createFadeInAnimation(slakrFadeAnim, config.animations.slakrDuration)),
      Animated.timing(slakrSlideAnim, createSlideInAnimation(slakrSlideAnim, 0, config.animations.slakrDuration)),
    ]).start(() => {
      // Step 2: "Study" slides from left
      Animated.parallel([
        Animated.timing(studyFadeAnim, createFadeInAnimation(studyFadeAnim, config.animations.taglineDuration)),
        Animated.timing(studySlideAnim, createSlideInAnimation(studySlideAnim, 0, config.animations.taglineDuration)),
      ]).start(() => {
        // Step 3: "Streak" appears from middle
        Animated.parallel([
          Animated.timing(streakFadeAnim, createFadeInAnimation(streakFadeAnim, config.animations.taglineDuration)),
          Animated.timing(streakSlideAnim, createSlideInAnimation(streakSlideAnim, 0, config.animations.taglineDuration)),
        ]).start(() => {
          // Step 4: "Succeed" slides from right
          Animated.parallel([
            Animated.timing(succeedFadeAnim, createFadeInAnimation(succeedFadeAnim, config.animations.taglineDuration)),
            Animated.timing(succeedSlideAnim, createSlideInAnimation(succeedSlideAnim, 0, config.animations.taglineDuration)),
          ]).start(() => {
            // Step 5: Buttons appear
            setTimeout(() => {
              setShowButtons(true);
              Animated.timing(buttonsFadeAnim, createFadeInAnimation(buttonsFadeAnim, config.animations.buttonDelay)).start(() => {
                setAnimationComplete(true);
              });
            }, config.animations.sequenceDelay);
          });
        });
      });
    });
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/ash-intro");
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.content}>
          {/* SLAKR Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: slakrFadeAnim,
                transform: [{ translateY: slakrSlideAnim }],
              },
            ]}
          >
            <Text style={styles.slakrText}>SLAKR</Text>
          </Animated.View>

          {/* Tagline Words - Horizontal Layout */}
          <View style={styles.taglineContainer}>
            <Animated.View 
              style={{ 
                opacity: studyFadeAnim,
                transform: [{ translateX: studySlideAnim }]
              }}
            >
              <Text style={styles.taglineWord}>Study.</Text>
            </Animated.View>
            
            <Animated.View 
              style={{ 
                opacity: streakFadeAnim,
                transform: [{ translateX: streakSlideAnim }]
              }}
            >
              <Text style={styles.taglineWord}>Streak.</Text>
            </Animated.View>
            
            <Animated.View 
              style={{ 
                opacity: succeedFadeAnim,
                transform: [{ translateX: succeedSlideAnim }]
              }}
            >
              <Text style={styles.taglineWord}>Succeed.</Text>
            </Animated.View>
          </View>
        </View>

        {/* Action Buttons */}
        {showButtons && (
          <Animated.View style={[styles.actionContainer, { opacity: buttonsFadeAnim }]}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={["#FF6B35", "#E94131"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
              <Text style={styles.secondaryButtonText}>Already have an account</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* DEV PASS BUTTON - Remove in production */}
        <View style={styles.devPassContainer}>
          <TouchableOpacity style={styles.devPassButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/(onboarding)/ash-intro");
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: "center",
  },
  slakrText: {
    fontSize: 72, // Much bigger
    fontWeight: "900",
    color: "#1A1A1A", // Dark text on white background
    letterSpacing: -3,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineContainer: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center",
    justifyContent: "center",
    gap: 12, // Space between words
    flexWrap: "wrap", // Allow wrapping if needed
  },
  taglineWord: {
    fontSize: 28, // Slightly bigger to match larger SLAKR
    fontWeight: "600",
    color: "#FF6B35",
    letterSpacing: 1,
    textAlign: "center",
  },
  actionContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 16,
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
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666666", // Darker gray for white background
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