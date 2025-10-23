export interface Manga {
  id: string
  title: string
  slug: string
  author: string
  cover: string
  rating: number
  chapters: number
  status: "ongoing" | "completed"
  genre: string[]
  description: string
  views: number
}

export interface Chapter {
  number: number
  title: string
  releaseDate: string
  views: number
}

export interface MangaWithChapters extends Manga {
  chapters: Chapter[]
}

export const trendingMangas: Manga[] = [
  {
    id: "1",
    title: "One Piece",
    slug: "one-piece",
    author: "Eiichiro Oda",
    cover: "/anime-manga-cover-one-piece.jpg",
    rating: 4.9,
    chapters: 1162,
    status: "ongoing",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "Follow Monkey D. Luffy and his pirate crew in their quest to find the One Piece and become the Pirate King.",
    views: 5000000,
  },
  {
    id: "2",
    title: "Solo Leveling Manhwa",
    slug: "solo-leveling-manhwa",
    author: "Chugong",
    cover: "/anime-manga-cover-solo-leveling.jpg",
    rating: 4.8,
    chapters: 200,
    status: "ongoing",
    genre: ["Action", "Fantasy", "Adventure"],
    description: "In a world where hunters battle monsters, one man’s journey from the weakest to the strongest begins.",
    views: 4500000,
  }
  ,{
    id: "3",
    title: "kaiju no 8",
    author: "Naoya Matsumoto",
    slug: "kaiju-no-8",
    cover: "/anime-manga-cover-kaiju-no-8.jpg",
    rating: 4.7,
    chapters: 80,
    status: "ongoing",
    genre: ["Action", "Fantasy", "Adventure"],
    description: "In a world where kaiju threaten humanity, one man's transformation into a kaiju may be the key to saving us all.",
    views: 3000000,
  },
  {
    id: "4",
    title: "Demon Slayers",
    author: "Haruto Takahashi",
    slug: "demon-slayers",
    cover: "/anime-manga-cover-demon-slayers.jpg",
    rating: 4.8,
    chapters: 150,
    status: "ongoing",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "A young warrior embarks on a perilous journey to vanquish demons and protect humanity.",
    views: 2500000,
  },
   {
    id: "5",
    title: "Jujutsu Kaisen",
    author: "Gege Akutami",
    slug: "jujutsu-kaisen",
    cover: "/anime-manga-cover-jujutsu-kaisen.jpg",
    rating: 4.9,
    chapters: 160,
    status: "ongoing",
    genre: ["Action", "Supernatural", "Fantasy"],
    description: "A high school student joins a secret organization to combat curses and supernatural threats.",
    views: 4000000,
  },
  {
    id: "6",
    title: "Black Clover",
    author: "Yūki Tabata",
    slug: "black-clover",
    cover: "/anime-manga-cover-black-clover.jpg",
    rating: 4.5,
    chapters: 300,
    status: "ongoing",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "In a world where magic is everything, two orphans strive to become the Wizard King.",
    views: 2200000,
  },
  {
    id: "7",
    title: "Boruto: Naruto Next Generations",
    author: "Masashi Kishimoto",
    slug: "boruto-naruto-next-generations",
    cover: "/anime-manga-cover-boruto.jpg",
    rating: 4.5,
    chapters: 80,
    status: "ongoing",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "The adventures of Naruto Uzumaki's son, Boruto, as he navigates the challenges of being a ninja in a new era.",
    views: 1800000,
  },
  {
    id: "8",
    title: "Shangri-La Frontier",
    author: "Yuki Yamamoto",
    slug: "shangri-la-frontier",
    cover: "/anime-manga-cover-shangri-la-frontier.jpg",
    rating: 4.7,
    chapters: 85,
    status: "ongoing",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "A gamer dives into the ultimate VRMMO, where every quest is a step closer to paradise.",
    views: 2000000,
  },
 
  
]

export const trendingMangasWithChapters: MangaWithChapters[] = trendingMangas.map((manga) => ({
  ...manga,
  chapters: Array.from({ length: manga.chapters }, (_, i) => ({
    number: i + 1,
    title: `Chapter ${i + 1}: ${["The Beginning", "Rising Tensions", "Unexpected Twist", "Revelation", "Climax", "Resolution", "New Dawn", "Hidden Truth"][i % 8]}`,
    releaseDate: new Date(Date.now() - (manga.chapters - i - 1) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    views: Math.floor(Math.random() * 500000) + 50000,
  })),
}))

export const allGenres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
  "Thriller",
]
