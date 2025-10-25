"use client";

import { useState, use } from "react";
import { trendingMangas } from "@/lib/mock-data";
import { MangaReader } from "@/components/manga-reader";
import { MobileCommentsOverlay } from "@/components/mobile-comments-overlay";
import { MessageCircle, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

interface ChapterPageProps {
  params: Promise<{
    id: string;
    chapterNumber: string;
  }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { id, chapterNumber } = use(params);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const manga = trendingMangas.find((m) => m.id === id);
  const chapterNum = Number.parseInt(chapterNumber);

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
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Main content - blur when comments open */}
      <div
        className={`h-full flex flex-col transition-all duration-300 ${
          isCommentsOpen ? "blur-sm" : ""
        }`}
      >
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
      </div>
    </div>
  );
}
