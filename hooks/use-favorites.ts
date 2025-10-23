"use client"

import { useState, useEffect } from "react"

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("manga-favorites")
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to load favorites:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("manga-favorites", JSON.stringify(favorites))
    }
  }, [favorites, isLoaded])

  const addFavorite = (mangaId: string) => {
    setFavorites((prev) => (prev.includes(mangaId) ? prev : [...prev, mangaId]))
  }

  const removeFavorite = (mangaId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== mangaId))
  }

  const toggleFavorite = (mangaId: string) => {
    setFavorites((prev) => (prev.includes(mangaId) ? prev.filter((id) => id !== mangaId) : [...prev, mangaId]))
  }

  const isFavorite = (mangaId: string) => {
    return favorites.includes(mangaId)
  }

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, isLoaded }
}
