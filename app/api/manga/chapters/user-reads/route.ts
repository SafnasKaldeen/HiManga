// app/api/manga/chapters/user-reads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

const CACHE_KEY_PREFIX = "user_reads_cache_";
const CACHE_EXPIRY_HOURS = 1;

// Helper to get cache key
function getCacheKey(userId: string, mangaId?: string): string {
  return mangaId 
    ? `${CACHE_KEY_PREFIX}${userId}_${mangaId}`
    : `${CACHE_KEY_PREFIX}${userId}_all`;
}

// Helper to check if cache is expired
function isCacheExpired(timestamp: number): boolean {
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // 1 hour in ms
  return Date.now() - timestamp > expiryMs;
}

// Helper to get cached user reads
function getCachedUserReads(userId: string, mangaId?: string): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(userId, mangaId);
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
    console.error("Error reading user reads from cache:", error);
  }
  
  return null;
}

// Helper to cache user reads
function cacheUserReads(userId: string, data: any, mangaId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(userId, mangaId);
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching user reads:", error);
    // If localStorage is full, try to clear old user reads cache entries
    if (error.name === 'QuotaExceededError') {
      clearOldUserReadsCache();
      // Try one more time
      try {
        const cacheKey = getCacheKey(userId, mangaId);
        const cacheData = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("Failed to cache user reads after cleanup:", retryError);
      }
    }
  }
}

// Helper to clear old cache entries
function clearOldUserReadsCache(): void {
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
    console.log(`[User Reads Cache] Cleared ${keysToRemove.length} expired entries`);
  } catch (error) {
    console.error("Error clearing old user reads cache:", error);
  }
}

// Helper to invalidate user reads cache
export function invalidateUserReadsCache(userId: string, mangaId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (mangaId) {
      // Invalidate specific manga cache
      const cacheKey = getCacheKey(userId, mangaId);
      localStorage.removeItem(cacheKey);
      console.log(`[User Reads Cache] Invalidated cache for user ${userId}, manga ${mangaId}`);
    }
    
    // Always invalidate the "all" cache when any manga is updated
    const allCacheKey = getCacheKey(userId);
    localStorage.removeItem(allCacheKey);
    console.log(`[User Reads Cache] Invalidated all reads cache for user ${userId}`);
  } catch (error) {
    console.error("Error invalidating user reads cache:", error);
  }
}

// Helper to invalidate all user reads cache for a user
export function invalidateAllUserReadsCache(userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    const prefix = `${CACHE_KEY_PREFIX}${userId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[User Reads Cache] Invalidated all ${keysToRemove.length} read caches for user ${userId}`);
  } catch (error) {
    console.error("Error invalidating all user reads cache:", error);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const mangaId = searchParams.get("mangaId");
  const skipCache = searchParams.get("skipCache") === "true";

  // Validate required parameters
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required", readChapters: [] },
      { status: 400 }
    );
  }

  // Check cache first if not skipping
  if (!skipCache) {
    const cached = getCachedUserReads(userId, mangaId || undefined);
    if (cached) {
      console.log(`[User Reads] Cache HIT: user=${userId}, manga=${mangaId || 'all'}`);
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // 1 hour
          "X-Cache": "HIT",
        },
      });
    }
  }

  console.log(`[User Reads] Cache MISS: Fetching for user=${userId}, manga=${mangaId || 'all'}`);

  try {
    let query = supabase
      .from("user_reads")
      .select("manga_id, chapters")
      .eq("user_id", userId);

    // If mangaId is provided, filter for specific manga
    if (mangaId) {
      query = query.eq("manga_id", mangaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, readChapters: [] },
        { status: 500 }
      );
    }

    // If fetching for specific manga, return just the chapters array
    if (mangaId) {
      const mangaRead = data?.[0];
      const responseData = {
        mangaId,
        readChapters: mangaRead?.chapters || [],
      };
      
      // Cache the response
      cacheUserReads(userId, responseData, mangaId);
      
      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // 1 hour
          "X-Cache": "MISS",
        },
      });
    }

    // If fetching all manga, return structured data
    const userReads = data?.map((item) => ({
      mangaId: item.manga_id,
      readChapters: item.chapters || [],
    })) || [];

    const responseData = {
      userId,
      reads: userReads,
      totalManga: userReads.length,
    };
    
    // Cache the response
    cacheUserReads(userId, responseData);

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // 1 hour
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", readChapters: [] },
      { status: 500 }
    );
  }
}

// POST endpoint to update read chapters
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const body = await req.json();
    const { mangaId, chapterNumber } = body;

    if (!userId || !mangaId || chapterNumber === undefined) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    // First, check if record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    let currentChapters: number[] = [];

    if (existingRecord && !fetchError) {
      currentChapters = existingRecord.chapters || [];
    }

    // Add chapter if not already in array
    if (!currentChapters.includes(chapterNumber)) {
      currentChapters.push(chapterNumber);
      currentChapters.sort((a, b) => a - b);
    }

    // Upsert the record
    const { data, error } = await supabase
      .from("user_reads")
      .upsert(
        {
          user_id: userId,
          manga_id: mangaId,
          chapters: currentChapters,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,manga_id",
        }
      )
      .select();

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Invalidate cache after successful update
    invalidateUserReadsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      readChapters: currentChapters,
      message: `Chapter ${chapterNumber} marked as read`,
      cacheInvalidated: true,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a read chapter
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const mangaId = searchParams.get("mangaId");
    const chapterNumber = searchParams.get("chapterNumber");

    if (!userId || !mangaId || !chapterNumber) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    // Fetch existing record
    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    // Remove chapter from array
    const currentChapters: number[] = existingRecord.chapters || [];
    const updatedChapters = currentChapters.filter(
      (ch) => ch !== parseInt(chapterNumber)
    );

    // Update the record
    const { error: updateError } = await supabase
      .from("user_reads")
      .update({
        chapters: updatedChapters,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Invalidate cache after successful deletion
    invalidateUserReadsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      readChapters: updatedChapters,
      message: `Chapter ${chapterNumber} unmarked as read`,
      cacheInvalidated: true,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}