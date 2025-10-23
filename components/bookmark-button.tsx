"use client"

import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useState, useEffect } from "react"

interface BookmarkButtonProps {
  mangaId: string
  chapterNumber: number
  pageNumber: number
  size?: "sm" | "default" | "lg"
  showText?: boolean
}

export function BookmarkButton({
  mangaId,
  chapterNumber,
  pageNumber,
  size = "default",
  showText = false,
}: BookmarkButtonProps) {
  const { getBookmark, addBookmark, removeBookmark, isLoaded } = useBookmarks()
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      setIsBookmarked(!!getBookmark(mangaId))
    }
  }, [isLoaded, mangaId, getBookmark])

  const handleToggle = () => {
    if (isBookmarked) {
      removeBookmark(mangaId)
    } else {
      addBookmark(mangaId, chapterNumber, pageNumber)
    }
    setIsBookmarked(!isBookmarked)
  }

  if (!isLoaded) {
    return null
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      className={`gap-2 bg-transparent ${isBookmarked ? "text-accent" : ""}`}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-accent" : ""}`} />
      {showText && (isBookmarked ? "Bookmarked" : "Bookmark")}
    </Button>
  )
}
