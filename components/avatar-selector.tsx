"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import Image from "next/image";
import {
  getAllAvatars,
  getAvatarCategories,
  filterAvatars,
  type Avatar,
} from "@/lib/avatar-utils";

interface AvatarSelectorProps {
  currentAvatarId: number;
  onSelect: (avatarId: number) => void;
  onClose: () => void;
}

export function AvatarSelector({
  currentAvatarId,
  onSelect,
  onClose,
}: AvatarSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(100);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get all avatars once and cache
  const allAvatars = useMemo(() => getAllAvatars(), []);
  const categories = useMemo(() => getAvatarCategories(), []);

  // Filter avatars based on search and category
  const filteredAvatars = useMemo(
    () => filterAvatars(allAvatars, searchTerm, categoryFilter),
    [allAvatars, searchTerm, categoryFilter]
  );

  // Only show a subset for performance (lazy loading)
  const visibleAvatars = useMemo(
    () => filteredAvatars.slice(0, visibleCount),
    [filteredAvatars, visibleCount]
  );

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when user scrolls past 80%
    if (scrollPercentage > 0.8 && visibleCount < filteredAvatars.length) {
      setVisibleCount((prev) => Math.min(prev + 100, filteredAvatars.length));
    }
  }, [visibleCount, filteredAvatars.length]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(100);
  }, [searchTerm, categoryFilter]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-8 z-50 bg-gradient-to-br from-slate-900/95 to-slate-900/90 border border-pink-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-pink-500/20 flex flex-col animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-selector-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-slate-900/50">
          <div>
            <h2
              id="avatar-selector-title"
              className="text-xl md:text-2xl font-bold text-white"
            >
              Choose Your Avatar
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select from {filteredAvatars.length} avatars
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition"
            aria-label="Close avatar selector"
          >
            <X className="w-6 h-6 text-white/70" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 md:p-6 border-b border-white/10 space-y-4 bg-slate-900/30">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search avatars by name or anime..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 transition-colors"
              aria-label="Search avatars"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  categoryFilter === category
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30"
                    : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                aria-pressed={categoryFilter === category}
              >
                {category === "all" ? "All" : category}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar Grid */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6"
        >
          {visibleAvatars.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/60">
              <p>No avatars found matching your search.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {visibleAvatars.map((avatar) => (
                  <AvatarButton
                    key={avatar.id}
                    avatar={avatar}
                    isSelected={currentAvatarId === avatar.id}
                    onSelect={onSelect}
                  />
                ))}
              </div>

              {/* Loading indicator */}
              {visibleCount < filteredAvatars.length && (
                <div className="flex justify-center mt-6">
                  <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(236, 72, 153, 0.3);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(236, 72, 153, 0.5);
        }
      `}</style>
    </>
  );
}

// Separate component for each avatar button to optimize rendering
interface AvatarButtonProps {
  avatar: Avatar;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

function AvatarButton({ avatar, isSelected, onSelect }: AvatarButtonProps) {
  return (
    <button
      onClick={() => onSelect(avatar.id)}
      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 group relative ${
        isSelected
          ? "border-pink-500 shadow-lg shadow-pink-500/50 scale-105"
          : "border-slate-700 hover:border-pink-500/50"
      }`}
      title={avatar.name || `Avatar ${avatar.id}`}
      aria-label={avatar.name || `Avatar ${avatar.id}`}
      aria-pressed={isSelected}
    >
      <Image
        src={avatar.url}
        alt={avatar.name || `Avatar ${avatar.id}`}
        className="w-full h-full object-cover bg-slate-800"
        width={64}
        height={64}
        loading="lazy"
      />
      {avatar.name && (
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
          <p className="text-white text-xs font-semibold truncate w-full">
            {avatar.name}
          </p>
          {avatar.anime && (
            <p className="text-slate-400 text-[10px] truncate w-full">
              {avatar.anime}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
