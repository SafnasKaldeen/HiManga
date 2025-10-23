export interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  replies: Comment[]
  isLiked?: boolean
  isSpoiler?: boolean
}

export interface CommentThread {
  mangaId: string
  comments: Comment[]
}

export const mockComments: CommentThread = {
  mangaId: "1",
  comments: [
    {
      id: "c1",
      author: "AnimeNinja92",
      avatar: "/anime-fan-avatar.jpg",
      content:
        "This manga is absolutely incredible! The character development is top-notch. Can't wait for the next chapter!",
      timestamp: "2 hours ago",
      likes: 234,
      isLiked: false,
      isSpoiler: false,
      replies: [
        {
          id: "c1r1",
          author: "MangaLover",
          avatar: "/manga-reader-avatar.jpg",
          content: "Right?! The plot twist in chapter 45 was mind-blowing!",
          timestamp: "1 hour ago",
          likes: 45,
          isLiked: false,
          isSpoiler: true,
          replies: [],
        },
        {
          id: "c1r2",
          author: "TokyoDreamer",
          avatar: "/tokyo-fan-avatar.jpg",
          content: "I've been following this since day one. The author really knows how to keep us hooked!",
          timestamp: "45 minutes ago",
          likes: 67,
          isLiked: false,
          isSpoiler: false,
          replies: [],
        },
      ],
    },
    {
      id: "c2",
      author: "SakuraFan",
      avatar: "/sakura-fan-avatar.jpg",
      content: "The art style is so unique and beautiful. Every panel is a masterpiece!",
      timestamp: "3 hours ago",
      likes: 189,
      isLiked: false,
      isSpoiler: false,
      replies: [
        {
          id: "c2r1",
          author: "ArtisticSoul",
          avatar: "/artist-avatar.jpg",
          content: "The color palette choices are incredible. Really sets the mood perfectly.",
          timestamp: "2 hours ago",
          likes: 52,
          isLiked: false,
          isSpoiler: false,
          replies: [],
        },
      ],
    },
    {
      id: "c3",
      author: "ActionJunkie",
      avatar: "/action-fan-avatar.jpg",
      content: "The fight scenes are so well choreographed! Best action manga I've read in years.",
      timestamp: "4 hours ago",
      likes: 312,
      isLiked: false,
      isSpoiler: false,
      replies: [],
    },
    {
      id: "c4",
      author: "StorytellerX",
      avatar: "/storyteller-avatar.jpg",
      content: "The narrative structure is brilliant. The way they weave multiple storylines together is chef's kiss!",
      timestamp: "5 hours ago",
      likes: 156,
      isLiked: false,
      isSpoiler: false,
      replies: [
        {
          id: "c4r1",
          author: "PlotTwistFan",
          avatar: "/plot-fan-avatar.jpg",
          content: "I didn't see that ending coming at all! Absolutely shocked in the best way possible.",
          timestamp: "4 hours ago",
          likes: 89,
          isLiked: false,
          isSpoiler: true,
          replies: [],
        },
      ],
    },
  ],
}
