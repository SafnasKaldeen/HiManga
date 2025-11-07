// ========== 5. AVATAR IMAGE MODAL COMPONENT: /components/avatar-modal.tsx ==========
"use client";

import { X } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar-utils";
import Image from "next/image";

interface AvatarModalProps {
  avatarId: number;
  username: string;
  onClose: () => void;
}

export function AvatarModal({ avatarId, username, onClose }: AvatarModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full animate-zoomIn">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Avatar Image */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-4 border-pink-500/50 shadow-2xl shadow-pink-500/30">
            <Image
              src={getAvatarUrl(avatarId)}
              alt={username}
              fill
              className="object-cover bg-slate-800"
            />
          </div>

          {/* Username */}
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-white">{username}</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-zoomIn {
          animation: zoomIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
