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
import { Separator } from "@/components/ui/separator";
import {
  Search, Plus, Eye, Pencil, Trash2, Phone, Mail, MapPin, Car,
  CreditCard, Calendar, Download, Crown, UserPlus,
} from "lucide-react";
import { authFetch, exportUrl } from "@/lib/auth-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate, getInitials } from "@/lib/format";

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (planFilter !== "all") params.set("planId", planFilter);
      const res = await authFetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    authFetch("/api/admin/plans").then(async (res) => {
      const data = await res.json();
      setPlans(data.plans || []);
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
    const res = await authFetch(`/api/admin/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Customer deleted");
      load();
    } else {
      toast.error("Failed to delete");
    }
  }

  function handleExport() {
    window.open(exportUrl("customers"), "_blank");
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="All plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button size="sm" className="brand-gradient text-white" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customers table (desktop) */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted text-xs">{getInitials(c.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{c.user.name}</p>
                          <p className="text-xs text-muted-foreground">{c.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.user.phone}</TableCell>
                    <TableCell className="text-sm">
                      {c.cars.length > 0 ? (
                        <span>{c.cars[0].make} {c.cars[0].model}
                          {c.cars.length > 1 && <span className="text-muted-foreground"> +{c.cars.length - 1}</span>}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {c.activePlan ? (
                        <Badge variant="secondary" className="text-xs">{c.activePlan.name}</Badge>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{c.remainingWashes}</span>
                      <span className="text-muted-foreground"> / {c.activePlan?.totalWashes || 0}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(c)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Customers cards (mobile) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading…</p>
        ) : customers.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No customers found</CardContent></Card>
        ) : (
          customers.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-premium transition-all" onClick={() => setSelected(c)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-xs">{getInitials(c.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.user.phone}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <Badge variant="secondary">{c.activePlan?.name || "No plan"}</Badge>
                  <span className="text-muted-foreground">{c.remainingWashes}/{c.activePlan?.totalWashes || 0} washes</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Customer detail drawer */}
      {selected && (
        <CustomerDetailDrawer
          customer={selected}
          plans={plans}
          onClose={() => setSelected(null)}
          onRefresh={load}
        />
      )}

      {/* Add customer modal */}
      {showAdd && (
        <AddCustomerModal
          plans={plans}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            load();
            toast.success("Customer created");
          }}
        />
      )}

      {/* Edit customer modal */}
      {showEdit && (
        <EditCustomerModal
          customer={showEdit}
          plans={plans}
          onClose={() => setShowEdit(null)}
          onSuccess={() => {
            setShowEdit(null);
            load();
            toast.success("Customer updated");
          }}
        />
      )}
    </div>
  );
}

// ============= Detail Drawer =============
function CustomerDetailDrawer({ customer, plans, onClose, onRefresh }: any) {
  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePlan, setShowChangePlan] = useState(false);

  useEffect(() => {
    authFetch(`/api/admin/customers/${customer.id}`).then(async (res) => {
      const data = await res.json();
      setFullData(data.customer);
      setLoading(false);
    });
  }, [customer.id]);

  async function addWashes(amount: number) {
    const res = await authFetch(`/api/admin/customers/${customer.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "add-washes", addWashes: amount }),
    });
    if (res.ok) {
      toast.success(`Added ${amount} washes`);
      // Reload
      const r2 = await authFetch(`/api/admin/customers/${customer.id}`);
      setFullData((await r2.json()).customer);
      onRefresh();
    }
  }

  if (loading || !fullData) {
    return (
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="brand-gradient text-white">
                {getInitials(fullData.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>{fullData.user.name}</p>
              <p className="text-sm font-normal text-muted-foreground">{fullData.user.email}</p>
            </div>
          </SheetTitle>
          <SheetDescription>Customer profile and history</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Status & plan */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={fullData.status} />
            {fullData.activePlan && <Badge variant="secondary">{fullData.activePlan.name}</Badge>}
            <Badge variant="outline">{fullData.remainingWashes}/{fullData.activePlan?.totalWashes || 0} washes</Badge>
          </div>

          {/* Personal info */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Information</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{fullData.user.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="flex-1">{fullData.user.address || "Not set"}</span>
              </div>
            </div>
          </div>

          {/* Cars */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cars ({fullData.cars.length})</p>
            <div className="space-y-2">
              {fullData.cars.map((car: any) => (
                <div key={car.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{car.color} {car.make} {car.model}</p>
                    <p className="text-xs text-muted-foreground">{car.year} · {car.licensePlate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subscription</p>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{fullData.activePlan?.name || "No plan"}</span>
                <span className="text-sm font-semibold">{formatCurrency(fullData.activePlan?.monthlyPrice || 0)}/mo</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Renews: {fullData.subscriptionEnd ? formatDate(fullData.subscriptionEnd) : "—"}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setShowChangePlan(true)}>
                  <Crown className="h-3 w-3 mr-1" />
                  Change Plan
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addWashes(1)}>+1 Wash</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addWashes(5)}>+5 Washes</Button>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment History</p>
            <div className="space-y-2">
              {fullData.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{p.planName} · {p.period}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(p.dueDate)} {p.paidAt && `· Paid: ${formatDate(p.paidAt)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Upcoming Bookings ({fullData.upcomingBookings?.length || 0})
            </p>
            <div className="space-y-2">
              {fullData.upcomingBookings?.map((b: any) => (
                <div key={b.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{formatDate(b.date)} · {b.timeSlot}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.car.make} {b.car.model} · {b.cleaner?.user.name || "Unassigned"}
                  </p>
                </div>
              ))}
              {(!fullData.upcomingBookings || fullData.upcomingBookings.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-3">No upcoming bookings</p>
              )}
            </div>
          </div>

          {/* Past washes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Past Washes ({fullData.pastBookings?.length || 0})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-premium">
              {fullData.pastBookings?.map((b: any) => (
                <div key={b.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{formatDate(b.date)} · {b.timeSlot}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.car.make} {b.car.model} · {b.cleaner?.user.name || "Unassigned"}
                  </p>
                </div>
              ))}
              {(!fullData.pastBookings || fullData.pastBookings.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-3">No past washes</p>
              )}
            </div>
          </div>
        </div>

        {showChangePlan && (
          <ChangePlanModal
            customer={fullData}
            plans={plans}
            onClose={() => setShowChangePlan(false)}
            onSuccess={() => {
              setShowChangePlan(false);
              authFetch(`/api/admin/customers/${customer.id}`).then(async (res) => setFullData((await res.json()).customer));
              onRefresh();
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ChangePlanModal({ customer, plans, onClose, onSuccess }: any) {
  const [planId, setPlanId] = useState(customer.activePlanId);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const res = await authFetch(`/api/admin/customers/${customer.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "change-plan", planId }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Plan changed");
      onSuccess();
    } else {
      toast.error("Failed");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>Select a new plan for {customer.user.name}</DialogDescription>
        </DialogHeader>
        <Select value={planId || ""} onValueChange={setPlanId}>
          <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
          <SelectContent>
            {plans.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — {formatCurrency(p.monthlyPrice)}/mo · {p.totalWashes} washes
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">
            {loading ? "Saving..." : "Change Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= Add Customer Modal =============
function AddCustomerModal({ plans, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "",
    planId: plans[0]?.id || "", make: "", model: "", year: "", licensePlate: "", color: "",
    bookingDate: "", bookingSlot: "",
  });
  const [loading, setLoading] = useState(false);
  const SLOTS = ["08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00"];

  async function handleSubmit() {
    if (!form.name || !form.email || !form.phone || !form.planId) {
      toast.error("Fill required fields");
      return;
    }
    setLoading(true);
    const body: any = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      planId: form.planId,
      cars: form.make ? [{
        make: form.make, model: form.model, year: form.year || new Date().getFullYear(),
        licensePlate: form.licensePlate, color: form.color,
      }] : [],
    };
    if (form.bookingDate) {
      body.initialBooking = { date: form.bookingDate, timeSlot: form.bookingSlot || SLOTS[0] };
    }
    const res = await authFetch("/api/admin/customers", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
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
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>Create a new customer account. Default password: customer123</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Plan *</Label>
              <Select value={form.planId} onValueChange={(v) => setForm({ ...form, planId: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9" />
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase">Car Details (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Make</Label>
              <Input placeholder="Honda" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Model</Label>
              <Input placeholder="City" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Year</Label>
              <Input placeholder="2024" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">License Plate</Label>
              <Input value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <Input placeholder="White" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9" />
            </div>
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase">Initial Booking (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Time Slot</Label>
              <Select value={form.bookingSlot} onValueChange={(v) => setForm({ ...form, bookingSlot: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select slot" /></SelectTrigger>
                <SelectContent>
                  {SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">
            {loading ? "Creating..." : "Create Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============= Edit Customer Modal =============
function EditCustomerModal({ customer, plans, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    name: customer.user.name,
    phone: customer.user.phone,
    address: customer.user.address || "",
    status: customer.status,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const res = await authFetch(`/api/admin/customers/${customer.id}`, {
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
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update personal information and status</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
