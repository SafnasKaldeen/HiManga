// hooks/use-user-stats.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface UserStats {
  xp: number;
  rank: string;
  total_panels_read: number;
  total_mangas_read: number;
  level: number;
  xpToNextLevel: number;
  xpToNextRank: number;
  nextRankName: string;
  currentLevelXP: number;
  totalXP: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

const CACHE_KEY = "user_stats_cache";
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const XP_PER_LEVEL = 1000;

// Calculate level and XP breakdown from total XP
function calculateLevelData(totalXP: number) {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const currentLevelXP = totalXP % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - currentLevelXP;

  return {
    level,
    currentLevelXP,
    xpToNextLevel,
  };
}

// Determine rank based on total XP
function getRankFromXP(xp: number): string {
  if (xp >= 100000) return "Mythical Reader";
  if (xp >= 50000) return "Legendary Reader";
  if (xp >= 20000) return "Elite Reader";
  if (xp >= 10000) return "Master Reader";
  if (xp >= 5000) return "Expert Reader";
  if (xp >= 2500) return "Avid Reader";
  if (xp >= 1000) return "Dedicated Reader";
  if (xp >= 500) return "Regular Reader";
  if (xp >= 100) return "Casual Reader";
  return "Beginner Reader";
}

// Get the next rank threshold
function getNextRankThreshold(currentXP: number): { threshold: number; rankName: string } {
  if (currentXP < 100) return { threshold: 100, rankName: "Casual Reader" };
  if (currentXP < 500) return { threshold: 500, rankName: "Regular Reader" };
  if (currentXP < 1000) return { threshold: 1000, rankName: "Dedicated Reader" };
  if (currentXP < 2500) return { threshold: 2500, rankName: "Avid Reader" };
  if (currentXP < 5000) return { threshold: 5000, rankName: "Expert Reader" };
  if (currentXP < 10000) return { threshold: 10000, rankName: "Master Reader" };
  if (currentXP < 20000) return { threshold: 20000, rankName: "Elite Reader" };
  if (currentXP < 50000) return { threshold: 50000, rankName: "Legendary Reader" };
  if (currentXP < 100000) return { threshold: 100000, rankName: "Mythical Reader" };
  return { threshold: 100000, rankName: "Mythical Reader" }; // Max rank
}

