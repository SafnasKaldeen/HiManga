"use client";

import { Bell, X, CheckCheck, Trash2, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// This would come from your notifications context
// import { useNotifications } from "@/lib/notifications-context";

export default function NotificationsPanel() {
  // Mock data - replace with useNotifications hook
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "new_chapter",
      title: "NEW QUEST AVAILABLE",
      message: "Chapter 157 of 'Shadow Monarch' has been released",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      type: "favorite",
      title: "ACHIEVEMENT UNLOCKED",
      message: "Your favorite manga reached 1M views",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: 3,
      type: "donation",
      title: "REWARD RECEIVED",
      message: "You received 500 coins from a supporter",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_chapter":
        return "⚔️";
      case "favorite":
        return "👑";
      case "donation":
        return "💎";
      case "update":
        return "⚡";
      default:
        return "📋";
    }
  };

  const getRankColor = (type: string) => {
    switch (type) {
      case "new_chapter":
        return "from-blue-500 to-cyan-400";
      case "favorite":
        return "from-purple-500 to-pink-400";
      case "donation":
        return "from-yellow-500 to-orange-400";
      case "update":
        return "from-green-500 to-emerald-400";
      default:
        return "from-gray-500 to-slate-400";
    }
  };

  return (
    <>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:text-pink-500 rounded-lg transition-colors text-white/70"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-lg shadow-blue-500/50">
            {unreadCount}
          </div>
        )}
      </button>

      {/* Solo Leveling System Overlay */}
      {mounted &&
        isOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-fadeIn"
              onClick={() => setIsOpen(false)}
            />

            {/* Main Notification Panel */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-2xl animate-systemAppear">
                {/* Glowing Border Effect */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl animate-pulse" />

                  {/* Main Container */}
                  <div className="relative bg-gradient-to-b from-slate-900/95 to-black/95 border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
                    {/* Corner Decorations */}
                    <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-blue-400/50" />
                    <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-blue-400/50" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-blue-400/50" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-blue-400/50" />

                    {/* Header */}
                    <div className="relative border-b-2 border-blue-500/30 bg-gradient-to-r from-slate-900/60 via-blue-900/20 to-slate-900/60 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                            <Image
                              src="/logo.png"
                              alt="HiManga Logo"
                              width={40}
                              height={40}
                            />
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

                      {/* Action Buttons */}
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

                    {/* Notifications List */}
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
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              {/* Notification Card */}
                              <div
                                className={`relative bg-gradient-to-r ${
                                  !notification.read
                                    ? "from-slate-800/80 to-slate-900/80 border-2 border-blue-400/40"
                                    : "from-slate-800/40 to-slate-900/40 border-2 border-slate-700/40"
                                } p-4 transition-all duration-300 hover:border-blue-400/60 group-hover:shadow-lg group-hover:shadow-blue-500/20`}
                              >
                                {/* Rank Badge */}
                                <div className="absolute -left-2 -top-2 w-8 h-8">
                                  <div
                                    className={`w-full h-full bg-gradient-to-br ${getRankColor(
                                      notification.type
                                    )} rounded-full flex items-center justify-center text-lg shadow-lg animate-pulse`}
                                  >
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>

                                {/* Content */}
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

                                    {/* Footer */}
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                                      <span className="text-xs text-blue-400 font-bold tracking-wide uppercase">
                                        {new Date(
                                          notification.timestamp
                                        ).toLocaleTimeString()}
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

                                {/* Unread Indicator */}
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

                    {/* Bottom Bar */}
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
