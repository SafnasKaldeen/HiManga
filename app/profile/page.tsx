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
  TrendingUp,
  Star,
  Target,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/avatar-utils";
import { useAvatar } from "@/hooks/useAvatar";
import { useUserStats } from "@/hooks/use-user-stats";
import { AvatarSelector } from "@/components/avatar-selector";
import Cookies from "js-cookie";

// Helper to get avatar from cookie
function getInitialAvatarId(userAvatarId?: number): number {
  if (userAvatarId) return userAvatarId;

  if (typeof window !== "undefined") {
    const cookieAvatar = Cookies.get("user_avatar_id");
    if (cookieAvatar) {
      const parsed = parseInt(cookieAvatar, 10);
      if (!isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Use the stats hook
  const {
    stats: userStats,
    isLoading: isLoadingStats,
    getProgressPercentage,
    refresh: refreshStats,
  } = useUserStats(user?.id || null);

  const initialAvatarId = user ? getInitialAvatarId(user.avatarId) : 0;

  const { avatarId: savedAvatarId, updateAvatar } = useAvatar({
    serverAvatarId: user?.avatarId,
    fallbackAvatarId: initialAvatarId,
  });

  const [tempAvatarId, setTempAvatarId] = useState<number>(savedAvatarId);

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
      setDisplayName(user.displayName || "");
    }
  }, [user, authLoading, router]);

  const xpProgress = getProgressPercentage();

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const avatarChanged = tempAvatarId !== savedAvatarId;
      const usernameChanged = username !== user.username;
      const displayNameChanged = displayName !== (user.displayName || "");

      if (!avatarChanged && !usernameChanged && !displayNameChanged) {
        setIsSaving(false);
        return;
      }

      // Prepare update data
      const updateData: {
        username?: string;
        displayName?: string;
        avatarId?: number;
      } = {};
      if (usernameChanged) updateData.username = username;
      if (displayNameChanged) updateData.displayName = displayName;
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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setTempAvatarId(savedAvatarId);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = (newAvatarId: number) => {
    setTempAvatarId(newAvatarId);
    setShowAvatarSelector(false);
  };

  if (authLoading || isLoadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f]">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60">Loading profile...</p>
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
    tempAvatarId !== savedAvatarId ||
    username !== user.username ||
    displayName !== (user.displayName || "");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              My Profile
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              className="gap-2 bg-transparent border-pink-500/40 hover:bg-pink-500/10 text-pink-500"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Stats
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Profile Card */}
            <Card className="md:col-span-2 p-6 md:p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-pink-500/20">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-pink-500/50 bg-slate-800 shadow-lg shadow-pink-500/20">
                    <Image
                      src={getAvatarUrl(tempAvatarId)}
                      alt={user.username}
                      className="w-full h-full object-cover"
                      width={96}
                      height={96}
                      priority
                      key={tempAvatarId}
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
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {displayName || user.username}
                  </h2>
                  {displayName && (
                    <p className="text-white/60 text-sm mb-1">
                      @{user.username}
                    </p>
                  )}
                  <p className="text-white/40 text-sm">{user.email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full">
                      <Star className="w-3.5 h-3.5 text-pink-400" />
                      <span className="text-sm font-semibold text-pink-400">
                        Level {userStats?.level || 1}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full">
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-400">
                        {userStats?.rank || "Beginner Reader"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-t border-white/10 pt-6">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium mb-2 text-white/80"
                  >
                    Display Name
                  </label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-white/5 border-white/10 focus:border-pink-500/50 text-white placeholder:text-white/30"
                  />
                  <p className="text-xs text-white/40 mt-1">
                    This is how others will see your name
                  </p>
                </div>

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
                  <p className="text-xs text-white/40 mt-1">
                    Your unique identifier
                  </p>
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
                    className="bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
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
                    value={new Date(user.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                    disabled
                    className="bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
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

                {saveSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-400 font-medium">
                      ✓ Profile saved successfully!
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving || !hasUnsavedChanges}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-400" />
                    Your Progress
                  </h3>
                </div>

                {/* XP Progress */}
                <div className="space-y-3 mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">
                      Level {userStats?.level || 1}
                    </span>
                    <span className="text-sm text-pink-400 font-semibold">
                      {userStats?.currentLevelXP.toLocaleString() || 0} / 1,000
                      XP
                    </span>
                  </div>

                  <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-pink-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-500 relative overflow-hidden"
                      style={{ width: `${xpProgress}%` }}
                      role="progressbar"
                      aria-valuenow={userStats?.currentLevelXP || 0}
                      aria-valuemin={0}
                      aria-valuemax={1000}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>

                  {userStats && userStats.xpToNextRank > 0 ? (
                    <div className="text-center text-xs">
                      <span className="text-purple-400 font-bold flex items-center justify-center gap-1">
                        <Target className="w-3 h-3" />
                        {userStats.xpToNextRank.toLocaleString()} XP to{" "}
                        {userStats.nextRankName}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center text-xs">
                      <span className="text-yellow-400 font-bold flex items-center justify-center gap-1">
                        <Award className="w-3 h-3" />
                        Max Rank Achieved!
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-pink-500/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-pink-400" />
                      </div>
                      <span className="text-sm text-white/80 font-medium truncate">
                        Panels Read
                      </span>
                    </div>
                    <span className="text-xl font-bold text-white flex-shrink-0 ml-2">
                      {userStats?.total_panels_read.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-sm text-white/80 font-medium truncate">
                        Mangas Read
                      </span>
                    </div>
                    <span className="text-xl font-bold text-white flex-shrink-0 ml-2">
                      {userStats?.total_mangas_read.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Flame className="w-5 h-5 text-orange-400" />
                      </div>
                      <span className="text-sm text-white/80 font-medium truncate">
                        Day Streak
                      </span>
                    </div>
                    <span className="text-xl font-bold text-white flex-shrink-0 ml-2">
                      0
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-yellow-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-yellow-400" />
                      </div>
                      <span className="text-sm text-white/80 font-medium">
                        Achievements
                      </span>
                    </div>
                    <span className="text-xl font-bold text-white flex-shrink-0">
                      0
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Account Info */}
          <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
            <h3 className="font-semibold mb-2 text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-pink-400" />
              Account Information
            </h3>
            <p className="text-sm text-white/60">
              Your account is secure and all your data is synced with our
              servers. Stats are updated in real-time as you read manga. Keep
              reading to level up and unlock new ranks!
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

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
