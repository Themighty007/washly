"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, Download, TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { authFetch, exportUrl } from "@/lib/auth-store";
import { formatCurrency } from "@/lib/format";

export function AdminRevenuePage() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    authFetch("/api/admin/analytics?range=year").then(async (res) => setAnalytics(await res.json()));
  }, []);

  if (!analytics) return <div className="text-muted-foreground">Loading…</div>;

  const { cards, charts } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => window.open(exportUrl("revenue"), "_blank")}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export Revenue
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-premium">
          <CardContent className="p-5">
            <IndianRupee className="h-5 w-5 text-emerald-600 mb-2" />
            <p className="text-2xl font-semibold">{formatCurrency(cards.yearlyRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Yearly Revenue</p>
          </CardContent>
        </Card>
        <Card className="shadow-premium">
          <CardContent className="p-5">
            <TrendingUp className="h-5 w-5 text-brand mb-2" />
            <p className="text-2xl font-semibold">{formatCurrency(cards.revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Monthly Revenue</p>
          </CardContent>
        </Card>
        <Card className="shadow-premium">
          <CardContent className="p-5">
            <Users className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-2xl font-semibold">{cards.activePlans}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Subscriptions</p>
          </CardContent>
        </Card>
        <Card className="shadow-premium">
          <CardContent className="p-5">
            <Calendar className="h-5 w-5 text-purple-600 mb-2" />
            <p className="text-2xl font-semibold">{cards.completedWashes}</p>
            <p className="text-xs text-muted-foreground mt-1">Washes This Year</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={charts.revenueChart}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0 0)" }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={2.5} fill="url(#rev2)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wash Completion vs Missed (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.washCompletion}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.6 0 0)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0 0)" }} />
              <Bar dataKey="completed" fill="var(--brand)" radius={[6, 6, 0, 0]} name="Completed" />
              <Bar dataKey="missed" fill="#ef4444" radius={[6, 6, 0, 0]} name="Missed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {charts.planDistribution.map((p: any, i: number) => {
                const total = charts.planDistribution.reduce((s: number, x: any) => s + x.customers, 0);
                const pct = total > 0 ? (p.customers / total) * 100 : 0;
                const colors = ["var(--brand)", "var(--gold)", "#3b82f6"];
                return (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">{p.customers} customers ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Growth (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={charts.customerGrowth}>
                <defs>
                  <linearGradient id="cust2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.6 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.6 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0 0)" }} />
                <Area type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={2} fill="url(#cust2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
