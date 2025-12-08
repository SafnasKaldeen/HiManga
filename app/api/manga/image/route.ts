// ==============================================
// FILE: app/api/manga/image/route.ts
// Server-side API route - caching handled on client
// ==============================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// In-memory cache for the server (resets on restart)
// For production, use Redis or similar
const serverCache = new Map<string, {
  buffer: Buffer;
  contentType: string;
  timestamp: number;
}>();

const urlCache = new Map<string, {
  url: string;
  timestamp: number;
}>();

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(mangaSlug: string, chapter: number, panel: number): string {
  return `${mangaSlug}_${chapter}_${panel}`;
}

function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_EXPIRY_MS;
}

async function fetchImageWithRetry(imageUrl: string, retries = 3): Promise<Response> {
  const methods = [
    // Method 1: Direct fetch with realistic browser headers
    async () => {
      return fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://mangaread.org/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "no-cors",
          "Sec-Fetch-Site": "same-origin",
        },
        cache: "no-store",
      });
    },
    
    // Method 2: Use CORS proxy
    async () => {
      const proxiedUrl = "https://corsproxy.io/?" + encodeURIComponent(imageUrl);
      return fetch(proxiedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    },
    
    // Method 3: Alternative with delay
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Referer": "https://mangaread.org/",
          "Accept": "image/*",
        },
      });
    },
  ];

  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    for (const method of methods) {
      try {
        const response = await method();
        if (response.ok) {
          return response;
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`Fetch attempt failed:`, error);
      }
    }
    
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  
  throw lastError || new Error("All fetch attempts failed");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaSlug = searchParams.get("manga");
  const chapter = searchParams.get("chapter");
  const panel = searchParams.get("panel");
  const skipCache = searchParams.get("skipCache") === "true";

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

  const cacheKey = getCacheKey(mangaSlug, chapterNum, panelNum);

  // Check server cache
  if (!skipCache) {
    const cached = serverCache.get(cacheKey);
    if (cached && !isCacheExpired(cached.timestamp)) {
      console.log(`[Manga Image] Server Cache HIT: ${mangaSlug} ch${chapterNum} p${panelNum}`);
      return new NextResponse(cached.buffer, {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Content-Type-Options": "nosniff",
          "X-Cache": "HIT",
        },
      });
    }
  }

  console.log(`[Manga Image] Cache MISS: Fetching ${mangaSlug} ch${chapterNum} p${panelNum}`);

  try {
    // Check URL cache
    let imageUrl: string | undefined;
    const cachedUrl = urlCache.get(cacheKey);
    
    if (cachedUrl && !isCacheExpired(cachedUrl.timestamp)) {
      imageUrl = cachedUrl.url;
    } else {
      // Query Supabase
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
      urlCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });
    }

    // Fetch image with retry
    console.log(`Fetching image: ${imageUrl}`);
    const imageResponse = await fetchImageWithRetry(imageUrl);

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(imageBuffer);

    // Cache in memory
    serverCache.set(cacheKey, {
      buffer,
      contentType,
      timestamp: Date.now(),
    });

    // Clean old cache entries periodically (1% chance per request)
    if (Math.random() < 0.01) {
      const now = Date.now();
      for (const [key, value] of serverCache.entries()) {
        if (isCacheExpired(value.timestamp)) {
          serverCache.delete(key);
        }
      }
      for (const [key, value] of urlCache.entries()) {
        if (isCacheExpired(value.timestamp)) {
          urlCache.delete(key);
        }
      }
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Content-Type-Options": "nosniff",
        "X-Cache": "MISS",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image: " + (error as Error).message },
      { status: 500 }
    );
  }
}