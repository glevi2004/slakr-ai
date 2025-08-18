import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return null;
    }

    try {
      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "f4495f2d-8e8a-4bfb-ba3e-a12f0008ac73", // Your EAS project ID
      });

      this.expoPushToken = token.data;
      console.log("✅ Push token obtained:", this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      return null;
    }
  }

  /**
   * Save push token to user's profile
   */
  async savePushToken(userId: string, pushToken: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ push_token: pushToken })
        .eq("id", userId);

      if (error) {
        console.error("Error saving push token:", error);
        return false;
      }

      console.log("✅ Push token saved to profile");
      return true;
    } catch (error) {
      console.error("Error saving push token:", error);
      return false;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      const message = {
        to: pushToken,
        sound: "default",
        title,
        body,
        data: data || {},
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.errors) {
        console.error("Push notification error:", result.errors);
        return false;
      }

      console.log("✅ Push notification sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return false;
    }
  }

  /**
   * Send friend online notification
   */
  async sendFriendOnlineNotification(
    friendName: string,
    friendPushToken: string
  ): Promise<boolean> {
    return this.sendPushNotification(
      friendPushToken,
      `${friendName} is online!`,
      "Your friend just came online",
      {
        type: "friend_online",
        friendName,
      }
    );
  }

  /**
   * Get push tokens for a list of user IDs
   */
  async getPushTokens(
    userIds: string[]
  ): Promise<{ [userId: string]: string }> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, push_token")
        .in("id", userIds)
        .not("push_token", "is", null);

      if (error) {
        console.error("Error fetching push tokens:", error);
        return {};
      }

      const tokens: { [userId: string]: string } = {};
      data?.forEach((profile) => {
        if (profile.push_token) {
          tokens[profile.id] = profile.push_token;
        }
      });

      return tokens;
    } catch (error) {
      console.error("Error fetching push tokens:", error);
      return {};
    }
  }

  /**
   * Handle notification received while app is in foreground
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Handle notification response (when user taps notification)
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
