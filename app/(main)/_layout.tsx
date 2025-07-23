import { Tabs } from "expo-router";
import { Home, Flame, Users, User } from "lucide-react-native";
import { tabBarScreenOptions } from "@/components/TabBar";

export default function MainTabLayout() {
  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "Streaks",
          tabBarIcon: ({ color, size }) => <Flame color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />

      {/* Hidden screens - not shown in tab bar */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
