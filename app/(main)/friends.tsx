import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  UserMinus,
  Clock,
  Circle,
  BookOpen,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppBackground } from "@/components/AppBackground";
import { useAuth } from "@/contexts/AuthContext";
import {
  FriendsService,
  FriendWithProfile,
  UserSearchResult,
} from "@/services/friendsService";
import { presenceService } from "@/services/presenceService";

type TabType = "friends" | "requests" | "search";

// Utility function to determine actual online status based on last_seen and online_status
const getActualOnlineStatus = (
  onlineStatus: string,
  lastSeen: string
): {
  status: "online" | "away" | "offline" | "studying";
  label: string;
  color: string;
} => {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const minutesAgo = Math.floor(
    (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
  );

  // If last seen is more than 5 minutes ago, consider offline regardless of status
  if (minutesAgo > 5) {
    return {
      status: "offline",
      label:
        minutesAgo < 60
          ? `${minutesAgo}m ago`
          : minutesAgo < 1440
          ? `${Math.floor(minutesAgo / 60)}h ago`
          : `${Math.floor(minutesAgo / 1440)}d ago`,
      color: "#6B7280",
    };
  }

  // If last seen is 2-5 minutes ago, consider away
  if (minutesAgo > 2) {
    return {
      status: "away",
      label: "Away",
      color: "#F59E0B",
    };
  }

  // Recent activity, use the reported status
  switch (onlineStatus) {
    case "studying":
      return { status: "studying", label: "Studying", color: "#3B82F6" };
    case "online":
      return {
        status: "online",
        label: minutesAgo === 0 ? "Active now" : `${minutesAgo}m ago`,
        color: "#10B981",
      };
    case "away":
      return { status: "away", label: "Away", color: "#F59E0B" };
    default:
      return { status: "offline", label: "Offline", color: "#6B7280" };
  }
};

export default function FriendsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{
    sent: FriendWithProfile[];
    received: FriendWithProfile[];
  }>({ sent: [], received: [] });
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [presenceSubscription, setPresenceSubscription] = useState<any>(null);

  const loadFriendsData = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const [friendsData, requestsData] = await Promise.all([
        FriendsService.getFriends(user.id),
        FriendsService.getPendingRequests(user.id),
      ]);

      setFriends(friendsData);
      setPendingRequests(requestsData);

      // Subscribe to presence updates for friends
      const friendIds = friendsData.map((friend) => friend.id);
      if (friendIds.length > 0) {
        // Unsubscribe from previous subscription if it exists
        if (presenceSubscription) {
          presenceSubscription.unsubscribe();
        }

        const subscription = presenceService.subscribeToFriendsPresence(
          friendIds,
          (payload) => {
            // Update the friend's presence data in real-time
            const updatedProfile = payload.new;
            setFriends((prevFriends) =>
              prevFriends.map((friend) =>
                friend.id === updatedProfile.id
                  ? {
                      ...friend,
                      online_status: updatedProfile.online_status,
                      last_seen: updatedProfile.last_seen,
                    }
                  : friend
              )
            );
          }
        );
        setPresenceSubscription(subscription);
      }
    } catch (error) {
      console.error("Error loading friends data:", error);
    }
  }, [user?.id, presenceSubscription]);

  const searchUsers = React.useCallback(
    async (query: string) => {
      if (!user?.id || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await FriendsService.searchUsers(query, user.id);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      }
    },
    [user?.id]
  );

  const handleSendFriendRequest = async (friendId: string) => {
    if (!user?.id) return;

    const success = await FriendsService.sendFriendRequest(user.id, friendId);
    if (success) {
      // Refresh search results to show updated status
      await searchUsers(searchQuery);
      Alert.alert("Success", "Friend request sent!");
    } else {
      Alert.alert("Error", "Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (relationshipId: string) => {
    const success = await FriendsService.acceptFriendRequest(relationshipId);
    if (success) {
      await loadFriendsData();
      Alert.alert("Success", "Friend request accepted!");
    } else {
      Alert.alert("Error", "Failed to accept friend request");
    }
  };

  const handleRemoveFriend = async (
    relationshipId: string,
    isRequest: boolean = false
  ) => {
    const title = isRequest ? "Cancel Request" : "Remove Friend";
    const message = isRequest
      ? "Are you sure you want to cancel this friend request?"
      : "Are you sure you want to remove this friend?";

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: isRequest ? "Cancel Request" : "Remove",
        style: "destructive",
        onPress: async () => {
          const success = await FriendsService.removeFriendship(relationshipId);
          if (success) {
            await loadFriendsData();
            if (searchQuery) {
              await searchUsers(searchQuery);
            }
            Alert.alert(
              "Success",
              isRequest ? "Request cancelled" : "Friend removed"
            );
          } else {
            Alert.alert(
              "Error",
              `Failed to ${isRequest ? "cancel request" : "remove friend"}`
            );
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendsData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadFriendsData();
      }
    }, [user?.id, loadFriendsData])
  );

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (presenceSubscription) {
        presenceSubscription.unsubscribe();
      }
    };
  }, [presenceSubscription]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === "search") {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, searchUsers]);

  const renderUserAvatar = (user: FriendWithProfile | UserSearchResult) => (
    <View style={styles.avatarContainer}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Users color="#FFFFFF" size={20} />
        </View>
      )}
    </View>
  );

  const renderFriendItem = (friend: FriendWithProfile) => {
    const onlineStatusInfo = getActualOnlineStatus(
      friend.online_status,
      friend.last_seen
    );

    return (
      <View key={friend.id} style={styles.userItem}>
        <View style={styles.avatarContainer}>
          {friend.avatar_url ? (
            <Image source={{ uri: friend.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Users color="#FFFFFF" size={20} />
            </View>
          )}
          {/* Online status indicator */}
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: onlineStatusInfo.color },
            ]}
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {friend.full_name || friend.username}
          </Text>
          <Text style={styles.userHandle}>@{friend.username}</Text>
          <View style={styles.statusContainer}>
            {onlineStatusInfo.status === "studying" && (
              <BookOpen size={12} color={onlineStatusInfo.color} />
            )}
            {onlineStatusInfo.status === "online" && (
              <Circle
                size={8}
                color={onlineStatusInfo.color}
                fill={onlineStatusInfo.color}
              />
            )}
            {(onlineStatusInfo.status === "away" ||
              onlineStatusInfo.status === "offline") && (
              <Circle size={8} color={onlineStatusInfo.color} />
            )}
            <Text
              style={[styles.onlineStatus, { color: onlineStatusInfo.color }]}
            >
              {onlineStatusInfo.label}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFriend(friend.relationship_id)}
        >
          <UserMinus color="#EF4444" size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestItem = (
    request: FriendWithProfile,
    isReceived: boolean
  ) => (
    <View key={request.id} style={styles.userItem}>
      {renderUserAvatar(request)}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {request.full_name || request.username}
        </Text>
        <Text style={styles.userHandle}>@{request.username}</Text>
      </View>
      <View style={styles.requestActions}>
        {isReceived ? (
          <>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(request.relationship_id)}
            >
              <Check color="#FFFFFF" size={16} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleRemoveFriend(request.relationship_id, true)}
            >
              <X color="#FFFFFF" size={16} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleRemoveFriend(request.relationship_id, true)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSearchItem = (user: UserSearchResult) => {
    const getActionButton = () => {
      if (user.relationship_status === "accepted") {
        return (
          <View style={styles.friendsLabel}>
            <Text style={styles.friendsLabelText}>Friends</Text>
          </View>
        );
      } else if (user.relationship_status === "pending") {
        if (user.is_requester) {
          return (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                user.relationship_id &&
                handleRemoveFriend(user.relationship_id, true)
              }
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          );
        } else {
          return (
            <View style={styles.pendingLabel}>
              <Clock color="#F59E0B" size={16} />
              <Text style={styles.pendingLabelText}>Pending</Text>
            </View>
          );
        }
      } else {
        return (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendFriendRequest(user.id)}
          >
            <UserPlus color="#FFFFFF" size={16} />
          </TouchableOpacity>
        );
      }
    };

    return (
      <View key={user.id} style={styles.userItem}>
        {renderUserAvatar(user)}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name || user.username}</Text>
          <Text style={styles.userHandle}>@{user.username}</Text>
        </View>
        {getActionButton()}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "friends":
        return (
          <ScrollView
            style={styles.tabContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Users color="#6B7280" size={48} />
                <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
                <Text style={styles.emptyStateText}>
                  Start building your study network by adding friends!
                </Text>
              </View>
            ) : (
              friends.map(renderFriendItem)
            )}
          </ScrollView>
        );

      case "requests":
        return (
          <ScrollView
            style={styles.tabContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {pendingRequests.received.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Received Requests</Text>
                {pendingRequests.received.map((request) =>
                  renderRequestItem(request, true)
                )}
              </>
            )}

            {pendingRequests.sent.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Sent Requests</Text>
                {pendingRequests.sent.map((request) =>
                  renderRequestItem(request, false)
                )}
              </>
            )}

            {pendingRequests.received.length === 0 &&
              pendingRequests.sent.length === 0 && (
                <View style={styles.emptyState}>
                  <Clock color="#6B7280" size={48} />
                  <Text style={styles.emptyStateTitle}>
                    No Pending Requests
                  </Text>
                  <Text style={styles.emptyStateText}>
                    You have no pending friend requests
                  </Text>
                </View>
              )}
          </ScrollView>
        );

      case "search":
        return (
          <View style={styles.tabContent}>
            <View style={styles.searchContainer}>
              <Search color="#6B7280" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or name..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            <ScrollView style={styles.searchResults}>
              {searchQuery.length >= 2 && searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Search color="#6B7280" size={48} />
                  <Text style={styles.emptyStateTitle}>No Users Found</Text>
                  <Text style={styles.emptyStateText}>
                    Try searching for a different username or name
                  </Text>
                </View>
              ) : searchQuery.length < 2 ? (
                <View style={styles.emptyState}>
                  <Search color="#6B7280" size={48} />
                  <Text style={styles.emptyStateTitle}>Find Friends</Text>
                  <Text style={styles.emptyStateText}>
                    Search for users by username or full name
                  </Text>
                </View>
              ) : (
                searchResults.map(renderSearchItem)
              )}
            </ScrollView>
          </View>
        );
    }
  };

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "friends" && styles.activeTab]}
            onPress={() => setActiveTab("friends")}
          >
            <Users
              color={activeTab === "friends" ? "#3B82F6" : "#6B7280"}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "friends" && styles.activeTabText,
              ]}
            >
              Friends
            </Text>
            {friends.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{friends.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "requests" && styles.activeTab]}
            onPress={() => setActiveTab("requests")}
          >
            <Clock
              color={activeTab === "requests" ? "#3B82F6" : "#6B7280"}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "requests" && styles.activeTabText,
              ]}
            >
              Requests
            </Text>
            {pendingRequests.received.length + pendingRequests.sent.length >
              0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingRequests.received.length +
                    pendingRequests.sent.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "search" && styles.activeTab]}
            onPress={() => setActiveTab("search")}
          >
            <Search
              color={activeTab === "search" ? "#3B82F6" : "#6B7280"}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "search" && styles.activeTabText,
              ]}
            >
              Find
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  activeTab: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  tabText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#3B82F6",
  },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#1F2937",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userHandle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  onlineStatus: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#10B981",
  },
  declineButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#EF4444",
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  cancelButtonText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
  },
  friendsLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  friendsLabelText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "500",
  },
  pendingLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    gap: 4,
  },
  pendingLabelText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 12,
  },
  searchResults: {
    flex: 1,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
