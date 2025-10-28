"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen, Eye, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { RatingComponent } from "./rating-component";

interface AnimeCardProps {
  manga: Manga;
}

export function AnimeCard({ manga }: AnimeCardProps) {
  const [showRating, setShowRating] = useState(false);
  const isLocked = manga.status === "Locked";

  const badgeLabel =
    manga.status === "ongoing"
      ? "Ongoing"
      : manga.status === "completed"
      ? "Completed"
      : "Coming Soon";

  const badgeStyle =
    manga.status === "ongoing"
      ? "bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-white shadow-lg shadow-pink-500/50 border-0 animate-pulse"
      : manga.status === "completed"
      ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 border-0"
      : "bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600/50 text-slate-300";

  return (
    <div
      onMouseEnter={() => !isLocked && setShowRating(true)}
      onMouseLeave={() => !isLocked && setShowRating(false)}
      className={`h-full transition-all duration-500 ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"
      }`}
    >
      <Link
        href={isLocked ? "#" : `/manga/${manga.id}`}
        onClick={(e) => {
          if (isLocked) e.preventDefault();
        }}
      >
        <Card
          className={`overflow-hidden h-full flex flex-col group relative p-0
            bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90
            border border-white/10 backdrop-blur-xl
            transition-all duration-500 ease-out
            ${
              isLocked
                ? "hover:shadow-none"
                : "hover:shadow-2xl hover:shadow-pink-500/20 hover:border-pink-500/50 hover:-translate-y-1"
            }`}
        >
          {/* Glow effect on hover */}
          {!isLocked && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 blur-xl" />
            </div>
          )}

          {/* Image Container */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 h-72 flex-shrink-0">
            <img
              src={
                manga.cover ||
                "/placeholder.svg?height=288&width=200&query=anime"
              }
              alt={manga.title}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isLocked
                  ? ""
                  : "group-hover:scale-110 group-hover:brightness-110"
              }`}
            />

            {/* Status Badge with sparkle */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              {!isLocked && manga.status === "ongoing" && (
                <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
              )}
              <Badge className={`${badgeStyle} font-semibold tracking-wide`}>
                {badgeLabel}
              </Badge>
            </div>

            {/* Rating Badge */}
            {!isLocked && (
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md 
                border border-pink-500/60 shadow-lg shadow-pink-500/30
                transition-all duration-300 group-hover:scale-110"
              >
                <Star className="w-4 h-4 fill-pink-400 text-pink-400 drop-shadow-glow" />
                <span className="text-sm font-bold bg-gradient-to-r from-pink-400 to-pink-300 bg-clip-text text-transparent">
                  {manga.rating}
                </span>
              </div>
            )}

            {/* Dynamic gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent
                ${
                  isLocked
                    ? "opacity-40"
                    : "opacity-60 group-hover:opacity-90 transition-opacity duration-500"
                }`}
            />

            {/* Shimmer effect on hover */}
            {!isLocked && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"
                />
              </div>
            )}

            {/* Locked Overlay */}
            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-[2px]">
                <div className="relative bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl">
                  <Lock className="w-8 h-8 text-white mb-2 drop-shadow-lg" />
                  <span className="text-white text-sm font-bold tracking-wide drop-shadow-md">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Content Container */}
          <div className="p-5 flex-1 flex flex-col gap-3 relative z-10">
            {/* Title */}
            <div>
              <h3
                className={`font-bold text-base line-clamp-2 transition-all duration-300 ${
                  isLocked
                    ? "text-slate-400"
                    : "text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text"
                }`}
              >
                {manga.title}
              </h3>
              <p
                className={`text-xs mt-1.5 font-medium ${
                  isLocked
                    ? "text-slate-500"
                    : "text-slate-400 group-hover:text-slate-300"
                }`}
              >
                {manga.author}
              </p>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5">
              {manga.genre.slice(0, 2).map((g) => (
                <Badge
                  key={g}
                  variant="outline"
                  className={`text-xs font-medium transition-all duration-300 ${
                    isLocked
                      ? "bg-white/5 border-white/10 text-slate-500"
                      : "bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-slate-300 hover:border-pink-400/50 hover:text-pink-300"
                  }`}
                >
                  {g}
                </Badge>
              ))}
              {manga.genre.length > 2 && (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${
                    isLocked
                      ? "bg-white/5 border-white/10 text-slate-500"
                      : "bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-slate-300"
                  }`}
                >
                  +{manga.genre.length - 2}
                </Badge>
              )}
            </div>

            {/* Rating Component */}
            {!isLocked && (
              <div className="py-2 border-t border-white/10">
                <RatingComponent mangaId={manga.id} />
              </div>
            )}

            {/* Stats */}
            <div
              className={`flex items-center gap-4 text-xs mt-auto pt-3 border-t border-gradient-to-r from-transparent via-white/10 to-transparent
                ${
                  isLocked
                    ? "text-slate-500"
                    : "text-slate-400 group-hover:text-slate-300"
                }`}
            >
              <div className="flex items-center gap-1.5 transition-all duration-300 group-hover:text-pink-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-medium">{manga.chapters} ch</span>
              </div>
              <div className="flex items-center gap-1.5 transition-all duration-300 group-hover:text-purple-400">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {(manga.views / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
