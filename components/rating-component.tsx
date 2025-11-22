"use client";

import { Star } from "lucide-react";
import { useState, useEffect } from "react";

interface RatingComponentProps {
  mangaId: string;
  onRatingChange?: (rating: number) => void;
}

export function RatingComponent({
  mangaId,
  onRatingChange,
}: RatingComponentProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRating();
  }, [mangaId]);

  const fetchUserRating = async () => {
    try {
      const response = await fetch(`/api/manga/ratings?mangaId=${mangaId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Error fetching rating:", data.error);
        return;
      }

      setUserRating(data.rating);
    } catch (err) {
      console.error("Error in fetchUserRating:", err);
    }
  };

  const handleRate = async (rating: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/manga/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mangaId,
          rating,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save rating");
        return;
      }

      setUserRating(rating);
      onRatingChange?.(rating);
    } catch (err) {
      console.error("Error in handleRate:", err);
      setError("Failed to save rating");
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hoverRating || userRating || 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isLoading}
              className="transition-transform hover:scale-110 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  star <= displayRating
                    ? "fill-pink-500 text-pink-500"
                    : "text-white/30 hover:text-pink-500/50"
                }`}
              />
            </button>
          ))}
        </div>
        {userRating && (
          <span className="text-sm text-white/70">Rated: {userRating}/5</span>
        )}
      </div>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
