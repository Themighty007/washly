"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, Calendar, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "hatchback", label: "Hatchback", icon: Car },
  { id: "sedan", label: "Sedan", icon: Car },
  { id: "csuv", label: "C'SUV", icon: Car },
  { id: "suv", label: "SUV", icon: Car },
];

const FREQUENCIES = [
  { id: "daily", label: "Daily", sub: "(Monday - Saturday)" },
  { id: "alternate", label: "Alternate", sub: "(Weekly Thrice)" },
  { id: "twice", label: "Twice", sub: "(Weekly Twice)" },
  { id: "weekly", label: "Weekly", sub: "(Weekly Once)" },
];

const PRICING: Record<string, Record<string, string>> = {
  hatchback: { daily: "₹700", alternate: "₹450", twice: "₹350", weekly: "₹235-₹295" },
  sedan: { daily: "₹750", alternate: "₹500", twice: "₹400", weekly: "₹285-₹356" },
  csuv: { daily: "₹800", alternate: "₹550", twice: "₹450", weekly: "₹335-₹418" },
  suv: { daily: "₹800", alternate: "₹550", twice: "₹450", weekly: "₹335-₹418" },
};

export default function PackagesSelectionPage() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState("sedan");

  return (
    <div className="mobile-shell flex flex-col bg-muted/30 min-h-screen">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <IdrottLogo size="sm" />
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 scrollbar-premium">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Select Your Package</h1>
            <p className="text-sm text-muted-foreground">
              Choose your vehicle type and washing frequency to see our premium Door Step tariffs.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">1. Select Vehicle Type</h2>
            <div className="grid grid-cols-2 gap-3">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all bg-background",
                    selectedModel === model.id
                      ? "border-brand shadow-premium scale-[1.02]"
                      : "border-transparent hover:border-brand/30 shadow-sm"
                  )}
                >
                  <model.icon className={cn("h-8 w-8 mb-2", selectedModel === model.id ? "text-brand" : "text-muted-foreground")} />
                  <span className="font-semibold text-sm">{model.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">2. Select Frequency</h2>
            <div className="grid grid-cols-1 gap-3">
              {FREQUENCIES.map((freq) => (
                <Card 
                  key={freq.id} 
                  className="cursor-pointer hover:shadow-md transition-all border hover:border-brand/50 bg-background relative overflow-hidden group"
                  onClick={() => router.push(`/customer/packages/${selectedModel}/${freq.id}`)}
                >
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-brand/10 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4 text-brand" />
                  </div>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{freq.label}</h3>
                      <p className="text-xs text-muted-foreground">{freq.sub}</p>
                    </div>
                    <div className="text-right pr-4">
                      <p className="font-bold text-xl text-brand">{PRICING[selectedModel][freq.id]}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Per Month</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              All packages include premium exterior washing using professional-grade equipment. Internal cleaning and bike cleaning add-ons available in the next step.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
