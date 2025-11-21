// hooks/use-favorites.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface Favorite {
  id?: string
  user_id: string
  manga_id: string
  created_at: string
}

export function useFavorites(userId: string | null) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setIsLoaded(true)
      return
    }

    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setFavorites(data || [])
      setError(null)
    } catch (err) {
      console.error("Failed to load favorites:", err)
      setError(err instanceof Error ? err.message : "Failed to load favorites")
    } finally {
      setIsLoaded(true)
    }
  }, [userId])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const addFavorite = async (mangaId: string) => {
    if (!userId) {
      setError("User must be logged in to add favorites")
      return false
    }

    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("manga_id", mangaId)
        .maybeSingle()

      if (existing) {
        return true // Already favorited
      }

      const { data, error } = await supabase
        .from("user_favorites")
        .insert({
          user_id: userId,
          manga_id: mangaId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setFavorites((prev) => [data, ...prev])
      setError(null)
      return true
    } catch (err) {
      console.error("Failed to add favorite:", err)
      setError(err instanceof Error ? err.message : "Failed to add favorite")
      return false
    }
  }

  const removeFavorite = async (mangaId: string) => {
    if (!userId) {
      setError("User must be logged in to remove favorites")
      return false
    }

    try {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("manga_id", mangaId)

      if (error) throw error

      setFavorites((prev) => prev.filter((f) => f.manga_id !== mangaId))
      setError(null)
      return true
    } catch (err) {
      console.error("Failed to remove favorite:", err)
      setError(err instanceof Error ? err.message : "Failed to remove favorite")
      return false
    }
  }

  const toggleFavorite = async (mangaId: string) => {
    if (isFavorite(mangaId)) {
      return await removeFavorite(mangaId)
    } else {
      return await addFavorite(mangaId)
    }
  }

  const isFavorite = useCallback((mangaId: string) => {
    return favorites.some((f) => f.manga_id === mangaId)
  }, [favorites])

  return { 
    favorites, 
    addFavorite, 
    removeFavorite, 
    toggleFavorite,
    isFavorite, 
    isLoaded, 
    error 
  }
}