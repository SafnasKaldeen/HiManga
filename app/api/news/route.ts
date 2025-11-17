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
      .gt('expires_at', new Date().toISOString()) // Only get non-expired articles
      .order('published_at', { ascending: false })
      .limit(max);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch news from database', details: error.message },
        { status: 500 }
      );
    }

    // Transform Supabase data to match the GNews API format
    const articles = data.map((article) => ({
      title: article.title,
      description: article.published_text || 'No description available',
      url: article.article_url,
      image: article.image_url,
      publishedAt: article.published_at,
      source: {
        name: article.publisher || 'Unknown',
        url: article.article_url
      }
    }));

    return Response.json({
      totalArticles: articles.length,
      articles: articles
    });

  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}