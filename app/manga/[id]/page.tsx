"use client";

import { useState } from "react";
import { trendingMangas } from "@/lib/mock-data";
import { MangaDetailsHero } from "@/components/manga-details-hero";
import { RelatedMangas } from "@/components/related-mangas";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CommentsSection } from "@/components/comments-section";
import { MobileCommentsOverlay } from "@/components/mobile-comments-overlay";
import { MessageCircle } from "lucide-react";

interface MangaDetailsPageProps {
  params: {
    id: string;
  };
}

export default function MangaDetailsPage({ params }: MangaDetailsPageProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const manga = trendingMangas.find((m) => m.id === params.id);

  if (!manga) {
    return null; // or notFound()
  }

  const relatedMangas = trendingMangas
    .filter(
      (m) => m.id !== manga.id && m.genre.some((g) => manga.genre.includes(g))
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main content area */}
      <main className="flex flex-1 lg:h-[calc(100vh-100px)] overflow-hidden">
        {/* Manga details (independent scroll area) */}
        <section className="flex-1 overflow-y-auto h-full">
          <MangaDetailsHero manga={manga} />

          {/* Smooth gradient transition zone */}
          <div className="h-24 bg-gradient-to-b from-[#0a0a1a] via-[#0f1729] to-slate-900"></div>

          <div className="bg-slate-900 px-0 py-4">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
              {/* Desktop Layout: Side by side */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <CommentsSection mangaId={manga.id} />
                </div>
                <div className="lg:border-l lg:border-slate-800 lg:pl-8">
                  <div className="sticky top-4">
                    <RelatedMangas mangas={relatedMangas} />
                  </div>
                </div>
              </div>

              {/* Mobile Layout: Related mangas only, comments in overlay */}
              <div className="lg:hidden space-y-8">
                {/* Mobile Comment Button */}
                <button
                  onClick={() => setIsCommentsOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">View Comments</span>
                </button>

                {/* Related mangas */}
                <div>
                  <RelatedMangas mangas={relatedMangas} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Mobile Comments Overlay */}
      <div className="lg:hidden">
        <MobileCommentsOverlay
          mangaId={manga.id}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
        />
      </div>
    </div>
  );
}
