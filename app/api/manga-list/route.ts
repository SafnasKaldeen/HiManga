// app/api/manga-list/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

interface MangaItem {
  slug: string;
  url: string;
  name: string;
  thumbnail?: string;
  latestChapter?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    
    const response = await fetch(`https://www.mangaread.org/manga-list/?page=${page}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch manga list');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const mangaList: MangaItem[] = [];

    // Adjust selectors based on actual HTML structure
    $('.manga-item, .item, .post-title').each((_, element) => {
      const $element = $(element);
      const link = $element.find('a').first();
      const url = link.attr('href');
      const name = link.text().trim() || link.attr('title')?.trim();
      const thumbnail = $element.find('img').first().attr('src') || $element.find('img').first().attr('data-src');
      const latestChapter = $element.find('.chapter, .latest-chapter').first().text().trim();

      if (url && name) {
        const slug = url.split('/manga/')[1]?.replace(/\/$/, '') || url.split('/').filter(Boolean).pop();
        
        if (slug && !mangaList.find(m => m.slug === slug)) {
          mangaList.push({
            slug,
            url: url.startsWith('http') ? url : `https://www.mangaread.org${url}`,
            name,
            thumbnail,
            latestChapter,
          });
        }
      }
    });

    // If no manga found with first selector, try alternative
    if (mangaList.length === 0) {
      $('a[href*="/manga/"]').each((_, element) => {
        const $element = $(element);
        const url = $element.attr('href');
        const name = $element.text().trim() || $element.attr('title')?.trim();

        if (url && name && url.includes('/manga/') && !url.includes('/chapter/')) {
          const slug = url.split('/manga/')[1]?.replace(/\/$/, '');
          
          if (slug && !mangaList.find(m => m.slug === slug)) {
            mangaList.push({
              slug,
              url: url.startsWith('http') ? url : `https://www.mangaread.org${url}`,
              name,
            });
          }
        }
      });
    }

    const limitNum = parseInt(limit as string);
    const limitedList = mangaList.slice(0, limitNum);

    return NextResponse.json({
      success: true,
      data: limitedList,
      total: limitedList.length,
      page: parseInt(page as string),
    });
  } catch (error) {
    console.error('Error scraping manga list:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch manga list',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}