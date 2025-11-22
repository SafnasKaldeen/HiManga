// ==============================================
// FILE: app/api/manga/image/route.ts
// ==============================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

const CACHE_KEY_PREFIX = "manga_image_cache_";
const CACHE_URL_PREFIX = "manga_image_url_cache_";
const CACHE_EXPIRY_DAYS = 7;

// Helper to get cache key for image data
function getImageCacheKey(mangaSlug: string, chapter: number, panel: number): string {
  return `${CACHE_KEY_PREFIX}${mangaSlug}_${chapter}_${panel}`;
}

// Helper to get cache key for image URL
function getUrlCacheKey(mangaSlug: string, chapter: number, panel: number): string {
  return `${CACHE_URL_PREFIX}${mangaSlug}_${chapter}_${panel}`;
}

// Helper to check if cache is expired
function isCacheExpired(timestamp: number): boolean {
  const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms
  return Date.now() - timestamp > expiryMs;
}

// Helper to get cached image
function getCachedImage(mangaSlug: string, chapter: number, panel: number): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getImageCacheKey(mangaSlug, chapter, panel);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, contentType, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (isCacheExpired(timestamp)) {
        localStorage.removeItem(cacheKey);
        // Also remove the URL cache
        const urlCacheKey = getUrlCacheKey(mangaSlug, chapter, panel);
        localStorage.removeItem(urlCacheKey);
        return null;
      }
      
      return { data, contentType };
    }
  } catch (error) {
    console.error("Error reading manga image from cache:", error);
  }
  
  return null;
}

// Helper to get cached image URL (to skip Supabase query)
function getCachedImageUrl(mangaSlug: string, chapter: number, panel: number): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const urlCacheKey = getUrlCacheKey(mangaSlug, chapter, panel);
    const cached = localStorage.getItem(urlCacheKey);
    
    if (cached) {
      const { url, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (isCacheExpired(timestamp)) {
        localStorage.removeItem(urlCacheKey);
        return null;
      }
      
      return url;
    }
  } catch (error) {
    console.error("Error reading image URL from cache:", error);
  }
  
  return null;
}

// Helper to cache image
function cacheImage(mangaSlug: string, chapter: number, panel: number, data: string, contentType: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getImageCacheKey(mangaSlug, chapter, panel);
    const cacheData = {
      data,
      contentType,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching manga image:", error);
    // If localStorage is full, try to clear old entries
    if (error.name === 'QuotaExceededError') {
      clearOldMangaImageCache();
      // Try one more time
      try {
        const cacheKey = getImageCacheKey(mangaSlug, chapter, panel);
        const cacheData = {
          data,
          contentType,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("Failed to cache manga image after cleanup:", retryError);
      }
    }
  }
}

// Helper to cache image URL
function cacheImageUrl(mangaSlug: string, chapter: number, panel: number, url: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const urlCacheKey = getUrlCacheKey(mangaSlug, chapter, panel);
    const cacheData = {
      url,
      timestamp: Date.now()
    };
    
    localStorage.setItem(urlCacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching image URL:", error);
  }
}

// Helper to clear old cache entries
function clearOldMangaImageCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(CACHE_URL_PREFIX))) {
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
    console.log(`[Manga Image Cache] Cleared ${keysToRemove.length} expired entries`);
  } catch (error) {
    console.error("Error clearing old manga image cache:", error);
  }
}

// Helper to invalidate specific image cache
export function invalidateMangaImageCache(mangaSlug: string, chapter: number, panel: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getImageCacheKey(mangaSlug, chapter, panel);
    const urlCacheKey = getUrlCacheKey(mangaSlug, chapter, panel);
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(urlCacheKey);
    console.log(`[Manga Image Cache] Invalidated cache for ${mangaSlug} ch${chapter} p${panel}`);
  } catch (error) {
    console.error("Error invalidating manga image cache:", error);
  }
}

// Helper to invalidate all images for a chapter
export function invalidateMangaChapterImagesCache(mangaSlug: string, chapter: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove: string[] = [];
    const imagePrefix = `${CACHE_KEY_PREFIX}${mangaSlug}_${chapter}_`;
    const urlPrefix = `${CACHE_URL_PREFIX}${mangaSlug}_${chapter}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(imagePrefix) || key.startsWith(urlPrefix))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Manga Image Cache] Invalidated ${keysToRemove.length} images for ${mangaSlug} ch${chapter}`);
  } catch (error) {
    console.error("Error invalidating manga chapter images cache:", error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaSlug = searchParams.get("manga");
  const chapter = searchParams.get("chapter");
  const panel = searchParams.get("panel");
  const skipCache = searchParams.get("skipCache") === "true";

  // Validate input
  if (!mangaSlug || !chapter || !panel) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const chapterNum = parseFloat(chapter);
  const panelNum = parseInt(panel);

  if (isNaN(chapterNum) || isNaN(panelNum) || chapterNum < 1 || panelNum < 1) {
    return NextResponse.json(
      { error: "Invalid chapter or panel number" },
      { status: 400 }
    );
  }

  // Check cache first if not skipping
  if (!skipCache) {
    const cached = getCachedImage(mangaSlug, chapterNum, panelNum);
    if (cached) {
      console.log(`[Manga Image] Cache HIT: ${mangaSlug} ch${chapterNum} p${panelNum}`);
      const buffer = Buffer.from(cached.data, 'base64');
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable", // 7 days
          "X-Content-Type-Options": "nosniff",
          "X-Cache": "HIT",
        },
      });
    }
  }

  console.log(`[Manga Image] Cache MISS: Fetching ${mangaSlug} ch${chapterNum} p${panelNum}`);

  try {
    // Check if we have the URL cached (skip Supabase query)
    let imageUrl = getCachedImageUrl(mangaSlug, chapterNum, panelNum);
    
    if (!imageUrl) {
      // Query Supabase to get the image URL
      const { data, error } = await supabase
        .from("panels")
        .select(
          `
          image_url,
          chapter:chapters!inner(
            chapter_number,
            manga:mangas!inner(
              slug
            )
          )
        `
        )
        .eq("chapter.manga.slug", mangaSlug)
        .eq("chapter.chapter_number", chapterNum)
        .eq("panel_number", panelNum)
        .single();

      if (error || !data) {
        console.error("Database query error:", error);
        return NextResponse.json(
          { error: "Image not found" },
          { status: 404 }
        );
      }

      imageUrl = data.image_url;
      
      // Cache the URL for future requests
      cacheImageUrl(mangaSlug, chapterNum, panelNum, imageUrl);
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "HiManga-Server/1.0",
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from source" },
        { status: 404 }
      );
    }

    // Stream the image to client
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Convert to base64 for localStorage
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    
    // Cache the image (async, don't wait)
    cacheImage(mangaSlug, chapterNum, panelNum, base64Data, contentType);

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable", // 7 days
        "X-Content-Type-Options": "nosniff",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}