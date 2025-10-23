export interface ReadingProgress {
  userId: string
  mangaId: string
  chapterNumber: number
  pageNumber: number
  lastReadAt: Date
  totalPagesRead: number
}

export interface UserStats {
  userId: string
  totalChaptersRead: number
  totalPagesRead: number
  currentStreak: number
  longestStreak: number
  level: number
  xp: number
  achievements: string[]
}

// Mock storage for reading progress
const readingProgressMap = new Map<string, ReadingProgress[]>()
const userStatsMap = new Map<string, UserStats>()

export function saveReadingProgress(progress: ReadingProgress) {
  const key = `${progress.userId}-${progress.mangaId}`
  const existing = readingProgressMap.get(key) || []
  readingProgressMap.set(key, [...existing, progress])
}

export function getReadingProgress(userId: string, mangaId: string): ReadingProgress | null {
  const key = `${userId}-${mangaId}`
  const progress = readingProgressMap.get(key)
  return progress ? progress[progress.length - 1] : null
}

export function getUserStats(userId: string): UserStats {
  return (
    userStatsMap.get(userId) || {
      userId,
      totalChaptersRead: 0,
      totalPagesRead: 0,
      currentStreak: 0,
      longestStreak: 0,
      level: 1,
      xp: 0,
      achievements: [],
    }
  )
}

export function updateUserStats(userId: string, stats: Partial<UserStats>) {
  const current = getUserStats(userId)
  userStatsMap.set(userId, { ...current, ...stats })
}

export function addXP(userId: string, amount: number) {
  const stats = getUserStats(userId)
  const newXP = stats.xp + amount
  const newLevel = Math.floor(newXP / 1000) + 1
  updateUserStats(userId, { xp: newXP, level: newLevel })
}
