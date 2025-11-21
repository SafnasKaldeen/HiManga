"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  mangaId: string;
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  variant?: "default" | "outline" | "ghost";
}

export function FavoriteButton({
  mangaId,
  size = "default",
  showText = false,
  variant = "outline",
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(user?.id || null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFavorited(isFavorite(mangaId));
  }, [isFavorite, mangaId]);

  const handleToggle = async () => {
    if (!user) {
      // You can add a toast notification here
      console.log("Please login to add favorites");
      return;
    }

    setIsLoading(true);
    const success = await toggleFavorite(mangaId);
    if (success) {
      setIsFavorited(!isFavorited);
    }
    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      className={`gap-2 bg-transparent text-foreground hover:text-secondary ${
        isFavorited ? "text-secondary" : ""
      }`}
    >
      <Heart className={`w-4 h-4 ${isFavorited ? "fill-secondary" : ""}`} />
      {showText && (isFavorited ? "Favorited" : "Add to Favorites")}
    </Button>
  );
}
