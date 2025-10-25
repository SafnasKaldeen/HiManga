"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  User,
  LogOut,
  Mail,
  Calendar,
  Camera,
  X,
  Search,
  Award,
  Flame,
  BookOpen,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(42);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Mock user stats - replace with real data
  const [userStats] = useState({
    level: 12,
    xp: 750,
    totalChaptersRead: 342,
    currentStreak: 15,
    achievements: ["First Read", "Speed Reader", "Collector"],
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
    if (user) {
      setUsername(user.username);
      // Load saved avatar from user data if available
      if (user.avatarId) {
        setSelectedAvatar(user.avatarId);
      }
    }
  }, [user, isLoading, router]);

  // Generate 1000 preset avatars using various avatar services
  const generateAvatars = () => {
    const avatars = [];
    const categories = [
      { name: "Anime", service: "adventurer", count: 200 },
      { name: "Pixel", service: "pixel-art", count: 200 },
      { name: "Bottts", service: "bottts", count: 200 },
      { name: "Avataaars", service: "avataaars", count: 200 },
      { name: "Fun Emoji", service: "fun-emoji", count: 200 },
    ];

    categories.forEach((category) => {
      for (let i = 0; i < category.count; i++) {
        const seed = `${category.service}-${i}`;
        avatars.push({
          id: avatars.length,
          url: `https://api.dicebear.com/7.x/${category.service}/svg?seed=${seed}`,
          category: category.name,
          seed: seed,
        });
      }
    });

    return avatars;
  };

  const allAvatars = generateAvatars();

  const filteredAvatars = allAvatars.filter((avatar) => {
    const matchesCategory =
      categoryFilter === "all" || avatar.category === categoryFilter;
    const matchesSearch = avatar.seed
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    "all",
    "Anime",
    "Pixel",
    "Bottts",
    "Avataaars",
    "Fun Emoji",
  ];

  const xpProgress = (userStats.xp / 1000) * 100;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // TODO: Save username and selectedAvatar to backend
    // await updateUserProfile({ username, avatarId: selectedAvatar })
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  if (isLoading) {
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
                    <img
                      src={allAvatars[selectedAvatar]?.url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => setShowAvatarSelector(true)}
                    className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 p-2.5 rounded-full border-2 border-slate-900 hover:scale-110 transition-transform shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
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
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    Username
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-pink-500/50 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-white/80">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <Input
                    value={user.email}
                    disabled
                    className="bg-white/5 border-white/10 text-white/60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-white/80">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <Input
                    value={new Date(user.createdAt).toLocaleDateString()}
                    disabled
                    className="bg-white/5 border-white/10 text-white/60"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold"
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
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setShowAvatarSelector(false)}
          />

          {/* Modal */}
          <div className="fixed inset-4 md:inset-8 z-50 bg-gradient-to-br from-slate-900/95 to-slate-900/90 border border-pink-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-pink-500/20 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-slate-900/50">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  Choose Your Avatar
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Select from 1000+ preset avatars
                </p>
              </div>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="p-4 md:p-6 border-b border-white/10 space-y-4 bg-slate-900/30">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search avatars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                      categoryFilter === category
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30"
                        : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {category === "all" ? "All" : category}
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-500">
                Showing {filteredAvatars.length} avatars
              </p>
            </div>

            {/* Avatar Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {filteredAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      setSelectedAvatar(avatar.id);
                      setShowAvatarSelector(false);
                    }}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedAvatar === avatar.id
                        ? "border-pink-500 shadow-lg shadow-pink-500/50 scale-105"
                        : "border-slate-700 hover:border-pink-500/50"
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={`Avatar ${avatar.id}`}
                      className="w-full h-full object-cover bg-slate-800"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
