"use client"

import { useState } from "react"
import { Heart, MessageCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { Comment } from "@/lib/mock-comments"

interface CommentItemProps {
  comment: Comment
  onReply?: (commentId: string) => void
  level?: number
}

export function CommentItem({ comment, onReply, level = 0 }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likes, setLikes] = useState(comment.likes)
  const [showReplies, setShowReplies] = useState(level === 0)
  const [showSpoiler, setShowSpoiler] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  const paddingClass = level > 0 ? `ml-${Math.min(level * 4, 12)}` : ""

  return (
    <div className={`${paddingClass} space-y-4`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.author} />
          <AvatarFallback>{comment.author.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-100">{comment.author}</span>
            <span className="text-xs text-slate-500">{comment.timestamp}</span>
            {comment.isSpoiler && (
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full flex items-center gap-1 border border-red-500/30">
                <AlertTriangle className="w-3 h-3" />
                Spoiler
              </span>
            )}
          </div>

          {comment.isSpoiler && !showSpoiler ? (
            <div className="mt-3 relative group">
              <div
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
                onClick={() => setShowSpoiler(true)}
              >
                {/* Glassmorphic blurred background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-slate-900/40 to-red-500/5 backdrop-blur-xl z-0" />

                {/* Animated border */}
                <div className="absolute inset-0 rounded-xl border border-red-500/30 group-hover:border-red-500/60 transition-colors duration-300" />

                {/* Content overlay */}
                <div className="relative z-10 p-6 flex flex-col items-center justify-center min-h-28 gap-3">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300 border border-red-500/30">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-400">Spoiler Content</p>
                    <p className="text-xs text-red-400/60 mt-1">Click to reveal</p>
                  </div>
                </div>
              </div>

              {/* Blurred text preview */}
              <p className="text-sm text-slate-400 mt-3 break-words blur-sm select-none opacity-40">
                {comment.content}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-300 mt-3 break-words leading-relaxed">{comment.content}</p>
          )}

          <div className="flex items-center gap-4 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-cyan-400 text-cyan-400" : ""}`} />
              <span>{likes}</span>
            </Button>

            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1 text-slate-400 hover:text-blue-400 transition-colors"
                onClick={() => onReply(comment.id)}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Reply</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 border-l border-slate-700/30 pl-4 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1 text-slate-400 hover:text-slate-200"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </>
            )}
          </Button>

          {showReplies && (
            <div className="space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
