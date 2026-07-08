"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Search, Plus, Eye, Pencil, Trash2, Download, MapPin, Phone, Car, UserPlus } from "lucide-react";
import { authFetch, exportUrl } from "@/lib/auth-store";
import { apiCache } from "@/lib/api-cache";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, getInitials } from "@/lib/format";

export function AdminCleanersPage() {
  const [cleaners, setCleaners] = useState<any[]>(() => apiCache.getStale<any>("admin:cleaners:")?.cleaners || []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!apiCache.getStale("admin:cleaners:"));
  const [selected, setSelected] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const cacheKey = `admin:cleaners:${params}`;
    const cached = apiCache.getStale<any>(cacheKey);
    if (cached && !apiCache.isStale(cacheKey)) {
      setCleaners(cached.cleaners || []);
      setLoading(false);
      return;
    }
    if (cached) { setCleaners(cached.cleaners || []); setLoading(false); }
    else { setLoading(true); }
    try {
      const res = await authFetch(`/api/admin/cleaners?${params}`);
      const data = await res.json();
      apiCache.set(cacheKey, data);
      setCleaners(data.cleaners || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this cleaner?")) return;
    const res = await authFetch(`/api/admin/cleaners/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Cleaner removed"); apiCache.invalidatePrefix("admin:cleaners:"); load(); }
    else toast.error("Failed");
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cleaners…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(exportUrl("cleaners"), "_blank")}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="brand-gradient text-white" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Cleaner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading…</p>
        ) : cleaners.length === 0 ? (
          <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No cleaners found</CardContent></Card>
        ) : (
          cleaners.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-premium transition-all" onClick={() => setSelected(c)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="brand-gradient text-white">{getInitials(c.user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{c.user.name}</p>
                      <p className="text-xs text-muted-foreground">{c.zone || "All zones"}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div>
                    <p className="text-lg font-semibold">{c.todaysTasks}</p>
                    <p className="text-[10px] text-muted-foreground">Today</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{c.totalCompleted}</p>
                    <p className="text-[10px] text-muted-foreground">Done</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold flex items-center justify-center gap-0.5">
                      <Star className="h-3 w-3" style={{ fill: "var(--gold)", color: "var(--gold)" }} />
                      {c.rating.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selected && <CleanerDetailDrawer cleaner={selected} onClose={() => setSelected(null)} onRefresh={load} />}
      {showAdd && <AddCleanerModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function CleanerDetailDrawer({ cleaner, onClose, onRefresh }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    authFetch(`/api/admin/cleaners/${cleaner.id}`).then(async (res) => setFullData((await res.json()).cleaner));
  }, [cleaner.id]);

  if (!fullData) return <Sheet open onOpenChange={(o) => !o && onClose()}><SheetContent><div className="p-8 text-center text-muted-foreground">Loading…</div></SheetContent></Sheet>;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0 h-full">
        <div className="p-6 pb-4 border-b">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="brand-gradient text-white">{getInitials(fullData.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p>{fullData.user.name}</p>
                <p className="text-sm font-normal text-muted-foreground">{fullData.user.email}</p>
              </div>
            </SheetTitle>
            <SheetDescription>Cleaner profile & performance</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={fullData.status} />
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" style={{ fill: "var(--gold)", color: "var(--gold)" }} />
              {fullData.rating.toFixed(1)}
            </Badge>
            <Badge variant="outline">{fullData.zone || "All zones"}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xl font-semibold">{fullData.totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Total completed</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xl font-semibold">{fullData.totalAssigned}</p>
              <p className="text-xs text-muted-foreground">Total assigned</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xl font-semibold">{fullData.analytics?.last30Days?.completionRate || 0}%</p>
              <p className="text-xs text-muted-foreground">30-day rate</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Information</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" />{fullData.user.phone}</div>
              <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><span className="flex-1">{fullData.user.address || "Not set"}</span></div>
              <div className="flex items-center gap-3"><Car className="h-4 w-4 text-muted-foreground" />{fullData.vehicleNumber || "Not assigned"}</div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Bookings</p>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-premium">
              {fullData.bookings?.slice(0, 10).map((b: any) => (
                <div key={b.id} className="p-2 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{b.customer.user.name}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{formatDate(b.date)} · {b.timeSlot}</p>
                  
                  {b.photos && b.photos.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-premium">
                      {b.photos.sort((p1: any, p2: any) => p1.position - p2.position).map((photo: any) => (
                        <div key={photo.id} className="h-14 w-14 shrink-0 rounded-md overflow-hidden border bg-muted">
                          <img 
                            src={photo.imageData} 
                            alt="Wash" 
                            className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={() => window.open(photo.imageData, '_blank')} 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Attendance (last 14 days)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-premium">
              {fullData.attendance?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <span className="text-sm">{formatDate(a.date)}</span>
                  <div className="flex items-center gap-2">
                    {a.checkInTime && <span className="text-xs text-muted-foreground">In: {new Date(a.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
                    {a.checkOutTime && <span className="text-xs text-muted-foreground">Out: {new Date(a.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
                    {a.totalHours && <Badge variant="secondary" className="text-xs">{a.totalHours}h</Badge>}
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" variant="outline" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Cleaner
          </Button>
        </div>

        {showEdit && <EditCleanerModal cleaner={fullData} onClose={() => setShowEdit(false)} onSuccess={() => {
          setShowEdit(false);
          authFetch(`/api/admin/cleaners/${cleaner.id}`).then(async (res) => setFullData((await res.json()).cleaner));
          onRefresh();
        }} />}
      </SheetContent>
    </Sheet>
  );
}

function AddCleanerModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", zone: "", vehicleNumber: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Fill required fields");
      return;
    }
    setLoading(true);
    const res = await authFetch("/api/admin/cleaners", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) onSuccess();
    else {
      const err = await res.json();
      toast.error(err.error || "Failed");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Add New Cleaner</DialogTitle>
          <DialogDescription>Default password: cleaner123</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="text-xs">Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Zone</Label><Input placeholder="Andheri" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></div>
            <div><Label className="text-xs">Vehicle Number</Label><Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">{loading ? "Creating..." : "Create Cleaner"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCleanerModal({ cleaner, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    name: cleaner.user.name,
    phone: cleaner.user.phone,
    address: cleaner.user.address || "",
    status: cleaner.status,
    zone: cleaner.zone || "",
    vehicleNumber: cleaner.vehicleNumber || "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const res = await authFetch(`/api/admin/cleaners/${cleaner.id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) onSuccess();
    else toast.error("Failed");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Cleaner</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label className="text-xs">Zone</Label><Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} /></div>
          <div><Label className="text-xs">Vehicle Number</Label><Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">{loading ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