export function useUserStats(userId: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = (uid: string) => `${CACHE_KEY}_${uid}`;

  const loadFromCache = useCallback((uid: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(uid));
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      if (age < CACHE_DURATION) {
        return parsed.stats;
      } else {
        localStorage.removeItem(getCacheKey(uid));
        return null;
      }
    } catch (e) {
      console.error("Error reading user stats cache:", e);
      return null;
    }
  }, []);

  const saveToCache = useCallback((uid: string, data: UserStats) => {
    try {
      localStorage.setItem(
        getCacheKey(uid),
        JSON.stringify({
          stats: data,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error("Error saving user stats cache:", e);
    }
  }, []);

  const invalidateCache = useCallback((uid: string) => {
    localStorage.removeItem(getCacheKey(uid));
  }, []);

  const loadStats = useCallback(
    async (force = false) => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Try cache first unless force refresh
      if (!force) {
        const cached = loadFromCache(userId);
        if (cached) {
          setStats(cached);
          setIsLoading(false);
          return;
        }
      }

      try {
        const { data, error: supaError } = await supabase
          .from("users")
          .select("xp, rank, total_panels_read, total_mangas_read")
          .eq("id", userId)
          .single();

        if (supaError) throw supaError;

        const totalXP = data.xp || 0;
        const levelData = calculateLevelData(totalXP);
        const nextRank = getNextRankThreshold(totalXP);

        const userStats: UserStats = {
          xp: totalXP,
          rank: data.rank || getRankFromXP(totalXP),
          total_panels_read: data.total_panels_read || 0,
          total_mangas_read: data.total_mangas_read || 0,
          level: levelData.level,
          currentLevelXP: levelData.currentLevelXP,
          xpToNextLevel: levelData.xpToNextLevel,
          xpToNextRank: nextRank.threshold - totalXP,
          nextRankName: nextRank.rankName,
          totalXP: totalXP,
        };

        setStats(userStats);
        setError(null);

        // Save to cache
        saveToCache(userId, userStats);
      } catch (e: any) {
        console.error("Failed to load user stats:", e.message);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, loadFromCache, saveToCache]
  );

  useEffect(() => {
    loadStats(false);
  }, [loadStats]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (userId && e.key === getCacheKey(userId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStats(parsed.stats);
        } catch (err) {
          console.error("Error syncing user stats from storage:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userId]);

  // Set up real-time subscription for user stats changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user_stats:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log("User stats updated:", payload.eventType);
          // Revalidate by fetching fresh data
          loadStats(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadStats]);

  const updateStats = useCallback(
    async (
      updates: Partial<
        Pick<
          UserStats,
          "xp" | "rank" | "total_panels_read" | "total_mangas_read"
        >
      >
    ) => {
      if (!userId || !stats) return false;

      try {
        // Prepare database updates
        const dbUpdates: Record<string, any> = {};
        if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
        if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
        if (updates.total_panels_read !== undefined)
          dbUpdates.total_panels_read = updates.total_panels_read;
        if (updates.total_mangas_read !== undefined)
          dbUpdates.total_mangas_read = updates.total_mangas_read;

        const { error: supaError } = await supabase
          .from("users")
          .update(dbUpdates)
          .eq("id", userId);

        if (supaError) throw supaError;

        // Calculate new level data if XP changed
        const newXP = updates.xp ?? stats.xp;
        const levelData = calculateLevelData(newXP);
        const newRank = updates.rank ?? getRankFromXP(newXP);
        const nextRank = getNextRankThreshold(newXP);

        // Update local state immediately (optimistic update)
        const updatedStats: UserStats = {
          ...stats,
          xp: newXP,
          rank: newRank,
          total_panels_read:
            updates.total_panels_read ?? stats.total_panels_read,
          total_mangas_read:
            updates.total_mangas_read ?? stats.total_mangas_read,
          level: levelData.level,
          currentLevelXP: levelData.currentLevelXP,
          xpToNextLevel: levelData.xpToNextLevel,
          xpToNextRank: nextRank.threshold - newXP,
          nextRankName: nextRank.rankName,
          totalXP: newXP,
        };

        setStats(updatedStats);
        saveToCache(userId, updatedStats);

        return true;
      } catch (e: any) {
        console.error("Failed to update user stats:", e.message);
        return false;
      }
    },
    [userId, stats, saveToCache]
  );

  const incrementPanelsRead = useCallback(
    async (count: number = 1, xpReward: number = 10) => {
      if (!stats) return false;

      return updateStats({
        total_panels_read: stats.total_panels_read + count,
        xp: stats.xp + xpReward * count,
      });
    },
    [stats, updateStats]
  );

  const incrementMangasRead = useCallback(
    async (count: number = 1, xpReward: number = 100) => {
      if (!stats) return false;

      return updateStats({
        total_mangas_read: stats.total_mangas_read + count,
        xp: stats.xp + xpReward * count,
      });
    },
    [stats, updateStats]
  );

  const addXP = useCallback(
    async (amount: number) => {
      if (!stats) return { success: false, leveledUp: false, newLevel: 1 };

      const newXP = stats.xp + amount;
      const oldLevel = stats.level;
      const newLevelData = calculateLevelData(newXP);

      // Check if leveled up
      const leveledUp = newLevelData.level > oldLevel;

      const success = await updateStats({
        xp: newXP,
        rank: getRankFromXP(newXP),
      });

      return { success, leveledUp, newLevel: newLevelData.level };
    },
    [stats, updateStats]
  );

  const getProgressPercentage = useCallback(() => {
    if (!stats) return 0;
    return (stats.currentLevelXP / XP_PER_LEVEL) * 100;
  }, [stats]);

  return {
    stats,
    isLoading,
    error,
    updateStats,
    incrementPanelsRead,
    incrementMangasRead,
    addXP,
    getProgressPercentage,
    refresh: () => loadStats(true),
    invalidateCache: () => userId && invalidateCache(userId),
  };
}