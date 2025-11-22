// app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configure web-push (you'll need to generate VAPID keys)
// Run: npx web-push generate-vapid-keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // This should be protected - only admins can send notifications
    const { mangaId, chapterNumber, chapterTitle } = await req.json();

    if (!mangaId || !chapterNumber) {
      return NextResponse.json(
        { error: "mangaId and chapterNumber are required" },
        { status: 400 }
      );
    }

    // Get manga details
    const { data: manga, error: mangaError } = await supabase
      .from("mangas")
      .select("title")
      .eq("id", mangaId)
      .single();

    if (mangaError || !manga) {
      return NextResponse.json(
        { error: "Manga not found" },
        { status: 404 }
      );
    }

    // Get all subscribers for this manga
    const { data: subscribers, error: subsError } = await supabase
      .from("manga_subscriptions")
      .select("user_id, notify_email, notify_push")
      .eq("manga_id", mangaId)
      .eq("notify_new_chapter", true);

    if (subsError) {
      console.error("Subscribers fetch error:", subsError);
      return NextResponse.json(
        { error: subsError.message },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscribers to notify",
        notified: 0,
      });
    }

    const title = `New Chapter Released!`;
    const message = `${manga.title} - Chapter ${chapterNumber}${chapterTitle ? `: ${chapterTitle}` : ''} is now available!`;

    // Create in-app notifications for all subscribers
    const notifications = subscribers.map(sub => ({
      user_id: sub.user_id,
      manga_id: mangaId,
      type: "new_chapter",
      title: title,
      message: message,
      chapter_number: chapterNumber,
      read: false,
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    // Send push notifications
    const pushPromises: Promise<any>[] = [];
    
    for (const subscriber of subscribers.filter(s => s.notify_push)) {
      // Get push subscriptions for this user
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", subscriber.user_id);

      if (pushSubs && pushSubs.length > 0) {
        for (const pushSub of pushSubs) {
          const subscription = {
            endpoint: pushSub.endpoint,
            keys: {
              p256dh: pushSub.p256dh,
              auth: pushSub.auth,
            },
          };

          const payload = JSON.stringify({
            title: title,
            body: message,
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
            data: {
              url: `/manga/${mangaId}/chapter/${chapterNumber}`,
              mangaId: mangaId,
              chapterNumber: chapterNumber,
            },
          });

          pushPromises.push(
            webpush.sendNotification(subscription, payload).catch(err => {
              console.error("Push notification failed:", err);
              // If subscription is invalid, delete it
              if (err.statusCode === 410 || err.statusCode === 404) {
                supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("id", pushSub.id)
                  .then(() => console.log("Removed invalid push subscription"));
              }
            })
          );
        }
      }
    }

    await Promise.all(pushPromises);

    return NextResponse.json({
      success: true,
      message: `Notified ${subscribers.length} subscribers`,
      notified: subscribers.length,
    });
  } catch (err) {
    console.error("Send notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}