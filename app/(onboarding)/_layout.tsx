import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
              <Stack.Screen name="welcome" />
        <Stack.Screen name="ash-intro" />
        <Stack.Screen name="study-struggle" />
        <Stack.Screen name="solution" />
        <Stack.Screen name="app-blocking" />
        <Stack.Screen name="app-blocking-clone" />
        <Stack.Screen name="demo" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="university" />
        <Stack.Screen name="complete" />
    </Stack>
  );
}
