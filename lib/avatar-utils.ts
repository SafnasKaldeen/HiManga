// ========== /lib/avatar-utils.ts ==========
import animeCharacters from "@/data/Profile-pics.json";

export interface Avatar {
  id: number;
  url: string;
  category: string;
  name?: string;
  anime?: string;
  gender?: string;
  seed?: string;
}

// Cache avatars to avoid regenerating on every render
let cachedAvatars: Avatar[] | null = null;

export function getAllAvatars(): Avatar[] {
  if (cachedAvatars) {
    return cachedAvatars;
  }

  const avatars: Avatar[] = [];

  // Add anime characters first
  animeCharacters.forEach((character) => {
    avatars.push({
      id: avatars.length,
      url: character.image,
      category: "Anime",
      name: character.name,
      anime: character.anime,
      gender: character.gender,
    });
  });

  // Add other preset avatars
  const categories = [
    { name: "Adventurer", service: "adventurer", count: 200 },
    { name: "Pixel", service: "pixel-art", count: 200 },
    { name: "Bottts", service: "bottts", count: 200 },
    { name: "Avataaars", service: "avataaars", count: 200 },
    { name: "Fun Emoji", service: "fun-emoji", count: 200 },
  ];

  categories.forEach((category) => {
    for (let i = 0; i < category.count; i++) {
      const seed = `${category.service}-${i}`;
      avatars.push({
        id: avatars.length,
        url: `https://api.dicebear.com/7.x/${category.service}/svg?seed=${seed}`,
        category: category.name,
        seed: seed,
      });
    }
  });

  cachedAvatars = avatars;
  return avatars;
}

export function getAvatarUrl(avatarId: number): string {
  const avatars = getAllAvatars();
  const avatar = avatars[avatarId];
  return avatar ? avatar.url : avatars[42].url; // Fallback to default
}

export function getAvatar(avatarId: number): Avatar | undefined {
  const avatars = getAllAvatars();
  return avatars[avatarId];
}

export function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }
  return undefined;
}

export function setCookieValue(
  name: string,
  value: string,
  days: number = 365
): void {
  if (typeof document === "undefined") return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getAvatarCategories(): string[] {
  return [
    "all",
    "Anime",
    "Adventurer",
    "Pixel",
    "Bottts",
    "Avataaars",
    "Fun Emoji",
  ];
}

export function filterAvatars(
  avatars: Avatar[],
  searchTerm: string,
  category: string
): Avatar[] {
  return avatars.filter((avatar) => {
    const matchesCategory = category === "all" || avatar.category === category;
    const matchesSearch =
      !searchTerm ||
      avatar.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.anime?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.seed?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}