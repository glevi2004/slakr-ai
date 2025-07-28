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
} from "react-native";
import {
  ArrowLeft,
  LogOut,
  Edit3,
  User,
  School,
  GraduationCap,
  BookOpen,
  Camera,
  Save,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { AppBackground } from "@/components/AppBackground";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileService, UserProfile } from "@/services/profileService";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import UniversityDropdown from "@/components/UniversityDropdown";

const GRADE_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate Student",
  "PhD Student",
  "Other",
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
    isUniversityField: boolean = false
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        {icon}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing ? (
        isGradeField ? (
          <View style={styles.dropdownContainer}>
            <SearchableDropdown
              options={GRADE_OPTIONS}
              value={editForm[field]}
              onSelect={(value) => setEditForm({ ...editForm, [field]: value })}
              placeholder={placeholder}
            />
          </View>
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

  if (loading && !profile) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
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
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <LogOut color="#FF4444" size={24} />
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <User color="#FFFFFF" size={40} />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton}>
              <Camera color="#FFFFFF" size={16} />
            </TouchableOpacity>
          </View>
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
                  <Save color="#10B981" size={20} />
                  <Text style={[styles.editButtonText, { color: "#10B981" }]}>
                    Save
                  </Text>
                </>
              ) : (
                <>
                  <Edit3 color="#3B82F6" size={20} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {renderProfileField(
            <User color="#3B82F6" size={20} />,
            "Full Name",
            profile?.full_name || "",
            "Enter your full name",
            "full_name"
          )}

          {renderProfileField(
            <User color="#10B981" size={20} />,
            "Username",
            profile?.username || "",
            "Enter a username (min 3 characters)",
            "username"
          )}

          {renderProfileField(
            <School color="#F59E0B" size={20} />,
            "School",
            profile?.school || "",
            "Select your university",
            "school",
            false,
            false,
            true // isUniversityField
          )}

          {renderProfileField(
            <GraduationCap color="#8B5CF6" size={20} />,
            "Grade",
            profile?.grade || "",
            "Select your grade level",
            "grade",
            false,
            true // isGradeField
          )}

          {renderProfileField(
            <BookOpen color="#EF4444" size={20} />,
            "Major",
            profile?.major || "",
            "Enter your major or field of study",
            "major"
          )}

          {renderProfileField(
            <Edit3 color="#6B7280" size={20} />,
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
              <X color="#EF4444" size={20} />
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
  settingLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  bottomSpacer: {
    height: 100,
  },
  dropdownContainer: {
    marginLeft: 28,
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
