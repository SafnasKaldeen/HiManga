"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen } from "lucide-react";

interface RelatedMangasProps {
  mangas: Manga[];
}

export function RelatedMangas({ mangas }: RelatedMangasProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-pink-500" />
        <h2 className="text-2xl font-bold text-white">Related Manga</h2>
      </div>

      <div className="space-y-4">
        {mangas.length > 0 ? (
          mangas.map((manga) => (
            <Link key={manga.id} href={`/manga/${manga.id}`}>
              <Card className="overflow-hidden hover:shadow-lg mb-2 hover:shadow-pink-500/30 transition-all duration-300 cursor-pointer h-full bg-gradient-to-b from-white/10 to-white/5 border border-white/10 hover:border-pink-500/40 backdrop-blur-xl group">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-lg shadow-pink-500/10 group-hover:shadow-pink-500/30 transition-shadow">
                    <img
                      src={manga.cover || "/placeholder.svg"}
                      alt={manga.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold line-clamp-2 mb-1 text-white group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {manga.title}
                    </h3>
                    <p className="text-xs text-white/60 mb-2 font-semibold">
                      {manga.author}
                    </p>
                    <div className="flex items-center gap-1 mb-2 px-2 py-1 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 w-fit">
                      <Star className="w-3 h-3 fill-pink-500 text-pink-500" />
                      <span className="text-xs font-bold text-white">
                        {manga.rating}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {manga.genre.slice(0, 2).map((g) => (
                        <Badge
                          key={g}
                          variant="outline"
                          className="text-xs bg-white/10 border-white/20 text-white/70 hover:bg-white/15 hover:border-pink-500/30 transition-colors font-semibold"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-8 text-center bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-xl">
            <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 font-semibold">
              No related manga found
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
