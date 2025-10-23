"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/lib/notifications-context"
import { useAuth } from "@/lib/auth-context"
import { Heart, Gift, Star, Zap } from "lucide-react"
import { useState } from "react"

const donationTiers = [
  {
    id: "coffee",
    name: "Coffee",
    amount: 5,
    icon: "☕",
    description: "Buy us a coffee",
    perks: ["Thank you message", "Supporter badge"],
  },
  {
    id: "supporter",
    name: "Supporter",
    amount: 15,
    icon: "💝",
    description: "Support our mission",
    perks: ["Thank you message", "Supporter badge", "Ad-free reading for 1 month"],
    popular: true,
  },
  {
    id: "patron",
    name: "Patron",
    amount: 50,
    icon: "👑",
    description: "Become a patron",
    perks: ["Thank you message", "Supporter badge", "Ad-free reading for 3 months", "Early access to new features"],
  },
  {
    id: "legend",
    name: "Legend",
    amount: 100,
    icon: "⭐",
    description: "Legendary supporter",
    perks: [
      "Thank you message",
      "Supporter badge",
      "Ad-free reading for 1 year",
      "Early access to new features",
      "Custom username color",
    ],
  },
]

export default function DonatePage() {
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDonate = async (tier: (typeof donationTiers)[0]) => {
    if (!user) {
      alert("Please sign in to make a donation")
      return
    }

    setIsProcessing(true)
    setSelectedTier(tier.id)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Add notification
    addNotification({
      type: "donation",
      title: "Thank You!",
      message: `Thank you for your ${tier.name} donation! Your support means a lot to us.`,
    })

    setIsProcessing(false)
    setSelectedTier(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Support MangaFlow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help us keep MangaFlow free and ad-free. Your support helps us maintain and improve the platform for all
            manga lovers.
          </p>
        </div>

        {/* Donation Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {donationTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden transition-all bg-card/50 border-white/10 hover:border-primary/30 ${
                tier.popular ? "ring-2 ring-primary lg:scale-105 shadow-lg shadow-primary/20" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 text-xs font-semibold">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <div className="text-4xl mb-4">{tier.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    ${tier.amount}
                  </span>
                  <span className="text-muted-foreground ml-2">one-time</span>
                </div>

                <Button
                  className="w-full mb-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  onClick={() => handleDonate(tier)}
                  disabled={isProcessing && selectedTier === tier.id}
                >
                  {isProcessing && selectedTier === tier.id ? "Processing..." : "Donate"}
                </Button>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Perks</p>
                  {tier.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Why Support Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 bg-card/50 border-white/10 hover:border-primary/30 transition-colors">
            <Heart className="w-8 h-8 text-secondary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keep It Free</h3>
            <p className="text-muted-foreground text-sm">
              Your donations help us keep MangaFlow free for everyone, without paywalls or restrictions.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 border-white/10 hover:border-primary/30 transition-colors">
            <Zap className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Better Features</h3>
            <p className="text-muted-foreground text-sm">
              Support helps us develop new features, improve performance, and expand our manga library.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 border-white/10 hover:border-primary/30 transition-colors">
            <Gift className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Community</h3>
            <p className="text-muted-foreground text-sm">
              Join our community of supporters and help shape the future of MangaFlow together.
            </p>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <Card className="p-6 bg-card/50 border-white/10 hover:border-primary/30 transition-colors">
              <h3 className="font-semibold mb-2">Is my donation secure?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, all donations are processed securely through our payment partner. We never store your payment
                information.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 border-white/10 hover:border-primary/30 transition-colors">
              <h3 className="font-semibold mb-2">Can I get a refund?</h3>
              <p className="text-muted-foreground text-sm">
                Donations are non-refundable, but you can contact our support team if you have any issues.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 border-white/10 hover:border-primary/30 transition-colors">
              <h3 className="font-semibold mb-2">What happens to my donation?</h3>
              <p className="text-muted-foreground text-sm">
                Your donation goes directly to maintaining servers, licensing content, and developing new features for
                MangaFlow.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 border-white/10 hover:border-primary/30 transition-colors">
              <h3 className="font-semibold mb-2">Do I need to donate to use MangaFlow?</h3>
              <p className="text-muted-foreground text-sm">
                No! MangaFlow is completely free to use. Donations are optional and help support our mission.
              </p>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
