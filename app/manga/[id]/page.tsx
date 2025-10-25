import { trendingMangas } from "@/lib/mock-data";
import { MangaDetailsHero } from "@/components/manga-details-hero";
import { RelatedMangas } from "@/components/related-mangas";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { notFound } from "next/navigation";
import { CommentsSection } from "@/components/comments-section";

interface MangaDetailsPageProps {
  params: {
    id: string;
  };
}

export default function MangaDetailsPage({ params }: MangaDetailsPageProps) {
  const manga = trendingMangas.find((m) => m.id === params.id);

  if (!manga) {
    notFound();
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
      <main className="flex flex-1 h-[calc(100vh-100px)] overflow-hidden">
        {/* Sidebar (chapters list) */}
        {/* <aside className="w-72 border-r border-border/30 overflow-y-auto h-full">
          <ChaptersSidebar manga={manga} />
        </aside> */}

        {/* Manga details (independent scroll area) */}
        <section className="flex-1 overflow-y-auto h-full">
          <MangaDetailsHero manga={manga} />

          {/* Smooth gradient transition zone */}
          <div className="h-24 bg-gradient-to-b from-[#0a0a1a] via-[#0f1729] to-slate-900"></div>

          <div className="bg-slate-900 px-4 py-8">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {/* <CommentsSection mangaId={manga.id} /> */}
                </div>
                <div className="lg:border-l lg:border-slate-800 lg:pl-8">
                  <div className="sticky top-4">
                    <RelatedMangas mangas={relatedMangas} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
