// Test script for notification system
// Run with: node test_notifications.js

const fetch = require("node-fetch");

// Test data - replace with actual user IDs and push tokens from your database
const TEST_DATA = {
  user1: {
    id: "ebd9c579-fb0b-4eeb-a03e-a7017856f4d6",
    full_name: "Ryan rodriguez",
    push_token: "ExponentPushToken[YOUR_PUSH_TOKEN_HERE]", // Replace with actual token
  },
  user2: {
    id: "e90bf4e6-1c0d-43ea-a66d-f9c0daac7056",
    full_name: "Gusta",
    push_token: "ExponentPushToken[YOUR_PUSH_TOKEN_HERE]", // Replace with actual token
  },
  friendship_id: "test-friendship-id",
};

async function testPresenceNotification() {
  console.log("🧪 Testing presence notification...");

  const response = await fetch(
    "https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        record: {
          id: TEST_DATA.user1.id,
          full_name: TEST_DATA.user1.full_name,
          online_status: "online",
          push_token: TEST_DATA.user1.push_token,
        },
        old_record: {
          id: TEST_DATA.user1.id,
          full_name: TEST_DATA.user1.full_name,
          online_status: "offline",
          push_token: TEST_DATA.user1.push_token,
        },
        table: "profiles",
      }),
    }
  );

  const result = await response.json();
  console.log("✅ Presence notification test result:", result);
}

async function testFriendshipNotification() {
  console.log("🧪 Testing friendship acceptance notification...");

  const response = await fetch(
    "https://favcekmathhpjuokczkl.supabase.co/functions/v1/handle-presence-change",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        record: {
          id: TEST_DATA.friendship_id,
          user_id: TEST_DATA.user2.id, // Accepter
          friend_id: TEST_DATA.user1.id, // Requester
          status: "accepted",
        },
        old_record: {
          id: TEST_DATA.friendship_id,
          user_id: TEST_DATA.user2.id,
          friend_id: TEST_DATA.user1.id,
          status: "pending",
        },
        table: "friendships",
      }),
    }
  );

  const result = await response.json();
  console.log("✅ Friendship notification test result:", result);
}

async function runTests() {
  console.log("🚀 Starting notification tests...\n");

  try {
    await testPresenceNotification();
    console.log("");
    await testFriendshipNotification();
    console.log("\n🎉 All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testPresenceNotification, testFriendshipNotification };
