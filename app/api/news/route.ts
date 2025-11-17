// app/api/news/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ppfbpmbomksqlgojwdhr.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZmJwbWJvbWtzcWxnb2p3ZGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTQ5NDMsImV4cCI6MjA3NjQzMDk0M30.5j7kSkZhoMZgvCGcxdG2phuoN3dwout3JgD1i1cUqaY'
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'anime';
    const max = parseInt(searchParams.get('max') || '50', 10);

    // Fetch articles from Supabase
    // Order by published_at descending (newest first)
    // Filter by query and only get non-expired articles
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

    // Transform Supabase data to match expected frontend format
    const articles = data.map((article) => ({
      title: article.title || 'Untitled',
      description: article.published_text || 'No description available',
      url: article.article_url,
      image_url: article.image_url || null, // Keep as image_url to match frontend
      publishedAt: article.published_at,
      source: {
        name: article.publisher || 'Unknown Source',
        url: article.article_url
      }
    }));

    return Response.json({
      totalArticles: articles.length,
      articles: articles
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
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