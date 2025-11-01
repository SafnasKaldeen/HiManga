"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen, Eye, Lock, Sparkles, TrendingUp } from "lucide-react";
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
      className={`h-full w-full max-w-[240px] mx-auto transition-all duration-500 ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.03]"
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
            bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95
            border border-white/10 backdrop-blur-xl
            transition-all duration-500 ease-out
            ${
              isLocked
                ? "hover:shadow-none"
                : "hover:shadow-2xl hover:shadow-pink-500/25 hover:border-pink-500/60 hover:-translate-y-2"
            }`}
        >
          {/* Animated glow effect on hover */}
          {!isLocked && (
            <>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/15 to-blue-500/10 blur-2xl animate-pulse" />
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
            </>
          )}

          {/* Image Container - Taller aspect ratio */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 h-[340px] flex-shrink-0">
            <img
              src={
                manga.cover ||
                "/placeholder.svg?height=340&width=240&query=anime"
              }
              alt={manga.title}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isLocked
                  ? "filter grayscale"
                  : "group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-110"
              }`}
            />

            {/* Status Badge with enhanced styling */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {!isLocked && manga.status === "ongoing" && (
                <div className="relative">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 absolute inset-0 animate-ping" />
                </div>
              )}
              <Badge
                className={`${badgeStyle} font-semibold tracking-wide text-xs px-2.5 py-0.5`}
              >
                {badgeLabel}
              </Badge>
            </div>

            {/* Enhanced Rating Badge */}
            {!isLocked && (
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-md 
                border border-pink-500/70 shadow-xl shadow-pink-500/40
                transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-pink-500/50"
              >
                <Star className="w-4 h-4 fill-pink-400 text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
                <span className="text-sm font-bold bg-gradient-to-r from-pink-400 via-pink-300 to-pink-400 bg-clip-text text-transparent">
                  {manga.rating}
                </span>
              </div>
            )}

            {/* Trending indicator for popular manga */}
            {!isLocked && manga.views > 5000000 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-sm border border-orange-300/50 shadow-lg shadow-orange-500/30">
                <TrendingUp className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">Hot</span>
              </div>
            )}

            {/* Enhanced gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent
                ${
                  isLocked
                    ? "opacity-50"
                    : "opacity-70 group-hover:opacity-95 transition-opacity duration-500"
                }`}
            />

            {/* Shimmer effect on hover */}
            {!isLocked && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                  translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"
                />
              </div>
            )}

            {/* Enhanced Locked Overlay */}
            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-blue-500/30 backdrop-blur-[3px]">
                <div className="relative bg-white/15 p-5 rounded-2xl backdrop-blur-md border border-white/30 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-2xl animate-pulse" />
                  <Lock className="w-10 h-10 text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] relative z-10" />
                  <span className="text-white text-sm font-bold tracking-wide drop-shadow-lg relative z-10">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Content Container */}
          <div className="p-4 flex-1 flex flex-col gap-3 relative z-10">
            {/* Title with enhanced hover effect */}
            <div>
              <h3
                className={`font-bold text-base line-clamp-2 leading-tight transition-all duration-300 ${
                  isLocked
                    ? "text-slate-400"
                    : "text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:via-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text"
                }`}
              >
                {manga.title}
              </h3>
              <p
                className={`text-xs mt-1.5 font-medium ${
                  isLocked
                    ? "text-slate-500"
                    : "text-slate-400 group-hover:text-slate-300 transition-colors duration-300"
                }`}
              >
                {manga.author}
              </p>
            </div>

            {/* Genres with enhanced styling */}
            <div className="flex flex-wrap gap-1.5">
              {manga.genre.slice(0, 2).map((g, idx) => (
                <Badge
                  key={g}
                  variant="outline"
                  className={`text-xs font-medium transition-all duration-300 ${
                    isLocked
                      ? "bg-white/5 border-white/10 text-slate-500"
                      : "bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-slate-300 hover:border-pink-400/60 hover:text-pink-300 hover:shadow-lg hover:shadow-pink-500/20"
                  }`}
                  style={{
                    transitionDelay: `${idx * 50}ms`,
                  }}
                >
                  {g}
                </Badge>
              ))}
              {manga.genre.length > 2 && (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium transition-all duration-300 ${
                    isLocked
                      ? "bg-white/5 border-white/10 text-slate-500"
                      : "bg-gradient-to-r from-white/10 to-white/5 border-white/20 text-slate-300 hover:border-purple-400/60 hover:text-purple-300"
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

            {/* Enhanced Stats */}
            <div
              className={`flex items-center justify-between gap-3 text-xs mt-auto pt-3 border-t border-white/10
                ${isLocked ? "text-slate-500" : "text-slate-400"}`}
            >
              <div
                className={`flex items-center gap-1.5 transition-all duration-300 ${
                  !isLocked && "group-hover:text-pink-400 group-hover:scale-105"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-medium">{manga.chapters} ch</span>
              </div>
              <div
                className={`flex items-center gap-1.5 transition-all duration-300 ${
                  !isLocked &&
                  "group-hover:text-purple-400 group-hover:scale-105"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {(manga.views / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          {!isLocked && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}
        </Card>
      </Link>
    </div>
  );
}
