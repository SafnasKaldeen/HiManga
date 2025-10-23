"use client"

import { useState } from "react"
import { X, Maximize2, Minimize2, Scroll, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReaderSettingsProps {
  onClose: () => void
  onViewModeChange: (mode: "scroll" | "page") => void
  onFullscreenToggle: () => void
  currentViewMode: "scroll" | "page"
  isFullscreen: boolean
}

export function ReaderSettings({
  onClose,
  onViewModeChange,
  onFullscreenToggle,
  currentViewMode,
  isFullscreen,
}: ReaderSettingsProps) {
  const [brightness, setBrightness] = useState(100)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 rounded-xl p-6 w-96 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyan-400">Reader Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">View Mode</label>
            <div className="flex gap-2">
              <Button
                variant={currentViewMode === "scroll" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange("scroll")}
                className="flex-1 gap-2"
              >
                <Scroll className="w-4 h-4" />
                Scroll
              </Button>
              <Button
                variant={currentViewMode === "page" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange("page")}
                className="flex-1 gap-2"
              >
                <Grid3x3 className="w-4 h-4" />
                Page
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">Brightness</label>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-400 mt-1">{brightness}%</p>
          </div>

          <Button
            onClick={onFullscreenToggle}
            className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
