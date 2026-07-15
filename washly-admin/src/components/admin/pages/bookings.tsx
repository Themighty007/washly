"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Download, Calendar, Clock, MapPin, User, Car, Star, RefreshCw } from "lucide-react";
import { authFetch, exportUrl } from "@/lib/auth-store";
import { apiCache } from "@/lib/api-cache";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, TIME_SLOTS } from "@/lib/format";

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>(() => apiCache.getStale<any>("admin:bookings:all")?.bookings || []);
  const [loading, setLoading] = useState(!apiCache.getStale("admin:bookings:all"));
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const cacheKey = `admin:bookings:${statusFilter}`;
    const cached = apiCache.getStale<any>(cacheKey);
    if (cached && !apiCache.isStale(cacheKey)) {
      setBookings(cached.bookings || []);
      setLoading(false);
      return;
    }
    if (cached) { setBookings(cached.bookings || []); setLoading(false); }
    else { setLoading(true); }
    try {
      const res = await authFetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      apiCache.set(cacheKey, data);
      setBookings(data.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="MISSED">Missed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(exportUrl("wash-history"), "_blank")}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="brand-gradient text-white" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Booking
          </Button>
        </div>
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Cleaner</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Photos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : bookings.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bookings</TableCell></TableRow>
              ) : (
                bookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/50">
                    <TableCell><p className="text-sm font-medium">{b.customer.user.name}</p></TableCell>
                    <TableCell className="text-sm">{b.car.make} {b.car.model}<p className="text-xs text-muted-foreground">{b.car.licensePlate}</p></TableCell>
                    <TableCell className="text-sm">{b.cleaner?.user.name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell className="text-sm"><p>{formatDate(b.date)}</p><p className="text-xs text-muted-foreground">{b.timeSlot}</p></TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell>
                      {b.photos && b.photos.length > 0 ? (
                        <div className="flex gap-1 flex-wrap w-max max-w-[120px]">
                          {b.photos.sort((p1: any, p2: any) => p1.position - p2.position).map((photo: any) => (
                            <div key={photo.id} className="h-8 w-8 rounded overflow-hidden cursor-pointer hover:opacity-80 border bg-muted" onClick={() => window.open(photo.imageData, '_blank')}>
                              <img src={photo.imageData} alt="Wash" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="md:hidden space-y-3">
        {loading ? <p className="text-center text-muted-foreground">Loading…</p> :
         bookings.length === 0 ? <Card><CardContent className="p-6 text-center text-muted-foreground">No bookings</CardContent></Card> :
         bookings.map((b) => (
           <Card key={b.id}>
             <CardContent className="p-4">
               <div className="flex items-start justify-between mb-2">
                 <div>
                   <p className="font-medium text-sm">{b.customer.user.name}</p>
                   <p className="text-xs text-muted-foreground">{b.car.make} {b.car.model}</p>
                 </div>
                 <StatusBadge status={b.status} />
               </div>
               <div className="text-xs text-muted-foreground space-y-0.5">
                 <p>{formatDate(b.date)} · {b.timeSlot}</p>
                 <p>Cleaner: {b.cleaner?.user.name || "Unassigned"}</p>
               </div>
               
               {b.photos && b.photos.length > 0 && (
                 <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-premium">
                   {b.photos.sort((p1: any, p2: any) => p1.position - p2.position).map((photo: any) => (
                     <div key={photo.id} className="h-12 w-12 shrink-0 rounded-md overflow-hidden border bg-muted">
                       <img src={photo.imageData} alt="Wash" className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(photo.imageData, '_blank')} />
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         ))
        }
      </div>

      {showCreate && <CreateBookingModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function CreateBookingModal({ onClose, onSuccess }: any) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [availableCleaners, setAvailableCleaners] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedCar, setSelectedCar] = useState("");
  const [selectedCleaner, setSelectedCleaner] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authFetch("/api/admin/customers").then(async (res) => setCustomers((await res.json()).customers || []));
  }, []);

  // Derive cars from selected customer (no effect needed)
  const cars = useMemo(() => {
    const c = customers.find((c) => c.id === selectedCustomer);
    return c?.cars || [];
  }, [selectedCustomer, customers]);

  // Reset selected car when customer changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCar("");
  }, [selectedCustomer]);

  // Fetch available cleaners when date + timeSlot change
  useEffect(() => {
    let cancelled = false;
    if (date && timeSlot) {
      authFetch(`/api/admin/bookings/available-cleaners?date=${date}&timeSlot=${encodeURIComponent(timeSlot)}`).then(async (res) => {
        if (cancelled) return;
        const data = await res.json();
        setAvailableCleaners(data.available || []);
        setSelectedCleaner("");
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableCleaners([]);
    }
    return () => { cancelled = true; };
  }, [date, timeSlot]);

  async function handleSubmit() {
    if (!selectedCustomer || !selectedCar || !selectedCleaner || !date || !timeSlot) {
      toast.error("Fill all required fields");
      return;
    }
    setLoading(true);
    const customer = customers.find((c) => c.id === selectedCustomer);
    const res = await authFetch("/api/admin/bookings", {
      method: "POST",
      body: JSON.stringify({
        customerId: selectedCustomer,
        carId: selectedCar,
        cleanerId: selectedCleaner,
        date,
        timeSlot,
        address: customer?.user.address || "",
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Booking created & cleaner assigned");
      onSuccess();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Create New Booking</DialogTitle>
          <DialogDescription>Admin assigns a cleaner directly. System shows only available cleaners.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Customer *</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.user.name} ({c.user.phone})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer && cars.length > 0 && (
            <div>
              <Label className="text-xs">Car *</Label>
              <Select value={selectedCar} onValueChange={setSelectedCar}>
                <SelectTrigger><SelectValue placeholder="Select car" /></SelectTrigger>
                <SelectContent>
                  {cars.map((car) => <SelectItem key={car.id} value={car.id}>{car.color} {car.make} {car.model} · {car.licensePlate}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Time Slot *</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {date && timeSlot && (
            <div>
              <Label className="text-xs">Available Cleaners * ({availableCleaners.length} available)</Label>
              {availableCleaners.length === 0 ? (
                <p className="text-xs text-amber-600 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  No cleaners available at this time slot. Please pick another slot.
                </p>
              ) : (
                <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
                  <SelectTrigger><SelectValue placeholder="Select cleaner" /></SelectTrigger>
                  <SelectContent>
                    {availableCleaners.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.user.name} · ⭐{c.rating.toFixed(1)} ({c.totalCompleted} done)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedCustomer || !selectedCar || !selectedCleaner} className="brand-gradient text-white">
            {loading ? "Creating..." : "Create & Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
