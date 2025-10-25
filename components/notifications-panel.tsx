"use client";

import { useNotifications } from "@/lib/notifications-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";

export function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_chapter":
        return "bg-cyan-500/10 text-cyan-400";
      case "favorite":
        return "bg-pink-500/10 text-pink-400";
      case "donation":
        return "bg-purple-500/10 text-purple-400";
      case "update":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "bg-slate-800/50 text-slate-300";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_chapter":
        return "📖";
      case "favorite":
        return "❤️";
      case "donation":
        return "🎁";
      case "update":
        return "✨";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:text-pink-800 rounded-lg transition-colors text-slate-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-cyan-500 to-blue-500">
            {unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-gradient-to-b from-slate-900/95 to-slate-900/90 border border-cyan-500/20 rounded-lg shadow-2xl shadow-cyan-500/10 z-50 backdrop-blur-xl">
          <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-slate-900/60 to-slate-900/30">
            <h3 className="font-semibold text-slate-100">Notifications</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="gap-1 text-xs hover:bg-slate-800/50 text-slate-300"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="gap-1 text-xs hover:bg-slate-800/50 text-slate-300"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-800/50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      !notification.read
                        ? "bg-slate-800/30"
                        : "hover:bg-slate-800/20"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-sm text-slate-100">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-slate-500 hover:text-slate-300 flex-shrink-0 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">
                            {new Date(
                              notification.timestamp
                            ).toLocaleTimeString()}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-auto p-0 text-cyan-400 hover:bg-transparent hover:text-cyan-300"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close on outside click */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
