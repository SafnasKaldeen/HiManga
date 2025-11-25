"use client";

import { useState, use } from "react";
import { useManga } from "@/hooks/use-mangas";
import { MangaReader } from "@/components/manga-reader";
import { Loader2 } from "lucide-react";
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

  const chapterNum = Number.parseFloat(chapterNumber);

  // Fetch manga and highest chapter from database
  const { manga, highestChapter, isLoading, error } = useManga(id);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  // Error or not found - validate chapter number is positive
  if (error || !manga || chapterNum < 1 || isNaN(chapterNum)) {
    notFound();
  }

  // Use highest chapter from database, fallback to metadata
  const totalChapters = highestChapter || manga.chapters;

  // Generate mock pages for the chapter (20 pages per chapter)
  const pages = Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
    image: `/placeholder.svg?height=800&width=600&query=manga chapter ${chapterNum} page ${
      i + 1
    }`,
  }));

  const previousChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = chapterNum + 1; // Always allow navigation to next

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
          totalChapters={totalChapters}
        />
      </div>
    </div>
  );
}
