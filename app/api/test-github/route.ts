import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } = process.env;

  // Check if variables exist
  if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
    return NextResponse.json({
      error: 'Missing environment variables',
      has: {
        username: !!GITHUB_USERNAME,
        repo: !!GITHUB_REPO,
        token: !!GITHUB_TOKEN,
      }
    }, { status: 500 });
  }

  // Test GitHub API access
  try {
    const repoUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`;
    
    const response = await fetch(repoUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Manga-Scraper-Test',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'GitHub API connection successful!',
        repo: {
          name: data.name,
          full_name: data.full_name,
          private: data.private,
          url: data.html_url,
        },
        dispatches_url: `${repoUrl}/dispatches`,
      });
    } else {
      return NextResponse.json({
        error: 'GitHub API error',
        status: response.status,
        message: data.message,
        details: data,
      }, { status: response.status });
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to connect to GitHub',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}