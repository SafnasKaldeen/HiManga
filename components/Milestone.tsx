import React, { useState, useEffect } from "react";
import { Sparkles, Trophy, Zap, Crown, Star, Flame } from "lucide-react";

// Milestone configuration
const MILESTONES = {
  10: {
    title: "Beginner Hunter",
    message: "You've read 10 chapters! Your journey begins!",
    icon: Sparkles,
    color: "from-blue-400 to-blue-600",
    particles: 20,
  },
  50: {
    title: "Rising Hunter",
    message: "50 chapters conquered! You're getting stronger!",
    icon: Zap,
    color: "from-purple-400 to-purple-600",
    particles: 30,
  },
  100: {
    title: "Elite Hunter",
    message: "100 chapters cleared! You've proven your dedication!",
    icon: Trophy,
    color: "from-yellow-400 to-orange-500",
    particles: 50,
  },
  250: {
    title: "Master Hunter",
    message: "250 chapters! Your power level is rising!",
    icon: Flame,
    color: "from-orange-400 to-red-500",
    particles: 60,
  },
  500: {
    title: "S-Rank Hunter",
    message: "500 chapters! You've reached S-Rank status!",
    icon: Star,
    color: "from-red-400 to-pink-500",
    particles: 80,
  },
  1000: {
    title: "Shadow Monarch",
    message: "1000 chapters! You are a legend among hunters!",
    icon: Crown,
    color: "from-purple-600 to-indigo-800",
    particles: 100,
  },
};

const MilestoneAnimation = ({ milestone, onComplete }) => {
  const [show, setShow] = useState(true);
  const [particles, setParticles] = useState([]);
  const config = MILESTONES[milestone];

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: config.particles }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1 + Math.random() * 2,
    }));
    setParticles(newParticles);

    // Auto-close after animation
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => onComplete?.(), 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [milestone]);

  if (!show) return null;

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm animate-fadeIn">
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}

      {/* Main card */}
      <div className="relative animate-scaleIn">
        {/* Glow effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-20 blur-3xl animate-pulse`}
        />

        {/* Card content */}
        <div className="relative bg-gray-900 border-2 border-gray-700 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
          {/* Icon with glow */}
          <div className="flex justify-center mb-6">
            <div
              className={`relative p-6 rounded-full bg-gradient-to-r ${config.color}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-30 rounded-full animate-ping" />
              <Icon className="w-16 h-16 text-white relative z-10" />
            </div>
          </div>

          {/* Title */}
          <h2
            className={`text-4xl font-bold text-center mb-4 bg-gradient-to-r ${config.color} bg-clip-text text-transparent animate-slideDown`}
          >
            {config.title}
          </h2>

          {/* Milestone number */}
          <div className="text-center mb-4">
            <span className="text-6xl font-black text-white animate-bounce inline-block">
              {milestone}
            </span>
            <span className="text-2xl text-gray-400 ml-2">Chapters</span>
          </div>

          {/* Message */}
          <p className="text-gray-300 text-center text-lg animate-slideUp">
            {config.message}
          </p>

          {/* Progress bar animation */}
          <div className="mt-6 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${config.color} animate-fillBar`}
            />
          </div>

          {/* Close hint */}
          <p className="text-gray-500 text-center text-sm mt-4 animate-pulse">
            Click anywhere to continue
          </p>
        </div>
      </div>

      {/* Click to close */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          setShow(false);
          setTimeout(() => onComplete?.(), 500);
        }}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fillBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.5s ease-out 0.2s backwards;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out 0.4s backwards;
        }
        .animate-fillBar {
          animation: fillBar 2s ease-out 0.5s backwards;
        }
      `}</style>
    </div>
  );
};

// Demo component
const MilestoneDemo = () => {
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [chaptersRead, setChaptersRead] = useState(0);

  const milestoneValues = [10, 50, 100, 250, 500, 1000];

  const simulateReading = (milestone) => {
    setChaptersRead(milestone);
    setCurrentMilestone(milestone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          Milestone Animation System
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Click any milestone to preview the animation
        </p>

        {/* Stats display */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Chapters Read</p>
              <p className="text-3xl font-bold text-white">{chaptersRead}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Next Milestone</p>
              <p className="text-2xl font-bold text-purple-400">
                {milestoneValues.find((m) => m > chaptersRead) || "MAX"}
              </p>
            </div>
          </div>
        </div>

        {/* Milestone buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {milestoneValues.map((milestone) => {
            const config = MILESTONES[milestone];
            const Icon = config.icon;
            const isAchieved = chaptersRead >= milestone;

            return (
              <button
                key={milestone}
                onClick={() => simulateReading(milestone)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  isAchieved
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500 shadow-lg shadow-purple-500/20"
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`p-3 rounded-full ${
                      isAchieved
                        ? `bg-gradient-to-r ${config.color}`
                        : "bg-gray-700"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isAchieved ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-bold ${
                        isAchieved ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {milestone}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{config.title}</p>
                  </div>
                  {isAchieved && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            How It Works
          </h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>
              • Automatically triggers when user completes milestone chapters
            </li>
            <li>
              • Each milestone has unique icon, colors, and particle effects
            </li>
            <li>• Animation lasts 5 seconds or can be dismissed by clicking</li>
            <li>• Tracks progress and shows next milestone goal</li>
            <li>• Fully customizable colors, messages, and thresholds</li>
          </ul>
        </div>
      </div>

      {/* Render milestone animation */}
      {currentMilestone && (
        <MilestoneAnimation
          milestone={currentMilestone}
          onComplete={() => setCurrentMilestone(null)}
        />
      )}
    </div>
  );
};

export default MilestoneDemo;
