// app/api/notifications/test-push/route.ts
// Simple test endpoint to verify push notifications work

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configure web-push
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - please login" },
        { status: 401 }
      );
    }

    console.log('Testing push notification for user:', userId);

    // Get user's push subscriptions
    const { data: pushSubs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      return NextResponse.json(
        { error: subsError.message },
        { status: 500 }
      );
    }

    if (!pushSubs || pushSubs.length === 0) {
      return NextResponse.json(
        { error: "No push subscriptions found for this user" },
        { status: 404 }
      );
    }

    console.log(`Found ${pushSubs.length} subscription(s) for user`);

    const payload = JSON.stringify({
      title: "🎉 Test Notification",
      body: "This is a test push notification from your server!",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: {
        url: "/test-notifications",
        timestamp: new Date().toISOString()
      },
      tag: "test-notification"
    });

    console.log('Sending notification with payload:', payload);

    const results = [];

    for (const pushSub of pushSubs) {
      const subscription = {
        endpoint: pushSub.endpoint,
        keys: {
          p256dh: pushSub.p256dh,
          auth: pushSub.auth,
        },
      };

      try {
        console.log('Attempting to send to:', subscription.endpoint.substring(0, 50) + '...');
        
        const result = await webpush.sendNotification(subscription, payload);
        console.log('✅ Notification sent successfully:', result.statusCode);
        
        results.push({
          success: true,
          statusCode: result.statusCode
        });
      } catch (err: any) {
        console.error('❌ Failed to send notification:', err.statusCode, err.body);
        
        results.push({
          success: false,
          error: err.message,
          statusCode: err.statusCode
        });

        // If subscription is invalid (410 Gone or 404), delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log('Removing invalid subscription...');
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", pushSub.id);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount}/${results.length} notifications`,
      results: results,
      totalSubscriptions: pushSubs.length
    });

  } catch (err: any) {
    console.error("Test push error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}