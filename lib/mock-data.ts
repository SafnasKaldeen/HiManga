export interface Manga {
  id: string
  title: string
  slug: string
  author: string
  cover: string
  rating: number
  chapters: number
  status: "ongoing" | "completed" | "Not yet released" | "Locked"
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
    chapters: 1163,
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
    status: "completed",
    genre: ["Action", "Fantasy", "Adventure"],
    description: "In a world where hunters battle monsters, one man’s journey from the weakest to the strongest begins.",
    views: 4500000,
  },
  {
    id: "3",
    title: "Black Clover",
    author: "Yūki Tabata",
    slug: "black-clover",
    cover: "/anime-manga-cover-black-clover.jpg",
    rating: 4.5,
    chapters: 383,
    status: "ongoing",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "In a world where magic is everything, two orphans strive to become the Wizard King.",
    views: 2200000,
  },
  
  {
    id: "4",
    title: "Demon Slayers",
    author: "Haruto Takahashi",
    slug: "demon-slayer-kimetsu-no-yaiba",
    cover: "/anime-manga-cover-demon-slayers.jpg",
    rating: 4.8,
    chapters: 206,
    status: "completed",
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
    chapters: 271,
    status: "completed",
    genre: ["Action", "Supernatural", "Fantasy"],
    description: "A high school student joins a secret organization to combat curses and supernatural threats.",
    views: 4000000,
  },
  {
    id: "6",
    title: "kaiju no 8",
    author: "Naoya Matsumoto",
    slug: "kaiju-no-8",
    cover: "/anime-manga-cover-kaiju-no-8.jpg",
    rating: 4.7,
    chapters: 129,
    status: "ongoing",
    genre: ["Action", "Fantasy", "Adventure"],
    description: "In a world where kaiju threaten humanity, one man's transformation into a kaiju may be the key to saving us all.",
    views: 3000000,
  },
  {
    id: "7",
    title: "One Punch Man",
    author: "ONE",
    slug: "one-punch-man",
    cover: "/anime-manga-cover-one-punch-man.jpg",
    rating: 4.6,
    chapters: 278,
    status: "ongoing",
    genre: ["Action", "Comedy", "Superhero"],
    description: "Saitama, a hero who can defeat any opponent with a single punch, seeks excitement in his heroic endeavors.",
    views: 3500000,
  },
  {
    id: "8",
    title: "Dandadan",
    author: "Yukinobu Tatsu",
    slug: "dandadan",
    cover: "/anime-manga-cover-dandadan.jpg",
    rating: 4.7,
    chapters: 215,
    status: "ongoing",
    genre: ["Action", "Comedy", "Supernatural"],
    description: "A high school girl and a boy with a crush on her get caught up in a battle between aliens and supernatural beings.",
    views: 1500000,
  },
  {
    id: "9",
    title: "Spy x Family",
    author: "Tatsuya Endo",
    slug: "spy-x-family",
    cover: "/anime-manga-cover-spy-x-family.jpg",
    rating: 4.8,
    chapters: 139,
    status: "ongoing",
    genre: ["Action", "Comedy", "Slice of Life"],
    description: "A spy on a mission forms a fake family with an assassin and a telepathic child.",
    views: 2000000,
  },
  {
    id: "10",
    title: "Attack on Titan",
    slug: "attack-on-titan",
    author: "Hajime Isayama",
    cover: "/anime-manga-cover-attack-on-titan.jpg",
    rating: 4.9,
    chapters: 139,
    status: "completed",
    genre: ["Action", "Drama", "Fantasy"],
    description: "In a world besieged by giant humanoid Titans, humanity's last hope lies within massive walled cities.",
    views: 6000000,
  },
  {
    id: "11",
    title: "Chainsaw Man",
    author: "Tatsuki Fujimoto",
    slug: "chainsaw-man",
    cover: "/anime-manga-cover-chainsaw-man.jpg",
    rating: 4.7,
    chapters: 97,
    status: "Locked",
    genre: ["Action", "Horror", "Supernatural"],
    description: "Denji, a young man with a debt to pay, merges with his pet devil, Chainsaw, to become a devil hunter.",
    views: 3000000,
  },
  {
    id: "12",
    title: "Boruto: Naruto Next Generations",
    author: "Masashi Kishimoto",
    slug: "boruto-naruto-next-generations",
    cover: "/anime-manga-cover-boruto.jpg",
    rating: 4.5,
    chapters: 80,
    status: "Locked",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "The adventures of Naruto Uzumaki's son, Boruto, as he navigates the challenges of being a ninja in a new era.",
    views: 1800000,
  },
  {
    id: "13",
    title: "Shangri-La Frontier",
    author: "Yuki Yamamoto",
    slug: "shangri-la-frontier",
    cover: "/anime-manga-cover-shangri-la-frontier.jpg",
    rating: 4.7,
    chapters: 85,
    status: "Locked",
    genre: ["Action", "Adventure", "Fantasy"],
    description: "A gamer dives into the ultimate VRMMO, where every quest is a step closer to paradise.",
    views: 2000000,
  },
  {
    id: "14",
    title: "Sakamoto Days",
    author: "Yuto Suzuki",
    slug: "sakamoto-days",
    cover: "/anime-manga-cover-sakamoto-days.jpg",
    rating: 4.6,
    chapters: 80,
    status: "Locked",
    genre: ["Action", "Comedy", "Slice of Life"],
    description: "A former assassin is forced to take on a new life as a high school student, where he must navigate the challenges of adolescence.",
    views: 1500000,
  },
  {
    id: "15",
    title: "Muscle - Joseon",
    author: "Unknown",
    slug: "muscle-joseon",
    cover: "/anime-manga-cover-muscle-joseon.jpg",
    rating: 4.5,
    chapters: 100,
    status: "Locked",
    genre: ["Action", "Sports", "Drama"],
    description: "In a world where strength is everything, a young boy dreams of becoming the strongest fighter.",
    views: 1200000,
  },
  {
    id: "16",
    title: "Blue Lock",
    author: "Muneyuki Kaneshiro",
    slug: "blue-lock",
    cover: "/anime-manga-cover-blue-lock.jpg",
    rating: 4.6,
    chapters: 100,
    status: "Locked",
    genre: ["Action", "Sports", "Drama"],
    description: "A high-stakes soccer competition is held to find the best striker in Japan.",
    views: 1500000,
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
