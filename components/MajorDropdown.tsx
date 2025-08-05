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

// Comprehensive list of common university majors based on popular fields
const MAJOR_OPTIONS = [
  // Business & Economics
  "Accounting",
  "Business Administration",
  "Business Management",
  "Economics",
  "Finance",
  "Marketing",
  "International Business",
  "Entrepreneurship",
  "Human Resources",
  "Supply Chain Management",
  "Real Estate",
  "Insurance",
  "Banking",
  "Public Administration",

  // Engineering & Technology
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Data Science",
  "Cybersecurity",
  "Artificial Intelligence",
  "Computer Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Environmental Engineering",
  "Industrial Engineering",
  "Materials Science",
  "Nuclear Engineering",
  "Petroleum Engineering",

  // Health Sciences & Medicine
  "Nursing",
  "Pre-Medicine",
  "Biology",
  "Biochemistry",
  "Biomedical Sciences",
  "Health Sciences",
  "Public Health",
  "Health Administration",
  "Physical Therapy",
  "Occupational Therapy",
  "Pharmacy",
  "Dentistry",
  "Veterinary Medicine",
  "Medical Technology",
  "Radiology",
  "Nutrition",
  "Kinesiology",
  "Sports Medicine",

  // Liberal Arts & Humanities
  "English",
  "Literature",
  "Creative Writing",
  "History",
  "Philosophy",
  "Religious Studies",
  "Theology",
  "Liberal Arts",
  "Liberal Arts and Sciences",
  "Classics",
  "Medieval Studies",
  "Renaissance Studies",
  "American Studies",
  "European Studies",
  "Asian Studies",
  "African Studies",
  "Latin American Studies",

  // Social Sciences
  "Psychology",
  "Sociology",
  "Anthropology",
  "Political Science",
  "International Relations",
  "Public Policy",
  "Social Work",
  "Criminal Justice",
  "Criminology",
  "Geography",
  "Urban Planning",
  "Gender Studies",
  "Ethnic Studies",
  "Peace Studies",
  "Conflict Resolution",

  // Sciences & Mathematics
  "Mathematics",
  "Statistics",
  "Physics",
  "Chemistry",
  "Environmental Science",
  "Earth Sciences",
  "Geology",
  "Meteorology",
  "Astronomy",
  "Marine Biology",
  "Microbiology",
  "Genetics",
  "Molecular Biology",
  "Neuroscience",
  "Biotechnology",

  // Education
  "Education",
  "Elementary Education",
  "Secondary Education",
  "Special Education",
  "Early Childhood Education",
  "Educational Psychology",
  "Curriculum and Instruction",
  "Educational Administration",
  "Teaching English as Second Language",

  // Arts & Design
  "Art",
  "Fine Arts",
  "Graphic Design",
  "Interior Design",
  "Fashion Design",
  "Industrial Design",
  "Architecture",
  "Landscape Architecture",
  "Photography",
  "Film Studies",
  "Digital Media",
  "Animation",
  "Game Design",
  "Web Design",
  "Visual Arts",
  "Studio Art",
  "Art History",

  // Communications & Media
  "Communications",
  "Journalism",
  "Mass Communications",
  "Public Relations",
  "Advertising",
  "Broadcasting",
  "Media Studies",
  "Digital Communications",
  "Strategic Communications",

  // Performing Arts
  "Music",
  "Music Performance",
  "Music Education",
  "Music Therapy",
  "Theatre Arts",
  "Dance",
  "Drama",
  "Musical Theatre",
  "Opera",
  "Composition",

  // Languages & Literature
  "Spanish",
  "French",
  "German",
  "Italian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Portuguese",
  "Linguistics",
  "Comparative Literature",
  "Translation Studies",

  // Agriculture & Natural Resources
  "Agriculture",
  "Agricultural Business",
  "Animal Science",
  "Plant Science",
  "Forestry",
  "Natural Resources",
  "Wildlife Management",
  "Sustainable Agriculture",
  "Food Science",
  "Horticulture",

  // Law & Legal Studies
  "Pre-Law",
  "Legal Studies",
  "Paralegal Studies",
  "Constitutional Law",
  "International Law",

  // Sports & Recreation
  "Sports Management",
  "Recreation",
  "Exercise Science",
  "Athletic Training",
  "Sports Psychology",
  "Recreation Therapy",

  // Interdisciplinary Studies
  "Interdisciplinary Studies",
  "Cultural Studies",
  "Global Studies",
  "Environmental Studies",
  "Sustainability Studies",
  "Science, Technology and Society",
  "Cognitive Science",
  "Bioethics",

  // Other Popular Majors
  "Aviation",
  "Hospitality Management",
  "Tourism",
  "Fashion Merchandising",
  "Family and Consumer Sciences",
  "Social Sciences",
  "Undeclared",
  "Exploratory",
  "General Studies",
];

interface MajorDropdownProps {
  value: string;
  onSelect: (major: string) => void;
  placeholder: string;
}

const MajorDropdown: React.FC<MajorDropdownProps> = ({
  value,
  onSelect,
  placeholder,
}) => {
  const [visible, setVisible] = useState(false);
  const [majors, setMajors] = useState<string[]>(MAJOR_OPTIONS);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      // Filter majors based on search query
      const filteredMajors = MAJOR_OPTIONS.filter((major) =>
        major.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setMajors(filteredMajors);
    }
  }, [visible, searchQuery]);

  const handleSelect = (major: string) => {
    onSelect(major);
    setVisible(false);
    setSearchQuery("");
  };

  const renderMajorItem = ({ item }: { item: string }) => {
    return (
      <TouchableOpacity
        style={styles.majorItem}
        onPress={() => handleSelect(item)}
      >
        <Text style={styles.majorName}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.majorDropdownContainer}>
      <TouchableOpacity
        style={styles.majorTrigger}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.majorTriggerText}>{value || placeholder}</Text>
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
                placeholder="Search majors..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={majors}
              renderItem={renderMajorItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.majorsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {searchQuery.trim()
                      ? `No majors found for "${searchQuery}"`
                      : "No majors available"}
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
  majorDropdownContainer: {
    marginLeft: 28,
    marginBottom: 20,
  },
  majorTrigger: {
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
  majorTriggerText: {
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
  majorsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  majorItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1A1A1A",
  },
  majorName: {
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

export default MajorDropdown;
