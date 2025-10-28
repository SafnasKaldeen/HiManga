"use client";

import React, { useState, useEffect } from "react";
import { Anchor, Compass, Ship, Skull, X } from "lucide-react";

const OnePieceErrorPage = ({
  errorType = "404",
  customMessage = null,
  onNavigateHome = () => (window.location.href = "/"),
  onGoBack = () => window.history.back(),
}) => {
  const [waves, setWaves] = useState([]);
  const [treasureFloat, setTreasureFloat] = useState(false);
  const [showCompass, setShowCompass] = useState(false);

  useEffect(() => {
    // Generate wave particles
    const waveArray = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2,
    }));
    setWaves(waveArray);

    // Treasure floating animation
    const floatInterval = setInterval(() => {
      setTreasureFloat((prev) => !prev);
    }, 2000);

    // Show compass after delay
    setTimeout(() => setShowCompass(true), 500);

    return () => clearInterval(floatInterval);
  }, []);

  const errorMessages = {
    "404": {
      title: "Lost at Sea!",
      subtitle: "404 - Page Not Found",
      message: "Looks like this page sailed away to the Grand Line...",
      character: "🏴‍☠️",
      quote: '"Even if you search the seas, this page won\'t be found!" - Nami',
    },
    broken: {
      title: "Shipwreck!",
      subtitle: "Link Broken",
      message: "This page crashed harder than the Going Merry...",
      character: "⚓",
      quote: '"We need to repair this ship!" - Usopp',
    },
    unavailable: {
      title: "Uncharted Waters!",
      subtitle: "Page Unavailable",
      message: "This island hasn't been discovered yet...",
      character: "🗺️",
      quote: '"The journey continues!" - Monkey D. Luffy',
    },
    maintenance: {
      title: "Docked for Repairs!",
      subtitle: "Under Maintenance",
      message: "Our crew is working on improvements...",
      character: "🔧",
      quote: '"Leave it to me!" - Franky',
    },
  };

  const currentError = errorMessages[errorType] || errorMessages["404"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-500 to-blue-600 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-10 left-10 w-32 h-16 bg-white/30 rounded-full blur-xl animate-float"
          style={{ animationDelay: "0s", animationDuration: "8s" }}
        />
        <div
          className="absolute top-20 right-20 w-40 h-20 bg-white/25 rounded-full blur-xl animate-float"
          style={{ animationDelay: "2s", animationDuration: "10s" }}
        />
        <div
          className="absolute top-40 left-1/3 w-36 h-18 bg-white/20 rounded-full blur-xl animate-float"
          style={{ animationDelay: "1s", animationDuration: "9s" }}
        />
      </div>

      {/* Ocean Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-32">
        {waves.map((wave) => (
          <div
            key={wave.id}
            className="absolute bottom-0 w-40 h-16 bg-blue-400/40 rounded-full blur-md animate-wave"
            style={{
              left: `${wave.left}%`,
              animationDuration: `${wave.duration}s`,
              animationDelay: `${wave.delay}s`,
            }}
          />
        ))}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-blue-700 to-transparent" />
      </div>

      {/* Seagulls */}
      <div className="absolute top-20 right-1/4 animate-seagull">
        <div className="text-2xl">🦅</div>
      </div>
      <div
        className="absolute top-32 left-1/4 animate-seagull"
        style={{ animationDelay: "2s" }}
      >
        <div className="text-xl">🦅</div>
      </div>

      {/* Main Content Card */}
      <div
        className={`relative z-10 max-w-2xl w-full transition-all duration-700 ${
          showCompass ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        {/* Wooden Sign Board */}
        <div className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-3xl border-8 border-amber-950 shadow-2xl p-8 md:p-12">
          {/* Wood Grain Texture Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-30 rounded-3xl pointer-events-none" />

          {/* Nails/Screws in corners */}
          <div className="absolute top-4 left-4 w-4 h-4 bg-gray-700 rounded-full shadow-inner" />
          <div className="absolute top-4 right-4 w-4 h-4 bg-gray-700 rounded-full shadow-inner" />
          <div className="absolute bottom-4 left-4 w-4 h-4 bg-gray-700 rounded-full shadow-inner" />
          <div className="absolute bottom-4 right-4 w-4 h-4 bg-gray-700 rounded-full shadow-inner" />

          {/* Rope decoration */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1 h-12 bg-amber-800 rounded-full" />

          <div className="relative space-y-6">
            {/* Character Icon */}
            <div className="flex justify-center">
              <div
                className={`text-8xl transition-all duration-500 ${
                  treasureFloat ? "translate-y-[-10px]" : "translate-y-0"
                }`}
              >
                {currentError.character}
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-5xl md:text-6xl font-black text-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] tracking-wider transform -rotate-1">
                {currentError.title}
              </h1>
              <div className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-lg transform rotate-1 shadow-lg">
                {currentError.subtitle}
              </div>
            </div>

            {/* Message */}
            <div className="bg-amber-950/50 rounded-xl p-6 border-2 border-amber-700">
              <p className="text-amber-100 text-lg md:text-xl text-center font-medium leading-relaxed">
                {customMessage || currentError.message}
              </p>
            </div>

            {/* Quote */}
            <div className="relative">
              <div className="text-yellow-200 text-center italic text-sm md:text-base px-4">
                {currentError.quote}
              </div>
              <div className="absolute -left-2 top-0 text-yellow-400 text-4xl opacity-50">
                "
              </div>
              <div className="absolute -right-2 bottom-0 text-yellow-400 text-4xl opacity-50">
                "
              </div>
            </div>

            {/* Wanted Poster Style Border */}
            <div className="border-4 border-dashed border-amber-700/50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Navigate Home Button */}
                <button
                  onClick={onNavigateHome}
                  className="group relative bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 border-4 border-orange-700 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <div className="relative flex items-center justify-center gap-2">
                    <Ship className="w-5 h-5" />
                    <span>Return to Port</span>
                  </div>
                </button>

                {/* Go Back Button */}
                <button
                  onClick={onGoBack}
                  className="group relative bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 border-4 border-blue-800 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <div className="relative flex items-center justify-center gap-2">
                    <Compass className="w-5 h-5 animate-spin-slow" />
                    <span>Navigate Back</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Straw Hat Pirates Logo */}
            <div className="flex justify-center pt-4">
              <div className="relative">
                <Skull className="w-16 h-16 text-white drop-shadow-lg" />
                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-red-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Treasure Chest */}
        <div
          className={`absolute -bottom-8 -right-8 transform transition-all duration-1000 ${
            treasureFloat
              ? "translate-y-[-5px] rotate-3"
              : "translate-y-0 rotate-0"
          }`}
        >
          <div className="text-6xl drop-shadow-xl">💰</div>
        </div>

        {/* Compass Decoration */}
        <div className="absolute -top-8 -left-8 transform -rotate-12">
          <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-full border-4 border-yellow-900 shadow-2xl flex items-center justify-center">
            <Compass className="w-10 h-10 text-yellow-200 animate-spin-slow" />
          </div>
        </div>
      </div>

      {/* Anchor Decoration */}
      <div className="absolute bottom-8 left-8 opacity-20">
        <Anchor className="w-24 h-24 text-blue-900" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes wave {
          0%,
          100% {
            transform: translateX(0px) scale(1);
          }
          50% {
            transform: translateX(20px) scale(1.1);
          }
        }
        @keyframes seagull {
          0% {
            transform: translateX(0px) translateY(0px);
          }
          50% {
            transform: translateX(100px) translateY(-20px);
          }
          100% {
            transform: translateX(200px) translateY(0px);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave linear infinite;
        }
        .animate-seagull {
          animation: seagull 15s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Demo Component with different error types
const OnePieceErrorDemo = () => {
  const [currentError, setCurrentError] = useState("404");
  const [showDemo, setShowDemo] = useState(true);

  const errorTypes = [
    { value: "404", label: "404 - Page Not Found" },
    { value: "broken", label: "Broken Link" },
    { value: "unavailable", label: "Page Unavailable" },
    { value: "maintenance", label: "Under Maintenance" },
  ];

  if (!showDemo) {
    return (
      <OnePieceErrorPage
        errorType={currentError}
        onNavigateHome={() => alert("Navigate to homepage")}
        onGoBack={() => alert("Go back to previous page")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            One Piece Themed Error Page
          </h1>
          <p className="text-slate-400">
            Select an error type to preview the themed page
          </p>
        </div>

        {/* Error Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {errorTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setCurrentError(type.value)}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                currentError === type.value
                  ? "bg-gradient-to-br from-orange-500 to-red-600 border-orange-400 shadow-lg shadow-orange-500/50"
                  : "bg-slate-800 border-slate-700 hover:border-slate-600"
              }`}
            >
              <p
                className={`font-bold text-lg ${
                  currentError === type.value ? "text-white" : "text-slate-300"
                }`}
              >
                {type.label}
              </p>
            </button>
          ))}
        </div>

        {/* Preview Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowDemo(false)}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 border-4 border-orange-700"
          >
            🏴‍☠️ Preview Full Page
          </button>
        </div>

        {/* Implementation Instructions */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-8">
          <h3 className="text-white font-bold mb-4 text-xl flex items-center gap-2">
            <Ship className="w-6 h-6 text-orange-400" />
            How to Integrate
          </h3>
          <div className="space-y-3 text-slate-300 text-sm">
            <div className="bg-slate-900 p-4 rounded-lg">
              <p className="text-orange-400 font-mono mb-2">
                In your manga reader component:
              </p>
              <code className="text-green-400">
                {`// Replace image error handler
onError={(e) => {
  // Show One Piece error page
  setShowErrorPage(true);
  setErrorType('broken');
}}`}
              </code>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <p className="text-orange-400 font-mono mb-2">For 404 pages:</p>
              <code className="text-green-400">
                {`// In your Next.js 404.tsx
export default function NotFound() {
  return <OnePieceErrorPage errorType="404" />
}`}
              </code>
            </div>
            <p className="pt-2">
              ✨ <strong>Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Animated ocean waves and clouds</li>
              <li>Floating treasure chest and seagulls</li>
              <li>Wooden sign board with One Piece styling</li>
              <li>Character quotes from the crew</li>
              <li>Smooth animations and transitions</li>
              <li>Mobile responsive design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnePieceErrorDemo;
