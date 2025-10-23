"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* 404 Text */}
            <div className="mb-8">
              <h1 className="text-9xl md:text-[150px] font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-4">
                404
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
            </div>

            {/* Message */}
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Page Not Found</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Oops! The manga you're looking for seems to have disappeared into another dimension. Let's get you back on
              track.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20"
                >
                  <Home className="w-5 h-5" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/trending">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30"
                >
                  <Search className="w-5 h-5" />
                  Browse Trending
                </Button>
              </Link>
            </div>

            {/* Decorative Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
              <p className="text-muted-foreground mb-4">Quick Links:</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/library">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
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
                  <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10">
                    Trending
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
