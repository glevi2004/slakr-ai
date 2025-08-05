import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Grade options
const GRADE_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate Student",
  "PhD Student",
  "Other",
];

interface GradeDropdownProps {
  value: string;
  onSelect: (grade: string) => void;
  placeholder: string;
}

const GradeDropdown: React.FC<GradeDropdownProps> = ({
  value,
  onSelect,
  placeholder,
}) => {
  const [visible, setVisible] = useState(false);
  const [grades, setGrades] = useState<string[]>(GRADE_OPTIONS);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      // Filter grades based on search query
      const filteredGrades = GRADE_OPTIONS.filter((grade) =>
        grade.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setGrades(filteredGrades);
    }
  }, [visible, searchQuery]);

  const handleSelect = (grade: string) => {
    onSelect(grade);
    setVisible(false);
    setSearchQuery("");
  };

  const renderGradeItem = ({ item }: { item: string }) => {
    return (
      <TouchableOpacity
        style={styles.gradeItem}
        onPress={() => handleSelect(item)}
      >
        <Text style={styles.gradeName}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.gradeDropdownContainer}>
      <TouchableOpacity
        style={styles.gradeTrigger}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.gradeTriggerText}>{value || placeholder}</Text>
        <Feather
          name="chevron-down"
          size={20}
          color="rgba(255, 255, 255, 0.6)"
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <Feather
                name="search"
                size={20}
                color="rgba(255, 255, 255, 0.6)"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search grades..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={grades}
              renderItem={renderGradeItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.gradesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {searchQuery.trim()
                      ? `No grades found for "${searchQuery}"`
                      : "No grades available"}
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  gradeDropdownContainer: {
    marginLeft: 28,
    marginBottom: 20,
  },
  gradeTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  gradeTriggerText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    width: "90%",
    height: "70%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "#2A2A2A",
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 10,
  },
  gradesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  gradeItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1A1A1A",
  },
  gradeName: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyStateText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
  },
});

export default GradeDropdown;
