"use client"

import { Award, Flame, BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface UserProfileCardProps {
  username: string
  avatar?: string
  level: number
  xp: number
  totalChaptersRead: number
  currentStreak: number
  achievements: string[]
}

export function UserProfileCard({
  username,
  avatar,
  level,
  xp,
  totalChaptersRead,
  currentStreak,
  achievements,
}: UserProfileCardProps) {
  const xpForNextLevel = (level * 1000) % 1000
  const xpProgress = (xpForNextLevel / 1000) * 100

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-900/30 border-cyan-500/20 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-cyan-500/50">
          <AvatarImage src={avatar || "/placeholder.svg"} alt={username} />
          <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-bold text-cyan-400">{username}</h3>
          <p className="text-sm text-slate-400">Level {level}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Experience</span>
          <span className="text-cyan-400 font-semibold">{xpForNextLevel} / 1000 XP</span>
        </div>
        <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-cyan-500/20">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <BookOpen className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-200">{totalChaptersRead}</p>
          <p className="text-xs text-slate-400">Chapters</p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-200">{currentStreak}</p>
          <p className="text-xs text-slate-400">Day Streak</p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <Award className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-200">{achievements.length}</p>
          <p className="text-xs text-slate-400">Badges</p>
        </div>
      </div>
    </Card>
  )
}
