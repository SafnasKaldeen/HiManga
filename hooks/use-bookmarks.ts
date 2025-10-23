"use client"

import { useState, useEffect } from "react"

export interface Bookmark {
  mangaId: string
  chapterNumber: number
  pageNumber: number
  timestamp: number
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("manga-bookmarks")
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to load bookmarks:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("manga-bookmarks", JSON.stringify(bookmarks))
    }
  }, [bookmarks, isLoaded])

  const addBookmark = (mangaId: string, chapterNumber: number, pageNumber: number) => {
    setBookmarks((prev) => {
      const existing = prev.find((b) => b.mangaId === mangaId)
      if (existing) {
        return prev.map((b) => (b.mangaId === mangaId ? { ...b, chapterNumber, pageNumber, timestamp: Date.now() } : b))
      }
      return [...prev, { mangaId, chapterNumber, pageNumber, timestamp: Date.now() }]
    })
  }

  const removeBookmark = (mangaId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.mangaId !== mangaId))
  }

  const getBookmark = (mangaId: string) => {
    return bookmarks.find((b) => b.mangaId === mangaId)
  }

  return { bookmarks, addBookmark, removeBookmark, getBookmark, isLoaded }
}
