import { AppBackground } from "@/components/AppBackground";
import FriendsCard from "@/components/FriendsCard";
import StreakCard from "@/components/StreakCard";
import Timer from "@/components/Timer";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MainHomePage() {
  const handleNotificationsPress = () => {
    Alert.alert(
      "Coming Soon!",
      "Notifications feature will be available in a future update.",
      [{ text: "OK", style: "default" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <AppBackground>
        {/* Top Right Notification Button - positioned relative to SafeAreaView */}
        <TouchableOpacity
          style={styles.topNotificationButton}
          onPress={handleNotificationsPress}
        >
          <Feather name="bell" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Header */}
          <View style={styles.logoHeader}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <View style={styles.header}>
            <View style={styles.headerSpacer} />
          </View>

          {/* Streak Card */}
          <StreakCard />

          <View style={styles.content}>
            {/* Study Timer Component */}
            <Timer />

            {/* Friends Card Component */}
            <FriendsCard />
          </View>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 20,
  },
  // New styles for top UI elements
  topNotificationButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D2D2D",
    zIndex: 1000,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoHeader: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerSpacer: {
    flex: 1,
  },
});
