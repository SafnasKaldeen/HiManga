// ========== TRENDING SECTION COMPONENT ==========
"use client";

import { trendingMangas } from "@/lib/mock-data";
import { AnimeCard } from "./anime-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, ChevronDown, X } from "lucide-react";
import { useState } from "react";

export function TrendingSection() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const genres = ["All", "Action", "Fantasy", "Sci-Fi", "Romance", "Mystery"];

  // Filter mangas based on selected genre
  const filteredMangas = selectedGenre
    ? trendingMangas.filter((manga) => manga.genre?.includes(selectedGenre))
    : trendingMangas;

  // Get visible mangas based on count
  const visibleMangas = filteredMangas.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f] relative">
      <div className="w-full px-4 md:px-10 lg:px-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-2 text-white">
              Trending Now
            </h2>
            <p className="text-white/60 text-lg">
              Most popular anime this season
            </p>
          </div>
          {/* <Button
            variant="outline"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="gap-2 bg-transparent border-pink-500/40 hover:bg-pink-500/10 text-pink-500 w-fit rounded-full font-bold"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced Filters</span>
            <span className="sm:hidden">Filters</span>
          </Button> */}
        </div>

        {/* Genre Filter - Desktop: Horizontal scroll, Mobile: Dropdown */}
        <div className="mb-12 relative">
          {/* Mobile Dropdown */}
          <div className="md:hidden">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold backdrop-blur-sm"
            >
              <span>
                {selectedGenre === null ? "All Genres" : selectedGenre}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  showFilterMenu ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Desktop Horizontal Scroll */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  setSelectedGenre(genre === "All" ? null : genre);
                  setVisibleCount(10); // Reset visible count on filter change
                }}
                className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  (genre === "All" && selectedGenre === null) ||
                  selectedGenre === genre
                    ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30"
                    : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15 hover:text-white backdrop-blur-sm"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {selectedGenre && (
          <p className="text-white/60 mb-6">
            Showing {filteredMangas.length} result
            {filteredMangas.length !== 1 ? "s" : ""} for {selectedGenre}
          </p>
        )}

        {/* Anime Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
          {visibleMangas.map((manga) => (
            <AnimeCard key={manga.id} manga={manga} />
          ))}
        </div>

        {/* No Results Message */}
        {filteredMangas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">
              No anime found in this genre. Try selecting a different filter.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredMangas.length && (
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handleLoadMore}
              className="gap-2 bg-transparent border-pink-500/40 hover:bg-pink-500/10 text-pink-500 rounded-full font-bold px-8"
            >
              <span className="hidden sm:inline">Load More Anime</span>
              <span className="sm:hidden">Load More</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* All Loaded Message */}
        {visibleCount >= filteredMangas.length && filteredMangas.length > 0 && (
          <div className="text-center">
            <p className="text-white/60">
              You've reached the end! All anime loaded.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Overlay Dropdown Menu */}
      {showFilterMenu && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowFilterMenu(false)}
          />

          {/* Dropdown Menu */}
          <div className="md:hidden fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 bg-[#0f0f1f]/95 border border-pink-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-pink-500/20 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Select Genre</h3>
              <button
                onClick={() => setShowFilterMenu(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Genre List */}
            <div className="p-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setSelectedGenre(genre === "All" ? null : genre);
                    setShowFilterMenu(false);
                    setVisibleCount(10); // Reset visible count on filter change
                  }}
                  className={`w-full px-5 py-3.5 text-left font-bold transition-all rounded-xl mb-1 ${
                    (genre === "All" && selectedGenre === null) ||
                    selectedGenre === genre
                      ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
