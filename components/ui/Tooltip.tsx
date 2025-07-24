import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({
  text,
  children,
  position = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View>
      <Pressable onPress={() => setIsVisible(true)}>{children}</Pressable>
      <Modal
        transparent
        visible={isVisible}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>{text}</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  tooltipContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 12,
    borderRadius: 8,
    maxWidth: "80%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
});
