"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Manga } from "@/lib/mock-data"

interface UseMangasResult {
  favoriteMangas: Manga[]
  bookmarkedMangas: Manga[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple in-memory cache with 1-day expiration
const mangaCache = new Map<string, { data: Manga[], timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 1 day in milliseconds

function getCacheKey(mangaIds: string[]): string {
  return mangaIds.sort().join(',')
}

function getCachedMangas(mangaIds: string[]): Manga[] | null {
  const cacheKey = getCacheKey(mangaIds)
  const cached = mangaCache.get(cacheKey)
  
  if (!cached) {
    return null
  }
  
  const now = Date.now()
  const isExpired = now - cached.timestamp > CACHE_DURATION
  
  if (isExpired) {
    mangaCache.delete(cacheKey)
    return null
  }
  
  console.log("Cache hit for mangas:", mangaIds)
  return cached.data
}

function setCachedMangas(mangaIds: string[], data: Manga[]): void {
  const cacheKey = getCacheKey(mangaIds)
  mangaCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
  console.log("Cached mangas for 1 day:", mangaIds)
}

async function fetchMangasFromDB(mangaIds: string[]): Promise<Manga[]> {
  if (mangaIds.length === 0) {
    return []
  }

  console.log("Cache miss - Fetching mangas from database:", mangaIds)

  try {
    let mangaData, mangaError

    try {
      const response = await supabase
        .from("mangas")
        .select(`
          *,
          manga_genres(
            genres(name)
          )
        `)
        .in("id", mangaIds)

      mangaData = response.data
      mangaError = response.error
    } catch (joinError) {
      console.warn("Genre join failed, falling back to simple query:", joinError)
      const response = await supabase
        .from("mangas")
        .select("*")
        .in("id", mangaIds)

      mangaData = response.data
      mangaError = response.error
    }

    if (mangaError) {
      console.error("Supabase error:", mangaError)
      throw new Error(mangaError.message || "Failed to fetch manga")
    }

    if (!mangaData) {
      return []
    }

    const transformedMangas: Manga[] = mangaData.map((manga) => {
      let genreNames: string[] = []
      
      if (manga.manga_genres && Array.isArray(manga.manga_genres)) {
        genreNames = manga.manga_genres
          .map((mg: any) => mg.genres?.name)
          .filter(Boolean)
      }

      return {
        id: manga.id,
        title: manga.title || "Unknown Title",
        slug: manga.slug || "",
        author: manga.author || "Unknown Author",
        cover: manga.cover_image_url || "/placeholder-manga.jpg",
        rating: Number(manga.average_rating) || 0,
        chapters: manga.total_chapters || 0,
        status: (manga.status as "ongoing" | "completed" | "Not yet released" | "Locked") || "ongoing",
        genre: genreNames,
        description: manga.description || "",
        views: manga.total_views || 0,
      }
    })

    return transformedMangas
  } catch (err) {
    console.error("Error in fetchMangasFromDB:", err)
    return []
  }
}

export function useMangas(
  userId: string | null,
  favoriteMangaIds: string[],
  bookmarkMangaIds: string[]
): UseMangasResult {
  const [favoriteMangas, setFavoriteMangas] = useState<Manga[]>([])
  const [bookmarkedMangas, setBookmarkedMangas] = useState<Manga[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMangas = useCallback(async () => {
    if (!userId) {
      setFavoriteMangas([])
      setBookmarkedMangas([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const allMangaIds = Array.from(
        new Set([...favoriteMangaIds, ...bookmarkMangaIds])
      )

      if (allMangaIds.length === 0) {
        setFavoriteMangas([])
        setBookmarkedMangas([])
        setIsLoading(false)
        return
      }

      // Check cache first
      let allMangas = getCachedMangas(allMangaIds)
      
      // If not in cache, fetch from database
      if (!allMangas) {
        allMangas = await fetchMangasFromDB(allMangaIds)
        
        // Cache the results for 1 day
        if (allMangas.length > 0) {
          setCachedMangas(allMangaIds, allMangas)
        }
      }

      if (allMangas.length === 0) {
        console.warn("No manga data found for the provided IDs")
        setFavoriteMangas([])
        setBookmarkedMangas([])
        setError("No manga found for the provided IDs")
        setIsLoading(false)
        return
      }

      // Filter mangas based on favorites and bookmarks
      const favorites = allMangas.filter((manga) =>
        favoriteMangaIds.includes(manga.id)
      )

      const bookmarks = allMangas.filter((manga) =>
        bookmarkMangaIds.includes(manga.id)
      )

      console.log("Favorites:", favorites.length, "Bookmarks:", bookmarks.length)

      setFavoriteMangas(favorites)
      setBookmarkedMangas(bookmarks)
      setError(null)
    } catch (err) {
      console.error("Error fetching library mangas:", err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null
        ? JSON.stringify(err)
        : "Failed to fetch mangas"
      setError(errorMessage)
      setFavoriteMangas([])
      setBookmarkedMangas([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, JSON.stringify(favoriteMangaIds), JSON.stringify(bookmarkMangaIds)])

  useEffect(() => {
    fetchMangas()
  }, [fetchMangas])

  return {
    favoriteMangas,
    bookmarkedMangas,
    isLoading,
    error,
    refetch: fetchMangas,
  }
}

// Optional: Function to clear the cache manually
export function clearMangaCache() {
  mangaCache.clear()
  console.log("Manga cache cleared")
}