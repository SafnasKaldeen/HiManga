import type { Manga } from "@/lib/mock-data"

export interface UserPreferences {
  userId: string
  readMangaIds: string[]
  favoriteGenres: string[]
  averageRating: number
}

export function getRecommendations(user: UserPreferences, allMangas: Manga[]): Manga[] {
  // Filter out already read manga
  const unreadMangas = allMangas.filter((m) => !user.readMangaIds.includes(m.id))

  // Score based on genre match and rating
  const scored = unreadMangas.map((manga) => {
    let score = 0

    // Genre matching
    const genreMatches = manga.genres.filter((g) => user.favoriteGenres.includes(g)).length
    score += genreMatches * 10

    // Rating boost
    score += manga.rating * 2

    // Popularity boost
    score += manga.views / 10000

    return { manga, score }
  })

  // Sort by score and return top 10
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.manga)
}
