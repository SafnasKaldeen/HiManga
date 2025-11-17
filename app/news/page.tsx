"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
  Database,
} from "lucide-react";
import Image from "next/image";

const NEWS_CATEGORIES = [
  {
    id: "anime",
    name: "Anime",
    color: "from-blue-500 to-cyan-400",
    icon: "🎬",
    query: "anime",
  },
  {
    id: "manga",
    name: "Manga",
    color: "from-purple-500 to-pink-400",
    icon: "📖",
    query: "manga",
  },
];

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=300&fit=crop",
];

const formatDate = (dateStr) => {
  if (!dateStr) return "Recent";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recent";
  }
};

// Memoized NewsCard component
const NewsCard = React.memo(({ item, index }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="relative group transition-all duration-300"
      style={{
        animation: "slideIn 0.4s ease-out forwards",
        animationDelay: `${(index % 10) * 0.05}s`,
        opacity: 0,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

      <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-2 border-blue-500/30 group-hover:border-blue-400/60 transition-all duration-300">
        <div className="flex gap-4 p-4">
          <div className="flex-shrink-0">
            <div className="w-48 h-32 rounded-lg overflow-hidden bg-slate-900/50 border-2 border-blue-500/20">
              <Image
                src={
                  imgError || !item.thumbnail
                    ? PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]
                    : item.thumbnail
                }
                alt={item.title}
                width={192}
                height={128}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                unoptimized
              />
            </div>
          </div>

          <div className="flex-1 space-y-2 ml-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-wide">
                {item.source}
              </span>
              <span className="text-slate-500 text-xs font-bold tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(item.date)}
              </span>
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h3
                className="font-extralight text-white text-lg leading-tight group-hover:text-blue-400 transition-colors tracking-wide"
                style={{
                  fontFamily: 'Impact, "Arial Black", sans-serif',
                }}
              >
                {item.title}
              </h3>
            </a>

            <p className="text-slate-400 text-sm line-clamp-2">
              {item.excerpt}
            </p>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 transition-all duration-300 font-bold text-xs tracking-wide"
            >
              <span>Read More</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
      </div>
    </div>
  );
});

NewsCard.displayName = "NewsCard";

export default function AnimeNewsHub() {
  const [selectedCategory, setSelectedCategory] = useState("anime");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalArticles, setTotalArticles] = useState(0);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const category = NEWS_CATEGORIES.find(
        (cat) => cat.id === selectedCategory
      );

      // Fetch from Supabase via API route
      const url = `/api/news?q=${encodeURIComponent(category.query)}&max=100`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        method: "GET",
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch news: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.articles || data.articles.length === 0) {
        setNews([]);
        setTotalArticles(0);
        setLastUpdated(new Date());
        setError("No articles found for this category yet. Check back soon!");
        return;
      }

      setTotalArticles(data.totalArticles || data.articles.length);

      const parsedNews = data.articles.map((article, index) => ({
        id: article.url,
        title: article.title,
        url: article.url,
        excerpt: article.description || "No description available",
        source: article.source?.name || "Unknown Source",
        date: article.publishedAt,
        timestamp: new Date(article.publishedAt).getTime(),
        category: selectedCategory,
        thumbnail: article.image,
      }));

      // Already sorted by backend, but ensure it's by timestamp
      const sortedNews = parsedNews.sort((a, b) => b.timestamp - a.timestamp);

      setNews(sortedNews);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);

      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err.message || "Failed to load news. Please try again.");
      }

      setNews([]);
      setTotalArticles(0);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const formattedTime = useMemo(
    () => lastUpdated?.toLocaleTimeString(),
    [lastUpdated]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl animate-pulse" />
          <div className="relative bg-gradient-to-b from-slate-900/95 to-black/95 border-2 border-blue-500/30 p-6">
            <div className="absolute top-0 left-0 w-20 h-20 border-l-4 border-t-4 border-blue-400/50" />
            <div className="absolute top-0 right-0 w-20 h-20 border-r-4 border-t-4 border-blue-400/50" />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-l-4 border-b-4 border-blue-400/50" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-r-4 border-b-4 border-blue-400/50" />

            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-xs font-bold tracking-wider">
                  POWERED BY SUPABASE
                </span>
              </div>

              <h1
                className="text-4xl md:text-6xl font-black text-white tracking-wider"
                style={{
                  fontFamily: 'Impact, "Arial Black", sans-serif',
                  textShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
                }}
              >
                ANIME NEWS HUB
              </h1>

              <p className="text-blue-300 text-sm font-bold tracking-wide">
                Latest Updates & Breaking Stories
              </p>

              {lastUpdated && (
                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-bold tracking-wide">
                  <Clock className="w-4 h-4" />
                  <span>Last Updated: {formattedTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          {NEWS_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                disabled={loading}
                className={`relative flex-1 py-4 px-6 transition-all duration-300 font-black tracking-wider text-sm ${
                  isSelected
                    ? `bg-gradient-to-r ${category.color} text-white border-2 border-white/50 shadow-lg scale-105`
                    : "bg-slate-800/50 text-slate-400 border-2 border-blue-500/20 hover:border-blue-500/40"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <span>{category.name}</span>
                </div>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-black shadow-lg animate-pulse">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-6">
          <button
            onClick={fetchNews}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-black tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Loading..." : "Refresh Feed"}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 font-bold text-sm tracking-wide">
                {error}
              </p>
            </div>
          </div>
        )}

        {loading && news.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <p className="text-blue-300 font-black tracking-wider">
              Loading Feed...
            </p>
          </div>
        )}

        {!loading && news.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20">
            <Database className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-slate-400 font-bold tracking-wide">
              No articles available
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Try refreshing or check back later
            </p>
          </div>
        )}

        {news.length > 0 && (
          <div className="space-y-4">
            {news.map((item, index) => (
              <NewsCard key={`${item.id}-${index}`} item={item} index={index} />
            ))}
          </div>
        )}

        {news.length > 0 && (
          <div className="mt-8 text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 border-2 border-blue-500/30">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-bold tracking-wide text-sm">
                Showing {news.length} articles
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
