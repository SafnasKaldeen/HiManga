// components/bookmark-button.tsx
"use client";

import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";

interface BookmarkButtonProps {
  mangaId: string;
  chapterNumber?: number;
  pageNumber?: number;
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}

export function BookmarkButton({
  mangaId,
  chapterNumber = 1,
  pageNumber = 1,
  size = "default",
  showText = false,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const { getBookmark, addBookmark, removeBookmark, isLoaded } = useBookmarks(
    user?.id ?? null
  );
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsBookmarked(!!getBookmark(mangaId));
    }
  }, [isLoaded, mangaId, getBookmark]);

  const handleToggle = async () => {
    if (isLoading || !user) return;

    setIsLoading(true);

    try {
      if (isBookmarked) {
        const success = await removeBookmark(mangaId);
        if (success) {
          setIsBookmarked(false);
        }
      } else {
        const success = await addBookmark(mangaId, chapterNumber, pageNumber);
        if (success) {
          setIsBookmarked(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      disabled={isLoading || !user}
      className={`gap-2 bg-transparent text-foreground hover:text-accent transition-all ${
        isBookmarked ? "text-accent" : ""
      }`}
    >
      <Bookmark
        className={`w-4 h-4 transition-all ${
          isBookmarked ? "fill-accent" : ""
        }`}
      />
      {showText && (isBookmarked ? "Bookmarked" : "Bookmark")}
    </Button>
  );
}
