"use client";

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
  Zap,
  Shield,
  Star,
  Sparkles,
  Crown,
} from "lucide-react";

// Mock Auth Context
const useAuth = () => ({
  user: {
    username: "MagicKnight99",
    email: "asta@cloverking.com",
    createdAt: "2024-01-15",
    avatarId: 42,
  },
  logout: () => console.log("Logout"),
  isLoading: false,
});

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(42);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showGrimoireAnimation, setShowGrimoireAnimation] = useState(false);
  const [magicParticles, setMagicParticles] = useState([]);

  useEffect(() => {
    // Generate magic particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }));
    setMagicParticles(particles);
  }, []);

  // Magic Knight ranking system
  const magicKnightRanks = [
    {
      name: "Junior Magic Knight 5th Class",
      minMana: 0,
      stars: 0,
      color: "gray",
    },
    {
      name: "Junior Magic Knight 3rd Class",
      minMana: 200,
      stars: 1,
      color: "blue",
    },
    {
      name: "Intermediate Magic Knight 1st Class",
      minMana: 500,
      stars: 2,
      color: "green",
    },
    {
      name: "Senior Magic Knight 1st Class",
      minMana: 1000,
      stars: 3,
      color: "purple",
    },
    { name: "Vice Captain", minMana: 2000, stars: 4, color: "red" },
    { name: "Magic Knight Captain", minMana: 5000, stars: 5, color: "orange" },
  ];

  const [userStats] = useState({
    mana: 750, // XP as Mana
    totalChaptersRead: 342,
    currentStreak: 15,
    magicPower: 850, // Total chapters read
    spellsMastered: 12, // Manga completed
    missionsCompleted: 156, // Reading sessions
    grimoirePages: 342, // Same as chapters
    achievements: [
      "First Mission",
      "Speed Reader",
      "Grimoire Master",
      "Weekly Champion",
    ],
  });

  // Calculate current rank
  const getCurrentRank = (mana) => {
    for (let i = magicKnightRanks.length - 1; i >= 0; i--) {
      if (mana >= magicKnightRanks[i].minMana) {
        return magicKnightRanks[i];
      }
    }
    return magicKnightRanks[0];
  };

  const currentRank = getCurrentRank(userStats.mana);
  const nextRank = magicKnightRanks[magicKnightRanks.indexOf(currentRank) + 1];
  const manaProgress = nextRank
    ? ((userStats.mana - currentRank.minMana) /
        (nextRank.minMana - currentRank.minMana)) *
      100
    : 100;

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      if (user.avatarId) {
        setSelectedAvatar(user.avatarId);
      }
    }
  }, [user]);

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

  const handleSaveProfile = () => {
    setIsSaving(true);
    setShowGrimoireAnimation(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowGrimoireAnimation(false);
    }, 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading Magic Knight data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f] relative overflow-hidden">
      {/* Magic Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {magicParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Animated Background Elements - Keep original style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Grimoire Opening Animation */}
      {showGrimoireAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
          <div className="text-center animate-scaleIn">
            <div className="relative">
              {/* Grimoire Book */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-lg border-4 border-primary shadow-2xl shadow-primary/50 max-w-md relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 font-black text-xl rounded">
                  ✨ GRIMOIRE
                </div>
                <div className="text-7xl mb-4">📖</div>
                <div className="text-3xl font-black text-white mb-2">
                  Profile Updated!
                </div>
                <div className="text-lg text-slate-300">
                  Your grimoire has been inscribed
                </div>
                <div className="mt-4 flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < currentRank.stars
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-slate-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Magic circle effect */}
              <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin-slow opacity-30"></div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header with Grimoire Style */}
          <div className="mb-8 relative">
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-1 rounded-t-xl backdrop-blur-xl border border-primary/30">
              <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 p-6 rounded-t-lg backdrop-blur-sm">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent text-center">
                  Magic Knight Profile
                </h1>
                <p className="text-center text-slate-400 mt-2 font-semibold">
                  Clover Kingdom
                </p>
              </div>
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-16 bg-slate-900 rounded-full border-4 border-primary flex items-center justify-center shadow-lg shadow-primary/50">
              <span className="text-2xl">🍀</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Profile Card */}
            <div className="md:col-span-2 p-6 md:p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-2 border-primary/30 rounded-xl shadow-xl shadow-primary/10 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <div className="relative">
                  {/* Rank Badge */}
                  <div className="absolute -top-3 -left-3 z-10 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg border border-primary/50">
                    <div className="flex items-center gap-1">
                      {[...Array(currentRank.stars)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/50 bg-slate-800 shadow-xl shadow-primary/20 relative">
                    <img
                      src={allAvatars[selectedAvatar]?.url}
                      alt={username}
                      className="w-full h-full object-cover"
                    />
                    {/* Magic aura effect */}
                    <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-pulse"></div>
                  </div>

                  <button
                    onClick={() => setShowAvatarSelector(true)}
                    className="absolute -bottom-1 -right-1 bg-gradient-to-r from-primary to-secondary p-2.5 rounded-full border-2 border-slate-900 hover:scale-110 transition-transform shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                    {username}
                    <Sparkles className="w-5 h-5 text-primary" />
                  </h2>
                  <p className="text-white/60 flex items-center gap-2 justify-center sm:justify-start mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border-2 border-primary/30 rounded-full backdrop-blur-sm">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      {currentRank.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mana Progress Bar */}
              <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-primary/20 backdrop-blur-sm">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/80 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Mana Reserves
                  </span>
                  <span className="text-primary font-semibold">
                    {userStats.mana} / {nextRank?.minMana || "MAX"} Mana
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden border border-primary/20">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${manaProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                {nextRank && (
                  <p className="text-xs text-white/50 mt-2 text-center">
                    {nextRank.minMana - userStats.mana} mana until{" "}
                    {nextRank.name}
                  </p>
                )}
              </div>

              <div className="space-y-4 border-t border-white/10 pt-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/80">
                    Magic Knight Name
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded-lg focus:outline-none backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-white/80">
                    <Mail className="w-4 h-4" />
                    Communication Magic (Email)
                  </label>
                  <input
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white/60 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-white/80">
                    <Calendar className="w-4 h-4" />
                    Grimoire Received
                  </label>
                  <input
                    value={new Date(user.createdAt).toLocaleDateString()}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white/60 rounded-lg"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-3 rounded-lg transition-all hover:scale-105 disabled:opacity-50 shadow-lg shadow-primary/30"
                  >
                    {isSaving ? "Casting Spell..." : "✨ Save Changes"}
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-2 border-primary/40 hover:bg-primary/10 text-primary rounded-lg transition-all font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Squad
                  </button>
                </div>
              </div>
            </div>

            {/* Magic Stats Card */}
            <div className="p-6 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-2 border-primary/30 rounded-xl shadow-xl backdrop-blur-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Magic Knight Stats
                </h3>

                <div className="space-y-3">
                  {/* Magic Power */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <div>
                        <span className="text-xs text-primary block font-bold">
                          Magic Power
                        </span>
                        <span className="text-xs text-white/60">
                          Chapters Read
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {userStats.magicPower}
                    </span>
                  </div>

                  {/* Training Streak */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-3">
                      <Flame className="w-5 h-5 text-secondary" />
                      <div>
                        <span className="text-xs text-secondary block font-bold">
                          Training Streak
                        </span>
                        <span className="text-xs text-white/60">
                          Days Active
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-secondary">
                      {userStats.currentStreak}
                    </span>
                  </div>

                  {/* Spells Mastered */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/20 to-purple-500/10 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <div>
                        <span className="text-xs text-purple-300 block font-bold">
                          Spells Mastered
                        </span>
                        <span className="text-xs text-white/60">
                          Manga Complete
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-purple-400">
                      {userStats.spellsMastered}
                    </span>
                  </div>

                  {/* Missions Completed */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-green-400" />
                      <div>
                        <span className="text-xs text-green-300 block font-bold">
                          Missions Done
                        </span>
                        <span className="text-xs text-white/60">
                          Reading Sessions
                        </span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-400">
                      {userStats.missionsCompleted}
                    </span>
                  </div>

                  {/* Achievements */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <div>
                        <span className="text-xs text-yellow-300 block font-bold">
                          Achievements
                        </span>
                        <span className="text-xs text-white/60">Unlocked</span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-yellow-400">
                      {userStats.achievements.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rank Progress */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-semibold text-white/80 mb-3">
                  Magic Knight Ranks
                </h4>
                <div className="space-y-2">
                  {magicKnightRanks.map((rank) => (
                    <div
                      key={rank.name}
                      className={`flex items-center justify-between text-xs p-2 rounded ${
                        userStats.mana >= rank.minMana
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-slate-800/30 text-slate-500 border border-slate-700/30"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {userStats.mana >= rank.minMana ? "✅" : "🔒"}
                        <span className="flex gap-0.5">
                          {[...Array(rank.stars)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold truncate ml-2">
                        {rank.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Info Card - Grimoire Style */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="text-4xl">📖</div>
              <div>
                <h3 className="font-semibold mb-2 text-white text-lg">
                  Grimoire Chronicles
                </h3>
                <p className="text-sm text-white/60">
                  Your grimoire grows stronger as you train! Each chapter you
                  read increases your mana reserves. Complete manga series to
                  master new spells and rise through the Magic Knight ranks.
                  Surpass your limits and become the Wizard King!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setShowAvatarSelector(false)}
          />

          <div className="fixed inset-4 md:inset-8 z-50 bg-gradient-to-br from-slate-900/95 to-slate-900/90 border-2 border-primary/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-primary/20 flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-slate-900/50">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  ✨ Choose Your Magic Knight Avatar
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Select your grimoire portrait
                </p>
              </div>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            <div className="p-4 md:p-6 border-b border-white/10 space-y-4 bg-slate-900/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search avatars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                      categoryFilter === category
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30"
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
                        ? "border-primary shadow-lg shadow-primary/50 scale-105"
                        : "border-slate-700 hover:border-primary/50"
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

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
