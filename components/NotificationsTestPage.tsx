"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Info,
  AlertCircle,
} from "lucide-react";

export default function NotificationsTestPage() {
  const [swRegistration, setSwRegistration] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [pushSubscription, setPushSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [testMangaId, setTestMangaId] = useState(
    "b3d55846-d09b-4fe7-826d-37b98fabff4f"
  );
  const [testChapter, setTestChapter] = useState("251");

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  useEffect(() => {
    checkStatus();
    checkMangaSubscription();
  }, [testMangaId]);

  const checkMangaSubscription = async () => {
    try {
      const res = await fetch(`/api/manga/subscribe?mangaId=${testMangaId}`);
      if (res.ok) {
        const data = await res.json();
        setIsSubscribedToManga(data.subscribed);
      }
    } catch (err) {
      console.error("Failed to check manga subscription:", err);
    }
  };

  const checkStatus = async () => {
    // Check notification permission
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }

    // Check service worker
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          setSwRegistration(registration);
          addLog("✅ Service Worker is registered", "success");

          // Check for existing push subscription
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setPushSubscription(subscription);
            addLog("✅ Push subscription exists", "success");
          }
        } else {
          addLog("⚠️ Service Worker not registered yet", "warning");
        }
      } catch (err) {
        addLog(`❌ Error checking Service Worker: ${err.message}`, "error");
      }
    } else {
      addLog("❌ Service Workers not supported", "error");
    }
  };

  const registerServiceWorker = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      setSwRegistration(registration);
      addLog("✅ Service Worker registered successfully!", "success");

      // Wait for it to be ready
      await navigator.serviceWorker.ready;
      addLog("✅ Service Worker is ready", "success");
    } catch (err) {
      addLog(`❌ Failed to register Service Worker: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        addLog("✅ Notification permission granted!", "success");
      } else if (permission === "denied") {
        addLog("❌ Notification permission denied", "error");
      } else {
        addLog("⚠️ Notification permission dismissed", "warning");
      }
    } catch (err) {
      addLog(`❌ Error requesting permission: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!swRegistration) {
      addLog("❌ Service Worker not registered", "error");
      return;
    }

    setIsLoading(true);
    try {
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY";

      if (vapidPublicKey === "YOUR_VAPID_PUBLIC_KEY") {
        addLog(
          "❌ VAPID public key not configured in environment variables",
          "error"
        );
        setIsLoading(false);
        return;
      }

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setPushSubscription(subscription);
      addLog("✅ Subscribed to push notifications!", "success");

      // Save to backend
      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (response.ok) {
        addLog("✅ Subscription saved to database", "success");
      } else {
        addLog(
          "⚠️ Subscription created but failed to save to database",
          "warning"
        );
      }
    } catch (err) {
      addLog(`❌ Failed to subscribe: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!pushSubscription) {
      addLog("❌ No push subscription found", "error");
      return;
    }

    setIsLoading(true);
    try {
      await pushSubscription.unsubscribe();
      setPushSubscription(null);
      addLog("✅ Unsubscribed from push notifications", "success");
    } catch (err) {
      addLog(`❌ Failed to unsubscribe: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!pushSubscription) {
      addLog("❌ No push subscription - subscribe first!", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId: testMangaId,
          chapterNumber: parseInt(testChapter),
          chapterTitle: "Test Chapter",
        }),
      });

      if (response.ok) {
        addLog("✅ Test notification sent!", "success");
      } else {
        const data = await response.json();
        addLog(
          `❌ Failed to send notification: ${data.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (err) {
      addLog(`❌ Error sending notification: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMangaSubscription = async () => {
    setIsLoading(true);
    try {
      if (isSubscribedToManga) {
        // Unsubscribe
        const res = await fetch(`/api/manga/subscribe?mangaId=${testMangaId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsSubscribedToManga(false);
          addLog("✅ Unsubscribed from test manga", "success");
        }
      } else {
        // Subscribe
        const res = await fetch("/api/manga/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mangaId: testMangaId,
            notifyPush: true,
          }),
        });
        if (res.ok) {
          setIsSubscribedToManga(true);
          addLog("✅ Subscribed to test manga", "success");
        }
      }
    } catch (err) {
      addLog(`❌ Failed to toggle subscription: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showLocalNotification = () => {
    if (permissionStatus !== "granted") {
      addLog("❌ Notification permission not granted", "error");
      return;
    }

    if (swRegistration) {
      swRegistration.showNotification("Test Notification", {
        body: "This is a local test notification!",
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        data: { url: "/test" },
      });
      addLog("✅ Local notification shown", "success");
    } else {
      addLog("❌ Service Worker not available", "error");
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
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
  };

  const StatusBadge = ({ status, label }) => {
    const colors = {
      success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      error: "bg-red-500/20 text-red-400 border-red-500/50",
      warning: "bg-amber-500/20 text-amber-400 border-amber-500/50",
      default: "bg-slate-500/20 text-slate-400 border-slate-500/50",
    };

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
          colors[status] || colors.default
        }`}
      >
        {status === "success" && <CheckCircle2 className="w-4 h-4" />}
        {status === "error" && <XCircle className="w-4 h-4" />}
        {status === "warning" && <AlertCircle className="w-4 h-4" />}
        {label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4">
            <Bell className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-medium">
              Push Notifications Test Center
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Notifications System Tester
          </h1>
          <p className="text-slate-400">
            Test and visualize your push notification system in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Status & Controls */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                Current Status
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Service Worker</span>
                  <StatusBadge
                    status={swRegistration ? "success" : "error"}
                    label={swRegistration ? "Registered" : "Not Registered"}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">
                    Notification Permission
                  </span>
                  <StatusBadge
                    status={
                      permissionStatus === "granted"
                        ? "success"
                        : permissionStatus === "denied"
                        ? "error"
                        : "warning"
                    }
                    label={
                      permissionStatus.charAt(0).toUpperCase() +
                      permissionStatus.slice(1)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Push Subscription</span>
                  <StatusBadge
                    status={pushSubscription ? "success" : "error"}
                    label={pushSubscription ? "Active" : "Not Subscribed"}
                  />
                </div>
              </div>
            </div>

            {/* Setup Steps */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Setup Steps</h2>

              <div className="space-y-3">
                <button
                  onClick={registerServiceWorker}
                  disabled={swRegistration || isLoading}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    swRegistration
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 cursor-not-allowed"
                      : "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                  }`}
                >
                  <span className="font-medium">
                    1. Register Service Worker
                  </span>
                  {swRegistration ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">Click to register</span>
                  )}
                </button>

                <button
                  onClick={requestNotificationPermission}
                  disabled={permissionStatus === "granted" || isLoading}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    permissionStatus === "granted"
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 cursor-not-allowed"
                      : "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                  }`}
                >
                  <span className="font-medium">2. Request Permission</span>
                  {permissionStatus === "granted" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">Click to request</span>
                  )}
                </button>

                <button
                  onClick={subscribeToPush}
                  disabled={
                    !swRegistration ||
                    permissionStatus !== "granted" ||
                    pushSubscription ||
                    isLoading
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    pushSubscription
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 cursor-not-allowed"
                      : !swRegistration || permissionStatus !== "granted"
                      ? "bg-slate-700/50 border-slate-600 text-slate-500 cursor-not-allowed"
                      : "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                  }`}
                >
                  <span className="font-medium">3. Subscribe to Push</span>
                  {pushSubscription ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">Click to subscribe</span>
                  )}
                </button>
              </div>
            </div>

            {/* Test Actions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Test Notifications
              </h2>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Manga ID</label>
                  <input
                    type="text"
                    value={testMangaId}
                    onChange={(e) => setTestMangaId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 text-sm"
                    placeholder="Enter manga ID"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">
                    Chapter Number
                  </label>
                  <input
                    type="number"
                    value={testChapter}
                    onChange={(e) => setTestChapter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 text-sm"
                    placeholder="Enter chapter number"
                  />
                </div>

                <button
                  onClick={showLocalNotification}
                  disabled={permissionStatus !== "granted" || isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Bell className="w-4 h-4" />
                  <span>Show Local Notification</span>
                </button>

                <button
                  onClick={sendTestNotification}
                  disabled={!pushSubscription || isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Push Notification</span>
                </button>

                {pushSubscription && (
                  <button
                    onClick={unsubscribeFromPush}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                  >
                    Unsubscribe from Push
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Logs */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Activity Log</h2>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-500 text-sm">No activity yet</div>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-sm ${
                      log.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : log.type === "error"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : log.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-slate-700/50 border-slate-600 text-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex-1">{log.message}</span>
                      <span className="text-xs opacity-70">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
