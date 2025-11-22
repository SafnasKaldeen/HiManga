// app/api/manga/chapters/user-reads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const mangaId = searchParams.get("mangaId");

  // Validate required parameters
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required", readChapters: [] },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from("user_reads")
      .select("manga_id, chapters")
      .eq("user_id", userId);

    // If mangaId is provided, filter for specific manga
    if (mangaId) {
      query = query.eq("manga_id", mangaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, readChapters: [] },
        { status: 500 }
      );
    }

    // If fetching for specific manga, return just the chapters array
    if (mangaId) {
      const mangaRead = data?.[0];
      return NextResponse.json({
        mangaId,
        readChapters: mangaRead?.chapters || [],
      });
    }

    // If fetching all manga, return structured data
    const userReads = data?.map((item) => ({
      mangaId: item.manga_id,
      readChapters: item.chapters || [],
    })) || [];

    return NextResponse.json({
      userId,
      reads: userReads,
      totalManga: userReads.length,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", readChapters: [] },
      { status: 500 }
    );
  }
}

// POST endpoint to update read chapters
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, mangaId, chapterNumber } = body;

    if (!userId || !mangaId || chapterNumber === undefined) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    // First, check if record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    let currentChapters: number[] = [];

    if (existingRecord && !fetchError) {
      currentChapters = existingRecord.chapters || [];
    }

    // Add chapter if not already in array
    if (!currentChapters.includes(chapterNumber)) {
      currentChapters.push(chapterNumber);
      currentChapters.sort((a, b) => a - b);
    }

    // Upsert the record
    const { data, error } = await supabase
      .from("user_reads")
      .upsert(
        {
          user_id: userId,
          manga_id: mangaId,
          chapters: currentChapters,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,manga_id",
        }
      )
      .select();

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      readChapters: currentChapters,
      message: `Chapter ${chapterNumber} marked as read`,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a read chapter
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const mangaId = searchParams.get("mangaId");
    const chapterNumber = searchParams.get("chapterNumber");

    if (!userId || !mangaId || !chapterNumber) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    // Fetch existing record
    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    // Remove chapter from array
    const currentChapters: number[] = existingRecord.chapters || [];
    const updatedChapters = currentChapters.filter(
      (ch) => ch !== parseInt(chapterNumber)
    );

    // Update the record
    const { error: updateError } = await supabase
      .from("user_reads")
      .update({
        chapters: updatedChapters,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      readChapters: updatedChapters,
      message: `Chapter ${chapterNumber} unmarked as read`,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}