import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { ChevronDown, Search } from "lucide-react-native";

// Opendatasoft API URL for universities
const UNIVERSITIES_API_URL =
  "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/us-colleges-and-universities/records";

// University dropdown component
interface University {
  name: string;
  city: string;
  state: string;
}

interface UniversityDropdownProps {
  value: string;
  onSelect: (university: string) => void;
  placeholder: string;
}

// Function to calculate similarity score between search term and university
const calculateSimilarityScore = (
  university: University,
  searchTerm: string
): number => {
  const searchWords = searchTerm
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 0);
  const universityName = university.name.toLowerCase();
  const universityCity = university.city.toLowerCase();
  const universityState = university.state.toLowerCase();

  let score = 0;

  // Exact match bonus (highest priority)
  if (universityName === searchTerm.toLowerCase()) {
    score += 1000;
  }

  // Check each search word
  searchWords.forEach((word) => {
    // Name field scoring (highest weight)
    if (universityName.includes(word)) {
      if (universityName.startsWith(word)) {
        score += 100; // Word at beginning of name
      } else if (universityName.split(" ").includes(word)) {
        score += 80; // Word matches exactly in name
      } else {
        score += 50; // Word is contained in name
      }
    }

    // City field scoring (medium weight)
    if (universityCity.includes(word)) {
      if (universityCity === word) {
        score += 40; // Exact city match
      } else {
        score += 20; // City contains word
      }
    }

    // State field scoring (low weight)
    if (universityState.includes(word)) {
      score += 10;
    }
  });

  // Bonus for matching all search words
  const matchedWords = searchWords.filter(
    (word) =>
      universityName.includes(word) ||
      universityCity.includes(word) ||
      universityState.includes(word)
  );

  if (matchedWords.length === searchWords.length) {
    score += 50; // All words found bonus
  }

  // Length penalty for very long names (prefer shorter, more specific matches)
  if (universityName.length > 50) {
    score -= 5;
  }

  return score;
};

// Function to convert text to title case (first letter of each word capitalized)
const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Function to rank universities by similarity to search term
const rankUniversitiesBySimilarity = (
  universities: University[],
  searchTerm: string
): University[] => {
  return universities
    .map((university) => ({
      ...university,
      score: calculateSimilarityScore(university, searchTerm),
    }))
    .sort((a, b) => (b as any).score - (a as any).score)
    .map(({ score, ...university }) => university);
};

