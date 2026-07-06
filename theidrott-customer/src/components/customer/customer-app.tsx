"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authFetch, useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home, History, User as UserIcon, Bell, Calendar as CalIcon,
  Clock, MapPin, Phone, Car, ChevronRight, Sparkles, TrendingUp,
  CheckCircle2, Camera, ArrowRight, Star, ArrowLeft, LogOut, CreditCard,
  Plus, Minus, Crown, Settings,
} from "lucide-react";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { formatCurrency, formatDate, formatTime, getInitials, isToday, TIME_SLOTS } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "home" | "history" | "profile";

interface CustomerData {
  customer: {
    id: string;
    user: {
      id: string; name: string; email: string; phone: string;
      address: string | null; avatar: string | null;
    };
    activePlan: {
      id: string; name: string; monthlyPrice: number; totalWashes: number;
      description: string; features: string;
    } | null;
    subscriptionStart: string | null;
    subscriptionEnd: string | null;
    remainingWashes: number;
    status: string;
    cars: Array<{
      id: string; make: string; model: string; year: number;
      licensePlate: string; color: string; details: string | null;
    }>;
  };
  upcomingBookings: any[];
  pastBookings: any[];
  totalWashes: number;
  unreadNotifications: number;
}

export function CustomerApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const { user, logout } = useAuth();

  const loadData = useCallback(async () => {
    try {
      const res = await authFetch("/api/customer/dashboard");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh on tab focus
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  if (loading || !data) {
    return (
      <div className="mobile-shell flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const { customer, upcomingBookings, pastBookings, totalWashes } = data;
  const usedWashes = totalWashes - customer.remainingWashes;

  return (
    <div className="mobile-shell flex flex-col bg-gradient-to-b from-muted/30 to-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <IdrottLogo size="sm" />
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main scrollable area */}
      <main className="flex-1 overflow-y-auto pb-20 scrollbar-premium">
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <HomeTab
                customer={customer}
                upcomingBookings={upcomingBookings}
                totalWashes={totalWashes}
                usedWashes={usedWashes}
                onSelectBooking={setSelectedBooking}
                onRefresh={loadData}
              />
            </motion.div>
          )}
          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryTab pastBookings={pastBookings} onSelectBooking={setSelectedBooking} />
            </motion.div>
          )}
          {tab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileTab
                customer={customer}
                totalWashes={totalWashes}
                onShowPlanChange={() => setShowPlanChange(true)}
                onLogout={logout}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 z-30 bg-background/95 backdrop-blur-lg border-t">
        <div className="grid grid-cols-3 h-16">
          <TabButton active={tab === "home"} onClick={() => setTab("home")} icon={Home} label="Home" />
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={History} label="History" />
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={UserIcon} label="Profile" />
        </div>
      </nav>

      {/* Modals */}
      {selectedBooking && (
        <WashDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onRefresh={loadData}
        />
      )}

      {showPlanChange && (
        <PlanChangeModal
          currentPlanId={customer.activePlan?.id}
          onClose={() => setShowPlanChange(false)}
          onSuccess={() => {
            setShowPlanChange(false);
            loadData();
            toast.success("Plan change request submitted!");
          }}
        />
      )}
    </div>
  );
}

// ============= Tab button =============
function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 transition-colors relative",
        active ? "text-brand" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
      {active && (
        <motion.div
          layoutId="active-tab"
          className="absolute top-0 h-0.5 w-10 rounded-full brand-gradient"
        />
      )}
    </button>
  );
}

