// app/api/manga/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Subscribe to manga
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mangaId, notifyEmail = false, notifyPush = true } = await req.json();

    if (!mangaId) {
      return NextResponse.json(
        { error: "mangaId is required" },
        { status: 400 }
      );
    }

    // Upsert subscription
    const { data, error } = await supabase
      .from("manga_subscriptions")
      .upsert({
        user_id: userId,
        manga_id: mangaId,
        notify_email: notifyEmail,
        notify_push: notifyPush,
        subscribed_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,manga_id"
      })
      .select()
      .single();

    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to manga",
      subscription: data,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Unsubscribe from manga
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mangaId = searchParams.get("mangaId");

    if (!mangaId) {
      return NextResponse.json(
        { error: "mangaId is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("manga_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed from manga",
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check subscription status
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mangaId = searchParams.get("mangaId");

    if (!mangaId) {
      return NextResponse.json(
        { error: "mangaId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("manga_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
      console.error("Check subscription error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscribed: !!data,
      subscription: data || null,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}