const UniversityDropdown: React.FC<UniversityDropdownProps> = ({
  value,
  onSelect,
  placeholder,
}) => {
  const [visible, setVisible] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUniversities = async (query: string = "") => {
    try {
      setLoading(true);

      if (query.trim()) {
        // Try multiple search approaches for better results
        const searchTerm = query.toUpperCase();
        const searchWords = searchTerm
          .split(" ")
          .filter((word) => word.length > 0);

        // First try: search for individual words in name field
        let url = UNIVERSITIES_API_URL + `?limit=50`;

        // Build a more flexible search query
        if (searchWords.length > 0) {
          const searchConditions = searchWords
            .map((word) => `search(name,"${encodeURIComponent(word)}")`)
            .join(" OR ");
          url += `&where=${searchConditions}`;
        }

        console.log("Fetching universities from:", url);
        const response = await fetch(url);
        const data = await response.json();

        console.log("API response:", data);

        if (data.results && data.results.length > 0) {
          const formattedUniversities = data.results.map((item: any) => ({
            name: toTitleCase(item.name || "Unknown University"),
            city: toTitleCase(item.city || "Unknown City"),
            state: (item.state || "Unknown State").toUpperCase(),
          }));

          // Rank results by similarity to search terms
          const rankedUniversities = rankUniversitiesBySimilarity(
            formattedUniversities,
            searchTerm
          );
          setUniversities(rankedUniversities);
          console.log("Ranked universities:", rankedUniversities);
          return;
        }

        // Second try: search in city field
        let cityUrl = UNIVERSITIES_API_URL + `?limit=50`;
        if (searchWords.length > 0) {
          const cityConditions = searchWords
            .map((word) => `search(city,"${encodeURIComponent(word)}")`)
            .join(" OR ");
          cityUrl += `&where=${cityConditions}`;
        }

        console.log("Trying city search:", cityUrl);
        const cityResponse = await fetch(cityUrl);
        const cityData = await cityResponse.json();

        if (cityData.results && cityData.results.length > 0) {
          const formattedUniversities = cityData.results.map((item: any) => ({
            name: toTitleCase(item.name || "Unknown University"),
            city: toTitleCase(item.city || "Unknown City"),
            state: (item.state || "Unknown State").toUpperCase(),
          }));

          // Rank results by similarity to search terms
          const rankedUniversities = rankUniversitiesBySimilarity(
            formattedUniversities,
            query.trim()
          );
          setUniversities(rankedUniversities);
          console.log("Ranked city search results:", rankedUniversities);
          return;
        }

        // Third try: get more results and filter client-side for better matching
        const broaderUrl = UNIVERSITIES_API_URL + `?limit=200`;
        console.log("Trying broader search:", broaderUrl);
        const broaderResponse = await fetch(broaderUrl);
        const broaderData = await broaderResponse.json();

        if (broaderData.results) {
          // Filter results client-side for better matching
          const filteredResults = broaderData.results.filter((item: any) => {
            const name = (item.name || "").toUpperCase();
            const city = (item.city || "").toUpperCase();
            const state = (item.state || "").toUpperCase();

            // Check if all search words are found in name, city, or state
            return searchWords.every(
              (word) =>
                name.includes(word) ||
                city.includes(word) ||
                state.includes(word)
            );
          });

          if (filteredResults.length > 0) {
            const formattedUniversities = filteredResults.map((item: any) => ({
              name: toTitleCase(item.name || "Unknown University"),
              city: toTitleCase(item.city || "Unknown City"),
              state: (item.state || "Unknown State").toUpperCase(),
            }));

            // Rank results by similarity to search terms
            const rankedUniversities = rankUniversitiesBySimilarity(
              formattedUniversities,
              query.trim()
            );
            setUniversities(rankedUniversities);
            console.log(
              "Ranked client-side filtered results:",
              rankedUniversities
            );
            return;
          }
        }
      } else {
        // If no search query, just get the first 20 universities
        const url = UNIVERSITIES_API_URL + `?limit=20`;
        console.log("Fetching default universities from:", url);
        const response = await fetch(url);
        const data = await response.json();

        if (data.results) {
          const formattedUniversities = data.results.map((item: any) => ({
            name: toTitleCase(item.name || "Unknown University"),
            city: toTitleCase(item.city || "Unknown City"),
            state: (item.state || "Unknown State").toUpperCase(),
          }));
          setUniversities(formattedUniversities);
          console.log("Default universities:", formattedUniversities);
        }
      }

      // If we get here, no results found
      setUniversities([]);
    } catch (error) {
      console.error("Error fetching universities:", error);
      Alert.alert("Error", "Failed to load universities");
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      // Add a small delay to prevent too many API calls while typing
      const timeoutId = setTimeout(() => {
        fetchUniversities(searchQuery);
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [visible, searchQuery]);

  const handleSelect = (university: University) => {
    const fullName = `${university.name}, ${university.city}, ${university.state}`;
    onSelect(fullName);
    setVisible(false);
    setSearchQuery("");
  };

  const renderUniversityItem = ({ item }: { item: University }) => {
    console.log("Rendering university item:", item);
    return (
      <TouchableOpacity
        style={styles.universityItem}
        onPress={() => handleSelect(item)}
      >
        <Text style={styles.universityName}>{item.name}</Text>
        <Text style={styles.universityLocation}>
          {item.city}, {item.state}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.universityDropdownContainer}>
      <TouchableOpacity
        style={styles.universityTrigger}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.universityTriggerText}>{value || placeholder}</Text>
        <ChevronDown color="rgba(255, 255, 255, 0.6)" size={20} />
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
              <Search color="rgba(255, 255, 255, 0.6)" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search universities..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={universities}
              renderItem={renderUniversityItem}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              style={styles.universitiesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {loading
                      ? "Loading universities..."
                      : searchQuery.trim()
                      ? `No universities found for "${searchQuery}"`
                      : "Start typing to search universities..."}
                  </Text>
                </View>
              }
              ListHeaderComponent={
                universities.length > 0 ? (
                  <View style={styles.listHeader}>
                    <Text style={styles.listHeaderText}>
                      {universities.length} universities found
                    </Text>
                  </View>
                ) : null
              }
              onLayout={(event) => {
                console.log("FlatList layout:", event.nativeEvent.layout);
              }}
              onContentSizeChange={(width, height) => {
                console.log("FlatList content size:", width, height);
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  universityDropdownContainer: {
    marginLeft: 28,
    marginBottom: 20,
  },
  universityTrigger: {
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
  universityTriggerText: {
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

  universitiesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  universityItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#1A1A1A",
  },
  universityName: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  universityLocation: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
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
  listHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "#2A2A2A",
  },
  listHeaderText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default UniversityDropdown;
