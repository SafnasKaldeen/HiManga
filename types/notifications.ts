// types/notifications.ts

export type NotificationType =
  | "new_chapter"
  | "continue_reading"
  | "manga_completed"
  | "milestone"
  | "rank_up"
  | "popular_chapter"
  | "rating_milestone"
  | "catch_up"
  | "daily_login"
  | "reading_streak"
  | "inactivity"
  | "weekend_binge"
  | "recommendation"
  | "community"
  | "anniversary"
  | "power_hour"
  | "challenge"
  | "social_proof"
  | "cliffhanger";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    mangaId?: string;
    mangaTitle?: string;
    chapterNumber?: number;
    xpGained?: number;
    oldRank?: string;
    newRank?: string;
    streakDays?: number;
    actionUrl?: string;
    expiresAt?: string;
  };
}

export interface NotificationPreferences {
  userId: string;
  enableNewChapters: boolean;
  enableMilestones: boolean;
  enableReminders: boolean;
  enableEngagement: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
}

export const RANK_THRESHOLDS = {
  "Beginner Reader": 0,
  "E-Rank Hunter": 500,
  "D-Rank Hunter": 1500,
  "C-Rank Hunter": 3500,
  "B-Rank Hunter": 7500,
  "A-Rank Hunter": 15000,
  "S-Rank Hunter": 30000,
  "National Level Hunter": 60000,
  "Shadow Monarch": 100000,
};

export const XP_REWARDS = {
  panelRead: 1,
  chapterComplete: 10,
  mangaComplete: 50,
  dailyLogin: 50,
  weekendBinge: 100,
  challengeComplete: 200,
};