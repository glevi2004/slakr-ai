import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  User,
  Award,
  Clock,
  Target,
  TrendingUp,
  ChevronLeft,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AppBackground } from "@/components/AppBackground";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileService, UserProfile } from "@/services/profileService";
import LoadingIndicator from "@/components/LoadingIndicator";
import { StreakService, UserStreak } from "@/services/streakService";
import { getUserLevel } from "@/constants/Levels";

export default function FriendProfilePage() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id || id === user?.id) {
        // If somehow we got here with current user's ID, redirect to profile
        router.replace("/(main)/profile");
        return;
      }

      try {
        setLoading(true);
        // Load profile and streak data
        const [friendProfile, friendStreaks] = await Promise.all([
          ProfileService.getUserProfile(id as string),
          StreakService.getUserStreaks(id as string),
        ]);

        if (friendProfile) {
          setProfile(friendProfile);
        }
        if (friendStreaks) {
          setStreakData(friendStreaks);
        }
      } catch (error) {
        console.error("Error loading friend profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user?.id]);

  const userLevel = getUserLevel(
    Math.ceil((streakData?.total_study_time_seconds || 0) / 60)
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

  if (loading) {
    return (
      <AppBackground>
        <LoadingIndicator text="Loading profile..." />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Custom Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <View style={styles.backButtonContent}>
              <ChevronLeft color="#3B82F6" size={24} />
              <Text style={styles.backText}>Back</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Friend's Profile</Text>
          <View style={styles.rightPlaceholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentInsetAdjustmentBehavior="automatic"
        >
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>School</Text>
              <Text style={styles.infoValue}>
                {profile?.school || "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Grade</Text>
              <Text style={styles.infoValue}>
                {profile?.grade || "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Major</Text>
              <Text style={styles.infoValue}>
                {profile?.major || "Not set"}
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 16,
  },
  backButton: {
    flex: 1,
  },
  backButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    color: "#3B82F6",
    fontSize: 17,
    marginLeft: 2, // Increased spacing between icon and text
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    flex: 2,
    textAlign: "center",
  },
  rightPlaceholder: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: Platform.OS === "ios" ? 0 : 16,
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
