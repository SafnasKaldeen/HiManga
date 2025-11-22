// app/api/news/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY
);

// Server-side in-memory cache
const newsCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

// Cache entry structure: { data, timestamp }
function getCachedNews(cacheKey) {
  const cached = newsCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache is expired
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
  
  if (isExpired) {
    newsCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

function setCachedNews(cacheKey, data) {
  newsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  console.log(`[News Cache] Cached ${data.articles?.length || 0} articles for key: ${cacheKey}`);
}

function getCacheKey(query, max) {
  return `news_${query}_${max}`;
}

// Periodic cleanup of expired cache entries (runs every 10 minutes)
setInterval(() => {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [key, value] of newsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      newsCache.delete(key);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`[News Cache] Cleanup: Removed ${removedCount} expired entries`);
  }
}, 10 * 60 * 1000); // Every 10 minutes

// Utility to sanitize Google News URLs
function sanitizeGoogleNewsURL(url) {
  try {
    if (!url) return url;

    // If URL is a Google "sorry" redirect, extract the actual article URL
    const parsed = new URL(url);
    if (parsed.hostname === 'www.google.com' && parsed.pathname.startsWith('/sorry/index')) {
      const continueParam = parsed.searchParams.get('continue');
      if (continueParam) {
        return decodeURIComponent(continueParam);
      }
    }

    return url; // If normal URL, just return
  } catch (err) {
    console.warn('Failed to sanitize URL:', url, err);
    return url; // fallback
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'anime';
    const max = parseInt(searchParams.get('max') || '50', 10);
    const skipCache = searchParams.get('skipCache') === 'true';

    const cacheKey = getCacheKey(query, max);

    // Check cache first if not skipping
    if (!skipCache) {
      const cached = getCachedNews(cacheKey);
      if (cached) {
        console.log(`[News API] Cache HIT: ${cacheKey}`);
        return Response.json(cached, {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache, 1 hour stale
            'X-Cache': 'HIT'
          }
        });
      }
    }

    console.log(`[News API] Cache MISS: Fetching from database for ${cacheKey}`);

    // Fetch articles from Supabase
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('query', query)
      .gt('expires_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(max);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch news from database', details: error.message },
        { status: 500 }
      );
    }

    // Handle empty results
    if (!data || data.length === 0) {
      const emptyResult = {
        totalArticles: 0,
        articles: []
      };
      
      // Cache empty results too (to avoid repeated queries)
      setCachedNews(cacheKey, emptyResult);
      
      return Response.json(emptyResult, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
          'X-Cache': 'MISS'
        }
      });
    }

    // Transform data and sanitize URLs
    const articles = data.map((article) => ({
      title: article.title || 'Untitled',
      description: article.published_text || 'No description available',
      url: sanitizeGoogleNewsURL(article.article_url),
      image_url: article.image_url || null,
      publishedAt: article.published_at,
      source: {
        name: article.publisher || 'Unknown Source',
        url: sanitizeGoogleNewsURL(article.article_url)
      }
    }));

    const result = {
      totalArticles: articles.length,
      articles
    };

    // Cache the result
    setCachedNews(cacheKey, result);

    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache, 1 hour stale
        'X-Cache': 'MISS'
      }
    });

  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// Optional: Export cache management functions for admin use
export function clearNewsCache() {
  const size = newsCache.size;
  newsCache.clear();
  console.log(`[News Cache] Manually cleared ${size} cache entries`);
  return size;
}

export function getNewsCacheStats() {
  const now = Date.now();
  const stats = {
    totalEntries: newsCache.size,
    entries: []
  };
  
  for (const [key, value] of newsCache.entries()) {
    const age = Math.floor((now - value.timestamp) / 1000);
    const ttl = Math.floor((CACHE_TTL_MS - (now - value.timestamp)) / 1000);
    stats.entries.push({
      key,
      articleCount: value.data.articles?.length || 0,
      ageSeconds: age,
      ttlSeconds: Math.max(0, ttl)
    });
  }
  
  return stats;
}