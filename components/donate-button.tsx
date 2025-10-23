"use client"

import { Coffee, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function DonateButton() {
  const [showDonateMenu, setShowDonateMenu] = useState(false)

  const donationLinks = [
    { name: "Ko-fi", url: "https://ko-fi.com", icon: Coffee },
    { name: "Patreon", url: "https://patreon.com", icon: Heart },
  ]

  return (
    <div className="relative">
      <Button
        onClick={() => setShowDonateMenu(!showDonateMenu)}
        className="gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg shadow-pink-500/30"
      >
        <Heart className="w-4 h-4" />
        Support Us
      </Button>

      {showDonateMenu && (
        <div className="absolute top-full right-0 mt-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 rounded-lg shadow-xl overflow-hidden z-50">
          {donationLinks.map((link) => {
            const Icon = link.icon
            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-700/30 last:border-b-0"
              >
                <Icon className="w-4 h-4 text-pink-400" />
                <span className="text-sm text-slate-200">{link.name}</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