// ============= HOME TAB =============
function HomeTab({ customer, upcomingBookings, totalWashes, usedWashes, onSelectBooking, onRefresh }: any) {
  const firstName = customer.user.name.split(" ")[0];

  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-2xl font-semibold tracking-tight">{firstName} 👋</h1>
      </div>

      {/* Subscription card */}
      <Card className="relative overflow-hidden border-0 text-white shadow-premium">
        <div className="absolute inset-0 brand-gradient" />
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <CardContent className="relative z-10 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider font-medium mb-1">Active Plan</p>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <p className="text-xl font-semibold">{customer.activePlan?.name || "No Plan"}</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-0">
              {customer.status}
            </Badge>
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-white/70 text-xs">Washes remaining</p>
                <p className="text-3xl font-semibold mt-1">
                  {customer.remainingWashes}
                  <span className="text-base text-white/70 font-normal"> / {totalWashes}</span>
                </p>
              </div>
              <p className="text-white/70 text-xs">
                {usedWashes} used
              </p>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalWashes > 0 ? (usedWashes / totalWashes) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-white/70">
              <span>Renews on {customer.subscriptionEnd ? formatDate(customer.subscriptionEnd) : "—"}</span>
              <span>{formatCurrency(customer.activePlan?.monthlyPrice || 0)}/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <Calendar className="h-4 w-4 text-brand" />
              <span className="text-xs text-muted-foreground">Upcoming</span>
            </div>
            <p className="text-2xl font-semibold">{upcomingBookings.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Washes scheduled</p>
          </CardContent>
        </Card>
        <Card className="shadow-premium">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <Car className="h-4 w-4 text-gold" style={{ color: "var(--gold)" }} />
              <span className="text-xs text-muted-foreground">Cars</span>
            </div>
            <p className="text-2xl font-semibold">{customer.cars.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">In your garage</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming washes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base">Upcoming Washes</h2>
          {upcomingBookings.length > 0 && (
            <Badge variant="secondary" className="text-xs">{upcomingBookings.length}</Badge>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No upcoming washes</p>
              <p className="text-xs text-muted-foreground mt-1">Your scheduled washes will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking: any) => (
              <UpcomingWashCard key={booking.id} booking={booking} onClick={() => onSelectBooking(booking)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UpcomingWashCard({ booking, onClick }: { booking: any; onClick: () => void }) {
  const today = isToday(booking.date);
  const car = booking.car;
  return (
    <Card
      className="cursor-pointer hover:shadow-premium transition-all active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-10 w-10 rounded-xl flex flex-col items-center justify-center",
              today ? "brand-gradient text-white" : "bg-muted"
            )}>
              <span className="text-[10px] font-medium uppercase">
                {new Date(booking.date).toLocaleString("default", { month: "short" })}
              </span>
              <span className="text-sm font-bold leading-none">
                {new Date(booking.date).getDate()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {today ? "Today" : formatDate(booking.date, { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.timeSlot}
              </p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Car className="h-3.5 w-3.5" />
            <span className="text-foreground">{car.color} {car.make} {car.model}</span>
            <span className="text-muted-foreground">· {car.licensePlate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{booking.address}</span>
          </div>
          {booking.cleaner && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" />
              <span className="text-foreground">{booking.cleaner.user.name}</span>
              <div className="flex items-center gap-0.5 ml-auto">
                <Star className="h-3 w-3 fill-gold text-gold" style={{ fill: "var(--gold)", color: "var(--gold)" }} />
                <span>{booking.cleaner.rating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end mt-3 text-xs text-brand font-medium">
          View details <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============= HISTORY TAB =============
function HistoryTab({ pastBookings, onSelectBooking }: { pastBookings: any[]; onSelectBooking: (b: any) => void }) {
  return (
    <div className="p-4 space-y-4 animate-fade-in-up">
      <div className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Your completed and past washes</p>
      </div>

      {pastBookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <History className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No history yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your completed washes will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pastBookings.map((booking) => (
            <Card key={booking.id} className="cursor-pointer hover:shadow-premium transition-all" onClick={() => onSelectBooking(booking)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {formatDate(booking.date, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-[10px]">
                      {booking.cleaner ? getInitials(booking.cleaner.user.name) : "—"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{booking.cleaner?.user.name || "Unassigned"}</p>
                    <p className="text-muted-foreground">{booking.car.make} {booking.car.model} · {booking.car.licensePlate}</p>
                  </div>
                  {booking.completedAt && (
                    <p className="text-muted-foreground">
                      {formatTime(booking.completedAt)}
                    </p>
                  )}
                </div>
                {booking.photos?.length > 0 && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                    <Camera className="h-3 w-3" />
                    {booking.photos.length} photos uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============= PROFILE TAB =============
function ProfileTab({ customer, totalWashes, onShowPlanChange, onLogout }: any) {
  const features = customer.activePlan ? JSON.parse(customer.activePlan.features) : [];

  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      <div className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      </div>

      {/* Profile card */}
      <Card className="shadow-premium">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="brand-gradient text-white text-xl font-semibold">
                {getInitials(customer.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{customer.user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{customer.user.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {customer.activePlan?.name || "No Plan"}
                </Badge>
                <StatusBadge status={customer.status} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <InfoRow icon={Phone} label="Phone" value={customer.user.phone} />
          <Separator />
          <InfoRow icon={MapPin} label="Address" value={customer.user.address || "Not set"} />
        </CardContent>
      </Card>

      {/* Cars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">My Cars</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {customer.cars.map((car: any) => (
            <div key={car.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Car className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{car.color} {car.make} {car.model}</p>
                <p className="text-xs text-muted-foreground">{car.year} · {car.licensePlate}</p>
              </div>
            </div>
          ))}
          {customer.cars.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No cars added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Subscription details */}
      {customer.activePlan && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Subscription</CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onShowPlanChange}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Change Plan
            </Button>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground">Current Plan</p>
                <p className="font-semibold mt-0.5">{customer.activePlan.name}</p>
              </div>
              <p className="font-semibold">{formatCurrency(customer.activePlan.monthlyPrice)}/mo</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Total Washes</p>
                <p className="font-semibold mt-0.5">{customer.activePlan.totalWashes}/mo</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold mt-0.5">{customer.remainingWashes} left</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Plan includes:</p>
              <ul className="space-y-1.5">
                {features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {customer.subscriptionEnd && (
              <p className="text-xs text-muted-foreground pt-1">
                Renews on {formatDate(customer.subscriptionEnd)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Button variant="outline" className="w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

// ============= WASH DETAILS MODAL =============
function WashDetailsModal({ booking, onClose, onRefresh }: { booking: any; onClose: () => void; onRefresh: () => void }) {
  const [showSlotChange, setShowSlotChange] = useState(false);
  const isPast = ["COMPLETED", "MISSED", "CANCELLED"].includes(booking.status);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Wash Details</span>
            <StatusBadge status={booking.status} />
          </DialogTitle>
          <DialogDescription>
            {formatDate(booking.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {booking.timeSlot}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            {/* Car info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{booking.car.color} {booking.car.make} {booking.car.model}</p>
                    <p className="text-xs text-muted-foreground">{booking.car.year} · {booking.car.licensePlate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-brand mt-0.5" />
                  <p className="text-sm">{booking.address}</p>
                </div>
              </CardContent>
            </Card>

            {/* Cleaner info */}
            {booking.cleaner ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-3">Assigned Cleaner</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="brand-gradient text-white">
                        {getInitials(booking.cleaner.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{booking.cleaner.user.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3" style={{ fill: "var(--gold)", color: "var(--gold)" }} />
                        <span className="text-xs text-muted-foreground">{booking.cleaner.rating.toFixed(1)} rating</span>
                      </div>
                    </div>
                  </div>
                  <a href={`tel:${booking.cleaner.user.phone}`} className="mt-3 block">
                    <Button variant="outline" className="w-full" size="sm">
                      <Phone className="h-3.5 w-3.5 mr-2" />
                      {booking.cleaner.user.phone}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Cleaner not yet assigned. You'll be notified once assigned.</p>
                </CardContent>
              </Card>
            )}

            {/* Past wash photos */}
            {isPast && booking.photos?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-3">Wash Photos ({booking.photos.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {booking.photos
                      .sort((a: any, b: any) => a.position - b.position)
                      .map((photo: any) => (
                        <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={photo.imageData}
                            alt={`Wash photo ${photo.position}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {booking.missReason && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-4">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Wash Missed</p>
                  <p className="text-sm">{booking.missReason}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          {!isPast && (
            <Button
              className="w-full brand-gradient text-white"
              onClick={() => setShowSlotChange(true)}
            >
              <CalIcon className="h-4 w-4 mr-2" />
              Change Slot
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {showSlotChange && (
        <SlotChangeModal
          booking={booking}
          onClose={() => setShowSlotChange(false)}
          onSuccess={() => {
            setShowSlotChange(false);
            onRefresh();
            onClose();
            toast.success("Slot updated successfully!");
          }}
        />
      )}
    </Dialog>
  );
}

// ============= SLOT CHANGE MODAL =============
function SlotChangeModal({ booking, onClose, onSuccess }: { booking: any; onClose: () => void; onSuccess: () => void }) {
  const [date, setDate] = useState<Date | undefined>(new Date(booking.date));
  const [timeSlot, setTimeSlot] = useState(booking.timeSlot);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      toast.error("Please select a future date");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`/api/customer/booking/${booking.id}/slot`, {
        method: "PATCH",
        body: JSON.stringify({ date: date.toISOString(), timeSlot }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update slot");
        return;
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Wash Slot</DialogTitle>
          <DialogDescription>
            Pick a new date and time slot for your wash. Our team will be notified automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium mb-2">Select Date</p>
            <div className="border rounded-lg p-2 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                className="mx-auto"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Select Time Slot</p>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  className={cn(
                    "p-2.5 rounded-lg border text-sm transition-all",
                    timeSlot === slot
                      ? "brand-gradient text-white border-transparent"
                      : "hover:border-foreground/20 hover:bg-muted/50"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">
            {loading ? "Updating..." : "Update Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= PLAN CHANGE MODAL =============
function PlanChangeModal({ currentPlanId, onClose, onSuccess }: { currentPlanId?: string; onClose: () => void; onSuccess: () => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authFetch("/api/customer/plan-change").then(async (res) => {
      const data = await res.json();
      setPlans(data.plans);
    });
  }, []);

  async function handleSubmit() {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/customer/plan-change", {
        method: "POST",
        body: JSON.stringify({ requestedPlanId: selectedPlan }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to submit request");
        return;
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>
            Select a new plan. Our team will review and approve your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {plans.map((plan) => {
            const features = JSON.parse(plan.features);
            const isCurrent = plan.id === currentPlanId;
            const isSelected = plan.id === selectedPlan;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "cursor-pointer transition-all relative",
                  isSelected ? "border-brand border-2" : "hover:border-foreground/20",
                  plan.popular && "border-gold"
                )}
                style={plan.popular ? { borderColor: "var(--gold)" } : undefined}
                onClick={() => !isCurrent && setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: "var(--gold)" }}>
                    POPULAR
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(plan.monthlyPrice)}</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{plan.totalWashes} washes/mo</Badge>
                    {isCurrent && <Badge className="text-xs">Current</Badge>}
                  </div>
                  <ul className="space-y-1">
                    {features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-brand mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedPlan}
            className="brand-gradient text-white"
          >
            {loading ? "Submitting..." : "Request Plan Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
