import { View, Text, StyleSheet } from "react-native";
import { AppBackground } from "@/components/AppBackground";

export default function FriendsPage() {
  return (
    <AppBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Connect with your study buddies</Text>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
  },
});
