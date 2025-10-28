"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Lock, ChevronRight, Search, ArrowUpDown, X } from "lucide-react";
import Link from "next/link";

interface ChaptersSidebarProps {
  mangaId: string;
  currentChapter?: number;
  chapters: number;
}

export function ChaptersSidebar({
  mangaId,
  currentChapter = 1,
  chapters: totalChapters,
}: ChaptersSidebarProps) {
  const [displayedChapters, setDisplayedChapters] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const allChapters = Array.from({ length: totalChapters }, (_, i) => {
    const chapterNumber = sortOrder === "desc" ? totalChapters - i : i + 1;
    return {
      number: chapterNumber,
      title: `Chapter ${chapterNumber}`,
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      isLocked: chapterNumber > totalChapters - 1,
    };
  });

  // Filter chapters based on search query
  const filteredChapters = searchQuery
    ? allChapters.filter(
        (chapter) =>
          chapter.number.toString().includes(searchQuery) ||
          chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allChapters;

  // Get visible chapters for display
  const chaptersList = filteredChapters.slice(0, displayedChapters);
  const hasMore = displayedChapters < filteredChapters.length;

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollThreshold = 500;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < scrollThreshold && !isLoadingMore && hasMore) {
      setIsLoadingMore(true);

      requestAnimationFrame(() => {
        setTimeout(() => {
          setDisplayedChapters((prev) => {
            const newCount = Math.min(prev + 25, filteredChapters.length);
            return newCount;
          });
          setIsLoadingMore(false);
        }, 200);
      });
    }
  }, [isLoadingMore, hasMore, filteredChapters.length]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollHandler = () => {
      handleScroll();
    };

    container.addEventListener("scroll", scrollHandler, { passive: true });

    setTimeout(() => handleScroll(), 100);

    return () => {
      container.removeEventListener("scroll", scrollHandler);
    };
  }, [handleScroll]);

  // Reset displayed chapters when search or sort changes
  useEffect(() => {
    setDisplayedChapters(50);
    setIsLoadingMore(false);
  }, [searchQuery, sortOrder]);

  // Handle viewport resize when keyboard appears
  useEffect(() => {
    if (!isSearchFocused) return;

    const handleResize = () => {
      // Scroll the input into view when keyboard appears
      if (searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSearchFocused]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.blur();
    setIsSearchFocused(false);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-transparent backdrop-blur-xl">
      {/* Fixed Header Section - Made sticky for mobile */}
      <div className="flex-shrink-0 sticky top-0 z-20 p-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-md">
        <h2 className="font-bold text-sm bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Chapters
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {totalChapters - 1} available chapters
        </p>

        {/* Search Input - Improved mobile handling */}
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

        {/* Search Results Info */}
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
        {chaptersList.length > 0 ? (
          chaptersList.map((chapter) => (
            <Link
              key={chapter.number}
              href={
                chapter.isLocked
                  ? "#"
                  : `/manga/${mangaId}/chapter/${chapter.number}`
              }
              className={chapter.isLocked ? "pointer-events-none" : ""}
            >
              <div
                className={`p-3 my-1 rounded-lg transition-all duration-200 group border flex items-center justify-between active:scale-[0.98] ${
                  currentChapter === chapter.number
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/60 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-cyan-400/40"
                } ${
                  chapter.isLocked
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex flex-col gap-0.5 flex-1">
                  <p className="text-sm font-semibold text-slate-100">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-slate-400">{chapter.date}</p>
                  {chapter.isLocked && (
                    <p className="text-xs text-amber-400/70 mt-1">
                      Not released yet
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {chapter.isLocked && (
                    <Lock className="w-4 h-4 text-amber-500/70" />
                  )}
                  {!chapter.isLocked && (
                    <ChevronRight className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
                  )}
                </div>
              </div>
            </Link>
          ))
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

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="p-4 text-center">
            <div className="inline-block w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 mt-2">
              Loading more chapters...
            </p>
          </div>
        )}

        {/* Scroll for more indicator */}
        {hasMore && !isLoadingMore && chaptersList.length > 0 && (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-400">Scroll for more...</p>
            <p className="text-xs text-slate-500 mt-1">
              Showing {chaptersList.length} of {filteredChapters.length}
            </p>
          </div>
        )}

        {/* End of list */}
        {!hasMore && chaptersList.length > 0 && (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-500">
              All chapters loaded ({chaptersList.length})
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
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

        /* Prevent iOS zoom on input focus */
        @supports (-webkit-touch-callout: none) {
          input[type="search"] {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
