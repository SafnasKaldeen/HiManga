"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { trendingMangas } from "@/lib/mock-data";
import { AnimeCard } from "@/components/anime-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { ArrowRight } from "lucide-react";

export default function TrendingPage() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "views" | "recent">("rating");
  const [itemsPerPage] = useState(10);
  const [displayedItems, setDisplayedItems] = useState(itemsPerPage);

  const genres = [
    "All",
    "Action",
    "Fantasy",
    "Sci-Fi",
    "Romance",
    "Mystery",
    "Thriller",
    "Comedy",
  ];

  const filteredMangas = useMemo(() => {
    let result = trendingMangas;

    // Filter by genre
    if (selectedGenre && selectedGenre !== "All") {
      result = result.filter((m) => m.genre?.includes(selectedGenre));
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "rating") {
      result = [...result].sort(
        (a, b) => Number.parseFloat(b.rating) - Number.parseFloat(a.rating)
      );
    } else if (sortBy === "views") {
      result = [...result].sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return result;
  }, [selectedGenre, searchQuery, sortBy]);

  const displayedMangas = filteredMangas.slice(0, displayedItems);
  const hasMore = displayedItems < filteredMangas.length;

  const handleLoadMore = () => {
    setDisplayedItems((prev) => prev + itemsPerPage);
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre === "All" ? null : genre);
    setDisplayedItems(itemsPerPage);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Trending Manga
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover the most popular manga this season
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search manga by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 h-12"
            />
          </div>

          {/* Genre Filter and Sort */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all cursor-pointer ${
                    (genre === "All" && selectedGenre === null) ||
                    selectedGenre === genre
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-primary/30"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "rating" | "views" | "recent")
              }
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:border-primary/50 outline-none transition-colors"
            >
              <option value="rating">Sort by Rating</option>
              <option value="views">Sort by Views</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {displayedMangas.length} of {filteredMangas.length} manga
          </p>
        </div>

        {/* Manga Grid */}
        {displayedMangas.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-12">
              {displayedMangas.map((manga) => (
                <AnimeCard key={manga.id} manga={manga} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleLoadMore}
                  className="gap-2 bg-transparent border-pink-500/40 hover:text-pink-500/50 text-pink-500 rounded-full font-bold px-8"
                >
                  <span className="hidden sm:inline">Load More Anime</span>
                  <span className="sm:hidden">Load More</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No manga found matching your criteria
            </p>
            <Button
              onClick={() => {
                setSelectedGenre(null);
                setSearchQuery("");
                setDisplayedItems(itemsPerPage);
              }}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
