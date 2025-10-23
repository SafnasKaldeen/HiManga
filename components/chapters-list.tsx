"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Manga } from "@/lib/mock-data"
import { Lock, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface ChaptersListProps {
  manga: Manga
}

export function ChaptersList({ manga }: ChaptersListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const chaptersPerPage = 12

  // Generate mock chapters
  let chapters = Array.from({ length: manga.chapters }, (_, i) => ({
    number: manga.chapters - i,
    title: `Chapter ${manga.chapters - i}`,
    date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
    isLocked: i > 5,
  }))

  if (sortOrder === "oldest") {
    chapters = chapters.reverse()
  }

  const totalPages = Math.ceil(chapters.length / chaptersPerPage)
  const startIndex = (currentPage - 1) * chaptersPerPage
  const paginatedChapters = chapters.slice(startIndex, startIndex + chaptersPerPage)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Chapters</h2>
          <p className="text-sm text-muted-foreground">Total: {manga.chapters} chapters</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          className="text-xs"
        >
          {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
        {paginatedChapters.map((chapter) => (
          <Link
            key={chapter.number}
            href={chapter.isLocked ? "#" : `/manga/${manga.id}/chapter/${chapter.number}`}
            className={chapter.isLocked ? "pointer-events-none" : ""}
          >
            <Card
              className={`p-3 text-center transition-all hover:scale-105 ${
                chapter.isLocked
                  ? "opacity-50 cursor-not-allowed bg-muted/30"
                  : "cursor-pointer hover:bg-primary/10 hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                {chapter.isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                <p className="text-xs font-semibold truncate w-full">Ch. {chapter.number}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{chapter.date}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
