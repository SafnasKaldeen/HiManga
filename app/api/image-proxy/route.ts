// app/api/image-proxy/route.js

const CACHE_KEY_PREFIX = "image_proxy_cache_";
const CACHE_EXPIRY_DAYS = 30;

// Helper to get cache key from URL
function getCacheKey(imageUrl) {
  // Create a hash-like key from the URL
  return `${CACHE_KEY_PREFIX}${btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}`;
}

// Helper to check if cache is expired
function isCacheExpired(timestamp) {
  const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 30 days in ms
  return Date.now() - timestamp > expiryMs;
}

// Helper to get cached image (server-side compatible)
function getCachedImage(imageUrl) {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(imageUrl);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, contentType, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (isCacheExpired(timestamp)) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return { data, contentType };
    }
  } catch (error) {
    console.error("Error reading image from cache:", error);
  }
  
  return null;
}

// Helper to cache image
function cacheImage(imageUrl, data, contentType) {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(imageUrl);
    const cacheData = {
      data,
      contentType,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching image:", error);
    // If localStorage is full, try to clear old entries
    if (error.name === 'QuotaExceededError') {
      clearOldImageCache();
      // Try one more time
      try {
        const cacheKey = getCacheKey(imageUrl);
        const cacheData = {
          data,
          contentType,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error("Failed to cache image after cleanup:", retryError);
      }
    }
  }
}

// Helper to clear old cache entries
function clearOldImageCache() {
  if (typeof window === 'undefined') return;
  
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
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
    console.log(`Cleared ${keysToRemove.length} expired image cache entries`);
  } catch (error) {
    console.error("Error clearing old cache:", error);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const skipCache = searchParams.get('skipCache') === 'true';

    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400 });
    }

    // Check cache first if not skipping
    if (!skipCache) {
      const cached = getCachedImage(imageUrl);
      if (cached) {
        // Convert base64 back to buffer
        const buffer = Buffer.from(cached.data, 'base64');
        return new Response(buffer, {
          headers: {
            'Content-Type': cached.contentType,
            'Cache-Control': 'public, max-age=2592000, s-maxage=2592000', // 30 days
            'X-Cache': 'HIT',
          },
        });
      }
    }

    // Fetch the image with proper headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://news.google.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    // Convert to base64 for localStorage
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    
    // Cache the image (async, don't wait)
    cacheImage(imageUrl, base64Data, contentType);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000', // 30 days
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    // Return a transparent 1x1 pixel
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    return new Response(transparentPixel, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}