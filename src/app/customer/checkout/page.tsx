"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/auth-store";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Wallet, Building2, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import { cn } from "@/lib/utils";

const MODEL_LABELS: Record<string, string> = { hatchback: "Hatchback", sedan: "Sedan", csuv: "C'SUV", suv: "SUV" };
const FREQ_LABELS: Record<string, string> = { daily: "Daily", alternate: "Alternate", twice: "Twice Weekly", weekly: "Weekly" };

const PRICING: Record<string, Record<string, string>> = {
  hatchback: { daily: "700", alternate: "450", twice: "350", weekly: "235" }, // Using 4-week base for simplicity
  sedan: { daily: "750", alternate: "500", twice: "400", weekly: "285" },
  csuv: { daily: "800", alternate: "550", twice: "450", weekly: "335" },
  suv: { daily: "800", alternate: "550", twice: "450", weekly: "335" },
};
const INTERNAL_PRICING: Record<string, string> = { hatchback: "115", sedan: "120", csuv: "125", suv: "125" };

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const model = searchParams.get("model") || "sedan";
  const frequency = searchParams.get("frequency") || "daily";
  const addInternal = searchParams.get("internal") === "true";
  const addBike = searchParams.get("bike") === "true";

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const basePrice = parseInt(PRICING[model]?.[frequency] || "0");
  const internalPrice = addInternal ? parseInt(INTERNAL_PRICING[model] || "0") : 0;
  const bikePrice = addBike ? 100 : 0;
  
  const subtotal = basePrice + internalPrice + bikePrice;
  const tax = Math.round(subtotal * 0.18); // 18% GST estimation
  const total = subtotal + tax;

  async function handlePayment() {
    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // In a real app we'd map this to a specific Plan ID. 
      // For this demo, we'll hit the plan-change endpoint with a mock ID or just succeed.
      const res = await authFetch("/api/customer/plan-change", {
        method: "POST",
        body: JSON.stringify({ 
          requestedPlanId: "custom", 
          details: `${MODEL_LABELS[model]} - ${FREQ_LABELS[frequency]}` 
        }),
      });
      
      toast.success("Payment successful! Plan updated.");
      router.push("/customer");
    } catch (e) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mobile-shell flex flex-col bg-muted/30 min-h-screen">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold tracking-tight">Checkout</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 scrollbar-premium">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Order Summary */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order Summary</h2>
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{MODEL_LABELS[model]} • {FREQ_LABELS[frequency]}</p>
                    <p className="text-xs text-muted-foreground">Base Monthly Tariff</p>
                  </div>
                  <p className="font-medium">₹{basePrice}</p>
                </div>
                
                {addInternal && (
                  <div className="flex justify-between items-start pt-2 border-t border-dashed">
                    <div>
                      <p className="text-sm font-medium">Internal Cleaning</p>
                      <p className="text-xs text-muted-foreground">Add-on</p>
                    </div>
                    <p className="text-sm">₹{internalPrice}</p>
                  </div>
                )}
                
                {addBike && (
                  <div className="flex justify-between items-start pt-2 border-t border-dashed">
                    <div>
                      <p className="text-sm font-medium">Bike Cleaning</p>
                      <p className="text-xs text-muted-foreground">Weekly Twice</p>
                    </div>
                    <p className="text-sm">₹{bikePrice}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-start pt-2 border-t border-dashed">
                  <p className="text-sm text-muted-foreground">Taxes & Fees (18% GST)</p>
                  <p className="text-sm text-muted-foreground">₹{tax}</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-bold text-lg">Total</p>
                  <p className="font-bold text-xl text-brand">₹{total}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payment Method</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod("card")}
                className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all bg-background", paymentMethod === "card" ? "border-brand bg-brand/5 shadow-premium" : "border-transparent hover:border-brand/30")}
              >
                <CreditCard className={cn("h-6 w-6", paymentMethod === "card" ? "text-brand" : "text-muted-foreground")} />
                <span className="text-xs font-medium">Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod("upi")}
                className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all bg-background", paymentMethod === "upi" ? "border-brand bg-brand/5 shadow-premium" : "border-transparent hover:border-brand/30")}
              >
                <Wallet className={cn("h-6 w-6", paymentMethod === "upi" ? "text-brand" : "text-muted-foreground")} />
                <span className="text-xs font-medium">UPI</span>
              </button>
              <button
                onClick={() => setPaymentMethod("net")}
                className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all bg-background", paymentMethod === "net" ? "border-brand bg-brand/5 shadow-premium" : "border-transparent hover:border-brand/30")}
              >
                <Building2 className={cn("h-6 w-6", paymentMethod === "net" ? "text-brand" : "text-muted-foreground")} />
                <span className="text-xs font-medium">Netbanking</span>
              </button>
            </div>
            
            {paymentMethod === "card" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <input type="text" placeholder="Card Number" className="w-full p-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="MM/YY" className="w-full p-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
                  <input type="text" placeholder="CVV" className="w-full p-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
                </div>
              </div>
            )}
            
            {paymentMethod === "upi" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <input type="text" placeholder="UPI ID (e.g. name@okhdfcbank)" className="w-full p-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-brand focus:outline-none" />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
            <Lock className="h-3.5 w-3.5" />
            Payments are 100% secure and encrypted
          </div>
        </div>
      </main>

      <div className="p-4 bg-background/80 backdrop-blur-xl border-t z-30">
        <div className="max-w-md mx-auto">
          <Button 
            size="lg" 
            className="w-full brand-gradient text-white shadow-premium h-14 text-lg"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay ₹${total}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
