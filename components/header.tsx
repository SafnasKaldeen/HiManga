// ========== HEADER COMPONENT ==========
"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, User, LogOut } from "lucide-react";
import { NotificationsPanel } from "@/components/notifications-panel";
import { useState } from "react";

export function Header() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full px-6 md:px-12 lg:px-16 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl group"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-pink-500/50 transition-all">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              AnimeFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-white/70 hover:text-pink-500 transition font-semibold"
            >
              Home
            </Link>
            <Link
              href="/library"
              className="text-white/70 hover:text-pink-500 transition font-semibold"
            >
              Library
            </Link>
            <Link
              href="/trending"
              className="text-white/70 hover:text-pink-500 transition font-semibold"
            >
              Trending
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationsPanel />

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 hover:text-pink-500 text-white"
                  >
                    <User className="w-4 h-4" />
                    {user.username}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2 bg-transparent border-pink-500/40 hover:bg-pink-500/10 text-pink-500 rounded-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:text-pink-500 text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full shadow-lg shadow-pink-500/30"
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
