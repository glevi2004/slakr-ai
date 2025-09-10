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
import { SCREEN_CONFIGS, createFadeInAnimation, createSlideInAnimation } from "./config";

export default function SolutionScreen() {
  const [currentText, setCurrentText] = useState("");
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  
  // Get animation config for this screen
  const config = SCREEN_CONFIGS.solution;
  
  // Animation refs
  const ashFadeAnim = useRef(new Animated.Value(0)).current;
  const textBoxFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Feature animation refs
  const feature1SlideAnim = useRef(new Animated.Value(config.features.leftSlideDistance)).current; // From left
  const feature2SlideAnim = useRef(new Animated.Value(config.features.rightSlideDistance)).current;  // From right
  const feature3SlideAnim = useRef(new Animated.Value(config.features.rightSlideDistance)).current;  // From right
  const feature4SlideAnim = useRef(new Animated.Value(config.features.leftSlideDistance)).current; // From left
  
  const feature1FadeAnim = useRef(new Animated.Value(0)).current;
  const feature2FadeAnim = useRef(new Animated.Value(0)).current;
  const feature3FadeAnim = useRef(new Animated.Value(0)).current;
  const feature4FadeAnim = useRef(new Animated.Value(0)).current;

  // Text phases in sequence
  const textPhases = [
    "That's why I'm here!",
    "Together we can…"
  ];

  // Features data
  const features = [
    { emoji: "🔥", text: "Build epic study streaks", direction: "left" },
    { emoji: "⏰", text: "Stay focused with smart timers", direction: "right" },
    { emoji: "📱", text: "Block distracting apps", direction: "right" },
    { emoji: "👥", text: "Study with friends", direction: "left" }
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
      // All text phases complete, start feature animations
      setShowFeatures(true);
      setTimeout(() => {
        startFeatureAnimations();
      }, config.features.staggerDelay);
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

  const startFeatureAnimations = () => {
    const featureAnims = [
      { slide: feature1SlideAnim, fade: feature1FadeAnim },
      { slide: feature2SlideAnim, fade: feature2FadeAnim },
      { slide: feature3SlideAnim, fade: feature3FadeAnim },
      { slide: feature4SlideAnim, fade: feature4FadeAnim }
    ];

    // Animate each feature with 400ms delay between them for more distinct timing
    featureAnims.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.slide, createSlideInAnimation(anim.slide, 0, config.features.duration)),
          Animated.timing(anim.fade, createFadeInAnimation(anim.fade, config.features.duration)),
        ]).start(() => {
          // Light haptic for each feature appearance
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          // Show button after last feature animates in
          if (index === featureAnims.length - 1) {
            setTimeout(() => {
              setShowContinueButton(true);
              Animated.timing(buttonFadeAnim, createFadeInAnimation(buttonFadeAnim, config.animations.buttonFadeIn)).start();
            }, config.animations.postAnimation);
          }
        });
      }, index * config.features.staggerDelay); // Stagger delay from config
    });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/app-blocking");
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/(onboarding)/study-struggle");
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
              style={[styles.progressFill, { width: "50%" }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* Main Content - Exact same layout as previous screens */}
        <View style={styles.content}>
          {/* Ash Character - Same sizing and positioning */}
          <Animated.View style={[styles.ashContainer, { opacity: ashFadeAnim }]}>
            <Image
              source={require("@/ASH_images/Ash_superheroCape.png")}
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

          {/* Animated Features - Below text box */}
          {showFeatures && (
            <View style={styles.featuresContainer}>
              {features.map((feature, index) => {
                const slideAnim = [feature1SlideAnim, feature2SlideAnim, feature3SlideAnim, feature4SlideAnim][index];
                const fadeAnim = [feature1FadeAnim, feature2FadeAnim, feature3FadeAnim, feature4FadeAnim][index];
                
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.featureItem,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                      },
                    ]}
                  >
                    <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                    <Text style={styles.featureText}>{feature.text}</Text>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {/* Continue Button - Only appears after all animations complete */}
        {showContinueButton && (
          <Animated.View style={[styles.actionContainer, { opacity: buttonFadeAnim }]}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <LinearGradient
                colors={["#FF6B35", "#E94131"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Show me how! 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* DEV PASS BUTTON - Remove in production */}
        <View style={styles.devPassContainer}>
          <TouchableOpacity style={styles.devPassButton} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/(onboarding)/app-blocking");
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
  // Exact same sizing and positioning as established in previous screens
  ashContainer: {
    position: "absolute",
    top: -100,
    left: -85,
    zIndex: 1,
  },
  ashImage: {
    width: 325,
    height: 325,
  },
  textBoxContainer: {
    marginTop: -5,
    marginLeft: 125,
    marginRight: -5,
    height: 120, // Fixed height for text box
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
  featuresContainer: {
    position: "absolute",
    top: "40%", // Center vertically in screen
    left: 32,
    right: 32,
    gap: 20,
    justifyContent: "center",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16, // Reduced from 20
    paddingHorizontal: 20, // Reduced from 24
    backgroundColor: "#F8F9FA",
    borderRadius: 14, // Reduced from 16
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 60, // Reduced from 70
  },
  featureEmoji: {
    fontSize: 24, // Reduced from 28
    marginRight: 14, // Reduced from 16
  },
  featureText: {
    fontSize: 16, // Reduced from 18
    color: "#1A1A1A",
    fontWeight: "600",
    flex: 1,
    lineHeight: 22, // Reduced from 24
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
