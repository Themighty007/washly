"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Phone, RefreshCw, Download, Calendar, Clock } from "lucide-react";
import { authFetch, exportUrl } from "@/lib/auth-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, TIME_SLOTS } from "@/lib/format";

export function AdminPendingWashesPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedule, setReschedule] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/pending-washes");
      const data = await res.json();
      setPending(data.pendingWashes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {pending.length} pending washes need attention
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Includes missed washes, car-not-available cases, and failed washes.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => window.open(exportUrl("pending"), "_blank")}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export
        </Button>
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Cleaner</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Original Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : pending.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending washes</TableCell></TableRow>
              ) : (
                pending.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell><p className="text-sm font-medium">{b.customer.user.name}</p><p className="text-xs text-muted-foreground">{b.customer.user.phone}</p></TableCell>
                    <TableCell className="text-sm">{b.cleaner?.user.name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">{b.car.make} {b.car.model}</TableCell>
                    <TableCell className="text-sm">{formatDate(b.date)}<p className="text-xs text-muted-foreground">{b.timeSlot}</p></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs">{b.missReason || "Pending"}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <a href={`tel:${b.customer.user.phone}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-3.5 w-3.5" /></Button>
                        </a>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setReschedule(b)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reschedule
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="md:hidden space-y-3">
        {pending.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{b.customer.user.name}</p>
                  <p className="text-xs text-muted-foreground">{b.car.make} {b.car.model}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-2">Originally: {formatDate(b.date)} · {b.timeSlot}</p>
              {b.missReason && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{b.missReason}</p>}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setReschedule(b)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reschedule / Reassign
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {reschedule && <RescheduleModal booking={reschedule} onClose={() => setReschedule(null)} onSuccess={() => { setReschedule(null); load(); }} />}
    </div>
  );
}

function RescheduleModal({ booking, onClose, onSuccess }: any) {
  const [action, setAction] = useState<"reschedule" | "change-cleaner">("reschedule");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [cleanerId, setCleanerId] = useState("");
  const [availableCleaners, setAvailableCleaners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (date && timeSlot) {
      authFetch(`/api/admin/bookings/available-cleaners?date=${date}&timeSlot=${encodeURIComponent(timeSlot)}`).then(async (res) => {
        setAvailableCleaners((await res.json()).available || []);
      });
    }
  }, [date, timeSlot]);

  async function handleSubmit() {
    setLoading(true);
    const body: any = { id: booking.id, action };
    if (date) body.date = date;
    if (timeSlot) body.timeSlot = timeSlot;
    if (action === "change-cleaner" && cleanerId) body.cleanerId = cleanerId;

    const res = await authFetch("/api/admin/bookings", { method: "PATCH", body: JSON.stringify(body) });
    setLoading(false);
    if (res.ok) {
      toast.success("Booking updated");
      onSuccess();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Wash</DialogTitle>
          <DialogDescription>
            Update slot for {booking.customer.user.name}'s {booking.car.make} {booking.car.model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex gap-2">
            <Button variant={action === "reschedule" ? "default" : "outline"} size="sm" className={action === "reschedule" ? "brand-gradient text-white" : ""} onClick={() => setAction("reschedule")}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reschedule only
            </Button>
            <Button variant={action === "change-cleaner" ? "default" : "outline"} size="sm" className={action === "change-cleaner" ? "brand-gradient text-white" : ""} onClick={() => setAction("change-cleaner")}>
              Change cleaner
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">New Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">New Time Slot</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {action === "change-cleaner" && date && timeSlot && (
            <div>
              <Label className="text-xs">New Cleaner ({availableCleaners.length} available)</Label>
              <Select value={cleanerId} onValueChange={setCleanerId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {availableCleaners.map((c) => <SelectItem key={c.id} value={c.id}>{c.user.name} · ⭐{c.rating.toFixed(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">
            {loading ? "Updating..." : "Update Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
