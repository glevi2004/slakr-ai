import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import {
  Settings,
  User,
  Award,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { AppBackground } from "@/components/AppBackground";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileService, UserProfile } from "@/services/profileService";
import { StreakService, UserStreak } from "@/services/streakService";
import { getUserLevel } from "@/constants/Levels";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Load profile and streak data
        const [userProfile, userStreaks] = await Promise.all([
          ProfileService.getOrCreateUserProfile(user.id, user.email),
          StreakService.getUserStreaks(user.id),
        ]);

        if (userProfile) {
          setProfile(userProfile);
        }
        if (userStreaks) {
          setStreakData(userStreaks);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Refresh data when screen comes into focus (e.g., after completing a session or updating profile)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id && user?.email) {
        const refreshData = async () => {
          try {
            // Load fresh profile and streak data
            const [userProfile, userStreaks] = await Promise.all([
              ProfileService.getOrCreateUserProfile(user.id!, user.email!),
              StreakService.getUserStreaks(user.id!),
            ]);

            if (userProfile) {
              setProfile(userProfile);
            }

            if (userStreaks) {
              setStreakData(userStreaks);
            }
          } catch (error) {
            console.error("Error refreshing profile data:", error);
          }
        };

        refreshData();
      }
    }, [user])
  );

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    suffix?: string
  ) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>
        {value}
        {suffix}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderInfoRow = (label: string, value: string | null) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );

  if (loading) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </AppBackground>
    );
  }

  const userLevel = getUserLevel(
    Math.ceil((streakData?.total_study_time_seconds || 0) / 60)
  );

  return (
    <AppBackground>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("settings" as any)}
          >
            <Settings color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User color="#FFFFFF" size={32} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>
                {profile?.full_name || profile?.username || "Anonymous User"}
              </Text>
              <Text style={styles.username}>
                @{profile?.username || "username"}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>

          {profile?.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Study Statistics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              <Target color="#3B82F6" size={24} />,
              "Current Streak",
              streakData?.current_streak || 0,
              " days"
            )}
            {renderStatCard(
              <Award color="#F59E0B" size={24} />,
              "Best Streak",
              streakData?.longest_streak || 0,
              " days"
            )}
            {renderStatCard(
              <Clock color="#10B981" size={24} />,
              "Total Time",
              formatTime(
                Math.round((streakData?.total_study_time_seconds || 0) / 60)
              )
            )}
          </View>
        </View>

        {/* Level Card */}
        <View style={styles.levelCard}>
          <Text style={styles.sectionTitle}>Study Level</Text>

          {profile && (
            <View style={styles.levelContainer}>
              {/* Level Icon and Title */}
              <View style={styles.levelHeader}>
                <View
                  style={[
                    styles.levelIconContainer,
                    { backgroundColor: `${userLevel.currentLevel.color}20` },
                  ]}
                >
                  <userLevel.currentLevel.icon
                    size={32}
                    color={userLevel.currentLevel.color}
                  />
                </View>
                <View style={styles.levelTitleContainer}>
                  <Text style={styles.levelTitle}>
                    {userLevel.currentLevel.title}
                  </Text>
                  {userLevel.minutesToNextLevel && (
                    <Text style={styles.levelProgress}>
                      {userLevel.minutesToNextLevel}m until next level
                    </Text>
                  )}
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${userLevel.progress * 100}%`,
                        backgroundColor: userLevel.currentLevel.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Academic Information */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          {renderInfoRow("School", profile?.school ?? null)}
          {renderInfoRow("Grade", profile?.grade ?? null)}
          {renderInfoRow("Major", profile?.major ?? null)}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  settingsButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: "#3B82F6",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  bioSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  bio: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 22,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  infoLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  achievementsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  badgesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badgePlaceholder: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 8,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 100,
  },
  levelCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  levelContainer: {
    marginTop: 12,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  levelTitleContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  levelProgress: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
});
