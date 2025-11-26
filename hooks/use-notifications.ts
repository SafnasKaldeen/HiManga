// hooks/use-notifications.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  manga_id: string | null;
  chapter_id: string | null;
  data: any | null;
  read: boolean;
  created_at: string;
  expires_at: string | null;
}

const CACHE_KEY = "notifications_cache";
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = (uid: string) => `${CACHE_KEY}_${uid}`;

  const loadFromCache = useCallback((uid: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(uid));
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age < CACHE_DURATION) {
        return parsed;
      } else {
        localStorage.removeItem(getCacheKey(uid));
        return null;
      }
    } catch (e) {
      console.error("Error reading notifications cache:", e);
      return null;
    }
  }, []);

  const saveToCache = useCallback((uid: string, data: Notification[]) => {
    try {
      const unread = data.filter((n) => !n.read).length;
      localStorage.setItem(
        getCacheKey(uid),
        JSON.stringify({
          notifications: data,
          unreadCount: unread,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error("Error saving notifications cache:", e);
    }
  }, []);

  const invalidateCache = useCallback((uid: string) => {
    localStorage.removeItem(getCacheKey(uid));
  }, []);

  const loadNotifications = useCallback(async (force = false) => {
    if (!userId) {
      setIsLoaded(true);
      return;
    }

    // Try cache first unless force refresh
    if (!force) {
      const cached = loadFromCache(userId);
      if (cached) {
        setNotifications(cached.notifications);
        setUnreadCount(cached.unreadCount);
        setIsLoaded(true);
        return;
      }
    }

    try {
      const currentTime = new Date().toISOString();
      
      const { data, error: supaError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .or(`expires_at.is.null,expires_at.gt.${currentTime}`)
        .order("created_at", { ascending: false });

      if (supaError) throw supaError;

      const rows = data || [];
      const unread = rows.filter((n) => !n.read).length;

      setNotifications(rows);
      setUnreadCount(unread);
      setError(null);
      
      // Save to cache
      saveToCache(userId, rows);
    } catch (e: any) {
      console.error("Failed to load notifications:", e.message);
      setError(e.message);
    } finally {
      setIsLoaded(true);
    }
  }, [userId, loadFromCache, saveToCache]);

  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    if (!userId) return;

    await supabase.from("notifications").update({ read: true }).eq("id", id);

    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount((c) => Math.max(0, c - 1));
    
    // Update cache immediately
    saveToCache(userId, updated);
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    
    // Update cache immediately
    saveToCache(userId, updated);
  };

  const removeNotification = async (id: string) => {
    if (!userId) return;

    await supabase.from("notifications").delete().eq("id", id);

    const updated = notifications.filter((n) => n.id !== id);
    const unread = updated.filter((n) => !n.read).length;
    setNotifications(updated);
    setUnreadCount(unread);
    
    // Update cache immediately
    saveToCache(userId, updated);
  };

  const clearAll = async () => {
    if (!userId) return;

    await supabase.from("notifications").delete().eq("user_id", userId);

    setNotifications([]);
    setUnreadCount(0);
    
    // Clear cache completely
    if (userId) invalidateCache(userId);
  };

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (userId && e.key === getCacheKey(userId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setNotifications(parsed.notifications);
          setUnreadCount(parsed.unreadCount);
        } catch (err) {
          console.error("Error syncing notifications from storage:", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  // Set up real-time subscription for database changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification change detected:', payload.eventType);
          // Revalidate by fetching fresh data
          loadNotifications(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoaded,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refresh: () => loadNotifications(true),
  };
}