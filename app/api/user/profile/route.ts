// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const CACHE_KEY_PREFIX = "user_profile_cache_";
const CACHE_EXPIRY_HOURS = 24; // 1 day

// Helper to get cache key
function getCacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

// Helper to check if cache is expired
function isCacheExpired(timestamp: number): boolean {
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // 24 hours in ms
  return Date.now() - timestamp > expiryMs;
}

// Helper to get cached user profile
function getCachedProfile(userId: string): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(userId);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { user, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (isCacheExpired(timestamp)) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return user;
    }
  } catch (error) {
    console.error("Error reading user profile from cache:", error);
  }
  
  return null;
}

// Helper to cache user profile
function cacheProfile(userId: string, user: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(userId);
    const cacheData = {
      user,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[User Profile Cache] Cached profile for user ${userId}`);
  } catch (error) {
    console.error("Error caching user profile:", error);
    // If localStorage is full, try to clear old profile cache entries
    if (error.name === 'QuotaExceededError') {
      clearOldProfileCache();
      // Try one more time
      try {
        const cacheKey = getCacheKey(userId);
        const cacheData = {
          user,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("Failed to cache user profile after cleanup:", retryError);
      }
    }
  }
}

// Helper to clear old cache entries
function clearOldProfileCache(): void {
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
    console.log(`[User Profile Cache] Cleared ${keysToRemove.length} expired profile entries`);
  } catch (error) {
    console.error("Error clearing old profile cache:", error);
  }
}

// Helper to invalidate user profile cache
export function invalidateProfileCache(userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(userId);
    localStorage.removeItem(cacheKey);
    console.log(`[User Profile Cache] Invalidated cache for user ${userId}`);
  } catch (error) {
    console.error("Error invalidating profile cache:", error);
  }
}

// Helper to invalidate all profile caches
export function invalidateAllProfileCache(): void {
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
    console.log(`[User Profile Cache] Invalidated all ${keysToRemove.length} profile caches`);
  } catch (error) {
    console.error("Error invalidating all profile cache:", error);
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!userId || !accessToken) {
      return NextResponse.json(
        { 
          error: 'Unauthorized - Please login again',
          debug: {
            hasUserId: !!userId,
            hasAccessToken: !!accessToken,
            availableCookies: cookieStore.getAll().map(c => c.name)
          }
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, avatarId } = body;

    // Build update object
    const updates: any = {};
    if (username !== undefined) updates.username = username;
    if (avatarId !== undefined) updates.avatar_id = avatarId;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update user profile in Supabase
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Invalidate cache after successful update
    invalidateProfileCache(userId);

    return NextResponse.json(
      { 
        message: 'Profile updated successfully', 
        user: data,
        cacheInvalidated: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const url = new URL(request.url);
    const skipCache = url.searchParams.get('skipCache') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check cache first if not skipping
    if (!skipCache) {
      const cached = getCachedProfile(userId);
      if (cached) {
        console.log(`[User Profile] Cache HIT: user=${userId}`);
        return NextResponse.json(
          { user: cached },
          { 
            status: 200,
            headers: {
              "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800", // 1 day, stale 2 days
              "X-Cache": "HIT",
            }
          }
        );
      }
    }

    console.log(`[User Profile] Cache MISS: Fetching profile for user=${userId}`);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Cache the profile
    cacheProfile(userId, data);

    return NextResponse.json(
      { user: data },
      { 
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800", // 1 day, stale 2 days
          "X-Cache": "MISS",
        }
      }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}