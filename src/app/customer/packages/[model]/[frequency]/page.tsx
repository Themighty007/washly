"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import { cn } from "@/lib/utils";

const MODEL_LABELS: Record<string, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  csuv: "C'SUV",
  suv: "SUV",
};

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily (Monday - Saturday)",
  alternate: "Alternate (Weekly Thrice)",
  twice: "Twice a Week",
  weekly: "Weekly Once",
};

const PRICING: Record<string, Record<string, string>> = {
  hatchback: { daily: "700", alternate: "450", twice: "350", weekly: "235 - 295" },
  sedan: { daily: "750", alternate: "500", twice: "400", weekly: "285 - 356" },
  csuv: { daily: "800", alternate: "550", twice: "450", weekly: "335 - 418" },
  suv: { daily: "800", alternate: "550", twice: "450", weekly: "335 - 418" },
};

const INTERNAL_PRICING: Record<string, string> = {
  hatchback: "115",
  sedan: "120",
  csuv: "125",
  suv: "125",
};

export default function PackageDetailsPage({ params }: { params: Promise<{ model: string; frequency: string }> }) {
  const router = useRouter();
  const { model, frequency } = use(params);
  
  const [addInternal, setAddInternal] = useState(false);
  const [addBike, setAddBike] = useState(false);

  // Validate params
  if (!MODEL_LABELS[model] || !FREQ_LABELS[frequency]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid Package</p>
      </div>
    );
  }

  const basePrice = PRICING[model][frequency];
  const internalPrice = INTERNAL_PRICING[model];
  const bikePrice = "100";

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

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-premium">
        <div className="max-w-md mx-auto">
          {/* Banner */}
          <div className="brand-gradient px-6 py-10 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-bold uppercase tracking-widest mb-1">
                {MODEL_LABELS[model]}
              </div>
              <h1 className="text-3xl font-bold tracking-tight leading-tight">
                {frequency === "daily" ? "Daily Wash" : 
                 frequency === "alternate" ? "Alternate Wash" : 
                 frequency === "twice" ? "Twice Weekly" : "Weekly Wash"}
              </h1>
              <p className="text-white/80 text-sm font-medium">
                {FREQ_LABELS[frequency]}
              </p>
            </div>
            
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-right z-10">
              <p className="text-xs text-white/70 uppercase font-semibold tracking-wider mb-1">Monthly</p>
              <p className="text-4xl font-black tracking-tighter">
                <span className="text-xl">₹</span>{basePrice}
              </p>
            </div>

            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          </div>

          <div className="px-4 py-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">What's Included</h3>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Exterior Premium Wash using microfiber cloths</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Tire and Rim cleaning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Glass and Mirror polishing</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Optional Add-ons</h3>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all border-2", 
                  addInternal ? "border-brand bg-brand/5 shadow-premium" : "border-transparent hover:border-brand/30"
                )}
                onClick={() => setAddInternal(!addInternal)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Internal Cleaning</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Deep vacuum & interior wipe</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">₹{internalPrice}</span>
                    <div className={cn("h-5 w-5 rounded-full border flex items-center justify-center transition-colors", addInternal ? "bg-brand border-brand" : "border-muted-foreground")}>
                      {addInternal && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all border-2", 
                  addBike ? "border-brand bg-brand/5 shadow-premium" : "border-transparent hover:border-brand/30"
                )}
                onClick={() => setAddBike(!addBike)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Bike Cleaning</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Weekly Twice add-on</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">₹{bikePrice}</span>
                    <div className={cn("h-5 w-5 rounded-full border flex items-center justify-center transition-colors", addBike ? "bg-brand border-brand" : "border-muted-foreground")}>
                      {addBike && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {frequency === "weekly" && (
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-xs">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Weekly prices vary between a 4-week month (₹{basePrice.split("-")[0].trim()}) and a 5-week month (₹{basePrice.split("-")[1].trim()}).</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-30">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Base</p>
            <p className="text-lg font-bold">₹{basePrice} <span className="text-xs font-normal text-muted-foreground">/mo</span></p>
          </div>
          <Button 
            size="lg" 
            className="flex-1 brand-gradient text-white shadow-premium"
            onClick={() => {
              const query = new URLSearchParams();
              if (addInternal) query.set("internal", "true");
              if (addBike) query.set("bike", "true");
              router.push(`/customer/checkout?model=${model}&frequency=${frequency}&${query.toString()}`);
            }}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
