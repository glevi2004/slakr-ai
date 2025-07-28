import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

export class StorageService {
  private static BUCKET_NAME = "avatars";

  /**
   * Upload user avatar to Supabase Storage
   * @param userId - The user's ID
   * @param imageUri - Local image URI from image picker
   * @returns Promise with public URL or error
   */
  static async uploadAvatar(
    userId: string,
    imageUri: string
  ): Promise<{ url?: string; error?: string }> {
    try {
      console.log("📤 Starting avatar upload for user:", userId);

      // Read the image file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Generate file path: userId/avatar.jpg
      const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/avatar.${fileExt}`;

      console.log("📁 Uploading to path:", fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true, // Overwrite existing avatar
        });

      if (error) {
        console.error("❌ Upload error:", error);
        return { error: error.message };
      }

      console.log("✅ Upload successful:", data);

      // Get a signed URL (works for private buckets)
      const { data: urlData, error: urlError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (urlError) {
        console.error("❌ Failed to create signed URL:", urlError);
        return { error: urlError.message };
      }

      console.log("🔗 Signed URL generated:", urlData.signedUrl);

      return { url: urlData.signedUrl };
    } catch (error) {
      console.error("❌ Avatar upload failed:", error);
      return { error: "Failed to upload avatar" };
    }
  }

  /**
   * Delete user avatar from Supabase Storage
   * @param userId - The user's ID
   * @returns Promise with success/error status
   */
  static async deleteAvatar(userId: string): Promise<{ error?: string }> {
    try {
      console.log("🗑️ Deleting avatar for user:", userId);

      // List all files in user's folder to handle different extensions
      const { data: files, error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId);

      if (listError) {
        console.error("❌ Error listing files:", listError);
        return { error: listError.message };
      }

      if (!files || files.length === 0) {
        console.log("ℹ️ No avatar files found for user");
        return {}; // No error, just no files to delete
      }

      // Delete all files in user's folder
      const filePaths = files.map((file) => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) {
        console.error("❌ Delete error:", deleteError);
        return { error: deleteError.message };
      }

      console.log("✅ Avatar deleted successfully");
      return {};
    } catch (error) {
      console.error("❌ Avatar deletion failed:", error);
      return { error: "Failed to delete avatar" };
    }
  }

  /**
   * Get signed URL for user's avatar
   * @param userId - The user's ID
   * @param fileExtension - File extension (default: jpg)
   * @returns Promise with signed URL string or null if error
   */
  static async getAvatarUrl(
    userId: string,
    fileExtension: string = "jpg"
  ): Promise<string | null> {
    try {
      const fileName = `${userId}/avatar.${fileExtension}`;
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (error) {
        console.error("❌ Failed to create signed URL:", error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error("❌ Error getting avatar URL:", error);
      return null;
    }
  }

  /**
   * Check if user has an avatar
   * @param userId - The user's ID
   * @returns Promise with boolean result
   */
  static async hasAvatar(userId: string): Promise<boolean> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId);

      if (error) {
        console.error("❌ Error checking avatar:", error);
        return false;
      }

      return files && files.length > 0;
    } catch (error) {
      console.error("❌ Avatar check failed:", error);
      return false;
    }
  }
}
