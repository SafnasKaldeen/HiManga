// ==============================================
// FILE: app/api/manga/image/route.ts
// ==============================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaSlug = searchParams.get("manga");
  const chapter = searchParams.get("chapter");
  const panel = searchParams.get("panel");

  // Validate input
  if (!mangaSlug || !chapter || !panel) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const chapterNum = parseFloat(chapter);
  const panelNum = parseInt(panel);

  if (isNaN(chapterNum) || isNaN(panelNum) || chapterNum < 1 || panelNum < 1) {
    return NextResponse.json(
      { error: "Invalid chapter or panel number" },
      { status: 400 }
    );
  }

  try {
    // Query Supabase to get the image URL
    const { data, error } = await supabase
      .from("panels")
      .select(
        `
        image_url,
        chapter:chapters!inner(
          chapter_number,
          manga:mangas!inner(
            slug
          )
        )
      `
      )
      .eq("chapter.manga.slug", mangaSlug)
      .eq("chapter.chapter_number", chapterNum)
      .eq("panel_number", panelNum)
      .single();

    if (error || !data) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    const imageUrl = data.image_url;

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "HiManga-Server/1.0",
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from source" },
        { status: 404 }
      );
    }

    // Stream the image to client
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}