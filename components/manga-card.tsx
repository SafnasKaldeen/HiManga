"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Manga } from "@/lib/mock-data"
import Link from "next/link"
import { Star, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

interface MangaCardProps {
  manga: Manga
  onGenreClick?: (genre: string) => void
}

export function MangaCard({ manga, onGenreClick }: MangaCardProps) {
  const router = useRouter()

  const handleGenreClick = (e: React.MouseEvent, genre: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (onGenreClick) {
      onGenreClick(genre)
    }
  }

  return (
    <Link href={`/manga/${manga.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col bg-white/5 border-white/10 hover:border-pink-500/40 hover:bg-white/10 backdrop-blur-sm">
        <div className="relative overflow-hidden bg-muted h-64">
          <img
            src={manga.cover || "/placeholder.svg"}
            alt={manga.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-primary/90">
              {manga.status === "ongoing" ? "Ongoing" : "Completed"}
            </Badge>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{manga.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{manga.author}</p>

          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{manga.rating}</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {manga.genre.slice(0, 2).map((g) => (
              <button
                key={g}
                onClick={(e) => handleGenreClick(e, g)}
                className="text-xs px-2 py-1 rounded bg-white/10 border border-white/20 text-white/70 hover:bg-pink-500/20 hover:border-pink-500/40 hover:text-pink-400 transition-all cursor-pointer"
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
            <BookOpen className="w-3 h-3" />
            <span>{manga.chapters} chapters</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
