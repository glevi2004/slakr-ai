import { AppBackground } from "@/components/AppBackground";
import GradeDropdown from "@/components/GradeDropdown";
import LoadingIndicator from "@/components/LoadingIndicator";
import MajorDropdown from "@/components/MajorDropdown";
import UniversityDropdown from "@/components/UniversityDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProfileService, UserProfile } from "@/services/profileService";
import { StorageService } from "@/services/storageService";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsPage() {
  const { user, signOut, resetPassword } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    school: "",
    grade: "",
    major: "",
    bio: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userProfile = await ProfileService.getOrCreateUserProfile(
          user.id,
          user.email
        );

        if (userProfile) {
          setProfile(userProfile);
          setEditForm({
            full_name: userProfile.full_name || "",
            username: userProfile.username || "",
            school: userProfile.school || "",
            grade: userProfile.grade || "",
            major: userProfile.major || "",
            bio: userProfile.bio || "",
          });
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

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Check if username is available (if changed)
      if (editForm.username !== profile?.username && editForm.username.trim()) {
        const isAvailable = await ProfileService.isUsernameAvailable(
          editForm.username.trim(),
          user.id
        );
        if (!isAvailable) {
          Alert.alert("Error", "Username is already taken");
          setLoading(false);
          return;
        }
      }

      const updatedProfile = await ProfileService.updateUserProfile(user.id, {
        full_name: editForm.full_name.trim() || null,
        username: editForm.username.trim() || null,
        school: editForm.school.trim() || null,
        grade: editForm.grade.trim() || null,
        major: editForm.major.trim() || null,
        bio: editForm.bio.trim() || null,
      });

      if (updatedProfile) {
        setProfile(updatedProfile);
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            // Navigate to auth homepage where user can choose login/register
            router.replace("/(tabs)");
          } catch (error) {
            console.error("Error signing out:", error);
            // Force sign out locally even if network fails
            Alert.alert("Signed Out", "You have been signed out locally.");
            router.replace("/(tabs)");
          }
        },
      },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera permissions to take a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    if (!user?.id) return;

    try {
      setAvatarUploading(true);
      console.log("📤 Uploading new avatar...");

      const { url, error } = await StorageService.uploadAvatar(
        user.id,
        imageUri
      );

      if (error) {
        Alert.alert("Upload Failed", error);
        return;
      }

      if (url) {
        console.log("✅ Avatar uploaded, updating profile table...");

        // Update the profiles table instead of auth metadata
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: url })
          .eq("id", user.id);

        if (updateError) {
          console.error("Failed to update profile:", updateError);
          Alert.alert("Update Failed", "Failed to update profile picture");
          return;
        }

        console.log("✅ Profile updated successfully");

        // Update local profile state
        setProfile((prev) => (prev ? { ...prev, avatar_url: url } : null));
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      Alert.alert("Error", "Failed to upload profile picture");
    } finally {
      setAvatarUploading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Update Profile Picture",
      "Choose how you want to update your profile picture",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  // Function to parse university field and extract name and location
  const parseUniversityField = (universityField: string) => {
    if (!universityField) return { name: "", location: "" };

    const firstCommaIndex = universityField.indexOf(",");
    if (firstCommaIndex === -1) {
      // No comma found, return the whole string as name
      return { name: universityField.trim(), location: "" };
    }

    const name = universityField.substring(0, firstCommaIndex).trim();
    const location = universityField.substring(firstCommaIndex + 1).trim();

    return { name, location };
  };

  // Component to render university field with location badge
  const renderUniversityField = (value: string) => {
    const { name, location } = parseUniversityField(value);

    if (!name) {
      return <Text style={styles.fieldValue}>No school set</Text>;
    }

    return (
      <View style={styles.universityFieldContainer}>
        <View style={styles.universityContent}>
          <Text style={styles.fieldValue}>{name}</Text>
          {location && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationBadgeText}>{location}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderProfileField = (
    icon: React.ReactNode,
    label: string,
    value: string,
    placeholder: string,
    field: keyof typeof editForm,
    multiline: boolean = false,
    isGradeField: boolean = false,
    isUniversityField: boolean = false,
    isMajorField: boolean = false
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        {icon}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing ? (
        isGradeField ? (
          <GradeDropdown
            value={editForm[field]}
            onSelect={(value: string) =>
              setEditForm({ ...editForm, [field]: value })
            }
            placeholder={placeholder}
          />
        ) : isMajorField ? (
          <MajorDropdown
            value={editForm[field]}
            onSelect={(value: string) =>
              setEditForm({ ...editForm, [field]: value })
            }
            placeholder={placeholder}
          />
        ) : isUniversityField ? (
          <UniversityDropdown
            value={editForm[field]}
            onSelect={(value) => setEditForm({ ...editForm, [field]: value })}
            placeholder={placeholder}
          />
        ) : (
          <TextInput
            style={[styles.textInput, multiline && styles.textInputMultiline]}
            value={editForm[field]}
            onChangeText={(text) => setEditForm({ ...editForm, [field]: text })}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
          />
        )
      ) : isUniversityField ? (
        renderUniversityField(value)
      ) : (
        <Text style={styles.fieldValue}>
          {value || `No ${label.toLowerCase()} set`}
        </Text>
      )}
    </View>
  );

  const handleResetPassword = () => {
    Alert.alert("Reset Password", "Do you want to change your password?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Change Password",
        onPress: () => {
          // Navigate directly to reset password screen
          router.push("/(auth)/reset-password");
        },
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <AppBackground>
        <LoadingIndicator text="Loading settings..." />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(main)/profile")}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <MaterialIcons name="logout" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity
            style={styles.profilePictureContainer}
            onPress={showImagePicker}
            disabled={avatarUploading}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <MaterialIcons name="person" size={40} color="#FFFFFF" />
              </View>
            )}

            {/* Upload indicator */}
            {avatarUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}

            {/* Edit icon */}
            <View style={styles.cameraButton}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Information</Text>
            <TouchableOpacity
              style={[styles.editButton, isEditing && styles.saveButton]}
              onPress={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={loading}
            >
              {isEditing ? (
                <>
                  <MaterialIcons name="save" size={20} color="#10B981" />
                  <Text style={[styles.editButtonText, { color: "#10B981" }]}>
                    Save
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="edit" size={20} color="#3B82F6" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {renderProfileField(
            <MaterialIcons name="person" size={20} color="#3B82F6" />,
            "Full Name",
            profile?.full_name || "",
            "Enter your full name",
            "full_name"
          )}

          {renderProfileField(
            <MaterialIcons name="person" size={20} color="#10B981" />,
            "Username",
            profile?.username || "",
            "Enter a username (min 3 characters)",
            "username"
          )}

          {renderProfileField(
            <MaterialIcons name="school" size={20} color="#F59E0B" />,
            "School",
            profile?.school || "",
            "Select your university",
            "school",
            false,
            false,
            true // isUniversityField
          )}

          {renderProfileField(
            <MaterialIcons name="school" size={20} color="#8B5CF6" />,
            "Grade",
            profile?.grade || "",
            "Select your grade level",
            "grade",
            false,
            true // isGradeField
          )}

          {renderProfileField(
            <MaterialIcons name="book" size={20} color="#EF4444" />,
            "Major",
            profile?.major || "",
            "Enter your major or field of study",
            "major",
            false, // multiline
            false, // isGradeField
            false, // isUniversityField
            true // isMajorField
          )}

          {renderProfileField(
            <MaterialIcons name="edit" size={20} color="#6B7280" />,
            "Bio",
            profile?.bio || "",
            "Tell us about yourself...",
            "bio",
            true
          )}

          {isEditing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                // Reset form to current profile values
                setEditForm({
                  full_name: profile?.full_name || "",
                  username: profile?.username || "",
                  school: profile?.school || "",
                  grade: profile?.grade || "",
                  major: profile?.major || "",
                  bio: profile?.bio || "",
                });
              }}
            >
              <MaterialIcons name="close" size={20} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Sections */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>App Settings</Text>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Coming Soon</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingValue}>Dark</Text>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Privacy</Text>
            <Text style={styles.settingValue}>Coming Soon</Text>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Security</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleResetPassword}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons name="key" size={20} color="#EF4444" />
              <Text style={styles.settingLabel}>Reset Password</Text>
            </View>
            <Text style={styles.settingValue}>Change your password</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  signOutButton: {
    padding: 8,
  },
  profilePictureSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  profilePictureContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3B82F6",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emailText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  editButtonText: {
    color: "#3B82F6",
    marginLeft: 4,
    fontWeight: "600",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  fieldValue: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    paddingLeft: 28,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  settingsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 8,
  },
  settingValue: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  bottomSpacer: {
    height: 100,
  },
  universityFieldContainer: {
    // No margin needed - parent container already handles positioning
  },
  universityContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 20,
  },
  locationBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  locationBadgeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
});
