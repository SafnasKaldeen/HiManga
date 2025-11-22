"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Lock,
  ChevronRight,
  Search,
  ArrowUpDown,
  X,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
  total_panels: number;
  published_at: string;
  created_at: string;
}

interface ChaptersSidebarProps {
  mangaId: string;
  currentChapter?: number;
  chapters: number;
  userId?: string;
}

export function ChaptersSidebar({
  mangaId,
  currentChapter = 1,
  chapters: totalChapters,
  userId,
}: ChaptersSidebarProps) {
  console.log("ChaptersSidebar rendered with:", {
    mangaId,
    currentChapter,
    totalChapters,
    userId,
  });

  const [displayedChapters, setDisplayedChapters] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [chaptersData, setChaptersData] = useState<Chapter[]>([]);
  const [readChapters, setReadChapters] = useState<number[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReadStatus, setIsLoadingReadStatus] = useState(false);

  const sanitizeTitle = (title: string | null) => {
    if (!title) return "";
    const parts = title.split("-");
    const lastPart = parts[parts.length - 1].trim();
    return lastPart.match(/^Chapter\s\d+/i) ? lastPart : title;
  };

  // Fetch chapters data
  useEffect(() => {
    const fetchChapters = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/manga/chapters?mangaId=${mangaId}`);
        const data = await res.json();

        if (data.chapters && data.chapters.length > 0) {
          const sortedData = data.chapters.sort((a, b) =>
            sortOrder === "desc"
              ? b.chapter_number - a.chapter_number
              : a.chapter_number - b.chapter_number
          );
          setChaptersData(sortedData);
          setUsingFallback(false);
        } else {
          generateFallbackChapters();
        }
      } catch (err) {
        console.error("Fetch error:", err);
        generateFallbackChapters();
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapters();
  }, [mangaId, sortOrder, totalChapters]);

  // Fetch read chapters separately with graceful fallback
  useEffect(() => {
    console.log("=== READ CHAPTERS USEEFFECT TRIGGERED ===");
    console.log("userId:", userId);
    console.log("mangaId:", mangaId);

    const fetchReadChapters = async () => {
      console.log("Fetching read chapters...");
      setIsLoadingReadStatus(true);
      try {
        const url = `/api/manga/chapters/user-reads?mangaId=${mangaId}`;
        console.log("Fetching URL:", url);

        const res = await fetch(url);

        console.log("Response status:", res.status);

        // Check if response is ok
        if (!res.ok) {
          console.warn(`Failed to fetch read chapters: ${res.status}`);
          setReadChapters([]);
          return;
        }

        const data = await res.json();
        console.log("Read chapters data:", data);

        // Check for error in response
        if (data.error) {
          console.warn("Error in read chapters response:", data.error);
          setReadChapters([]);
          return;
        }

        if (data.readChapters && Array.isArray(data.readChapters)) {
          // Convert to numbers to ensure consistency
          const readChapterNumbers = data.readChapters
            .map((ch: any) => (typeof ch === "number" ? ch : parseInt(ch, 10)))
            .filter((ch: number) => !isNaN(ch));

          setReadChapters(readChapterNumbers);
        } else {
          // Graceful fallback - no highlighting
          setReadChapters([]);
        }
      } catch (err) {
        // Graceful fallback on any error - don't break the UI
        console.warn(
          "Could not fetch read chapters, continuing without highlighting:",
          err
        );
        setReadChapters([]);
      } finally {
        setIsLoadingReadStatus(false);
      }
    };

    fetchReadChapters();
  }, [userId, mangaId]);

  // Fallback generation if no Supabase data
  const generateFallbackChapters = () => {
    const fallbackChapters = Array.from({ length: totalChapters }, (_, i) => {
      const chapterNumber = sortOrder === "desc" ? totalChapters - i : i + 1;
      return {
        id: `fallback-${chapterNumber}`,
        chapter_number: chapterNumber,
        title: `Chapter ${chapterNumber}`,
        total_panels: 0,
        published_at: new Date(Date.now() - i * 86400000).toISOString(),
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      };
    });
    setChaptersData(fallbackChapters);
    setUsingFallback(true);
  };

  // Function to mark chapter as read with graceful error handling
  const markChapterAsRead = async (chapterNumber: number) => {
    if (!userId) return;

    try {
      const res = await fetch("/api/manga/chapters/user-reads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          mangaId,
          chapterNumber,
        }),
      });

      if (!res.ok) {
        console.warn(`Failed to mark chapter as read: ${res.status}`);
        return;
      }

      const data = await res.json();

      if (data.success && data.readChapters) {
        setReadChapters(data.readChapters);
      }
    } catch (err) {
      console.warn("Could not mark chapter as read:", err);
      // Don't break the UI, just log the error
    }
  };

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollThreshold = 500;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < scrollThreshold && !isLoadingMore) {
      setIsLoadingMore(true);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setDisplayedChapters((prev) =>
            Math.min(prev + 25, chaptersData.length)
          );
          setIsLoadingMore(false);
        }, 200);
      });
    }
  }, [isLoadingMore, chaptersData.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Filter chapters by search
  const filteredChapters = searchQuery
    ? chaptersData.filter(
        (chapter) =>
          chapter.chapter_number.toString().includes(searchQuery) ||
          chapter.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chaptersData;

  const chaptersList = filteredChapters.slice(0, displayedChapters);
  const hasMore = displayedChapters < filteredChapters.length;

  // Reset displayed chapters on search or sort
  useEffect(() => {
    setDisplayedChapters(50);
    setIsLoadingMore(false);
  }, [searchQuery, sortOrder]);

  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.blur();
    setIsSearchFocused(false);
  };

  const isChapterLocked = (chapterNumber: number) =>
    chapterNumber > totalChapters;

  const isChapterRead = (chapterNumber: number) =>
    readChapters.includes(chapterNumber);

  return (
    <div
      className="w-full flex flex-col bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-transparent backdrop-blur-xl overflow-hidden h-100dvh lg:h-full lg:relative lg:border-l lg:border-slate-700/50"
      style={{
        maxHeight: "100dvh",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 z-20 p-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            {totalChapters} Chapters
          </h2>
          {readChapters.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{readChapters.length} read</span>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <input
            ref={searchInputRef}
            type="search"
            inputMode="numeric"
            placeholder="Search chapter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-slate-800/70 transition-all"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Button */}
        <button
          onClick={toggleSortOrder}
          type="button"
          className="mt-2 w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 transition-all active:scale-[0.98]"
        >
          <span>
            Sort: {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          </span>
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400/60" />
        </button>

        {searchQuery && (
          <p className="text-xs text-slate-400 mt-2">
            Found {filteredChapters.length} chapter
            {filteredChapters.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Scrollable Chapters List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#475569 transparent",
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="inline-block w-6 h-6 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-2">Loading chapters...</p>
          </div>
        ) : chaptersList.length > 0 ? (
          chaptersList.map((chapter) => {
            const isRead = isChapterRead(chapter.chapter_number);
            const isLocked = isChapterLocked(chapter.chapter_number);
            const isCurrent = currentChapter === chapter.chapter_number;

            return (
              <Link
                key={chapter.id}
                href={
                  isLocked
                    ? "#"
                    : `/manga/${mangaId}/chapter/${chapter.chapter_number}`
                }
                className={isLocked ? "pointer-events-none" : ""}
              >
                <div
                  className={`p-3 my-1 rounded-lg transition-all duration-200 group border flex items-center justify-between active:scale-[0.98] relative overflow-hidden ${
                    isCurrent
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/60 shadow-lg shadow-cyan-500/20"
                      : isRead
                      ? "bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border-emerald-600/50 hover:from-emerald-900/40 hover:to-emerald-800/30 hover:border-emerald-500/60"
                      : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-cyan-400/40"
                  } ${
                    isLocked
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {/* Read indicator bar on the left */}
                  {isRead && !isCurrent && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
                  )}

                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          isRead ? "text-emerald-50" : "text-slate-100"
                        }`}
                      >
                        {chapter.title || `Chapter ${chapter.chapter_number}`}
                      </p>
                      {isRead && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p
                      className={`text-xs ${
                        isRead ? "text-emerald-200/60" : "text-slate-400"
                      }`}
                    >
                      {new Date(chapter.published_at).toLocaleDateString()}
                    </p>
                    {isLocked && (
                      <p className="text-xs text-amber-400/70 mt-1">
                        Not released yet
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-amber-500/70" />
                    ) : (
                      <ChevronRight
                        className={`w-4 h-4 transition-colors ${
                          isRead
                            ? "text-emerald-400/70 group-hover:text-emerald-300"
                            : "text-cyan-400/60 group-hover:text-cyan-400"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">No chapters found</p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {isLoadingMore && !isLoading && (
          <div className="p-4 text-center">
            <div className="inline-block w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-2">
              Loading more chapters...
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        html,
        body {
          overflow: hidden;
          height: 100%;
          position: fixed;
          width: 100%;
        }

        div[style*="scrollbarWidth"]::-webkit-scrollbar {
          width: 8px;
        }

        div[style*="scrollbarWidth"]::-webkit-scrollbar-track {
          background: transparent;
        }

        div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        @supports (-webkit-touch-callout: none) {
          input[type="search"] {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
