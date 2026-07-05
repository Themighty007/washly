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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, CreditCard, IndianRupee, AlertCircle, CheckCircle2 } from "lucide-react";
import { authFetch, exportUrl } from "@/lib/auth-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await authFetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function markPaid(id: string) {
    const res = await authFetch("/api/admin/payments", {
      method: "PATCH",
      body: JSON.stringify({ id, status: "PAID", method: "UPI" }),
    });
    if (res.ok) {
      toast.success("Marked as paid");
      load();
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Collected</span>
            </div>
            <p className="text-xl font-semibold">{formatCurrency(summary?.totalCollected || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Outstanding</span>
            </div>
            <p className="text-xl font-semibold">{formatCurrency(summary?.totalDue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <p className="text-xl font-semibold">{summary?.overdueCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Total Records</span>
            </div>
            <p className="text-xl font-semibold">{summary?.total || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => window.open(exportUrl("payments"), "_blank")}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export
        </Button>
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments</TableCell></TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><p className="text-sm font-medium">{p.customer.user.name}</p><p className="text-xs text-muted-foreground">{p.customer.user.email}</p></TableCell>
                    <TableCell><Badge variant="secondary">{p.planName}</Badge></TableCell>
                    <TableCell className="text-sm">{p.period}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-sm">{formatDate(p.dueDate)}{p.paidAt && <p className="text-xs text-muted-foreground">Paid: {formatDate(p.paidAt)}</p>}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      {(p.status === "PENDING" || p.status === "OVERDUE") && (
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => markPaid(p.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid
                        </Button>
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
        {payments.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{p.customer.user.name}</p>
                  <p className="text-xs text-muted-foreground">{p.planName} · {p.period}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="font-semibold">{formatCurrency(p.amount)}</p>
                {(p.status === "PENDING" || p.status === "OVERDUE") && (
                  <Button size="sm" variant="outline" onClick={() => markPaid(p.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
