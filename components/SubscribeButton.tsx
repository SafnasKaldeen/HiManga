"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

interface SubscribeButtonProps {
  mangaId: string;
  className?: string;
}

export function SubscribeButton({ mangaId, className = "" }: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, [mangaId]);

  const checkSubscription = async () => {
    try {
      const res = await fetch(`/api/manga/subscribe?mangaId=${mangaId}`);
      if (res.ok) {
        const data = await res.json();
        setSubscribed(data.subscribed);
      }
    } catch (err) {
      console.error("Failed to check subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      if (subscribed) {
        // Unsubscribe
        const res = await fetch(`/api/manga/subscribe?mangaId=${mangaId}`, {
          method: "DELETE",
        });
        
        if (res.ok) {
          setSubscribed(false);
          showToast("Unsubscribed from notifications");
        }
      } else {
        // Subscribe
        const res = await fetch("/api/manga/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mangaId,
            notifyPush: true,
            notifyEmail: false,
          }),
        });
        
        if (res.ok) {
          setSubscribed(true);
          showToast("Subscribed to new chapter notifications!");
          
          // Request push notification permission
          if ("Notification" in window && Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              await registerPushSubscription();
            }
          }
        }
      }
    } catch (err) {
      console.error("Subscription action failed:", err);
      showToast("Failed to update subscription", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const registerPushSubscription = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notifications not supported");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Save subscription to backend
      await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
    } catch (err) {
      console.error("Failed to register push subscription:", err);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    // You can implement your own toast notification system
    // For now, using a simple alert
    console.log(message);
  };

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 ${className}`}
      >
        <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
        <span>Loading...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={actionLoading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all active:scale-95 ${
        subscribed
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30"
          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30"
      } ${actionLoading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {actionLoading ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
      ) : subscribed ? (
        <BellOff className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      <span>{subscribed ? "Subscribed" : "Subscribe"}</span>
    </button>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}