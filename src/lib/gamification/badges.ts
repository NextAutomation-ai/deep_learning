export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: "learning" | "quiz" | "thinking" | "streak" | "game";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const BADGES: Badge[] = [
  // Learning badges
  { id: "first_steps", name: "First Steps", description: "Complete your first lesson", icon: "Footprints", category: "learning", rarity: "common" },
  { id: "bookworm", name: "Bookworm", description: "Upload 5 content items", icon: "BookOpen", category: "learning", rarity: "common" },
  { id: "concept_collector", name: "Concept Collector", description: "Master 25 concepts", icon: "Gem", category: "learning", rarity: "rare" },
  { id: "knowledge_seeker", name: "Knowledge Seeker", description: "Master 100 concepts", icon: "Telescope", category: "learning", rarity: "epic" },
  { id: "completionist", name: "Completionist", description: "100% mastery on any content", icon: "Crown", category: "learning", rarity: "epic" },

  // Quiz badges
  { id: "quiz_whiz", name: "Quiz Whiz", description: "Score 100% on any quiz", icon: "Sparkles", category: "quiz", rarity: "rare" },
  { id: "quiz_master", name: "Quiz Master", description: "Complete 50 quizzes", icon: "GraduationCap", category: "quiz", rarity: "epic" },
  { id: "speed_demon", name: "Speed Demon", description: "Score 80%+ on speed round", icon: "Zap", category: "quiz", rarity: "rare" },
  { id: "boss_slayer", name: "Boss Slayer", description: "Pass a Boss Battle", icon: "Sword", category: "quiz", rarity: "rare" },
  { id: "perfectionist", name: "Perfectionist", description: "Get 5 perfect quiz scores", icon: "Star", category: "quiz", rarity: "epic" },

  // Critical thinking badges
  { id: "philosopher", name: "Philosopher", description: "Complete 10 Socratic sessions", icon: "MessageCircleQuestion", category: "thinking", rarity: "rare" },
  { id: "devils_disciple", name: "Devil's Disciple", description: "Complete 5 Devil's Advocate debates", icon: "Swords", category: "thinking", rarity: "rare" },
  { id: "bias_buster", name: "Bias Buster", description: "Complete 5 bias detection exercises", icon: "ScanSearch", category: "thinking", rarity: "rare" },
  { id: "teacher", name: "Teacher", description: "Complete 10 teach-back sessions", icon: "GraduationCap", category: "thinking", rarity: "epic" },

  // Streak badges
  { id: "consistent", name: "Consistent", description: "Maintain a 7-day streak", icon: "Flame", category: "streak", rarity: "common" },
  { id: "dedicated", name: "Dedicated", description: "Maintain a 30-day streak", icon: "Flame", category: "streak", rarity: "rare" },
  { id: "unstoppable", name: "Unstoppable", description: "Maintain a 100-day streak", icon: "Flame", category: "streak", rarity: "epic" },
  { id: "legendary", name: "Legendary", description: "Maintain a 365-day streak", icon: "Flame", category: "streak", rarity: "legendary" },

  // Game badges
  { id: "clash_champion", name: "Clash Champion", description: "Score 80%+ in Concept Clash", icon: "Zap", category: "game", rarity: "rare" },
  { id: "connection_master", name: "Connection Master", description: "Win 5 Connection Games", icon: "Link", category: "game", rarity: "rare" },
  { id: "tower_builder", name: "Tower Builder", description: "Complete 3 Concept Tower levels", icon: "Building2", category: "game", rarity: "rare" },
];

export const BADGE_MAP: Record<string, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
);

export const BADGE_CATEGORIES = [
  { id: "learning", label: "Learning" },
  { id: "quiz", label: "Quiz" },
  { id: "thinking", label: "Critical Thinking" },
  { id: "streak", label: "Streak" },
  { id: "game", label: "Games" },
] as const;
