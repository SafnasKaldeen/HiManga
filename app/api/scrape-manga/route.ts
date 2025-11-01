import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mangaSlug, mangaUrl, mangaName } = body;

    // Validation
    if (!mangaSlug || !mangaUrl) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'Both mangaSlug and mangaUrl are required'
        },
        { status: 400 }
      );
    }

    // Check required environment variables
    const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = process.env;

    // DEBUG: Log configuration (remove token for security)
    console.log('GitHub Config:', {
      username: GITHUB_USERNAME,
      repo: GITHUB_REPO,
      hasToken: !!GITHUB_TOKEN,
      tokenPrefix: GITHUB_TOKEN?.substring(0, 7), // Only log first 7 chars
    });

    if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
      console.error('Missing environment variables:', {
        hasUsername: !!GITHUB_USERNAME,
        hasRepo: !!GITHUB_REPO,
        hasToken: !!GITHUB_TOKEN,
      });
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          details: 'Missing GitHub credentials'
        },
        { status: 500 }
      );
    }

    // Build GitHub API URL
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/dispatches`;
    
    console.log('GitHub API URL:', githubApiUrl);

    // Trigger GitHub Actions workflow
    const response = await fetch(githubApiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Manga-Scraper-App',
      },
      body: JSON.stringify({
        event_type: 'scrape-manga',
        client_payload: {
          manga_slug: mangaSlug,
          manga_url: mangaUrl,
          manga_name: mangaName || mangaSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          triggered_at: new Date().toISOString(),
        },
      }),
    });

    console.log('GitHub API Response:', {
      status: response.status,
      statusText: response.statusText,
    });

    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: `Scraping "${mangaName || mangaSlug}" started successfully!`,
        manga: mangaName || mangaSlug,
        status: 'running',
        github_actions_url: `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/actions`,
      });
    }

    // Handle GitHub API errors
    const errorData = await response.text();
    console.error('GitHub API error:', response.status, errorData);

    return NextResponse.json(
      { 
        error: 'Failed to trigger GitHub Actions',
        details: `GitHub API returned status ${response.status}`,
        debug: {
          url: githubApiUrl,
          status: response.status,
          response: errorData,
        }
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error in scrape-manga API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST request.' },
    { status: 405 }
  );
}