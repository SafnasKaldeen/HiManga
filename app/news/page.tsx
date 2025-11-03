"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
} from "lucide-react";
import Img from "next/image";
import { Header } from "@/components/header";

const NEWS_CATEGORIES = [
  {
    id: "anime",
    name: "Anime",
    color: "from-blue-500 to-cyan-400",
    icon: "🎬",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Danime%2Bnews%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
  {
    id: "manga",
    name: "Manga",
    color: "from-purple-500 to-pink-400",
    icon: "📖",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Dmanga%2Bnews%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
];

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=300&fit=crop",
];

export default function AnimeNewsHub() {
  const [selectedCategory, setSelectedCategory] = useState("anime");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();

  useEffect(() => {
    setNews([]);
    setPage(1);
    setHasMore(true);
    fetchNews(true);
  }, [selectedCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreNews();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, news]);

  const fetchNews = async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const category = NEWS_CATEGORIES.find(
        (cat) => cat.id === selectedCategory
      );
      const feedUrl = category.feeds[0];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(feedUrl, {
        signal: controller.signal,
        method: "GET",
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }

      const data = await response.json();

      if (data.status !== "ok" || !data.items || data.items.length === 0) {
        loadDemoData(initial);
        return;
      }

      const parsedNews = data.items
        .map((item, index) => {
          const titleParts = item.title.split(" - ");
          const cleanTitle =
            titleParts.length > 1
              ? titleParts.slice(0, -1).join(" - ")
              : item.title;
          const source =
            titleParts.length > 1
              ? titleParts[titleParts.length - 1]
              : "News Source";

          let thumbnail = null;
          if (item.enclosure?.link) {
            thumbnail = item.enclosure.link;
          } else if (
            item.thumbnail &&
            !item.thumbnail.includes("gstatic.com")
          ) {
            thumbnail = item.thumbnail;
          } else {
            const imgFromDesc = extractImageFromDescription(item.description);
            if (imgFromDesc && !imgFromDesc.includes("gstatic.com")) {
              thumbnail = imgFromDesc;
            }
          }

          if (!thumbnail) {
            thumbnail = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
          }

          return {
            id: item.guid || item.link,
            title: cleanTitle,
            url: item.link,
            excerpt: stripHtml(item.description || "").substring(0, 200),
            source: source,
            date: item.pubDate,
            timestamp: new Date(item.pubDate).getTime(),
            category: selectedCategory,
            thumbnail: thumbnail,
            priority: getPriority(index),
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      if (initial) {
        setNews(parsedNews);
        setHasMore(false);
      } else {
        setNews((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = parsedNews.filter(
            (item) => !existingIds.has(item.id)
          );
          const combined = [...prev, ...newItems];
          return combined.sort((a, b) => b.timestamp - a.timestamp);
        });

        if (parsedNews.length === 0) {
          setHasMore(false);
        }
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      loadDemoData(initial);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreNews = () => {
    if (news.length >= 50) {
      setHasMore(false);
      return;
    }
    setPage((p) => p + 1);
    fetchNews(false);
  };

  const loadDemoData = (initial) => {
    const demoNews = [
      {
        id: `demo-1-${Date.now()}`,
        title: "Solo Leveling Season 2 Announces Epic Return Date",
        url: "https://news.google.com/search?q=anime",
        excerpt:
          "The highly anticipated second season of Solo Leveling has been confirmed with a release date. Fans worldwide prepare for Sung Jin-Woo's next adventure...",
        source: "Anime Herald",
        date: new Date().toISOString(),
        category: selectedCategory,
        thumbnail: PLACEHOLDER_IMAGES[0],
        priority: 1,
      },
      {
        id: `demo-2-${Date.now()}`,
        title: "Chainsaw Man Part 2 Manga Breaks Records",
        url: "https://news.google.com/search?q=manga",
        excerpt:
          "The continuation of Chainsaw Man in manga form shatters previous sales records, cementing its place as one of the most popular series...",
        source: "Manga Plus",
        date: new Date(Date.now() - 3600000).toISOString(),
        category: selectedCategory,
        thumbnail: PLACEHOLDER_IMAGES[1],
        priority: 1,
      },
      {
        id: `demo-3-${Date.now()}`,
        title: "Attack on Titan Final Exhibition Reveals New Artwork",
        url: "https://news.google.com/search?q=anime",
        excerpt:
          "Special exhibition features never-before-seen concept art and behind-the-scenes materials from the epic finale...",
        source: "Crunchyroll News",
        date: new Date(Date.now() - 7200000).toISOString(),
        category: selectedCategory,
        thumbnail: PLACEHOLDER_IMAGES[2],
        priority: 2,
      },
      {
        id: `demo-4-${Date.now()}`,
        title: "Demon Slayer Movie Surpasses Box Office Expectations",
        url: "https://news.google.com/search?q=anime",
        excerpt:
          "The latest theatrical release continues to dominate global box offices, breaking records in multiple territories...",
        source: "Anime News Network",
        date: new Date(Date.now() - 10800000).toISOString(),
        category: selectedCategory,
        thumbnail: PLACEHOLDER_IMAGES[3],
        priority: 2,
      },
      {
        id: `demo-5-${Date.now()}`,
        title: "One Piece Manga Reaches Historic Milestone",
        url: "https://news.google.com/search?q=manga",
        excerpt:
          "Eiichiro Oda's legendary series achieves an unprecedented milestone in manga publishing history...",
        source: "Shonen Jump",
        date: new Date(Date.now() - 14400000).toISOString(),
        category: selectedCategory,
        thumbnail: PLACEHOLDER_IMAGES[4],
        priority: 1,
      },
    ];

    if (initial) {
      setNews(demoNews);
    } else {
      setNews((prev) => [
        ...prev,
        ...demoNews.map((item, i) => ({ ...item, id: `${item.id}-${i}` })),
      ]);
    }
    setError("Demo Mode: Showing sample articles");
  };

  const getPriority = (index) => {
    if (index < 3) return 1;
    if (index < 8) return 2;
    if (index < 15) return 3;
    return 4;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return "from-yellow-500 to-orange-400";
      case 2:
        return "from-blue-500 to-cyan-400";
      case 3:
        return "from-purple-500 to-pink-400";
      case 4:
        return "from-green-500 to-emerald-400";
      default:
        return "from-slate-500 to-slate-400";
    }
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const extractImageFromDescription = (description) => {
    if (!description) return null;
    const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : null;
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header />
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
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-xs font-bold tracking-wider">
                  LIVE FEED
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
                  <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>
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
                  {/* <span className="text-2xl">{category.icon}</span> */}
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

        {/* <div className="mb-6">
          <button
            onClick={() => {
              setNews([]);
              setPage(1);
              setHasMore(true);
              fetchNews(true);
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-black tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Loading..." : "Refresh Feed"}</span>
          </button>
        </div> */}

        {error && (
          <div className="mb-6 p-4 bg-blue-500/10 border-2 border-blue-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-blue-300 font-bold text-sm tracking-wide">
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

        {news.length > 0 && (
          <div className="space-y-4">
            {news.map((item, index) => (
              <div
                key={item.id}
                className="relative group transition-all duration-300"
                style={{
                  animation: "slideIn 0.4s ease-out forwards",
                  animationDelay: `${(index % 10) * 0.05}s`,
                  opacity: 0,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

                <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-2 border-blue-500/30 group-hover:border-blue-400/60 transition-all duration-300">
                  {/* <div className="absolute -left-3 -top-3 w-10 h-10 z-10">
                    <div
                      className={`w-full h-full bg-gradient-to-br ${getPriorityColor(
                        item.priority
                      )} rounded-full flex items-center justify-center font-black text-white text-sm shadow-lg border-2 border-white/50`}
                    >
                      {item.priority}
                    </div>
                  </div> */}

                  <div className="flex gap-4 p-4">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-slate-900/50 border-2 border-blue-500/20">
                        <Img
                          src={"/news_thumbnail_" + (index % 10) + ".png"}
                          alt={item.title}
                          className="w-full h-full object-cover aspect-[16/9]"
                          width={128}
                          height={72}
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
                          className="font-light text-white text-lg leading-tight group-hover:text-blue-400 transition-colors tracking-wide"
                          style={{
                            fontFamily: 'Impact, "Arial Black", sans-serif',
                          }}
                        >
                          {item.title}
                        </h3>
                      </a>

                      {item.excerpt && (
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                          {item.excerpt}
                        </p>
                      )}

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
            ))}
          </div>
        )}

        {hasMore && news.length > 0 && (
          <div ref={observerRef} className="py-8 text-center">
            {loadingMore && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-blue-300 font-bold tracking-wide text-sm">
                  Loading More Stories...
                </p>
              </div>
            )}
          </div>
        )}

        {!hasMore && news.length > 0 && (
          <div className="py-8 text-center">
            <div className="inline-block p-4 bg-slate-800/50 border-2 border-blue-500/30">
              <p className="text-blue-300 font-black tracking-wider text-sm">
                End of Feed
              </p>
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 border-2 border-blue-500/30">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-bold tracking-wide text-sm">
                {news.length} Stories
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
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
