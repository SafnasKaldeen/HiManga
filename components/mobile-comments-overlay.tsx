"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CommentsSection } from "@/components/comments-section";

interface MobileCommentsOverlayProps {
  mangaId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCommentsOverlay({
  mangaId,
  isOpen,
  onClose,
}: MobileCommentsOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when overlay is open
      document.body.style.overflow = "hidden";
      // Trigger animation after mount
      setTimeout(() => setIsVisible(true), 10);
    } else {
      document.body.style.overflow = "unset";
      setIsVisible(false);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3 border-b border-slate-800">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close comments"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Comments content */}
        <div
          className="overflow-y-auto"
          style={{ height: "calc(85vh - 120px)" }}
        >
          <div className="px-4 py-4">
            <CommentsSection mangaId={mangaId} />
          </div>
        </div>
      </div>
    </>
  );
}
