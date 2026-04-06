export interface Theme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export const themes: Theme[] = [
  {
    id: "geographie",
    name: "Géographie",
    emoji: "🌍",
    description: "Capitales, pays, continents",
    color: "#10B981",
  },
  {
    id: "sport",
    name: "Sport",
    emoji: "⚽",
    description: "Football, tennis, olympiques",
    color: "#3B82F6",
  },
  {
    id: "cinema",
    name: "Cinéma & Séries",
    emoji: "🎬",
    description: "Films, acteurs, réalisateurs",
    color: "#EC4899",
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    description: "Physique, chimie, biologie",
    color: "#06B6D4",
  },
  {
    id: "musique",
    name: "Musique",
    emoji: "🎵",
    description: "Artistes, genres, instruments",
    color: "#F59E0B",
  },
  {
    id: "culture",
    name: "Culture Générale",
    emoji: "🧠",
    description: "Un peu de tout !",
    color: "#8B5CF6",
  },
  {
    id: "histoire",
    name: "Histoire",
    emoji: "🏛️",
    description: "Événements, personnages, dates",
    color: "#EF4444",
  },
  {
    id: "technologie",
    name: "Technologie",
    emoji: "💻",
    description: "Informatique, internet, IA",
    color: "#6366F1",
  },
];

export function getTheme(id: string): Theme | undefined {
  return themes.find((t) => t.id === id);
}
