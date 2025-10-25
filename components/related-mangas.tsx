"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen, Eye } from "lucide-react";

interface RelatedMangasProps {
  mangas: Manga[];
}

export function RelatedMangas({ mangas }: RelatedMangasProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-pink-500" />
        <h2 className="text-2xl font-bold text-white">You May Also Like</h2>
      </div>

      <div className="grid gap-4">
        {mangas.length > 0 ? (
          mangas.map((manga) => (
            <Link key={manga.id} href={`/manga/${manga.id}`}>
              <Card className="overflow-hidden hover:shadow-xl hover:shadow-pink-500/20 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10 hover:border-pink-500/40 backdrop-blur-sm group">
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                  {/* Cover Image */}
                  <div className="relative w-16 sm:w-20 h-24 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-lg shadow-pink-500/10 group-hover:shadow-pink-500/30 transition-shadow">
                    <img
                      src={manga.cover || "/placeholder.svg"}
                      alt={manga.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    {/* Title and Author */}
                    <div>
                      <h3 className="font-bold text-sm sm:text-base line-clamp-2 mb-1 text-white group-hover:text-pink-400 transition-colors duration-300">
                        {manga.title}
                      </h3>
                      <p className="text-xs text-white/50 mb-2 font-medium line-clamp-1">
                        {manga.author}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-bold text-white">
                          {manga.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-white/60">
                        <Eye className="w-3 h-3" />
                        <span className="text-xs font-semibold">
                          {(manga.views / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-white/60">
                        <BookOpen className="w-3 h-3" />
                        <span className="text-xs font-semibold">
                          {manga.chapters}
                        </span>
                      </div>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1.5">
                      {manga.genre.slice(0, 3).map((g) => (
                        <Badge
                          key={g}
                          variant="outline"
                          className="text-xs px-2 py-0 h-5 bg-white/5 border-white/20 text-white/70 group-hover:bg-pink-500/10 group-hover:border-pink-500/30 group-hover:text-pink-300 transition-all duration-300 font-medium"
                        >
                          {g}
                        </Badge>
                      ))}
                      {manga.genre.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0 h-5 bg-white/5 border-white/20 text-white/50 font-medium"
                        >
                          +{manga.genre.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-sm">
            <div className="max-w-xs mx-auto">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-pink-500/60" />
              </div>
              <p className="text-white/60 font-medium text-sm">
                No related manga found at the moment
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
