// app/api/news/route.js
import { createClient } from '@supabase/supabase-js';

// NEVER put fallback secrets in code.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY
);

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
      return Response.json({
        totalArticles: 0,
        articles: []
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

    return Response.json(
      {
        totalArticles: articles.length,
        articles
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );

  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}