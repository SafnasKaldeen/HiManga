// ========== HEADER COMPONENT ==========
"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, User, LogOut } from "lucide-react";
import NotificationsPanel from "@/components/notifications-panel";
import { useState } from "react";
import Image from "next/image";

export function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Generate avatar URL based on user's avatarId
  const getAvatarUrl = (avatarId: number = 42) => {
    const categories = [
      { name: "Anime", service: "adventurer", count: 200 },
      { name: "Pixel", service: "pixel-art", count: 200 },
      { name: "Bottts", service: "bottts", count: 200 },
      { name: "Avataaars", service: "avataaars", count: 200 },
      { name: "Fun Emoji", service: "fun-emoji", count: 200 },
    ];

    let currentId = avatarId;
    for (const category of categories) {
      if (currentId < category.count) {
        const seed = `${category.service}-${currentId}`;
        return `https://api.dicebear.com/7.x/${category.service}/svg?seed=${seed}`;
      }
      currentId -= category.count;
    }

    // Fallback to default
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=default`;
  };

  const avatarUrl = user?.avatarId
    ? getAvatarUrl(user.avatarId)
    : getAvatarUrl(42);

  return (
    <header className="border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full px-4 md:px-8 lg:px-10 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl group"
          >
            <Image src="/logo.png" alt="HiManga Logo" width={50} height={50} />
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              HiManga
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-white/70 hover:text-pink-500 transition-colors duration-300 font-semibold"
            >
              Home
            </Link>
            <Link
              href="/library"
              className="text-white/70 hover:text-pink-500 transition-colors duration-300 font-semibold"
            >
              Library
            </Link>
            <Link
              href="/trending"
              className="text-white/70 hover:text-pink-500 transition-colors duration-300 font-semibold"
            >
              Trending
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Notifications - Only show when user is logged in */}
            {user && (
              <div className="hidden md:block">
                <NotificationsPanel />
              </div>
            )}

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3 md:gap-4">
                <Link href="/profile" className="group">
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all duration-300">
                    {/* Avatar Image */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-pink-500/40 group-hover:ring-pink-500 transition-all duration-300 flex-shrink-0 group-hover:scale-110">
                      <img
                        src={avatarUrl}
                        alt={user.username}
                        className="w-full h-full object-cover bg-slate-800"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300" />
                    </div>
                    <span className="hidden sm:inline text-white font-semibold group-hover:text-pink-400 transition-colors duration-300">
                      {user.username}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 hover:text-pink-500 text-white transition-colors duration-300 px-4 py-2 rounded-full font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-white/5 hover:text-pink-500 text-white/70 rounded-full font-medium transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 font-semibold px-5"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
