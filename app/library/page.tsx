"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useFavorites } from "@/hooks/use-favorites";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useAuth } from "@/lib/auth-context";
import { trendingMangas } from "@/lib/mock-data";
import { FavoritedCard } from "@/components/favorited-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Star, Trash2, Search, ArrowRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { RatingComponent } from "@/components/rating-component";

export default function LibraryPage() {
  const { user } = useAuth();
  const {
    favorites,
    removeFavorite,
    isLoaded: favLoaded,
  } = useFavorites(user?.id || null);
  const {
    bookmarks,
    removeBookmark,
    isLoaded: bookLoaded,
  } = useBookmarks(user?.id || null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "bookmarks">(
    "bookmarks"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage] = useState(12);
  const [displayedItems, setDisplayedItems] = useState(itemsPerPage);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Extract manga IDs from favorites and bookmarks
  const favoriteMangaIds = favorites.map((f) => f.manga_id);
  const favoriteMangas = trendingMangas.filter((m) =>
    favoriteMangaIds.includes(m.id)
  );

  const bookmarkedMangas = trendingMangas.filter((m) =>
    bookmarks.some((b) => b.manga_id === m.id)
  );

  // Filter by search query
  const filteredFavorites = useMemo(() => {
    if (!searchQuery) return favoriteMangas;
    return favoriteMangas.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, favoriteMangas]);

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarkedMangas;
    return bookmarkedMangas.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, bookmarkedMangas]);

  const currentMangas =
    activeTab === "favorites" ? filteredFavorites : filteredBookmarks;
  const displayedMangas = currentMangas.slice(0, displayedItems);
  const hasMore = displayedItems < currentMangas.length;

  const handleLoadMore = () => {
    setDisplayedItems((prev) => prev + itemsPerPage);
  };

  const handleTabChange = (tab: "favorites" | "bookmarks") => {
    setActiveTab(tab);
    setDisplayedItems(itemsPerPage);
    setSearchQuery("");
  };

  if (!isClient || !favLoaded || !bookLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading your library...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Library
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your favorites and bookmarks
          </p>
        </div>

        {/* Tabs and Search */}
        <div className="mb-8 space-y-6">
          {/* Tab Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleTabChange("favorites")}
              className={`px-6 py-3 rounded-full font-medium text-sm whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "favorites"
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-primary/30"
              }`}
            >
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => handleTabChange("bookmarks")}
              className={`px-6 py-3 rounded-full font-medium text-sm whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "bookmarks"
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20"
                  : "bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-primary/30"
              }`}
            >
              Bookmarks ({bookmarks.length})
            </button>
          </div>

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
        </div>

        {/* Results Count */}
        {currentMangas.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {displayedMangas.length} of {currentMangas.length} manga
            </p>
          </div>
        )}

        {/* Content */}
        {activeTab === "favorites" ? (
          displayedMangas.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
                {displayedMangas.map((manga) => (
                  <FavoritedCard
                    key={manga.id}
                    manga={manga}
                    onRemove={removeFavorite}
                  />
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
                    <span className="hidden sm:inline">Load More Manga</span>
                    <span className="sm:hidden">Load More</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center bg-card/50 border-white/10 backdrop-blur-sm">
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No favorites found matching your search"
                  : "No favorites yet"}
              </p>
              {searchQuery ? (
                <Button
                  onClick={() => setSearchQuery("")}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  Clear Search
                </Button>
              ) : (
                <Link href="/trending">
                  <Button className="bg-gradient-to-r from-primary to-secondary">
                    Explore Manga
                  </Button>
                </Link>
              )}
            </Card>
          )
        ) : displayedMangas.length > 0 ? (
          <>
            <div className="space-y-4 mb-12">
              {displayedMangas.map((manga) => {
                const bookmark = bookmarks.find((b) => b.manga_id === manga.id);
                return (
                  <Card
                    key={manga.id}
                    className="p-4 bg-card/50 border-white/10 hover:border-primary/30 transition-colors backdrop-blur-sm"
                  >
                    <div className="flex gap-4">
                      <Link
                        href={`/manga/${manga.id}`}
                        className="flex-shrink-0"
                      >
                        <img
                          src={manga.cover || "/placeholder.svg"}
                          alt={manga.title}
                          className="w-24 h-32 object-cover rounded"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link href={`/manga/${manga.id}`}>
                          <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
                            {manga.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-2">
                          {manga.author}
                        </p>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-primary text-primary" />
                            <span className="text-sm">{manga.rating}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-white/5 border-white/10"
                          >
                            Chapter {bookmark?.chapter_number}
                          </Badge>
                        </div>
                        <div className="mb-3 pb-3 border-b border-white/10">
                          <RatingComponent mangaId={manga.id} />
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/manga/${manga.id}/chapter/${bookmark?.chapter_number}`}
                          >
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-primary to-secondary"
                            >
                              Continue Reading
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBookmark(manga.id)}
                            className="gap-2 bg-transparent border-white/10 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleLoadMore}
                  className="gap-2 bg-transparent border-pink-500/40 hover:text-pink-500/50 text-pink-500 rounded-full font-bold px-8"
                >
                  <span className="hidden sm:inline">Load More Bookmarks</span>
                  <span className="sm:hidden">Load More</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center bg-card/50 border-white/10 backdrop-blur-sm">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No bookmarks found matching your search"
                : "No bookmarks yet"}
            </p>
            {searchQuery ? (
              <Button
                onClick={() => setSearchQuery("")}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                Clear Search
              </Button>
            ) : (
              <Link href="/">
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  Start Reading
                </Button>
              </Link>
            )}
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
