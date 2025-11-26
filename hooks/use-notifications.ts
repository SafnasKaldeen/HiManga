// hooks/use-notifications.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  manga_id: string | null
  chapter_id: string | null
  data: any | null
  read: boolean
  created_at: string
  expires_at: string
}

const CACHE_KEY = "notifications_cache"
const CACHE_DURATION = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

interface CachedData {
  notifications: Notification[]
  timestamp: number
  unreadCount: number
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Invalidate cache helper
  const invalidateCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
  }, [])

  // Update cache helper
  const updateCache = useCallback((newNotifications: Notification[]) => {
    const unread = newNotifications.filter((n) => !n.read).length
    const cacheData: CachedData = {
      notifications: newNotifications,
      timestamp: Date.now(),
      unreadCount: unread,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  }, [])

  // Load from cache or fetch fresh data
  const loadNotifications = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setIsLoaded(true)
      return
    }

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const cachedData: CachedData = JSON.parse(cached)
          const now = Date.now()
          
          // Use cache if it's less than 2 hours old
          if (now - cachedData.timestamp < CACHE_DURATION) {
            setNotifications(cachedData.notifications)
            setUnreadCount(cachedData.unreadCount)
            setIsLoaded(true)
            return
          }
        }
      }

      // Fetch fresh data from Supabase
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error

      const notificationData = data || []
      const unread = notificationData.filter((n) => !n.read).length

      // Update state
      setNotifications(notificationData)
      setUnreadCount(unread)
      setError(null)

      // Update cache
      updateCache(notificationData)
    } catch (err) {
      console.error("Failed to load notifications:", err)
      setError(err instanceof Error ? err.message : "Failed to load notifications")
    } finally {
      setIsLoaded(true)
    }
  }, [userId, updateCache])

  // Initial load and setup auto-refresh
  useEffect(() => {
    loadNotifications()

    // Set up interval to check cache expiry every minute
    const interval = setInterval(() => {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const cachedData: CachedData = JSON.parse(cached)
        const now = Date.now()
        
        // Refresh if cache expired
        if (now - cachedData.timestamp >= CACHE_DURATION) {
          loadNotifications(true)
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [loadNotifications])

  // Mark notification as read (only updates cache, no refetch)
  const markAsRead = async (id: string) => {
    if (!userId) {
      setError("User must be logged in")
      return false
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) throw error

      // Update local state
      const updatedNotifications = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      setNotifications(updatedNotifications)
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // Update cache
      updateCache(updatedNotifications)

      return true
    } catch (err) {
      console.error("Failed to mark as read:", err)
      setError(err instanceof Error ? err.message : "Failed to mark as read")
      return false
    }
  }

  // Mark all notifications as read (only updates cache, no refetch)
  const markAllAsRead = async () => {
    if (!userId) {
      setError("User must be logged in")
      return false
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) throw error

      // Update local state
      const updatedNotifications = notifications.map((n) => ({ ...n, read: true }))
      setNotifications(updatedNotifications)
      setUnreadCount(0)

      // Update cache
      updateCache(updatedNotifications)

      return true
    } catch (err) {
      console.error("Failed to mark all as read:", err)
      setError(err instanceof Error ? err.message : "Failed to mark all as read")
      return false
    }
  }

  // Remove notification (invalidates cache and refetches)
  const removeNotification = async (id: string) => {
    if (!userId) {
      setError("User must be logged in")
      return false
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)

      if (error) throw error

      // Invalidate cache and refetch
      invalidateCache()
      await loadNotifications(true)

      return true
    } catch (err) {
      console.error("Failed to remove notification:", err)
      setError(err instanceof Error ? err.message : "Failed to remove notification")
      return false
    }
  }

  // Clear all notifications (invalidates cache and refetches)
  const clearAll = async () => {
    if (!userId) {
      setError("User must be logged in")
      return false
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)

      if (error) throw error

      // Invalidate cache and refetch
      invalidateCache()
      await loadNotifications(true)

      return true
    } catch (err) {
      console.error("Failed to clear all notifications:", err)
      setError(err instanceof Error ? err.message : "Failed to clear all")
      return false
    }
  }

  // Update notification (invalidates cache and refetches)
  const updateNotification = async (id: string, updates: Partial<Notification>) => {
    if (!userId) {
      setError("User must be logged in")
      return false
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)

      if (error) throw error

      // Invalidate cache and refetch
      invalidateCache()
      await loadNotifications(true)

      return true
    } catch (err) {
      console.error("Failed to update notification:", err)
      setError(err instanceof Error ? err.message : "Failed to update notification")
      return false
    }
  }

  // Force refresh notifications (invalidates cache)
  const refresh = useCallback(() => {
    invalidateCache()
    loadNotifications(true)
  }, [invalidateCache, loadNotifications])

  return {
    notifications,
    unreadCount,
    isLoaded,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateNotification,
    refresh,
  }
}