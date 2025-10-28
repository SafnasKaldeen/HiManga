"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Lock,
  ChevronRight,
  Search,
  ArrowUpDown,
  X,
  Delete,
} from "lucide-react";
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
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setShowKeyboard(false);
  };

  // Handle keyboard input
  const handleKeyPress = (value: string) => {
    if (value === "backspace") {
      setSearchQuery((prev) => prev.slice(0, -1));
    } else if (value === "clear") {
      setSearchQuery("");
    } else {
      setSearchQuery((prev) => prev + value);
    }
  };

  // Handle input focus for mobile
  const handleInputFocus = () => {
    if (isMobile) {
      setShowKeyboard(true);
      searchInputRef.current?.blur(); // Prevent native keyboard
    }
  };

  // Custom keyboard buttons
  const keyboardButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["clear", "0", "backspace"],
  ];

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-transparent backdrop-blur-xl overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 z-20 p-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-md">
        <h2 className="font-bold text-sm bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
          Chapters
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {totalChapters - 1} available chapters
        </p>

        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <input
            ref={searchInputRef}
            type="text"
            readOnly={isMobile}
            placeholder="Search chapter..."
            value={searchQuery}
            onChange={(e) => !isMobile && setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onClick={handleInputFocus}
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-slate-800/70 transition-all cursor-pointer"
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
        className={`flex-1 overflow-y-auto p-3 space-y-2 transition-all ${
          showKeyboard && isMobile ? "pb-48" : ""
        }`}
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

      {/* Custom Numeric Keyboard - Only on Mobile */}
      {showKeyboard && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-xl border-t border-cyan-500/30 p-3 z-50 animate-slide-up">
          <div className="max-w-sm mx-auto">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-slate-400">Enter chapter number</p>
              <button
                onClick={() => setShowKeyboard(false)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {keyboardButtons.map((row, rowIndex) => (
                <div key={rowIndex}>
                  {row.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      className={`p-4 rounded-lg font-semibold transition-all active:scale-95 ${
                        key === "clear"
                          ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                          : key === "backspace"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 flex items-center justify-center"
                          : "bg-slate-800/80 text-slate-100 border border-slate-700/50 hover:bg-slate-700/80 hover:border-cyan-400/50"
                      }`}
                      type="button"
                    >
                      {key === "backspace" ? (
                        <Delete className="w-5 h-5" />
                      ) : key === "clear" ? (
                        "Clear"
                      ) : (
                        key
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
