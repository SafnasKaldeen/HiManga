"use client";

import { use, useState, useRef, useEffect } from "react";
import { useMangas } from "@/hooks/use-mangas";
import { supabase } from "@/lib/supabase";
import { MangaDetailsHero } from "@/components/manga-details-hero";
import { HorizontalMangaCard } from "@/components/horizontal-manga-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MangaDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MangaDetailsPage({ params }: MangaDetailsPageProps) {
  const { id } = use(params);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [relatedMangaIds, setRelatedMangaIds] = useState<string[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  // Fetch current manga and related mangas using the cached hook
  const { favoriteMangas: allMangas, isLoading: mangasLoading } = useMangas(
    "system", // Use a system user ID to enable caching
    [id, ...relatedMangaIds], // Fetch current manga + related mangas
    []
  );

  // Extract current manga from the results
  const currentManga = allMangas.find((m) => m.id === id);
  const relatedMangas = allMangas.filter((m) => m.id !== id);

  // Fetch related manga IDs based on current manga's genres
  useEffect(() => {
    async function fetchRelatedMangas() {
      if (!currentManga) return;

      setIsLoadingRelated(true);
      try {
        const genres = currentManga.genre;

        if (genres.length === 0) {
          setIsLoadingRelated(false);
          return;
        }

        // Get genre IDs
        const { data: genreData, error: genreError } = await supabase
          .from("genres")
          .select("id")
          .in("name", genres);

        if (genreError) throw genreError;

        const genreIds = genreData?.map((g) => g.id) || [];

        if (genreIds.length === 0) {
          setIsLoadingRelated(false);
          return;
        }

        // Get manga IDs that have these genres
        const { data: mangaGenreData, error: mangaGenreError } = await supabase
          .from("manga_genres")
          .select("manga_id")
          .in("genre_id", genreIds)
          .neq("manga_id", id)
          .limit(20);

        if (mangaGenreError) throw mangaGenreError;

        // Get unique manga IDs
        const uniqueMangaIds = Array.from(
          new Set(mangaGenreData?.map((mg) => mg.manga_id) || [])
        ).slice(0, 20);

        setRelatedMangaIds(uniqueMangaIds);
      } catch (error) {
        console.error("Error fetching related mangas:", error);
      } finally {
        setIsLoadingRelated(false);
      }
    }

    if (currentManga && relatedMangaIds.length === 0) {
      fetchRelatedMangas();
    }
  }, [currentManga, id, relatedMangaIds.length]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft =
        direction === "left"
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Loading state
  if (mangasLoading || isLoadingRelated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading manga details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!currentManga) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center bg-card/50 border-white/10 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4">Manga Not Found</h2>
            <p className="text-muted-foreground">
              The manga you're looking for doesn't exist.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex flex-1 lg:h-[calc(100vh-100px)] overflow-hidden">
        <section className="flex-1 overflow-y-auto h-full">
          <MangaDetailsHero manga={currentManga} />

          <div className="h-24 bg-gradient-to-b from-[#0a0a1a] via-[#0f1729] to-slate-900"></div>

          <div className="bg-slate-900 px-0 py-8">
            <div className="mx-auto -my-10 max-w-[1600px]">
              <div className="flex items-center gap-2 mb-6 px-6 lg:px-10">
                <BookOpen className="h-5 w-5 text-pink-500" />
                <h2 className="text-2xl font-bold text-white">
                  You May Also Like
                </h2>
                {relatedMangas.length > 0 && (
                  <span className="text-sm text-white/60 ml-auto">
                    {relatedMangas.length}{" "}
                    {relatedMangas.length === 1 ? "manga" : "mangas"}
                  </span>
                )}
              </div>

              {/* No related mangas */}
              {relatedMangas.length === 0 ? (
                <div className="flex items-center justify-center py-12 px-6">
                  <p className="text-white/60">No related manga found</p>
                </div>
              ) : (
                /* Related mangas carousel */
                <div className="relative group">
                  {/* Left Arrow */}
                  {showLeftArrow && (
                    <button
                      onClick={() => scroll("left")}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100 hover:scale-110"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  )}

                  {/* Right Arrow */}
                  {showRightArrow && (
                    <button
                      onClick={() => scroll("right")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 flex items-center justify-center shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100 hover:scale-110"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  )}

                  {/* Scrollable container */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide pl-6 lg:pl-10"
                  >
                    <div className="flex gap-4 lg:gap-6 pr-6 lg:pr-10">
                      {relatedMangas.map((relatedManga) => (
                        <div
                          key={relatedManga.id}
                          className="flex-shrink-0 w-[200px] lg:w-[270px]"
                        >
                          <HorizontalMangaCard manga={relatedManga} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
