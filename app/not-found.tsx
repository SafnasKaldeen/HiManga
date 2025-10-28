"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, Search, Anchor, Compass, Ship, Skull } from "lucide-react";
import { useState, useEffect } from "react";

export default function NotFound() {
  const [waves, setWaves] = useState([]);
  const [treasureFloat, setTreasureFloat] = useState(false);

  useEffect(() => {
    // Generate wave particles
    const waveArray = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2,
    }));
    setWaves(waveArray);

    // Treasure floating animation
    const floatInterval = setInterval(() => {
      setTreasureFloat((prev) => !prev);
    }, 2000);

    return () => clearInterval(floatInterval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <Header />

      {/* Animated Background Elements - Keep original style but add ocean theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Subtle waves at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30">
          {waves.map((wave) => (
            <div
              key={wave.id}
              className="absolute bottom-0 w-40 h-16 bg-primary/20 rounded-full blur-xl animate-wave"
              style={{
                left: `${wave.left}%`,
                animationDuration: `${wave.duration}s`,
                animationDelay: `${wave.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Seagulls - subtle */}
      <div className="absolute top-32 right-1/4 animate-seagull pointer-events-none opacity-20">
        <div className="text-2xl">🦅</div>
      </div>
      <div
        className="absolute top-40 left-1/4 animate-seagull pointer-events-none opacity-20"
        style={{ animationDelay: "2s" }}
      >
        <div className="text-xl">🦅</div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Content - Using your original card style with One Piece theme */}
          <div className="relative">
            {/* Character Icon */}
            <div className="flex justify-center mb-8">
              <div
                className={`text-8xl transition-all duration-500 ${
                  treasureFloat ? "translate-y-[-10px]" : "translate-y-0"
                }`}
              >
                🏴‍☠️
              </div>
            </div>

            {/* 404 Text - Keep original gradient style */}
            <div className="mb-8">
              <h1 className="text-9xl md:text-[150px] font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-4 text-center animate-slideDown">
                404
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
            </div>

            {/* Message - Original style with pirate theme */}
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-center">
              Lost at Sea!
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto text-center">
              Oops! The page you're looking for has sailed away to the Grand
              Line. Make sure Zoro is not your navigator!
            </p>

            {/* Action Buttons - Original style with pirate labels */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20"
                >
                  <Ship className="w-5 h-5" />
                  Return to Port
                </Button>
              </Link>
              <Link href="/trending">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-white/5 border-white/10 hover:text-cyan-500/60 hover:border-primary/30"
                >
                  <Compass className="w-5 h-5 animate-spin-slow" />
                  Search Treasure
                </Button>
              </Link>
            </div>

            {/* Decorative Card - Original style */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
              <p className="text-muted-foreground mb-4 flex items-center justify-center gap-2">
                <Anchor className="w-4 h-4" />
                Quick Links:
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/library">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    My Library
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-secondary hover:text-secondary hover:bg-secondary/10"
                  >
                    My Profile
                  </Button>
                </Link>
                <Link href="/trending">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-accent hover:text-accent hover:bg-accent/10"
                  >
                    Trending
                  </Button>
                </Link>
              </div>
            </div>

            {/* One Piece Quote */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground/60 italic">
                "I'll become the King of the Pirates!" - Monkey D. Luffy
              </p>
            </div>

            {/* Floating Treasure Chest */}
            <div
              className={`absolute -bottom-8 -right-8 transform transition-all duration-1000 pointer-events-none hidden md:block ${
                treasureFloat
                  ? "translate-y-[-5px] rotate-3"
                  : "translate-y-0 rotate-0"
              }`}
            >
              <div className="text-6xl drop-shadow-xl opacity-60">💰</div>
            </div>

            {/* Compass Decoration */}
            <div className="absolute -top-8 -left-8 transform -rotate-12 hidden md:block pointer-events-none">
              <div className="relative w-16 h-16 bg-primary/20 rounded-full border-2 border-primary/30 shadow-xl flex items-center justify-center backdrop-blur-sm">
                <Compass className="w-8 h-8 text-primary animate-spin-slow" />
              </div>
            </div>

            {/* Skull Logo */}
            <div className="absolute -top-12 right-8 hidden md:block pointer-events-none opacity-40">
              <div className="relative">
                <Skull className="w-12 h-12 text-foreground drop-shadow-lg" />
                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Anchor Decoration */}
      <div className="absolute bottom-8 left-8 opacity-10 pointer-events-none hidden md:block">
        <Anchor className="w-24 h-24 text-foreground" />
      </div>

      <Footer />

      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            transform: translateX(0px) translateY(0px) scale(1);
          }
          50% {
            transform: translateX(20px) translateY(-10px) scale(1.1);
          }
        }
        @keyframes seagull {
          0% {
            transform: translateX(0px) translateY(0px);
          }
          50% {
            transform: translateX(100px) translateY(-20px);
          }
          100% {
            transform: translateX(200px) translateY(0px);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-wave {
          animation: wave linear infinite;
        }
        .animate-seagull {
          animation: seagull 15s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
