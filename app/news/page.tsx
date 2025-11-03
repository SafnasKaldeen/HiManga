"use client";

import { useState, useEffect } from "react";
import {
  Newspaper,
  Calendar,
  Filter,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const FEATURED_MANGA = [
  { id: 21, name: "One Piece", color: "from-orange-500 to-red-600" },
  { id: 20, name: "Naruto", color: "from-orange-400 to-yellow-500" },
  { id: 48561, name: "Jujutsu Kaisen", color: "from-indigo-500 to-purple-600" },
  { id: 16498, name: "Attack on Titan", color: "from-red-600 to-gray-800" },
  { id: 11061, name: "Hunter x Hunter", color: "from-green-500 to-blue-600" },
  {
    id: 5114,
    name: "Fullmetal Alchemist",
    color: "from-yellow-600 to-red-700",
  },
];

interface NewsItem {
  mal_id: number;
  url: string;
  title: string;
  date: string;
  author_username: string;
  author_url: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  excerpt: string;
  manga_name?: string;
  manga_id?: number;
}

export default function MultiMangaNewsAggregator() {
  const [selectedManga, setSelectedManga] = useState<number[]>([
    FEATURED_MANGA[0].id,
  ]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "manga">("date");
  const [showAllManga, setShowAllManga] = useState(false);

  useEffect(() => {
    if (selectedManga.length > 0) {
      fetchAggregatedNews(selectedManga);
    }
  }, [selectedManga]);

  const fetchAggregatedNews = async (mangaIds: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const allNews: NewsItem[] = [];

      // Fetch news for each selected manga with rate limiting
      for (let i = 0; i < mangaIds.length; i++) {
        const mangaId = mangaIds[i];
        const manga = FEATURED_MANGA.find((m) => m.id === mangaId);

        // Respect rate limit: 3 requests per second
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }

        try {
          const response = await fetch(
            `https://api.jikan.moe/v4/anime/${mangaId}/news` // Changed from manga to anime
          );

          if (response.ok) {
            const data = await response.json();
            const newsWithManga = (data.data || []).map((item: NewsItem) => ({
              ...item,
              manga_name: manga?.name,
              manga_id: mangaId,
            }));
            allNews.push(...newsWithManga);
          }
        } catch (err) {
          console.error(`Failed to fetch news for ${manga?.name}:`, err);
        }
      }

      // Sort by date (newest first) and limit to 50 most recent items
      const sortedNews = allNews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50);

      setNews(sortedNews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMangaSelection = (mangaId: number) => {
    setSelectedManga((prev) => {
      if (prev.includes(mangaId)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== mangaId);
      } else {
        return [...prev, mangaId];
      }
    });
  };

  const selectAllManga = () => {
    setSelectedManga(FEATURED_MANGA.map((m) => m.id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const displayedNews =
    sortBy === "date"
      ? news
      : [...news].sort((a, b) =>
          (a.manga_name || "").localeCompare(b.manga_name || "")
        );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold">
              Aggregated News Feed
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Multi-Manga News
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Track news from multiple manga series in one unified feed
          </p>
        </div>

        {/* Manga Selector */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 font-semibold text-sm">
                Selected: {selectedManga.length} manga
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAllManga(!showAllManga)}
                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition-all border border-slate-700/50"
              >
                {showAllManga ? "Hide" : "Show"} All
              </button>

              <button
                onClick={selectAllManga}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-all border border-purple-500/30"
              >
                Select All
              </button>
            </div>
          </div>

          {/* Manga Grid */}
          {showAllManga && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {FEATURED_MANGA.map((manga) => {
                const isSelected = selectedManga.includes(manga.id);
                return (
                  <button
                    key={manga.id}
                    onClick={() => toggleMangaSelection(manga.id)}
                    className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isSelected
                        ? `bg-gradient-to-r ${manga.color} text-white shadow-lg scale-105`
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50"
                    }`}
                  >
                    {manga.name}
                    {isSelected && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Selected Pills */}
          {!showAllManga && (
            <div className="flex flex-wrap gap-2">
              {FEATURED_MANGA.filter((m) => selectedManga.includes(m.id)).map(
                (manga) => (
                  <button
                    key={manga.id}
                    onClick={() => toggleMangaSelection(manga.id)}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm bg-gradient-to-r ${manga.color} text-white shadow-lg hover:scale-105 transition-all`}
                  >
                    {manga.name}
                    <span className="ml-2">×</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            <button
              onClick={() => setSortBy("date")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                sortBy === "date"
                  ? "bg-purple-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              By Date
            </button>
            <button
              onClick={() => setSortBy("manga")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                sortBy === "manga"
                  ? "bg-purple-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              By Manga
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            <p className="text-slate-400 mt-4 font-medium">
              Loading news from {selectedManga.length} manga...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <span className="text-red-400 font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && displayedNews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedNews.map((item, index) => (
              <a
                key={`${item.mal_id}-${index}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1"
              >
                {/* Image */}
                {item.images?.jpg?.image_url && (
                  <div className="relative h-48 overflow-hidden bg-slate-800">
                    <img
                      src={item.images.jpg.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60" />

                    {/* Manga Badge */}
                    {item.manga_name && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full">
                        <span className="text-white text-xs font-bold">
                          {item.manga_name}
                        </span>
                      </div>
                    )}

                    {/* Time Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-slate-900/90 backdrop-blur-sm rounded-full">
                      <span className="text-slate-300 text-xs font-medium">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors leading-tight">
                    {item.title}
                  </h3>

                  {item.excerpt && (
                    <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                    {item.author_username && (
                      <div className="text-slate-500 text-xs">
                        by {item.author_username}
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-purple-400 text-xs font-semibold ml-auto">
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </a>
            ))}
          </div>
        )}

        {/* No News */}
        {!loading && !error && displayedNews.length === 0 && (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">
              No news available
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Select manga series to see their latest news
            </p>
          </div>
        )}

        {/* Stats Footer */}
        {!loading && displayedNews.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <Newspaper className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 font-medium">
                Showing {displayedNews.length} articles from{" "}
                {selectedManga.length} manga series
              </span>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
          >
            <span>Back to Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
