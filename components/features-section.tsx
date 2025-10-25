// ========== FEATURES SECTION COMPONENT ==========
import { Card } from "@/components/ui/card";
import { BookMarked, Zap, Users, Shield } from "lucide-react";

const features = [
  {
    icon: BookMarked,
    title: "Bookmark & Save",
    description:
      "Keep track of your reading progress and save your favorite manga for later.",
  },
  {
    icon: Zap,
    title: "Fast Loading",
    description:
      "Optimized for speed with instant page loads and smooth scrolling.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Connect with other manga enthusiasts and share your thoughts.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "Your reading history and preferences are kept private and secure.",
  },
];

export function FeaturesSection() {
  return (
    <section className="pt-0 pb-8 md:pb-24 bg-gradient-to-b from-[#0f0f1f] to-[#0a0a1a]">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Why Choose HiManga?
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Experience the best anime platform with features designed for your
            enjoyment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="p-6 text-center bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-pink-500/30 transition-all group"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 group-hover:shadow-lg group-hover:shadow-pink-500/30 transition-all">
                    <Icon className="w-6 h-6 text-pink-500" />
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-white text-lg">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
