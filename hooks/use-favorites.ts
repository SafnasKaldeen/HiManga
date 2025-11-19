"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface Favorite {
  id?: string
  user_id: string
  manga_id: string
  created_at?: string
  mangas?: any
}

export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritesData, setFavoritesData] = useState<Favorite[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load favorites from Supabase on mount
  useEffect(() => {
    if (userId) {
      loadFavorites()
    } else {
      setIsLoaded(true)
    }
  }, [userId])

  const loadFavorites = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select(
          `
          *,
          mangas(
            id,
            title,
            cover_image_url,
            average_rating,
            total_chapters,
            author,
            status
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setFavoritesData(data || [])
      setFavorites((data || []).map((fav) => fav.manga_id))
      setError(null)
    } catch (err) {
      console.error("Failed to load favorites:", err)
      setError(err instanceof Error ? err.message : "Failed to load favorites")
    } finally {
      setIsLoaded(true)
    }
  }

  const addFavorite = async (mangaId: string) => {
    if (!userId) {
      setError("User must be logged in to add favorites")
      return
    }

    // Optimistic update
    if (favorites.includes(mangaId)) return
    setFavorites((prev) => [...prev, mangaId])

    try {
      const { error } = await supabase.from("user_favorites").insert({
        user_id: userId,
        manga_id: mangaId,
      })

      if (error) throw error

      // Reload to get full manga details
      await loadFavorites()
      setError(null)
    } catch (err) {
      console.error("Failed to add favorite:", err)
      setError(err instanceof Error ? err.message : "Failed to add favorite")
      // Revert optimistic update
      setFavorites((prev) => prev.filter((id) => id !== mangaId))
    }
  }

  const removeFavorite = async (mangaId: string) => {
    if (!userId) {
      setError("User must be logged in to remove favorites")
      return
    }

    // Optimistic update
    setFavorites((prev) => prev.filter((id) => id !== mangaId))
    setFavoritesData((prev) => prev.filter((fav) => fav.manga_id !== mangaId))

    try {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("manga_id", mangaId)

      if (error) throw error
      setError(null)
    } catch (err) {
      console.error("Failed to remove favorite:", err)
      setError(err instanceof Error ? err.message : "Failed to remove favorite")
      // Revert optimistic update
      await loadFavorites()
    }
  }

  const toggleFavorite = async (mangaId: string) => {
    if (favorites.includes(mangaId)) {
      await removeFavorite(mangaId)
    } else {
      await addFavorite(mangaId)
    }
  }

  const isFavorite = (mangaId: string) => {
    return favorites.includes(mangaId)
  }

  return {
    favorites,
    favoritesData, // Returns full favorite objects with manga details
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    isLoaded,
    error,
  }
}