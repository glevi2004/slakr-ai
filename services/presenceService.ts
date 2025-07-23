import { supabase } from "../lib/supabase";
import { AppState, AppStateStatus } from "react-native";

export type OnlineStatus = "online" | "away" | "offline" | "studying";

export class PresenceService {
  private static instance: PresenceService;
  private userId: string | null = null;
  private heartbeatInterval: any = null;
  private appStateSubscription: any = null;

  static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  /**
   * Initialize presence tracking for a user
   */
  async initialize(userId: string) {
    this.userId = userId;
    await this.setOnlineStatus("online");
    this.startHeartbeat();
    this.setupAppStateListener();
  }

  /**
   * Cleanup presence tracking
   */
  async cleanup() {
    if (this.userId) {
      await this.setOnlineStatus("offline");
    }
    this.stopHeartbeat();
    this.removeAppStateListener();
    this.userId = null;
  }

  /**
   * Update user's online status
   */
  async setOnlineStatus(status: OnlineStatus): Promise<boolean> {
    if (!this.userId) {
      console.warn("PresenceService: User ID not set");
      return false;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          online_status: status,
          last_seen: new Date().toISOString(),
        })
        .eq("id", this.userId);

      if (error) {
        console.error("Error updating online status:", error);
        return false;
      }

      console.log(`✅ Online status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error("Error updating online status:", error);
      return false;
    }
  }

  /**
   * Start heartbeat to keep presence updated
   */
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Update presence every 2 minutes when app is active
    this.heartbeatInterval = setInterval(async () => {
      if (this.userId && AppState.currentState === "active") {
        await this.updateLastSeen();
      }
    }, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Update last seen timestamp without changing status
   */
  private async updateLastSeen(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          last_seen: new Date().toISOString(),
        })
        .eq("id", this.userId);

      if (error) {
        console.error("Error updating last seen:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating last seen:", error);
      return false;
    }
  }

  /**
   * Setup app state listener to handle background/foreground
   */
  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Remove app state listener
   */
  private removeAppStateListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Handle app state changes
   */
  private async handleAppStateChange(nextAppState: AppStateStatus) {
    if (!this.userId) return;

    if (nextAppState === "active") {
      // App came to foreground
      await this.setOnlineStatus("online");
      this.startHeartbeat();
    } else if (nextAppState === "background") {
      // App went to background
      await this.setOnlineStatus("away");
      this.stopHeartbeat();
    } else if (nextAppState === "inactive") {
      // App is transitioning or losing focus
      await this.setOnlineStatus("away");
    }
  }

  /**
   * Set studying status
   */
  async setStudyingStatus(isStudying: boolean): Promise<boolean> {
    if (isStudying) {
      return await this.setOnlineStatus("studying");
    } else {
      return await this.setOnlineStatus("online");
    }
  }

  /**
   * Subscribe to friends' presence changes
   */
  subscribeToFriendsPresence(
    friendIds: string[],
    callback: (updates: any) => void
  ) {
    if (friendIds.length === 0) return null;

    return supabase
      .channel("friends-presence")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=in.(${friendIds.join(",")})`,
        },
        (payload) => {
          // Only notify about presence-related changes
          const { old: oldRecord, new: newRecord } = payload;
          if (
            oldRecord.online_status !== newRecord.online_status ||
            oldRecord.last_seen !== newRecord.last_seen
          ) {
            callback(payload);
          }
        }
      )
      .subscribe();
  }
}

// Export singleton instance
export const presenceService = PresenceService.getInstance();
