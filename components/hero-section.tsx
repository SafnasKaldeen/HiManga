"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { useState, useEffect } from "react";

interface FeaturedAnime {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  rating: number;
  episodes: string;
  latestRelease: string;
  tags: string[];
  badge?: string;
}

const featuredAnimes: FeaturedAnime[] = [
  {
    id: 1,
    title: "One Piece",
    subtitle: "The Greatest Adventure Awaits",
    description:
      "Gold Roger was known as the 'Pirate King,' the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world. His last words before his death revealed the existence of the greatest treasure...",
    image: "/anime-one-piece-hero.jpg",
    rating: 9.2,
    episodes: "1000+",
    latestRelease: "Apr 7, 2024",
    tags: ["TV", "Adventure", "Action"],
    badge: "#8 Spotlight",
  },
  {
    id: 2,
    title: "Kaiju No. 8",
    subtitle: "Monsters Rise. Heroes Fight Back.",
    description:
      "In a world where colossal monsters threaten humanity, a man discovers he can transform into a powerful kaiju. Now he must fight to protect those he loves while uncovering the truth.",
    image: "/anime-kaiju-no-8-hero.jpg",
    rating: 8.8,
    episodes: "12",
    latestRelease: "Apr 3, 2024",
    tags: ["TV", "Action", "Sci-Fi"],
    badge: "#2 Featured",
  },
  {
    id: 3,
    title: "Attack on Titan",
    subtitle: "Humanity's Last Stand",
    description:
      "Behind massive walls, humanity survives against towering titans. When the walls are breached, a young soldier vows to destroy every titan and uncover the truth about their world.",
    image: "/anime-attack-on-titan-hero.jpg",
    rating: 9.0,
    episodes: "139",
    latestRelease: "Mar 29, 2023",
    tags: ["TV", "Action", "Dark Fantasy"],
    badge: "#5 Spotlight",
  },
  {
    id: 4,
    title: "Demon Slayer",
    subtitle: "Breathe. Fight. Survive.",
    description:
      "A young demon slayer trains to master powerful breathing techniques and defeat demons. His journey to save his sister and protect humanity begins.",
    image: "/anime-demon-slayer-hero.jpg",
    rating: 8.9,
    episodes: "55+",
    latestRelease: "Feb 13, 2024",
    tags: ["TV", "Action", "Supernatural"],
    badge: "#3 Featured",
  },
  {
    id: 5,
    title: "Jujutsu Kaisen",
    subtitle: "Cursed Power Unleashed",
    description:
      "A high schooler swallows a cursed finger and becomes host to a powerful demon. Now he must train as a jujutsu sorcerer to fight curses and save humanity.",
    image: "/anime-jujutsu-kaisen-hero.jpg",
    rating: 8.7,
    episodes: "47+",
    latestRelease: "Mar 26, 2024",
    tags: ["TV", "Action", "Supernatural"],
    badge: "#1 Spotlight",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredAnimes.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredAnimes.length);
    setIsAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredAnimes.length) % featuredAnimes.length
    );
    setIsAutoPlay(false);
  };

  const anime = featuredAnimes[currentSlide];

  return (
    <section className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-[#0a0a1a]">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {featuredAnimes.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background Image with sophisticated overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{
                backgroundImage: `url('${slide.image}')`,
              }}
            />

            {/* Diagonal gradient from bottom-left to top-right */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a1a] via-[#0a0a1a] via-40% to-transparent" />

            {/* Additional bottom gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent" />

            {/* Vignette effect */}
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />
          </div>
        ))}
      </div>

      {/* Content Container */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-6 md:px-12 lg:px-16 z-10 max-w-7xl">
          <div className="max-w-3xl space-y-5 animate-fade-in-up">
            {/* Spotlight Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 backdrop-blur-sm w-fit">
              <span className="text-sm font-bold text-white tracking-wide">
                {anime.badge || `#${currentSlide + 1} Featured`}
              </span>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight">
                {anime.title}
              </h1>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 backdrop-blur-sm sm:hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-white font-medium">{anime.tags[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 backdrop-blur-sm">
                <span className="text-white/90 font-medium">
                  ⏱️ {anime.episodes.replace("+", "eps")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 backdrop-blur-sm">
                <span className="text-white/90 font-medium">
                  📅 {anime.latestRelease}
                </span>
              </div>
              {/* <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 backdrop-blur-sm">
                <span className="text-yellow-400 font-bold">HD</span>
              </div> */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 backdrop-blur-sm">
                <span className="text-green-400 font-bold">
                  ⭐ {anime.rating}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl line-clamp-3">
              {anime.description}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-8 py-6 text-base rounded-full flex items-center gap-2 transition-all hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105">
                <Play className="w-5 h-5 fill-white" />
                Read Now
              </Button>
              <Button
                variant="outline"
                className="border-2 border-white/40 text-white hover:bg-white/10 font-bold px-8 py-6 text-base rounded-full transition-all bg-white/5 backdrop-blur-sm hover:border-white/60"
              >
                <Info className="w-5 h-5 mr-2" />
                Detail
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - styled like reference */}
      <div className="absolute inset-y-0 right-8 flex flex-col items-center justify-center gap-4 z-20">
        <button
          onClick={prevSlide}
          className="p-3 rounded-full bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/40 text-white transition-all hover:shadow-lg hover:shadow-pink-500/30 backdrop-blur-sm hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="p-3 rounded-full bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/40 text-white transition-all hover:shadow-lg hover:shadow-pink-500/30 backdrop-blur-sm hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Indicators - minimalist style */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {featuredAnimes.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all rounded-full ${
              index === currentSlide
                ? "bg-pink-500 w-8 h-1.5 shadow-lg shadow-pink-500/50"
                : "bg-white/30 hover:bg-white/50 w-1.5 h-1.5"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
