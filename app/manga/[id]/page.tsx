"use client";

import { useState, useRef } from "react";
import { trendingMangas } from "@/lib/mock-data";
import { MangaDetailsHero } from "@/components/manga-details-hero";
import { HorizontalMangaCard } from "@/components/horizontal-manga-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface MangaDetailsPageProps {
  params: {
    id: string;
  };
}

export default function MangaDetailsPage({ params }: MangaDetailsPageProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const manga = trendingMangas.find((m) => m.id === params.id);

  if (!manga) {
    return null;
  }

  const relatedMangas = trendingMangas
    .filter(
      (m) => m.id !== manga.id && m.genre.some((g) => manga.genre.includes(g))
    )
    .slice(0, 12);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex flex-1 lg:h-[calc(100vh-100px)] overflow-hidden">
        <section className="flex-1 overflow-y-auto h-full">
          <MangaDetailsHero manga={manga} />

          <div className="h-24 bg-gradient-to-b from-[#0a0a1a] via-[#0f1729] to-slate-900"></div>

          <div className="bg-slate-900 px-0 py-8">
            <div className="mx-auto max-w-[1600px]">
              <div className="flex items-center gap-2 mb-6 px-6 lg:px-10">
                <BookOpen className="h-5 w-5 text-pink-500" />
                <h2 className="text-2xl font-bold text-white">
                  You May Also Like
                </h2>
                <span className="text-sm text-white/60 ml-auto">
                  {relatedMangas.length}{" "}
                  {relatedMangas.length === 1 ? "manga" : "mangas"}
                </span>
              </div>

              {/* Container with arrows */}
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
