"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  Lock,
  Settings,
  RotateCcw,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { ChaptersSidebar } from "@/components/chapters-sidebar";
import { Header } from "./header";
import { MobileCommentsOverlay } from "./mobile-comments-overlay";

interface MangaReaderProps {
  mangaId: string;
  mangaTitle: string;
  chapter: number;
  mangaSlug?: string;
  totalPanels?: number;
  previousChapter: number | null;
  nextChapter: number | null;
  totalChapters?: number;
}

export function MangaReader({
  mangaId,
  mangaTitle,
  mangaSlug,
  chapter,
  totalPanels: providedTotalPanels,
  previousChapter,
  nextChapter,
  totalChapters = 1200,
}: MangaReaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [displayedPanels, setDisplayedPanels] = useState<number[]>([]);
  const [detectedTotalPanels, setDetectedTotalPanels] = useState<number | null>(
    providedTotalPanels || null
  );
  const [isDetecting, setIsDetecting] = useState(!providedTotalPanels);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [panelWidth, setPanelWidth] = useState(80);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number>(0);

  const isLockedChapter = chapter > totalChapters;

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide controls for mobile
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEnd = e.changedTouches[0].clientY;
      const diff = touchStartRef.current - touchEnd;

      // Show controls on tap (small movement) or swipe up/down
      if (Math.abs(diff) < 10 || Math.abs(diff) > 30) {
        setShowControls(true);

        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }

        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  // UPDATED: Simple API route URL instead of direct Cloudinary
  const getOptimizedPanelUrl = (panelNumber: number) => {
    const paddedChapter = String(chapter).padStart(3, "0");
    const paddedPanel = String(panelNumber).padStart(3, "0");

    // Use API route instead of direct Cloudinary URL
    return `/api/manga/image?manga=${mangaSlug}&chapter=${paddedChapter}&panel=${paddedPanel}`;
  };

  // Dynamic panel detection
  const detectTotalPanels = useCallback(async () => {
    if (isLockedChapter) return;

    setIsDetecting(true);
    setDetectionError(null);

    try {
      let left = 1;
      let right = 200;
      let lastValidPanel = 0;

      const checkPanelExists = async (panelNum: number): Promise<boolean> => {
        return new Promise((resolve) => {
          const img = new Image();
          const url = getOptimizedPanelUrl(panelNum);

          const timeout = setTimeout(() => {
            img.src = "";
            resolve(false);
          }, 5000);

          img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };

          img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };

          img.src = url;
        });
      };

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const exists = await checkPanelExists(mid);

        if (exists) {
          lastValidPanel = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      if (lastValidPanel === 0) {
        let panelNum = 1;
        let consecutiveFails = 0;

        while (consecutiveFails < 3 && panelNum <= 50) {
          const exists = await checkPanelExists(panelNum);
          if (exists) {
            lastValidPanel = panelNum;
            consecutiveFails = 0;
          } else {
            consecutiveFails++;
          }
          panelNum++;
        }
      }

      if (lastValidPanel > 0) {
        setDetectedTotalPanels(lastValidPanel);
        const initialPanels = Array.from(
          { length: Math.min(10, lastValidPanel) },
          (_, i) => i + 1
        );
        setDisplayedPanels(initialPanels);
      } else {
        setDetectionError("No panels found. Please check the chapter.");
      }
    } catch (error) {
      console.error("Panel detection error:", error);
      setDetectionError("Failed to detect panels. Using fallback.");
      setDetectedTotalPanels(23);
      setDisplayedPanels([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    } finally {
      setIsDetecting(false);
    }
  }, [chapter, mangaSlug, isLockedChapter]);

  useEffect(() => {
    if (!providedTotalPanels && !isLockedChapter) {
      detectTotalPanels();
    } else if (providedTotalPanels) {
      const initialPanels = Array.from(
        { length: Math.min(15, providedTotalPanels) },
        (_, i) => i + 1
      );
      setDisplayedPanels(initialPanels);
    }
  }, [detectTotalPanels, providedTotalPanels, isLockedChapter]);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setSidebarOpen(isDesktop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPanelsToUse = detectedTotalPanels || providedTotalPanels || 0;

  const loadMorePanels = useCallback(() => {
    if (
      isLoading ||
      displayedPanels.length >= totalPanelsToUse ||
      isLockedChapter
    )
      return;

    setIsLoading(true);
    setTimeout(() => {
      const currentLength = displayedPanels.length;
      const nextPanels = [];
      const batchSize = 5;

      for (
        let i = 1;
        i <= batchSize && currentLength + i <= totalPanelsToUse;
        i++
      ) {
        nextPanels.push(currentLength + i);
      }

      if (nextPanels.length > 0) {
        setDisplayedPanels((prev) => [...prev, ...nextPanels]);
      }
      setIsLoading(false);
    }, 200);
  }, [displayedPanels.length, totalPanelsToUse, isLoading, isLockedChapter]);

  useEffect(() => {
    if (isLockedChapter || isDetecting) return;

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
        displayedPanels.length < totalPanelsToUse
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
    totalPanelsToUse,
    isLockedChapter,
    isDetecting,
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

  const resetAdvancedControls = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setPanelWidth(80);
    setScrollSpeed(50);
  };

  const hasChangedSettings =
    brightness !== 100 ||
    contrast !== 100 ||
    saturation !== 100 ||
    panelWidth !== 80 ||
    scrollSpeed !== 50;

  // Mobile overlay controls component
  const MobileOverlayControls = () => (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ${
        showControls ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Main Controls Bar */}
      <div className="bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-xl border-t border-cyan-500/20 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Chapter Navigation */}
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousChapter}
              disabled={previousChapter === null}
              className="flex-1 bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 min-w-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Card className="px-3 py-2 text-center bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-cyan-500/20 text-slate-200 min-w-[80px]">
              <p className="text-xs font-medium">Ch {chapter}</p>
            </Card>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextChapter}
              disabled={nextChapter === null || nextChapter > totalChapters}
              className="flex-1 bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 min-w-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreenToggle}
              className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCommentsOpen(true)}
            className="flex-1 bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Comments
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedControls(true)}
            className="flex-1 bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 hover:text-cyan-400"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Safe area spacer for mobile browsers */}
      <div className="h-safe-area-bottom bg-slate-900/95" />
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {/* Header - Hidden in fullscreen mode */}
      {!isFullscreen && <Header />}

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
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
          </>
        )}

        {/* Main Content */}
        <div
          className="flex-1 flex flex-col bg-gradient-to-b from-slate-900/50 to-slate-950 overflow-hidden relative"
          style={{
            filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
          }}
        >
          {/* Desktop Controls */}
          {!isFullscreen && showControls && (
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-xl border-t border-cyan-500/20 p-4 flex-shrink-0 transition-all duration-300 relative z-40">
              <div className="flex items-center justify-between gap-2 flex-wrap">
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

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFullscreenToggle}
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>

                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowAdvancedControls(!showAdvancedControls)
                      }
                      className="bg-slate-800/50 border-cyan-500/30 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 disabled:opacity-50 hover:text-cyan-400 px-2"
                    >
                      <Settings
                        className={`w-4 h-4 transition-transform duration-300 ${
                          showAdvancedControls ? "rotate-90" : ""
                        }`}
                      />
                    </Button>
                    {hasChangedSettings && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Overlay Controls */}
          <MobileOverlayControls />

          {/* Advanced Controls Overlay */}
          {showAdvancedControls && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] animate-in fade-in duration-300"
                onClick={() => setShowAdvancedControls(false)}
              />

              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[90vw] max-w-4xl animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-lg p-4 md:p-6 border border-pink-500/30 shadow-2xl shadow-pink-500/20 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text flex items-center gap-2">
                      <Settings className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                      Advanced Controls
                    </h3>
                    <div className="flex items-center gap-2">
                      {hasChangedSettings && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetAdvancedControls}
                          className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                        >
                          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Reset
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvancedControls(false)}
                        className="h-7 md:h-8 px-2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🌞 Brightness
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {brightness}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🎨 Contrast
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {contrast}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          💧 Saturation
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {saturation}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          🔍 Panel Width
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {panelWidth}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={panelWidth}
                        onChange={(e) => setPanelWidth(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs md:text-sm font-medium text-slate-300">
                          ⚡ Scroll Speed
                        </label>
                        <span className="text-xs md:text-sm text-pink-400 font-mono">
                          {scrollSpeed}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="100"
                        value={scrollSpeed}
                        onChange={(e) => setScrollSpeed(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Comments Overlay */}
          <MobileCommentsOverlay
            mangaId={mangaId}
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
          />

          {/* Manga Panels Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col items-center gap-4 p-4 scroll-smooth pb-safe-area"
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

            {/* Detection Loading State */}
            {isDetecting && (
              <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
                  <div className="absolute inset-0 blur-xl bg-cyan-500/20 rounded-full"></div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-200">
                    Fetching Panels...
                  </h2>
                  <p className="text-sm text-slate-500">
                    This may take a few seconds
                  </p>
                </div>
              </div>
            )}

            {/* Detection Error */}
            {detectionError && !isDetecting && (
              <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-bold text-slate-200">
                    Detection Issue
                  </h2>
                  <p className="text-slate-400">{detectionError}</p>
                  <Button
                    onClick={detectTotalPanels}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Retry Detection
                  </Button>
                </div>
              </div>
            )}

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
              !isDetecting &&
              displayedPanels.length > 0 && (
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
                        Panel {panelNumber} / {totalPanelsToUse}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                    </div>
                  )}

                  {displayedPanels.length >= totalPanelsToUse && (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-slate-400 text-sm">End of chapter</p>
                      {nextChapter && nextChapter <= totalChapters && (
                        <Button
                          onClick={handleNextChapter}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white hover:text-cyan-400 mb-10"
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
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
