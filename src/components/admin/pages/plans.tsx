"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Crown, Plus, Pencil, Trash2, Check } from "lucide-react";
import { authFetch } from "@/lib/auth-store";
import { formatCurrency } from "@/lib/format";
import { apiCache } from "@/lib/api-cache";

export function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>(() => apiCache.getStale<any>("admin:plans")?.plans || []);
  const [loading, setLoading] = useState(!apiCache.getStale("admin:plans"));
  const [showAdd, setShowAdd] = useState(false);
  const [editPlan, setEditPlan] = useState<any | null>(null);

  const load = useCallback(async () => {
    const cacheKey = "admin:plans";
    const cached = apiCache.getStale<any>(cacheKey);
    if (cached && !apiCache.isStale(cacheKey)) {
      setPlans(cached.plans || []);
      setLoading(false);
      return;
    }
    if (cached) {
      setPlans(cached.plans || []);
      setLoading(false);
    }
    try {
      const res = await authFetch("/api/admin/plans");
      const data = await res.json();
      apiCache.set(cacheKey, data);
      setPlans(data.plans || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this plan?")) return;
    await authFetch(`/api/admin/plans?id=${id}`, { method: "DELETE" });
    toast.success("Plan deleted");
    load();
  }

  if (loading && plans.length === 0) return <div className="text-muted-foreground p-5">Loading plans…</div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" className="brand-gradient text-white" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const features = JSON.parse(plan.features);
          return (
            <Card key={plan.id} className={`relative ${plan.popular ? "border-2" : ""}`} style={plan.popular ? { borderColor: "var(--gold)" } : undefined}>
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: "var(--gold)" }}>
                  POPULAR
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className={`h-4 w-4 ${plan.popular ? "text-gold" : "text-brand"}`} style={plan.popular ? { color: "var(--gold)" } : undefined} />
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPlan(plan)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(plan.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-semibold">{formatCurrency(plan.monthlyPrice)}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>

                <Badge variant="secondary" className="mb-3">{plan.totalWashes} washes/month</Badge>

                <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>

                <ul className="space-y-1.5 mb-3">
                  {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 text-brand mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Customers</span>
                  <span className="font-medium">{plan._count?.customersWithPlan || 0}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAdd && <PlanFormModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load(); }} />}
      {editPlan && <PlanFormModal plan={editPlan} onClose={() => setEditPlan(null)} onSuccess={() => { setEditPlan(null); load(); }} />}
    </div>
  );
}

function PlanFormModal({ plan, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    name: plan?.name || "",
    monthlyPrice: plan?.monthlyPrice?.toString() || "",
    totalWashes: plan?.totalWashes?.toString() || "",
    description: plan?.description || "",
    features: plan ? JSON.parse(plan.features).join("\n") : "",
    popular: plan?.popular || false,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const body = {
      name: form.name,
      monthlyPrice: parseFloat(form.monthlyPrice),
      totalWashes: parseInt(form.totalWashes),
      description: form.description,
      features: form.features.split("\n").map((s: string) => s.trim()).filter(Boolean),
      popular: form.popular,
    };
    const url = plan ? "/api/admin/plans" : "/api/admin/plans";
    const method = plan ? "PATCH" : "POST";
    const finalBody = plan ? { ...body, id: plan.id } : body;
    const res = await authFetch(url, { method, body: JSON.stringify(finalBody) });
    setLoading(false);
    if (res.ok) {
      toast.success(plan ? "Plan updated" : "Plan created");
      onSuccess();
    } else toast.error("Failed");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
          <DialogDescription>Configure subscription plan details</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">Plan Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Monthly Price (₹)</Label><Input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} /></div>
            <div><Label className="text-xs">Total Washes/mo</Label><Input type="number" value={form.totalWashes} onChange={(e) => setForm({ ...form, totalWashes: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label className="text-xs">Features (one per line)</Label>
            <textarea
              className="w-full mt-1 p-2 rounded-lg border bg-background text-sm resize-none"
              rows={5}
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="8 washes per month&#10;1 car coverage&#10;Standard exterior wash"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.popular} onCheckedChange={(v) => setForm({ ...form, popular: v })} />
            <Label className="text-sm">Mark as Popular</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="brand-gradient text-white">{loading ? "Saving..." : "Save Plan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
