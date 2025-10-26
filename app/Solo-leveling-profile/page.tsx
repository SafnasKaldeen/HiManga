"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Target,
  Award,
  TrendingUp,
  BookOpen,
  Flame,
  Clock,
  CheckCircle2,
  Lock,
  Star,
  Trophy,
  Swords,
  Shield,
  X,
  Gift,
  Calendar,
} from "lucide-react";

/**
 * HunterSystemPage
 * - Completed Daily Reward modal
 * - Quest claim logic + XP awarding
 * - Level up detection + modal + stat increases
 * - LocalStorage persistence
 * - Simple canvas confetti for celebrations
 *
 * Drop-in replacement for your original component.
 */

export default function HunterSystemPage() {
  const [activeTab, setActiveTab] = useState("quests");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const confettiCanvasRef = useRef(null);

  // Load saved state from localStorage or use defaults
  const initialUserData = {
    level: 12,
    xp: 750,
    maxXp: 1000,
    rank: "B",
    power: 2847,
    speed: 156,
    endurance: 15,
    intelligence: 8,
  };

  // Keep these in state so UI updates
  const [userData, setUserData] = useState(initialUserData);

  // Quests kept in state (so they can be claimed / updated)
  const [dailyQuests, setDailyQuests] = useState([
    {
      id: 1,
      title: "First Chapter of the Day",
      description: "Read your first chapter today",
      progress: 1,
      total: 1,
      reward: 50,
      completed: true,
      claimed: false,
    },
    {
      id: 2,
      title: "Marathon Reader",
      description: "Read 3 chapters in one session",
      progress: 2,
      total: 3,
      reward: 100,
      completed: false,
      claimed: false,
    },
    {
      id: 3,
      title: "Explorer",
      description: "Try a new manga series",
      progress: 0,
      total: 1,
      reward: 75,
      completed: false,
      claimed: false,
    },
  ]);

  const [weeklyQuests, setWeeklyQuests] = useState([
    {
      id: 4,
      title: "Devoted Hunter",
      description: "Read manga for 7 consecutive days",
      progress: 5,
      total: 7,
      reward: 500,
      completed: false,
      claimed: false,
    },
    {
      id: 5,
      title: "Genre Master",
      description: "Read from 5 different genres",
      progress: 3,
      total: 5,
      reward: 300,
      completed: false,
      claimed: false,
    },
  ]);

  const [achievements, setAchievements] = useState([
    {
      id: 1,
      title: "Awakened Hunter",
      description: "Complete your first chapter",
      icon: Zap,
      rarity: "common",
      unlocked: true,
    },
    {
      id: 2,
      title: "Speed Reader",
      description: "Read 10 chapters in one day",
      icon: Flame,
      rarity: "rare",
      unlocked: true,
    },
    {
      id: 3,
      title: "Shadow Collector",
      description: "Bookmark 50 manga series",
      icon: BookOpen,
      rarity: "epic",
      unlocked: false,
    },
    {
      id: 4,
      title: "S-Rank Hunter",
      description: "Reach level 50",
      icon: Trophy,
      rarity: "legendary",
      unlocked: false,
    },
    {
      id: 5,
      title: "Monarch",
      description: "Complete all achievements",
      icon: Star,
      rarity: "mythic",
      unlocked: false,
    },
  ]);

  const [skills, setSkills] = useState([
    {
      id: 1,
      name: "Speed Reading",
      level: 3,
      maxLevel: 5,
      cost: 2,
      unlocked: true,
      description: "Increase reading speed by 15%",
    },
    {
      id: 2,
      name: "Collector",
      level: 2,
      maxLevel: 5,
      cost: 2,
      unlocked: true,
      description: "Bookmark limit +25",
    },
    {
      id: 3,
      name: "Critic",
      level: 0,
      maxLevel: 3,
      cost: 3,
      unlocked: false,
      description: "Unlock detailed rating system",
    },
    {
      id: 4,
      name: "Shadow",
      level: 0,
      maxLevel: 1,
      cost: 5,
      unlocked: false,
      description: "Unlock premium dark themes",
    },
  ]);

  // Track which daily reward days have been claimed (1..7)
  const [claimedDays, setClaimedDays] = useState([]); // e.g. [1,2,3]

  // Rarity helpers (visual)
  const getRarityColor = (rarity) => {
    const colors = {
      common: "from-gray-500 to-gray-600",
      rare: "from-blue-500 to-blue-600",
      epic: "from-purple-500 to-purple-600",
      legendary: "from-orange-500 to-yellow-500",
      mythic: "from-pink-500 to-red-500",
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBorder = (rarity) => {
    const borders = {
      common: "border-gray-500/40",
      rare: "border-blue-500/40",
      epic: "border-purple-500/40",
      legendary: "border-orange-500/40",
      mythic: "border-pink-500/40",
    };
    return borders[rarity] || borders.common;
  };

  // ---------- Persistence ----------
  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hunter_system_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userData) setUserData(parsed.userData);
        if (parsed.dailyQuests) setDailyQuests(parsed.dailyQuests);
        if (parsed.weeklyQuests) setWeeklyQuests(parsed.weeklyQuests);
        if (parsed.achievements) setAchievements(parsed.achievements);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.claimedDays) setClaimedDays(parsed.claimedDays);
      }
    } catch (e) {
      console.warn("Failed to load saved Hunter System state:", e);
    }
  }, []);

  // Save whenever important parts change
  useEffect(() => {
    const payload = {
      userData,
      dailyQuests,
      weeklyQuests,
      achievements,
      skills,
      claimedDays,
    };
    try {
      localStorage.setItem("hunter_system_v1", JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save Hunter System state:", e);
    }
  }, [userData, dailyQuests, weeklyQuests, achievements, skills, claimedDays]);

  // ---------- Confetti (simple canvas particles) ----------
  const runConfetti = (count = 30) => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * -h * 0.2,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 2,
        size: Math.random() * 8 + 4,
        color: ["#FFD166", "#EF476F", "#06D6A0", "#118AB2", "#FFD54A"][
          Math.floor(Math.random() * 5)
        ],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.2,
      });
    }

    let frame = 0;
    const maxFrame = 90;
    function draw() {
      frame++;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.rot += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (frame < maxFrame) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }
    draw();
  };

  // ---------- Gameplay Logic ----------
  // Add XP and check for level up(s)
  const addXp = (amount) => {
    setUserData((prev) => {
      let xp = prev.xp + amount;
      let level = prev.level;
      let maxXp = prev.maxXp;
      let power = prev.power;
      let speed = prev.speed;
      let endurance = prev.endurance;
      let intelligence = prev.intelligence;
      let leveled = false;

      while (xp >= maxXp) {
        xp -= maxXp;
        level += 1;
        maxXp = Math.round(maxXp * 1.12); // scale up required XP
        // stat increases on level up
        power += 50;
        speed += 10;
        endurance += 1;
        intelligence += 0; // small or none
        leveled = true;
      }

      const newState = {
        ...prev,
        xp,
        level,
        maxXp,
        power,
        speed,
        endurance,
        intelligence,
      };

      setTimeout(() => {
        // show modal and confetti after state updated
        if (leveled) {
          setShowLevelUp(true);
          runConfetti(60);
        }
      }, 80);

      return newState;
    });
  };

  // Claim a daily quest reward
  const claimDailyQuest = (questId) => {
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && q.completed && !q.claimed) {
          addXp(q.reward);
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  };

  // Claim a weekly quest reward
  const claimWeeklyQuest = (questId) => {
    setWeeklyQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && q.progress >= q.total && !q.claimed) {
          addXp(q.reward);
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  };

  // Claim today's daily reward (from the modal)
  const claimDailyReward = (day) => {
    // ensure day not already claimed
    if (claimedDays.includes(day)) return;
    // Example reward policy: XP + cosmetic
    const xpAward = 25 + day * 5; // scales slightly with day
    setClaimedDays((prev) => [...prev, day]);
    addXp(xpAward);
    // optional: unlock a small achievement if day 7 claimed
    if (day === 7) {
      setAchievements((prev) =>
        prev.map((a) => (a.id === 3 ? { ...a, unlocked: true } : a))
      );
      runConfetti(80);
    } else {
      runConfetti(30);
    }
  };

  // Upgrade a skill (consumes skill points — we don't have an SP budget UI right now, so emulate with level)
  const upgradeSkill = (skillId) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id === skillId && s.level < s.maxLevel) {
          // minimal gating: require unlocked true or level >0
          const nextLevel = s.level + 1;
          // reward: small XP (cosmetic) to simulate spending
          addXp(10);
          return { ...s, level: nextLevel, unlocked: true };
        }
        return s;
      })
    );
  };

  // Helper to compute progress percentage safely
  const pct = (val, tot) => (tot === 0 ? 0 : Math.round((val / tot) * 100));

  // Reset weekly & daily (not exposed) - kept for dev/testing
  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f] relative overflow-x-hidden">
      {/* confetti canvas sits on top */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        style={{ width: "100%", height: "100%" }}
      />

      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Hunter System
          </h1>
          <p className="text-cyan-400/60 font-mono text-sm">
            STATUS: ACTIVE | ID: HUNTER_{userData.level}
          </p>

          {/* XP Bar */}
          <div className="mt-4 max-w-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>XP</span>
              <span className="font-bold text-slate-100">
                {Math.round(userData.xp)} / {userData.maxXp}
              </span>
            </div>
            <div className="relative w-full h-3 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/30">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${(userData.xp / userData.maxXp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/40">
            <div className="flex items-center justify-between mb-2">
              <Swords className="w-5 h-5 text-cyan-400" />
              <span className="text-2xl font-black text-cyan-300">
                {userData.power.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-cyan-400/60 font-mono uppercase">
              Power
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/40">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-black text-purple-300">
                {userData.speed}
              </span>
            </div>
            <p className="text-xs text-purple-400/60 font-mono uppercase">
              Speed
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-orange-500/40">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-black text-orange-300">
                {userData.endurance}
              </span>
            </div>
            <p className="text-xs text-orange-400/60 font-mono uppercase">
              Endurance
            </p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-green-500/40">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-black text-green-300">
                {userData.intelligence}
              </span>
            </div>
            <p className="text-xs text-green-400/60 font-mono uppercase">
              Intelligence
            </p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "quests", label: "Quests", icon: Target },
            { id: "achievements", label: "Achievements", icon: Award },
            { id: "skills", label: "Skills", icon: Zap },
            { id: "leaderboard", label: "Rankings", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-slate-900/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === "quests" && (
          <div className="space-y-6">
            {/* Daily Quests */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500" />
                <h2 className="text-xl font-black text-cyan-400 uppercase tracking-wide">
                  Daily Quests
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
              </div>

              <div className="grid gap-4">
                {dailyQuests.map((quest) => (
                  <Card
                    key={quest.id}
                    className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/30 p-5"
                  >
                    {quest.claimed && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {quest.title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {quest.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-cyan-400/70 font-mono">
                            PROGRESS
                          </span>
                          <span className="text-cyan-300 font-bold">
                            {quest.progress} / {quest.total}
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-cyan-500/30">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"
                            style={{
                              width: `${pct(quest.progress, quest.total)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-bold text-yellow-300">
                            +{quest.reward} XP
                          </span>
                        </div>
                        <Button
                          disabled={!quest.completed || quest.claimed}
                          onClick={() => claimDailyQuest(quest.id)}
                          className={`text-xs font-bold ${
                            quest.completed && !quest.claimed
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              : "bg-slate-700 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          {quest.claimed
                            ? "Claimed"
                            : quest.completed
                            ? "Claim Reward"
                            : "In Progress"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Weekly Quests */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500" />
                <h2 className="text-xl font-black text-purple-400 uppercase tracking-wide">
                  Weekly Quests
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
              </div>

              <div className="grid gap-4">
                {weeklyQuests.map((quest) => (
                  <Card
                    key={quest.id}
                    className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/30 p-5"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {quest.title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {quest.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-purple-400/70 font-mono">
                            PROGRESS
                          </span>
                          <span className="text-purple-300 font-bold">
                            {quest.progress} / {quest.total}
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-purple-500/30">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"
                            style={{
                              width: `${pct(quest.progress, quest.total)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-bold text-yellow-300">
                            +{quest.reward} XP
                          </span>
                        </div>
                        <Button
                          disabled={
                            !(quest.progress >= quest.total) || quest.claimed
                          }
                          onClick={() => claimWeeklyQuest(quest.id)}
                          className={`text-xs font-bold ${
                            quest.progress >= quest.total && !quest.claimed
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              : "bg-slate-700 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          {quest.claimed
                            ? "Claimed"
                            : quest.progress >= quest.total
                            ? "Claim Reward"
                            : "In Progress"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card
                  key={achievement.id}
                  className={`relative overflow-hidden p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 transition-all ${
                    achievement.unlocked
                      ? `${getRarityBorder(
                          achievement.rarity
                        )} hover:scale-105 cursor-pointer`
                      : "border-slate-700/50 opacity-50"
                  }`}
                >
                  {!achievement.unlocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-5 h-5 text-slate-600" />
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRarityColor(
                        achievement.rarity
                      )} flex items-center justify-center mb-4 shadow-lg ${
                        achievement.unlocked ? "animate-pulse" : ""
                      }`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      {achievement.description}
                    </p>

                    <div
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        achievement.unlocked
                          ? `bg-gradient-to-r ${getRarityColor(
                              achievement.rarity
                            )} text-white`
                          : "bg-slate-800 text-slate-600"
                      }`}
                    >
                      {achievement.rarity}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <Card
                key={skill.id}
                className={`p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 ${
                  skill.unlocked ? "border-cyan-500/40" : "border-slate-700/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {skill.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {skill.description}
                    </p>
                  </div>
                  {!skill.unlocked && (
                    <Lock className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-cyan-400/70 font-mono">LEVEL</span>
                      <span className="text-cyan-300 font-bold">
                        {skill.level} / {skill.maxLevel}
                      </span>
                    </div>
                    <div className="relative w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-cyan-500/30">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"
                        style={{
                          width: `${pct(skill.level, skill.maxLevel)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    disabled={skill.level >= skill.maxLevel}
                    onClick={() => upgradeSkill(skill.id)}
                    className={`w-full font-bold ${
                      skill.level < skill.maxLevel
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {skill.level < skill.maxLevel
                      ? `Upgrade (${skill.cost} SP)`
                      : "Maxed"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <Card className="p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/40">
            <div className="space-y-4">
              {[
                {
                  rank: 1,
                  name: "ShadowMonarch",
                  level: 87,
                  power: 15847,
                  avatar: "adventurer-1",
                },
                {
                  rank: 2,
                  name: "HunterKing",
                  level: 72,
                  power: 12453,
                  avatar: "adventurer-2",
                },
                {
                  rank: 3,
                  name: "GateBreaker",
                  level: 65,
                  power: 10982,
                  avatar: "adventurer-3",
                },
                {
                  rank: 4,
                  name: "You",
                  level: userData.level,
                  power: userData.power,
                  avatar: "adventurer-4",
                  isUser: true,
                },
                {
                  rank: 5,
                  name: "DarkSlayer",
                  level: 48,
                  power: 8234,
                  avatar: "adventurer-5",
                },
              ].map((hunter) => (
                <div
                  key={hunter.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    hunter.isUser
                      ? "bg-cyan-500/10 border-cyan-500/40"
                      : "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-center justify-center w-12">
                    {hunter.rank <= 3 ? (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                          hunter.rank === 1
                            ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white"
                            : hunter.rank === 2
                            ? "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                            : "bg-gradient-to-br from-orange-700 to-orange-800 text-white"
                        }`}
                      >
                        {hunter.rank}
                      </div>
                    ) : (
                      <span className="text-2xl font-black text-slate-600">
                        #{hunter.rank}
                      </span>
                    )}
                  </div>

                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/40">
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${hunter.avatar}`}
                      alt={hunter.name}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-white">{hunter.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Level {hunter.level}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-cyan-300">
                      {hunter.power.toLocaleString()}
                    </p>
                    <p className="text-xs text-cyan-400/60 font-mono">POWER</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <button
            onClick={() => setShowDailyReward(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex items-center justify-center shadow-2xl shadow-yellow-500/50 transition-transform hover:scale-110"
            title="Daily Rewards"
          >
            <Gift className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => {
              // small manual XP test
              addXp(120);
              runConfetti(40);
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50 transition-transform hover:scale-110 animate-pulse"
            title="Test Level / Give XP"
          >
            <Zap className="w-6 h-6 text-white" />
          </button>
        </div>
      </main>

      <Footer />

      {/* Level Up Modal */}
      {showLevelUp && (
        <>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-3xl animate-pulse" />

              <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/50 p-8 text-center">
                <button
                  onClick={() => setShowLevelUp(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 animate-pulse shadow-2xl shadow-cyan-500/50">
                    <Zap className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-cyan-400 mb-2">
                    LEVEL UP!
                  </h2>
                  <p className="text-6xl font-black text-white mb-4">
                    {userData.level}
                  </p>
                  <p className="text-cyan-400/60 font-mono text-sm">
                    CONGRATULATIONS, HUNTER
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg border border-cyan-500/30">
                    <span className="text-cyan-400 font-mono text-sm">
                      POWER
                    </span>
                    <span className="text-white font-bold">+50</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg border border-purple-500/30">
                    <span className="text-purple-400 font-mono text-sm">
                      SPEED
                    </span>
                    <span className="text-white font-bold">+10</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg border border-orange-500/30">
                    <span className="text-orange-400 font-mono text-sm">
                      SKILL POINTS
                    </span>
                    <span className="text-white font-bold">+3</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowLevelUp(false)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-black text-lg py-6"
                >
                  ACCEPT REWARDS
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Daily Reward Modal */}
      {showDailyReward && (
        <>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-lg w-full">
              <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-yellow-500/50 p-6">
                <button
                  onClick={() => setShowDailyReward(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-yellow-400 mb-2">
                    DAILY REWARDS
                  </h2>
                  <p className="text-sm text-slate-400 font-mono">
                    Claim your daily login bonus
                  </p>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const claimed = claimedDays.includes(day);
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                          claimed
                            ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50"
                            : day === getCurrentDayOfWeekOrdinal()
                            ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 animate-pulse"
                            : "bg-slate-900/50 border-slate-700/50"
                        }`}
                        onClick={() => {
                          // Only allow claiming for the current day or earlier unclaimed days
                          if (!claimed) {
                            // For demo: allow claiming any day that is <= current day index (simple logic)
                            const cur = getCurrentDayOfWeekOrdinal();
                            if (day <= cur) claimDailyReward(day);
                          }
                        }}
                        style={{ cursor: claimed ? "default" : "pointer" }}
                      >
                        <Calendar
                          className={`w-4 h-4 ${
                            claimed
                              ? "text-green-400"
                              : day === getCurrentDayOfWeekOrdinal()
                              ? "text-yellow-400"
                              : "text-slate-600"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold mt-1 ${
                            claimed
                              ? "text-green-300"
                              : day === getCurrentDayOfWeekOrdinal()
                              ? "text-yellow-300"
                              : "text-slate-600"
                          }`}
                        >
                          {day}
                        </span>
                        {claimed && (
                          <span className="text-[9px] text-green-200 mt-1">
                            CLAIMED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-900/50 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-400 mb-2">Today's Reward:</p>
                  <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6 text-yellow-400" />
                    <span className="text-white font-bold">
                      Exclusive Avatar Frame + XP
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      // Claim today's reward if available
                      const today = getCurrentDayOfWeekOrdinal();
                      if (!claimedDays.includes(today)) {
                        claimDailyReward(today);
                      } else {
                        // already claimed -> close
                        setShowDailyReward(false);
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 font-black text-lg py-3"
                  >
                    {claimedDays.includes(getCurrentDayOfWeekOrdinal())
                      ? "Already Claimed"
                      : "CLAIM TODAY"}
                  </Button>

                  <Button
                    onClick={() => setShowDailyReward(false)}
                    className="flex-1 bg-slate-800 text-white py-3"
                  >
                    CLOSE
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Helper to return a day ordinal (1..7) for "daily rewards" logic
 *  Using local date: treat Monday as day 1, Sunday as day 7 for consistency
 */
function getCurrentDayOfWeekOrdinal() {
  try {
    const d = new Date();
    // JS: getDay() returns 0 (Sun) .. 6 (Sat)
    const jsDay = d.getDay(); // 0..6
    // Convert so Monday=1 ... Sunday=7
    // If Sunday (0) -> return 7
    if (jsDay === 0) return 7;
    return jsDay;
  } catch {
    return 1;
  }
}
