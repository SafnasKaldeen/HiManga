// Core types for the manga reading app

export interface Manga {
  id: string
  title: string
  author: string
  description: string
  coverImage: string
  rating: number
  status: "ongoing" | "completed"
  genre: string[]
  chapters: Chapter[]
  views: number
  followers: number
  createdAt: string
}

export interface Chapter {
  id: string
  mangaId: string
  number: number
  title: string
  pages: string[]
  releaseDate: string
  views: number
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  bookmarks: string[] // manga IDs
  favorites: string[] // manga IDs
  readingHistory: ReadingHistory[]
}

export interface ReadingHistory {
  mangaId: string
  chapterId: string
  lastReadPage: number
  lastReadAt: string
}

export interface Notification {
  id: string
  userId: string
  mangaId: string
  type: "new-chapter" | "new-release"
  message: string
  read: boolean
  createdAt: string
}
