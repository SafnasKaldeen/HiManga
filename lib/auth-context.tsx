// lib/auth-context.tsx
"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { 
  signUp as supabaseSignUp, 
  signIn as supabaseSignIn, 
  getUserProfile,
  updateUserProfile 
} from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  avatarId?: number;
  xp: number;
  rank: string;
  totalPanelsRead: number;
  totalMangasRead: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert database user to User type
  const convertToUser = (data: any): User => ({
    id: data.id,
    email: data.email || "",
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    avatarId: data.avatar_id,
    xp: data.xp,
    rank: data.rank,
    totalPanelsRead: data.total_panels_read,
    totalMangasRead: data.total_mangas_read,
    createdAt: data.created_at,
  });

  // In lib/auth-context.tsx - update the useEffect
useEffect(() => {
  const loadUser = async () => {
    try {
      const savedUserId = localStorage.getItem("userId");
      console.log("Loading user with ID:", savedUserId);
      
      if (savedUserId) {
        const profile = await getUserProfile(savedUserId);
        console.log("Loaded user profile:", profile);
        setUser(convertToUser(profile));
      }
    } catch (error) {
      console.error("Error loading user:", error);
      localStorage.removeItem("userId");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  loadUser();
}, []);

  // Sign In with Supabase Auth
export async function signIn(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw new Error(authError.message);

  // Get user profile
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) throw new Error("User profile not found");

  return profileData;
}

  const login = async (email: string, password: string) => {
    try {
      const data = await supabaseSignIn(email, password);
      const userData = convertToUser(data);
      
      setUser(userData);
      localStorage.setItem("userId", data.id);
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to login");
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      // Basic validation
      if (!email || !username || !password) {
        throw new Error("All fields are required");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      console.log("Starting signup...", { email, username });

      const data = await supabaseSignUp(email, password, username);
      
      console.log("Signup successful!", data);

      const userData = convertToUser(data);

      setUser(userData);
      localStorage.setItem("userId", data.id);
    } catch (error: any) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Failed to create account");
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem("userId");
    } catch (error: any) {
      console.error("Logout error:", error);
      throw new Error(error.message || "Failed to logout");
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error("No user logged in");

      const updatedData = await updateUserProfile(user.id, updates);
      setUser(convertToUser(updatedData));
    } catch (error: any) {
      console.error("Update profile error:", error);
      throw new Error(error.message || "Failed to update profile");
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;
      const profile = await getUserProfile(user.id);
      setUser(convertToUser(profile));
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

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
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}