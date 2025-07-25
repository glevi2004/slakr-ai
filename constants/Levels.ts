import {
  GraduationCap,
  Coffee,
  Library,
  Edit3,
  Target,
  Beaker,
  Sword,
  Wand2,
  Swords,
  Flame,
} from "lucide-react-native";

export interface LevelInfo {
  title: string;
  minMinutes: number;
  maxMinutes: number | null;
  icon: any; // Lucide icon component
  color: string;
}

export const LEVELS: LevelInfo[] = [
  {
    title: "Study Newbie",
    minMinutes: 0,
    maxMinutes: 29,
    icon: GraduationCap,
    color: "#9CA3AF", // Gray
  },
  {
    title: "Coffee Rookie",
    minMinutes: 30,
    maxMinutes: 119,
    icon: Coffee,
    color: "#10B981", // Green
  },
  {
    title: "Library Scout",
    minMinutes: 120,
    maxMinutes: 299,
    icon: Library,
    color: "#3B82F6", // Blue
  },
  {
    title: "Note Ninja",
    minMinutes: 300,
    maxMinutes: 599,
    icon: Edit3,
    color: "#8B5CF6", // Purple
  },
  {
    title: "Focus Sage",
    minMinutes: 600,
    maxMinutes: 1199,
    icon: Target,
    color: "#EC4899", // Pink
  },
  {
    title: "Knowledge Alchemist",
    minMinutes: 1200,
    maxMinutes: 2399,
    icon: Beaker,
    color: "#F59E0B", // Yellow
  },
  {
    title: "Study Sensei",
    minMinutes: 2400,
    maxMinutes: 4799,
    icon: Sword,
    color: "#EF4444", // Red
  },
  {
    title: "Productivity Wizard",
    minMinutes: 4800,
    maxMinutes: 9599,
    icon: Wand2,
    color: "#6366F1", // Indigo
  },
  {
    title: "Academic Warrior",
    minMinutes: 9600,
    maxMinutes: 19199,
    icon: Swords,
    color: "#F97316", // Orange
  },
  {
    title: "Academic Weapon",
    minMinutes: 19200,
    maxMinutes: null, // No upper limit
    icon: Flame,
    color: "#E94131", // Slakr Red
  },
];

export function getUserLevel(totalMinutes: number): {
  currentLevel: LevelInfo;
  progress: number; // 0 to 1
  minutesToNextLevel: number | null;
} {
  const level =
    LEVELS.find(
      (l) =>
        totalMinutes >= l.minMinutes &&
        (l.maxMinutes === null || totalMinutes <= l.maxMinutes)
    ) || LEVELS[0];

  // If at max level
  if (level.maxMinutes === null) {
    return {
      currentLevel: level,
      progress: 1,
      minutesToNextLevel: null,
    };
  }

  const progress =
    (totalMinutes - level.minMinutes) / (level.maxMinutes - level.minMinutes);
  const minutesToNextLevel = level.maxMinutes - totalMinutes + 1;

  return {
    currentLevel: level,
    progress: Math.min(Math.max(progress, 0), 1), // Clamp between 0 and 1
    minutesToNextLevel,
  };
}
