"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authFetch } from "@/lib/auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ArrowLeft, MapPin, Phone, Car, Navigation,
  AlertTriangle, CheckCircle2, Camera, X, Upload
} from "lucide-react";
import { getInitials } from "@/lib/format";
import { IdrottLogo } from "@/components/shared/idrott-logo";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function TaskDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for sub-views
  const [showUpload, setShowUpload] = useState(false);
  const [showNotAvailable, setShowNotAvailable] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role !== "CLEANER") {
      router.replace(`/${user.role.toLowerCase()}`);
      return;
    }

    loadTask();
  }, [user, router, params.id]);

  async function loadTask() {
    setLoading(true);
    try {
      const res = await authFetch(`/api/cleaner/task/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load task");
        router.push("/cleaner");
        return;
      }
      setTask(data.task);
    } catch (e) {
      console.error(e);
      toast.error("Network error");
      router.push("/cleaner");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartWash() {
    try {
      const res = await authFetch(`/api/cleaner/task/${task.id}?action=start`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("Wash started!");
      loadTask();
    } catch {
      toast.error("Failed to start wash");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-r-transparent" />
      </div>
    );
  }

  if (!task) return null;

  const isInProgress = task.status === "IN_PROGRESS";
  const isCompleted = task.status === "COMPLETED";
  const isMissed = task.status === "MISSED";

  return (
    <div className="mobile-shell flex flex-col bg-muted/30 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/cleaner")} className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate">Task Details</h1>
            <p className="text-xs text-muted-foreground truncate">
              {new Date(task.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {task.timeSlot}
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-5 max-w-md mx-auto">
          
          {/* Customer info */}
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Customer</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="brand-gradient text-white text-sm">
                    {getInitials(task.customer.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">{task.customer.user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{task.customer.user.phone}</p>
                </div>
                <a href={`tel:${task.customer.user.phone}`}>
                  <Button size="icon" variant="outline" className="h-10 w-10 shrink-0 border-brand/20 text-brand hover:bg-brand/10">
                    <Phone className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Address with navigation */}
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Location</p>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-brand/10 rounded-full text-brand shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <p className="text-sm flex-1 font-medium leading-relaxed">{task.address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block"
              >
                <Button variant="outline" className="w-full text-brand border-brand/30 hover:bg-brand/5">
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate to Location
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Car details */}
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Vehicle</p>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-muted/50 border flex items-center justify-center shrink-0">
                  <Car className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-base">{task.car.color} {task.car.make} {task.car.model}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium">{task.car.licensePlate}</span>
                    <span className="text-xs text-muted-foreground">{task.car.year}</span>
                  </div>
                </div>
              </div>
              {task.car.details && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground italic">"{task.car.details}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isMissed && task.missReason && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-1 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Wash Missed
                </p>
                <p className="text-sm text-red-700/80 dark:text-red-300">{task.missReason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Action Footer */}
      {!isCompleted && !isMissed && (
        <div className="p-4 border-t bg-background sticky bottom-0 z-20">
          <div className="max-w-md mx-auto space-y-3">
            {!isInProgress && (
              <Button size="lg" className="w-full brand-gradient text-white shadow-premium" onClick={handleStartWash}>
                Start Wash
              </Button>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => setShowNotAvailable(true)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Not Available
              </Button>

              <Button 
                size="lg"
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" 
                onClick={() => setShowUpload(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals integrated here */}
      {showUpload && (
        <UploadPhotosModal 
          task={task} 
          onClose={() => setShowUpload(false)} 
          onSuccess={() => {
            setShowUpload(false);
            toast.success("Wash completed!");
            router.push("/cleaner");
          }} 
        />
      )}

      {showNotAvailable && (
        <CarNotAvailableModal
          task={task}
          onClose={() => setShowNotAvailable(false)}
          onSuccess={() => {
            setShowNotAvailable(false);
            toast.success("Reported as car not available");
            router.push("/cleaner");
          }}
        />
      )}
    </div>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg tracking-tight">Upload Photos</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Take or upload at least 4 photos</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-5">
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 border border-muted">
              <div className="p-2 bg-background rounded-lg shadow-sm shrink-0">
                <Camera className="h-5 w-5 text-brand" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Upload Progress</p>
                <p className="text-xs text-muted-foreground">{uploadedCount} of {requiredCount} required</p>
              </div>
              {uploadedCount >= requiredCount && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
            </div>

            {/* Photo slots */}
            <div className="grid grid-cols-2 gap-3">
              {slots.map((pos) => {
                const isRequired = pos <= 4;
                const hasPhoto = !!photos[pos];
                return (
                  <div key={pos} className="space-y-1.5">
                    <div className="relative aspect-square rounded-xl border-2 border-dashed overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors">
                      {hasPhoto ? (
                        <>
                          <img src={photos[pos]} alt={`Photo ${pos}`} className="h-full w-full object-cover" />
                          <button
                            onClick={() => removePhoto(pos)}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur-sm"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => fileInputs.current[pos]?.click()}
                          className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <div className="h-10 w-10 rounded-full bg-background shadow-sm flex items-center justify-center mb-2">
                            <Upload className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium">Upload</span>
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
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <span className="font-medium text-foreground">Photo {pos}</span>
                      {isRequired ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-muted-foreground">(opt)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={loading || uploadedCount < requiredCount}
            className="w-full brand-gradient text-white shadow-premium"
          >
            {loading ? "Completing..." : "Complete Wash"}
          </Button>
        </div>
      </div>
    </div>
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
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Car Not Available
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the task as MISSED and notify the admin team. The customer will be contacted to reschedule.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Reason (Optional)</label>
          <textarea
            className="w-full p-3 rounded-xl border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
            rows={3}
            placeholder="e.g., Customer's car was not at the location"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Submitting..." : "Confirm Missed Wash"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
