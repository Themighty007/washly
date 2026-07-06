"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authFetch, useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home, User as UserIcon, Bell, Clock, MapPin, Phone, Car, ChevronRight,
  CheckCircle2, Camera, LogIn, LogOut, Navigation, AlertTriangle, X,
  Upload, Star, Calendar as CalIcon, Timer,
} from "lucide-react";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { formatTime, getInitials, isToday, TIME_SLOTS } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "home" | "profile";

export function CleanerApp() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  const loadData = useCallback(async () => {
    try {
      const res = await authFetch("/api/cleaner/dashboard");
      if (res.status === 401 || res.status === 404) {
        logout();
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
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

  return (
    <div className="mobile-shell flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <IdrottLogo size="sm" />
          <NotificationBell />
        </div>
      </header>

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
                data={data}
                onSelectTask={(t: any) => router.push(`/cleaner/task/${t.id}`)}
                onRefresh={loadData}
              />
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
              <ProfileTab cleaner={data.cleaner} onLogout={logout} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="sticky bottom-0 z-30 bg-background/95 backdrop-blur-lg border-t">
        <div className="grid grid-cols-2 h-16">
          <TabButton active={tab === "home"} onClick={() => setTab("home")} icon={Home} label="Tasks" />
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={UserIcon} label="Profile" />
        </div>
      </nav>
    </div>
  );
}

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
      {active && <motion.div layoutId="active-tab" className="absolute top-0 h-0.5 w-10 rounded-full brand-gradient" />}
    </button>
  );
}

// ============= HOME TAB =============
function HomeTab({ data, onSelectTask, onRefresh }: any) {
  const { cleaner, todaysTasks, overview, todayAttendance } = data;
  const firstName = cleaner.user.name.split(" ")[0];

  async function handleAttendance(action: "check-in" | "check-out") {
    try {
      const res = await authFetch("/api/cleaner/attendance", {
        method: "POST",
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(action === "check-in" ? "Checked in successfully!" : "Checked out successfully!");
      onRefresh();
    } catch (e) {
      console.error("Attendance error:", e);
      toast.error("Network error. Please check your connection.");
    }
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      <div className="pt-2 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hello,</p>
          <h1 className="text-2xl font-semibold tracking-tight">{firstName} 👋</h1>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
          <Star className="h-3 w-3" style={{ fill: "var(--gold)", color: "var(--gold)" }} />
          <span className="text-xs font-semibold">{cleaner.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Today's overview */}
      <Card className="shadow-premium">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Today's Overview</p>
              <p className="text-sm mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>
            <CalIcon className="h-5 w-5 text-brand" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Total" value={overview.total} color="text-foreground" />
            <StatBox label="Done" value={overview.completed} color="text-emerald-600 dark:text-emerald-400" />
            <StatBox label="Pending" value={overview.pending} color="text-amber-600 dark:text-amber-400" />
          </div>

          {overview.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Daily progress</span>
                <span>{Math.round((overview.completed / overview.total) * 100)}%</span>
              </div>
              <Progress value={(overview.completed / overview.total) * 100} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-brand" />
              <p className="text-sm font-medium">Attendance</p>
            </div>
            {todayAttendance?.checkInTime && (
              <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600 dark:text-emerald-400">
                {todayAttendance.checkOutTime ? "Completed" : "Working"}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={todayAttendance?.checkInTime ? "outline" : "default"}
              className={cn(!todayAttendance?.checkInTime && "brand-gradient text-white")}
              disabled={!!todayAttendance?.checkInTime}
              onClick={() => handleAttendance("check-in")}
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              Check In
            </Button>
            <Button
              variant={todayAttendance?.checkOutTime ? "outline" : "default"}
              disabled={!todayAttendance?.checkInTime || !!todayAttendance?.checkOutTime}
              onClick={() => handleAttendance("check-out")}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Check Out
            </Button>
          </div>

          {todayAttendance?.checkInTime && (
            <div className="mt-3 pt-3 border-t space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in time</span>
                <span className="font-medium">{formatTime(todayAttendance.checkInTime)}</span>
              </div>
              {todayAttendance.checkOutTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out time</span>
                  <span className="font-medium">{formatTime(todayAttendance.checkOutTime)}</span>
                </div>
              )}
              {todayAttendance.totalHours && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total hours</span>
                  <span className="font-medium">{todayAttendance.totalHours}h</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base">Today's Tasks</h2>
          {todaysTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">{todaysTasks.length}</Badge>
          )}
        </div>

        {todaysTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No tasks today</p>
              <p className="text-xs text-muted-foreground mt-1">Enjoy your day!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todaysTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} onClick={() => onSelectTask(task)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className={cn("text-2xl font-semibold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function TaskCard({ task, onClick }: { task: any; onClick: () => void }) {
  const car = task.car;
  return (
    <Card
      className="cursor-pointer hover:shadow-premium transition-all active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-muted flex flex-col items-center justify-center">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] font-semibold mt-0.5">
                {task.timeSlot.split(" - ")[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{task.customer.user.name}</p>
              <p className="text-xs text-muted-foreground">{task.timeSlot}</p>
            </div>
          </div>
          <StatusBadge status={task.status} />
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Car className="h-3.5 w-3.5" />
            <span className="text-foreground">{car.color} {car.make} {car.model}</span>
            <span className="text-muted-foreground">· {car.licensePlate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{task.address}</span>
          </div>
        </div>

        <div className="flex items-center justify-end mt-3 text-xs text-brand font-medium">
          Open task <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============= PROFILE TAB =============
function ProfileTab({ cleaner, onLogout }: any) {
  return (
    <div className="p-4 space-y-5 animate-fade-in-up">
      <div className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      </div>

      <Card className="shadow-premium">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="brand-gradient text-white text-xl font-semibold">
                {getInitials(cleaner.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{cleaner.user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{cleaner.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Star className="h-3 w-3" style={{ fill: "var(--gold)", color: "var(--gold)" }} />
                  {cleaner.rating.toFixed(1)}
                </Badge>
                <StatusBadge status={cleaner.status} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-semibold">{cleaner.totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Car className="h-5 w-5 text-brand mb-2" />
            <p className="text-2xl font-semibold">{cleaner.totalAssigned}</p>
            <p className="text-xs text-muted-foreground">Total assigned</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <InfoRow icon={Phone} label="Phone" value={cleaner.user.phone} />
          <div className="border-t" />
          <InfoRow icon={MapPin} label="Address" value={cleaner.user.address || "Not set"} />
          <div className="border-t" />
          <InfoRow icon={Car} label="Vehicle" value={cleaner.vehicleNumber || "Not assigned"} />
          <div className="border-t" />
          <InfoRow icon={MapPin} label="Zone" value={cleaner.zone || "All zones"} />
        </CardContent>
      </Card>

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
