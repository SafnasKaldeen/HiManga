"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Manga } from "@/lib/mock-data"
import { Star, BookOpen, Eye, Bell, BellOff } from "lucide-react"
import { FavoriteButton } from "@/components/favorite-button"
import { BookmarkButton } from "@/components/bookmark-button"
import Link from "next/link"
import { useState } from "react"
import { useNotifications } from "@/lib/notifications-context"
import { useAuth } from "@/lib/auth-context"

interface MangaDetailsHeroProps {
  manga: Manga
}

export function MangaDetailsHero({ manga }: MangaDetailsHeroProps) {
  const { subscribeManga, unsubscribeManga, isSubscribed } = useNotifications()
  const { user } = useAuth()
  const [isSubscribedLocal, setIsSubscribedLocal] = useState(isSubscribed(manga.id))

  const handleSubscribe = () => {
    if (isSubscribedLocal) {
      unsubscribeManga(manga.id)
      setIsSubscribedLocal(false)
    } else {
      subscribeManga(manga.id)
      setIsSubscribedLocal(true)
    }
  }

  return (
    <section className="py-12 md:py-16 border-b bg-[#0a0a1a]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cover Image */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-full max-w-xs group">
              <img
                src={manga.cover || "/placeholder.svg"}
                alt={manga.title}
                className="w-full rounded-lg shadow-lg shadow-pink-500/20 object-cover aspect-[3/4] group-hover:shadow-xl group-hover:shadow-pink-500/40 transition-all duration-300 border border-white/10"
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 font-bold border-0">
                  {manga.status === "ongoing" ? "Ongoing" : "Completed"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">{manga.title}</h1>
            <p className="text-lg text-white/60 mb-6 font-semibold">by {manga.author}</p>

            {/* Rating and Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg backdrop-blur-xl hover:bg-white/15 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 group">
                <Star className="w-5 h-5 fill-pink-500 text-pink-500 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm text-white/60 font-semibold">Rating</p>
                  <p className="text-xl font-black text-white">{manga.rating}/5.0</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg backdrop-blur-xl hover:bg-white/15 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 group">
                <BookOpen className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm text-white/60 font-semibold">Chapters</p>
                  <p className="text-xl font-black text-white">{manga.chapters}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg backdrop-blur-xl hover:bg-white/15 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300 group">
                <Eye className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm text-white/60 font-semibold">Views</p>
                  <p className="text-xl font-black text-white">{(manga.views / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="mb-8">
              <p className="text-sm text-white/60 mb-3 font-bold">Genres</p>
              <div className="flex flex-wrap gap-2">
                {manga.genre.map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white/80 hover:border-pink-500/40 hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 transition-all duration-300 font-semibold backdrop-blur-sm"
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <p className="text-sm text-white/60 mb-3 font-bold">Description</p>
              <p className="text-base leading-relaxed text-white/80 font-medium">{manga.description}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href={`/manga/${manga.id}/chapter/1`}>
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300 font-bold rounded-full"
                >
                  <BookOpen className="w-5 h-5" />
                  Start Reading
                </Button>
              </Link>
              <FavoriteButton mangaId={manga.id} size="lg" showText />
              <BookmarkButton mangaId={manga.id} size="lg" showText />
              {user && (
                <Button
                  size="lg"
                  onClick={handleSubscribe}
                  className={`gap-2 font-bold rounded-full transition-all duration-300 ${
                    isSubscribedLocal
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                      : "bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20"
                  }`}
                >
                  {isSubscribedLocal ? (
                    <>
                      <Bell className="w-5 h-5" />
                      Subscribed
                    </>
                  ) : (
                    <>
                      <BellOff className="w-5 h-5" />
                      Subscribe
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
