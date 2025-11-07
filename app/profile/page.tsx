// app/profile/page.tsx
"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import {
  LogOut,
  Mail,
  Calendar,
  Camera,
  Award,
  Flame,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/avatar-utils";
import { useAvatar } from "@/hooks/useAvatar";
import { AvatarSelector } from "@/components/avatar-selector";
import Cookies from "js-cookie";

interface UserStats {
  level: number;
  xp: number;
  totalChaptersRead: number;
  currentStreak: number;
  achievements: string[];
}

// Helper to get avatar from cookie
function getInitialAvatarId(userAvatarId?: number): number {
  // First, try user's saved avatar from auth
  if (userAvatarId) return userAvatarId;

  // Then try cookie
  if (typeof window !== "undefined") {
    const cookieAvatar = Cookies.get("user_avatar_id");
    if (cookieAvatar) {
      const parsed = parseInt(cookieAvatar, 10);
      if (!isNaN(parsed)) return parsed;
    }
  }

  // Default fallback
  return 0;
}

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Initialize avatar with user's saved value or cookie
  const initialAvatarId = user ? getInitialAvatarId(user.avatarId) : 42;

  // Use the updated hook with server avatar support
  const { avatarId: savedAvatarId, updateAvatar } = useAvatar({
    serverAvatarId: user?.avatarId,
    fallbackAvatarId: initialAvatarId,
  });

  // Local state for temporary avatar preview (not saved yet)
  const [tempAvatarId, setTempAvatarId] = useState<number>(savedAvatarId);

  // Mock user stats
  const [userStats] = useState<UserStats>({
    level: 12,
    xp: 750,
    totalChaptersRead: 342,
    currentStreak: 15,
    achievements: ["First Read", "Speed Reader", "Collector"],
  });

  // Update temp avatar when saved avatar changes
  useEffect(() => {
    setTempAvatarId(savedAvatarId);
  }, [savedAvatarId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (user) {
      setUsername(user.username);
    }
  }, [user, authLoading, router]);

  const xpProgress = (userStats.xp / 1000) * 100;

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const avatarChanged = tempAvatarId !== savedAvatarId;
      const usernameChanged = username !== user.username;

      // Prepare update data
      const updateData: { username?: string; avatarId?: number } = {};
      if (usernameChanged) updateData.username = username;
      if (avatarChanged) updateData.avatarId = tempAvatarId;

      // Save to backend
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Update avatar in cookie if changed
      if (avatarChanged) {
        const avatarSuccess = await updateAvatar(tempAvatarId);
        if (!avatarSuccess) {
          throw new Error("Failed to update avatar");
        }
      }

      console.log("Profile saved successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      // Revert temp avatar on error
      setTempAvatarId(savedAvatarId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = (newAvatarId: number) => {
    setTempAvatarId(newAvatarId);
    setShowAvatarSelector(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasUnsavedChanges =
    tempAvatarId !== savedAvatarId || username !== user.username;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black mb-8 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            My Profile
          </h1>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Profile Card */}
            <Card className="md:col-span-2 p-6 md:p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-pink-500/20">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-pink-500/50 bg-slate-800">
                    <Image
                      src={getAvatarUrl(tempAvatarId)}
                      alt={user.username}
                      className="w-full h-full object-cover"
                      width={96}
                      height={96}
                      priority
                      key={tempAvatarId} // Force re-render on avatar change
                    />
                  </div>
                  <button
                    onClick={() => setShowAvatarSelector(true)}
                    className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 p-2.5 rounded-full border-2 border-slate-900 hover:scale-110 transition-transform shadow-lg"
                    aria-label="Change avatar"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  {tempAvatarId !== savedAvatarId && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-xs text-black font-bold px-2 py-1 rounded-full animate-pulse">
                      Unsaved
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white">
                    {user.username}
                  </h2>
                  <p className="text-white/60">{user.email}</p>
                  <div className="mt-2 inline-block px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full">
                    <span className="text-sm font-semibold text-pink-400">
                      Level {userStats.level}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-t border-white/10 pt-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium mb-2 text-white/80"
                  >
                    Username
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-pink-500/50 text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2 flex items-center gap-2 text-white/80"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-white/5 border-white/10 text-white/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="memberSince"
                    className="block text-sm font-medium mb-2 flex items-center gap-2 text-white/80"
                  >
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <Input
                    id="memberSince"
                    value={new Date(user.createdAt).toLocaleDateString()}
                    disabled
                    className="bg-white/5 border-white/10 text-white/60"
                  />
                </div>

                {hasUnsavedChanges && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-400 font-medium">
                      ⚠️ You have unsaved changes. Click "Save Changes" to apply
                      them.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving || !hasUnsavedChanges}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2 bg-transparent border-pink-500/40 hover:bg-pink-500/10 text-pink-500"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </Card>

            {/* Stats Card */}
            <Card className="p-6 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-pink-500/20 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">
                  Your Progress
                </h3>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Experience</span>
                    <span className="text-pink-400 font-semibold">
                      {userStats.xp} / 1000 XP
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-pink-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${xpProgress}%` }}
                      role="progressbar"
                      aria-valuenow={userStats.xp}
                      aria-valuemin={0}
                      aria-valuemax={1000}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-pink-400" />
                      <span className="text-sm text-white/80">
                        Chapters Read
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {userStats.totalChaptersRead}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-sm text-white/80">Day Streak</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {userStats.currentStreak}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-white/80">
                        Achievements
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {userStats.achievements.length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
            <h3 className="font-semibold mb-2 text-white">
              Account Information
            </h3>
            <p className="text-sm text-white/60">
              Your account is secure and all your bookmarks and favorites are
              saved locally on your device.
            </p>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatarId={tempAvatarId}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
}
