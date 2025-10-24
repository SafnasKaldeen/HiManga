"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { ChaptersSidebar } from "@/components/chapters-sidebar";
import { Header } from "./header";

interface MangaReaderProps {
  mangaId: string;
  mangaTitle: string;
  chapter: number;
  mangaSlug?: string;
  totalPanels: number;
  previousChapter: number | null;
  nextChapter: number | null;
  totalChapters?: number;
}

export function MangaReader({
  mangaId,
  mangaTitle,
  mangaSlug,
  chapter,
  totalPanels,
  previousChapter,
  nextChapter,
  totalChapters = 1200,
}: MangaReaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [displayedPanels, setDisplayedPanels] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23,
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [panelWidth, setPanelWidth] = useState(80);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLockedChapter = chapter > totalChapters;

  // ===== CONFIGURATION: Customize your watermarks here =====
  const WATERMARK_CONFIG = {
    // Logo watermark (upload your logo to Cloudinary first)
    logo: {
      enabled: true, // Set to true to enable logo
      path: "https://res.cloudinary.com/dk9ywbxu1/image/upload/v1761317156/logo_eyzwjk.png", // Cloudinary path: folder/filename WITH extension
      width: 140, // Logo width in pixels
      opacity: 70, // 0-100
      position: "south_east", // Position: south_east, north_east, south_west, north_west, center
      offsetX: 20, // Pixels from edge
      offsetY: 20, // Pixels from edge
    },
    // Text watermark
    text: {
      enabled: true, // Set to true to enable text
      content: "██HiManga.com██", // Text to display
      font: "Courier", // Font family: Arial, Times, Courier, etc.
      size: 40, // Font size
      weight: "bold", // normal, bold
      color: "FFFFFF", // Hex color (without #) purple
      opacity: 70, // 0-100
      position: "south_east", // Position
      offsetX: 0, // Pixels from edge
      offsetY: 0, // Pixels from edge (below logo if both enabled)
      background: {
        enabled: true, // Enable background
        color: "0f172a", // Background color (black - change to any hex)
        opacity: 40, // Background opacity 0-100
        padding: 3, // Padding around text in pixels
      },
    },
  };

  // Cloudinary optimization helper with watermark covering + logo + text overlays
  const getOptimizedPanelUrl = (panelNumber: number) => {
    const paddedChapter = String(chapter).padStart(3, "0");
    const paddedPanel = String(panelNumber).padStart(3, "0");
    const baseUrl = "https://res.cloudinary.com/dk9ywbxu1/image/upload";
    const imagePath = `manga/${mangaSlug}/chapter-${paddedChapter}/panel-${paddedPanel}.jpg`;

    // Base transformations (all FREE features):
    const baseTransformations = [
      "f_auto", // Auto format (WebP for modern browsers, JPEG for older)
      "q_auto:good", // Auto quality optimization (good quality preset)
      "w_1200", // Max width 1200px (adjust based on your needs)
      "c_limit", // Limit dimensions without cropping
      "dpr_auto", // Device Pixel Ratio for retina displays
      "fl_progressive", // Progressive loading (blurred preview loads first)
      "fl_lossy", // Lossy compression for smaller file sizes
    ];

    const overlays = [];

    // STEP 1: Cover the existing watermark with a solid rectangle (this goes FIRST)
    // if (WATERMARK_CONFIG.coverOriginal.enabled) {
    //   overlays.push(
    //     "l_video:transparent.png", // Use transparent layer as base
    //     "e_colorize:100", // Make it fully colored
    //     `co_rgb:${WATERMARK_CONFIG.coverOriginal.color}`, // Color of rectangle
    //     `w_${WATERMARK_CONFIG.coverOriginal.width}`, // Width
    //     `h_${WATERMARK_CONFIG.coverOriginal.height}`, // Height
    //     `g_${WATERMARK_CONFIG.coverOriginal.position}`, // Gravity/position
    //     `x_${WATERMARK_CONFIG.coverOriginal.offsetX}`, // X offset
    //     `y_${WATERMARK_CONFIG.coverOriginal.offsetY}`, // Y offset
    //     "fl_layer_apply" // Apply layer
    //   );
    // }

    // STEP 2: Add your logo overlay (goes on top of the cover rectangle)
    if (WATERMARK_CONFIG.logo.enabled) {
      overlays.push(
        `l_${WATERMARK_CONFIG.logo.path.replace(/\//g, ":")}`, // Layer: logo path
        `w_${WATERMARK_CONFIG.logo.width}`, // Width
        `g_${WATERMARK_CONFIG.logo.position}`, // Gravity/position
        `x_${WATERMARK_CONFIG.logo.offsetX}`, // X offset
        `y_${WATERMARK_CONFIG.logo.offsetY}`, // Y offset
        `o_${WATERMARK_CONFIG.logo.opacity}`, // Opacity
        "fl_layer_apply" // Apply layer
      );
    }

    // STEP 3: Add your text overlay (goes on top of everything)
    if (WATERMARK_CONFIG.text.enabled) {
      const textContent = encodeURIComponent(WATERMARK_CONFIG.text.content);
      const fontStyle = `${WATERMARK_CONFIG.text.font}_${WATERMARK_CONFIG.text.size}_${WATERMARK_CONFIG.text.weight}`;

      // Add text background if enabled
      if (WATERMARK_CONFIG.text.background.enabled) {
        overlays.push(
          `l_text:${fontStyle}:${textContent}`, // Layer: text
          `co_rgb:${WATERMARK_CONFIG.text.color}`, // Text color
          `b_rgb:${WATERMARK_CONFIG.text.background.color}`, // Background color
          `bo_${WATERMARK_CONFIG.text.background.padding}px_solid_rgb:${WATERMARK_CONFIG.text.background.color}`, // Border/padding
          `g_${WATERMARK_CONFIG.text.position}`, // Gravity/position
          `x_${WATERMARK_CONFIG.text.offsetX}`, // X offset
          `y_${WATERMARK_CONFIG.text.offsetY}`, // Y offset
          `o_${WATERMARK_CONFIG.text.opacity}`, // Opacity
          "fl_layer_apply" // Apply layer
        );
      } else {
        // Text without background
        overlays.push(
          `l_text:${fontStyle}:${textContent}`, // Layer: text
          `co_rgb:${WATERMARK_CONFIG.text.color}`, // Color
          `g_${WATERMARK_CONFIG.text.position}`, // Gravity/position
          `x_${WATERMARK_CONFIG.text.offsetX}`, // X offset
          `y_${WATERMARK_CONFIG.text.offsetY}`, // Y offset
          `o_${WATERMARK_CONFIG.text.opacity}`, // Opacity
          "fl_layer_apply" // Apply layer
        );
      }
    }

    // Combine all transformations
    const allTransformations = [...baseTransformations, ...overlays].join(",");

    return `${baseUrl}/${allTransformations}/${imagePath}`;
  };

  // Thumbnail for lazy loading (very small, blurred preview)
  const getThumbnailUrl = (panelNumber: number) => {
    const paddedChapter = String(chapter).padStart(3, "0");
    const paddedPanel = String(panelNumber).padStart(3, "0");
    const baseUrl = "https://res.cloudinary.com/dk9ywbxu1/image/upload";
    const imagePath = `manga/${mangaSlug}/chapter-${paddedChapter}/panel-${paddedPanel}.jpg`;

    // Very small blurred preview (no watermarks on thumbnails)
    const transformations = "f_auto,q_auto:low,w_50,e_blur:1000";

    return `${baseUrl}/${transformations}/${imagePath}`;
  };

  // Set sidebar open by default on desktop only
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadMorePanels = useCallback(() => {
    if (isLoading || displayedPanels.length >= totalPanels || isLockedChapter)
      return;

    setIsLoading(true);
    setTimeout(() => {
      const currentLength = displayedPanels.length;
      const nextPanels = [];
      const batchSize = 5;

      for (let i = 1; i <= batchSize && currentLength + i <= totalPanels; i++) {
        nextPanels.push(currentLength + i);
      }

      if (nextPanels.length > 0) {
        setDisplayedPanels((prev) => [...prev, ...nextPanels]);
      }
      setIsLoading(false);
    }, 200);
  }, [displayedPanels.length, totalPanels, isLoading, isLockedChapter]);

  useEffect(() => {
    if (isLockedChapter) return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollThreshold = 1500;
      const scrolledToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        scrollThreshold;

      if (
        scrolledToBottom &&
        !isLoading &&
        displayedPanels.length < totalPanels
      ) {
        loadMorePanels();
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();
    }
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [
    loadMorePanels,
    isLoading,
    displayedPanels.length,
    totalPanels,
    isLockedChapter,
  ]);

  const smoothScroll = (direction: "up" | "down") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = (scrollSpeed / 50) * 800;
    const targetScroll =
      direction === "down"
        ? container.scrollTop + scrollAmount
        : container.scrollTop - scrollAmount;

    container.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        smoothScroll("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        smoothScroll("up");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [scrollSpeed]);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    document.addEventListener("mousemove", handleMouseMove);

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
    }
  }, [isFullscreen]);

  const handlePreviousChapter = () => {
    if (previousChapter !== null && previousChapter !== undefined) {
      window.location.href = `/manga/${mangaId}/chapter/${previousChapter}`;
    }
  };

  const handleNextChapter = () => {
    if (nextChapter !== null && nextChapter !== undefined) {
      if (nextChapter > totalChapters) {
        return;
      }
      window.location.href = `/manga/${mangaId}/chapter/${nextChapter}`;
    }
  };

  const increasePanelSize = () => {
    setPanelWidth((prev) => Math.min(prev + 10, 150));
  };

  const decreasePanelSize = () => {
    setPanelWidth((prev) => Math.max(prev - 10, 50));
  };

  return (
    <div
      className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      <div className="flex flex-1 relative overflow-hidden scroll-bar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
        {sidebarOpen && !isFullscreen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {sidebarOpen && !isFullscreen && (
          <aside className="fixed lg:relative left-0 top-0 bottom-0 w-72 border-r border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-xl z-50 lg:z-30 flex-shrink-0 overflow-auto transition-transform duration-300">
            <div className="space-y-2">
              <div className="lg:hidden flex justify-end p-4 border-b border-cyan-500/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-slate-400 text-sm">
                <ChaptersSidebar
                  mangaId={mangaId}
                  currentChapter={chapter}
                  chapters={totalChapters}
                />
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900/50 to-slate-950 overflow-hidden">
          {!showControls && !isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(true)}
              className="absolute top-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 hover:text-cyan-400"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
          <div className="lg:hidden">
            <Header />
          </div>
          {showControls && !isFullscreen && (
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-xl border-t border-cyan-500/20 p-4 flex-shrink-0 transition-all duration-300">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousChapter}
                    disabled={previousChapter === null}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Card className="px-3 py-2 text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-cyan-500/20 text-slate-200">
                    <p className="text-xs font-medium">Ch {chapter}</p>
                  </Card>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextChapter}
                    disabled={
                      nextChapter === null ||
                      (nextChapter !== null && nextChapter > totalChapters)
                    }
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <nav className="hidden lg:flex items-center gap-8">
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

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreasePanelSize}
                    className="h-8 px-2 text-slate-200 hover:bg-slate-800/50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={increasePanelSize}
                    className="h-8 px-2 text-slate-200 hover:bg-slate-800/50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFullscreenToggle}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 ml-1"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControls(false)}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isFullscreen && (
            <div
              className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${
                showControls
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-full opacity-0"
              }`}
            >
              <div className="bg-gradient-to-r from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousChapter}
                      disabled={previousChapter === null}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Card className="px-3 py-2 text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-cyan-500/20 text-slate-200">
                      <p className="text-xs font-medium">Ch {chapter}</p>
                    </Card>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextChapter}
                      disabled={
                        nextChapter === null ||
                        (nextChapter !== null && nextChapter > totalChapters)
                      }
                      className="bg-slate-800/50 border-cyan-500/30 text-cyan-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <nav className="hidden lg:flex items-center gap-8">
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

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={decreasePanelSize}
                      className="h-8 px-2 text-slate-200 hover:bg-slate-800/50"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={increasePanelSize}
                      className="h-8 px-2 text-slate-200 hover:bg-slate-800/50"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFullscreenToggle}
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 ml-1"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col items-center gap-4 p-4 scroll-smooth"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(6, 182, 212, 0.3) transparent",
              scrollBehavior: "smooth",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              div::-webkit-scrollbar-thumb {
                background: rgba(6, 182, 212, 0.3);
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: rgba(6, 182, 212, 0.5);
              }
            `}</style>

            {isLockedChapter ? (
              <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                  <Lock className="w-24 h-24 text-cyan-500/50" />
                  <div className="absolute inset-0 blur-xl bg-cyan-500/20 rounded-full"></div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-200">
                    Chapter {chapter} Not Released Yet
                  </h2>
                  <p className="text-slate-400">
                    This chapter hasn't been released yet. Check back later!
                  </p>
                  <p className="text-sm text-slate-500">
                    Latest available chapter: {totalChapters}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    (window.location.href = `/manga/${mangaId}/chapter/${totalChapters}`)
                  }
                  className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Go to Latest Chapter
                </Button>
              </div>
            ) : (
              <div
                className="w-full space-y-0 transition-all duration-300"
                style={{ maxWidth: `${(panelWidth / 100) * 64}rem` }}
              >
                {displayedPanels.map((panelNumber) => (
                  <div
                    key={panelNumber}
                    className="relative group overflow-hidden shadow-2xl border border-cyan-500/20 hover:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                  >
                    <img
                      src={getOptimizedPanelUrl(panelNumber)}
                      alt={`Panel ${panelNumber}`}
                      className="w-full h-auto"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      Panel {panelNumber} / {totalPanels}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  </div>
                )}

                {displayedPanels.length >= totalPanels && (
                  <div className="text-center py-8 space-y-4">
                    <p className="text-slate-400 text-sm">End of chapter</p>
                    {nextChapter && nextChapter <= totalChapters && (
                      <Button
                        onClick={handleNextChapter}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white hover:text-cyan-400"
                      >
                        Continue to Chapter {nextChapter}
                      </Button>
                    )}
                    {nextChapter && nextChapter > totalChapters && (
                      <div className="space-y-2">
                        <Button
                          disabled
                          className="bg-slate-700 text-slate-400 cursor-not-allowed"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Chapter {nextChapter} - Not Released Yet
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
