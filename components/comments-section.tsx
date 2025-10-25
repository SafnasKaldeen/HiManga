"use client";

import { useState } from "react";
import { Send, MessageSquare, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentItem } from "@/components/comment-item";
import { mockComments } from "@/lib/mock-comments";
import type { Comment } from "@/lib/mock-comments";

interface CommentsSectionProps {
  mangaId: string;
}

export function CommentsSection({ mangaId }: CommentsSectionProps) {
  const [comments, setComments] = useState(mockComments.comments);
  const [newComment, setNewComment] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSpoiler, setIsSpoiler] = useState(false);

  const handlePostComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      author: "You",
      avatar: "/user-avatar.jpg",
      content: newComment,
      timestamp: "just now",
      likes: 0,
      isLiked: false,
      isSpoiler: isSpoiler,
      replies: [],
    };

    setComments([comment, ...comments]);
    setNewComment("");
    setIsSpoiler(false);
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "popular") {
      return b.likes - a.likes;
    }
    return 0;
  });

  return (
    <div className="flex flex-col h-[100vh] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <MessageSquare className="h-5 w-5 text-pink-500" />
        <h2 className="text-2xl font-bold text-white">Community Discussion</h2>
        <span className="text-sm text-white/60 ml-auto">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Comment Input */}
      <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-lg p-3 sm:p-4 space-y-3 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src="/abstract-user-representation.png" alt="You" />
            <AvatarFallback>YOU</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            <Textarea
              placeholder="Share your thoughts about this manga..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-20 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
            />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSpoiler(!isSpoiler)}
                className={`gap-2 text-xs sm:text-sm ${
                  isSpoiler
                    ? "bg-destructive/20 border-destructive/40 text-destructive hover:bg-destructive/30"
                    : "bg-white/10 border-white/20 text-white/70 hover:text-cyan-500 hover:border-white/30"
                }`}
              >
                <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  {isSpoiler ? "Spoiler" : "Mark as Spoiler"}
                </span>
                <span className="sm:hidden">
                  {isSpoiler ? "Spoiler" : "Spoiler"}
                </span>
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewComment("");
                    setIsSpoiler(false);
                  }}
                  disabled={!newComment.trim()}
                  className="bg-white/10 border-white/20 text-white/70 hover:text-red-500/60 hover:border-white/30 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  Clear
                </Button>
                <Button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg shadow-pink-500/20 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sort and Filter */}
      <div className="flex items-center justify-between flex-shrink-0">
        <Tabs
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "newest" | "popular")}
        >
          <TabsList className="grid w-fit grid-cols-2 bg-white/5 border border-white/10 backdrop-blur-sm">
            <TabsTrigger
              value="newest"
              className="text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/20"
            >
              Newest
            </TabsTrigger>
            <TabsTrigger
              value="popular"
              className="text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/20"
            >
              Most Popular
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Comments List - Scrollable */}
      <div className="flex-1 overflow-y-auto rounded-sm bg-slate-700/30 p-5 space-y-6 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/40">
        {sortedComments.length > 0 ? (
          sortedComments.map((comment) => (
            <div
              key={comment.id}
              className="border-b border-white/10 pb-6 last:border-b-0"
            >
              <CommentItem
                comment={comment}
                onReply={(commentId) => setReplyingTo(commentId)}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
