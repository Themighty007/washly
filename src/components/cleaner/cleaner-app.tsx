"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authFetch, useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home, User as UserIcon, Bell, Clock, MapPin, Phone, Car, ChevronRight,
  CheckCircle2, Camera, LogIn, LogOut, Navigation, AlertTriangle, X,
  Upload, Star, Calendar as CalIcon, Timer,
} from "lucide-react";
import { WashlyLogo } from "@/components/shared/washly-logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { formatTime, getInitials, isToday, TIME_SLOTS } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "home" | "profile";

export function CleanerApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showNotAvailable, setShowNotAvailable] = useState(false);
  const { logout } = useAuth();

  const loadData = useCallback(async () => {
    try {
      const res = await authFetch("/api/cleaner/dashboard");
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
          <WashlyLogo size="sm" />
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
                onSelectTask={(t: any) => setSelectedTask(t)}
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

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStartWash={async () => {
            const res = await authFetch(`/api/cleaner/task/${selectedTask.id}?action=start`, { method: "PATCH" });
            if (res.ok) {
              toast.success("Wash started");
              loadData();
              setSelectedTask(null);
            }
          }}
          onComplete={() => {
            setShowUpload(true);
          }}
          onNotAvailable={() => setShowNotAvailable(true)}
        />
      )}

      {showUpload && selectedTask && (
        <UploadPhotosModal
          task={selectedTask}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            setSelectedTask(null);
            loadData();
            toast.success("Wash completed successfully!");
          }}
        />
      )}

      {showNotAvailable && selectedTask && (
        <CarNotAvailableModal
          task={selectedTask}
          onClose={() => setShowNotAvailable(false)}
          onSuccess={() => {
            setShowNotAvailable(false);
            setSelectedTask(null);
            loadData();
            toast.success("Reported as car not available");
          }}
        />
      )}
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
      const res = await authFetch(`/api/cleaner/attendance?action=${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(action === "check-in" ? "Checked in successfully!" : "Checked out successfully!");
      onRefresh();
    } catch (e) {
      toast.error("Network error");
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

// ============= TASK DETAILS MODAL =============
function TaskDetailsModal({ task, onClose, onStartWash, onComplete, onNotAvailable }: any) {
  const isInProgress = task.status === "IN_PROGRESS";
  const isCompleted = task.status === "COMPLETED";
  const isMissed = task.status === "MISSED";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span>Task Details</span>
            <StatusBadge status={task.status} />
          </DialogTitle>
          <DialogDescription>
            {new Date(task.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {task.timeSlot}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            {/* Customer info */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Customer</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="brand-gradient text-white text-xs">
                      {getInitials(task.customer.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.customer.user.name}</p>
                    <p className="text-xs text-muted-foreground">{task.customer.user.phone}</p>
                  </div>
                  <a href={`tel:${task.customer.user.phone}`}>
                    <Button size="icon" variant="outline" className="h-9 w-9">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Address with navigation */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Location</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-brand mt-0.5" />
                  <p className="text-sm flex-1">{task.address}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block"
                >
                  <Button variant="outline" className="w-full" size="sm">
                    <Navigation className="h-3.5 w-3.5 mr-2" />
                    Open in Maps
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Car details */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Car</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                    <Car className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{task.car.color} {task.car.make} {task.car.model}</p>
                    <p className="text-xs text-muted-foreground">{task.car.year} · {task.car.licensePlate}</p>
                  </div>
                </div>
                {task.car.details && (
                  <p className="text-xs text-muted-foreground mt-2">{task.car.details}</p>
                )}
              </CardContent>
            </Card>

            {isMissed && task.missReason && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-4">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Wash Missed
                  </p>
                  <p className="text-sm">{task.missReason}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col gap-2">
          {!isCompleted && !isMissed && (
            <>
              {!isInProgress && (
                <Button className="w-full brand-gradient text-white" onClick={onStartWash}>
                  Start Wash
                </Button>
              )}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Wash
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={onNotAvailable}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Car Not Available
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= UPLOAD PHOTOS MODAL =============
function UploadPhotosModal({ task, onClose, onSuccess }: any) {
  const [photos, setPhotos] = useState<Record<number, string>>({}); // position -> dataURL
  const [loading, setLoading] = useState(false);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  function handleFileSelect(position: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((prev) => ({ ...prev, [position]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(position: number) {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[position];
      return next;
    });
  }

  async function handleSubmit() {
    const required = [1, 2, 3, 4];
    for (const pos of required) {
      if (!photos[pos]) {
        toast.error(`Photo ${pos} is required`);
        return;
      }
    }

    setLoading(true);
    try {
      const photosArray = Object.entries(photos).map(([pos, data]) => ({
        position: parseInt(pos),
        imageData: data,
        fileName: `wash-photo-${pos}.jpg`,
      }));
      const res = await authFetch(`/api/cleaner/task/${task.id}?action=complete`, {
        method: "PATCH",
        body: JSON.stringify({ photos: photosArray }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to complete wash");
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

  const slots = [1, 2, 3, 4, 5];
  const requiredCount = 4;
  const uploadedCount = Object.keys(photos).length;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Wash Photos</DialogTitle>
          <DialogDescription>
            Take or upload at least 4 photos to complete the wash. Photo 5 is optional.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 pb-2">
            {/* Progress */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Camera className="h-4 w-4 text-brand" />
              <span className="text-xs flex-1">
                {uploadedCount}/{requiredCount} required photos uploaded
              </span>
              {uploadedCount >= requiredCount && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </div>

            {/* Photo slots */}
            <div className="grid grid-cols-2 gap-3">
              {slots.map((pos) => {
                const isRequired = pos <= 4;
                const hasPhoto = !!photos[pos];
                return (
                  <div key={pos} className="space-y-1">
                    <div className="relative aspect-square rounded-xl border-2 border-dashed overflow-hidden bg-muted/30">
                      {hasPhoto ? (
                        <>
                          <img src={photos[pos]} alt={`Photo ${pos}`} className="h-full w-full object-cover" />
                          <button
                            onClick={() => removePhoto(pos)}
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => fileInputs.current[pos]?.click()}
                          className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Upload className="h-5 w-5 mb-1" />
                          <span className="text-[10px] font-medium">Upload</span>
                        </button>
                      )}
                      <input
                        ref={(el) => { fileInputs.current[pos] = el; }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileSelect(pos, e)}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px]">
                      <span className="font-medium">Photo {pos}</span>
                      {isRequired ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-muted-foreground">(optional)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || uploadedCount < requiredCount}
            className="brand-gradient text-white"
          >
            {loading ? "Completing..." : "Complete Wash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= CAR NOT AVAILABLE MODAL =============
function CarNotAvailableModal({ task, onClose, onSuccess }: any) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await authFetch(`/api/cleaner/task/${task.id}?action=car-not-available`, {
        method: "PATCH",
        body: JSON.stringify({ reason: reason || "Car not available at location" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      onSuccess();
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Mark Car Not Available?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the wash as MISSED and notify the admin team. The customer will be contacted to reschedule.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
          <textarea
            className="w-full mt-1 p-2 rounded-lg border bg-background text-sm resize-none"
            rows={3}
            placeholder="e.g., Customer's car was not at the location"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Reporting..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
