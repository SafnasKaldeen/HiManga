"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Manga } from "@/lib/mock-data"

interface Chapter {
  id: string
  manga_id: string
  chapter_number: number
  title: string
  created_at: string
  // Add any other chapter fields
}

interface UseMangasResult {
  favoriteMangas: Manga[]
  bookmarkedMangas: Manga[]
  chapters: Record<string, Chapter[]> // mangaId -> chapters
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Simple in-memory cache with 1-day expiration
const mangaCache = new Map<string, { data: Manga[], timestamp: number }>()
const chaptersCache = new Map<string, { data: Chapter[], timestamp: number }>()
const CACHE_DURATION = 1 * 24 * 60 * 60 * 1000 // 1 day

function getCacheKey(ids: string[]): string {
  return ids.sort().join(',')
}

function getCachedMangas(mangaIds: string[]): Manga[] | null {
  const cacheKey = getCacheKey(mangaIds)
  const cached = mangaCache.get(cacheKey)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_DURATION) {
    mangaCache.delete(cacheKey)
    return null
  }

  console.log("Cache hit for mangas:", mangaIds)
  return cached.data
}

function setCachedMangas(mangaIds: string[], data: Manga[]) {
  const cacheKey = getCacheKey(mangaIds)
  mangaCache.set(cacheKey, { data, timestamp: Date.now() })
  console.log("Cached mangas for 1 day:", mangaIds)
}

function getCachedChapters(mangaId: string): Chapter[] | null {
  const cached = chaptersCache.get(mangaId)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_DURATION) {
    chaptersCache.delete(mangaId)
    return null
  }

  console.log("Cache hit for chapters:", mangaId)
  return cached.data
}

function setCachedChapters(mangaId: string, data: Chapter[]) {
  chaptersCache.set(mangaId, { data, timestamp: Date.now() })
  console.log(`Cached ${data.length} chapters for manga ${mangaId} for 1 day`)
}

// Fetch mangas from Supabase with pagination support
async function fetchMangasFromDB(
  mangaIds: string[],
  pageSize: number = 1000
): Promise<Manga[]> {
  if (mangaIds.length === 0) return []

  console.log("Cache miss - Fetching mangas from database:", mangaIds)

  const allMangas: Manga[] = []
  let page = 0

  while (true) {
    const start = page * pageSize
    const end = start + pageSize - 1

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
          .range(start, end)

        mangaData = response.data
        mangaError = response.error
      } catch (joinError) {
        console.warn("Genre join failed, falling back to simple query:", joinError)
        const response = await supabase
          .from("mangas")
          .select("*")
          .in("id", mangaIds)
          .range(start, end)

        mangaData = response.data
        mangaError = response.error
      }

      if (mangaError) throw new Error(mangaError.message || "Failed to fetch manga")
      if (!mangaData || mangaData.length === 0) break

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

      allMangas.push(...transformedMangas)
      if (mangaData.length < pageSize) break
      page++
    } catch (err) {
      console.error("Error in fetchMangasFromDB:", err)
      break
    }
  }

  return allMangas
}

// Fetch ALL chapters for a manga with pagination (no page limit)
async function fetchAllChaptersFromDB(mangaId: string): Promise<Chapter[]> {
  // Check cache first
  const cached = getCachedChapters(mangaId)
  if (cached) {
    console.log(`Returning ${cached.length} cached chapters for manga ${mangaId}`)
    return cached
  }

  console.log(`Fetching ALL chapters for manga ${mangaId} from database...`)
  
  const allChapters: Chapter[] = []
  let offset = 0
  const chunkSize = 1000

  while (true) {
    console.log(`Fetching chapters ${offset} to ${offset + chunkSize - 1}...`)
    
    const { data, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("manga_id", mangaId)
      .order("chapter_number", { ascending: true })
      .range(offset, offset + chunkSize - 1)

    if (error) {
      console.error("Supabase error fetching chapters:", error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log(`No more chapters found. Total fetched: ${allChapters.length}`)
      break
    }

    console.log(`Fetched ${data.length} chapters in this batch`)
    allChapters.push(...data)
    
    // If we got less than chunkSize, we've reached the end
    if (data.length < chunkSize) {
      console.log(`Reached end of chapters. Total fetched: ${allChapters.length}`)
      break
    }
    
    offset += chunkSize
  }

  // Cache all chapters
  if (allChapters.length > 0) {
    setCachedChapters(mangaId, allChapters)
  }

  console.log(`Successfully fetched and cached ${allChapters.length} chapters for manga ${mangaId}`)
  return allChapters
}

export function useMangas(
  userId: string | null,
  favoriteMangaIds: string[],
  bookmarkMangaIds: string[],
  pageSize: number = 1000
): UseMangasResult {
  const [favoriteMangas, setFavoriteMangas] = useState<Manga[]>([])
  const [bookmarkedMangas, setBookmarkedMangas] = useState<Manga[]>([])
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMangas = useCallback(async () => {
    if (!userId) {
      setFavoriteMangas([])
      setBookmarkedMangas([])
      setChapters({})
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const allMangaIds = Array.from(new Set([...favoriteMangaIds, ...bookmarkMangaIds]))
      if (allMangaIds.length === 0) {
        setFavoriteMangas([])
        setBookmarkedMangas([])
        setChapters({})
        setIsLoading(false)
        return
      }

      let allMangas = getCachedMangas(allMangaIds)
      if (!allMangas) {
        allMangas = await fetchMangasFromDB(allMangaIds, pageSize)
        if (allMangas.length > 0) setCachedMangas(allMangaIds, allMangas)
      }

      if (allMangas.length === 0) {
        setFavoriteMangas([])
        setBookmarkedMangas([])
        setChapters({})
        setError("No manga found for the provided IDs")
        setIsLoading(false)
        return
      }

      const favorites = allMangas.filter(m => favoriteMangaIds.includes(m.id))
      const bookmarks = allMangas.filter(m => bookmarkMangaIds.includes(m.id))

      setFavoriteMangas(favorites)
      setBookmarkedMangas(bookmarks)
      setError(null)

      // Fetch ALL chapters for each manga (no page limit)
      const chaptersMap: Record<string, Chapter[]> = {}
      for (const manga of allMangas) {
        try {
          const allChapters = await fetchAllChaptersFromDB(manga.id)
          chaptersMap[manga.id] = allChapters
          
          // Update manga's chapters count with actual fetched count
          manga.chapters = allChapters.length
          
          console.log(`Loaded ${allChapters.length} chapters for ${manga.title}`)
        } catch (err) {
          console.error(`Error fetching chapters for manga ${manga.id}:`, err)
          chaptersMap[manga.id] = []
        }
      }
      setChapters(chaptersMap)
      
      // Update the mangas with corrected chapter counts
      setFavoriteMangas(allMangas.filter(m => favoriteMangaIds.includes(m.id)))
      setBookmarkedMangas(allMangas.filter(m => bookmarkMangaIds.includes(m.id)))
    } catch (err) {
      console.error("Error fetching library mangas:", err)
      setFavoriteMangas([])
      setBookmarkedMangas([])
      setChapters({})
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch mangas"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [userId, JSON.stringify(favoriteMangaIds), JSON.stringify(bookmarkMangaIds), pageSize])

  useEffect(() => {
    fetchMangas()
  }, [fetchMangas])

  return { favoriteMangas, bookmarkedMangas, chapters, isLoading, error, refetch: fetchMangas }
}

// Optional: clear cache manually
export function clearMangaCache() {
  mangaCache.clear()
  chaptersCache.clear()
  console.log("Manga and chapters cache cleared")
}