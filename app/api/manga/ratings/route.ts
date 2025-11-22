// app/api/manga/ratings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

// LocalStorage key for caching ratings
const RATINGS_CACHE_KEY = "manga_ratings_cache";
const CACHE_VERSION_KEY = "manga_ratings_cache_version";

// Helper to get cached ratings from localStorage (client-side only)
function getCachedRatings(userId: string): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${RATINGS_CACHE_KEY}_${userId}`);
    const version = localStorage.getItem(`${CACHE_VERSION_KEY}_${userId}`);
    
    if (cached && version) {
      return {
        data: JSON.parse(cached),
        version: parseInt(version)
      };
    }
  } catch (error) {
    console.error("Error reading from cache:", error);
  }
  
  return null;
}

// Helper to set cached ratings in localStorage (client-side only)
function setCachedRatings(userId: string, data: any, version: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${RATINGS_CACHE_KEY}_${userId}`, JSON.stringify(data));
    localStorage.setItem(`${CACHE_VERSION_KEY}_${userId}`, version.toString());
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
}

// Helper to invalidate cache
function invalidateCache(userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${RATINGS_CACHE_KEY}_${userId}`);
    const currentVersion = localStorage.getItem(`${CACHE_VERSION_KEY}_${userId}`);
    const newVersion = currentVersion ? parseInt(currentVersion) + 1 : 1;
    localStorage.setItem(`${CACHE_VERSION_KEY}_${userId}`, newVersion.toString());
  } catch (error) {
    console.error("Error invalidating cache:", error);
  }
}

// GET endpoint to fetch user rating(s)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const mangaId = searchParams.get("mangaId");
  const skipCache = searchParams.get("skipCache") === "true";

  // Validate required parameters
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required", rating: null },
      { status: 400 }
    );
  }

  // Check cache first if not skipping
  if (!skipCache) {
    const cached = getCachedRatings(userId);
    
    if (cached) {
      // If fetching for specific manga
      if (mangaId) {
        const cachedRating = cached.data.find((r: any) => r.mangaId === mangaId);
        return NextResponse.json({
          mangaId,
          rating: cachedRating?.rating || null,
          review: cachedRating?.review || null,
          createdAt: cachedRating?.createdAt,
          updatedAt: cachedRating?.updatedAt,
          fromCache: true,
          cacheVersion: cached.version
        });
      }
      
      // Return all cached ratings
      return NextResponse.json({
        userId,
        ratings: cached.data,
        totalRatings: cached.data.length,
        fromCache: true,
        cacheVersion: cached.version
      });
    }
  }

  try {
    let query = supabase
      .from("user_ratings")
      .select("manga_id, rating, review, created_at, updated_at")
      .eq("user_id", userId);

    // If mangaId is provided, filter for specific manga
    if (mangaId) {
      query = query.eq("manga_id", mangaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, rating: null },
        { status: 500 }
      );
    }

    // Transform and cache the data
    const userRatings = data?.map((item) => ({
      mangaId: item.manga_id,
      rating: item.rating,
      review: item.review,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) || [];

    // Cache all ratings
    const currentVersion = typeof window !== 'undefined' 
      ? parseInt(localStorage.getItem(`${CACHE_VERSION_KEY}_${userId}`) || "0")
      : 0;
    setCachedRatings(userId, userRatings, currentVersion);

    // If fetching for specific manga, return just the rating
    if (mangaId) {
      const userRating = userRatings[0];
      return NextResponse.json({
        mangaId,
        rating: userRating?.rating || null,
        review: userRating?.review || null,
        createdAt: userRating?.createdAt,
        updatedAt: userRating?.updatedAt,
        fromCache: false
      });
    }

    // If fetching all ratings, return structured data
    return NextResponse.json({
      userId,
      ratings: userRatings,
      totalRatings: userRatings.length,
      fromCache: false
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", rating: null },
      { status: 500 }
    );
  }
}

// POST endpoint to create or update a rating
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const body = await req.json();
    const { mangaId, rating, review } = body;

    if (!userId || !mangaId || rating === undefined) {
      return NextResponse.json(
        { error: "userId, mangaId, and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Upsert the rating
    const { data, error } = await supabase
      .from("user_ratings")
      .upsert(
        {
          user_id: userId,
          manga_id: mangaId,
          rating: rating,
          review: review || null,
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
    invalidateCache(userId);

    return NextResponse.json({
      success: true,
      rating: data?.[0],
      message: `Rating ${rating}/5 saved successfully`,
      cacheInvalidated: true
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a rating
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const mangaId = searchParams.get("mangaId");

    if (!userId || !mangaId) {
      return NextResponse.json(
        { error: "userId and mangaId are required" },
        { status: 400 }
      );
    }

    // Delete the rating
    const { error } = await supabase
      .from("user_ratings")
      .delete()
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Invalidate cache after successful deletion
    invalidateCache(userId);

    return NextResponse.json({
      success: true,
      message: "Rating deleted successfully",
      cacheInvalidated: true
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}