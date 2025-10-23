"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen, Eye } from "lucide-react";
import { useState } from "react";
import { RatingComponent } from "./rating-component";

interface AnimeCardProps {
  manga: Manga;
}

export function AnimeCard({ manga }: AnimeCardProps) {
  const [showRating, setShowRating] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowRating(true)}
      onMouseLeave={() => setShowRating(false)}
      className="h-full"
    >
      <Link href={`/manga/${manga.id}`}>
        <Card className="overflow-hidden hover:shadow-xl pt-0 mt-0 transition-all duration-300 cursor-pointer h-full flex flex-col group bg-white/5 border-white/10 hover:border-pink-500/40 hover:bg-white/10 backdrop-blur-sm">
          {/* Image Container */}
          <div className="relative overflow-hidden bg-[#0f0f1f] h-72 flex-shrink-0">
            <img
              src={
                manga.cover ||
                "/placeholder.svg?height=288&width=200&query=anime"
              }
              alt={manga.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />

            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <Badge
                className={`${
                  manga.status === "ongoing"
                    ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30"
                    : "bg-white/20 border border-white/30 text-white/80"
                }`}
              >
                {manga.status === "ongoing" ? "Ongoing" : "Completed"}
              </Badge>
            </div>

            {/* Rating Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-pink-500/40">
              <Star className="w-4 h-4 fill-pink-500 text-pink-500" />
              <span className="text-sm font-bold text-white">
                {manga.rating}
              </span>
            </div>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content Container */}
          <div className="p-4 flex-1 flex flex-col gap-3">
            {/* Title */}
            <div>
              <h3 className="font-bold text-base line-clamp-2 text-white group-hover:text-pink-500 transition-colors">
                {manga.title}
              </h3>
              <p className="text-xs text-white/60 mt-1">{manga.author}</p>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1">
              {manga.genre.slice(0, 2).map((g) => (
                <Badge
                  key={g}
                  variant="outline"
                  className="text-xs bg-white/10 border-white/20 text-white/70"
                >
                  {g}
                </Badge>
              ))}
              {manga.genre.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-white/10 border-white/20 text-white/70"
                >
                  +{manga.genre.length - 2}
                </Badge>
              )}
            </div>

            {/* {showRating && ( */}
            <div className="py-2 border-t border-white/10">
              <RatingComponent mangaId={manga.id} />
            </div>
            {/* )} */}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-white/60 mt-auto pt-2 border-t border-white/10">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{manga.chapters} ch</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{(manga.views / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
