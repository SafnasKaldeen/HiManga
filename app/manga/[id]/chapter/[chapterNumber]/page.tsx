import { trendingMangas } from "@/lib/mock-data";
import { MangaReader } from "@/components/manga-reader";
import { Header } from "@/components/header";
import { CommentsSection } from "@/components/comments-section";
import { notFound } from "next/navigation";

interface ChapterPageProps {
  params: {
    id: string;
    chapterNumber: string;
  };
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const manga = trendingMangas.find((m) => m.id === params.id);
  const chapterNum = Number.parseInt(params.chapterNumber);

  if (!manga || chapterNum < 1 || chapterNum > manga.chapters) {
    notFound();
  }

  // Generate mock pages for the chapter (20 pages per chapter)
  const pages = Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
    image: `/placeholder.svg?height=800&width=600&query=manga chapter ${chapterNum} page ${
      i + 1
    }`,
  }));

  const previousChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = chapterNum < manga.chapters ? chapterNum + 1 : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* <Header /> */}
      <MangaReader
        manga={manga}
        mangaId={manga.id}
        mangaTitle={manga.title}
        mangaSlug={manga.slug}
        chapter={chapterNum}
        pages={pages}
        previousChapter={previousChapter}
        nextChapter={nextChapter}
        totalChapters={manga.chapters + 1}
      />
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-cyan-500/20 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CommentsSection mangaId={manga.id} />
        </div>
      </div>
    </div>
  );
}
