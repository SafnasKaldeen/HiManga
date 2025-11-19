"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface Bookmark {
  id?: string
  user_id: string
  manga_id: string
  chapter_number: number
  page_number: number
  timestamp: string
}

export function useBookmarks(userId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load bookmarks from Supabase on mount
  useEffect(() => {
    if (userId) {
      loadBookmarks()
    } else {
      setIsLoaded(true)
    }
  }, [userId])

  const loadBookmarks = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })

      if (error) throw error

      setBookmarks(data || [])
      setError(null)
    } catch (err) {
      console.error("Failed to load bookmarks:", err)
      setError(err instanceof Error ? err.message : "Failed to load bookmarks")
    } finally {
      setIsLoaded(true)
    }
  }

  const addBookmark = async (
    mangaId: string,
    chapterNumber: number,
    pageNumber: number
  ) => {
    if (!userId) {
      setError("User must be logged in to add bookmarks")
      return
    }

    try {
      // Check if bookmark already exists
      const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId)
        .eq("manga_id", mangaId)
        .maybeSingle()

      if (existing) {
        // Update existing bookmark
        const { data, error } = await supabase
          .from("bookmarks")
          .update({
            chapter_number: chapterNumber,
            page_number: pageNumber,
            timestamp: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single()

        if (error) throw error

        setBookmarks((prev) =>
          prev.map((b) => (b.id === existing.id ? data : b))
        )
      } else {
        // Insert new bookmark
        const { data, error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: userId,
            manga_id: mangaId,
            chapter_number: chapterNumber,
            page_number: pageNumber,
            timestamp: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        setBookmarks((prev) => [data, ...prev])
      }

      setError(null)
    } catch (err) {
      console.error("Failed to add bookmark:", err)
      setError(err instanceof Error ? err.message : "Failed to add bookmark")
    }
  }

  const removeBookmark = async (mangaId: string) => {
    if (!userId) {
      setError("User must be logged in to remove bookmarks")
      return
    }

    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("manga_id", mangaId)

      if (error) throw error

      setBookmarks((prev) => prev.filter((b) => b.manga_id !== mangaId))
      setError(null)
    } catch (err) {
      console.error("Failed to remove bookmark:", err)
      setError(err instanceof Error ? err.message : "Failed to remove bookmark")
    }
  }

  const getBookmark = (mangaId: string) => {
    return bookmarks.find((b) => b.manga_id === mangaId)
  }

  return { bookmarks, addBookmark, removeBookmark, getBookmark, isLoaded, error }
}