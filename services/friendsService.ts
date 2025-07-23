import { supabase } from "../lib/supabase";

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  status: "pending" | "accepted" | "blocked";
  relationship_id: string;
  is_requester: boolean; // true if current user sent the request
  online_status: "online" | "away" | "offline" | "studying";
  last_seen: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  relationship_status: "pending" | "accepted" | "blocked" | null;
  relationship_id: string | null;
  is_requester?: boolean;
}

export class FriendsService {
  /**
   * Send a friend request
   */
  static async sendFriendRequest(
    userId: string,
    friendId: string
  ): Promise<boolean> {
    try {
      // Check if relationship already exists
      const existing = await this.getRelationship(userId, friendId);
      if (existing) {
        console.log("Relationship already exists");
        return false;
      }

      const { error } = await supabase.from("friendships").insert({
        user_id: userId,
        friend_id: friendId,
        status: "pending",
      });

      if (error) {
        console.error("Error sending friend request:", error);
        return false;
      }

      console.log("✅ Friend request sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending friend request:", error);
      return false;
    }
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(relationshipId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", relationshipId)
        .eq("status", "pending"); // Only accept pending requests

      if (error) {
        console.error("Error accepting friend request:", error);
        return false;
      }

      console.log("✅ Friend request accepted successfully");
      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      return false;
    }
  }

  /**
   * Decline/Remove friendship (works for pending requests and accepted friendships)
   */
  static async removeFriendship(relationshipId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", relationshipId);

      if (error) {
        console.error("Error removing friendship:", error);
        return false;
      }

      console.log("✅ Friendship removed successfully");
      return true;
    } catch (error) {
      console.error("Error removing friendship:", error);
      return false;
    }
  }

  /**
   * Get all friends (accepted relationships)
   */
  static async getFriends(userId: string): Promise<FriendWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(
          `
          id,
          user_id,
          friend_id,
          status,
          created_at,
          user_profile:profiles!friendships_user_id_fkey(username, full_name, avatar_url, online_status, last_seen),
          friend_profile:profiles!friendships_friend_id_fkey(username, full_name, avatar_url, online_status, last_seen)
        `
        )
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "accepted");

      if (error) {
        console.error("Error getting friends:", error);
        return [];
      }

      // Transform data to show the "other" person as the friend
      return data.map((friendship: any) => {
        const isRequester = friendship.user_id === userId;
        const friendProfile = isRequester
          ? friendship.friend_profile
          : friendship.user_profile;
        const friendId = isRequester
          ? friendship.friend_id
          : friendship.user_id;

        return {
          id: friendId,
          user_id: friendId,
          username: friendProfile.username,
          full_name: friendProfile.full_name,
          avatar_url: friendProfile.avatar_url,
          status: friendship.status,
          relationship_id: friendship.id,
          is_requester: isRequester,
          online_status: friendProfile.online_status || "offline",
          last_seen: friendProfile.last_seen,
        };
      });
    } catch (error) {
      console.error("Error getting friends:", error);
      return [];
    }
  }

  /**
   * Get pending friend requests (both sent and received)
   */
  static async getPendingRequests(userId: string): Promise<{
    sent: FriendWithProfile[];
    received: FriendWithProfile[];
  }> {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(
          `
          id,
          user_id,
          friend_id,
          status,
          created_at,
          user_profile:profiles!friendships_user_id_fkey(username, full_name, avatar_url, online_status, last_seen),
          friend_profile:profiles!friendships_friend_id_fkey(username, full_name, avatar_url, online_status, last_seen)
        `
        )
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "pending");

      if (error) {
        console.error("Error getting pending requests:", error);
        return { sent: [], received: [] };
      }

      const sent: FriendWithProfile[] = [];
      const received: FriendWithProfile[] = [];

      data.forEach((friendship: any) => {
        const isRequester = friendship.user_id === userId;
        const otherProfile = isRequester
          ? friendship.friend_profile
          : friendship.user_profile;
        const otherId = isRequester ? friendship.friend_id : friendship.user_id;

        const friendData = {
          id: otherId,
          user_id: otherId,
          username: otherProfile.username,
          full_name: otherProfile.full_name,
          avatar_url: otherProfile.avatar_url,
          status: friendship.status,
          relationship_id: friendship.id,
          is_requester: isRequester,
          online_status: otherProfile.online_status || "offline",
          last_seen: otherProfile.last_seen,
        };

        if (isRequester) {
          sent.push(friendData);
        } else {
          received.push(friendData);
        }
      });

      return { sent, received };
    } catch (error) {
      console.error("Error getting pending requests:", error);
      return { sent: [], received: [] };
    }
  }

  /**
   * Search for users to add as friends
   */
  static async searchUsers(
    query: string,
    currentUserId: string
  ): Promise<UserSearchResult[]> {
    try {
      if (query.trim().length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .neq("id", currentUserId) // Exclude current user
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error("Error searching users:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Check existing relationships for each user
      const userIds = data.map((user) => user.id);
      const { data: relationships } = await supabase
        .from("friendships")
        .select("user_id, friend_id, status, id")
        .or(
          `and(user_id.eq.${currentUserId},friend_id.in.(${userIds.join(
            ","
          )})),and(friend_id.eq.${currentUserId},user_id.in.(${userIds.join(
            ","
          )}))`
        );

      // Add relationship status to each user
      return data.map((user) => {
        const relationship = relationships?.find(
          (rel) =>
            (rel.user_id === currentUserId && rel.friend_id === user.id) ||
            (rel.friend_id === currentUserId && rel.user_id === user.id)
        );

        return {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          relationship_status: relationship?.status || null,
          relationship_id: relationship?.id || null,
          is_requester: relationship
            ? relationship.user_id === currentUserId
            : undefined,
        };
      });
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  }

  /**
   * Get friendship stats for a user
   */
  static async getFriendshipStats(userId: string): Promise<{
    friendsCount: number;
    pendingSentCount: number;
    pendingReceivedCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("status, user_id, friend_id")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) {
        console.error("Error getting friendship stats:", error);
        return {
          friendsCount: 0,
          pendingSentCount: 0,
          pendingReceivedCount: 0,
        };
      }

      let friendsCount = 0;
      let pendingSentCount = 0;
      let pendingReceivedCount = 0;

      data.forEach((friendship) => {
        if (friendship.status === "accepted") {
          friendsCount++;
        } else if (friendship.status === "pending") {
          if (friendship.user_id === userId) {
            pendingSentCount++;
          } else {
            pendingReceivedCount++;
          }
        }
      });

      return { friendsCount, pendingSentCount, pendingReceivedCount };
    } catch (error) {
      console.error("Error getting friendship stats:", error);
      return { friendsCount: 0, pendingSentCount: 0, pendingReceivedCount: 0 };
    }
  }

  /**
   * Get relationship between two users
   */
  private static async getRelationship(
    userId: string,
    friendId: string
  ): Promise<Friendship | null> {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .or(
          `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
        )
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error getting relationship:", error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error("Error getting relationship:", error);
      return null;
    }
  }
}
