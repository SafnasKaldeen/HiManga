// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPESUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// 2. SIMPLE AUTHENTICATION (Email + Password)
// =============================================

// Sign Up - Create new user
export async function signUp(email, password, username) {
  try {
    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      throw new Error("Username already taken");
    }

    // Generate random avatar ID
    const avatarId = Math.floor(Math.random() * 1000);

    console.log("Inserting new user...");

    // Insert new user
    const { data, error } = await supabase
      .from("users")
      .insert({
        email: email,
        username: username,
        password: password, // Store password directly
        display_name: username,
        avatar_id: avatarId,
        xp: 0,
        rank: "E",
        total_panels_read: 0,
        total_mangas_read: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }

    console.log("User created:", data);
    return data;
  } catch (error) {
    console.error("SignUp function error:", error);
    throw error;
  }
}

// Sign In - Authenticate user
export async function signIn(email, password) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .single();

  if (error || !data) {
    throw new Error("Invalid email or password");
  }

  return data;
}

// Get User Profile by ID
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

// Update User Profile
export async function updateUserProfile(userId, updates) {
  const updateData = {};
  if (updates.username) updateData.username = updates.username;
  if (updates.displayName) updateData.display_name = updates.displayName;
  if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl;
  if (updates.avatarId !== undefined) updateData.avatar_id = updates.avatarId;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// 3. MANGA OPERATIONS
// =============================================

// Get All Mangas with Genres
export async function getAllMangas() {
  const { data, error } = await supabase
    .from("mangas")
    .select(
      `
      *,
      manga_genres(
        genres(id, name, slug)
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Get Single Manga with Full Details
export async function getMangaById(mangaId) {
  const { data, error } = await supabase
    .from("mangas")
    .select(
      `
      *,
      manga_genres(
        genres(id, name, slug)
      ),
      chapters(
        id,
        chapter_number,
        title,
        total_panels,
        published_at
      )
    `
    )
    .eq("id", mangaId)
    .single();

  if (error) throw error;
  return data;
}

// Search Mangas
export async function searchMangas(query) {
  const { data, error } = await supabase
    .from("mangas")
    .select(
      `
      *,
      manga_genres(
        genres(name)
      )
    `
    )
    .or(`title.ilike.%${query}%,author.ilike.%${query}%`);

  if (error) throw error;
  return data;
}

// Get Mangas by Genre
export async function getMangasByGenre(genreSlug) {
  const { data, error } = await supabase
    .from("mangas")
    .select(
      `
      *,
      manga_genres!inner(
        genres!inner(slug)
      )
    `
    )
    .eq("manga_genres.genres.slug", genreSlug);

  if (error) throw error;
  return data;
}

// =============================================
// 4. CHAPTER & PANEL OPERATIONS
// =============================================

// Get Chapter with Panels
export async function getChapterWithPanels(chapterId) {
  const { data, error } = await supabase
    .from("chapters")
    .select(
      `
      *,
      mangas(id, title),
      panels(
        id,
        panel_number,
        image_url,
        alt_text
      )
    `
    )
    .eq("id", chapterId)
    .single();

  if (error) throw error;

  // Sort panels by panel_number
  if (data.panels) {
    data.panels.sort((a, b) => a.panel_number - b.panel_number);
  }

  return data;
}

// =============================================
// 5. USER READING PROGRESS
// =============================================

// Track Panel Read
export async function trackPanelRead(userId, panelId, chapterId, mangaId) {
  // Insert panel read
  const { error: readError } = await supabase.from("user_panel_reads").insert({
    user_id: userId,
    panel_id: panelId,
    chapter_id: chapterId,
    manga_id: mangaId,
  });

  // Ignore duplicate reads
  if (readError && !readError.message.includes("duplicate")) {
    throw readError;
  }

  // Update user progress
  const { error: progressError } = await supabase
    .from("user_manga_progress")
    .upsert({
      user_id: userId,
      manga_id: mangaId,
      last_chapter_id: chapterId,
      last_panel_id: panelId,
      last_read_at: new Date().toISOString(),
    });

  if (progressError) throw progressError;
}

// Get User Progress for a Manga
export async function getUserProgress(userId, mangaId) {
  const { data, error } = await supabase
    .from("user_manga_progress")
    .select(
      `
      *,
      last_chapter_id(
        id,
        chapter_number,
        title
      ),
      last_panel_id(
        id,
        panel_number
      )
    `
    )
    .eq("user_id", userId)
    .eq("manga_id", mangaId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Get User's Reading History
export async function getUserReadingHistory(userId, limit = 10) {
  const { data, error } = await supabase
    .from("user_manga_progress")
    .select(
      `
      *,
      mangas(
        id,
        title,
        cover_image_url,
        total_chapters
      )
    `
    )
    .eq("user_id", userId)
    .order("last_read_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// =============================================
// 6. USER RATINGS & FAVORITES
// =============================================

// Add/Update Rating
export async function rateManga(userId, mangaId, rating, review = null) {
  const { data, error } = await supabase
    .from("user_ratings")
    .upsert({
      user_id: userId,
      manga_id: mangaId,
      rating,
      review,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get User's Rating for a Manga
export async function getUserRating(userId, mangaId) {
  const { data, error } = await supabase
    .from("user_ratings")
    .select("*")
    .eq("user_id", userId)
    .eq("manga_id", mangaId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Add to Favorites
export async function addToFavorites(userId, mangaId) {
  const { error } = await supabase.from("user_favorites").insert({
    user_id: userId,
    manga_id: mangaId,
  });

  if (error) throw error;
}

// Remove from Favorites
export async function removeFromFavorites(userId, mangaId) {
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("manga_id", mangaId);

  if (error) throw error;
}

// Get User's Favorites
export async function getUserFavorites(userId) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select(
      `
      manga_id,
      mangas(
        id,
        title,
        cover_image_url,
        average_rating,
        total_chapters
      )
    `
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data.map((fav) => fav.mangas);
}

// =============================================
// 7. LEADERBOARD & RECOMMENDATIONS
// =============================================

// Get Top Users (Leaderboard)
export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, username, display_name, avatar_url, avatar_id, xp, rank, total_panels_read, total_mangas_read"
    )
    .order("xp", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get Recommended Mangas
export async function getRecommendedMangas(userId, limit = 10) {
  // Get genres from user's reading history
  const { data: userHistory } = await supabase
    .from("user_manga_progress")
    .select(
      `
      manga_id,
      mangas(
        manga_genres(genre_id)
      )
    `
    )
    .eq("user_id", userId);

  if (!userHistory || userHistory.length === 0) {
    // New user - return popular mangas
    const { data, error } = await supabase
      .from("mangas")
      .select("*")
      .order("average_rating", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Extract genre IDs
  const genreIds = userHistory
    .flatMap((h) => h.mangas?.manga_genres || [])
    .map((mg) => mg.genre_id)
    .filter((id, index, self) => self.indexOf(id) === index);

  // Get read manga IDs
  const readMangaIds = userHistory.map((h) => h.manga_id);

  // Find mangas with similar genres that user hasn't read
  const { data, error } = await supabase
    .from("mangas")
    .select(
      `
      *,
      manga_genres!inner(genre_id)
    `
    )
    .in("manga_genres.genre_id", genreIds)
    .not("id", "in", `(${readMangaIds.join(",")})`)
    .order("average_rating", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}