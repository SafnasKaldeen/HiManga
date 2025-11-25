"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Manga } from "@/lib/mock-data"

interface UseMangas {
  manga: Manga | null
  highestChapter: number | null
  isLoading: boolean
  error: string | null
}

// Simple in-memory cache
const singleMangaCache = new Map<string, { 
  manga: Manga
  highestChapter: number
  timestamp: number 
}>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export function useMangas(mangaId: string): UseMangas {
  const [manga, setManga] = useState<Manga | null>(null)
  const [highestChapter, setHighestChapter] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMangaAndChapters = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check cache first
        const cached = singleMangaCache.get(mangaId)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log("Cache hit for manga:", mangaId)
          setManga(cached.manga)
          setHighestChapter(cached.highestChapter)
          setIsLoading(false)
          return
        }

        console.log("Fetching manga and chapters from database:", mangaId)

        // Fetch manga data and highest chapter in parallel
        const [mangaResponse, chapterResponse] = await Promise.all([
          supabase
            .from("mangas")
            .select(`
              *,
              manga_genres(
                genres(name)
              )
            `)
            .eq("id", mangaId)
            .single(),
          
          supabase
            .from("chapters")
            .select("chapter_number")
            .eq("manga_id", mangaId)
            .order("chapter_number", { ascending: false })
            .limit(1)
            .single()
        ])

        if (mangaResponse.error) {
          throw new Error(mangaResponse.error.message)
        }

        if (!mangaResponse.data) {
          throw new Error("Manga not found")
        }

        const mangaData = mangaResponse.data
        let genreNames: string[] = []
        
        if (mangaData.manga_genres && Array.isArray(mangaData.manga_genres)) {
          genreNames = mangaData.manga_genres
            .map((mg: any) => mg.genres?.name)
            .filter(Boolean)
        }

        const transformedManga: Manga = {
          id: mangaData.id,
          title: mangaData.title || "Unknown Title",
          slug: mangaData.slug || "",
          author: mangaData.author || "Unknown Author",
          cover: mangaData.cover_image_url || "/placeholder-manga.jpg",
          rating: Number(mangaData.average_rating) || 0,
          chapters: mangaData.total_chapters || 0,
          status: (mangaData.status as "ongoing" | "completed" | "Not yet released" | "Locked") || "ongoing",
          genre: genreNames,
          description: mangaData.description || "",
          views: mangaData.total_views || 0,
        }

        // Get highest chapter from database (more reliable than metadata)
        const highest = chapterResponse.data?.chapter_number || mangaData.total_chapters || 0

        // Cache the result
        singleMangaCache.set(mangaId, {
          manga: transformedManga,
          highestChapter: highest,
          timestamp: Date.now()
        })

        setManga(transformedManga)
        setHighestChapter(highest)
      } catch (err) {
        console.error("Error fetching manga:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch manga")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMangaAndChapters()
  }, [mangaId])

  return {
    manga,
    highestChapter,
    isLoading,
    error,
  }
}

// Clear cache function
export function clearSingleMangaCache(mangaId?: string) {
  if (mangaId) {
    singleMangaCache.delete(mangaId)
    console.log(`Single manga cache cleared for: ${mangaId}`)
  } else {
    singleMangaCache.clear()
    console.log("All single manga caches cleared")
  }
}