"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface Notification {
  id: string
  type: "update" | "new_chapter" | "favorite" | "donation" | "info"
  title: string
  message: string
  timestamp: number
  read: boolean
  mangaId?: string
  chapterNumber?: number
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  subscribedMangas: string[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  subscribeManga: (mangaId: string) => void
  unsubscribeManga: (mangaId: string) => void
  isSubscribed: (mangaId: string) => boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [subscribedMangas, setSubscribedMangas] = useState<string[]>([])

  // Load notifications and subscriptions from localStorage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem("manga-notifications")
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications))
      } catch (error) {
        console.error("Failed to load notifications:", error)
      }
    }

    const storedSubscriptions = localStorage.getItem("manga-subscriptions")
    if (storedSubscriptions) {
      try {
        setSubscribedMangas(JSON.parse(storedSubscriptions))
      } catch (error) {
        console.error("Failed to load subscriptions:", error)
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("manga-notifications", JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem("manga-subscriptions", JSON.stringify(subscribedMangas))
  }, [subscribedMangas])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const subscribeManga = (mangaId: string) => {
    setSubscribedMangas((prev) => (prev.includes(mangaId) ? prev : [...prev, mangaId]))
  }

  const unsubscribeManga = (mangaId: string) => {
    setSubscribedMangas((prev) => prev.filter((id) => id !== mangaId))
  }

  const isSubscribed = (mangaId: string) => {
    return subscribedMangas.includes(mangaId)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        subscribedMangas,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        subscribeManga,
        unsubscribeManga,
        isSubscribed,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
