import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface UserRating {
  mangaId: string
  rating: number
  timestamp: number
}

interface RatingsStore {
  ratings: UserRating[]
  addRating: (mangaId: string, rating: number) => void
  getRating: (mangaId: string) => number | null
  getAllRatings: () => UserRating[]
}

export const useRatings = create<RatingsStore>()(
  persist(
    (set, get) => ({
      ratings: [],
      addRating: (mangaId: string, rating: number) => {
        set((state) => {
          const existingIndex = state.ratings.findIndex((r) => r.mangaId === mangaId)
          if (existingIndex >= 0) {
            const newRatings = [...state.ratings]
            newRatings[existingIndex] = { mangaId, rating, timestamp: Date.now() }
            return { ratings: newRatings }
          }
          return { ratings: [...state.ratings, { mangaId, rating, timestamp: Date.now() }] }
        })
      },
      getRating: (mangaId: string) => {
        const rating = get().ratings.find((r) => r.mangaId === mangaId)
        return rating?.rating || null
      },
      getAllRatings: () => get().ratings,
    }),
    {
      name: "user-ratings-storage",
    },
  ),
)
