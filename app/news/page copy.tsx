"use client";

import { useState, useEffect } from "react";
import {
  Newspaper,
  Filter,
  Sparkles,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Clock,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";

const NEWS_CATEGORIES = [
  {
    id: "all",
    name: "All News",
    color: "from-purple-500 to-blue-600",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Danime%2BOR%2Bmanga%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
  {
    id: "anime",
    name: "Anime",
    color: "from-orange-500 to-red-600",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Danime%2Bnews%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
  {
    id: "manga",
    name: "Manga",
    color: "from-green-500 to-emerald-600",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Dmanga%2Bnews%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
  {
    id: "games",
    name: "Games",
    color: "from-blue-500 to-cyan-600",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Danime%2Bgames%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
  {
    id: "movies",
    name: "Movies",
    color: "from-indigo-500 to-purple-600",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Danime%2Bmovies%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
  {
    id: "industry",
    name: "Industry",
    color: "from-pink-500 to-rose-600",
    feeds: [
      "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Danime%2Bindustry%26hl%3Den-US%26gl%3DUS%26ceid%3DUS%3Aen",
    ],
  },
];

export default function AnimeNewsAggregator() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [corsError, setCorsError] = useState(false);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setCorsError(false);

    try {
      const category = NEWS_CATEGORIES.find(
        (cat) => cat.id === selectedCategory
      );
      const feedUrl = category.feeds[0];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(feedUrl, {
        signal: controller.signal,
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Rate limit reached. Please wait a moment and try again."
          );
        }
        throw new Error(`Failed to fetch news (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.status !== "ok") {
        throw new Error(data.message || "Error fetching news feed");
      }

      if (!data.items || data.items.length === 0) {
        throw new Error("No news articles found for this category");
      }

      const parsedNews = data.items.map((item, index) => {
        const titleParts = item.title.split(" - ");
        const cleanTitle =
          titleParts.length > 1
            ? titleParts.slice(0, -1).join(" - ")
            : item.title;
        const source =
          titleParts.length > 1
            ? titleParts[titleParts.length - 1]
            : "News Source";

        // Try multiple ways to get an image
        let thumbnail =
          item.thumbnail ||
          item.enclosure?.link ||
          extractImageFromDescription(item.description);

        // If no image found, use placeholder
        if (!thumbnail) {
          thumbnail = getPlaceholderImage(cleanTitle, index);
        }

        return {
          id: `${item.guid || item.link}-${index}`,
          title: cleanTitle,
          url: item.link,
          excerpt: stripHtml(item.description || item.content || "").substring(
            0,
            300
          ),
          source: source,
          date: item.pubDate,
          category: selectedCategory,
          thumbnail: thumbnail,
        };
      });

      setNews(parsedNews);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);

      if (err.name === "AbortError") {
        setError(
          "Request timed out. Please check your connection and try again."
        );
      } else if (
        err.message.includes("CORS") ||
        err.message.includes("fetch")
      ) {
        setCorsError(true);
        setError(
          "Unable to fetch news due to browser restrictions. Using demo data instead."
        );
        loadDemoData();
      } else {
        setError(err.message || "Something went wrong while fetching news");
      }

      if (!corsError && news.length === 0) {
        loadDemoData();
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderImage = (title, index) => {
    const colors = [
      ["8B5CF6", "3B82F6"], // purple to blue
      ["F97316", "DC2626"], // orange to red
      ["10B981", "059669"], // green to emerald
      ["3B82F6", "06B6D4"], // blue to cyan
      ["6366F1", "8B5CF6"], // indigo to purple
      ["EC4899", "F43F5E"], // pink to rose
    ];

    const colorPair = colors[index % colors.length];
    const encodedTitle = encodeURIComponent(title.substring(0, 30));

    // Using a gradient placeholder service
    return `https://via.placeholder.com/400x300/${colorPair[0]}/${colorPair[1]}?text=${encodedTitle}`;
  };

  const loadDemoData = () => {
    const demoNews = [
      {
        id: "demo-1",
        title: "New Anime Season Announcements Set to Break Records in 2025",
        url: "https://news.google.com/search?q=anime",
        excerpt:
          "Industry insiders predict the upcoming anime season will feature over 50 new series, with major studios ramping up production...",
        source: "Anime News Network",
        date: new Date().toISOString(),
        category: selectedCategory,
        thumbnail:
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop",
      },
      {
        id: "demo-2",
        title: "Popular Manga Series Gets Live-Action Adaptation",
        url: "https://news.google.com/search?q=manga",
        excerpt:
          "Fans react with mixed emotions as beloved manga series announces Hollywood adaptation with A-list cast...",
        source: "Crunchyroll News",
        date: new Date(Date.now() - 3600000).toISOString(),
        category: selectedCategory,
        thumbnail:
          "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=300&fit=crop",
      },
      {
        id: "demo-3",
        title: "Studio Ghibli Film Breaks Box Office Records Worldwide",
        url: "https://news.google.com/search?q=anime+movies",
        excerpt:
          "The latest film from the legendary animation studio has grossed over $500 million globally in its opening weekend...",
        source: "Variety",
        date: new Date(Date.now() - 7200000).toISOString(),
        category: selectedCategory,
        thumbnail:
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
      },
      {
        id: "demo-4",
        title: "New Gaming Console to Feature Exclusive Anime Titles",
        url: "https://news.google.com/search?q=anime+games",
        excerpt:
          "Major gaming company announces partnership with popular anime franchises for exclusive game releases...",
        source: "IGN",
        date: new Date(Date.now() - 10800000).toISOString(),
        category: selectedCategory,
        thumbnail:
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop",
      },
      {
        id: "demo-5",
        title: "Anime Streaming Wars Heat Up as New Platform Launches",
        url: "https://news.google.com/search?q=anime+streaming",
        excerpt:
          "Competition intensifies in the anime streaming market with new service offering exclusive simulcasts...",
        source: "The Hollywood Reporter",
        date: new Date(Date.now() - 14400000).toISOString(),
        category: selectedCategory,
        thumbnail:
          "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=300&fit=crop",
      },
    ];

    setNews(demoNews);
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

  const scrapeImageFromUrl = async (url) => {
    try {
      // Use a CORS proxy to fetch the page
      const proxyUrl = "https://api.allorigins.win/raw?url=";
      const response = await fetch(proxyUrl + encodeURIComponent(url), {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) return null;

      const html = await response.text();

      // Try multiple methods to find an image
      // 1. Open Graph image
      let ogImageMatch = html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogImageMatch) return ogImageMatch[1];

      // 2. Twitter card image
      let twitterImageMatch = html.match(
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
      );
      if (twitterImageMatch) return twitterImageMatch[1];

      // 3. First article image
      let articleImageMatch = html.match(
        /<article[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i
      );
      if (articleImageMatch) return articleImageMatch[1];

      // 4. Any image in main content
      let contentImageMatch = html.match(
        /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*(?:content|article|featured)[^"']*["']/i
      );
      if (contentImageMatch) return contentImageMatch[1];

      // 5. First reasonable sized image (not icons/logos)
      let anyImageMatch = html.match(
        /<img[^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp))["'][^>]*>/i
      );
      if (
        anyImageMatch &&
        !anyImageMatch[1].includes("logo") &&
        !anyImageMatch[1].includes("icon")
      ) {
        return anyImageMatch[1];
      }

      return null;
    } catch (error) {
      console.error("Error scraping image:", error);
      return null;
    }
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
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "Recent";
    }
  };

  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold">
              {corsError ? "Demo Mode" : "Powered by Google News RSS"}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Anime News Aggregator
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Latest anime, manga, and gaming news from around the world
          </p>

          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* CORS Warning */}
        {corsError && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-blue-300 font-semibold text-sm">
                  Demo Mode Active
                </p>
                <p className="text-blue-400/80 text-xs leading-relaxed">
                  Live RSS feeds are blocked by your browser. To get real news,
                  you'll need to set up a backend API route or use a CORS proxy.
                  For now, showing demo articles.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Control Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <button
            onClick={fetchNews}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Fetching..." : "Refresh News"}</span>
          </button>

          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-all border border-slate-700/50"
          >
            <Filter className="w-4 h-4 inline mr-2" />
            {showAllCategories ? "Hide" : "Show"} Categories
          </button>
        </div>

        {/* Category Filter */}
        {showAllCategories && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {NEWS_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => selectCategory(category.id)}
                    disabled={loading}
                    className={`relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-105`
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50"
                    }`}
                  >
                    {category.name}
                    {isSelected && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Category Indicator */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-slate-400 text-sm">Viewing:</span>
          <span
            className={`px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r ${
              NEWS_CATEGORIES.find((c) => c.id === selectedCategory)?.color
            } text-white`}
          >
            {NEWS_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            <p className="text-slate-400 mt-4 font-medium">
              Fetching latest news...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && !corsError && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold">{error}</span>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              Try refreshing or selecting a different category
            </p>
          </div>
        )}

        {/* News Grid */}
        {!loading && news.length > 0 && (
          <div className="space-y-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="group relative bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-600" />

                <div className="p-6">
                  <div className="flex gap-4">
                    {/* Thumbnail - Always show */}
                    <div className="flex-shrink-0">
                      <div className="w-40 h-40 rounded-lg overflow-hidden bg-slate-800/50">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = getPlaceholderImage(
                              item.title,
                              news.indexOf(item)
                            );
                          }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 backdrop-blur-sm rounded-full text-blue-300 text-xs font-bold">
                          {item.source}
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.date)}
                        </span>
                      </div>

                      {/* Title & Link */}
                      <div className="flex items-start justify-between gap-4">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <h3 className="font-bold text-white text-xl leading-tight group-hover:text-purple-400 transition-colors">
                            {item.title}
                          </h3>
                        </a>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 bg-slate-800/50 hover:bg-purple-500/20 rounded-lg transition-all group/link"
                        >
                          <ExternalLink className="w-5 h-5 text-slate-400 group-hover/link:text-purple-400" />
                        </a>
                      </div>

                      {/* Excerpt */}
                      {item.excerpt && (
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && news.length === 0 && !error && (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">
              No news available
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Try refreshing or selecting a different category
            </p>
          </div>
        )}

        {/* Stats Footer */}
        {!loading && news.length > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 font-medium">
                Showing {news.length} articles from{" "}
                {NEWS_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </span>
            </div>
          </div>
        )}

        {/* Attribution */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-slate-500 text-sm">
            {corsError ? (
              "Demo articles for testing"
            ) : (
              <>
                News aggregated from{" "}
                <a
                  href="https://news.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Google News
                </a>{" "}
                via RSS feeds
              </>
            )}
          </p>
          <p className="text-slate-600 text-xs">
            {corsError
              ? "Set up a backend API for live news feeds"
              : "Real-time news • No API key required"}
          </p>
        </div>
      </div>
    </div>
  );
}
