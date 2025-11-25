import { Bell, X, CheckCheck, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Mock notifications data
const generateNotifications = () => {
  const now = Date.now();
  const manga = [
    "Solo Leveling",
    "Tower of God",
    "The Beginning After The End",
    "Omniscient Reader",
    "Second Life Ranker",
    "Tomb Raider King",
    "The Gamer",
    "Hardcore Leveling",
    "Overgeared",
    "Sorcerer King",
    "One Piece",
    "Naruto",
    "Bleach",
    "My Hero Academia",
    "Attack on Titan",
    "Demon Slayer",
    "Jujutsu Kaisen",
    "Chainsaw Man",
    "Spy x Family",
    "Vinland Saga",
  ];

  return [
    {
      id: "1",
      type: "new_chapter",
      title: "⚔️ NEW QUEST AVAILABLE",
      message: `Chapter 179 of '${manga[0]}' has been released. The Shadow Army awaits!`,
      timestamp: new Date(now - 5 * 60000).toISOString(),
      read: false,
    },
    {
      id: "2",
      type: "new_chapter",
      title: "⚔️ THE JOURNEY CONTINUES",
      message: `Chapter 1095 of '${manga[10]}' is now available. Set sail with the crew!`,
      timestamp: new Date(now - 15 * 60000).toISOString(),
      read: false,
    },
    {
      id: "3",
      type: "new_chapter",
      title: "⚔️ NEW DUNGEON DISCOVERED",
      message: `Chapter 523 of '${manga[1]}' just dropped. Climb higher, Hunter!`,
      timestamp: new Date(now - 30 * 60000).toISOString(),
      read: false,
    },
    {
      id: "4",
      type: "rank_up",
      title: "👑 RANK UP!",
      message:
        "You've ascended from E-Rank Hunter to D-Rank Hunter! New abilities unlocked.",
      timestamp: new Date(now - 45 * 60000).toISOString(),
      read: false,
    },
    {
      id: "5",
      type: "milestone",
      title: "🏆 ACHIEVEMENT UNLOCKED",
      message: "You've read 1,000 panels! The System rewards you with 500 XP.",
      timestamp: new Date(now - 60 * 60000).toISOString(),
      read: false,
    },
    {
      id: "6",
      type: "continue_reading",
      title: "📖 YOUR QUEST AWAITS",
      message: `You left off at Chapter 45 of '${manga[4]}'. Continue your journey!`,
      timestamp: new Date(now - 90 * 60000).toISOString(),
      read: false,
    },
    {
      id: "7",
      type: "daily_login",
      title: "⭐ DAILY QUEST COMPLETED",
      message: "Welcome back, Hunter! Daily login reward: 50 XP claimed!",
      timestamp: new Date(now - 120 * 60000).toISOString(),
      read: false,
    },
    {
      id: "8",
      type: "reading_streak",
      title: "🔥 7-DAY STREAK!",
      message: "The System rewards your dedication! Bonus 350 XP earned!",
      timestamp: new Date(now - 150 * 60000).toISOString(),
      read: false,
    },
    {
      id: "9",
      type: "popular_chapter",
      title: "🔥 TRENDING NOW!",
      message: `Chapter 180 of '${manga[0]}' - 50K+ hunters reading right now!`,
      timestamp: new Date(now - 2 * 3600000).toISOString(),
      read: false,
    },
    {
      id: "10",
      type: "catch_up",
      title: "⚠️ YOU'RE FALLING BEHIND!",
      message: `5 new chapters of '${manga[0]}' released! Time to catch up!`,
      timestamp: new Date(now - 3 * 3600000).toISOString(),
      read: false,
    },
    {
      id: "11",
      type: "weekend_binge",
      title: "🎯 WEEKEND RAID EVENT",
      message:
        "Double XP active for 48 hours! Time to marathon your favorites!",
      timestamp: new Date(now - 4 * 3600000).toISOString(),
      read: false,
    },
    {
      id: "12",
      type: "power_hour",
      title: "⚡ POWER HOUR ACTIVE",
      message: "Triple XP for the next 60 minutes! The System is generous!",
      timestamp: new Date(now - 5 * 3600000).toISOString(),
      read: false,
    },
    {
      id: "13",
      type: "new_chapter",
      title: "⚔️ QUEST UPDATE",
      message: `Chapter 145 of '${manga[2]}' is here. Your power grows!`,
      timestamp: new Date(now - 6 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "14",
      type: "milestone",
      title: "🏆 MILESTONE REACHED",
      message: "10 manga completed! You're a true Hunter. +1000 XP!",
      timestamp: new Date(now - 7 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "15",
      type: "challenge",
      title: "🎯 WEEKLY CHALLENGE",
      message: "Read 25 chapters this week to unlock 500 bonus XP!",
      timestamp: new Date(now - 8 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "16",
      type: "recommendation",
      title: "💎 NEW MANGA DETECTED",
      message: `Based on your S-Rank taste, try '${manga[9]}'!`,
      timestamp: new Date(now - 10 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "17",
      type: "social_proof",
      title: "👥 JOIN THE RAID",
      message: `999+ hunters reading '${manga[16]}' now. Don't miss out!`,
      timestamp: new Date(now - 12 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "18",
      type: "new_chapter",
      title: "⚔️ THE STORY UNFOLDS",
      message: `Chapter 167 of '${manga[3]}' awaits. Kim Dokja's scenario continues!`,
      timestamp: new Date(now - 14 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "19",
      type: "rank_up",
      title: "👑 POWER SURGE!",
      message:
        "D-Rank Hunter → C-Rank Hunter! The System acknowledges your growth.",
      timestamp: new Date(now - 16 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "20",
      type: "new_chapter",
      title: "⚔️ POWER SURGE DETECTED",
      message: `Chapter 238 of '${manga[16]}' is live. Domain Expansion incoming!`,
      timestamp: new Date(now - 18 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "21",
      type: "milestone",
      title: "🏆 LEGENDARY FEAT",
      message: "5,000 panels conquered! Your dedication is S-Rank level.",
      timestamp: new Date(now - 20 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "22",
      type: "continue_reading",
      title: "📖 UNFINISHED ADVENTURE",
      message: `'${manga[5]}' Chapter 78 waiting. Don't lose progress!`,
      timestamp: new Date(now - 22 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "23",
      type: "daily_login",
      title: "⭐ TREASURE CHEST",
      message: "Grand Line daily chest opened! 50 Gold coins + 50 XP!",
      timestamp: new Date(now - 24 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "24",
      type: "new_chapter",
      title: "⚔️ NEW MISSION UNLOCKED",
      message: `Chapter 156 of '${manga[17]}' released. Chainsaw Devil revs up!`,
      timestamp: new Date(now - 26 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "25",
      type: "catch_up",
      title: "⚠️ MULTIPLE UPDATES",
      message: `'${manga[1]}' has 3 new chapters. Don't lose your tower spot!`,
      timestamp: new Date(now - 28 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "26",
      type: "new_chapter",
      title: "⚔️ ADVENTURE AWAITS",
      message: `Chapter 89 of '${manga[18]}' ready. Operation Strix continues!`,
      timestamp: new Date(now - 30 * 3600000).toISOString(),
      read: true,
    },
    {
      id: "27",
      type: "reading_streak",
      title: "🔥 30-DAY STREAK!",
      message: "One month dedication! Legendary 2000 XP reward unlocked!",
      timestamp: new Date(now - 2 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "28",
      type: "milestone",
      title: "🏆 READING MASTER",
      message: "50 different manga explored! True adventurer status.",
      timestamp: new Date(now - 3 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "29",
      type: "rank_up",
      title: "👑 BREAKTHROUGH!",
      message: "C-Rank → B-Rank Hunter! Elite status achieved!",
      timestamp: new Date(now - 4 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "30",
      type: "challenge",
      title: "🎯 BOUNTY CHALLENGE",
      message: "Complete 3 manga series this month! Reward: 2000 XP + Badge!",
      timestamp: new Date(now - 5 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "31",
      type: "community",
      title: "🎉 PLATFORM MILESTONE",
      message: "100,000 hunters joined! Everyone gets 1000 bonus XP!",
      timestamp: new Date(now - 6 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "32",
      type: "new_chapter",
      title: "⚔️ BOSS BATTLE READY",
      message: `Chapter 412 of '${manga[8]}' arrived. Grid's legend grows!`,
      timestamp: new Date(now - 7 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "33",
      type: "recommendation",
      title: "💎 PERFECT MATCH",
      message: `Hunters like you rated '${manga[15]}' 5 stars. Worth exploring!`,
      timestamp: new Date(now - 8 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "34",
      type: "continue_reading",
      title: "📖 BOOKMARK REMINDER",
      message: `You're at Chapter 112 of '${manga[14]}'. Titans waiting!`,
      timestamp: new Date(now - 9 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "35",
      type: "new_chapter",
      title: "⚔️ LEVEL UP AVAILABLE",
      message: `Chapter 305 of '${manga[6]}' out. Gaming experience improves!`,
      timestamp: new Date(now - 10 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "36",
      type: "milestone",
      title: "🏆 SPEED READER",
      message: "100 chapters in one week! Your reading speed is incredible!",
      timestamp: new Date(now - 11 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "37",
      type: "rank_up",
      title: "👑 LEGENDARY ASCENSION",
      message: "B-Rank → A-Rank Hunter! You're among the elite now!",
      timestamp: new Date(now - 12 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "38",
      type: "popular_chapter",
      title: "🔥 COMMUNITY FAVORITE",
      message: `Chapter 523 of '${manga[1]}' breaking records! 100K+ views!`,
      timestamp: new Date(now - 13 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "39",
      type: "social_proof",
      title: "👥 MASSIVE TURNOUT",
      message: "5000+ readers joined today! Community grows stronger!",
      timestamp: new Date(now - 14 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "40",
      type: "anniversary",
      title: "🎂 ONE YEAR ANNIVERSARY",
      message: `One year since you started '${manga[0]}'! Relive your journey!`,
      timestamp: new Date(now - 15 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "41",
      type: "catch_up",
      title: "⚠️ BACKLOG ALERT",
      message: `8 chapters behind on '${manga[10]}'! Straw Hats sailing ahead!`,
      timestamp: new Date(now - 16 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "42",
      type: "reading_streak",
      title: "🔥 14-DAY STREAK!",
      message: "Two weeks strong! Your nakama are proud. 750 XP bonus!",
      timestamp: new Date(now - 17 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "43",
      type: "milestone",
      title: "🏆 NIGHT OWL READER",
      message: "10 consecutive midnight sessions! Dedication +100",
      timestamp: new Date(now - 18 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "44",
      type: "rank_up",
      title: "👑 S-RANK ACHIEVED",
      message: "A-Rank → S-Rank! Only a handful reach this level!",
      timestamp: new Date(now - 19 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "45",
      type: "continue_reading",
      title: "📖 RESUME YOUR JOURNEY",
      message: `Chapter 203 of '${manga[19]}' awaits. Thorfinn's saga!`,
      timestamp: new Date(now - 20 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "46",
      type: "milestone",
      title: "🏆 BINGE MASTER",
      message: "Completed 3 manga series in one day! Legendary stamina!",
      timestamp: new Date(now - 21 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "47",
      type: "recommendation",
      title: "💎 HIDDEN GEM",
      message: `'${manga[13]}' matches your history. Plus Ultra awaits!`,
      timestamp: new Date(now - 22 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "48",
      type: "rank_up",
      title: "👑 MONARCH STATUS",
      message: "S-Rank → National Level! The pinnacle of power!",
      timestamp: new Date(now - 23 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "49",
      type: "continue_reading",
      title: "📖 DON'T FORGET",
      message: `'${manga[7]}' Chapter 156 bookmarked. Hardcore journey continues!`,
      timestamp: new Date(now - 24 * 86400000).toISOString(),
      read: true,
    },
    {
      id: "50",
      type: "milestone",
      title: "🏆 PANEL PERFECTIONIST",
      message: "10,000 panels read! Approaching National Level status.",
      timestamp: new Date(now - 25 * 86400000).toISOString(),
      read: true,
    },
  ];
};

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState(generateNotifications());
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_chapter: "⚔️",
      rank_up: "👑",
      milestone: "🏆",
      continue_reading: "📖",
      daily_login: "⭐",
      reading_streak: "🔥",
      popular_chapter: "🔥",
      catch_up: "⚠️",
      weekend_binge: "🎯",
      power_hour: "⚡",
      challenge: "🎯",
      recommendation: "💎",
      social_proof: "👥",
      community: "🎉",
      anniversary: "🎂",
    };
    return icons[type] || "📋";
  };

  const getRankColor = (type) => {
    const colors = {
      new_chapter: "from-blue-500 to-cyan-400",
      rank_up: "from-purple-500 to-pink-400",
      milestone: "from-yellow-500 to-orange-400",
      continue_reading: "from-green-500 to-emerald-400",
      daily_login: "from-cyan-500 to-blue-400",
      reading_streak: "from-red-500 to-orange-500",
      popular_chapter: "from-orange-500 to-red-400",
      catch_up: "from-amber-500 to-yellow-400",
      weekend_binge: "from-purple-600 to-blue-500",
      power_hour: "from-yellow-400 to-orange-500",
      challenge: "from-indigo-500 to-purple-500",
      recommendation: "from-pink-500 to-purple-500",
      social_proof: "from-green-400 to-cyan-400",
      community: "from-pink-400 to-purple-400",
      anniversary: "from-rose-500 to-pink-400",
    };
    return colors[type] || "from-gray-500 to-slate-400";
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:text-pink-500 rounded-lg transition-colors text-white/70 z-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-lg shadow-blue-500/50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-fadeIn"
              onClick={() => setIsOpen(false)}
            />

            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-2xl animate-systemAppear">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl animate-pulse" />

                  <div className="relative bg-gradient-to-b from-slate-900/95 to-black/95 border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-blue-400/50" />
                    <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-blue-400/50" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-blue-400/50" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-blue-400/50" />

                    <div className="relative border-b-2 border-blue-500/30 bg-gradient-to-r from-slate-900/60 via-blue-900/20 to-slate-900/60 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <Bell className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl sm:text-3xl font-black tracking-wider text-white uppercase system-font">
                              Notifications
                            </h2>
                            <p className="text-blue-300 text-sm font-bold tracking-wide">
                              [ {unreadCount} UNREAD MESSAGES ]
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="text-slate-400 hover:text-white transition-colors duration-300 p-2 hover:bg-slate-800/50 rounded-lg"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      {notifications.length > 0 && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 transition-all duration-300 font-bold text-sm tracking-wide uppercase"
                          >
                            <CheckCheck className="w-4 h-4" />
                            Mark All Read
                          </button>
                          <button
                            onClick={clearAll}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-red-900/30 border border-blue-500/30 hover:border-red-500/50 text-blue-300 hover:text-red-300 transition-all duration-300 font-bold text-sm tracking-wide uppercase"
                          >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        <div className="p-4 space-y-3">
                          {notifications.map((notification, index) => (
                            <div
                              key={notification.id}
                              className={`relative group transition-all duration-300 ${
                                !notification.read
                                  ? "animate-slideIn"
                                  : "opacity-70 hover:opacity-100"
                              }`}
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              <div
                                className={`relative bg-gradient-to-r ${
                                  !notification.read
                                    ? "from-slate-800/80 to-slate-900/80 border-2 border-blue-400/40"
                                    : "from-slate-800/40 to-slate-900/40 border-2 border-slate-700/40"
                                } p-4 transition-all duration-300 hover:border-blue-400/60 group-hover:shadow-lg group-hover:shadow-blue-500/20`}
                              >
                                <div className="absolute -left-2 -top-2 w-8 h-8">
                                  <div
                                    className={`w-full h-full bg-gradient-to-br ${getRankColor(
                                      notification.type
                                    )} rounded-full flex items-center justify-center text-lg shadow-lg animate-pulse`}
                                  >
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>

                                <div className="flex gap-4 ml-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <h4 className="font-black text-lg text-white uppercase tracking-wider mb-2 system-font">
                                          {notification.title}
                                        </h4>
                                        <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                          {notification.message}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() =>
                                          removeNotification(notification.id)
                                        }
                                        className="text-slate-500 hover:text-red-400 transition-colors duration-300 p-1 hover:bg-slate-800/50 rounded"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                                      <span className="text-xs text-blue-400 font-bold tracking-wide uppercase">
                                        {formatTimestamp(
                                          notification.timestamp
                                        )}
                                      </span>
                                      {!notification.read && (
                                        <button
                                          onClick={() =>
                                            markAsRead(notification.id)
                                          }
                                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors duration-300 uppercase tracking-wide hover:underline"
                                        >
                                          → Mark as Read
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {!notification.read && (
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center">
                          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border-2 border-blue-500/20">
                            <Bell className="w-12 h-12 text-slate-600" />
                          </div>
                          <p className="text-xl font-black text-slate-500 uppercase tracking-wider system-font">
                            No Active Quests
                          </p>
                          <p className="text-sm text-slate-600 mt-2 font-medium">
                            All notifications have been cleared
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t-2 border-blue-500/30 bg-gradient-to-r from-slate-900/60 via-blue-900/20 to-slate-900/60 p-4">
                      <div className="flex items-center justify-between text-xs text-blue-400 font-bold tracking-wider uppercase">
                        <span>System Active</span>
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      <style jsx>{`
        .system-font {
          font-family: Impact, "Arial Black", sans-serif;
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes systemAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-systemAppear {
          animation: systemAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  );
}
