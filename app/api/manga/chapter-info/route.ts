import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client (matches your .env typo)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

const CACHE_KEY_PREFIX = "chapter_info_cache_";
const CACHE_EXPIRY_HOURS = 240;

// Helper to get cache key
function getCacheKey(mangaId: string, chapterNumber: number): string {
  return `${CACHE_KEY_PREFIX}${mangaId}_${chapterNumber}`;
}

// Helper to check if cache is expired
function isCacheExpired(timestamp: number): boolean {
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // 3 hours in ms
  return Date.now() - timestamp > expiryMs;
}

// Helper to get cached chapter info
function getCachedChapterInfo(mangaId: string, chapterNumber: number): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(mangaId, chapterNumber);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (isCacheExpired(timestamp)) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error reading chapter info from cache:", error);
  }
  
  return null;
}

// Helper to cache chapter info
function cacheChapterInfo(mangaId: string, chapterNumber: number, data: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(mangaId, chapterNumber);
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching chapter info:", error);
    // If localStorage is full, try to clear old chapter cache entries
    if (error.name === 'QuotaExceededError') {
      clearOldChapterCache();
      // Try one more time
      try {
        const cacheKey = getCacheKey(mangaId, chapterNumber);
        const cacheData = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("Failed to cache chapter info after cleanup:", retryError);
      }
    }
  }
}

// Helper to clear old cache entries
function clearOldChapterCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key)!);
          if (isCacheExpired(cached.timestamp)) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // Invalid cache entry, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Chapter Cache] Cleared ${keysToRemove.length} expired entries`);
  } catch (error) {
    console.error("Error clearing old chapter cache:", error);
  }
}

// Helper to invalidate specific chapter cache
export function invalidateChapterCache(mangaId: string, chapterNumber: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(mangaId, chapterNumber);
    localStorage.removeItem(cacheKey);
    console.log(`[Chapter Cache] Invalidated cache for manga ${mangaId}, chapter ${chapterNumber}`);
  } catch (error) {
    console.error("Error invalidating chapter cache:", error);
  }
}

// Helper to invalidate all chapter cache for a manga
export function invalidateMangaChapterCache(mangaId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    const prefix = `${CACHE_KEY_PREFIX}${mangaId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Chapter Cache] Invalidated ${keysToRemove.length} chapters for manga ${mangaId}`);
  } catch (error) {
    console.error("Error invalidating manga chapter cache:", error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("manga"); 
  const chapterParam = searchParams.get("chapter");
  const skipCache = searchParams.get("skipCache") === "true";

  // Validate input
  if (!mangaId || !chapterParam) {
    return NextResponse.json(
      { error: "Missing required parameters: manga and chapter" },
      { status: 400 }
    );
  }

  // Parse and validate chapter number
  const chapterNumber = parseFloat(chapterParam);
  if (isNaN(chapterNumber) || chapterNumber < 1) {
    return NextResponse.json(
      { error: "Invalid chapter number" },
      { status: 400 }
    );
  }

  // Check cache first if not skipping
  if (!skipCache) {
    const cached = getCachedChapterInfo(mangaId, chapterNumber);
    if (cached) {
      console.log(`[Chapter Info] Cache HIT: manga=${mangaId}, chapter=${chapterNumber}`);
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400", // 3 hours
          "X-Cache": "HIT",
        },
      });
    }
  }

  try {
    console.log(`[Chapter Info] Cache MISS: Fetching manga=${mangaId}, chapter=${chapterNumber}`);

    // Query Supabase with proper numeric comparison
    const { data, error } = await supabase
      .from("chapters")
      .select(`
        id,
        manga_id,
        chapter_number,
        title,
        total_panels,
        published_at,
        manga:mangas!inner(
          id,
          slug,
          title
        )
      `)
      .eq("manga_id", mangaId)
      .eq("chapter_number", chapterNumber)
      .single();

    if (error) {
      console.error("[Chapter Info] Database error:", error);
      return NextResponse.json(
        { 
          error: "Chapter not found", 
          details: error.message,
          hint: error.hint || "Check if chapter exists in database"
        },
        { status: 404 }
      );
    }

    if (!data) {
      console.error("[Chapter Info] No data returned");
      return NextResponse.json(
        { error: "Chapter not found in database" },
        { status: 404 }
      );
    }

    // Type guard for manga relation
    if (!data.manga) {
      console.error("[Chapter Info] Manga relation missing:", data.id);
      return NextResponse.json(
        { error: "Invalid chapter data: manga not found" },
        { status: 500 }
      );
    }

    console.log(`[Chapter Info] Success: ${data.total_panels} panels found`);

    const responseData = {
      chapterId: data.id,
      chapterNumber: data.chapter_number,
      chapterTitle: data.title,
      totalPanels: data.total_panels,
      publishedAt: data.published_at,
      manga: {
        id: data.manga.id,
        slug: data.manga.slug,
        title: data.manga.title,
      },
    };

    // Cache the response data
    cacheChapterInfo(mangaId, chapterNumber, responseData);

    // Send response
    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400", // 3 hours
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[Chapter Info] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch chapter information",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}