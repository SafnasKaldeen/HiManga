"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/use-favorites"
import { useState, useEffect } from "react"

interface FavoriteButtonProps {
  mangaId: string
  size?: "sm" | "default" | "lg"
  showText?: boolean
}

export function FavoriteButton({ mangaId, size = "default", showText = false }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites()
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      setIsFav(isFavorite(mangaId))
    }
  }, [isLoaded, mangaId, isFavorite])

  const handleToggle = () => {
    toggleFavorite(mangaId)
    setIsFav(!isFav)
  }

  if (!isLoaded) {
    return null
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      className={`gap-2 bg-transparent ${isFav ? "text-secondary" : ""}`}
    >
      <Heart className={`w-4 h-4 ${isFav ? "fill-secondary" : ""}`} />
      {showText && (isFav ? "Favorited" : "Add to Favorites")}
    </Button>
  )
}
