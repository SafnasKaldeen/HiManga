"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  createdAt: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("manga-user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to load user:", error)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock validation
    if (!email || !password) {
      throw new Error("Email and password are required")
    }

    if (!email.includes("@")) {
      throw new Error("Invalid email format")
    }

    // Create mock user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      username: email.split("@")[0],
      createdAt: Date.now(),
    }

    setUser(newUser)
    localStorage.setItem("manga-user", JSON.stringify(newUser))
  }

  const signup = async (email: string, username: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock validation
    if (!email || !username || !password) {
      throw new Error("All fields are required")
    }

    if (!email.includes("@")) {
      throw new Error("Invalid email format")
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }

    if (username.length < 3) {
      throw new Error("Username must be at least 3 characters")
    }

    // Create mock user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      username,
      createdAt: Date.now(),
    }

    setUser(newUser)
    localStorage.setItem("manga-user", JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("manga-user")
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem("manga-user", JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
