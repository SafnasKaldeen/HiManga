"use client"

import { Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useRatings } from "@/lib/user-ratings"

interface RatingComponentProps {
  mangaId: string
  onRatingChange?: (rating: number) => void
}

export function RatingComponent({ mangaId, onRatingChange }: RatingComponentProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const { getRating, addRating } = useRatings()
  const [userRating, setUserRating] = useState<number | null>(null)

  useEffect(() => {
    const rating = getRating(mangaId)
    setUserRating(rating)
  }, [mangaId, getRating])

  const handleRate = (rating: number) => {
    addRating(mangaId, rating)
    setUserRating(rating)
    onRatingChange?.(rating)
  }

  const displayRating = hoverRating || userRating || 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= displayRating ? "fill-pink-500 text-pink-500" : "text-white/30 hover:text-pink-500/50"
              }`}
            />
          </button>
        ))}
      </div>
      {userRating && <span className="text-sm text-white/70">You rated: {userRating}/5</span>}
    </div>
  )
}
