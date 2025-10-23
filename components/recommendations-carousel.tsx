"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MangaCard } from "@/components/manga-card"
import { useRef } from "react"
import type { Manga } from "@/lib/mock-data"

interface RecommendationsCarouselProps {
  mangas: Manga[]
  title: string
}

export function RecommendationsCarousel({ mangas, title }: RecommendationsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        {title}
      </h2>

      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {mangas.map((manga) => (
            <div key={manga.id} className="flex-shrink-0 w-48">
              <MangaCard manga={manga} />
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-900/80 hover:bg-slate-800 text-cyan-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-900/80 hover:bg-slate-800 text-cyan-400"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
