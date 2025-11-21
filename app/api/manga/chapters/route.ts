import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mangaId = searchParams.get("mangaId");

  if (!mangaId) {
    return NextResponse.json({ chapters: [] }, { status: 400 });
  }

  const allChapters: any[] = [];
  let start = 0;
  const chunkSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("manga_id", mangaId)
      .order("chapter_number", { ascending: true })
      .range(start, start + chunkSize - 1);

    if (error) {
      return NextResponse.json({ chapters: [], error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) break;

    allChapters.push(...data);

    if (data.length < chunkSize) break;

    start += chunkSize;
  }

  return NextResponse.json({ chapters: allChapters });
}
