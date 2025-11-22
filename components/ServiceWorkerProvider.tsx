"use client";

import { useEffect } from "react";

export function ServiceWorkerProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "✅ Service Worker registered successfully:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    } else {
      console.log("⚠️ Service Workers not supported in this browser");
    }
  }, []);

  // This component doesn't render anything
  return null;
}
