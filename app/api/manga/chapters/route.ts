// app/api/manga/chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

const CACHE_KEY_PREFIX = "chapters_list_cache_";
const CACHE_EXPIRY_HOURS = 3;

// Helper to get cache key
function getCacheKey(mangaId: string): string {
  return `${CACHE_KEY_PREFIX}${mangaId}`;
}

// Helper to check if cache is expired
function isCacheExpired(timestamp: number): boolean {
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // 3 hours in ms
  return Date.now() - timestamp > expiryMs;
}

// Helper to get cached chapters list
function getCachedChaptersList(mangaId: string): any[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(mangaId);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { chapters, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (isCacheExpired(timestamp)) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return chapters;
    }
  } catch (error) {
    console.error("Error reading chapters list from cache:", error);
  }
  
  return null;
}

// Helper to cache chapters list
function cacheChaptersList(mangaId: string, chapters: any[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(mangaId);
    const cacheData = {
      chapters,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[Chapters Cache] Cached ${chapters.length} chapters for manga ${mangaId}`);
  } catch (error) {
    console.error("Error caching chapters list:", error);
    // If localStorage is full, try to clear old chapter list cache entries
    if (error.name === 'QuotaExceededError') {
      clearOldChaptersListCache();
      // Try one more time
      try {
        const cacheKey = getCacheKey(mangaId);
        const cacheData = {
          chapters,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("Failed to cache chapters list after cleanup:", retryError);
      }
    }
  }
}

// Helper to clear old cache entries
function clearOldChaptersListCache(): void {
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
    console.log(`[Chapters Cache] Cleared ${keysToRemove.length} expired chapter list entries`);
  } catch (error) {
    console.error("Error clearing old chapters list cache:", error);
  }
}

// Helper to invalidate chapters list cache for a manga
export function invalidateChaptersListCache(mangaId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(mangaId);
    localStorage.removeItem(cacheKey);
    console.log(`[Chapters Cache] Invalidated chapters list cache for manga ${mangaId}`);
  } catch (error) {
    console.error("Error invalidating chapters list cache:", error);
  }
}

// Helper to invalidate all chapters list cache
export function invalidateAllChaptersListCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Chapters Cache] Invalidated all ${keysToRemove.length} chapters list caches`);
  } catch (error) {
    console.error("Error invalidating all chapters list cache:", error);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mangaId = searchParams.get("mangaId");
  const skipCache = searchParams.get("skipCache") === "true";

  if (!mangaId) {
    return NextResponse.json({ chapters: [] }, { status: 400 });
  }

  // Check cache first if not skipping
  if (!skipCache) {
    const cached = getCachedChaptersList(mangaId);
    if (cached) {
      console.log(`[Chapters List] Cache HIT: manga=${mangaId}, ${cached.length} chapters`);
      return NextResponse.json(
        { chapters: cached },
        {
          headers: {
            "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400", // 3 hours
            "X-Cache": "HIT",
          },
        }
      );
    }
  }

  console.log(`[Chapters List] Cache MISS: Fetching chapters for manga=${mangaId}`);

  const allChapters: any[] = [];
  let start = 0;
  const chunkSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("manga_id", mangaId)
        .order("chapter_number", { ascending: true })
        .range(start, start + chunkSize - 1);

      if (error) {
        console.error("[Chapters List] Database error:", error);
        return NextResponse.json(
          { chapters: [], error: error.message },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) break;

      allChapters.push(...data);

      if (data.length < chunkSize) break;

      start += chunkSize;
    }

    console.log(`[Chapters List] Success: Fetched ${allChapters.length} chapters for manga=${mangaId}`);

    // Cache the chapters list
    cacheChaptersList(mangaId, allChapters);

    return NextResponse.json(
      { chapters: allChapters },
      {
        headers: {
          "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400", // 3 hours
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("[Chapters List] Unexpected error:", error);
    return NextResponse.json(
      { 
        chapters: [], 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}