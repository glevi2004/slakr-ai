import { useAuth } from "@/contexts/AuthContext";
import { FriendsService, FriendWithProfile } from "@/services/friendsService";
import { presenceService } from "@/services/presenceService";
import { StreakService } from "@/services/streakService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Tooltip from "./ui/Tooltip";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  avatar_url?: string;
  streak: number;
  totalMinutes: number;
  username: string;
  firstName: string;
  lastName: string;
  isOnline?: boolean;
  isStudying?: boolean;
  currentSessionStart?: string;
  lastSeen?: string;
}

type SortMode = "leaderboard" | "active";

// Live session time component
const LiveSessionTime: React.FC<{ timestamp: string; style: any }> = ({
  timestamp,
  style,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSessionTime = (startTime: string) => {
    const start = new Date(startTime);
    const diffInMs = currentTime.getTime() - start.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInSeconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

    if (diffInMinutes > 0) {
      return `${diffInMinutes}m ${diffInSeconds}s`;
    } else {
      return `${diffInSeconds}s`;
    }
  };

  return <Text style={style}>{formatSessionTime(timestamp)}</Text>;
};

export default function FriendsCard() {
  const [sortMode, setSortMode] = useState<SortMode>("leaderboard");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);
  const [presenceSubscription, setPresenceSubscription] = useState<any>(null);

  const { user } = useAuth();
  const router = useRouter();

  // Determine online/studying status
  const getOnlineStatus = (
    onlineStatus: string,
    lastSeen: string
  ): { isOnline: boolean; isStudying: boolean } => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const minutesAgo = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );

    const isOnline = minutesAgo <= 5;
    const isStudying = isOnline && onlineStatus === "studying";

    return { isOnline, isStudying };
  };

  // Fetch friends data
  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const friendsList = await FriendsService.getFriends(user.id);

        const friendsWithData = await Promise.all(
          friendsList.map(async (friend: FriendWithProfile) => {
            try {
              const streakData = await StreakService.getUserStreaks(friend.id);
              const { isOnline, isStudying } = getOnlineStatus(
                friend.online_status,
                friend.last_seen
              );

              // Get current session if studying
              let currentSessionStart = undefined;
              if (isStudying) {
                // This would need to be implemented in SessionService
                // For now, we'll use the last_seen as a proxy
                currentSessionStart = friend.last_seen;
              }

              return {
                id: friend.id,
                name: friend.full_name || `${friend.username}`,
                username: friend.username,
                firstName: friend.full_name?.split(" ")[0] || friend.username,
                lastName: friend.full_name?.split(" ").slice(1).join(" ") || "",
                avatar:
                  friend.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    friend.full_name || friend.username
                  )}&background=E94131&color=fff&size=128`,
                streak: streakData?.current_streak || 0,
                totalMinutes: Math.round(
                  (streakData?.total_study_time_seconds || 0) / 60
                ),
                isOnline,
                isStudying,
                currentSessionStart,
                lastSeen: friend.last_seen,
              } as Friend;
            } catch (friendError) {
              console.error(
                `Error fetching data for friend ${friend.username}:`,
                friendError
              );
              return {
                id: friend.id,
                name: friend.full_name || friend.username,
                username: friend.username,
                firstName: friend.full_name?.split(" ")[0] || friend.username,
                lastName: friend.full_name?.split(" ").slice(1).join(" ") || "",
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  friend.full_name || friend.username
                )}&background=E94131&color=fff&size=128`,
                streak: 0,
                totalMinutes: 0,
                isOnline: false,
                isStudying: false,
              } as Friend;
            }
          })
        );

        setFriends(friendsWithData);

        // Subscribe to presence updates
        const friendIds = friendsList.map((f) => f.id);
        if (friendIds.length > 0) {
          if (presenceSubscription) {
            presenceSubscription.unsubscribe();
          }

          const subscription = presenceService.subscribeToFriendsPresence(
            friendIds,
            async (payload) => {
              const { old: oldRecord, new: newRecord } = payload;

              // Handle UI updates
              setFriends((prevFriends) =>
                prevFriends.map((friend) => {
                  if (friend.id === newRecord.id) {
                    const { isOnline, isStudying } = getOnlineStatus(
                      newRecord.online_status,
                      newRecord.last_seen
                    );
                    return {
                      ...friend,
                      isOnline,
                      isStudying,
                      currentSessionStart: isStudying
                        ? newRecord.last_seen
                        : undefined,
                    };
                  }
                  return friend;
                })
              );

              // Send push notification if friend came online
              if (
                newRecord.online_status === "online" &&
                oldRecord.online_status !== "online"
              ) {
                await presenceService.handleFriendOnlineStatusChange(
                  newRecord.id,
                  newRecord.online_status,
                  oldRecord.online_status
                );
              }
            }
          );
          setPresenceSubscription(subscription);
        }
      } catch (err) {
        console.error("Error fetching friends data:", err);
        setError("Failed to load friends data");
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsData();
  }, [user?.id]);

  // Cleanup subscription
  useEffect(() => {
    return () => {
      if (presenceSubscription) {
        presenceSubscription.unsubscribe();
      }
    };
  }, [presenceSubscription]);

  // Sort friends
  const sortedFriends = React.useMemo(() => {
    let filteredFriends = [...friends];

    return filteredFriends.sort((a, b) => {
      if (sortMode === "active") {
        // Sort by last seen time (most recent first) when in active mode
        if (a.lastSeen && b.lastSeen) {
          return (
            new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
          );
        }
        return 0;
      } else {
        // Sort by total minutes then streak for leaderboard mode
        if (a.totalMinutes !== b.totalMinutes) {
          return b.totalMinutes - a.totalMinutes;
        }
        return b.streak - a.streak;
      }
    });
  }, [friends, sortMode]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const minutesAgo = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );

    if (minutesAgo < 1) {
      return "Active now";
    } else if (minutesAgo < 60) {
      return `${minutesAgo}m ago`;
    } else if (minutesAgo < 1440) {
      const hoursAgo = Math.floor(minutesAgo / 60);
      return `${hoursAgo}h ago`;
    } else {
      const daysAgo = Math.floor(minutesAgo / 1440);
      return `${daysAgo}d ago`;
    }
  };

  const renderModeButtons = () => {
    return (
      <View style={styles.modeButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            sortMode === "leaderboard" && styles.activeModeButton,
          ]}
          onPress={() => setSortMode("leaderboard")}
        >
          <Ionicons
            name="trophy"
            size={14}
            color={
              sortMode === "leaderboard"
                ? "rgba(255, 255, 255, 0.7)"
                : "rgba(255, 255, 255, 0.5)"
            }
          />
          <Text
            style={[
              styles.modeButtonText,
              sortMode === "leaderboard" && styles.activeModeButtonText,
            ]}
          >
            Leaderboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            sortMode === "active" && styles.activeModeButton,
          ]}
          onPress={() => setSortMode("active")}
        >
          <Ionicons
            name="pulse"
            size={14}
            color={
              sortMode === "active"
                ? "rgba(76, 175, 80, 0.8)"
                : "rgba(76, 175, 80, 0.6)"
            }
          />
          <Text
            style={[
              styles.modeButtonText,
              sortMode === "active" && styles.activeModeButtonText,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleFriendPress = (friendId: string) => {
    router.push(`/(profile)/${friendId}`);
  };

  const renderFriend = (friend: Friend, index: number) => {
    const isFirst = index === 0;
    const isInSession = friend.isStudying;
    const isExpanded = expandedFriendId === friend.id;

    return (
      <View key={friend.id} style={styles.friendContainer}>
        <TouchableOpacity
          style={[styles.friendCard, isInSession && styles.clickableFriendCard]}
          onPress={() => handleFriendPress(friend.id)}
          activeOpacity={0.7}
        >
          <View style={styles.friendMainContent}>
            {/* Rank */}
            <View style={styles.rankContainer}>
              {isFirst && sortMode === "leaderboard" ? (
                <Ionicons name="star" size={18} color="#FFD700" />
              ) : (
                <Text style={styles.rankText}>{index + 1}</Text>
              )}
            </View>

            {/* Profile Image */}
            <View style={styles.friendImageContainer}>
              <Image
                source={{
                  uri:
                    friend.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      friend.name
                    )}&background=E94131&color=fff&size=128&format=png`,
                }}
                style={styles.friendImage}
                onError={(error) => {
                  console.log(
                    "Avatar load error for",
                    friend.name,
                    ":",
                    error.nativeEvent.error
                  );
                }}
              />
              {friend.isOnline && (
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                </View>
              )}
            </View>

            {/* Friend Info */}
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <View style={styles.friendStats}>
                {sortMode === "active" && friend.lastSeen ? (
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={12} color="#4CAF50" />
                    <Text style={styles.statText}>
                      {formatLastSeen(friend.lastSeen)}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={12} color="#E94131" />
                      <Text style={styles.statText}>
                        {formatTime(friend.totalMinutes)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={styles.statText}>{friend.streak}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* In Session Icon or Dropdown Arrow */}
            {isInSession && friend.currentSessionStart && (
              <View style={styles.sessionIndicatorContainer}>
                <View style={styles.inSessionIcon}>
                  <Ionicons name="play-circle" size={14} color="#4CAF50" />
                </View>
                {isExpanded ? (
                  <Ionicons
                    name="chevron-up"
                    size={16}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                ) : (
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                )}
              </View>
            )}
          </View>

          {/* Dropdown Content */}
          {isExpanded && isInSession && friend.currentSessionStart && (
            <View style={styles.dropdownContent}>
              <View style={styles.sessionDetails}>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTimeContainer}>
                    <Ionicons name="time-outline" size={18} color="#4CAF50" />
                    <Text style={styles.sessionTimeLabel}>Session Time:</Text>
                    <LiveSessionTime
                      timestamp={friend.currentSessionStart}
                      style={styles.sessionTime}
                    />
                  </View>
                  <Text style={styles.sessionTitle}>Studying</Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.friendsCard}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E94131" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.friendsCard}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.friendsCard}>
      <View style={styles.friendsHeader}>
        <View style={styles.titleContainer}>
          <Ionicons name="people-outline" size={18} color="#FFFFFF" />
          <Tooltip
            text={`${sortedFriends.length} friend${
              sortedFriends.length === 1 ? "" : "s"
            }`}
          >
            <Text style={styles.friendsTitle}>Friends</Text>
          </Tooltip>
        </View>
        {renderModeButtons()}
      </View>

      <ScrollView
        style={styles.friendsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.friendsListContent}
      >
        {sortedFriends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={48}
              color="rgba(255, 255, 255, 0.3)"
            />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>
              Add friends to see them on the leaderboard
            </Text>
          </View>
        ) : (
          sortedFriends.map((friend, index) => renderFriend(friend, index))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  friendsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  friendsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  friendsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  modeButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 1,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  activeModeButton: {},
  inactiveModeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    opacity: 0.5,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
  },
  activeModeButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "700",
  },
  inactiveModeButtonText: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  friendsList: {
    maxHeight: 400,
  },
  friendsListContent: {
    padding: 16,
  },
  friendContainer: {
    marginBottom: 12,
  },
  friendCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  clickableFriendCard: {
    borderColor: "rgba(76, 175, 80, 0.2)",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
  },
  friendMainContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  friendImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  friendImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  onlineIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  friendStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 8,
    textAlign: "center",
  },
  sessionIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  inSessionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.4)",
  },
  dropdownContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  sessionDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sessionTimeLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  sessionTime: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "700",
  },
  sessionTitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
  },
});
