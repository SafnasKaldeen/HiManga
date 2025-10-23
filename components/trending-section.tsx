// ========== TRENDING SECTION COMPONENT ==========
"use client";

import { trendingMangas } from "@/lib/mock-data";
import { AnimeCard } from "./anime-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter } from "lucide-react";
import { useState } from "react";

export function TrendingSection() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const genres = ["All", "Action", "Fantasy", "Sci-Fi", "Romance", "Mystery"];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f]">
      <div className="w-full px-10 md:px-18 lg:px-24">
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
          <Button
            variant="outline"
            className="gap-2 bg-transparent border-pink-500/40 hover:bg-pink-500/10 text-pink-500 w-fit rounded-full font-bold"
          >
            <Filter className="w-4 h-4" />
            Advanced Filters
          </Button>
        </div>

        {/* Genre Filter */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre === "All" ? null : genre)}
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

        {/* Anime Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {trendingMangas.map((manga) => (
            <AnimeCard key={manga.id} manga={manga} />
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 bg-transparent border-pink-500/40 hover:bg-pink-500/10 text-pink-500 rounded-full font-bold px-8"
          >
            Load More Anime <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
