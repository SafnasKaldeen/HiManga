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
  Crown,
  Skull,
  Users,
  Sparkles,
  Eye,
  Heart,
  ArrowUp,
  Crosshair,
} from "lucide-react";

export default function HunterSystemPage() {
  const [activeTab, setActiveTab] = useState("quests");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showDungeonModal, setShowDungeonModal] = useState(false);
  const [showQuestComplete, setShowQuestComplete] = useState(false);
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const confettiCanvasRef = useRef(null);

  const initialUserData = {
    level: 12,
    xp: 750,
    maxXp: 1000,
    rank: "B",
    hunterClass: "Shadow Monarch",
    power: 2847,
    speed: 156,
    endurance: 15,
    intelligence: 8,
    strength: 245,
    agility: 189,
    vitality: 178,
    sense: 134,
    mana: 892,
    luck: 67,
    skillPoints: 5,
  };

  const [userData, setUserData] = useState(initialUserData);
  const [dailyQuests, setDailyQuests] = useState([
    {
      id: 1,
      title: "First Chapter of the Day",
      description: "Read your first chapter today",
      progress: 1,
      total: 1,
      reward: 50,
      type: "daily",
      difficulty: "E",
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
      type: "daily",
      difficulty: "D",
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
      type: "daily",
      difficulty: "D",
      completed: false,
      claimed: false,
    },
    {
      id: 4,
      title: "Perfect Reader",
      description: "Read for 30 minutes straight",
      progress: 0,
      total: 1,
      reward: 150,
      type: "daily",
      difficulty: "C",
      completed: false,
      claimed: false,
    },
  ]);

  const [weeklyQuests, setWeeklyQuests] = useState([
    {
      id: 5,
      title: "Devoted Hunter",
      description: "Read manga for 7 consecutive days",
      progress: 5,
      total: 7,
      reward: 500,
      type: "weekly",
      difficulty: "B",
      completed: false,
      claimed: false,
    },
    {
      id: 6,
      title: "Genre Master",
      description: "Read from 5 different genres",
      progress: 3,
      total: 5,
      reward: 300,
      type: "weekly",
      difficulty: "C",
      completed: false,
      claimed: false,
    },
    {
      id: 7,
      title: "Chapter Conqueror",
      description: "Complete 50 chapters this week",
      progress: 32,
      total: 50,
      reward: 800,
      type: "weekly",
      difficulty: "A",
      completed: false,
      claimed: false,
    },
  ]);

  // Dungeon system (special challenges)
  const [dungeons, setDungeons] = useState([
    {
      id: 1,
      name: "Gate of Beginnings",
      description: "A low-level gate for new hunters",
      difficulty: "E",
      requirement: "Level 5+",
      chapters: 10,
      reward: { xp: 200, item: "Common Reader Badge" },
      status: "available",
      timeLimit: "24 hours",
    },
    {
      id: 2,
      name: "Shadow Dungeon",
      description: "Dark forces await brave readers",
      difficulty: "C",
      requirement: "Level 10+",
      chapters: 25,
      reward: { xp: 600, item: "Shadow Avatar Frame" },
      status: "available",
      timeLimit: "3 days",
    },
    {
      id: 3,
      name: "Demon Castle",
      description: "Only S-Rank hunters may enter",
      difficulty: "S",
      requirement: "Level 50+",
      chapters: 100,
      reward: { xp: 5000, item: "Legendary Title: Demon Slayer" },
      status: "locked",
      timeLimit: "7 days",
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
      reward: 50,
    },
    {
      id: 2,
      title: "Speed Reader",
      description: "Read 10 chapters in one day",
      icon: Flame,
      rarity: "rare",
      unlocked: true,
      reward: 150,
    },
    {
      id: 3,
      title: "Shadow Collector",
      description: "Bookmark 50 manga series",
      icon: BookOpen,
      rarity: "epic",
      unlocked: false,
      reward: 500,
    },
    {
      id: 4,
      title: "S-Rank Hunter",
      description: "Reach level 50",
      icon: Trophy,
      rarity: "legendary",
      unlocked: false,
      reward: 2000,
    },
    {
      id: 5,
      title: "Shadow Monarch",
      description: "Complete all achievements",
      icon: Crown,
      rarity: "mythic",
      unlocked: false,
      reward: 10000,
    },
    {
      id: 6,
      title: "Gate Breaker",
      description: "Complete 5 dungeons",
      icon: Crosshair,
      rarity: "epic",
      unlocked: false,
      reward: 800,
    },
    {
      id: 7,
      title: "Night Reader",
      description: "Read 100 chapters after midnight",
      icon: Eye,
      rarity: "rare",
      unlocked: false,
      reward: 300,
    },
    {
      id: 8,
      title: "Loyal Hunter",
      description: "30 day login streak",
      icon: Heart,
      rarity: "legendary",
      unlocked: false,
      reward: 1500,
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
      effect: "+15% Reading Speed",
    },
    {
      id: 2,
      name: "Collector's Eye",
      level: 2,
      maxLevel: 5,
      cost: 2,
      unlocked: true,
      description: "Bookmark limit +25",
      effect: "+25 Bookmark Slots",
    },
    {
      id: 3,
      name: "Critic's Insight",
      level: 0,
      maxLevel: 3,
      cost: 3,
      unlocked: false,
      description: "Unlock detailed rating system",
      effect: "Advanced Rating Features",
    },
    {
      id: 4,
      name: "Shadow Cloak",
      level: 0,
      maxLevel: 1,
      cost: 5,
      unlocked: false,
      description: "Unlock premium dark themes",
      effect: "Premium Dark Mode",
    },
    {
      id: 5,
      name: "Hunter's Sense",
      level: 0,
      maxLevel: 5,
      cost: 3,
      unlocked: false,
      description: "Receive recommendations based on reading",
      effect: "Smart Recommendations",
    },
    {
      id: 6,
      name: "Monarch's Authority",
      level: 0,
      maxLevel: 1,
      cost: 10,
      unlocked: false,
      description: "Unlock all premium features",
      effect: "Full Premium Access",
    },
  ]);

  const [titles, setTitles] = useState([
    { id: 1, name: "E-Rank Hunter", unlocked: true, equipped: false },
    { id: 2, name: "Rising Star", unlocked: true, equipped: true },
    { id: 3, name: "Speed Reader", unlocked: true, equipped: false },
    { id: 4, name: "Shadow Walker", unlocked: false, equipped: false },
    { id: 5, name: "Gate Breaker", unlocked: false, equipped: false },
    { id: 6, name: "Monarch", unlocked: false, equipped: false },
  ]);

  const [claimedDays, setClaimedDays] = useState([]);

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

  const getDifficultyColor = (difficulty) => {
    const colors = {
      E: "text-gray-400",
      D: "text-green-400",
      C: "text-blue-400",
      B: "text-purple-400",
      A: "text-orange-400",
      S: "text-red-400",
      SS: "text-pink-400",
    };
    return colors[difficulty] || colors.E;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hunter_system_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userData) setUserData(parsed.userData);
        if (parsed.dailyQuests) setDailyQuests(parsed.dailyQuests);
        if (parsed.weeklyQuests) setWeeklyQuests(parsed.weeklyQuests);
        if (parsed.achievements) setAchievements(parsed.achievements);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.claimedDays) setClaimedDays(parsed.claimedDays);
        if (parsed.titles) setTitles(parsed.titles);
        if (parsed.dungeons) setDungeons(parsed.dungeons);
      }
    } catch (e) {
      console.warn("Failed to load saved state:", e);
    }
  }, []);

  useEffect(() => {
    const payload = {
      userData,
      dailyQuests,
      weeklyQuests,
      achievements,
      skills,
      claimedDays,
      titles,
      dungeons,
    };
    try {
      localStorage.setItem("hunter_system_v2", JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  }, [
    userData,
    dailyQuests,
    weeklyQuests,
    achievements,
    skills,
    claimedDays,
    titles,
    dungeons,
  ]);

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
        color: ["#22D3EE", "#06D6A0", "#FFD166", "#EF476F", "#118AB2"][
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
        p.vy += 0.12;
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

  const addXp = (amount) => {
    setUserData((prev) => {
      let xp = prev.xp + amount;
      let level = prev.level;
      let maxXp = prev.maxXp;
      let power = prev.power;
      let speed = prev.speed;
      let endurance = prev.endurance;
      let intelligence = prev.intelligence;
      let strength = prev.strength;
      let agility = prev.agility;
      let vitality = prev.vitality;
      let sense = prev.sense;
      let mana = prev.mana;
      let luck = prev.luck;
      let skillPoints = prev.skillPoints;
      let leveled = false;

      while (xp >= maxXp) {
        xp -= maxXp;
        level += 1;
        maxXp = Math.round(maxXp * 1.12);
        power += 50;
        speed += 10;
        endurance += 1;
        intelligence += 1;
        strength += 12;
        agility += 8;
        vitality += 10;
        sense += 5;
        mana += 35;
        luck += 2;
        skillPoints += 3;
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
        strength,
        agility,
        vitality,
        sense,
        mana,
        luck,
        skillPoints,
      };

      setTimeout(() => {
        if (leveled) {
          setShowLevelUp(true);
          runConfetti(80);
        }
      }, 80);

      return newState;
    });
  };

  const claimDailyQuest = (questId) => {
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && q.completed && !q.claimed) {
          addXp(q.reward);
          setShowQuestComplete(true);
          setTimeout(() => setShowQuestComplete(false), 2000);
          runConfetti(40);
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  };

  const claimWeeklyQuest = (questId) => {
    setWeeklyQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && q.progress >= q.total && !q.claimed) {
          addXp(q.reward);
          setShowQuestComplete(true);
          setTimeout(() => setShowQuestComplete(false), 2000);
          runConfetti(60);
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  };

  const claimDailyReward = (day) => {
    if (claimedDays.includes(day)) return;
    const xpAward = 25 + day * 15;
    setClaimedDays((prev) => [...prev, day]);
    addXp(xpAward);
    if (day === 7) {
      runConfetti(100);
    } else {
      runConfetti(40);
    }
  };

  const upgradeSkill = (skillId) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (
          s.id === skillId &&
          s.level < s.maxLevel &&
          userData.skillPoints >= s.cost
        ) {
          setUserData((u) => ({ ...u, skillPoints: u.skillPoints - s.cost }));
          const nextLevel = s.level + 1;
          runConfetti(30);
          return { ...s, level: nextLevel, unlocked: true };
        }
        return s;
      })
    );
  };

  const equipTitle = (titleId) => {
    setTitles((prev) =>
      prev.map((t) => ({
        ...t,
        equipped: t.id === titleId && t.unlocked,
      }))
    );
  };

  const enterDungeon = (dungeon) => {
    setSelectedDungeon(dungeon);
    setShowDungeonModal(true);
  };

  const pct = (val, tot) => (tot === 0 ? 0 : Math.round((val / tot) * 100));

  const getCurrentDayOfWeekOrdinal = () => {
    const d = new Date();
    const jsDay = d.getDay();
    if (jsDay === 0) return 7;
    return jsDay;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f] relative overflow-x-hidden">
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        style={{ width: "100%", height: "100%" }}
      />

      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* System Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl -z-10" />

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Hunter System
              </h1>
              <p className="text-cyan-400/60 font-mono text-sm mb-2">
                STATUS: ACTIVE | HUNTER_ID:{" "}
                {userData.level.toString().padStart(4, "0")}
              </p>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 rounded-full">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    {titles.find((t) => t.equipped)?.name || "No Title"}
                  </span>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-full">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Rank {userData.rank}
                  </span>
                </div>
              </div>
            </div>

            <Card className="p-4 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/40">
              <div className="text-right">
                <p className="text-xs text-cyan-400/60 font-mono mb-1">
                  SKILL POINTS
                </p>
                <p className="text-3xl font-black text-cyan-300">
                  {userData.skillPoints}
                </p>
              </div>
            </Card>
          </div>

          {/* XP Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-cyan-400 font-mono uppercase">
                Experience
              </span>
              <span className="text-cyan-300 font-bold font-mono">
                {Math.round(userData.xp)} / {userData.maxXp} XP
              </span>
            </div>
            <div className="relative w-full h-4 bg-slate-900/80 rounded-full overflow-hidden border-2 border-cyan-500/30 shadow-inner">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-400 shadow-lg shadow-cyan-500/60"
                style={{ width: `${(userData.xp / userData.maxXp) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            </div>
          </div>
        </div>

        {/* Advanced Stats Panel */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            {
              label: "STR",
              value: userData.strength,
              icon: Swords,
              color: "cyan",
            },
            {
              label: "AGI",
              value: userData.agility,
              icon: Zap,
              color: "purple",
            },
            {
              label: "VIT",
              value: userData.vitality,
              icon: Shield,
              color: "orange",
            },
            {
              label: "INT",
              value: userData.intelligence,
              icon: BookOpen,
              color: "green",
            },
            { label: "SENSE", value: userData.sense, icon: Eye, color: "pink" },
            {
              label: "LUCK",
              value: userData.luck,
              icon: Star,
              color: "yellow",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className={`p-3 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-${stat.color}-500/40 hover:border-${stat.color}-500/60 transition-all`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 text-${stat.color}-400`} />
                  <span className={`text-xl font-black text-${stat.color}-300`}>
                    {stat.value}
                  </span>
                </div>
                <p
                  className={`text-[10px] text-${stat.color}-400/60 font-mono uppercase tracking-wider`}
                >
                  {stat.label}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "quests", label: "Quests", icon: Target },
            { id: "dungeons", label: "Dungeons", icon: Skull },
            { id: "achievements", label: "Achievements", icon: Award },
            { id: "skills", label: "Skills", icon: Zap },
            { id: "titles", label: "Titles", icon: Crown },
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

        {/* Quest Complete Notification */}
        {showQuestComplete && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <Card className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 border-2 border-green-400 p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-white" />
                <div>
                  <p className="text-white font-black uppercase tracking-wide">
                    Quest Complete!
                  </p>
                  <p className="text-white/80 text-sm font-mono">XP Awarded</p>
                </div>
              </div>
            </Card>
          </div>
        )}

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
                <Clock className="w-5 h-5 text-cyan-400/60" />
                <span className="text-sm text-cyan-400/60 font-mono">
                  Resets in 8h
                </span>
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

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {quest.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${getDifficultyColor(
                              quest.difficulty
                            )} bg-slate-800/50 border border-current`}
                          >
                            RANK {quest.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {quest.description}
                        </p>
                      </div>
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
                <Calendar className="w-5 h-5 text-purple-400/60" />
                <span className="text-sm text-purple-400/60 font-mono">
                  Resets in 3d
                </span>
              </div>

              <div className="grid gap-4">
                {weeklyQuests.map((quest) => (
                  <Card
                    key={quest.id}
                    className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-purple-500/30 p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white">
                            {quest.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${getDifficultyColor(
                              quest.difficulty
                            )} bg-slate-800/50 border border-current`}
                          >
                            RANK {quest.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {quest.description}
                        </p>
                      </div>
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

        {activeTab === "dungeons" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dungeons.map((dungeon) => (
              <Card
                key={dungeon.id}
                className={`relative overflow-hidden p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 transition-all ${
                  dungeon.status === "locked"
                    ? "border-slate-700/50 opacity-60"
                    : "border-red-500/40 hover:border-red-500/60 hover:scale-105 cursor-pointer"
                }`}
                onClick={() =>
                  dungeon.status === "available" && enterDungeon(dungeon)
                }
              >
                {dungeon.status === "locked" && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-6 h-6 text-slate-600" />
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Skull className="w-6 h-6 text-red-400" />
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${getDifficultyColor(
                        dungeon.difficulty
                      )} bg-slate-800/50 border border-current`}
                    >
                      RANK {dungeon.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {dungeon.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    {dungeon.description}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requirement:</span>
                      <span className="text-slate-300 font-bold">
                        {dungeon.requirement}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chapters:</span>
                      <span className="text-cyan-300 font-bold">
                        {dungeon.chapters}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time Limit:</span>
                      <span className="text-orange-300 font-bold">
                        {dungeon.timeLimit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-red-500/20">
                  <p className="text-xs text-slate-500 mb-2">REWARDS</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-bold text-yellow-300">
                        +{dungeon.reward.xp} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-300">
                        {dungeon.reward.item}
                      </span>
                    </div>
                  </div>
                </div>

                {dungeon.status === "available" && (
                  <Button className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 font-black">
                    ENTER GATE
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                    <h3 className="text-base font-bold text-white mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      {achievement.description}
                    </p>

                    <div
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 ${
                        achievement.unlocked
                          ? `bg-gradient-to-r ${getRarityColor(
                              achievement.rarity
                            )} text-white`
                          : "bg-slate-800 text-slate-600"
                      }`}
                    >
                      {achievement.rarity}
                    </div>

                    {achievement.unlocked && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3 h-3" />
                        <span className="text-xs font-bold">
                          +{achievement.reward} XP
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <Card
                key={skill.id}
                className={`p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 ${
                  skill.unlocked ? "border-cyan-500/40" : "border-slate-700/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {skill.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-2">
                      {skill.description}
                    </p>
                    <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-300 font-mono inline-block">
                      {skill.effect}
                    </div>
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
                    disabled={
                      skill.level >= skill.maxLevel ||
                      userData.skillPoints < skill.cost
                    }
                    onClick={() => upgradeSkill(skill.id)}
                    className={`w-full font-bold ${
                      skill.level < skill.maxLevel &&
                      userData.skillPoints >= skill.cost
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {skill.level >= skill.maxLevel
                      ? "Maxed"
                      : `Upgrade (${skill.cost} SP)`}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "titles" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {titles.map((title) => (
              <Card
                key={title.id}
                className={`p-6 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 transition-all ${
                  title.equipped
                    ? "border-yellow-500/60 shadow-lg shadow-yellow-500/20"
                    : title.unlocked
                    ? "border-cyan-500/40 hover:border-cyan-500/60 cursor-pointer"
                    : "border-slate-700/50 opacity-50"
                }`}
                onClick={() => title.unlocked && equipTitle(title.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <Crown
                    className={`w-8 h-8 ${
                      title.equipped
                        ? "text-yellow-400"
                        : title.unlocked
                        ? "text-cyan-400"
                        : "text-slate-600"
                    }`}
                  />
                  {!title.unlocked && (
                    <Lock className="w-5 h-5 text-slate-600" />
                  )}
                  {title.equipped && (
                    <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                      <span className="text-xs font-bold text-yellow-300">
                        EQUIPPED
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {title.name}
                </h3>

                {title.unlocked && !title.equipped && (
                  <Button className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-bold text-sm">
                    Equip Title
                  </Button>
                )}
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
                  title: "Shadow Monarch",
                  avatar: "adventurer-1",
                },
                {
                  rank: 2,
                  name: "HunterKing",
                  level: 72,
                  power: 12453,
                  title: "S-Rank Hunter",
                  avatar: "adventurer-2",
                },
                {
                  rank: 3,
                  name: "GateBreaker",
                  level: 65,
                  power: 10982,
                  title: "Gate Breaker",
                  avatar: "adventurer-3",
                },
                {
                  rank: 4,
                  name: "You",
                  level: userData.level,
                  power: userData.power,
                  title: titles.find((t) => t.equipped)?.name || "Hunter",
                  avatar: "adventurer-4",
                  isUser: true,
                },
                {
                  rank: 5,
                  name: "DarkSlayer",
                  level: 48,
                  power: 8234,
                  title: "Rising Star",
                  avatar: "adventurer-5",
                },
              ].map((hunter) => (
                <div
                  key={hunter.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    hunter.isUser
                      ? "bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                      : "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-center justify-center w-12">
                    {hunter.rank <= 3 ? (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-lg ${
                          hunter.rank === 1
                            ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-yellow-500/50"
                            : hunter.rank === 2
                            ? "bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-gray-500/50"
                            : "bg-gradient-to-br from-orange-700 to-orange-800 text-white shadow-orange-700/50"
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

                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-500/40 shadow-lg">
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${hunter.avatar}`}
                      alt={hunter.name}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {hunter.name}
                      {hunter.isUser && (
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Level {hunter.level}
                    </p>
                    <p className="text-xs text-cyan-400/60">{hunter.title}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-cyan-300">
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
              addXp(150);
              runConfetti(50);
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/50 transition-transform hover:scale-110 animate-pulse"
            title="Test XP Gain"
          >
            <ArrowUp className="w-6 h-6 text-white" />
          </button>
        </div>
      </main>

      <Footer />

      {/* Level Up Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-3xl animate-pulse" />

            <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/50 p-8 text-center shadow-2xl">
              <button
                onClick={() => setShowLevelUp(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 animate-pulse shadow-2xl shadow-cyan-500/50">
                  <Zap className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-black text-cyan-400 mb-2 uppercase tracking-wider">
                  Level Up!
                </h2>
                <p className="text-7xl font-black text-white mb-4">
                  {userData.level}
                </p>
                <p className="text-cyan-400/60 font-mono text-sm uppercase tracking-widest">
                  Congratulations, Hunter
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-cyan-500/30">
                  <span className="text-cyan-400 font-mono text-xs block mb-1">
                    STR
                  </span>
                  <span className="text-white font-bold text-lg">+12</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-purple-500/30">
                  <span className="text-purple-400 font-mono text-xs block mb-1">
                    AGI
                  </span>
                  <span className="text-white font-bold text-lg">+8</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-orange-500/30">
                  <span className="text-orange-400 font-mono text-xs block mb-1">
                    VIT
                  </span>
                  <span className="text-white font-bold text-lg">+10</span>
                </div>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-yellow-500/30">
                  <span className="text-yellow-400 font-mono text-xs block mb-1">
                    SP
                  </span>
                  <span className="text-white font-bold text-lg">+3</span>
                </div>
              </div>

              <Button
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-black text-lg py-6 shadow-lg shadow-cyan-500/30"
              >
                ACCEPT REWARDS
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Daily Reward Modal */}
      {showDailyReward && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full">
            <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-yellow-500/50 p-6 shadow-2xl">
              <button
                onClick={() => setShowDailyReward(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-yellow-400 mb-2 uppercase tracking-wider">
                  Daily Rewards
                </h2>
                <p className="text-sm text-slate-400 font-mono">
                  Claim your daily login bonus
                </p>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const claimed = claimedDays.includes(day);
                  const current = day === getCurrentDayOfWeekOrdinal();
                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-105 ${
                        claimed
                          ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50"
                          : current
                          ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 animate-pulse"
                          : "bg-slate-900/50 border-slate-700/50 hover:border-slate-600"
                      }`}
                      onClick={() => {
                        if (!claimed && day <= getCurrentDayOfWeekOrdinal()) {
                          claimDailyReward(day);
                        }
                      }}
                    >
                      <Calendar
                        className={`w-4 h-4 ${
                          claimed
                            ? "text-green-400"
                            : current
                            ? "text-yellow-400"
                            : "text-slate-600"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold mt-1 ${
                          claimed
                            ? "text-green-300"
                            : current
                            ? "text-yellow-300"
                            : "text-slate-600"
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-400 mb-3 font-mono">
                  TODAY'S REWARD
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-bold">
                      +{25 + getCurrentDayOfWeekOrdinal() * 15} XP
                    </span>
                  </div>
                  {getCurrentDayOfWeekOrdinal() === 7 && (
                    <div className="flex items-center gap-3">
                      <Crown className="w-5 h-5 text-purple-400" />
                      <span className="text-purple-300 font-bold">
                        Exclusive Avatar Frame
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const today = getCurrentDayOfWeekOrdinal();
                    if (!claimedDays.includes(today)) {
                      claimDailyReward(today);
                      setShowDailyReward(false);
                    }
                  }}
                  disabled={claimedDays.includes(getCurrentDayOfWeekOrdinal())}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-700 font-black text-lg py-4 shadow-lg"
                >
                  {claimedDays.includes(getCurrentDayOfWeekOrdinal())
                    ? "Already Claimed"
                    : "CLAIM REWARD"}
                </Button>
              </div>

              <p className="text-center text-xs text-slate-500 mt-4 font-mono">
                Day 7 Bonus: Special Title + Premium Avatar
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Dungeon Entry Modal */}
      {showDungeonModal && selectedDungeon && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-orange-500/20 to-red-500/20 blur-3xl animate-pulse" />

            <Card className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-red-500/50 p-8 shadow-2xl">
              <button
                onClick={() => setShowDungeonModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/50">
                  <Skull className="w-10 h-10 text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-white">
                      {selectedDungeon.name}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-black ${getDifficultyColor(
                        selectedDungeon.difficulty
                      )} bg-slate-800/50 border-2 border-current`}
                    >
                      RANK {selectedDungeon.difficulty}
                    </span>
                  </div>
                  <p className="text-slate-400">
                    {selectedDungeon.description}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-red-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">
                  Dungeon Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Requirement</span>
                    <span className="text-white font-bold">
                      {selectedDungeon.requirement}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Chapters</span>
                    <span className="text-cyan-300 font-bold">
                      {selectedDungeon.chapters}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Time Limit</span>
                    <span className="text-orange-300 font-bold">
                      {selectedDungeon.timeLimit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700/50">
                    <span className="text-slate-400 text-sm">Difficulty</span>
                    <span
                      className={`font-black ${getDifficultyColor(
                        selectedDungeon.difficulty
                      )}`}
                    >
                      RANK {selectedDungeon.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-sm font-bold text-yellow-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Rewards Upon Completion
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded border border-yellow-500/20">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">
                        Experience Points
                      </p>
                      <p className="text-lg font-black text-yellow-300">
                        +{selectedDungeon.reward.xp} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded border border-purple-500/20">
                    <Gift className="w-6 h-6 text-purple-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Special Item</p>
                      <p className="text-base font-bold text-purple-300">
                        {selectedDungeon.reward.item}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-bold text-sm mb-1">
                      Warning
                    </p>
                    <p className="text-slate-400 text-xs">
                      Once you enter this gate, you must complete all{" "}
                      {selectedDungeon.chapters} chapters within the time limit.
                      Failure will result in losing the entry fee and no
                      rewards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDungeonModal(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowDungeonModal(false);
                    runConfetti(60);
                    // In real app: navigate to dungeon reading mode
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 font-black text-lg shadow-lg shadow-red-500/30"
                >
                  ENTER GATE
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function getCurrentDayOfWeekOrdinal() {
  const d = new Date();
  const jsDay = d.getDay();
  if (jsDay === 0) return 7;
  return jsDay;
}
