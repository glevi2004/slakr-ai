import AsyncStorage from "@react-native-async-storage/async-storage";

// Platform-agnostic storage that tries web first, then falls back to native
export const crossPlatformStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // Try web storage first
    try {
      if (typeof localStorage !== "undefined") {
        const value = localStorage.getItem(key);
        console.log(
          `✅ localStorage.getItem(${key}):`,
          value ? "found" : "null"
        );
        return value;
      }
    } catch (error) {
      console.log(
        "localStorage not available, trying AsyncStorage:",
        (error as Error).message
      );
    }

    // Fall back to AsyncStorage
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`✅ AsyncStorage.getItem(${key}):`, value ? "found" : "null");
      return value;
    } catch (error) {
      console.error(
        "❌ AsyncStorage getItem failed:",
        (error as Error).message
      );
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    // Try web storage first
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
        console.log(`✅ localStorage.setItem(${key}): saved`);
        return;
      }
    } catch (error) {
      console.log(
        "localStorage not available, trying AsyncStorage:",
        (error as Error).message
      );
    }

    // Fall back to AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`✅ AsyncStorage.setItem(${key}): saved`);
    } catch (error) {
      console.error(
        "❌ AsyncStorage setItem failed:",
        (error as Error).message
      );
      throw error; // Re-throw to let Supabase handle the error
    }
  },

  removeItem: async (key: string): Promise<void> => {
    // Try web storage first
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
        console.log(`✅ localStorage.removeItem(${key}): removed`);
        return;
      }
    } catch (error) {
      console.log(
        "localStorage not available, trying AsyncStorage:",
        (error as Error).message
      );
    }

    // Fall back to AsyncStorage
    try {
      await AsyncStorage.removeItem(key);
      console.log(`✅ AsyncStorage.removeItem(${key}): removed`);
    } catch (error) {
      console.error(
        "❌ AsyncStorage removeItem failed:",
        (error as Error).message
      );
      throw error; // Re-throw to let Supabase handle the error
    }
  },
};

// Test utility to verify storage is working
export const testStorage = async () => {
  try {
    console.log("🧪 Testing storage functionality...");

    // Test setItem
    await crossPlatformStorage.setItem("test_key", "test_value");
    console.log("✅ setItem test passed");

    // Test getItem
    const retrievedValue = await crossPlatformStorage.getItem("test_key");
    console.log("✅ getItem test passed, retrieved:", retrievedValue);

    // Test removeItem
    await crossPlatformStorage.removeItem("test_key");
    console.log("✅ removeItem test passed");

    // Verify removal
    const afterRemoval = await crossPlatformStorage.getItem("test_key");
    console.log("✅ Verification test passed, after removal:", afterRemoval);

    console.log("🎉 All storage tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Storage test failed:", error);
    return false;
  }
};
