import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { AppBackground } from "@/components/AppBackground";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const emoji1FloatAnim = useRef(new Animated.Value(0)).current;
  const emoji2FloatAnim = useRef(new Animated.Value(0)).current;
  const emoji3FloatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  console.log("HomeScreen rendered");

  const handleGetStarted = () => {
    router.push("/(auth)/register");
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  // Bouncing animations for emojis with different timing
  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous bouncing animations for emojis with staggered timing
    const emoji1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(emoji1FloatAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(emoji1FloatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    const emoji2Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(emoji2FloatAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(emoji2FloatAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );

    const emoji3Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(emoji3FloatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(emoji3FloatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start with delays for staggered effect
    setTimeout(() => emoji1Loop.start(), 0);
    setTimeout(() => emoji2Loop.start(), 300);
    setTimeout(() => emoji3Loop.start(), 600);

    return () => {
      emoji1Loop.stop();
      emoji2Loop.stop();
      emoji3Loop.stop();
    };
  }, [emoji1FloatAnim, emoji2FloatAnim, emoji3FloatAnim, fadeAnim, scaleAnim]);

  const emoji1Transform = emoji1FloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const emoji2Transform = emoji2FloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const emoji3Transform = emoji3FloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  // Redirect authenticated users to main app
  useEffect(() => {
    if (!loading && user) {
      // @ts-ignore - TypeScript strict typing issue with dynamic routes
      router.replace("/(main)");
    }
  }, [user, loading]);

  // Don't render anything while loading or if user is authenticated
  if (loading || user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AppBackground style={styles.container}>
        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <Animated.View
            style={[
              styles.floatingEmoji,
              styles.emoji1,
              { transform: [{ translateY: emoji1Transform }] },
            ]}
          >
            <Text style={styles.emojiText}>🔥</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingEmoji,
              styles.emoji2,
              { transform: [{ translateY: emoji2Transform }] },
            ]}
          >
            <Text style={styles.emojiText}>📚</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.floatingEmoji,
              styles.emoji3,
              { transform: [{ translateY: emoji3Transform }] },
            ]}
          >
            <Text style={styles.emojiText}>⚡</Text>
          </Animated.View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Hero Section with Logo */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoGlow}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.logo}
                  contentFit="contain"
                  accessibilityLabel="SLAKR AI logo"
                />
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.appName}>SLAKR</Text>
              <Text style={styles.tagline}>Study. Streak. Succeed.</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleGetStarted}
              >
                <LinearGradient
                  colors={["#FF6B35", "#E94131"]}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.getStartedText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginText}>
                  Already have an account? Login
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingEmoji: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  emoji1: {
    top: "15%",
    right: "10%",
  },
  emoji2: {
    top: "25%",
    left: "8%",
  },
  emoji3: {
    top: "35%",
    right: "15%",
  },
  emojiText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    paddingTop: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoGlow: {
    shadowColor: "#E94131",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 200,
    height: 200,
  },
  textContainer: {
    alignItems: "center",
  },
  appName: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 8,
    textShadowColor: "rgba(233, 65, 49, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9DA4AE",
    letterSpacing: 1,
  },
  buttonContainer: {
    marginTop: 40,
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  getStartedButton: {
    width: "100%",
    marginBottom: 16,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  loginText: {
    color: "#9DA4AE",
    fontSize: 16,
    fontWeight: "500",
  },
});
