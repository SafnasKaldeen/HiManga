import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client (matches your .env typo)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("manga"); 
  const chapterParam = searchParams.get("chapter");

  // Validate input
  if (!mangaId || !chapterParam) {
    return NextResponse.json(
      { error: "Missing required parameters: manga and chapter" },
      { status: 400 }
    );
  }

  // Parse and validate chapter number
  const chapterNumber = parseFloat(chapterParam);
  if (isNaN(chapterNumber) || chapterNumber < 1) {
    return NextResponse.json(
      { error: "Invalid chapter number" },
      { status: 400 }
    );
  }

  try {
    console.log(`[Chapter Info] Fetching: manga=${mangaId}, chapter=${chapterNumber}`);

    // Query Supabase with proper numeric comparison
    const { data, error } = await supabase
      .from("chapters")
      .select(`
        id,
        manga_id,
        chapter_number,
        title,
        total_panels,
        published_at,
        manga:mangas!inner(
          id,
          slug,
          title
        )
      `)
      .eq("manga_id", mangaId)
      .eq("chapter_number", chapterNumber)
      .single();

    if (error) {
      console.error("[Chapter Info] Database error:", error);
      return NextResponse.json(
        { 
          error: "Chapter not found", 
          details: error.message,
          hint: error.hint || "Check if chapter exists in database"
        },
        { status: 404 }
      );
    }

    if (!data) {
      console.error("[Chapter Info] No data returned");
      return NextResponse.json(
        { error: "Chapter not found in database" },
        { status: 404 }
      );
    }

    // Type guard for manga relation
    if (!data.manga) {
      console.error("[Chapter Info] Manga relation missing:", data.id);
      return NextResponse.json(
        { error: "Invalid chapter data: manga not found" },
        { status: 500 }
      );
    }

    console.log(`[Chapter Info] Success: ${data.total_panels} panels found`);

    // Send response
    return NextResponse.json(
      {
        chapterId: data.id,
        chapterNumber: data.chapter_number,
        chapterTitle: data.title,
        totalPanels: data.total_panels,
        publishedAt: data.published_at,
        manga: {
          id: data.manga.id,
          slug: data.manga.slug,
          title: data.manga.title,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("[Chapter Info] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch chapter information",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}